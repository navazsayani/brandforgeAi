
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

const GenerateAdCampaignInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  generatedContent: z.string().describe('The AI-generated content (e.g., social post, blog snippet) to be used as inspiration for the ad campaign.'),
  targetKeywords: z.string().describe('Comma-separated list of target keywords for the ad campaign.'),
  budget: z.number().describe('The total budget for the ad campaign (used for context, not direct execution).'),
  platforms: z.array(z.enum(['google_ads', 'meta'])).describe('The advertising platforms to run the campaign on.'),
});

export type GenerateAdCampaignInput = z.infer<typeof GenerateAdCampaignInputSchema>;

const GenerateAdCampaignOutputSchema = z.object({
  campaignConcept: z.string().describe('A brief summary of the core ad campaign concept or angle, derived from the inputs. This concept should unify the generated headlines and body texts.'),
  headlines: z.array(z.string().min(1)).length(3).describe('An array of 3 distinct and compelling headline variations for the ad campaign. Each headline should be suitable for platforms like Google Ads or Meta Ads.'),
  bodyTexts: z.array(z.string().min(1)).length(2).describe('An array of 2 distinct and persuasive body text (ad copy) variations for the ad campaign. Each body text should elaborate on the concept and be suitable for the chosen platforms.'),
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
  prompt: `You are an expert digital advertising strategist. Your task is to generate creative ad campaign assets based on the provided brand information, inspirational content, and target keywords.

Brand Name: {{{brandName}}}
Brand Description: {{{brandDescription}}}
Inspirational Content for Ad: {{{generatedContent}}}
Target Keywords: {{{targetKeywords}}}
Budget Context: {{{budget}}} (Use for general tone, e.g., a large budget might imply broader reach or more sophisticated messaging)
Target Platforms: {{{platforms}}}

Instructions:
1.  **Develop a Campaign Concept**: Based on all inputs, formulate a concise Campaign Concept (1-2 sentences) that will be the central theme for the ad variations.
2.  **Generate Headlines**: Create exactly 3 distinct and compelling headline variations that align with the Campaign Concept. Each headline should be optimized for engagement on platforms like Google Ads and Meta.
3.  **Generate Body Texts**: Create exactly 2 distinct and persuasive body text (ad copy) variations. These should elaborate on the Campaign Concept and headlines, encouraging action.
4.  **Provide Platform Guidance**: Offer general advice on how these generated headlines and body texts can be effectively used or adapted for the specified platforms ({{{platforms}}}). For example, mention if certain headline types work better on Google Search vs. Meta display ads, or suggest A/B testing strategies. Do not provide technical setup instructions or campaign IDs.

Ensure all generated text is professional, engaging, and directly relevant to the brand and inspirational content.
`,
});

const generateAdCampaignFlow = ai.defineFlow(
  {
    name: 'generateAdCampaignFlow',
    inputSchema: GenerateAdCampaignInputSchema,
    outputSchema: GenerateAdCampaignOutputSchema,
  },
  async input => {
    const {output} = await generateAdCampaignPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate ad campaign variations.");
    }
    if (output.headlines.length !== 3 || output.bodyTexts.length !== 2) {
        console.warn("AI did not return the expected number of headlines/body texts.", output);
        // Potentially add fallback or error here, but for now, we'll let it pass
        // and the UI will render what it gets.
    }
    return output;
  }
);
