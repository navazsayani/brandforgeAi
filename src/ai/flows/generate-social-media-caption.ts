
'use server';

/**
 * @fileOverview A social media caption generator AI agent.
 *
 * - generateSocialMediaCaption - A function that handles the social media caption generation process.
 * - GenerateSocialMediaCaptionInput - The input type for the generateSocialMediaCaption function.
 * - GenerateSocialMediaCaptionOutput - The return type for the generateSocialMediaCaption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getModelConfig } from '@/lib/model-config';
import { enhanceSocialMediaPrompt, storeContentForRAG, getAdaptiveRAGContext, createRAGInsightsFromContext } from '@/lib/rag-integration';

const GenerateSocialMediaCaptionInputSchema = z.object({
  brandDescription: z.string().describe('The description of the brand.'),
  industry: z.string().optional().describe('The industry of the brand (e.g., Fashion, Technology). This helps tailor the tone and hashtags.'),
  imageDescription: z.string().optional().describe('The description of the image to be posted. Only provided if an image is associated with the post.'),
  tone: z.string().describe('The desired tone of the caption (e.g., professional, funny, informative, professional but slightly urgent).'),
  postGoal: z.string().optional().describe("The primary goal of the post, e.g., 'Brand Awareness', 'Engagement'. This guides the overall message."),
  targetAudience: z.string().optional().describe("A description of the target audience for this post, e.g., 'Young professionals', 'Eco-conscious consumers'."),
  callToAction: z.string().optional().describe("A specific call to action to include in the post, e.g., 'Shop now', 'Learn more'."),
  platform: z.string().optional().describe("The target social media platform (e.g., 'instagram', 'linkedin', 'twitter', 'all'). Affects character limits, hashtag strategy, and content style."),
  language: z.string().optional().describe("The target language for the content (e.g., 'english', 'spanish', 'hinglish'). Affects language style and cultural context."),
});
export type GenerateSocialMediaCaptionInput = z.infer<typeof GenerateSocialMediaCaptionInputSchema>;

const GenerateSocialMediaCaptionOutputSchema = z.object({
  caption: z.string().describe('The generated caption for the social media post.'),
  hashtags: z.string().describe('Relevant hashtags for the social media post, comma-separated.'),
});
export type GenerateSocialMediaCaptionOutput = z.infer<typeof GenerateSocialMediaCaptionOutputSchema>;

const generateSocialMediaCaptionPrompt = ai.definePrompt({
  name: 'generateSocialMediaCaptionPrompt',
  input: {schema: GenerateSocialMediaCaptionInputSchema},
  output: {schema: GenerateSocialMediaCaptionOutputSchema},
  prompt: `You are an expert social media manager specializing in crafting platform-optimized, culturally-aware social media content.

Your task is to generate an engaging caption and relevant hashtags based on the provided information, optimized for the specific platform and language.

**Platform-Specific Optimization:**
{{#if platform}}
**Target Platform:** {{{platform}}}
{{#if (eq platform "instagram")}}
- **Instagram Focus:** Visual storytelling, authentic, lifestyle-focused content
- **Character Limit:** Up to 2200 characters (use wisely)
- **Hashtag Strategy:** Mix of trending and niche hashtags (20-30 total)
- **Content Style:** Story-driven, behind-the-scenes, aesthetic appeal
- **CTA Style:** Subtle, encourage saves/shares, ask engaging questions
{{else if (eq platform "linkedin")}}
- **LinkedIn Focus:** Professional insights, industry expertise, business value
- **Character Limit:** Up to 1300 characters (concise but informative)
- **Hashtag Strategy:** Professional hashtags (3-5 max, industry-focused)
- **Content Style:** Authority-building, thought leadership, professional networking
- **CTA Style:** Professional engagement, discussion-provoking questions
{{else if (eq platform "twitter")}}
- **Twitter Focus:** Quick insights, conversational, trending topics
- **Character Limit:** 280 characters MAX (be concise)
- **Hashtag Strategy:** Trending hashtags (1-3 max, highly relevant)
- **Content Style:** Quick wit, breaking news, conversation starters
- **CTA Style:** Encourage retweets, replies, threaded discussions
{{else if (eq platform "facebook")}}
- **Facebook Focus:** Community building, inclusive content, events
- **Character Limit:** Up to 2000 characters (community-focused)
- **Hashtag Strategy:** Relevant hashtags (5-10, community-building)
- **Content Style:** Community-oriented, event announcements, inclusive
- **CTA Style:** Community engagement, event participation
{{else if (eq platform "youtube")}}
- **YouTube Focus:** Video-supporting content, educational, entertainment
- **Character Limit:** Up to 1000 characters (video-centric)
- **Hashtag Strategy:** Video-related hashtags (5-8, discoverable)
- **Content Style:** Educational/entertainment value, behind-the-scenes
- **CTA Style:** Subscribe, watch, comment encouragement
{{else if (eq platform "tiktok")}}
- **TikTok Focus:** Trendy, authentic, Gen-Z appeal, viral potential
- **Character Limit:** 150 characters MAX (very concise)
- **Hashtag Strategy:** Trending hashtags (3-5 mix of viral/niche)
- **Content Style:** Trend-aware, authentic, energetic, fun
- **CTA Style:** Encourage follows, duets, shares
{{else}}
- **Multi-Platform Focus:** Universal appeal, professional quality
- **Character Limit:** 280 characters (safe for all platforms)
- **Hashtag Strategy:** Universal hashtags (3-5, broadly appealing)
- **Content Style:** Versatile, professional yet approachable
- **CTA Style:** General engagement, broad appeal
{{/if}}
{{else}}
**Default Platform:** Multi-platform optimization (Instagram focus)
- **Character Limit:** Up to 2200 characters
- **Hashtag Strategy:** Mix of trending and niche hashtags (15-25 total)
- **Content Style:** Visual storytelling, authentic tone
{{/if}}

**Language & Cultural Context:**
{{#if language}}
**Target Language:** {{{language}}}
{{#if (eq language "hinglish")}}
- **Hinglish Style:** Mix English and Hindi naturally, use colloquial expressions
- **Cultural Context:** Modern Indian lifestyle, relatable to urban millennials/Gen-Z
- **Tone:** Casual, trendy, "yaar/bro" culture, Bollywood references when appropriate
{{else if (eq language "spanish")}}
- **Spanish Style:** Warm, expressive, family-oriented language
- **Cultural Context:** Community-focused, celebratory, relationship-centered
- **Tone:** More emotional, expressive connections, cultural celebrations
{{else if (eq language "french")}}
- **French Style:** Sophisticated, elegant, culturally refined
- **Cultural Context:** Art, culture, lifestyle appreciation
- **Tone:** Sophisticated language, cultural nuances, elegance
{{else if (eq language "german")}}
- **German Style:** Precise, efficient, quality-focused
- **Cultural Context:** Engineering excellence, sustainability, innovation
- **Tone:** Detailed, quality-emphasizing, structured approach
{{else if (eq language "hindi")}}
- **Hindi Style:** Respectful, family-oriented, traditional values
- **Cultural Context:** Family, festivals, respect, traditions
- **Tone:** Respectful language, cultural sensitivity, family focus
{{else if (eq language "japanese")}}
- **Japanese Style:** Polite, respectful, detail-oriented
- **Cultural Context:** Respect, quality, seasonal awareness, craftsmanship
- **Tone:** Polite forms, seasonal sensitivity, quality focus
{{else}}
- **Standard English:** Professional, clear, globally accessible
- **Cultural Context:** Universal business communication
- **Tone:** Professional yet approachable, culturally neutral
{{/if}}
{{else}}
**Default Language:** English (global standard)
{{/if}}

**Primary Goal of this Post:** {{{postGoal}}}
Tailor the message and structure to achieve this goal while respecting platform conventions.

**Target Audience:** {{{targetAudience}}}
Write in a language and style that resonates with this specific audience, considering both platform culture and language preferences.

**Brand & Context:**
- **Brand Description:** {{{brandDescription}}}
- **Industry:** {{#if industry}}"{{{industry}}}" (Tailor language and hashtags to this sector){{else}}General{{/if}}
- **Desired Tone:** {{{tone}}} (Apply this tone while respecting platform and language conventions)
- **Image Context:** {{#if imageDescription}}"{{{imageDescription}}}" (Reference the image naturally in the caption){{else}}No image provided. Create engaging text-only content about the brand.{{/if}}

**Call to Action (Optional):**
{{#if callToAction}}
Incorporate this specific call to action naturally: "{{{callToAction}}}"
{{else}}
Create a platform-appropriate call to action based on the post's goal and platform conventions.
{{/if}}

**Instructions:**
1. **Caption:** Write a compelling caption that follows platform-specific character limits and cultural language preferences
2. **Hashtags:** Provide platform-optimized hashtags as a comma-separated list, following the platform's hashtag conventions
3. **Cultural Sensitivity:** Ensure content is appropriate for the target language and cultural context
4. **Platform Optimization:** Follow the specific platform's content style and engagement patterns

Output only the caption and hashtags in the specified format.`,
});


export async function generateSocialMediaCaption(input: GenerateSocialMediaCaptionInput): Promise<GenerateSocialMediaCaptionOutput> {
  return generateSocialMediaCaptionFlow(input);
}

const generateSocialMediaCaptionFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaCaptionFlow',
    inputSchema: GenerateSocialMediaCaptionInputSchema,
    outputSchema: GenerateSocialMediaCaptionOutputSchema,
  },
  async input => {
    // 🔥 RAG ENHANCEMENT: Get user ID from input (will be passed from actions)
    const userId = (input as any).userId;
    
    const { fastModel } = await getModelConfig();
    
    // 🔥 RAG ENHANCEMENT: Get adaptive RAG context with insights
    let enhancedInput = input;
    let ragInsights: any[] = [];
    let wasRAGEnhanced = false;
    
    if (userId) {
      try {
        // Create base prompt text for enhancement
        const basePromptText = `Generate social media caption for ${input.brandDescription} in ${input.tone} tone`;
        
        // Get adaptive RAG context with insights
        const { context, insights } = await getAdaptiveRAGContext(
          userId,
          basePromptText,
          {
            userId,
            contentType: 'social_media',
            industry: input.industry,
            minPerformance: 0.7,
            limit: 10,
            includeIndustryPatterns: true,
            timeframe: '30days'
          }
        );
        
        ragInsights = insights;
        wasRAGEnhanced = insights.length > 0;
        
        if (wasRAGEnhanced) {
          // Build enhanced prompt with RAG context
          let ragContextText = '';
          if (context.brandPatterns) ragContextText += `\nBRAND VOICE CONTEXT:\n${context.brandPatterns}`;
          if (context.voicePatterns) ragContextText += `\nSUCCESSFUL VOICE PATTERNS:\n${context.voicePatterns}`;
          if (context.effectiveHashtags) ragContextText += `\nEFFECTIVE HASHTAGS:\n${context.effectiveHashtags}`;
          if (context.performanceInsights) ragContextText += `\nPERFORMANCE INSIGHTS:\n${context.performanceInsights}`;
          
          enhancedInput = {
            ...input,
            brandDescription: `${input.brandDescription}${ragContextText}`
          };
          
          console.log(`[RAG] Enhanced social media prompt with ${insights.length} insights`);
        }
      } catch (error) {
        console.log(`[RAG] Failed to enhance prompt, using original:`, error);
      }
    }
    
    const {output} = await generateSocialMediaCaptionPrompt(enhancedInput, { model: fastModel });
    if (!output) {
        throw new Error("AI failed to generate a social media caption.");
    }
    
    // 🔥 RAG ENHANCEMENT: Store successful generation for future RAG
    if (userId && output) {
      try {
        const contentId = `social_${Date.now()}`;
        await storeContentForRAG(
          userId,
          'social_media',
          contentId,
          {
            prompt: `Caption: ${output.caption}`,
            result: `${output.caption}\nHashtags: ${output.hashtags}`,
            style: input.tone,
            metadata: {
              platform: input.platform || 'instagram',
              language: input.language || 'english',
              postGoal: input.postGoal,
              targetAudience: input.targetAudience,
              industry: input.industry,
              wasRAGEnhanced,
              ragInsights: ragInsights.length > 0 ? ragInsights : undefined
            }
          }
        );
        console.log(`[RAG] Stored social media generation for future context`);
      } catch (error) {
        console.log(`[RAG] Failed to store content for RAG:`, error);
      }
    }
    
    // Add RAG metadata to output for UI components
    return {
      ...output,
      _ragMetadata: {
        wasRAGEnhanced,
        ragInsights,
        contentId: `social_${Date.now()}`,
        userId
      }
    };
  }
);
