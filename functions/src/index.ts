/**
 * Firebase Cloud Functions Entry Point
 *
 * This file exports all RAG (Retrieval-Augmented Generation) trigger functions
 * for automatic vectorization of user content when created or updated.
 *
 * TEMPORARY CHANGE: Auto-vectorization triggers are DISABLED to prevent duplicate
 * vectorization calls since actions.ts is handling vectorization on the client side.
 *
 * Auto-vectorization triggers (TEMPORARILY DISABLED):
 * - Brand profiles
 * - Social media posts
 * - Blog posts
 * - Ad campaigns
 * - Saved images
 * - Brand logos
 *
 * Maintenance functions (ACTIVE):
 * - Cleanup old vectors
 * - Update user brand context
 */

// TEMPORARY: Comment out auto-vectorization triggers to prevent duplicate calls
// Uncomment these when you want to re-enable Cloud Function vectorization
// export {
//   autoVectorizeBrandProfile,
//   autoVectorizeSocialMediaPost,
//   autoVectorizeBlogPost,
//   autoVectorizeAdCampaign,
//   autoVectorizeSavedImage,
//   autoVectorizeBrandLogo,
// } from './rag-triggers';

// Keep maintenance functions active
export {
  cleanupOldVectors,
  updateUserBrandContext
} from './rag-triggers';