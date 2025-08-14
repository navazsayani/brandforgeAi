import { ragEngine } from './rag-engine';
import { feedbackService } from './feedback-service';
import type { RAGContext, RAGRetrievalOptions } from './rag-engine';
import type { RAGInsight } from '@/types/feedback';

/**
 * RAG Integration Layer
 * This module provides functions to enhance existing AI flows with RAG context
 */

/**
 * Enhance prompt with RAG context for image generation
 */
export async function enhanceImageGenerationPrompt(
  userId: string,
  basePrompt: string,
  input: {
    brandDescription?: string;
    industry?: string;
    imageStyle?: string;
    exampleImage?: string;
  }
): Promise<string> {
  try {
    console.log(`[RAG Integration] Enhancing image generation prompt for user: ${userId}`);
    
    // Create query text for RAG retrieval
    const queryText = `${input.brandDescription || ''} ${input.imageStyle || ''} image generation`;
    
    // Retrieve relevant context
    const ragContext = await ragEngine.retrieveRelevantContext(queryText, {
      userId,
      contentType: 'saved_image',
      industry: input.industry,
      minPerformance: 0.6,
      limit: 8,
      includeIndustryPatterns: true,
      timeframe: 'recent'
    });
    
    // Build enhanced prompt
    let enhancedPrompt = basePrompt;
    
    if (ragContext.brandPatterns) {
      enhancedPrompt += `\n\nBRAND CONTEXT (from your successful content):\n${ragContext.brandPatterns}`;
    }
    
    if (ragContext.successfulStyles) {
      enhancedPrompt += `\n\nPROVEN SUCCESSFUL STYLES:\n${ragContext.successfulStyles}`;
    }
    
    if (ragContext.avoidPatterns) {
      enhancedPrompt += `\n\nAVOID THESE PATTERNS (performed poorly):\n${ragContext.avoidPatterns}`;
    }
    
    if (ragContext.seasonalTrends) {
      enhancedPrompt += `\n\nCURRENT SEASONAL TRENDS:\n${ragContext.seasonalTrends}`;
    }
    
    if (ragContext.performanceInsights) {
      enhancedPrompt += `\n\nPERFORMANCE INSIGHTS:\n${ragContext.performanceInsights}`;
    }
    
    console.log(`[RAG Integration] Successfully enhanced image generation prompt`);
    return enhancedPrompt;
    
  } catch (error) {
    console.error(`[RAG Integration] Error enhancing image generation prompt:`, error);
    // Return original prompt on error - don't break generation
    return basePrompt;
  }
}

/**
 * Enhance prompt with RAG context for social media caption generation
 */
export async function enhanceSocialMediaPrompt(
  userId: string,
  basePrompt: string,
  input: {
    brandDescription?: string;
    industry?: string;
    platform?: string;
    tone?: string;
    postGoal?: string;
  }
): Promise<string> {
  try {
    console.log(`[RAG Integration] Enhancing social media prompt for user: ${userId}`);
    
    // Create query text for RAG retrieval
    const queryText = `${input.brandDescription || ''} ${input.platform || ''} social media ${input.tone || ''}`;
    
    // Retrieve relevant context
    const ragContext = await ragEngine.retrieveRelevantContext(queryText, {
      userId,
      contentType: 'social_media',
      industry: input.industry,
      minPerformance: 0.7,
      limit: 10,
      includeIndustryPatterns: true,
      timeframe: '30days'
    });
    
    // Build enhanced prompt
    let enhancedPrompt = basePrompt;
    
    if (ragContext.brandPatterns) {
      enhancedPrompt += `\n\nBRAND VOICE CONTEXT:\n${ragContext.brandPatterns}`;
    }
    
    if (ragContext.voicePatterns) {
      enhancedPrompt += `\n\nSUCCESSFUL VOICE PATTERNS:\n${ragContext.voicePatterns}`;
    }
    
    if (ragContext.effectiveHashtags) {
      enhancedPrompt += `\n\nEFFECTIVE HASHTAGS FOR YOUR BRAND:\n${ragContext.effectiveHashtags}`;
    }
    
    if (ragContext.seasonalTrends) {
      enhancedPrompt += `\n\nCURRENT TRENDS:\n${ragContext.seasonalTrends}`;
    }
    
    if (ragContext.performanceInsights) {
      enhancedPrompt += `\n\nPERFORMANCE INSIGHTS:\n${ragContext.performanceInsights}`;
    }
    
    console.log(`[RAG Integration] Successfully enhanced social media prompt`);
    return enhancedPrompt;
    
  } catch (error) {
    console.error(`[RAG Integration] Error enhancing social media prompt:`, error);
    return basePrompt;
  }
}

/**
 * Enhance prompt with RAG context for blog content generation
 */
