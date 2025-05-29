
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
  industry: z.string().optional().describe('The industry or type of the brand, e.g., "Fashion & Apparel", "Technology".'),
  imageStyle: z
    .string()
    .describe(
      'A description of the desired artistic style for the generated images, e.g., "photorealistic", "minimalist", "vibrant", "professional", "impressionistic". This heavily influences the final look.'
    ),
  exampleImage: z
    .string()
    .url()
    .describe(
      "An example image as a URL. This image primarily defines the *item category*."
    )
    .optional(),
  aspectRatio: z
    .string()
    .describe("The desired aspect ratio for the image, e.g., '1:1', '4:5', '16:9'.")
    .optional(),
  numberOfImages: z.number().int().min(1).max(4).optional().default(1)
    .describe("The number of images to generate in this batch (1-4)."),
  negativePrompt: z.string().optional().describe("Elements to avoid in the generated image."),
  seed: z.number().int().optional().describe("An optional seed for image generation to promote reproducibility."),
  finalizedTextPrompt: z.string().optional().describe("A complete, user-edited text prompt that should be used directly for image generation, potentially overriding constructed prompts."),
});
export type GenerateImagesInput = z.infer<typeof GenerateImagesInputSchema>;

const GenerateImagesOutputSchema = z.object({
  generatedImages: z.array(z
    .string()
    .describe(
      "A generated image as a data URI that includes a MIME type and uses Base64 encoding. The format will be: 'data:<mimetype>;base64,<encoded_data>'."
    )
  ),
  promptUsed: z.string().describe("The text prompt that was used to generate the first image in the batch."),
});
export type GenerateImagesOutput = z.infer<typeof GenerateImagesOutputSchema>;

// Helper function for Gemini image generation
async function _generateImageWithGemini(params: {
  aiInstance: typeof ai;
  promptParts: ({text: string} | {media: {url: string}})[];
}): Promise<string> {
  const { aiInstance, promptParts } = params;
  const safetySettingsConfig = [
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ];

  // This log is crucial for debugging the exact payload to Gemini
  console.log("Final prompt parts array for Gemini _generateImageWithGemini:", JSON.stringify(promptParts, null, 2));

  const {media} = await aiInstance.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    prompt: promptParts,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      safetySettings: safetySettingsConfig,
    },
  });

  if (!media || !media.url) {
    console.error(`AI image generation failed. Media object or URL is missing. Response media:`, JSON.stringify(media, null, 2));
    throw new Error(`AI failed to generate image or returned an invalid image format. Check server logs for details.`);
  }
  if (typeof media.url !== 'string' || !media.url.startsWith('data:')) {
    console.error(`AI image generation failed. Media URL is not a valid data URI. Received URL:`, media.url);
    throw new Error(`AI returned image, but its format (URL) is invalid. Expected a data URI. Check server logs for details.`);
  }
  return media.url;
}

async function _generateImageWithLeonardoAI_stub(params: {
  brandDescription: string;
  industry?: string;
  imageStyle: string;
  exampleImage?: string;
  aspectRatio?: string;
  negativePrompt?: string;
  seed?: number;
  textPrompt: string;
}): Promise<string> {
  console.warn("Leonardo.ai image generation is called but not implemented. Parameters:", params);
  throw new Error("Leonardo.ai provider is not implemented yet.");
}

