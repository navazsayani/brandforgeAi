
'use server';

/**
 * @fileOverview AI flow for refining social media posts
 * Allows iterative improvements: shorten, lengthen, tone changes, emojis, variations
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getModelConfig } from '@/lib/model-config';

const RefineSocialPostInputSchema = z.object({
  originalCaption: z.string().describe('The original caption to refine.'),
  originalHashtags: z.string().describe('The original hashtags to refine.'),
  refinementType: z.enum(['shorten', 'lengthen', 'more_casual', 'more_professional', 'add_emojis', 'remove_emojis', 'variations']).describe('The type of refinement to perform.'),
  customInstruction: z.string().optional().describe('Optional custom instruction for refinement.'),
  platform: z.string().optional().describe('Target platform (e.g., instagram, linkedin, twitter) for character limits.'),
  language: z.string().optional().describe('Content language for cultural appropriateness.'),
  tone: z.string().optional().describe('Original tone to maintain or adjust.'),
  // Boolean flags for Handlebars conditionals (following generate-social-media-caption.ts pattern)
  isInstagram: z.boolean().optional(),
  isLinkedIn: z.boolean().optional(),
  isTwitter: z.boolean().optional(),
  isFacebook: z.boolean().optional(),
  isYouTube: z.boolean().optional(),
  isTikTok: z.boolean().optional(),
  isMultiPlatform: z.boolean().optional(),
  // Refinement type flags
  isShorten: z.boolean().optional(),
  isLengthen: z.boolean().optional(),
  isMoreCasual: z.boolean().optional(),
  isMoreProfessional: z.boolean().optional(),
  isAddEmojis: z.boolean().optional(),
  isRemoveEmojis: z.boolean().optional(),
  isVariations: z.boolean().optional(),
});
export type RefineSocialPostInput = z.infer<typeof RefineSocialPostInputSchema>;

const RefineSocialPostOutputSchema = z.object({
  refinedCaption: z.string().describe('The refined caption.'),
  refinedHashtags: z.string().describe('The refined hashtags, space-separated, each with #.'),
  variations: z.array(z.object({
    caption: z.string(),
    hashtags: z.string(),
  })).optional().describe('When refinementType is "variations", return 3 different versions.'),
});
export type RefineSocialPostOutput = z.infer<typeof RefineSocialPostOutputSchema>;

const refineSocialPostPrompt = ai.definePrompt({
  name: 'refineSocialPostPrompt',
  input: {schema: RefineSocialPostInputSchema},
  output: {schema: RefineSocialPostOutputSchema},
  prompt: `You are an expert social media editor specializing in refining content while maintaining brand voice and platform optimization.

**ORIGINAL CONTENT:**
Caption: {{{originalCaption}}}
Hashtags: {{{originalHashtags}}}

**REFINEMENT TYPE:** {{refinementType}}

{{#if platform}}
**Target Platform:** {{platform}}
{{#if isTwitter}}
- STRICT 280 character limit for caption
- 1-2 hashtags maximum
{{/if}}
{{#if isInstagram}}
- Optimal: 150-300 characters for best engagement
- 5-7 hashtags recommended
{{/if}}
{{#if isLinkedIn}}
- Professional tone mandatory
- 3-5 hashtags maximum
{{/if}}
{{#if isFacebook}}
- Community-focused, up to 2000 characters
- 5-10 hashtags recommended
{{/if}}
{{#if isYouTube}}
- Video-supporting content, up to 1000 characters
- 5-8 hashtags recommended
{{/if}}
{{#if isTikTok}}
- Trendy, authentic, up to 2200 characters
- 3-5 hashtags (mix of viral/niche)
{{/if}}
{{#if isMultiPlatform}}
- Safe length: 280 characters (works across all platforms)
- 3-5 universal hashtags
{{/if}}
{{/if}}

{{#if language}}
**Language:** {{language}}
- Maintain cultural appropriateness and linguistic nuances
{{/if}}

{{#if tone}}
**Original Tone:** {{tone}}
{{/if}}

---

**REFINEMENT INSTRUCTIONS:**

{{#if isShorten}}
**SHORTEN THE CONTENT:**
- Reduce caption length by 30-50%
- Keep the core message and call-to-action
- Remove unnecessary words, maintain impact
- Reduce hashtags to most essential ones
{{/if}}

{{#if isLengthen}}
**LENGTHEN THE CONTENT:**
- Expand caption by 30-50%
- Add more context, details, or storytelling elements
- Include additional benefits or insights
- Add 2-3 more relevant hashtags
- Maintain natural flow, avoid padding
{{/if}}

{{#if isMoreCasual}}
**MAKE IT MORE CASUAL:**
- Use conversational, friendly language
- Add personality and warmth
- Use contractions (we're, you'll, don't)
- Consider adding appropriate emojis if culturally suitable
- Keep it approachable and relatable
- Maintain professionalism, just friendlier
{{/if}}

{{#if isMoreProfessional}}
**MAKE IT MORE PROFESSIONAL:**
- Use formal, polished language
- Remove casual slang or overly informal phrases
- Remove excessive emojis (keep max 1-2 if essential)
- Focus on value, expertise, and credibility
- Maintain confidence without being stiff
{{/if}}

{{#if isAddEmojis}}
**ADD EMOJIS:**
- Add 3-5 relevant emojis throughout the caption
- Use emojis to:
  - Break up text sections (visual spacing)
  - Emphasize key points
  - Add visual interest
- Place strategically, not randomly
- Ensure cultural appropriateness for {{language}}
- Don't overdo it - maintain readability
{{/if}}

{{#if isRemoveEmojis}}
**REMOVE EMOJIS:**
- Remove all or most emojis from caption
- Keep text-only communication
- Maintain impact without visual elements
- Ensure message clarity remains
{{/if}}

{{#if isVariations}}
**GENERATE 3 VARIATIONS:**
Create 3 completely different approaches to the same message:

**Variation 1 - DIRECT APPROACH:**
- Straightforward, clear, action-oriented
- Focus on immediate value
- Strong call-to-action

**Variation 2 - STORYTELLING APPROACH:**
- Narrative style, create connection
- Share a micro-story or scenario
- Emotional engagement

**Variation 3 - QUESTION/ENGAGEMENT APPROACH:**
- Start with compelling question
- Interactive, discussion-prompting
- Community-building focus

Each variation should:
- Convey the same core message
- Feel distinctly different in style
- Be complete and ready to post
- Include appropriate hashtags
{{/if}}

{{#if customInstruction}}
**ADDITIONAL INSTRUCTION:**
{{{customInstruction}}}
{{/if}}

---

**OUTPUT REQUIREMENTS:**

{{#if isVariations}}
Return the "variations" array with 3 distinct versions, each with caption and hashtags.
Also provide refinedCaption and refinedHashtags (can be same as variation 1).
{{else}}
Return refined caption and hashtags that implement the requested {{refinementType}} refinement.
{{/if}}

**CRITICAL:**
- Preserve the core message and intent
- Maintain brand voice (adjust tone, not identity)
- Keep hashtags relevant and targeted
- Respect platform character limits
- Ensure content is ready to post immediately
`,
});

export async function refineSocialPost(input: RefineSocialPostInput): Promise<RefineSocialPostOutput> {
  return refineSocialPostFlow(input);
}

const refineSocialPostFlow = ai.defineFlow(
  {
    name: 'refineSocialPostFlow',
    inputSchema: RefineSocialPostInputSchema,
    outputSchema: RefineSocialPostOutputSchema,
  },
  async input => {
    // Create enhanced input with boolean flags for Handlebars conditionals
    // Following the pattern from generate-social-media-caption.ts
    const enhancedInput: any = { ...input };

    // Platform flags
    const platform = input.platform?.toLowerCase() || 'all';
    enhancedInput.isInstagram = platform === 'instagram';
    enhancedInput.isLinkedIn = platform === 'linkedin';
    enhancedInput.isTwitter = platform === 'twitter';
    enhancedInput.isFacebook = platform === 'facebook';
    enhancedInput.isYouTube = platform === 'youtube';
    enhancedInput.isTikTok = platform === 'tiktok';
    enhancedInput.isMultiPlatform = platform === 'all';

    // Refinement type flags
    const refinementType = input.refinementType;
    enhancedInput.isShorten = refinementType === 'shorten';
    enhancedInput.isLengthen = refinementType === 'lengthen';
    enhancedInput.isMoreCasual = refinementType === 'more_casual';
    enhancedInput.isMoreProfessional = refinementType === 'more_professional';
    enhancedInput.isAddEmojis = refinementType === 'add_emojis';
    enhancedInput.isRemoveEmojis = refinementType === 'remove_emojis';
    enhancedInput.isVariations = refinementType === 'variations';

    const { fastModel } = await getModelConfig();

    const {output} = await refineSocialPostPrompt(enhancedInput, { model: fastModel });

    if (!output) {
      throw new Error("AI failed to refine the social media post.");
    }

    return output;
  }
);
