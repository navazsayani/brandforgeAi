"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragEngine = exports.EmbeddingService = exports.RAGEngine = void 0;
const firestore_1 = require("firebase-admin/firestore");
const openai_1 = require("openai");
class RAGEngine {
    constructor() {
        this.systemConfig = null;
        this.configLastLoaded = 0;
        this.CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.db = (0, firestore_1.getFirestore)();
        this.embeddingService = new EmbeddingService(this);
    }
    /**
     * Load system configuration from Firestore
     */
    async loadSystemConfig() {
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
            }
            else {
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
        }
        catch (error) {
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
    async checkRateLimit(userId) {
        var _a;
        try {
            // Load system configuration
            const config = await this.loadSystemConfig();
            // If rate limiting is disabled globally, allow all requests
            if (!((_a = config.rateLimiting) === null || _a === void 0 ? void 0 : _a.enabled)) {
                return { allowed: true };
            }
            // Check user-specific rate limiting
            const userSettingsDoc = await this.db.doc(`users/${userId}/adminSettings/ragRateLimit`).get();
            const userSettings = userSettingsDoc.data();
            // Use user-specific settings if enabled, otherwise use global settings
            let maxPerHour, maxPerDay;
            if (userSettings === null || userSettings === void 0 ? void 0 : userSettings.enabled) {
                maxPerHour = userSettings.maxEmbeddingsPerHour || config.rateLimiting.userMaxPerHour;
                maxPerDay = userSettings.maxEmbeddingsPerDay || config.rateLimiting.userMaxPerDay;
            }
            else {
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
        }
        catch (error) {
            console.error('[RAG] Error checking rate limit:', error);
            // On error, allow the request to proceed (fail open)
            return { allowed: true };
        }
    }
    /**
     * Store content vector with proper Firestore paths
     */
    async storeContentVector(userId, contentType, contentId, textContent, metadata, sourceCollection, sourceDocId) {
        var _a;
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
            const vectorDoc = {
                userId,
                contentType,
                contentId,
                embedding,
                metadata: Object.assign(Object.assign({}, metadata), { createdAt: new Date(), updatedAt: new Date(), version: 1 }),
                textContent,
                sourceCollection,
                sourceDocId
            };
            // Store in user's vector collection
            const vectorCollectionRef = this.db.collection(`users/${userId}/ragVectors`);
            await vectorCollectionRef.add(vectorDoc);
            console.log(`[RAG] Successfully stored vector for ${contentType}`);
        }
        catch (error) {
            console.error(`[RAG] Error storing vector:`, error);
            // Re-throw rate limit errors so they can be handled by the calling code
            if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('rate limit')) {
                throw error;
            }
            // Don't throw other errors - RAG failures shouldn't break content generation
        }
    }
    /**
     * Update existing vector when content changes
     */
    async updateContentVector(userId, contentId, textContent, metadata) {
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
            const existingData = existingDoc.data();
            // Generate new embedding
            const newEmbedding = await this.embeddingService.generateEmbedding(textContent);
            // Update vector
            const updatedVector = {
                embedding: newEmbedding,
                textContent,
                metadata: Object.assign(Object.assign(Object.assign({}, existingData.metadata), metadata), { updatedAt: new Date(), version: (existingData.metadata.version || 1) + 1 })
            };
            await existingDoc.ref.update(updatedVector);
            console.log(`[RAG] Successfully updated vector for ${contentId}`);
        }
        catch (error) {
            console.error(`[RAG] Error updating vector:`, error);
        }
    }
    /**
     * Clean up old vectors to manage storage using system configuration
     */
    async cleanupOldVectors(userId, keepDays) {
        var _a;
        try {
            // Load system configuration
            const config = await this.loadSystemConfig();
            // Check if cleanup is enabled
            if (!((_a = config.vectorCleanup) === null || _a === void 0 ? void 0 : _a.enabled)) {
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
        }
        catch (error) {
            console.error(`[RAG] Error cleaning up old vectors:`, error);
        }
    }
}
exports.RAGEngine = RAGEngine;
/**
 * Embedding service for generating vector embeddings
 */
class EmbeddingService {
    constructor(ragEngine) {
        this.ragEngine = null;
        this.ragEngine = ragEngine || null;
        this.openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
    }
    async generateEmbedding(text) {
        var _a, _b, _c;
        try {
            // Load system configuration for embedding model
            let embeddingModel = 'text-embedding-3-small';
            let dimensions = 1536;
            if (this.ragEngine) {
                const config = await this.ragEngine.loadSystemConfig();
                embeddingModel = ((_a = config.embedding) === null || _a === void 0 ? void 0 : _a.model) || 'text-embedding-3-small';
                dimensions = ((_b = config.embedding) === null || _b === void 0 ? void 0 : _b.dimensions) || 1536;
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
        }
        catch (error) {
            console.error('[RAG] Error generating embedding:', error);
            // Fallback: return zero vector (won't match anything, but won't break the system)
            const fallbackDimensions = this.ragEngine ?
                ((_c = (await this.ragEngine.loadSystemConfig()).embedding) === null || _c === void 0 ? void 0 : _c.dimensions) || 1536 : 1536;
            return new Array(fallbackDimensions).fill(0);
        }
    }
}
exports.EmbeddingService = EmbeddingService;
// Export singleton instance
exports.ragEngine = new RAGEngine();
//# sourceMappingURL=rag-engine.js.map