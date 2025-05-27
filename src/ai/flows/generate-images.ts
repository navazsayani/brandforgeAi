
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
    .describe('A detailed description of the brand and its values. This will be the primary driver for the *subject matter* of the new image.'),
  imageStyle: z
    .string()
    .describe(
      'A description of the desired artistic style for the generated images, e.g., minimalist, vibrant, professional, photorealistic, impressionistic.'
    ),
  exampleImage: z
    .string()
    .describe(
      "An example image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image will inform the *abstract artistic style* of the generated images, not its content."
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

You will be asked to generate a new image based on a brand description and a desired image style.
If an example image is provided, you should analyze it for its abstract artistic qualities (like color palette, lighting, texture, mood, overall artistic style e.g. 'photorealistic', 'minimalist') and use these qualities as *inspiration* for the *new* image. The subject matter of the new image must come from the brand description.

Brand Description (for new image content): {{{brandDescription}}}
Image Style (for new image aesthetics): {{{imageStyle}}}

{{#if exampleImage}}
  The following example image should be used *only* to extract abstract stylistic elements (color palette, mood, lighting, artistic technique). DO NOT replicate the objects, people, or scene from this example.
  Example Image (for style reference only): {{media url=exampleImage}}
{{/if}}

Ensure the *newly generated* image primarily reflects the 'Brand Description' for its content and the 'Image Style' for its overall look, drawing stylistic inspiration (but not content) from the example image if provided. The new image must be distinct in its subject matter from any example image.
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
    const baseTextPrompt = `Generate a *new and unique* image. The primary subject matter and theme should be derived from the following brand description: "${brandDescription}". The desired overall artistic image style is: "${imageStyle}".`;
    
    const imageGenerationPromptParts: ({text: string} | {media: {url: string}})[] = [];

    if (exampleImage && exampleImage.startsWith('data:')) { // Ensure exampleImage is a valid data URI
      imageGenerationPromptParts.push({media: {url: exampleImage}});
      imageGenerationPromptParts.push({
        text: `${baseTextPrompt} Critically, the provided example image should be used *only* as a reference for its abstract artistic qualities. Analyze it for its color palette, lighting style, common textures, overall mood, and artistic rendering style (e.g., 'photorealistic', 'painterly', 'graphic'). Apply these *abstracted stylistic elements* to the *new* image you create based on the brand description. The subject matter, specific objects, figures, and scene composition of the newly generated image *must be entirely different* from the example image. The goal is to achieve a similar artistic *feel* or *vibe* in a completely fresh visual, not to recreate, adapt, or modify the example image's content.`
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

