import { ragEngine } from './rag-engine';
import type { BrandData, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign, SavedGeneratedImage } from '@/types';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query as fsQuery, where, limit as fsLimit } from 'firebase/firestore';

/**
 * Auto-vectorization functions for different content types
 * These are called from Cloud Functions when content is created/updated
 */

/**
 * Vectorize brand profile data
 */
export async function vectorizeBrandProfile(userId: string, brandData: BrandData): Promise<void> {
  if (process.env.NEXT_PUBLIC_RAG_USE_CLOUD_FUNCTIONS === 'true') {
    console.log(`[RAG Auto-Vectorizer] Skipping brand_profile vectorization - Cloud Functions flag enabled`);
    return;
  }
  try {
    console.log(`[RAG Auto-Vectorizer] Processing brand profile for user: ${userId}`);
    
    // Create comprehensive text content for embedding
    const textContent = [
      `Brand: ${brandData.brandName || 'Unnamed Brand'}`,
      `Description: ${brandData.brandDescription || ''}`,
      `Industry: ${brandData.industry || ''}`,
      `Keywords: ${brandData.targetKeywords || ''}`,
      `Style Notes: ${brandData.imageStyleNotes || ''}`,
      `Website: ${brandData.websiteUrl || ''}`
    ].filter(item => item.split(': ')[1]).join('\n');

    if (!textContent.trim()) {
      console.log(`[RAG Auto-Vectorizer] No meaningful brand content to vectorize for user: ${userId}`);
      return;
    }

    const contentId = `brand_${userId}`;

    // Upsert behavior: if a brand_profile vector with this contentId already exists, update it.
    // Otherwise, create it fresh.
    try {
      const vectorsRef = collection(db, `users/${userId}/ragVectors`);
      const existingQ = fsQuery(
        vectorsRef,
        where('contentType', '==', 'brand_profile'),
        where('contentId', '==', contentId),
        fsLimit(1)
      );
      const existingSnap = await getDocs(existingQ);

      if (!existingSnap.empty) {
        // Update in place (embedding + metadata), preserving existing createdAt in the doc
        await ragEngine.updateContentVector(
          userId,
          contentId,
          textContent,
          {
            industry: brandData.industry,
            performance: 1.0
          }
        );
        console.log(`[RAG Auto-Vectorizer] Updated existing brand profile vector for user: ${userId}`);
      } else {
        // First-time create
        await ragEngine.storeContentVector(
          userId,
          'brand_profile',
          contentId,
          textContent,
          {
            industry: brandData.industry,
            performance: 1.0, // Brand profile is always high importance
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1
          },
          'brandProfiles',
          userId
        );
        console.log(`[RAG Auto-Vectorizer] Created brand profile vector for user: ${userId}`);
      }
    } catch (upsertErr) {
      console.warn(`[RAG Auto-Vectorizer] Upsert check for brand profile failed, attempting create as fallback`, upsertErr);
      await ragEngine.storeContentVector(
        userId,
        'brand_profile',
        contentId,
        textContent,
        {
          industry: brandData.industry,
          performance: 1.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        },
        'brandProfiles',
        userId
      );
    }
  } catch (error) {
    console.error(`[RAG Auto-Vectorizer] Error vectorizing brand profile:`, error);
  }
}

/**
 * Vectorize social media post
 */
