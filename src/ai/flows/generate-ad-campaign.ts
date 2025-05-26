'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating and running ad campaigns on Google Ads and Meta.
 *
 * - generateAdCampaign - A function that orchestrates the ad campaign generation and execution.
 * - GenerateAdCampaignInput - The input type for the generateAdCampaign function.
 * - GenerateAdCampaignOutput - The return type for the generateAdCampaign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAdCampaignInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  generatedContent: z.string().describe('The AI-generated content to be used in the ad campaign, such as ad copy and creatives.'),
  targetKeywords: z.string().describe('Comma-separated list of target keywords for the ad campaign.'),
  budget: z.number().describe('The total budget for the ad campaign.'),
  platforms: z.array(z.enum(['google_ads', 'meta'])).describe('The advertising platforms to run the campaign on.'),
});

export type GenerateAdCampaignInput = z.infer<typeof GenerateAdCampaignInputSchema>;

const GenerateAdCampaignOutputSchema = z.object({
  campaignSummary: z.string().describe('A summary of the generated ad campaign, including key details and expected outcomes.'),
  platformDetails: z.record(z.string(), z.string()).describe('Details specific to each platform, such as campaign IDs and performance metrics.'),
});

export type GenerateAdCampaignOutput = z.infer<typeof GenerateAdCampaignOutputSchema>;

export async function generateAdCampaign(input: GenerateAdCampaignInput): Promise<GenerateAdCampaignOutput> {
  return generateAdCampaignFlow(input);
}

const generateAdCampaignPrompt = ai.definePrompt({
  name: 'generateAdCampaignPrompt',
  input: {schema: GenerateAdCampaignInputSchema},
  output: {schema: GenerateAdCampaignOutputSchema},
  prompt: `You are an expert in digital advertising. Your task is to generate and configure ad campaigns on Google Ads and Meta based on the provided brand information and AI-generated content.

  Brand Name: {{{brandName}}}
  Brand Description: {{{brandDescription}}}
  Generated Content: {{{generatedContent}}}
  Target Keywords: {{{targetKeywords}}}
  Budget: {{{budget}}}
  Platforms: {{{platforms}}}

  Create a compelling ad campaign that maximizes ROI and brand visibility across the selected platforms. Provide a detailed campaign summary and platform-specific details.
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
    return output!;
  }
);
