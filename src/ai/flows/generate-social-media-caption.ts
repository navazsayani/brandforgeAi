// use server'

/**
 * @fileOverview A social media caption generator AI agent.
 *
 * - generateSocialMediaCaption - A function that handles the social media caption generation process.
 * - GenerateSocialMediaCaptionInput - The input type for the generateSocialMediaCaption function.
 * - GenerateSocialMediaCaptionOutput - The return type for the generateSocialMediaCaption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialMediaCaptionInputSchema = z.object({
  brandDescription: z.string().describe('The description of the brand.'),
  imageDescription: z.string().describe('The description of the image to be posted.'),
  tone: z.string().describe('The desired tone of the caption (e.g., professional, funny, informative).'),
});
export type GenerateSocialMediaCaptionInput = z.infer<typeof GenerateSocialMediaCaptionInputSchema>;

const GenerateSocialMediaCaptionOutputSchema = z.object({
  caption: z.string().describe('The generated caption for the Instagram post.'),
  hashtags: z.string().describe('Relevant hashtags for the Instagram post.'),
});
export type GenerateSocialMediaCaptionOutput = z.infer<typeof GenerateSocialMediaCaptionOutputSchema>;

export async function generateSocialMediaCaption(input: GenerateSocialMediaCaptionInput): Promise<GenerateSocialMediaCaptionOutput> {
  return generateSocialMediaCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialMediaCaptionPrompt',
  input: {schema: GenerateSocialMediaCaptionInputSchema},
  output: {schema: GenerateSocialMediaCaptionOutputSchema},
  prompt: `You are an expert social media manager.

You will generate an engaging caption and relevant hashtags for an Instagram post based on the brand and image descriptions, and the desired tone.

Brand Description: {{{brandDescription}}}
Image Description: {{{imageDescription}}}
Tone: {{{tone}}}

Caption:
Hashtags:`,
});

const generateSocialMediaCaptionFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaCaptionFlow',
    inputSchema: GenerateSocialMediaCaptionInputSchema,
    outputSchema: GenerateSocialMediaCaptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
