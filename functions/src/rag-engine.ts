import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import OpenAI from 'openai';

// Types for RAG system
export interface RAGVector {
  id?: string;
  userId: string;
  contentType: 'brand_profile' | 'social_media' | 'blog_post' | 'ad_campaign' | 'saved_image' | 'brand_logo';
  contentId: string;
  embedding: number[];
  metadata: {
    industry?: string;
    style?: string;
    performance?: number;
    engagement?: number;
    platform?: string;
    tags?: string[];
    createdAt: any;
    updatedAt: any;
    version: number;
  };
  textContent: string;
  sourceCollection: string;
  sourceDocId: string;
}

export interface RAGContext {
  brandPatterns: string;
  successfulStyles: string;
  avoidPatterns: string;
  industryInsights: string;
  seasonalTrends: string;
  voicePatterns?: string;
  effectiveHashtags?: string;
  seoKeywords?: string;
  performanceInsights?: string;
}

export interface RAGRetrievalOptions {
  userId: string;
  contentType?: string;
  industry?: string;
  minPerformance?: number;
  limit?: number;
  includeIndustryPatterns?: boolean;
  timeframe?: 'recent' | 'all' | '30days' | '90days';
}

export class RAGEngine {
  private embeddingService: EmbeddingService;
  private systemConfig: any = null;
  private configLastLoaded: number = 0;
  private readonly CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private db = getFirestore();

  constructor() {
    this.embeddingService = new EmbeddingService(this);
  }

  /**
   * Load system configuration from Firestore
   */
  public async loadSystemConfig(): Promise<any> {
    try {
      const now = Date.now();
      
      // Return cached config if still valid
      if (this.systemConfig && (now - this.configLastLoaded) < this.CONFIG_CACHE_TTL) {
        return this.systemConfig;
      }

      console.log('[RAG Engine] Loading system configuration...');
      
      const settingsDoc = await this.db.doc('adminSettings/ragSystemConfig').get();
      
      if (settingsDoc.exists) {
        this.systemConfig = settingsDoc.data();
        this.configLastLoaded = now;
        console.log('[RAG Engine] System configuration loaded');
      } else {
        // Use default configuration
        this.systemConfig = {
          rateLimiting: {
            enabled: false,
            globalMaxPerHour: 1000,
            globalMaxPerDay: 10000,
            userMaxPerHour: 50,
            userMaxPerDay: 500
          },
          vectorCleanup: {
            enabled: true,
            retentionDays: 90,
            minPerformanceThreshold: 0.3
          },
          embedding: {
            model: 'text-embedding-3-small',
            dimensions: 1536,
            costPer1K: 0.02
          },
          performance: {
            similarityThreshold: 0.7,
            maxContextLength: 8000,
            cacheEnabled: true,
            cacheTTL: 3600
          }
        };
        this.configLastLoaded = now;
        console.log('[RAG Engine] Using default system configuration');
      }
      
      return this.systemConfig;
    } catch (error) {
      console.error('[RAG Engine] Error loading system config:', error);
      // Return default config on error
      return {
        rateLimiting: { enabled: false },
        performance: { similarityThreshold: 0.7, maxContextLength: 8000 },
        embedding: { model: 'text-embedding-3-small' }
      };
    }
  }

  /**
   * Check if user has exceeded rate limits using system configuration
   */
  private async checkRateLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Load system configuration
      const config = await this.loadSystemConfig();
      
      // If rate limiting is disabled globally, allow all requests
      if (!config.rateLimiting?.enabled) {
        return { allowed: true };
      }

      // Check user-specific rate limiting
      const userSettingsDoc = await this.db.doc(`users/${userId}/adminSettings/ragRateLimit`).get();
      const userSettings = userSettingsDoc.data();

      // Use user-specific settings if enabled, otherwise use global settings
      let maxPerHour, maxPerDay;
      
      if (userSettings?.enabled) {
        maxPerHour = userSettings.maxEmbeddingsPerHour || config.rateLimiting.userMaxPerHour;
        maxPerDay = userSettings.maxEmbeddingsPerDay || config.rateLimiting.userMaxPerDay;
      } else {
        maxPerHour = config.rateLimiting.userMaxPerHour || 50;
        maxPerDay = config.rateLimiting.userMaxPerDay || 500;
      }

      // Check hourly limit
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const vectorCollectionRef = this.db.collection(`users/${userId}/ragVectors`);
      const hourlyQuery = vectorCollectionRef.where('metadata.createdAt', '>=', oneHourAgo);
      const hourlyDocs = await hourlyQuery.get();

