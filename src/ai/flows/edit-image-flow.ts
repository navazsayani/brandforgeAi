
'use server';
/**
 * @fileOverview An AI agent that edits an image based on user instructions.
 *
 * - editImage - A function that handles the image editing process.
 * - EditImageInput - The input type for the editImage function.
 * - EditImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { getModelConfig } from '@/lib/model-config';
import { EditImageInputSchema, EditImageOutputSchema, type EditImageInput, type EditImageOutput } from '@/types';

export type { EditImageInput, EditImageOutput };

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
    // IMPORTANT: Use the dedicated image generation model for this task.
    const { imageGenerationModel } = await getModelConfig();

    console.log(`[editImageFlow] Starting refinement with model: ${imageGenerationModel}`);
    console.log(`[editImageFlow] Instruction: ${input.instruction}`);
    console.log(`[editImageFlow] Image data URI (first 100 chars): ${input.imageDataUri.substring(0, 100)}...`);

    try {
        const enhancedPrompt = `
You are an expert AI photo editor. Your task is to edit the provided image based on the user's instruction.
Your goal is to fulfill the user's request precisely and with high fidelity.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze the original image:** Understand its subject, style, composition, and lighting.
2.  **Analyze the user's instruction:** Identify the core intent of the change requested.
3.  **Perform the edit:** Modify the image according to the instruction. The output must be a new image that reflects the change.
    - If the user asks to "add" something, integrate it seamlessly.
    - If the user asks to "change" something (e.g., color, background), alter only that element while preserving the rest of the image's integrity.
    - If the user asks to "make it look like X", apply the style X while maintaining the original subject and composition.
4.  **Maintain Quality:** The output image should be of the same or higher quality than the original. Avoid introducing artifacts or blurriness unless specifically requested.
5.  **Return ONLY the image:** Your final output must be just the edited image. Do not add text, watermarks, or any other annotations to the image itself.

**User's Edit Instruction:**
"${input.instruction}"
`;
      
      const {media} = await ai.generate({
        model: imageGenerationModel,
        prompt: [
            { media: { url: input.imageDataUri } },
            { text: enhancedPrompt }
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
