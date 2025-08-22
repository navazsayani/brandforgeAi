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

// Export all RAG trigger functions for Firebase deployment
export {
  autoVectorizeBrandProfile,
  autoVectorizeSocialMediaPost,
  autoVectorizeBlogPost,
  autoVectorizeAdCampaign,
  autoVectorizeSavedImage,
  autoVectorizeBrandLogo,
  cleanupOldVectors,
  updateUserBrandContext
} from './rag-triggers';