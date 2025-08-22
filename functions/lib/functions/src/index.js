"use strict";
/**
 * Firebase Cloud Functions Entry Point
 *
 * This file exports all RAG (Retrieval-Augmented Generation) trigger functions
 * for automatic vectorization of user content when created or updated.
 *
 * Auto-vectorization triggers:
 * - Brand profiles
 * - Social media posts
 * - Blog posts
 * - Ad campaigns
 * - Saved images
 * - Brand logos
 *
 * Maintenance functions:
 * - Cleanup old vectors
 * - Update user brand context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserBrandContext = exports.cleanupOldVectors = exports.autoVectorizeBrandLogo = exports.autoVectorizeSavedImage = exports.autoVectorizeAdCampaign = exports.autoVectorizeBlogPost = exports.autoVectorizeSocialMediaPost = exports.autoVectorizeBrandProfile = void 0;
// Export all RAG trigger functions for Firebase deployment
var rag_triggers_1 = require("./rag-triggers");
Object.defineProperty(exports, "autoVectorizeBrandProfile", { enumerable: true, get: function () { return rag_triggers_1.autoVectorizeBrandProfile; } });
Object.defineProperty(exports, "autoVectorizeSocialMediaPost", { enumerable: true, get: function () { return rag_triggers_1.autoVectorizeSocialMediaPost; } });
Object.defineProperty(exports, "autoVectorizeBlogPost", { enumerable: true, get: function () { return rag_triggers_1.autoVectorizeBlogPost; } });
Object.defineProperty(exports, "autoVectorizeAdCampaign", { enumerable: true, get: function () { return rag_triggers_1.autoVectorizeAdCampaign; } });
Object.defineProperty(exports, "autoVectorizeSavedImage", { enumerable: true, get: function () { return rag_triggers_1.autoVectorizeSavedImage; } });
Object.defineProperty(exports, "autoVectorizeBrandLogo", { enumerable: true, get: function () { return rag_triggers_1.autoVectorizeBrandLogo; } });
Object.defineProperty(exports, "cleanupOldVectors", { enumerable: true, get: function () { return rag_triggers_1.cleanupOldVectors; } });
Object.defineProperty(exports, "updateUserBrandContext", { enumerable: true, get: function () { return rag_triggers_1.updateUserBrandContext; } });
//# sourceMappingURL=index.js.map