"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserBrandContext = exports.cleanupOldVectors = exports.autoVectorizeBrandLogo = exports.autoVectorizeSavedImage = exports.autoVectorizeAdCampaign = exports.autoVectorizeBlogPost = exports.autoVectorizeSocialMediaPost = exports.autoVectorizeBrandProfile = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
// Initialize Firebase Admin
if (!app_1.initializeApp.length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
// Import vectorization functions
const rag_auto_vectorizer_1 = require("../../src/lib/rag-auto-vectorizer");
/**
 * Auto-vectorize brand profile changes
 * Triggers on: users/{userId}/brandProfiles/{userId}
 */
exports.autoVectorizeBrandProfile = (0, firestore_1.onDocumentWritten)('users/{userId}/brandProfiles/{profileId}', async (event) => {
    var _a, _b;
    const change = event.data;
    const { userId, profileId } = event.params;
    try {
        console.log(`[RAG Trigger] Brand profile change detected for user: ${userId}`);
        if (!change) {
            console.log(`[RAG Trigger] No change data available`);
            return;
        }
        // Handle deletion
        if (!((_a = change.after) === null || _a === void 0 ? void 0 : _a.exists)) {
            console.log(`[RAG Trigger] Brand profile deleted for user: ${userId}`);
            // TODO: Clean up related vectors
            return;
        }
        const brandData = change.after.data();
        if (!brandData) {
            console.log(`[RAG Trigger] No brand data available`);
            return;
        }
        // Check if this is a significant change (for updates)
        if ((_b = change.before) === null || _b === void 0 ? void 0 : _b.exists) {
            const oldData = change.before.data();
            if (oldData) {
                const oldContent = `${oldData.brandDescription || ''} ${oldData.targetKeywords || ''} ${oldData.imageStyleNotes || ''}`;
                const newContent = `${brandData.brandDescription || ''} ${brandData.targetKeywords || ''} ${brandData.imageStyleNotes || ''}`;
                if (!(0, rag_auto_vectorizer_1.shouldReVectorize)(oldContent, newContent)) {
                    console.log(`[RAG Trigger] No significant changes in brand profile for user: ${userId}`);
                    return;
                }
            }
        }
        await (0, rag_auto_vectorizer_1.vectorizeBrandProfile)(userId, brandData);
        console.log(`[RAG Trigger] Successfully processed brand profile for user: ${userId}`);
    }
    catch (error) {
        console.error(`[RAG Trigger] Error processing brand profile:`, error);
    }
});
/**
 * Auto-vectorize social media posts
 * Triggers on: users/{userId}/brandProfiles/{profileId}/socialMediaPosts/{postId}
 */
exports.autoVectorizeSocialMediaPost = (0, firestore_1.onDocumentWritten)('users/{userId}/brandProfiles/{profileId}/socialMediaPosts/{postId}', async (event) => {
    var _a, _b;
    const change = event.data;
    const { userId, profileId, postId } = event.params;
    try {
        console.log(`[RAG Trigger] Social media post change detected: ${postId} for user: ${userId}`);
        if (!change) {
            console.log(`[RAG Trigger] No change data available`);
            return;
        }
        // Handle deletion
        if (!((_a = change.after) === null || _a === void 0 ? void 0 : _a.exists)) {
            console.log(`[RAG Trigger] Social media post deleted: ${postId}`);
            // TODO: Clean up related vectors
            return;
        }
        const postData = change.after.data();
        if (!postData) {
            console.log(`[RAG Trigger] No post data available`);
            return;
        }
        // Check if this is a significant change (for updates)
        if ((_b = change.before) === null || _b === void 0 ? void 0 : _b.exists) {
            const oldData = change.before.data();
            if (oldData) {
                const oldContent = `${oldData.caption || ''} ${oldData.hashtags || ''}`;
                const newContent = `${postData.caption || ''} ${postData.hashtags || ''}`;
                if (!(0, rag_auto_vectorizer_1.shouldReVectorize)(oldContent, newContent)) {
                    console.log(`[RAG Trigger] No significant changes in social media post: ${postId}`);
                    return;
                }
            }
        }
        await (0, rag_auto_vectorizer_1.vectorizeSocialMediaPost)(userId, postData, postId);
        console.log(`[RAG Trigger] Successfully processed social media post: ${postId}`);
    }
    catch (error) {
        console.error(`[RAG Trigger] Error processing social media post:`, error);
    }
});
/**
 * Auto-vectorize blog posts
 * Triggers on: users/{userId}/brandProfiles/{profileId}/blogPosts/{postId}
 */
exports.autoVectorizeBlogPost = (0, firestore_1.onDocumentWritten)('users/{userId}/brandProfiles/{profileId}/blogPosts/{postId}', async (event) => {
    var _a, _b;
    const change = event.data;
    const { userId, profileId, postId } = event.params;
    try {
        console.log(`[RAG Trigger] Blog post change detected: ${postId} for user: ${userId}`);
        if (!change) {
            console.log(`[RAG Trigger] No change data available`);
            return;
        }
        // Handle deletion
        if (!((_a = change.after) === null || _a === void 0 ? void 0 : _a.exists)) {
            console.log(`[RAG Trigger] Blog post deleted: ${postId}`);
            // TODO: Clean up related vectors
            return;
        }
        const blogData = change.after.data();
        if (!blogData) {
            console.log(`[RAG Trigger] No blog data available`);
            return;
        }
        // Check if this is a significant change (for updates)
        if ((_b = change.before) === null || _b === void 0 ? void 0 : _b.exists) {
            const oldData = change.before.data();
            if (oldData) {
                const oldContent = `${oldData.title || ''} ${oldData.content || ''}`;
                const newContent = `${blogData.title || ''} ${blogData.content || ''}`;
                if (!(0, rag_auto_vectorizer_1.shouldReVectorize)(oldContent, newContent)) {
                    console.log(`[RAG Trigger] No significant changes in blog post: ${postId}`);
                    return;
                }
            }
        }
        await (0, rag_auto_vectorizer_1.vectorizeBlogPost)(userId, blogData, postId);
        console.log(`[RAG Trigger] Successfully processed blog post: ${postId}`);
    }
    catch (error) {
        console.error(`[RAG Trigger] Error processing blog post:`, error);
    }
});
/**
 * Auto-vectorize ad campaigns
 * Triggers on: users/{userId}/brandProfiles/{profileId}/adCampaigns/{campaignId}
 */
exports.autoVectorizeAdCampaign = (0, firestore_1.onDocumentWritten)('users/{userId}/brandProfiles/{profileId}/adCampaigns/{campaignId}', async (event) => {
    var _a, _b, _c, _d;
    const change = event.data;
    const { userId, profileId, campaignId } = event.params;
    try {
        console.log(`[RAG Trigger] Ad campaign change detected: ${campaignId} for user: ${userId}`);
        if (!change) {
            console.log(`[RAG Trigger] No change data available`);
            return;
        }
        // Handle deletion
        if (!((_a = change.after) === null || _a === void 0 ? void 0 : _a.exists)) {
            console.log(`[RAG Trigger] Ad campaign deleted: ${campaignId}`);
            // TODO: Clean up related vectors
            return;
        }
        const campaignData = change.after.data();
        if (!campaignData) {
            console.log(`[RAG Trigger] No campaign data available`);
            return;
        }
        // Check if this is a significant change (for updates)
        if ((_b = change.before) === null || _b === void 0 ? void 0 : _b.exists) {
            const oldData = change.before.data();
            if (oldData) {
                const oldContent = `${oldData.campaignConcept || ''} ${((_c = oldData.headlines) === null || _c === void 0 ? void 0 : _c.join(' ')) || ''}`;
                const newContent = `${campaignData.campaignConcept || ''} ${((_d = campaignData.headlines) === null || _d === void 0 ? void 0 : _d.join(' ')) || ''}`;
                if (!(0, rag_auto_vectorizer_1.shouldReVectorize)(oldContent, newContent)) {
                    console.log(`[RAG Trigger] No significant changes in ad campaign: ${campaignId}`);
                    return;
                }
            }
        }
        await (0, rag_auto_vectorizer_1.vectorizeAdCampaign)(userId, campaignData, campaignId);
        console.log(`[RAG Trigger] Successfully processed ad campaign: ${campaignId}`);
    }
    catch (error) {
        console.error(`[RAG Trigger] Error processing ad campaign:`, error);
    }
});
/**
 * Auto-vectorize saved library images
 * Triggers on: users/{userId}/brandProfiles/{profileId}/savedLibraryImages/{imageId}
 */
exports.autoVectorizeSavedImage = (0, firestore_1.onDocumentWritten)('users/{userId}/brandProfiles/{profileId}/savedLibraryImages/{imageId}', async (event) => {
    var _a, _b;
    const change = event.data;
    const { userId, profileId, imageId } = event.params;
    try {
        console.log(`[RAG Trigger] Saved image change detected: ${imageId} for user: ${userId}`);
        if (!change) {
            console.log(`[RAG Trigger] No change data available`);
            return;
        }
        // Handle deletion
        if (!((_a = change.after) === null || _a === void 0 ? void 0 : _a.exists)) {
            console.log(`[RAG Trigger] Saved image deleted: ${imageId}`);
            // TODO: Clean up related vectors
            return;
        }
        const imageData = change.after.data();
        if (!imageData) {
            console.log(`[RAG Trigger] No image data available`);
            return;
        }
        // Check if this is a significant change (for updates)
        if ((_b = change.before) === null || _b === void 0 ? void 0 : _b.exists) {
            const oldData = change.before.data();
            if (oldData) {
                const oldContent = `${oldData.prompt || ''} ${oldData.style || ''}`;
                const newContent = `${imageData.prompt || ''} ${imageData.style || ''}`;
                if (!(0, rag_auto_vectorizer_1.shouldReVectorize)(oldContent, newContent)) {
                    console.log(`[RAG Trigger] No significant changes in saved image: ${imageId}`);
                    return;
                }
            }
        }
        await (0, rag_auto_vectorizer_1.vectorizeSavedImage)(userId, imageData, imageId);
        console.log(`[RAG Trigger] Successfully processed saved image: ${imageId}`);
    }
    catch (error) {
        console.error(`[RAG Trigger] Error processing saved image:`, error);
    }
});
/**
 * Auto-vectorize brand logos
 * Triggers on: users/{userId}/brandProfiles/{profileId}/brandLogos/{logoId}
 */
exports.autoVectorizeBrandLogo = (0, firestore_1.onDocumentWritten)('users/{userId}/brandProfiles/{profileId}/brandLogos/{logoId}', async (event) => {
    var _a;
    const change = event.data;
    const { userId, profileId, logoId } = event.params;
    try {
        console.log(`[RAG Trigger] Brand logo change detected: ${logoId} for user: ${userId}`);
        if (!change) {
            console.log(`[RAG Trigger] No change data available`);
            return;
        }
        // Handle deletion
        if (!((_a = change.after) === null || _a === void 0 ? void 0 : _a.exists)) {
            console.log(`[RAG Trigger] Brand logo deleted: ${logoId}`);
            // TODO: Clean up related vectors
            return;
        }
        const logoData = change.after.data();
        if (!logoData) {
            console.log(`[RAG Trigger] No logo data available`);
            return;
        }
        await (0, rag_auto_vectorizer_1.vectorizeBrandLogo)(userId, logoData, logoId);
        console.log(`[RAG Trigger] Successfully processed brand logo: ${logoId}`);
    }
    catch (error) {
        console.error(`[RAG Trigger] Error processing brand logo:`, error);
    }
});
/**
 * Cleanup old vectors periodically
 * Runs weekly to manage storage costs
 */
exports.cleanupOldVectors = (0, scheduler_1.onSchedule)('0 2 * * 0', // Every Sunday at 2 AM
async (event) => {
    try {
        console.log(`[RAG Cleanup] Starting weekly vector cleanup`);
        // Get all users
        const usersSnapshot = await db.collection('users').get();
        let cleanupCount = 0;
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            try {
                // Import ragEngine here to avoid circular dependencies
                const { ragEngine } = await Promise.resolve().then(() => require('../../src/lib/rag-engine'));
                await ragEngine.cleanupOldVectors(userId, 90); // Keep 90 days
                cleanupCount++;
            }
            catch (error) {
                console.error(`[RAG Cleanup] Error cleaning up vectors for user ${userId}:`, error);
            }
        }
        console.log(`[RAG Cleanup] Completed cleanup for ${cleanupCount} users`);
    }
    catch (error) {
        console.error(`[RAG Cleanup] Error in weekly cleanup:`, error);
    }
});
/**
 * Update user brand context when vectors change
 * This maintains a summary of user's brand context for faster retrieval
 */
