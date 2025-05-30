
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
      'A description of the desired artistic style for the generated images. For Freepik, this should be one of their specific enum values (e.g., "photo", "anime"). For Gemini, it can be more descriptive (e.g., "photorealistic, minimalist"). This heavily influences the final look.'
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
      "A generated image as a data URI that includes a MIME type and uses Base64 encoding. The format will be: 'data:<mimetype>;base64,<encoded_data>', or a public URL if from a third-party provider."
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

  console.log("Final prompt parts array for Gemini _generateImageWithGemini:", JSON.stringify(promptParts, null, 2));

  try {
    const {media} = await aiInstance.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: safetySettingsConfig,
      },
    });

    if (!media || !media.url) {
      console.error(`AI image generation failed after generate call. Media object or URL is missing. Response media:`, JSON.stringify(media, null, 2));
      throw new Error(`AI failed to generate image or returned an invalid image format after successful API call. Check server logs for details.`);
    }
    if (typeof media.url !== 'string' || !(media.url.startsWith('data:') || media.url.startsWith('http'))) {
      console.error(`AI image generation failed after generate call. Media URL is not a valid data URI or HTTP(S) URL. Received URL:`, media.url);
      throw new Error(`AI returned image, but its format (URL) is invalid after successful API call. Expected a data URI or HTTP(S) URL. Check server logs for details.`);
    }
    return media.url;
  } catch (error: any) {
    console.error("Error directly from ai.generate() in _generateImageWithGemini:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(`Error during ai.generate call: ${error.message || 'Unknown error from ai.generate()'}. Check server logs for full error object.`);
  }
}

async function _generateImageWithLeonardoAI_stub(params: {
  brandDescription: string;
  industry?: string;
  imageStyle: string; // This is the preset style
  exampleImage?: string;
  aspectRatio?: string;
  negativePrompt?: string;
  seed?: number;
  textPrompt: string; // This is the full text prompt including custom notes
}): Promise<string> {
  console.warn("Leonardo.ai image generation is called but not implemented. Parameters:", params);
  throw new Error("Leonardo.ai provider is not implemented yet.");
}

async function _generateImageWithImagen_stub(params: {
  brandDescription: string;
  industry?: string;
  imageStyle: string; // This is the preset style
  exampleImage?: string;
  aspectRatio?: string;
  negativePrompt?: string;
  seed?: number;
  textPrompt: string; // This is the full text prompt including custom notes
}): Promise<string> {
  console.warn("Imagen (e.g., via Vertex AI) provider is called but not implemented. Parameters:", params);
  throw new Error("Imagen provider (e.g., via Vertex AI) is not implemented yet. This would typically involve a different Genkit plugin or direct API calls.");
}

