# RAG Cloud Functions Status

## Current Status: AUTO-VECTORIZATION DISABLED ⚠️

**Date Modified**: 2025-08-22  
**Reason**: Preventing duplicate vectorization calls since `actions.ts` is handling vectorization on the client side.

## What's Disabled

The following Cloud Function triggers are temporarily commented out in `functions/src/index.ts`:

- `autoVectorizeBrandProfile` - Brand profile vectorization
- `autoVectorizeSocialMediaPost` - Social media post vectorization  
- `autoVectorizeBlogPost` - Blog post vectorization
- `autoVectorizeAdCampaign` - Ad campaign vectorization
- `autoVectorizeSavedImage` - Saved image vectorization
- `autoVectorizeBrandLogo` - Brand logo vectorization

## What's Still Active

These maintenance functions remain active:

- `cleanupOldVectors` - Weekly cleanup of old vectors
- `updateUserBrandContext` - Updates user brand context when vectors change

## Cost Impact

**Expected Savings**: ~50% reduction in embedding API calls by eliminating duplicate vectorization.

## Re-enabling Cloud Functions

To re-enable the auto-vectorization triggers:

1. Open `functions/src/index.ts`
2. Uncomment the export block for auto-vectorization functions:
   ```typescript
   export {
     autoVectorizeBrandProfile,
     autoVectorizeSocialMediaPost,
     autoVectorizeBlogPost,
     autoVectorizeAdCampaign,
     autoVectorizeSavedImage,
     autoVectorizeBrandLogo,
   } from './rag-triggers';
   ```
3. **IMPORTANT**: If re-enabling Cloud Functions, remove the vectorization calls from `src/lib/actions.ts` to prevent duplicate calls
4. Deploy the functions: `firebase deploy --only functions`

## Monitoring

Monitor your RAG costs in the admin dashboard to verify the cost reduction is working as expected.

## Rollback Plan

If any issues occur with client-side vectorization:

1. Quickly re-enable Cloud Functions by uncommenting the exports
2. Deploy immediately: `firebase deploy --only functions`
3. The Cloud Functions will serve as backup vectorization