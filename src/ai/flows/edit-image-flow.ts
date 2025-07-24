
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
    
    // Check if the input is a URL and fetch it on the server if necessary
    let imageDataUri = input.imageDataUri;
    if (imageDataUri.startsWith('http')) {
      console.log(`[editImageFlow] Detected URL, fetching image data from: ${imageDataUri}`);
      try {
        const response = await fetch(imageDataUri);
        if (!response.ok) {
          throw new Error(`HTTP error fetching media '${imageDataUri}': ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        imageDataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;
        console.log(`[editImageFlow] Successfully converted URL to data URI.`);
      } catch (fetchError: any) {
        console.error(`[editImageFlow] Failed to fetch image from URL:`, fetchError);
        throw new Error(`Error fetching image data: ${fetchError.message}`);
      }
    }

    const enhancedPrompt = `You are a master AI photo editor and digital artist. Your primary goal is to perform precise, high-fidelity edits on a provided image based on a user's instruction, preserving the original image's integrity as much as possible.

**//-- EXECUTION HIERARCHY --//**
Your execution must follow these rules in order of importance:

1.  **PRESERVE UNEDITED ELEMENTS (Highest Priority):** Do NOT change any part of the image that is not directly targeted by the user's instruction. The core subject, background elements, and overall composition must remain identical unless the instruction explicitly asks to change them.

2.  **EXECUTE THE INSTRUCTION PRECISELY:** Fulfill the user's request with surgical precision.
    *   **Addition:** If asked to "add a cat," integrate a cat that matches the image's lighting, perspective, and style seamlessly.
    *   **Modification:** If asked to "make the dress red," only change the dress color, carefully maintaining its texture, shadows, and highlights.
    *   **Style Change:** If asked to "make it look like a watercolor painting," apply the watercolor style while preserving the original subjects and composition.

3.  **MAINTAIN VISUAL COHERENCE:** The final image must be believable and internally consistent. Ensure lighting, shadows, reflections, and perspective are logical and harmonious after the edit. The edit should not look "pasted on."

**//-- FINAL OUTPUT REQUIREMENTS --//**
-   The output must be ONLY the final, edited image.
-   Do not add any text, watermarks, or annotations.
-   The image resolution and quality must be equal to or higher than the original.

**Instruction to execute:**
"${input.instruction}"
`;
      
      const {media} = await ai.generate({
        model: imageGenerationModel,
        prompt: [
            { media: { url: imageDataUri } },
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

  }
);
