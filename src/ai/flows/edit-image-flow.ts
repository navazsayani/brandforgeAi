
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
import { decodeHtmlEntitiesInUrl, verifyImageUrlExists } from '@/lib/utils';
import { generateImageWithFireworks } from '@/lib/fireworks-client';

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
    // Get configuration including Fireworks settings
    const { imageGenerationModel, fireworksEnabled, fireworksSDXL3Enabled } = await getModelConfig();
    
    // Determine which provider to use for editing
    let editProvider = input.provider || 'GEMINI';
    
    // If Fireworks is enabled and no provider specified, use intelligent selection
    if (!input.provider && fireworksEnabled && fireworksSDXL3Enabled) {
      // For image editing, SDXL 3 with img2img provides better control
      editProvider = 'FIREWORKS_SDXL_3';
      console.log(`[editImageFlow] Using Fireworks SDXL 3 for enhanced img2img editing`);
    }

    console.log(`[editImageFlow] Starting refinement with provider: ${editProvider}`);
    console.log(`[editImageFlow] Instruction: ${input.instruction}`);
    
    // Check if the input is a URL and fetch it on the server if necessary
    let imageDataUri = input.imageDataUri;
    if (imageDataUri.startsWith('http')) {
      // Decode HTML entities that might be present in the URL (e.g., &amp; -> &)
      const decodedUrl = decodeHtmlEntitiesInUrl(imageDataUri);
      
      console.log(`[editImageFlow] Detected URL, fetching image data from: ${decodedUrl}`);
      if (decodedUrl !== imageDataUri) {
        console.log(`[editImageFlow] URL was HTML-encoded, decoded from: ${imageDataUri}`);
      }
      
      // First verify the image exists
      const imageExists = await verifyImageUrlExists(imageDataUri);
      if (!imageExists) {
        throw new Error(`Image not found or inaccessible: ${decodedUrl.substring(0, 100)}... This could indicate the image was deleted from Firebase Storage or the URL is invalid.`);
      }
      
      try {
        const response = await fetch(decodedUrl);
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

    // Enhanced prompt for image editing
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

    // Execute editing based on selected provider
    if (editProvider === 'FIREWORKS_SDXL_3' && fireworksEnabled) {
      console.log(`[editImageFlow] Using Fireworks SDXL 3 for img2img editing`);
      
      try {
        // Convert data URI to base64 for Fireworks API
        const base64Match = imageDataUri.match(/^data:image\/[^;]+;base64,(.+)$/);
        if (!base64Match) {
          throw new Error('Invalid image data URI format');
        }
        const base64Image = base64Match[1];
        
        // Use Fireworks SDXL 3 for precise img2img editing
        const editedImages = await generateImageWithFireworks({
          model: 'stable-diffusion-xl-1024-v1-0', // SDXL 3
          prompt: enhancedPrompt,
          image: base64Image, // img2img input
          strength: input.fireworksImg2ImgStrength || 0.7, // Moderate transformation
          guidance_scale: input.fireworksGuidanceScale || 7.5,
          num_inference_steps: 25, // Higher steps for quality editing
          num_images: 1,
          width: 1024,
          height: 1024
        });
        
        if (!editedImages || editedImages.length === 0) {
          throw new Error('Fireworks API returned no edited images');
        }
        
        console.log(`[editImageFlow] Successfully edited image using Fireworks SDXL 3`);
        return { editedImageDataUri: editedImages[0] };
        
      } catch (error: any) {
        console.error(`[editImageFlow] Fireworks editing failed, falling back to Gemini:`, error);
        // Fall back to Gemini if Fireworks fails
        editProvider = 'GEMINI';
      }
    }
    
    // Use Gemini for editing (original implementation or fallback)
    if (editProvider === 'GEMINI') {
      console.log(`[editImageFlow] Using Gemini for image editing`);
      
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
    
    throw new Error(`Unsupported edit provider: ${editProvider}`);

  }
);