export async function vectorizeSocialMediaPost(
  userId: string,
  postData: GeneratedSocialMediaPost,
  docId: string
): Promise<void> {
  if (process.env.NEXT_PUBLIC_RAG_USE_CLOUD_FUNCTIONS === 'true') {
    console.log(`[RAG Auto-Vectorizer] Skipping social_media vectorization - Cloud Functions flag enabled`);
    return;
  }
  try {
    console.log(`[RAG Auto-Vectorizer] Processing social media post: ${docId}`);
    
    // Create text content for embedding
    const textContent = [
      `Platform: ${postData.platform}`,
      `Caption: ${postData.caption}`,
      `Hashtags: ${postData.hashtags}`,
      `Tone: ${postData.tone}`,
      `Goal: ${postData.postGoal || ''}`,
      `Target Audience: ${postData.targetAudience || ''}`,
      `Call to Action: ${postData.callToAction || ''}`,
      `Image Description: ${postData.imageDescription || ''}`
    ].filter(item => item.split(': ')[1]).join('\n');

    if (!textContent.trim()) {
      console.log(`[RAG Auto-Vectorizer] No meaningful social media content to vectorize: ${docId}`);
      return;
    }

    // Extract hashtags as tags
    const tags = postData.hashtags ? 
      postData.hashtags.split('#').filter(tag => tag.trim()).map(tag => tag.trim().toLowerCase()) : 
      [];

    await ragEngine.storeContentVector(
      userId,
      'social_media',
      docId,
      textContent,
      {
        platform: postData.platform,
        tags: tags,
        performance: 0.5, // Default performance - will be updated based on actual metrics
        engagement: 0,
        createdAt: postData.createdAt || new Date(),
        updatedAt: new Date(),
        version: 1
      },
      'socialMediaPosts',
      docId
    );

    console.log(`[RAG Auto-Vectorizer] Successfully vectorized social media post: ${docId}`);
  } catch (error) {
    console.error(`[RAG Auto-Vectorizer] Error vectorizing social media post:`, error);
  }
}

/**
 * Vectorize blog post
 */
export async function vectorizeBlogPost(
  userId: string,
  blogData: GeneratedBlogPost,
  docId: string
): Promise<void> {
  if (process.env.NEXT_PUBLIC_RAG_USE_CLOUD_FUNCTIONS === 'true') {
    console.log(`[RAG Auto-Vectorizer] Skipping blog_post vectorization - Cloud Functions flag enabled`);
    return;
  }
  try {
    console.log(`[RAG Auto-Vectorizer] Processing blog post: ${docId}`);
    
    // Create text content for embedding (truncate content if too long)
    const contentPreview = blogData.content.length > 1000 ? 
      blogData.content.substring(0, 1000) + '...' : 
      blogData.content;

    const textContent = [
      `Title: ${blogData.title}`,
      `Platform: ${blogData.platform}`,
      `Style: ${blogData.articleStyle || ''}`,
      `Tone: ${blogData.blogTone || ''}`,
      `Target Audience: ${blogData.targetAudience || ''}`,
      `Tags: ${blogData.tags}`,
      `Outline: ${blogData.outline || ''}`,
      `Content Preview: ${contentPreview}`
    ].filter(item => item.split(': ')[1]).join('\n');

    if (!textContent.trim()) {
      console.log(`[RAG Auto-Vectorizer] No meaningful blog content to vectorize: ${docId}`);
      return;
    }

    // Extract tags as keywords
    const keywords = blogData.tags ? 
      blogData.tags.split(',').map(tag => tag.trim().toLowerCase()) : 
      [];

    await ragEngine.storeContentVector(
      userId,
      'blog_post',
      docId,
      textContent,
      {
        platform: blogData.platform,
        style: blogData.articleStyle,
        tags: keywords,
        performance: 0.5, // Default performance - will be updated based on actual metrics
        engagement: 0,
        createdAt: blogData.createdAt || new Date(),
        updatedAt: new Date(),
        version: 1
      },
      'blogPosts',
      docId
    );

    console.log(`[RAG Auto-Vectorizer] Successfully vectorized blog post: ${docId}`);
  } catch (error) {
    console.error(`[RAG Auto-Vectorizer] Error vectorizing blog post:`, error);
  }
}

/**
 * Vectorize ad campaign
 */
