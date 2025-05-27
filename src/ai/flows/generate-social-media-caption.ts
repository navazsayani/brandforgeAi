
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
  imageDescription: z.string().optional().describe('The description of the image to be posted. Only provided if an image is associated with the post.'),
  tone: z.string().describe('The desired tone of the caption (e.g., professional, funny, informative).'),
});
export type GenerateSocialMediaCaptionInput = z.infer<typeof GenerateSocialMediaCaptionInputSchema>;

const GenerateSocialMediaCaptionOutputSchema = z.object({
  caption: z.string().describe('The generated caption for the social media post.'),
  hashtags: z.string().describe('Relevant hashtags for the social media post, comma-separated.'),
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

You will generate an engaging caption and relevant hashtags for a social media post based on the brand description, the desired tone, and an optional image description.

Brand Description: {{{brandDescription}}}
{{#if imageDescription}}
Image Description: {{{imageDescription}}}
Based on the image and brand, create a caption.
{{else}}
Based on the brand description, create a caption. No image is associated with this post, so focus on a text-only message.
{{/if}}
Desired Tone: {{{tone}}}

Generate a suitable caption and a comma-separated list of 3-5 relevant hashtags.

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
    if (!output) {
        throw new Error("AI failed to generate a social media caption.");
    }
    return output;
  }
);
