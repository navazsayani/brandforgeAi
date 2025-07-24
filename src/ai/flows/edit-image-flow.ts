
'use server';
/**
 * @fileOverview An AI agent that edits an image based on user instructions.
 *
 * - editImage - A function that handles the image editing process.
 * - EditImageInput - The input type for the editImage function.
 * - EditImageOutput - The return type for the editImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getModelConfig } from '@/lib/model-config';

export const EditImageInputSchema = z.object({
  imageDataUri: z.string().describe("The base image to edit, as a data URI."),
  instruction: z.string().min(3, { message: "Instruction must be at least 3 characters." }).describe('The user\'s instruction on how to edit the image.'),
});
export type EditImageInput = z.infer<typeof EditImageInputSchema>;

export const EditImageOutputSchema = z.object({
  editedImageDataUri: z.string().describe('The edited image as a data URI.'),
});
export type EditImageOutput = z.infer<typeof EditImageOutputSchema>;

export async function editImage(input: EditImageInput): Promise<EditImageOutput> {
  return editImageFlow(input);
}

const editImageFlow = ai.defineFlow(
  {
    name: 'editImageFlow',
    inputSchema: EditImageInputSchema,
    outputSchema: EditImageOutputSchema,
  },
  async (input) => {
    const { visionModel } = await getModelConfig();

    console.log(`[editImageFlow] Starting refinement with model: ${visionModel}`);
    console.log(`[editImageFlow] Instruction: ${input.instruction}`);
    console.log(`[editImageFlow] Image data URI (first 100 chars): ${input.imageDataUri.substring(0, 100)}...`);

    try {
      const {media} = await ai.generate({
        model: visionModel,
        prompt: [
            { media: { url: input.imageDataUri } },
            { text: `You are an expert photo editor. Your task is to edit the provided image based on the following instruction. Fulfill the request precisely. The output must be a new image that reflects the change. Instruction: "${input.instruction}"` }
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media || !media.url || !media.url.startsWith('data:')) {
        console.error('AI image editing failed or returned invalid data URI. Response media:', JSON.stringify(media, null, 2));
        throw new Error('AI failed to generate a valid edited image or the format was unexpected.');
      }
      return { editedImageDataUri: media.url };

    } catch (error: any) {
        console.error("Error during ai.generate call for image editing:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        throw new Error(`Error during image editing API call: ${error.message || 'Unknown error from ai.generate()'}`);
    }
  }
);