async function _generateImageWithFreepik(params: {
  textPrompt: string; // This is the full text prompt including custom notes
  imageStyle: string; // This is the Freepik-specific enum style from the preset
  negativePrompt?: string;
  seed?: number;
  aspectRatio?: string;
  // Other params like brandDescription, industry, exampleImage are available in `params` but may not be directly used by Freepik's primary API call if not supported by specific fields. They are part of `textPrompt`.
}): Promise<string> {
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  if (!freepikApiKey) {
    throw new Error("FREEPIK_API_KEY is not set in environment variables.");
  }

  let freepikSize = "square_1_1"; // Default
  if (params.aspectRatio) {
    switch (params.aspectRatio) {
      case "1:1":
        freepikSize = "square_1_1";
        break;
      case "4:5": 
        freepikSize = "traditional_3_4"; // Mapped from 4:5
        console.warn(`Mapping UI aspect ratio '4:5' to Freepik 'traditional_3_4'.`);
        break;
      case "16:9":
        freepikSize = "widescreen_16_9";
        break;
      case "9:16":
        freepikSize = "social_story_9_16";
        break;
      default:
        console.warn(`Unsupported aspect ratio '${params.aspectRatio}' for Freepik, defaulting to square_1_1.`);
        freepikSize = "square_1_1";
    }
  }
  
  const requestBody: any = {
    prompt: params.textPrompt, // The full text prompt
    num_images: 1,
    image: {
      size: freepikSize,
    },
    guidance_scale: 1.0, 
    filter_nsfw: true,
  };

  if (params.negativePrompt) {
    requestBody.negative_prompt = params.negativePrompt;
  }
  if (params.seed !== undefined) {
    requestBody.seed = params.seed;
  }

  // Use the Freepik-specific enum for styling.style
  if (params.imageStyle) { 
    requestBody.styling = { style: params.imageStyle };
  }


  console.log("Sending request to Freepik API with body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch("https://api.freepik.com/v1/ai/text-to-image", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': freepikApiKey,
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log("Response from Freepik API:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      throw new Error(`Freepik API error: ${response.status} - ${responseData.title || responseData.detail || JSON.stringify(responseData)}`);
    }

    if (responseData.data && responseData.data.length > 0 && responseData.data[0].url) {
      return responseData.data[0].url;
    } else {
      throw new Error("Freepik API did not return image URL in expected format.");
    }
  } catch (error: any) {
    console.error("Error calling Freepik API:", error);
    throw new Error(`Freepik API request failed: ${error.message}`);
  }
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
      imageStyle, // This is the style preset (e.g., Freepik enum or descriptive style for Gemini)
      // customStyleNotes is now part of finalizedTextPrompt or included in constructed textPrompt below
      exampleImage,
      aspectRatio,
      numberOfImages = 1,
      negativePrompt,
      seed,
      finalizedTextPrompt,
    } = input;

    const generatedImageUrls: string[] = [];
    const imageGenerationProvider = process.env.IMAGE_GENERATION_PROVIDER || 'GEMINI';
    let actualPromptUsedForFirstImage = "";
    const compositionGuidance = "IMPORTANT COMPOSITION RULE: When depicting human figures as the primary subject, the image *must* be well-composed. Avoid awkward or unintentional cropping of faces or key body parts. Ensure the figure is presented naturally and fully within the frame, unless the prompt *explicitly* requests a specific framing like 'close-up', 'headshot', 'upper body shot', or an artistic crop. Prioritize showing the entire subject if it's a person.";


    for (let i = 0; i < numberOfImages; i++) {
        let textPromptContent = "";
        const industryContext = industry ? ` The brand operates in the ${industry} industry.` : "";
        // Custom style notes are now expected to be part of finalizedTextPrompt if provided,
        // or they are incorporated into the textPromptContent construction if not.
        // The `imageStyle` variable here refers to the *preset* selected.
        
        if (finalizedTextPrompt && finalizedTextPrompt.trim() !== "") {
            console.log(`Using finalized text prompt for image ${i+1}: "${finalizedTextPrompt.substring(0,100)}..."`);
            textPromptContent = finalizedTextPrompt;
            
            // For Gemini, structural elements might still be appended if not detected in the finalized prompt
            if (imageGenerationProvider.toUpperCase() === 'GEMINI') {
                if (aspectRatio && !finalizedTextPrompt.toLowerCase().includes("aspect ratio")) {
                  textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally.`;
                }
                if (seed !== undefined && !finalizedTextPrompt.toLowerCase().includes("seed:")) {
                  textPromptContent += `\n\nUse seed: ${seed}.`;
                }
                 if (!finalizedTextPrompt.toLowerCase().includes("crop") && !finalizedTextPrompt.toLowerCase().includes("close-up") && !finalizedTextPrompt.toLowerCase().includes("headshot") && !finalizedTextPrompt.toLowerCase().includes("portrait") && !finalizedTextPrompt.toLowerCase().includes("figure framing") && !finalizedTextPrompt.toLowerCase().includes("composition")) {
                    textPromptContent += `\n\n${compositionGuidance}`;
                }
            }
            // For Freepik, the finalizedTextPrompt is used as the main 'prompt'.
            // The `imageStyle` (preset) is passed separately to `_generateImageWithFreepik`.
            // Negative prompt, aspect ratio, seed are also passed separately if available and handled by the Freepik helper.
        } else {
            console.log(`Constructing prompt for image ${i+1} as no finalized prompt was provided or it was empty.`);
            if (!brandDescription || !imageStyle) { // imageStyle here is the preset
                throw new Error("Brand description and image style preset are required if not providing/using a finalized text prompt.");
            }
            
            // This constructed prompt will include customStyleNotes if they were part of the input.brandDescription/imageStyle
            // However, customStyleNotes are now baked into the client-side preview prompt construction.
            // So, the `brandDescription` from input already includes custom notes if previewed.
            // If not previewed, `imageStyle` from input is preset, and `brandDescription` is just brand desc.
            // For consistency, assume customStyleNotes (if any) are already part of the `brandDescription` or `imageStyle` if passed to this backend construction.
            // The client-side `handlePreviewPromptClick` now bakes custom notes into the text.
            // And `handleImageGenerationSubmit` passes the main imageStyle preset separately.

            // The client-side preview prompt logic (handlePreviewPromptClick) now embeds customStyleNotes into the text.
            // So, the 'imageStyle' here is the preset, and 'brandDescription' here already contains customStyleNotes if preview was used.
            // This constructed prompt is a fallback if no finalizedTextPrompt is provided.
            if (exampleImage) {
                textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.

The provided example image (sent first) serves ONE primary purpose: to identify the *category* of the item depicted (e.g., 'a handbag', 'a t-shirt', 'a piece of furniture', 'a pair of shoes').

Your task is to generate a *completely new item* belonging to this *same category*.

The *design, appearance, theme, specific characteristics, and unique elements* of this NEW item must be **primarily and heavily derived** from the following inputs:
1.  **Brand Description**: "${brandDescription}"${industryContext}. This description informs the *theme, conceptual elements, and unique characteristics* of the new item.
2.  **Desired Artistic Style**: "${imageStyle}". This dictates the overall visual execution, including aspects like color palette (unless the brand description very strongly and specifically dictates a color scheme), lighting, and rendering style. If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic and look like a real product photo.

**Important Note on Color and Style**: While the brand description provides thematic guidance, strive for visual variety and avoid over-relying on a narrow color palette (like exclusively black and gold) unless the brand description *and* desired artistic style overwhelmingly and explicitly demand it. The goal is a fresh interpretation that fits the brand's *overall essence* and the *chosen artistic style*.

**Crucially, do NOT replicate or closely imitate the visual design details (color, pattern, specific shape elements beyond the basic category identification, embellishments) of the provided example image.** The example image is *only* for determining the item category. The new image should look like a distinct product that fits the brand description and desired artistic style.

**Example of Interaction:**
If the example image is a 'simple blue cotton t-shirt' (category: t-shirt), the Brand Description is 'luxury brand, minimalist ethos, inspired by serene nature, prefers organic materials', and the Desired Artistic Style is 'high-fashion product shot, muted earthy tones'.
You should generate an image of a *luxury t-shirt made from organic-looking material, in muted earthy tones (e.g., moss green, stone grey, soft beige), shot in a high-fashion product style*. It should evoke serenity and minimalism. It should NOT be the original blue cotton t-shirt, nor should it default to a generic "luxury" color scheme like black and gold unless those colors are specifically requested or strongly implied by the *combination* of inputs.

${compositionGuidance}
`.trim();
            } else { // No example image
                textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.
The image should be based on the following concept: "${brandDescription}".${industryContext}
The desired artistic style for this new image is: "${imageStyle}". If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic.
**Important Note on Color and Style**: Strive for visual variety that aligns with the brand description and artistic style. Avoid defaulting to a narrow or stereotypical color palette unless the inputs strongly and explicitly demand it.

${compositionGuidance}
`.trim();
            }

            if (negativePrompt) {
                textPromptContent += `\n\nAvoid the following elements or characteristics in the image: ${negativePrompt}.`;
            }
            
            // Append structural elements only if NOT using Freepik (Freepik handles these as separate params)
            // OR if using Gemini (which takes them in the text prompt)
            if (imageGenerationProvider.toUpperCase() === 'GEMINI' ) { 
                if (aspectRatio) {
                  textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally.`;
                }
                if (seed !== undefined) {
                  textPromptContent += `\n\nUse seed: ${seed}.`;
                }
            }
        }
        
        if (numberOfImages > 1 && imageGenerationProvider.toUpperCase() === 'GEMINI' && (!finalizedTextPrompt || (!finalizedTextPrompt.toLowerCase().includes("batch generation") && !finalizedTextPrompt.toLowerCase().includes(`image ${i+1}`)))) {
             textPromptContent += `\n\nImportant for batch generation: You are generating image ${i + 1} of a set of ${numberOfImages}. All images in this set should feature the *same core subject or item* as described/derived from the inputs. For this specific image (${i + 1}/${numberOfImages}), try to vary the pose, angle, or minor background details slightly compared to other images in the set, while maintaining the identity of the primary subject. The goal is a cohesive set of images showcasing the same item from different perspectives or with subtle variations.`;
        }


        if (i === 0) {
            actualPromptUsedForFirstImage = textPromptContent;
        }
        
        console.log(`Text component of prompt for image ${i+1}/${numberOfImages} (Provider: ${imageGenerationProvider}): "${textPromptContent.substring(0,200)}..."`);

        try {
            let imageUrl = "";
            
            // Base parameters passed to all provider-specific helper functions
            const baseGenerationParams = {
                brandDescription: brandDescription || "", // Fallback for Freepik if needed, though textPrompt has it
                industry,
                imageStyle: imageStyle || "", // This is the preset (Freepik enum or descriptive for Gemini)
                exampleImage,
                aspectRatio,
                negativePrompt,
                seed,
                textPrompt: textPromptContent, // The fully constructed or finalized text prompt
            };

            const finalPromptPartsForGemini: ({text: string} | {media: {url: string}})[] = [];
            if (exampleImage && imageGenerationProvider.toUpperCase() === 'GEMINI') { 
                finalPromptPartsForGemini.push({ media: { url: exampleImage } });
            }
            finalPromptPartsForGemini.push({ text: textPromptContent }); 

            switch (imageGenerationProvider.toUpperCase()) {
                case 'GEMINI':
                    console.log("Attempting Gemini image generation with prompt parts:", JSON.stringify(finalPromptPartsForGemini, null, 2));
                    imageUrl = await _generateImageWithGemini({
                        aiInstance: ai,
                        promptParts: finalPromptPartsForGemini
                    });
                    break;
                case 'LEONARDO_AI':
                    imageUrl = await _generateImageWithLeonardoAI_stub(baseGenerationParams);
                    break;
                case 'IMAGEN': 
                    imageUrl = await _generateImageWithImagen_stub(baseGenerationParams);
                    break;
                case 'FREEPIK':
                     console.log("Attempting Freepik image generation with params:", JSON.stringify(baseGenerationParams, null, 2));
                     // Freepik helper receives the main `textPrompt` and specific `imageStyle` for its enum.
                    imageUrl = await _generateImageWithFreepik({
                        textPrompt: textPromptContent,
                        imageStyle: imageStyle, // The preset enum for Freepik
                        negativePrompt: negativePrompt,
                        seed: seed,
                        aspectRatio: aspectRatio,
                    });
                    break;
                default:
                    throw new Error(`Unsupported image generation provider: ${imageGenerationProvider}`);
            }
            generatedImageUrls.push(imageUrl);
        } catch (error: any) {
             console.error(`Error during generation of image ${i+1}/${numberOfImages} with provider ${imageGenerationProvider}. Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
             const failingPromptSnippet = textPromptContent.substring(0, 200) + (textPromptContent.length > 200 ? "..." : "");
             throw new Error(`Failed to generate image ${i+1} of ${numberOfImages}. Error from provider: ${error.message || 'Unknown error'}. Prompt snippet: "${failingPromptSnippet}".`);
        }
    }

    if (generatedImageUrls.length === 0 && numberOfImages > 0) {
        throw new Error("AI failed to generate any images for the batch.");
    }

    return {generatedImages: generatedImageUrls, promptUsed: actualPromptUsedForFirstImage };
  }
);

    