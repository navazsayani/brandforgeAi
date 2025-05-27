
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

// This prompt definition is for the ai.definePrompt object, which is not directly used
// for the image generation in this flow, but kept for consistency or potential future use.
const textGenerationOrientedPrompt = ai.definePrompt({
  name: 'generateImagesTextPrompt', // Renamed to clarify its nature
  input: {schema: GenerateImagesInputSchema},
  output: {schema: GenerateImagesOutputSchema}, // This output schema still applies to the flow's return
  prompt: `You are an AI image generation expert specializing in creating images that align with brand aesthetics.

You will be asked to generate an image based on a brand description and a desired style.
If an example image is provided, use it as a strong stylistic reference for the new image.

Brand Description: {{{brandDescription}}}
Image Style: {{{imageStyle}}}

{{#if exampleImage}}
  The following example image should heavily influence the style, color palette, and mood of the *new* image you generate:
  Example Image: {{media url=exampleImage}}
{{/if}}

Ensure the *newly generated* image reflects the brand's values and the specified style, drawing inspiration from the example if provided, but creating a distinct piece.
`,
});

const generateImagesFlow = ai.defineFlow(
  {
    name: 'generateImagesFlow',
    inputSchema: GenerateImagesInputSchema,
    outputSchema: GenerateImagesOutputSchema,
  },
  async (input) => {
    const {
      brandDescription,
      imageStyle,
      exampleImage,
    } = input;

    // Construct the prompt for the image generation model (Gemini 2.0 Flash Exp)
    const baseTextPrompt = `Generate a *new* and *unique* image that embodies the following brand description: "${brandDescription}". The desired artistic image style is "${imageStyle}".`;
    
    const imageGenerationPromptParts: ({text: string} | {media: {url: string}})[] = [];

    if (exampleImage && exampleImage.startsWith('data:')) { // Ensure exampleImage is a valid data URI
      imageGenerationPromptParts.push({media: {url: exampleImage}});
      imageGenerationPromptParts.push({
        text: `${baseTextPrompt} Use the provided example image *only* as a strong reference for the artistic style, color palette, and overall mood. Do NOT replicate the example image's subject matter or composition directly. The new image must be clearly different in content but stylistically similar to the example.`
      });
    } else {
      imageGenerationPromptParts.push({text: baseTextPrompt});
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: This specific model is for image generation
      prompt: imageGenerationPromptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Must include IMAGE
      },
    });

    if (!media || !media.url) {
        throw new Error("AI failed to generate an image or returned an invalid image format.");
    }

    return {generatedImage: media.url};
  }
);

