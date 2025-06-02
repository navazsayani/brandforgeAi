
'use server';
/**
 * @fileOverview An AI agent that describes an image.
 *
 * - describeImage - A function that handles the image description process.
 * - DescribeImageInput - The input type for the describeImage function.
 * - DescribeImageOutput - The return type for the describeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribeImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .min(1, { message: "Image data URI or URL cannot be empty." })
    .describe(
      "The image to describe, as a data URI or a public HTTPS URL. The model will attempt to fetch HTTPS URLs. Expected format for data URI: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribeImageInput = z.infer<typeof DescribeImageInputSchema>;

const DescribeImageOutputSchema = z.object({
  description: z
    .string()
    .describe(
      'A concise and engaging description of the image, suitable for use in a social media post. Highlight key elements and the overall mood.'
    ),
});
export type DescribeImageOutput = z.infer<typeof DescribeImageOutputSchema>;

export async function describeImage(
  input: DescribeImageInput
): Promise<DescribeImageOutput> {
  return describeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describeImagePrompt',
  model: 'googleai/gemini-pro-vision', // Explicitly set a vision model
  input: {schema: DescribeImageInputSchema},
  output: {schema: DescribeImageOutputSchema},
  prompt: `Analyze the provided image and generate a concise, engaging description (1-2 sentences) suitable for a social media post. Focus on the main subject, key visual elements, and the overall mood or atmosphere of the image.

Image: {{media url=imageDataUri}}`,
});

const describeImageFlow = ai.defineFlow(
  {
    name: 'describeImageFlow',
    inputSchema: DescribeImageInputSchema,
    outputSchema: DescribeImageOutputSchema,
  },
  async input => {
    // Log the input URI to help debug
    console.log('describeImageFlow received imageDataUri:', input.imageDataUri);
    
    // The check for imageDataUri presence is now handled by Zod schema validation (.min(1))

    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate an image description.');
    }
    return output;
  }
);
