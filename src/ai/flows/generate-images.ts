'use server';

/**
 * @fileOverview Generates images based on the extracted brand data for social media posting.
 *
 * - generateImages - A function that handles the image generation process.
 * - GenerateImagesInput - The input type for the generateImages function.
 * - GenerateImagesOutput - The return type for the generateImages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImagesInputSchema = z.object({
  brandDescription: z
    .string()
    .describe('A detailed description of the brand and its values.'),
  imageStyle: z
    .string()
    .describe(
      'A description of the desired style for the generated images, e.g., minimalist, vibrant, professional.'
    ),
  exampleImage: z
    .string()
    .describe(
      "An example image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image will inform the style of the generated images."
    )
    .optional(),
});
export type GenerateImagesInput = z.infer<typeof GenerateImagesInputSchema>;

const GenerateImagesOutputSchema = z.object({
  generatedImage: z
    .string()
    .describe(
      "A generated image as a data URI that includes a MIME type and uses Base64 encoding. The format will be: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImagesOutput = z.infer<typeof GenerateImagesOutputSchema>;

export async function generateImages(input: GenerateImagesInput): Promise<GenerateImagesOutput> {
  return generateImagesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImagesPrompt',
  input: {schema: GenerateImagesInputSchema},
  output: {schema: GenerateImagesOutputSchema},
  prompt: `You are an AI image generation expert specializing in creating images that align with brand aesthetics.

You will generate an image based on the brand description and desired style.

Brand Description: {{{brandDescription}}}
Image Style: {{{imageStyle}}}

{{#if exampleImage}}
  Example Image: {{media url=exampleImage}}
{{/if}}

Ensure the generated image reflects the brand's values and the specified style.
`,
});

const generateImagesFlow = ai.defineFlow(
  {
    name: 'generateImagesFlow',
    inputSchema: GenerateImagesInputSchema,
    outputSchema: GenerateImagesOutputSchema,
  },
  async input => {
    const {
      brandDescription,
      imageStyle,
      exampleImage,
    } = input;

    const imagePrompt = [
      {text: `Generate an image that embodies the following brand description: ${brandDescription}. The image style should be ${imageStyle}.`},
    ];

    if (exampleImage) {
      imagePrompt.unshift({media: {url: exampleImage}});
      imagePrompt.push({text: 'Adhere to the style of the example image.'});
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: imagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {generatedImage: media.url!};
  }
);