async function _generateImageWithImagen_stub(params: {
  brandDescription: string;
  industry?: string;
  imageStyle: string;
  exampleImage?: string;
  aspectRatio?: string;
  negativePrompt?: string;
  seed?: number;
  textPrompt: string;
}): Promise<string> {
  console.warn("Imagen (e.g., via Vertex AI) provider is called but not implemented. Parameters:", params);
  throw new Error("Imagen provider (e.g., via Vertex AI) is not implemented yet. This would typically involve a different Genkit plugin or direct API calls.");
}


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
      industry,
      imageStyle,
      exampleImage,
      aspectRatio, // Still needed for stubs and if finalizedTextPrompt is NOT used
      numberOfImages = 1,
      negativePrompt, // Still needed if finalizedTextPrompt is NOT used
      seed, // Still needed if finalizedTextPrompt is NOT used
      finalizedTextPrompt,
    } = input;

    const generatedImageUrls: string[] = [];
    const imageGenerationProvider = process.env.IMAGE_GENERATION_PROVIDER || 'GEMINI';
    let actualPromptUsedForFirstImage = "";

    for (let i = 0; i < numberOfImages; i++) {
        let textPromptContent = "";
        const industryContext = industry ? ` The brand operates in the ${industry} industry.` : "";

        if (finalizedTextPrompt && finalizedTextPrompt.trim() !== "") {
            console.log(`Using finalized text prompt for image ${i+1}: "${finalizedTextPrompt}"`);
            textPromptContent = finalizedTextPrompt;
            // If finalizedTextPrompt is used, we assume it contains all necessary textual instructions.
            // Structural elements like `exampleImage` are handled when building `finalPromptParts`.
            // `aspectRatio` and `seed` might be ignored here if user is expected to put them in `finalizedTextPrompt`.
            // However, for Gemini, if `exampleImage` is present, it MUST be part of the prompt array.
        } else {
            // Construct prompt if no finalized prompt is given
            if (!brandDescription || !imageStyle) {
                // This check is important if finalizedTextPrompt is allowed to be empty but wasn't provided from client
                throw new Error("Brand description and image style are required if not providing/using a finalized text prompt.");
            }
            console.log(`Constructing prompt for image ${i+1} as no finalized prompt was provided or it was empty.`);
            if (exampleImage) {
                textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.

The provided example image (sent first) serves ONE primary purpose: to identify the *category* of the item depicted (e.g., 'a handbag', 'a t-shirt', 'a piece of furniture', 'a pair of shoes').

Your task is to generate a *completely new item* belonging to this *same category*.

The *design, appearance, theme, specific characteristics, and unique elements* of this NEW item must be **primarily and heavily derived** from the following inputs:
1.  **Brand Description**: "${brandDescription}"${industryContext} - This is the primary driver for the core design, theme, specific characteristics, and unique elements of the new item.
2.  **Desired Artistic Style**: "${imageStyle}" - This dictates the rendering style of the new item. If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic and look like a real product photo.

**Crucially, do NOT replicate or closely imitate the visual design details (color, pattern, specific shape elements beyond the basic category identification, embellishments) of the provided example image.** The example image is *only* for determining the item category. The new image should look like a distinct product that fits the brand description and desired artistic style.

For instance, if the example image is a 'simple blue cotton t-shirt' (category: t-shirt), and the Brand Description is 'luxury, silk, minimalist, black and gold accents for a high-end fashion brand' and the Desired Artistic Style is 'high-fashion product shot', you should generate an image of a *luxury black silk t-shirt with gold accents, shot in a high-fashion product style*. It should *not* look like the original blue cotton t-shirt.
`.trim();
            } else { // No example image
                textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.
The image should be based on the following concept: "${brandDescription}".${industryContext}
The desired artistic style for this new image is: "${imageStyle}". If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic.
`.trim();
            }

            // Append other instructions ONLY if not using a finalized prompt
            if (negativePrompt) {
                textPromptContent += `\n\nAvoid the following elements or characteristics in the image: ${negativePrompt}.`;
            }
            if (aspectRatio) {
              textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally.`;
            }
            if (seed !== undefined) {
              textPromptContent += `\n\nUse seed: ${seed}.`;
            }
        }

        if (numberOfImages > 1 && (!finalizedTextPrompt || !finalizedTextPrompt.toLowerCase().includes("batch generation")) && (!finalizedTextPrompt || !finalizedTextPrompt.toLowerCase().includes(`image ${i+1}`))) {
          // This instruction is appended even to finalizedTextPrompt if it doesn't seem to handle batching,
          // but user could explicitly manage this in their finalizedTextPrompt too.
            textPromptContent += `\n\nImportant for batch generation: You are generating image ${i + 1} of a set of ${numberOfImages}. All images in this set should feature the *same core subject or item* as described/derived from the inputs. For this specific image (${i + 1}/${numberOfImages}), try to vary the pose, angle, or minor background details slightly compared to other images in the set, while maintaining the identity of the primary subject. The goal is a cohesive set of images showcasing the same item from different perspectives or with subtle variations.`;
        }

        if (i === 0) {
            actualPromptUsedForFirstImage = textPromptContent;
        }

        console.log(`Text component of prompt for image ${i+1}/${numberOfImages} (Provider: ${imageGenerationProvider}): "${textPromptContent}"`);

        try {
            let imageUrl = "";
            const baseGenerationParamsForStubs = { // For non-Gemini stubs
                brandDescription: brandDescription || "",
                industry,
                imageStyle: imageStyle || "",
                exampleImage,
                aspectRatio,
                negativePrompt,
                seed,
                textPrompt: textPromptContent,
            };

            switch (imageGenerationProvider.toUpperCase()) {
                case 'GEMINI':
                    const finalPromptParts: ({text: string} | {media: {url: string}})[] = [];
                    if (exampleImage) { // exampleImage is from the input to the flow
                        finalPromptParts.push({ media: { url: exampleImage } });
                    }
                    finalPromptParts.push({ text: textPromptContent }); // textPromptContent is either finalized or constructed

                    imageUrl = await _generateImageWithGemini({
                        aiInstance: ai,
                        promptParts: finalPromptParts
                    });
                    break;
                case 'LEONARDO_AI':
                    imageUrl = await _generateImageWithLeonardoAI_stub(baseGenerationParamsForStubs);
                    break;
                case 'IMAGEN':
                    imageUrl = await _generateImageWithImagen_stub(baseGenerationParamsForStubs);
                    break;
                default:
                    throw new Error(`Unsupported image generation provider: ${imageGenerationProvider}`);
            }
            generatedImageUrls.push(imageUrl);
        } catch (error: any) {
             console.error(`Error during generation of image ${i+1}/${numberOfImages} with provider ${imageGenerationProvider}:`, error);
             const failingPromptSnippet = textPromptContent.substring(0, 200) + (textPromptContent.length > 200 ? "..." : "");
             throw new Error(`Failed to generate image ${i+1} of ${numberOfImages} with provider ${imageGenerationProvider}. Prompt snippet: "${failingPromptSnippet}". Error: ${error.message}`);
        }
    }

    if (generatedImageUrls.length === 0 && numberOfImages > 0) {
        throw new Error("AI failed to generate any images for the batch.");
    }

    return {generatedImages: generatedImageUrls, promptUsed: actualPromptUsedForFirstImage };
  }
);
    