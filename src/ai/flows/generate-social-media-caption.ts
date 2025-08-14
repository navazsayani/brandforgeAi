
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
  prompt: `You are an expert social media manager specializing in crafting compelling Instagram posts.

Your task is to generate an engaging caption and a set of relevant hashtags based on the provided information.

**Primary Goal of this Post:** {{{postGoal}}}
Tailor the message and structure to achieve this goal. For example, if the goal is 'Engagement', ask a question. If it's 'Promotion', create urgency.

**Target Audience:** {{{targetAudience}}}
Write in a language and style that resonates with this specific audience.

**Brand & Context:**
- **Brand Description:** {{{brandDescription}}}
- **Industry:** {{#if industry}}"{{{industry}}}" (Tailor language and hashtags to this sector){{else}}General{{/if}}
- **Desired Tone:** {{{tone}}} (Apply this tone throughout the caption)
- **Image Context:** {{#if imageDescription}}"{{{imageDescription}}}" (Directly reference the image in the caption){{else}}No image provided. Create a text-only post about the brand.{{/if}}

**Call to Action (Optional):**
{{#if callToAction}}
Incorporate this specific call to action naturally into the caption: "{{{callToAction}}}"
{{else}}
If no specific call to action is given, create a suitable one based on the post's goal (e.g., for Engagement, ask a question; for Brand Awareness, invite follows).
{{/if}}

**Instructions:**
1.  **Caption:** Write a compelling caption (2-4 sentences) that aligns with all the above information.
2.  **Hashtags:** Provide a comma-separated list of 5-7 highly relevant hashtags. Include a mix of broad, niche, and branded hashtags suitable for the industry and target audience.

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
              platform: 'Instagram',
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