exports.updateUserBrandContext = (0, firestore_1.onDocumentWritten)('users/{userId}/ragVectors/{vectorId}', async (event) => {
    var _a, _b;
    const change = event.data;
    const { userId } = event.params;
    try {
        console.log(`[RAG Context Update] Vector change detected for user: ${userId}`);
        if (!change) {
            console.log(`[RAG Context Update] No change data available`);
            return;
        }
        // Debounce: Only update context every 5 minutes to avoid excessive updates
        const contextDocRef = db.doc(`users/${userId}/ragContext/summary`);
        const contextDoc = await contextDocRef.get();
        if (contextDoc.exists) {
            const lastUpdate = (_b = (_a = contextDoc.data()) === null || _a === void 0 ? void 0 : _a.lastUpdated) === null || _b === void 0 ? void 0 : _b.toDate();
            const now = new Date();
            const timeDiff = now.getTime() - ((lastUpdate === null || lastUpdate === void 0 ? void 0 : lastUpdate.getTime()) || 0);
            // Skip if updated less than 5 minutes ago
            if (timeDiff < 5 * 60 * 1000) {
                console.log(`[RAG Context Update] Skipping update - too recent for user: ${userId}`);
                return;
            }
        }
        // Update brand context summary
        await contextDocRef.set({
            lastUpdated: new Date(),
            needsRefresh: true
        }, { merge: true });
        console.log(`[RAG Context Update] Marked context for refresh for user: ${userId}`);
    }
    catch (error) {
        console.error(`[RAG Context Update] Error updating brand context:`, error);
    }
});
//# sourceMappingURL=rag-triggers.js.map