      if (hourlyDocs.size >= maxPerHour) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${hourlyDocs.size}/${maxPerHour} embeddings used in the last hour`
        };
      }

      // Check daily limit
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const dailyQuery = vectorCollectionRef.where('metadata.createdAt', '>=', oneDayAgo);
      const dailyDocs = await dailyQuery.get();

      if (dailyDocs.size >= maxPerDay) {
        return {
          allowed: false,
          reason: `Daily rate limit exceeded: ${dailyDocs.size}/${maxPerDay} embeddings used in the last 24 hours`
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('[RAG] Error checking rate limit:', error);
      // On error, allow the request to proceed (fail open)
      return { allowed: true };
    }
  }

  /**
   * Store content vector with proper Firestore paths
   */
  async storeContentVector(
    userId: string,
    contentType: RAGVector['contentType'],
    contentId: string,
    textContent: string,
    metadata: Partial<RAGVector['metadata']>,
    sourceCollection: string,
    sourceDocId: string
  ): Promise<void> {
    try {
      console.log(`[RAG] Storing vector for ${contentType} - User: ${userId}`);
      
      // Check rate limits before generating embedding
      const rateLimitCheck = await this.checkRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        console.warn(`[RAG] Rate limit exceeded for user ${userId}: ${rateLimitCheck.reason}`);
        throw new Error(`RAG rate limit exceeded: ${rateLimitCheck.reason}`);
      }
      
      // Generate embedding
      const embedding = await this.embeddingService.generateEmbedding(textContent);
      
      // Create vector document
      const vectorDoc: Omit<RAGVector, 'id'> = {
        userId,
        contentType,
        contentId,
        embedding,
        metadata: {
          ...metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        },
        textContent,
        sourceCollection,
        sourceDocId
      };

      // Store in user's vector collection
      const vectorCollectionRef = this.db.collection(`users/${userId}/ragVectors`);
      await vectorCollectionRef.add(vectorDoc);
      
      console.log(`[RAG] Successfully stored vector for ${contentType}`);
    } catch (error: any) {
      console.error(`[RAG] Error storing vector:`, error);
      // Re-throw rate limit errors so they can be handled by the calling code
      if (error.message?.includes('rate limit')) {
        throw error;
      }
      // Don't throw other errors - RAG failures shouldn't break content generation
    }
  }

  /**
   * Update existing vector when content changes
   */
  async updateContentVector(
    userId: string,
    contentId: string,
    textContent: string,
    metadata: Partial<RAGVector['metadata']>
  ): Promise<void> {
    try {
      console.log(`[RAG] Updating vector for content: ${contentId}`);
      
      // Find existing vector
      const vectorCollectionRef = this.db.collection(`users/${userId}/ragVectors`);
      const existingQuery = vectorCollectionRef.where('contentId', '==', contentId).limit(1);
      
      const existingDocs = await existingQuery.get();
      
      if (existingDocs.empty) {
        console.log(`[RAG] No existing vector found for ${contentId}, skipping update`);
        return;
      }

      const existingDoc = existingDocs.docs[0];
      const existingData = existingDoc.data() as RAGVector;
      
      // Generate new embedding
      const newEmbedding = await this.embeddingService.generateEmbedding(textContent);
      
      // Update vector
      const updatedVector: Partial<RAGVector> = {
        embedding: newEmbedding,
        textContent,
        metadata: {
          ...existingData.metadata,
          ...metadata,
          updatedAt: new Date(),
          version: (existingData.metadata.version || 1) + 1
        }
      };

      await existingDoc.ref.update(updatedVector);
      
      console.log(`[RAG] Successfully updated vector for ${contentId}`);
    } catch (error) {
      console.error(`[RAG] Error updating vector:`, error);
    }
  }

  /**
   * Clean up old vectors to manage storage using system configuration
   */
  async cleanupOldVectors(userId: string, keepDays?: number): Promise<void> {
    try {
      // Load system configuration
      const config = await this.loadSystemConfig();
      
      // Check if cleanup is enabled
      if (!config.vectorCleanup?.enabled) {
        console.log(`[RAG] Vector cleanup is disabled in system settings`);
        return;
      }
      
      const retentionDays = keepDays || config.vectorCleanup.retentionDays || 90;
      const minPerformanceThreshold = config.vectorCleanup.minPerformanceThreshold || 0.3;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const vectorCollectionRef = this.db.collection(`users/${userId}/ragVectors`);
      const oldVectorsQuery = vectorCollectionRef
        .where('metadata.createdAt', '<', cutoffDate)
        .where('metadata.performance', '<', minPerformanceThreshold);
      
      const oldVectors = await oldVectorsQuery.get();
      
      if (oldVectors.empty) {
        console.log(`[RAG] No old vectors found for cleanup (user: ${userId})`);
        return;
      }
      
      const batch = this.db.batch();
      oldVectors.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`[RAG] Cleaned up ${oldVectors.docs.length} old vectors for user ${userId} (retention: ${retentionDays} days, min performance: ${minPerformanceThreshold})`);
    } catch (error) {
      console.error(`[RAG] Error cleaning up old vectors:`, error);
    }
  }

}

/**
 * Embedding service for generating vector embeddings
 */
export class EmbeddingService {
  private ragEngine: RAGEngine | null = null;
  private openai: OpenAI;

  constructor(ragEngine?: RAGEngine) {
    this.ragEngine = ragEngine || null;

    // Get OpenAI API key from Firebase config or fall back to process.env for local development
    const getOpenAIApiKey = () => {
      try {
        return functions.config().openai?.api_key || process.env.OPENAI_API_KEY;
      } catch (error) {
        return process.env.OPENAI_API_KEY;
      }
    };

    this.openai = new OpenAI({ apiKey: getOpenAIApiKey() });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Load system configuration for embedding model
      let embeddingModel = 'text-embedding-3-small';
      let dimensions = 1536;
      
      if (this.ragEngine) {
        const config = await this.ragEngine.loadSystemConfig();
        embeddingModel = config.embedding?.model || 'text-embedding-3-small';
        dimensions = config.embedding?.dimensions || 1536;
      }

      const response = await this.openai.embeddings.create({
          input: text,
          model: embeddingModel,
      });

      const embedding = response.data[0].embedding;
      
      // Validate embedding dimensions match configuration
      if (embedding.length !== dimensions) {
        console.warn(`[RAG] Embedding dimension mismatch: expected ${dimensions}, got ${embedding.length}`);
      }
      
      return embedding;
    } catch (error) {
      console.error('[RAG] Error generating embedding:', error);
      
      // Fallback: return zero vector (won't match anything, but won't break the system)
      const fallbackDimensions = this.ragEngine ?
        (await this.ragEngine.loadSystemConfig()).embedding?.dimensions || 1536 : 1536;
      return new Array(fallbackDimensions).fill(0);
    }
  }
}

// Export singleton instance
export const ragEngine = new RAGEngine();