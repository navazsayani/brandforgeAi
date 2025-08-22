import { ragEngine } from './rag-engine';

/**
 * Auto-vectorization functions for different content types
 * These are called from Cloud Functions when content is created/updated
 */

// Types for the functions environment
interface BrandData {
  brandName?: string;
  brandDescription?: string;
  industry?: string;
  targetKeywords?: string;
  imageStyleNotes?: string;
  websiteUrl?: string;
}

interface GeneratedSocialMediaPost {
  platform: string;
  caption: string;
  hashtags: string;
  tone: string;
  postGoal?: string;
  targetAudience?: string;
  callToAction?: string;
  imageDescription?: string;
  createdAt?: any;
}

interface GeneratedBlogPost {
  title: string;
  content: string;
  platform: string;
  articleStyle?: string;
  blogTone?: string;
  targetAudience?: string;
  tags: string;
  outline?: string;
  createdAt?: any;
}

interface GeneratedAdCampaign {
  campaignConcept: string;
  headlines: string[];
  bodyTexts: string[];
  platformGuidance: string;
  targetPlatforms: string[];
  brandName?: string;
  industry?: string;
  campaignGoal?: string;
  targetAudience?: string;
  callToAction?: string;
  targetKeywords?: string;
  createdAt?: any;
}

interface SavedGeneratedImage {
  prompt: string;
  style: string;
  storageUrl: string;
  createdAt?: any;
}

/**
 * Vectorize brand profile data
 */
export async function vectorizeBrandProfile(userId: string, brandData: BrandData): Promise<void> {
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

    await ragEngine.storeContentVector(
      userId,
      'brand_profile',
      `brand_${userId}`, // Unique content ID
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

    console.log(`[RAG Auto-Vectorizer] Successfully vectorized brand profile for user: ${userId}`);
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