
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
    .describe('A detailed description of the brand and its values. This will be used for subtle thematic influence on the new item.'),
  imageStyle: z
    .string()
    .describe(
      'A description of the desired artistic style for the generated images, e.g., "photorealistic", "minimalist", "vibrant", "professional", "impressionistic". This heavily influences the final look.'
    ),
  exampleImage: z
    .string()
    .describe(
      "An example image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image primarily defines the *item category*."
    )
    .optional(),
  aspectRatio: z
    .string()
    .describe("The desired aspect ratio for the image, e.g., '1:1', '4:5', '16:9'.")
    .optional(),
  numberOfImages: z.number().int().min(1).max(4).optional().default(1)
    .describe("The number of images to generate in this batch (1-4)."),
});
export type GenerateImagesInput = z.infer<typeof GenerateImagesInputSchema>;

const GenerateImagesOutputSchema = z.object({
  generatedImages: z.array(z
    .string()
    .describe(
      "A generated image as a data URI that includes a MIME type and uses Base64 encoding. The format will be: 'data:<mimetype>;base64,<encoded_data>'."
    )
  ),
});
export type GenerateImagesOutput = z.infer<typeof GenerateImagesOutputSchema>;

export async function generateImages(input: GenerateImagesInput): Promise<GenerateImagesOutput> {
  return generateImagesFlow(input);
}

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
      aspectRatio,
      numberOfImages = 1, // Default to 1 if not provided
    } = input;

    if (!brandDescription || !imageStyle) {
        throw new Error("Brand description and image style are required for image generation.");
    }
    if (exampleImage && !exampleImage.startsWith('data:')) {
        throw new Error("Example image was provided but is not a valid data URI.");
    }

    const generatedImageUrls: string[] = [];

    for (let i = 0; i < numberOfImages; i++) {
        const finalPromptParts: ({text: string} | {media: {url: string}})[] = [];
        let textPromptContent = "";

        if (exampleImage && exampleImage.startsWith('data:')) {
            finalPromptParts.push({ media: { url: exampleImage } });
            textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.

The provided example image (sent first) is a reference.
1.  Identify the main *category* of the item in the example image (e.g., 'a handbag', 'a t-shirt', 'a piece of furniture').
3.  The "Desired Artistic Style" input is: "${imageStyle}". This is a critical instruction for the final rendering. If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic.
4.  The "Brand Description" is: "${brandDescription}". This description is the **primary driver** for the core design, theme, specific characteristics, and unique elements of the *new* item. It should provide substantial conceptual input. For instance, if the example is a 'minimalist white sneaker' and the brand is 'eco-friendly, nature-inspired, with subtle leaf motifs', you should generate new minimalist white sneakers that prominently feature these eco-friendly and nature-inspired themes, perhaps with visible leaf motifs or textures derived from nature.
5.  The final image must be of the *same type of item* as the example image but should appear as a *new, distinct version or variation*. It should be clearly different from the example image while still being recognizable as belonging to the same category, now heavily infused with brand-thematic elements.

Do NOT simply replicate the example image. Create a new iteration that looks realistic (if implied by the style) and compelling.
`.trim();
        } else { // No example image
            textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.
The image should be based on the following concept: "${brandDescription}".
The desired artistic style for this new image is: "${imageStyle}". If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic.
`.trim();
        }

        if (aspectRatio) {
          textPromptContent += ` The final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally.`;
        }
        
        finalPromptParts.push({ text: textPromptContent });

        console.log(`Attempting image generation ${i+1} of ${numberOfImages} with prompt parts:`, JSON.stringify(finalPromptParts, null, 2));

        try {
            const {media} = await ai.generate({
              model: 'googleai/gemini-2.0-flash-exp',
              prompt: finalPromptParts,
              config: {
                responseModalities: ['TEXT', 'IMAGE'],
                 safetySettings: [
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
              },
            });

            if (!media || !media.url) {
                console.error(`AI image generation failed for image ${i+1}. Media object or URL is missing. Response media:`, JSON.stringify(media, null, 2));
                // Optionally, decide if one failure should stop the whole batch or just skip this image
                // For now, we'll throw, which stops the batch.
                throw new Error(`AI failed to generate image ${i+1} or returned an invalid image format. Check server logs.`);
            }
            if (typeof media.url !== 'string' || !media.url.startsWith('data:')) {
                console.error(`AI image generation failed for image ${i+1}. Media URL is not a valid data URI. Received URL:`, media.url);
                throw new Error(`AI returned image ${i+1}, but its format (URL) is invalid. Expected a data URI.`);
            }
            generatedImageUrls.push(media.url);
        } catch (error: any) {
             console.error(`Error during generation of image ${i+1}/${numberOfImages}:`, error);
             // Re-throw to let the action handler catch it, or decide on partial success strategy
             throw new Error(`Failed to generate image ${i+1} of ${numberOfImages}. Error: ${error.message}`);
        }
    }

    if (generatedImageUrls.length === 0 && numberOfImages > 0) {
        throw new Error("AI failed to generate any images for the batch.");
    }
    
    return {generatedImages: generatedImageUrls};
  }
);
