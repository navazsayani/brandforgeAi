import { db } from '@/lib/firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
// Note: Firebase Vector Search is still in preview - using alternative approach
// import { VectorQuery } from 'firebase/firestore';
import type { BrandData } from '@/types';
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
    language?: string;
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
  platformPatterns?: string;
  languagePatterns?: string;
}

export interface RAGRetrievalOptions {
  userId: string;
  contentType?: string;
  industry?: string;
  platform?: string;
  language?: string;
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
      
      const settingsDoc = await getDoc(doc(db, 'adminSettings', 'ragSystemConfig'));
      
      if (settingsDoc.exists()) {
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
      const userSettingsDoc = await getDoc(doc(db, `users/${userId}/adminSettings`, 'ragRateLimit'));
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

      const vectorCollectionRef = collection(db, `users/${userId}/ragVectors`);
      const hourlyQuery = query(
        vectorCollectionRef,
        where('metadata.createdAt', '>=', oneHourAgo)
      );
      const hourlyDocs = await getDocs(hourlyQuery);

      if (hourlyDocs.size >= maxPerHour) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${hourlyDocs.size}/${maxPerHour} embeddings used in the last hour`
        };
      }

      // Check daily limit
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const dailyQuery = query(
        vectorCollectionRef,
        where('metadata.createdAt', '>=', oneDayAgo)
      );
      const dailyDocs = await getDocs(dailyQuery);

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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          version: 1
        },
        textContent,
        sourceCollection,
        sourceDocId
      };

      // Store in user's vector collection
      const vectorCollectionRef = collection(db, `users/${userId}/ragVectors`);
      await addDoc(vectorCollectionRef, vectorDoc);
      
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
      const vectorCollectionRef = collection(db, `users/${userId}/ragVectors`);
      const existingQuery = query(
        vectorCollectionRef,
        where('contentId', '==', contentId),
        firestoreLimit(1)
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (existingDocs.empty) {
        console.log(`[RAG] No existing vector found for ${contentId}, skipping update`);
        return;
      }

      const existingDoc = existingDocs.docs[0];
      const existingData = existingDoc.data() as RAGVector;

      // Determine if we are updating text content (and thus need a new embedding),
      // or only updating metadata (performance, engagement, etc.)
      const hasNewText = typeof textContent === 'string' && textContent.trim().length > 0;

      let updatedVector: Partial<RAGVector>;
      if (hasNewText) {
        // Generate new embedding only when we actually have new non-empty text content
        const newEmbedding = await this.embeddingService.generateEmbedding(textContent);
        updatedVector = {
          embedding: newEmbedding,
          textContent,
          metadata: {
            ...existingData.metadata,
            ...metadata,
            updatedAt: serverTimestamp(),
            version: (existingData.metadata.version || 1) + 1
          }
        };
      } else {
        // Metadata-only update: do NOT overwrite textContent/embedding
        updatedVector = {
          metadata: {
            ...existingData.metadata,
            ...metadata,
            updatedAt: serverTimestamp(),
            version: (existingData.metadata.version || 1) + 1
          }
        };
      }

      await setDoc(doc(db, `users/${userId}/ragVectors`, existingDoc.id), updatedVector, { merge: true });
      
      console.log(`[RAG] Successfully updated vector for ${contentId} (${hasNewText ? 'text+embedding' : 'metadata-only'})`);
    } catch (error) {
      console.error(`[RAG] Error updating vector:`, error);
    }
  }

  /**
   * Retrieve relevant context for content generation
   */
  async retrieveRelevantContext(
    queryText: string,
    options: RAGRetrievalOptions
  ): Promise<RAGContext> {
    try {
      console.log(`[RAG] Retrieving context for user: ${options.userId}`);
      
      // Check rate limits before generating embedding
      const rateLimitCheck = await this.checkRateLimit(options.userId);
      if (!rateLimitCheck.allowed) {
        console.warn(`[RAG] Rate limit exceeded for user ${options.userId}: ${rateLimitCheck.reason}`);
        // For context retrieval, return empty context instead of throwing
        return {
          brandPatterns: '',
          successfulStyles: '',
          avoidPatterns: '',
          industryInsights: '',
          seasonalTrends: ''
        };
      }
      
      // Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(queryText);
      
      // Retrieve user's vectors
      const userVectors = await this.queryUserVectors(queryEmbedding, options);
      
      // Retrieve industry patterns if requested
      let industryVectors: RAGVector[] = [];
      if (options.includeIndustryPatterns && options.industry) {
        industryVectors = await this.queryIndustryVectors(queryEmbedding, options);
      }
      
      // Process and format context
      const context = await this.processVectorsToContext(userVectors, industryVectors, options);
      
      console.log(`[RAG] Retrieved context with ${userVectors.length} user vectors and ${industryVectors.length} industry vectors`);
      
      return context;
    } catch (error) {
      console.error(`[RAG] Error retrieving context:`, error);
      
      // Return empty context on error - don't break generation
      return {
        brandPatterns: '',
        successfulStyles: '',
        avoidPatterns: '',
        industryInsights: '',
        seasonalTrends: ''
      };
    }
  }

  /**
   * Query user's vectors using cosine similarity (Firebase Vector Search alternative)
   */
  private async queryUserVectors(
    queryEmbedding: number[],
    options: RAGRetrievalOptions
  ): Promise<RAGVector[]> {
    // Load system configuration for similarity threshold
    const config = await this.loadSystemConfig();
    const similarityThreshold = config.performance?.similarityThreshold || 0.7;
    
    const vectorCollectionRef = collection(db, `users/${options.userId}/ragVectors`);
    
    // Get all vectors for now - in production, we'd use Firebase Vector Search
    let vectorQuery = query(vectorCollectionRef);
    
    // Apply content type filter if specified
    if (options.contentType) {
      vectorQuery = query(vectorCollectionRef, where('contentType', '==', options.contentType));
    }
    
    const results = await getDocs(vectorQuery);
    
    // Calculate cosine similarity and sort using configured threshold
    const vectorsWithSimilarity = results.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          similarity: this.calculateCosineSimilarity(queryEmbedding, data.embedding || [])
        } as RAGVector & { similarity: number };
      })
      .filter(vector => vector.similarity > similarityThreshold) // Use configured threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.limit || 10);
    
    return vectorsWithSimilarity
      .filter(vector => {
        // Apply additional filters
        if (options.contentType && vector.contentType !== options.contentType) {
          return false;
        }
        
        if (options.minPerformance && (vector.metadata.performance || 0) < options.minPerformance) {
          return false;
        }
        
        if (options.timeframe && options.timeframe !== 'all') {
          const createdAt = vector.metadata.createdAt?.toDate?.() || new Date(vector.metadata.createdAt);
          const now = new Date();
          const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          
          if (options.timeframe === 'recent' && daysDiff > 30) return false;
          if (options.timeframe === '30days' && daysDiff > 30) return false;
          if (options.timeframe === '90days' && daysDiff > 90) return false;
        }
        
        return true;
      });
  }

  /**
   * Query industry patterns (anonymized cross-user data)
   */
  private async queryIndustryVectors(
    queryEmbedding: number[],
    options: RAGRetrievalOptions
  ): Promise<RAGVector[]> {
    // For now, return empty array - industry patterns will be implemented in Phase 3
    // This is where we'd query anonymized cross-user patterns
    return [];
  }

  /**
   * Process vectors into structured context using system configuration
   */
  private async processVectorsToContext(
    userVectors: RAGVector[],
    industryVectors: RAGVector[],
    options: RAGRetrievalOptions
  ): Promise<RAGContext> {
    // Load system configuration
    const config = await this.loadSystemConfig();
    const maxContextLength = config.performance?.maxContextLength || 8000;
    
    // Group vectors by type and performance
    const highPerformingVectors = userVectors.filter(v => (v.metadata.performance || 0) > 0.7);
    const lowPerformingVectors = userVectors.filter(v => (v.metadata.performance || 0) < 0.3);
    
    // Extract patterns by content type
    const brandVectors = userVectors.filter(v => v.contentType === 'brand_profile');
    const socialVectors = userVectors.filter(v => v.contentType === 'social_media');
    const blogVectors = userVectors.filter(v => v.contentType === 'blog_post');
    const imageVectors = userVectors.filter(v => v.contentType === 'saved_image');
    
    // Build context
    let context: RAGContext = {
      brandPatterns: this.extractBrandPatterns(brandVectors, highPerformingVectors),
      successfulStyles: this.extractSuccessfulStyles(highPerformingVectors),
      avoidPatterns: this.extractAvoidPatterns(lowPerformingVectors),
      industryInsights: this.extractIndustryInsights(industryVectors),
      seasonalTrends: this.extractSeasonalTrends(userVectors),
    };
    
    // Add content-type specific context
    if (options.contentType === 'social_media') {
      context.voicePatterns = this.extractVoicePatterns(socialVectors);
      context.effectiveHashtags = this.extractEffectiveHashtags(socialVectors);
      
      // Add platform-specific patterns
      if (options.platform) {
        context.platformPatterns = this.extractPlatformPatterns(socialVectors, options.platform);
      }
      
      // Add language-specific patterns
      if (options.language) {
        context.languagePatterns = this.extractLanguagePatterns(socialVectors, options.language);
      }
    }
    
    if (options.contentType === 'blog_post') {
      context.seoKeywords = this.extractSEOKeywords(blogVectors);
    }
    
    context.performanceInsights = this.extractPerformanceInsights(userVectors);
    
    // Truncate context to respect max context length
    context = this.truncateContextToMaxLength(context, maxContextLength);
    
    return context;
  }

  /**
   * Truncate context to respect maximum context length setting
   */
  private truncateContextToMaxLength(context: RAGContext, maxLength: number): RAGContext {
    const truncateText = (text: string, maxLen: number): string => {
      if (text.length <= maxLen) return text;
      return text.substring(0, maxLen - 3) + '...';
    };

    // Calculate total length
    const totalLength = Object.values(context).join('').length;
    
    if (totalLength <= maxLength) {
      return context; // No truncation needed
    }

    // Distribute max length proportionally among context fields
    const fieldCount = Object.keys(context).length;
    const maxPerField = Math.floor(maxLength / fieldCount);

    return {
      brandPatterns: truncateText(context.brandPatterns || '', maxPerField),
      successfulStyles: truncateText(context.successfulStyles || '', maxPerField),
      avoidPatterns: truncateText(context.avoidPatterns || '', maxPerField),
      industryInsights: truncateText(context.industryInsights || '', maxPerField),
      seasonalTrends: truncateText(context.seasonalTrends || '', maxPerField),
      voicePatterns: truncateText(context.voicePatterns || '', maxPerField),
      effectiveHashtags: truncateText(context.effectiveHashtags || '', maxPerField),
      seoKeywords: truncateText(context.seoKeywords || '', maxPerField),
      performanceInsights: truncateText(context.performanceInsights || '', maxPerField)
    };
  }

  /**
   * Extract brand consistency patterns
   */
  private extractBrandPatterns(brandVectors: RAGVector[], highPerformingVectors: RAGVector[]): string {
    if (brandVectors.length === 0 && highPerformingVectors.length === 0) {
      return '';
    }
    
    const patterns: string[] = [];
    
    // Extract from brand profile vectors
    brandVectors.forEach(vector => {
      if (vector.textContent) {
        patterns.push(`Brand essence: ${vector.textContent.substring(0, 200)}...`);
      }
    });
    
    // Extract from high-performing content
    const commonStyles = this.extractCommonStyles(highPerformingVectors);
    if (commonStyles.length > 0) {
      patterns.push(`Successful brand styles: ${commonStyles.join(', ')}`);
    }
    
    return patterns.join('\n');
  }

  /**
   * Extract successful style patterns
   */
  private extractSuccessfulStyles(highPerformingVectors: RAGVector[]): string {
    const styles = highPerformingVectors
      .map(v => v.metadata.style)
      .filter(Boolean)
      .reduce((acc, style) => {
        acc[style!] = (acc[style!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topStyles = Object.entries(styles)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([style, count]) => `${style} (used ${count} times successfully)`);
    
    return topStyles.join(', ');
  }

  /**
   * Extract patterns to avoid
   */
  private extractAvoidPatterns(lowPerformingVectors: RAGVector[]): string {
    const avoidStyles = lowPerformingVectors
      .map(v => v.metadata.style)
      .filter(Boolean)
      .reduce((acc, style) => {
        acc[style!] = (acc[style!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topAvoidStyles = Object.entries(avoidStyles)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([style]) => style);
    
    return topAvoidStyles.length > 0 
      ? `Avoid these styles that performed poorly: ${topAvoidStyles.join(', ')}`
      : '';
  }

  /**
   * Extract industry insights
   */
  private extractIndustryInsights(industryVectors: RAGVector[]): string {
    // Placeholder for industry intelligence
    // Will be implemented in Phase 3 with cross-user analysis
    return '';
  }

  /**
   * Extract seasonal trends
   */
  private extractSeasonalTrends(vectors: RAGVector[]): string {
    const currentMonth = new Date().getMonth();
    const seasonalVectors = vectors.filter(v => {
      const createdAt = v.metadata.createdAt?.toDate?.() || new Date(v.metadata.createdAt);
      return createdAt.getMonth() === currentMonth;
    });
    
    if (seasonalVectors.length === 0) return '';
    
    const seasonalStyles = this.extractCommonStyles(seasonalVectors);
    return seasonalStyles.length > 0 
      ? `Current seasonal trends: ${seasonalStyles.join(', ')}`
      : '';
  }

  /**
   * Extract voice patterns for social media
   */
  private extractVoicePatterns(socialVectors: RAGVector[]): string {
    const highPerforming = socialVectors.filter(v => (v.metadata.performance || 0) > 0.7);
    
    if (highPerforming.length === 0) return '';
    
    // Extract common phrases and tone indicators
    const commonPhrases = highPerforming
      .map(v => v.textContent.split('.')[0]) // First sentence
      .filter(phrase => phrase.length > 10 && phrase.length < 100)
      .slice(0, 3);
    
    return commonPhrases.length > 0 
      ? `Successful voice patterns: ${commonPhrases.join(' | ')}`
      : '';
  }

  /**
   * Extract effective hashtags
   */
  private extractEffectiveHashtags(socialVectors: RAGVector[]): string {
    const highPerforming = socialVectors.filter(v => (v.metadata.performance || 0) > 0.7);
    
    const hashtags = highPerforming
      .flatMap(v => v.metadata.tags || [])
      .reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topHashtags = Object.entries(hashtags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => `#${tag}`);
    
    return topHashtags.join(' ');
  }

