
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating ad campaign creative variations.
 *
 * - generateAdCampaign - A function that orchestrates the ad campaign generation.
 * - GenerateAdCampaignInput - The input type for the generateAdCampaign function.
 * - GenerateAdCampaignOutput - The return type for the generateAdCampaign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getModelConfig } from '@/lib/model-config';

const GenerateAdCampaignInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  industry: z.string().optional().describe('The industry of the brand (e.g., Fashion, Technology). This helps tailor the ad copy and concept.'),
  generatedContent: z.string().describe('The AI-generated content (e.g., social post, blog snippet) to be used as inspiration for the ad campaign.'),
  targetKeywords: z.string().describe('Comma-separated list of target keywords for the ad campaign.'),
  budget: z.number().describe('The total budget for the ad campaign (used for context, not direct execution).'),
  platforms: z.array(z.enum(['google_ads', 'meta'])).describe('The advertising platforms to run the campaign on.'),
  campaignGoal: z.string().optional().describe("The primary objective of the campaign (e.g., 'Brand Awareness', 'Sales Conversion'). This guides the AI's tone and call to action."),
  targetAudience: z.string().optional().describe("A specific description of the target audience for this campaign (e.g., 'Tech-savvy early adopters', 'Budget-conscious students')."),
  callToAction: z.string().optional().describe("An explicit call to action for the ad (e.g., 'Shop Now', 'Learn More', 'Sign Up')."),
});

export type GenerateAdCampaignInput = z.infer<typeof GenerateAdCampaignInputSchema>;

const GenerateAdCampaignOutputSchema = z.object({
  campaignConcept: z.string().describe('A brief summary of the core ad campaign concept or angle, derived from the inputs. This concept should unify the generated headlines and body texts and be relevant to the specified industry.'),
  headlines: z.array(z.string().min(1)).length(3).describe('An array of 3 distinct and compelling headline variations for the ad campaign. Each headline should be suitable for platforms like Google Ads or Meta Ads and tailored to the brand\'s industry.'),
  bodyTexts: z.array(z.string().min(1)).length(2).describe('An array of 2 distinct and persuasive body text (ad copy) variations for the ad campaign. Each body text should elaborate on the concept and be suitable for the chosen platforms and brand\'s industry.'),
  platformGuidance: z.string().describe('General guidance on how to adapt or use these headlines and body texts effectively on the selected platforms (Google Ads, Meta). Include tips for A/B testing or tailoring to specific ad formats if applicable. Do not include specific campaign IDs or technical setup instructions here.'),
});

export type GenerateAdCampaignOutput = z.infer<typeof GenerateAdCampaignOutputSchema>;

export async function generateAdCampaign(input: GenerateAdCampaignInput): Promise<GenerateAdCampaignOutput> {
  return generateAdCampaignFlow(input);
}

const generateAdCampaignPrompt = ai.definePrompt({
  name: 'generateAdCampaignPrompt',
  input: {schema: GenerateAdCampaignInputSchema},
  output: {schema: GenerateAdCampaignOutputSchema},
  prompt: `You are an expert digital advertising strategist specializing in the {{{industry}}} industry. Your task is to generate creative ad campaign assets based on the provided brand information, inspirational content, and strategic goals.

**Strategic Context:**
{{#if campaignGoal}}
- **Primary Campaign Goal:** {{{campaignGoal}}}. All copy should be optimized to achieve this goal. (e.g., for 'Sales Conversion', use urgency; for 'Brand Awareness', be engaging and informative).
{{/if}}
{{#if targetAudience}}
- **Specific Target Audience:** {{{targetAudience}}}. The tone and language must resonate with this group.
{{/if}}

**Brand Information:**
- **Brand Name:** {{{brandName}}}
- **Brand Description:** {{{brandDescription}}}
{{#if industry}}
- **Industry:** {{{industry}}}
{{/if}}
- **Inspirational Content for Ad:** {{{generatedContent}}}
- **Target Keywords:** {{{targetKeywords}}}
- **Budget Context:** {{{budget}}} (Use for general tone, e.g., a large budget might imply broader reach or more sophisticated messaging)
- **Target Platforms:** {{{platforms}}}

**Call to Action (CTA):**
{{#if callToAction}}
- **Incorporate this specific CTA:** "{{{callToAction}}}"
{{else}}
- **Note:** No specific CTA was provided. Infer the most appropriate CTA based on the 'Primary Campaign Goal'.
{{/if}}


**Instructions:**
1.  **Develop a Campaign Concept**: Based on all inputs, especially the brand's industry and campaign goal, formulate a concise Campaign Concept (1-2 sentences) that will be the central theme for the ad variations.
2.  **Generate Headlines**: Create exactly 3 distinct and compelling headline variations that align with the Campaign Concept, campaign goal, and are tailored to the {{{industry}}} industry.
3.  **Generate Body Texts**: Create exactly 2 distinct and persuasive body text (ad copy) variations. These should elaborate on the Campaign Concept, drive towards the CTA, and be relevant to the {{{industry}}} industry.
4.  **Provide Platform Guidance**: Offer general advice on how these generated headlines and body texts can be effectively used or adapted for the specified platforms ({{{platforms}}}). For example, mention if certain headline types work better on Google Search vs. Meta display ads for the {{{industry}}} industry, or suggest A/B testing strategies. Do not provide technical setup instructions or campaign IDs.

Ensure all generated text is professional, engaging, and directly relevant to the brand, its industry, and the provided strategic direction.
`,
});

const generateAdCampaignFlow = ai.defineFlow(
  {
    name: 'generateAdCampaignFlow',
    inputSchema: GenerateAdCampaignInputSchema,
    outputSchema: GenerateAdCampaignOutputSchema,
  },
  async input => {
    const { powerfulModel } = await getModelConfig();

    const {output} = await generateAdCampaignPrompt(input, { model: powerfulModel });
    if (!output) {
        throw new Error("AI failed to generate ad campaign variations.");
    }
    // Additional validation for expected array lengths can be helpful
    if (output.headlines.length !== 3 || output.bodyTexts.length !== 2) {
        // This is a soft warning as the AI might sometimes deviate.
        // For stricter enforcement, this could throw an error.
        console.warn("AI did not return the expected number of headlines/body texts.", output);
    }
    return output;
  }
);
