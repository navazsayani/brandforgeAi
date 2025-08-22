"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragEngine = exports.EmbeddingService = exports.RAGEngine = void 0;
const firebaseConfig_1 = require("@/lib/firebaseConfig");
const firestore_1 = require("firebase/firestore");
const openai_1 = require("openai");
class RAGEngine {
    constructor() {
        this.systemConfig = null;
        this.configLastLoaded = 0;
        this.CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
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
            const settingsDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebaseConfig_1.db, 'adminSettings', 'ragSystemConfig'));
            if (settingsDoc.exists()) {
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
            const userSettingsDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebaseConfig_1.db, `users/${userId}/adminSettings`, 'ragRateLimit'));
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
            const vectorCollectionRef = (0, firestore_1.collection)(firebaseConfig_1.db, `users/${userId}/ragVectors`);
            const hourlyQuery = (0, firestore_1.query)(vectorCollectionRef, (0, firestore_1.where)('metadata.createdAt', '>=', oneHourAgo));
            const hourlyDocs = await (0, firestore_1.getDocs)(hourlyQuery);
            if (hourlyDocs.size >= maxPerHour) {
                return {
                    allowed: false,
                    reason: `Rate limit exceeded: ${hourlyDocs.size}/${maxPerHour} embeddings used in the last hour`
                };
            }
            // Check daily limit
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            const dailyQuery = (0, firestore_1.query)(vectorCollectionRef, (0, firestore_1.where)('metadata.createdAt', '>=', oneDayAgo));
            const dailyDocs = await (0, firestore_1.getDocs)(dailyQuery);
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
                metadata: Object.assign(Object.assign({}, metadata), { createdAt: (0, firestore_1.serverTimestamp)(), updatedAt: (0, firestore_1.serverTimestamp)(), version: 1 }),
                textContent,
                sourceCollection,
                sourceDocId
            };
            // Store in user's vector collection
            const vectorCollectionRef = (0, firestore_1.collection)(firebaseConfig_1.db, `users/${userId}/ragVectors`);
            await (0, firestore_1.addDoc)(vectorCollectionRef, vectorDoc);
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
            const vectorCollectionRef = (0, firestore_1.collection)(firebaseConfig_1.db, `users/${userId}/ragVectors`);
            const existingQuery = (0, firestore_1.query)(vectorCollectionRef, (0, firestore_1.where)('contentId', '==', contentId), (0, firestore_1.limit)(1));
            const existingDocs = await (0, firestore_1.getDocs)(existingQuery);
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
                metadata: Object.assign(Object.assign(Object.assign({}, existingData.metadata), metadata), { updatedAt: (0, firestore_1.serverTimestamp)(), version: (existingData.metadata.version || 1) + 1 })
            };
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebaseConfig_1.db, `users/${userId}/ragVectors`, existingDoc.id), updatedVector, { merge: true });
            console.log(`[RAG] Successfully updated vector for ${contentId}`);
        }
        catch (error) {
            console.error(`[RAG] Error updating vector:`, error);
        }
    }
    /**
     * Retrieve relevant context for content generation
     */
    async retrieveRelevantContext(queryText, options) {
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
            let industryVectors = [];
            if (options.includeIndustryPatterns && options.industry) {
                industryVectors = await this.queryIndustryVectors(queryEmbedding, options);
            }
            // Process and format context
            const context = await this.processVectorsToContext(userVectors, industryVectors, options);
            console.log(`[RAG] Retrieved context with ${userVectors.length} user vectors and ${industryVectors.length} industry vectors`);
            return context;
        }
        catch (error) {
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
    async queryUserVectors(queryEmbedding, options) {
        var _a;
        // Load system configuration for similarity threshold
        const config = await this.loadSystemConfig();
        const similarityThreshold = ((_a = config.performance) === null || _a === void 0 ? void 0 : _a.similarityThreshold) || 0.7;
        const vectorCollectionRef = (0, firestore_1.collection)(firebaseConfig_1.db, `users/${options.userId}/ragVectors`);
        // Get all vectors for now - in production, we'd use Firebase Vector Search
        let vectorQuery = (0, firestore_1.query)(vectorCollectionRef);
        // Apply content type filter if specified
        if (options.contentType) {
            vectorQuery = (0, firestore_1.query)(vectorCollectionRef, (0, firestore_1.where)('contentType', '==', options.contentType));
        }
        const results = await (0, firestore_1.getDocs)(vectorQuery);
        // Calculate cosine similarity and sort using configured threshold
        const vectorsWithSimilarity = results.docs
            .map(doc => {
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { similarity: this.calculateCosineSimilarity(queryEmbedding, data.embedding || []) });
        })
            .filter(vector => vector.similarity > similarityThreshold) // Use configured threshold
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, options.limit || 10);
        return vectorsWithSimilarity
            .filter(vector => {
            var _a, _b;
            // Apply additional filters
            if (options.contentType && vector.contentType !== options.contentType) {
                return false;
            }
            if (options.minPerformance && (vector.metadata.performance || 0) < options.minPerformance) {
                return false;
            }
            if (options.timeframe && options.timeframe !== 'all') {
                const createdAt = ((_b = (_a = vector.metadata.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(vector.metadata.createdAt);
                const now = new Date();
                const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
                if (options.timeframe === 'recent' && daysDiff > 30)
                    return false;
                if (options.timeframe === '30days' && daysDiff > 30)
                    return false;
                if (options.timeframe === '90days' && daysDiff > 90)
                    return false;
            }
            return true;
        });
    }
    /**
     * Query industry patterns (anonymized cross-user data)
     */
    async queryIndustryVectors(queryEmbedding, options) {
        // For now, return empty array - industry patterns will be implemented in Phase 3
        // This is where we'd query anonymized cross-user patterns
        return [];
    }
    /**
     * Process vectors into structured context using system configuration
     */
    async processVectorsToContext(userVectors, industryVectors, options) {
        var _a;
        // Load system configuration
        const config = await this.loadSystemConfig();
        const maxContextLength = ((_a = config.performance) === null || _a === void 0 ? void 0 : _a.maxContextLength) || 8000;
        // Group vectors by type and performance
        const highPerformingVectors = userVectors.filter(v => (v.metadata.performance || 0) > 0.7);
        const lowPerformingVectors = userVectors.filter(v => (v.metadata.performance || 0) < 0.3);
        // Extract patterns by content type
        const brandVectors = userVectors.filter(v => v.contentType === 'brand_profile');
        const socialVectors = userVectors.filter(v => v.contentType === 'social_media');
        const blogVectors = userVectors.filter(v => v.contentType === 'blog_post');
        const imageVectors = userVectors.filter(v => v.contentType === 'saved_image');
        // Build context
        let context = {
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
    truncateContextToMaxLength(context, maxLength) {
        const truncateText = (text, maxLen) => {
            if (text.length <= maxLen)
                return text;
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
    extractBrandPatterns(brandVectors, highPerformingVectors) {
        if (brandVectors.length === 0 && highPerformingVectors.length === 0) {
            return '';
        }
        const patterns = [];
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
    extractSuccessfulStyles(highPerformingVectors) {
        const styles = highPerformingVectors
            .map(v => v.metadata.style)
            .filter(Boolean)
            .reduce((acc, style) => {
            acc[style] = (acc[style] || 0) + 1;
            return acc;
        }, {});
        const topStyles = Object.entries(styles)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([style, count]) => `${style} (used ${count} times successfully)`);
        return topStyles.join(', ');
    }
    /**
     * Extract patterns to avoid
     */
    extractAvoidPatterns(lowPerformingVectors) {
        const avoidStyles = lowPerformingVectors
            .map(v => v.metadata.style)
            .filter(Boolean)
            .reduce((acc, style) => {
            acc[style] = (acc[style] || 0) + 1;
            return acc;
        }, {});
        const topAvoidStyles = Object.entries(avoidStyles)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([style]) => style);
        return topAvoidStyles.length > 0
            ? `Avoid these styles that performed poorly: ${topAvoidStyles.join(', ')}`
            : '';
    }
    /**
     * Extract industry insights
     */
    extractIndustryInsights(industryVectors) {
        // Placeholder for industry intelligence
        // Will be implemented in Phase 3 with cross-user analysis
        return '';
    }
    /**
     * Extract seasonal trends
     */
    extractSeasonalTrends(vectors) {
        const currentMonth = new Date().getMonth();
        const seasonalVectors = vectors.filter(v => {
            var _a, _b;
            const createdAt = ((_b = (_a = v.metadata.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(v.metadata.createdAt);
            return createdAt.getMonth() === currentMonth;
        });
        if (seasonalVectors.length === 0)
            return '';
        const seasonalStyles = this.extractCommonStyles(seasonalVectors);
        return seasonalStyles.length > 0
            ? `Current seasonal trends: ${seasonalStyles.join(', ')}`
            : '';
    }
    /**
     * Extract voice patterns for social media
     */
    extractVoicePatterns(socialVectors) {
        const highPerforming = socialVectors.filter(v => (v.metadata.performance || 0) > 0.7);
        if (highPerforming.length === 0)
            return '';
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
    extractEffectiveHashtags(socialVectors) {
        const highPerforming = socialVectors.filter(v => (v.metadata.performance || 0) > 0.7);
        const hashtags = highPerforming
            .flatMap(v => v.metadata.tags || [])
            .reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {});
        const topHashtags = Object.entries(hashtags)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tag]) => `#${tag}`);
        return topHashtags.join(' ');
    }
    /**
     * Extract SEO keywords
     */
    extractSEOKeywords(blogVectors) {
        const highPerforming = blogVectors.filter(v => (v.metadata.performance || 0) > 0.7);
        const keywords = highPerforming
            .flatMap(v => v.metadata.tags || [])
            .reduce((acc, keyword) => {
            acc[keyword] = (acc[keyword] || 0) + 1;
            return acc;
        }, {});
        const topKeywords = Object.entries(keywords)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([keyword]) => keyword);
        return topKeywords.join(', ');
    }
    /**
     * Extract performance insights
     */
    extractPerformanceInsights(vectors) {
        const insights = [];
        const avgPerformance = vectors.reduce((sum, v) => sum + (v.metadata.performance || 0), 0) / vectors.length;
        if (avgPerformance > 0.7) {
            insights.push('Your content consistently performs well');
        }
        else if (avgPerformance < 0.3) {
            insights.push('Consider adjusting your content strategy based on successful patterns');
        }
        return insights.join('. ');
    }
    /**
     * Helper: Extract common styles from vectors
     */
    extractCommonStyles(vectors) {
        const styles = vectors
            .map(v => v.metadata.style)
            .filter(Boolean)
            .reduce((acc, style) => {
            acc[style] = (acc[style] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(styles)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([style]) => style);
    }
    /**
     * Calculate cosine similarity between two vectors
     */
    calculateCosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length || vecA.length === 0)
            return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0)
            return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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
            const vectorCollectionRef = (0, firestore_1.collection)(firebaseConfig_1.db, `users/${userId}/ragVectors`);
            const oldVectorsQuery = (0, firestore_1.query)(vectorCollectionRef, (0, firestore_1.where)('metadata.createdAt', '<', cutoffDate), (0, firestore_1.where)('metadata.performance', '<', minPerformanceThreshold) // Use configured threshold
            );
            const oldVectors = await (0, firestore_1.getDocs)(oldVectorsQuery);
            if (oldVectors.empty) {
                console.log(`[RAG] No old vectors found for cleanup (user: ${userId})`);
                return;
            }
            const batch = (0, firestore_1.writeBatch)(firebaseConfig_1.db);
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
    /**
     * Run cleanup for all users (admin function)
     */
    async cleanupAllUsersVectors() {
        var _a;
        try {
            const config = await this.loadSystemConfig();
            if (!((_a = config.vectorCleanup) === null || _a === void 0 ? void 0 : _a.enabled)) {
                console.log(`[RAG] Vector cleanup is disabled in system settings`);
                return { totalCleaned: 0, usersProcessed: 0 };
            }
            console.log(`[RAG] Starting cleanup for all users...`);
            const usersSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebaseConfig_1.db, 'users'));
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
                }
                catch (error) {
                    console.error(`[RAG] Error cleaning up vectors for user ${userDoc.id}:`, error);
                }
            }
            console.log(`[RAG] Cleanup complete: ${totalCleaned} vectors cleaned across ${usersProcessed} users`);
            return { totalCleaned, usersProcessed };
        }
        catch (error) {
            console.error(`[RAG] Error in global cleanup:`, error);
            return { totalCleaned: 0, usersProcessed: 0 };
        }
    }
    /**
     * Get vector count for a user
     */
    async getUserVectorCount(userId) {
        try {
            const vectorsSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebaseConfig_1.db, `users/${userId}/ragVectors`));
            return vectorsSnapshot.size;
        }
        catch (error) {
            console.error(`[RAG] Error getting vector count for user ${userId}:`, error);
            return 0;
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