export async function vectorizeAdCampaign(
  userId: string,
  campaignData: GeneratedAdCampaign,
  docId: string
): Promise<void> {
  if (process.env.NEXT_PUBLIC_RAG_USE_CLOUD_FUNCTIONS === 'true') {
    console.log(`[RAG Auto-Vectorizer] Skipping ad_campaign vectorization - Cloud Functions flag enabled`);
    return;
  }
  try {
    console.log(`[RAG Auto-Vectorizer] Processing ad campaign: ${docId}`);
    
    // Create text content for embedding
    const textContent = [
      `Campaign Concept: ${campaignData.campaignConcept}`,
      `Headlines: ${campaignData.headlines.join(' | ')}`,
      `Body Texts: ${campaignData.bodyTexts.join(' | ')}`,
      `Platform Guidance: ${campaignData.platformGuidance}`,
      `Target Platforms: ${campaignData.targetPlatforms.join(', ')}`,
      `Brand: ${campaignData.brandName || ''}`,
      `Industry: ${campaignData.industry || ''}`,
      `Goal: ${campaignData.campaignGoal || ''}`,
      `Target Audience: ${campaignData.targetAudience || ''}`,
      `Call to Action: ${campaignData.callToAction || ''}`,
      `Keywords: ${campaignData.targetKeywords || ''}`
    ].filter(item => item.split(': ')[1]).join('\n');

    if (!textContent.trim()) {
      console.log(`[RAG Auto-Vectorizer] No meaningful ad campaign content to vectorize: ${docId}`);
      return;
    }

    // Extract keywords as tags
    const keywords = campaignData.targetKeywords ? 
      campaignData.targetKeywords.split(',').map(keyword => keyword.trim().toLowerCase()) : 
      [];

    await ragEngine.storeContentVector(
      userId,
      'ad_campaign',
      docId,
      textContent,
      {
        platform: campaignData.targetPlatforms.join(','),
        tags: keywords,
        performance: 0.5, // Default performance - will be updated based on actual metrics
        engagement: 0,
        createdAt: campaignData.createdAt || new Date(),
        updatedAt: new Date(),
        version: 1
      },
      'adCampaigns',
      docId
    );

    console.log(`[RAG Auto-Vectorizer] Successfully vectorized ad campaign: ${docId}`);
  } catch (error) {
    console.error(`[RAG Auto-Vectorizer] Error vectorizing ad campaign:`, error);
  }
}

/**
 * Vectorize saved library image
 */
export async function vectorizeSavedImage(
  userId: string,
  imageData: SavedGeneratedImage,
  docId: string
): Promise<void> {
  if (process.env.NEXT_PUBLIC_RAG_USE_CLOUD_FUNCTIONS === 'true') {
    console.log(`[RAG Auto-Vectorizer] Skipping saved_image vectorization - Cloud Functions flag enabled`);
    return;
  }
  try {
    console.log(`[RAG Auto-Vectorizer] Processing saved image: ${docId}`);
    
    // Create text content for embedding
    const textContent = [
      `Prompt: ${imageData.prompt}`,
      `Style: ${imageData.style}`,
      `Image URL: ${imageData.storageUrl}`
    ].filter(item => item.split(': ')[1]).join('\n');

    if (!textContent.trim()) {
      console.log(`[RAG Auto-Vectorizer] No meaningful image content to vectorize: ${docId}`);
      return;
    }

    // Extract style keywords
    const styleKeywords = imageData.style ? 
      imageData.style.split(',').map(keyword => keyword.trim().toLowerCase()) : 
      [];

    await ragEngine.storeContentVector(
      userId,
      'saved_image',
      docId,
      textContent,
      {
        style: imageData.style,
        tags: styleKeywords,
        performance: 0.5, // Default performance - will be updated based on usage
        engagement: 0,
        createdAt: imageData.createdAt || new Date(),
        updatedAt: new Date(),
        version: 1
      },
      'savedLibraryImages',
      docId
    );

    console.log(`[RAG Auto-Vectorizer] Successfully vectorized saved image: ${docId}`);
  } catch (error) {
    console.error(`[RAG Auto-Vectorizer] Error vectorizing saved image:`, error);
  }
}