export async function enhanceBlogContentPrompt(
  userId: string,
  basePrompt: string,
  input: {
    brandDescription?: string;
    industry?: string;
    topic?: string;
    targetAudience?: string;
    blogTone?: string;
  }
): Promise<string> {
  try {
    console.log(`[RAG Integration] Enhancing blog content prompt for user: ${userId}`);
    
    // Create query text for RAG retrieval
    const queryText = `${input.brandDescription || ''} ${input.topic || ''} blog content ${input.blogTone || ''}`;
    
    // Retrieve relevant context
    const ragContext = await ragEngine.retrieveRelevantContext(queryText, {
      userId,
      contentType: 'blog_post',
      industry: input.industry,
      minPerformance: 0.6,
      limit: 8,
      includeIndustryPatterns: true,
      timeframe: '90days'
    });
    
    // Build enhanced prompt
    let enhancedPrompt = basePrompt;
    
    if (ragContext.brandPatterns) {
      enhancedPrompt += `\n\nBRAND WRITING STYLE:\n${ragContext.brandPatterns}`;
    }
    
    if (ragContext.successfulStyles) {
      enhancedPrompt += `\n\nSUCCESSFUL CONTENT APPROACHES:\n${ragContext.successfulStyles}`;
    }
    
    if (ragContext.seoKeywords) {
      enhancedPrompt += `\n\nEFFECTIVE SEO KEYWORDS FOR YOUR BRAND:\n${ragContext.seoKeywords}`;
    }
    
    if (ragContext.seasonalTrends) {
      enhancedPrompt += `\n\nCURRENT CONTENT TRENDS:\n${ragContext.seasonalTrends}`;
    }
    
    if (ragContext.performanceInsights) {
      enhancedPrompt += `\n\nCONTENT PERFORMANCE INSIGHTS:\n${ragContext.performanceInsights}`;
    }
    
    console.log(`[RAG Integration] Successfully enhanced blog content prompt`);
    return enhancedPrompt;
    
  } catch (error) {
    console.error(`[RAG Integration] Error enhancing blog content prompt:`, error);
    return basePrompt;
  }
}

/**
 * Enhance prompt with RAG context for ad campaign generation
 */
export async function enhanceAdCampaignPrompt(
  userId: string,
  basePrompt: string,
  input: {
    brandDescription?: string;
    industry?: string;
    campaignGoal?: string;
    targetAudience?: string;
    targetPlatforms?: string[];
  }
): Promise<string> {
  try {
    console.log(`[RAG Integration] Enhancing ad campaign prompt for user: ${userId}`);
    
    // Create query text for RAG retrieval
    const queryText = `${input.brandDescription || ''} ${input.campaignGoal || ''} advertising campaign`;
    
    // Retrieve relevant context
    const ragContext = await ragEngine.retrieveRelevantContext(queryText, {
      userId,
      contentType: 'ad_campaign',
      industry: input.industry,
      minPerformance: 0.7,
      limit: 6,
      includeIndustryPatterns: true,
      timeframe: '90days'
    });
    
    // Build enhanced prompt
    let enhancedPrompt = basePrompt;
    
    if (ragContext.brandPatterns) {
      enhancedPrompt += `\n\nBRAND MESSAGING CONTEXT:\n${ragContext.brandPatterns}`;
    }
    
    if (ragContext.successfulStyles) {
      enhancedPrompt += `\n\nSUCCESSFUL CAMPAIGN APPROACHES:\n${ragContext.successfulStyles}`;
    }
    
    if (ragContext.avoidPatterns) {
      enhancedPrompt += `\n\nAVOID THESE MESSAGING PATTERNS:\n${ragContext.avoidPatterns}`;
    }
    
    if (ragContext.seasonalTrends) {
      enhancedPrompt += `\n\nCURRENT MARKETING TRENDS:\n${ragContext.seasonalTrends}`;
    }
    
    if (ragContext.performanceInsights) {
      enhancedPrompt += `\n\nCAMPAIGN PERFORMANCE INSIGHTS:\n${ragContext.performanceInsights}`;
    }
    
    console.log(`[RAG Integration] Successfully enhanced ad campaign prompt`);
    return enhancedPrompt;
    
  } catch (error) {
    console.error(`[RAG Integration] Error enhancing ad campaign prompt:`, error);
    return basePrompt;
  }
}

/**
 * Get smart form suggestions based on user's successful content
 */
