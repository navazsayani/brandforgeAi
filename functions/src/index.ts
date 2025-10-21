/**
 * Firebase Cloud Functions Entry Point
 *
 * This file exports Cloud Functions for:
 * 1. Email Activation Scheduler (NEW - separate from RAG)
 * 2. User Backfill Functions (ONE-TIME - for existing users)
 * 3. RAG (Retrieval-Augmented Generation) maintenance functions
 *
 * EMAIL ACTIVATION SCHEDULER (ACTIVE):
 * - sendActivationEmails: Scheduled function runs every hour, sends activation emails
 *   to users based on signup time and activity status
 *
 * USER BACKFILL (ONE-TIME):
 * - backfillExistingUsers: Callable function to add userActivity to existing users
 * - backfillExistingUsersHTTP: HTTP endpoint version for easier testing
 *
 * RAG Auto-vectorization triggers (TEMPORARILY DISABLED):
 * - Brand profiles, social posts, blog posts, ad campaigns, images, logos
 * - DISABLED to prevent duplicate vectorization (handled in actions.ts)
 *
 * RAG Maintenance functions (ACTIVE):
 * - cleanupOldVectors: Clean up old vector embeddings
 * - updateUserBrandContext: Update user brand context
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

// RAG maintenance functions - DISABLED on 2025-10-20
// These Gen 2 functions fail with Cloud Run container healthcheck errors
// - updateUserBrandContext: Creates ragContext/summary documents that are never read
// - cleanupOldVectors: Weekly cleanup that can be re-enabled if RAG is fully activated
// export {
//   cleanupOldVectors,
//   updateUserBrandContext
// } from './rag-triggers';

// Email activation scheduler (separate from RAG functions)
export {
  sendActivationEmails
} from './email-scheduler';

// One-time backfill functions for existing users
// DISABLED on 2025-10-20 - Backfill completed successfully (27 users updated with reset signup dates)
// export {
//   backfillExistingUsers,
//   backfillExistingUsersHTTP
// } from './backfill-existing-users';