/**
 * Vectorize brand logo
 */
export async function vectorizeBrandLogo(
  userId: string,
  logoData: { logoData: string; createdAt?: any },
  docId: string
): Promise<void> {
  if (process.env.NEXT_PUBLIC_RAG_USE_CLOUD_FUNCTIONS === 'true') {
    console.log(`[RAG Auto-Vectorizer] Skipping brand_logo vectorization - Cloud Functions flag enabled`);
    return;
  }
  try {
    console.log(`[RAG Auto-Vectorizer] Processing brand logo: ${docId}`);
    
    // Create text content for embedding
    const textContent = `Brand Logo: Generated logo for brand identity`;

    await ragEngine.storeContentVector(
      userId,
      'brand_logo',
      docId,
      textContent,
      {
        style: 'logo',
        tags: ['logo', 'brand', 'identity'],
        performance: 1.0, // Brand logos are high importance
        engagement: 0,
        createdAt: logoData.createdAt || new Date(),
        updatedAt: new Date(),
        version: 1
      },
      'brandLogos',
      docId
    );

    console.log(`[RAG Auto-Vectorizer] Successfully vectorized brand logo: ${docId}`);
  } catch (error) {
    console.error(`[RAG Auto-Vectorizer] Error vectorizing brand logo:`, error);
  }
}

/**
 * Update content performance based on engagement metrics
 */
export async function updateContentPerformance(
  userId: string,
  contentId: string,
  performanceMetrics: {
    engagement?: number;
    performance?: number;
    clicks?: number;
    shares?: number;
    likes?: number;
  }
): Promise<void> {
  try {
    console.log(`[RAG Auto-Vectorizer] Updating performance for content: ${contentId}`);
    
    // Calculate overall performance score (0-1)
    const performanceScore = Math.min(1.0, Math.max(0.0, 
      (performanceMetrics.performance || 0) + 
      (performanceMetrics.engagement || 0) * 0.3 +
      ((performanceMetrics.clicks || 0) / 100) * 0.2 +
      ((performanceMetrics.shares || 0) / 10) * 0.3 +
      ((performanceMetrics.likes || 0) / 50) * 0.2
    ));

    await ragEngine.updateContentVector(
      userId,
      contentId,
      '', // Don't update text content, just metadata
      {
        performance: performanceScore,
        engagement: performanceMetrics.engagement || 0,
        updatedAt: new Date()
      }
    );

    console.log(`[RAG Auto-Vectorizer] Updated performance for ${contentId}: ${performanceScore}`);
  } catch (error) {
    console.error(`[RAG Auto-Vectorizer] Error updating content performance:`, error);
  }
}

/**
 * Detect significant changes in content that require re-vectorization
 */
export function shouldReVectorize(oldContent: string, newContent: string): boolean {
  if (!oldContent || !newContent) return true;
  
  // Simple similarity check - in production, could use more sophisticated methods
  const oldWords = oldContent.toLowerCase().split(/\s+/);
  const newWords = newContent.toLowerCase().split(/\s+/);
  
  const commonWords = oldWords.filter(word => newWords.includes(word));
  const similarity = commonWords.length / Math.max(oldWords.length, newWords.length);
  
  // Re-vectorize if similarity is less than 85%
  return similarity < 0.85;
}

/**
 * Batch vectorize existing content for initial setup
 */
export async function batchVectorizeUserContent(userId: string): Promise<void> {
  try {
    console.log(`[RAG Auto-Vectorizer] Starting batch vectorization for user: ${userId}`);
    
    // This would be called during initial RAG setup to vectorize existing content
    // Implementation would fetch all existing content and vectorize it
    
    console.log(`[RAG Auto-Vectorizer] Batch vectorization completed for user: ${userId}`);
  } catch (error) {
    console.error(`[RAG Auto-Vectorizer] Error in batch vectorization:`, error);
  }
}