export async function getSmartFormSuggestions(
  userId: string,
  contentType: 'image' | 'social_media' | 'blog_post' | 'ad_campaign',
  input: {
    brandDescription?: string;
    industry?: string;
  }
): Promise<{
  suggestedStyles: string[];
  suggestedTones: string[];
  suggestedKeywords: string[];
  suggestedHashtags: string[];
  seasonalSuggestions: string[];
  performanceTips: string[];
}> {
  try {
    console.log(`[RAG Integration] Getting smart suggestions for ${contentType} - user: ${userId}`);
    
    // Create query text for RAG retrieval
    const queryText = `${input.brandDescription || ''} ${contentType} suggestions`;
    
    // Retrieve relevant context
    const ragContext = await ragEngine.retrieveRelevantContext(queryText, {
      userId,
      contentType: contentType === 'image' ? 'saved_image' : contentType,
      industry: input.industry,
      minPerformance: 0.6,
      limit: 15,
      includeIndustryPatterns: false, // Focus on user's own successful patterns
      timeframe: 'all'
    });
    
    // Extract suggestions from context
    const suggestions = {
      suggestedStyles: extractListFromText(ragContext.successfulStyles, 5),
      suggestedTones: extractTonesFromContext(ragContext.voicePatterns || '', 4),
      suggestedKeywords: extractListFromText(ragContext.seoKeywords || '', 8),
      suggestedHashtags: extractHashtagsFromText(ragContext.effectiveHashtags || '', 10),
      seasonalSuggestions: extractListFromText(ragContext.seasonalTrends, 3),
      performanceTips: extractTipsFromText(ragContext.performanceInsights || '', 3)
    };
    
    console.log(`[RAG Integration] Generated smart suggestions for ${contentType}`);
    return suggestions;
    
  } catch (error) {
    console.error(`[RAG Integration] Error getting smart suggestions:`, error);
    
    // Return empty suggestions on error
    return {
      suggestedStyles: [],
      suggestedTones: [],
      suggestedKeywords: [],
      suggestedHashtags: [],
      seasonalSuggestions: [],
      performanceTips: []
    };
  }
}

/**
 * Store content result for future RAG enhancement
 */
export async function storeContentForRAG(
  userId: string,
  contentType: 'image' | 'social_media' | 'blog_post' | 'ad_campaign' | 'brand_logo',
  contentId: string,
  content: {
    prompt?: string;
    result?: string;
    style?: string;
    metadata?: any;
  }
): Promise<{ success: boolean; rateLimited?: boolean; message?: string }> {
  try {
    console.log(`[RAG Integration] Storing content for future RAG: ${contentType} - ${contentId}`);
    
    // Create text content for vectorization
    const textContent = [
      content.prompt ? `Prompt: ${content.prompt}` : '',
      content.result ? `Result: ${content.result.substring(0, 500)}` : '',
      content.style ? `Style: ${content.style}` : '',
      content.metadata ? `Context: ${JSON.stringify(content.metadata).substring(0, 200)}` : ''
    ].filter(Boolean).join('\n');
    
    if (!textContent.trim()) {
      console.log(`[RAG Integration] No meaningful content to store for RAG`);
      return { success: false, message: 'No meaningful content to store' };
    }
    
    // Map content type to RAG content type
    const ragContentType = contentType === 'image' ? 'saved_image' : contentType;
    
    await ragEngine.storeContentVector(
      userId,
      ragContentType as any,
      contentId,
      textContent,
      {
        style: content.style,
        performance: 0.5, // Default performance - will be updated based on actual metrics
        engagement: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      },
      'generated_content', // Source collection
      contentId
    );
    
    console.log(`[RAG Integration] Successfully stored content for RAG: ${contentId}`);
    return { success: true };
    
  } catch (error: any) {
    console.error(`[RAG Integration] Error storing content for RAG:`, error);
    
    // Check if it's a rate limit error
    if (error.message?.includes('rate limit')) {
      console.warn(`[RAG Integration] Rate limit hit for user ${userId}: ${error.message}`);
      return {
        success: false,
        rateLimited: true,
        message: error.message
      };
    }
    
    // Don't throw - RAG storage failures shouldn't break content generation
    return { success: false, message: error.message || 'Unknown error' };
  }
}

/**
 * Update RAG vector performance based on user feedback
 */
export async function updateRAGPerformanceFromFeedback(
  userId: string,
  contentId: string,
  rating: number,
  wasRAGEnhanced: boolean,
  ragContextUsed?: string[]
): Promise<void> {
  try {
    if (!wasRAGEnhanced) return;

    console.log(`[RAG Integration] Updating performance for content: ${contentId}, rating: ${rating}`);
    
    // Convert rating to performance score (1-5 stars -> 0.2-1.0)
    const performanceScore = rating / 5;
    
    // Update the content vector's performance metadata
    await ragEngine.updateContentVector(
      userId,
      contentId,
      '', // Don't change text content
      {
        performance: performanceScore,
        updatedAt: new Date()
      }
    );

    console.log(`[RAG Integration] Updated vector performance: ${performanceScore}`);
  } catch (error) {
    console.error(`[RAG Integration] Error updating RAG performance:`, error);
  }
}