  /**
   * Extract SEO keywords
   */
  private extractSEOKeywords(blogVectors: RAGVector[]): string {
    const highPerforming = blogVectors.filter(v => (v.metadata.performance || 0) > 0.7);
    
    const keywords = highPerforming
      .flatMap(v => v.metadata.tags || [])
      .reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topKeywords = Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([keyword]) => keyword);
    
    return topKeywords.join(', ');
  }

  /**
   * Extract performance insights
   */
  private extractPerformanceInsights(vectors: RAGVector[]): string {
    const insights: string[] = [];
    
    const avgPerformance = vectors.reduce((sum, v) => sum + (v.metadata.performance || 0), 0) / vectors.length;
    
    if (avgPerformance > 0.7) {
      insights.push('Your content consistently performs well');
    } else if (avgPerformance < 0.3) {
      insights.push('Consider adjusting your content strategy based on successful patterns');
    }
    
    return insights.join('. ');
  }

  /**
   * Extract platform-specific patterns
   */
  private extractPlatformPatterns(socialVectors: RAGVector[], platform: string): string {
    const platformVectors = socialVectors.filter(v =>
      v.metadata.platform === platform && (v.metadata.performance || 0) > 0.7
    );
    
    if (platformVectors.length === 0) return '';
    
    // Extract successful content patterns for the specific platform
    const patterns: string[] = [];
    
    // Extract common successful approaches
    const successfulContent = platformVectors
      .map(v => v.textContent.substring(0, 100))
      .slice(0, 3);
    
    if (successfulContent.length > 0) {
      patterns.push(`Your successful ${platform} content style: ${successfulContent.join(' | ')}`);
    }
    
    // Extract platform-specific hashtag patterns
    const platformHashtags = platformVectors
      .flatMap(v => v.metadata.tags || [])
      .reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topPlatformHashtags = Object.entries(platformHashtags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => `#${tag}`);
    
    if (topPlatformHashtags.length > 0) {
      patterns.push(`Top ${platform} hashtags: ${topPlatformHashtags.join(' ')}`);
    }
    
    return patterns.join('\n');
  }
  
  /**
   * Extract language-specific patterns
   */
  private extractLanguagePatterns(socialVectors: RAGVector[], language: string): string {
    const languageVectors = socialVectors.filter(v =>
      v.metadata.language === language && (v.metadata.performance || 0) > 0.7
    );
    
    if (languageVectors.length === 0) return '';
    
    // Extract successful language-specific content patterns
    const patterns: string[] = [];
    
    // Extract tone and style patterns for the language
    const languageContent = languageVectors
      .map(v => v.textContent.substring(0, 80))
      .slice(0, 3);
    
    if (languageContent.length > 0) {
      patterns.push(`Your successful ${language} content style: ${languageContent.join(' | ')}`);
    }
    
    // Extract language-specific engagement patterns
    const avgEngagement = languageVectors.reduce((sum, v) => sum + (v.metadata.engagement || 0), 0) / languageVectors.length;
    if (avgEngagement > 0.5) {
      patterns.push(`${language} content performs well for your audience`);
    }
    
    return patterns.join('\n');
  }

  /**
   * Helper: Extract common styles from vectors
   */
  private extractCommonStyles(vectors: RAGVector[]): string[] {
    const styles = vectors
      .map(v => v.metadata.style)
      .filter(Boolean)
      .reduce((acc, style) => {
        acc[style!] = (acc[style!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(styles)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([style]) => style);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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
      
      const vectorCollectionRef = collection(db, `users/${userId}/ragVectors`);
      const oldVectorsQuery = query(
        vectorCollectionRef,
        where('metadata.createdAt', '<', cutoffDate),
        where('metadata.performance', '<', minPerformanceThreshold) // Use configured threshold
      );
      
      const oldVectors = await getDocs(oldVectorsQuery);
      
      if (oldVectors.empty) {
        console.log(`[RAG] No old vectors found for cleanup (user: ${userId})`);
        return;
      }
      
      const batch = writeBatch(db);
      oldVectors.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`[RAG] Cleaned up ${oldVectors.docs.length} old vectors for user ${userId} (retention: ${retentionDays} days, min performance: ${minPerformanceThreshold})`);
    } catch (error) {
      console.error(`[RAG] Error cleaning up old vectors:`, error);
    }
  }

  /**
   * Run cleanup for all users (admin function)
   */
  async cleanupAllUsersVectors(): Promise<{ totalCleaned: number; usersProcessed: number }> {
    try {
      const config = await this.loadSystemConfig();
      
      if (!config.vectorCleanup?.enabled) {
        console.log(`[RAG] Vector cleanup is disabled in system settings`);
        return { totalCleaned: 0, usersProcessed: 0 };
      }

      console.log(`[RAG] Starting cleanup for all users...`);
      
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let totalCleaned = 0;
      let usersProcessed = 0;

      for (const userDoc of usersSnapshot.docs) {
        try {
          const beforeCount = await this.getUserVectorCount(userDoc.id);
          await this.cleanupOldVectors(userDoc.id);
          const afterCount = await this.getUserVectorCount(userDoc.id);
          
          const cleaned = beforeCount - afterCount;
          totalCleaned += cleaned;
          usersProcessed++;
          
          if (cleaned > 0) {
            console.log(`[RAG] Cleaned ${cleaned} vectors for user ${userDoc.id}`);
          }
        } catch (error) {
          console.error(`[RAG] Error cleaning up vectors for user ${userDoc.id}:`, error);
        }
      }

      console.log(`[RAG] Cleanup complete: ${totalCleaned} vectors cleaned across ${usersProcessed} users`);
      return { totalCleaned, usersProcessed };
    } catch (error) {
      console.error(`[RAG] Error in global cleanup:`, error);
      return { totalCleaned: 0, usersProcessed: 0 };
    }
  }

  /**
   * Get vector count for a user
   */
  private async getUserVectorCount(userId: string): Promise<number> {
    try {
      const vectorsSnapshot = await getDocs(collection(db, `users/${userId}/ragVectors`));
      return vectorsSnapshot.size;
    } catch (error) {
      console.error(`[RAG] Error getting vector count for user ${userId}:`, error);
      return 0;
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
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