/**
 * Create RAG insights from context for UI display
 */
export function createRAGInsightsFromContext(ragContext: RAGContext): RAGInsight[] {
  const insights: RAGInsight[] = [];

  if (ragContext.brandPatterns) {
    insights.push({
      type: 'brand_patterns',
      description: 'Using your established brand voice and messaging patterns',
      confidence: 0.85,
      isActive: true
    });
  }

  if (ragContext.voicePatterns) {
    insights.push({
      type: 'voice_patterns',
      description: 'Applying your most engaging communication style',
      confidence: 0.78,
      isActive: true
    });
  }

  if (ragContext.effectiveHashtags) {
    const hashtagCount = ragContext.effectiveHashtags.split('#').length - 1;
    if (hashtagCount > 0) {
      insights.push({
        type: 'hashtags',
        description: `Suggesting ${hashtagCount} of your best-performing hashtags`,
        confidence: 0.82,
        isActive: true
      });
    }
  }

  if (ragContext.successfulStyles) {
    insights.push({
      type: 'styles',
      description: 'Using visual and content styles from your top posts',
      confidence: 0.75,
      isActive: true
    });
  }

  if (ragContext.performanceInsights) {
    insights.push({
      type: 'performance',
      description: 'Optimized based on your content performance data',
      confidence: 0.88,
      isActive: true
    });
  }

  return insights;
}

/**
 * Enhanced context retrieval that adapts based on user feedback
 */
export async function getAdaptiveRAGContext(
  userId: string,
  queryText: string,
  options: RAGRetrievalOptions
): Promise<{ context: RAGContext; insights: RAGInsight[] }> {
  try {
    // Get user's performance metrics to adapt retrieval
    const performanceMetrics = await feedbackService.getPerformanceMetrics(userId);
    const patternStats = await feedbackService.getPatternStats(userId);
    
    // Adjust retrieval options based on feedback history
    const adaptedOptions = {
      ...options,
      // Higher performance threshold for users who give good feedback
      minPerformance: performanceMetrics && performanceMetrics.avgRatingRAG > 4 ? 0.8 : 0.6,
      // More context for engaged users
      limit: performanceMetrics && performanceMetrics.totalFeedback > 10 ? 15 : (options.limit || 8)
    };
    
    // Get RAG context
    const context = await ragEngine.retrieveRelevantContext(queryText, adaptedOptions);
    
    // Create insights for UI display
    const insights = createRAGInsightsFromContext(context);
    
    // Add personalized insights based on feedback history
    if (performanceMetrics && performanceMetrics.avgRatingRAG < 3) {
      insights.push({
        type: 'performance',
        description: 'Adjusting recommendations based on your recent feedback',
        confidence: 0.65,
        isActive: true
      });
    }
    
    return { context, insights };
  } catch (error) {
    console.error(`[RAG Integration] Error in adaptive context retrieval:`, error);
    
    // Fallback to basic retrieval
    const context = await ragEngine.retrieveRelevantContext(queryText, options);
    const insights = createRAGInsightsFromContext(context);
    
    return { context, insights };
  }
}

// Helper functions for extracting suggestions from RAG context

function extractListFromText(text: string, maxItems: number = 5): string[] {
  if (!text) return [];
  
  // Extract items from comma-separated or bullet-pointed text
  const items = text
    .split(/[,\n•\-]/)
    .map(item => item.trim())
    .filter(item => item.length > 2 && item.length < 50)
    .slice(0, maxItems);
  
  return [...new Set(items)]; // Remove duplicates
}

function extractTonesFromContext(text: string, maxItems: number = 4): string[] {
  if (!text) return [];
  
  // Common tone keywords to look for
  const toneKeywords = [
    'professional', 'casual', 'friendly', 'formal', 'conversational',
    'enthusiastic', 'informative', 'playful', 'serious', 'inspiring',
    'confident', 'approachable', 'authoritative', 'warm', 'engaging'
  ];
  
  const foundTones = toneKeywords.filter(tone => 
    text.toLowerCase().includes(tone)
  ).slice(0, maxItems);
  
  return foundTones.length > 0 ? foundTones : ['professional', 'friendly'];
}

function extractHashtagsFromText(text: string, maxItems: number = 10): string[] {
  if (!text) return [];
  
  // Extract hashtags from text
  const hashtags = text
    .match(/#\w+/g)
    ?.map(tag => tag.toLowerCase())
    .slice(0, maxItems) || [];
  
  return [...new Set(hashtags)]; // Remove duplicates
}

function extractTipsFromText(text: string, maxItems: number = 3): string[] {
  if (!text) return [];
  
  // Extract actionable tips from performance insights
  const sentences = text
    .split(/[.!?]/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 20 && sentence.length < 150)
    .slice(0, maxItems);
  
  return sentences;
}