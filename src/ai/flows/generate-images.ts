
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
  provider: z.enum(['GEMINI', 'FREEPIK', 'LEONARDO_AI', 'IMAGEN']).optional().describe("The image generation provider to use."),
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
    .describe("The desired aspect ratio for the image, e.g., '1:1', '4:5', '16:9' or Freepik specific enums like 'square_1_1'.")
    .optional(),
  numberOfImages: z.number().int().min(1).max(4).optional().default(1)
    .describe("The number of images to generate in this batch (1-4)."),
  negativePrompt: z.string().optional().describe("Elements to avoid in the generated image."),
  seed: z.number().int().optional().describe("An optional seed for image generation to promote reproducibility. For Freepik/Imagen3, this is not currently passed."),
  finalizedTextPrompt: z.string().optional().describe("A complete, user-edited text prompt that should be used directly for image generation, potentially overriding constructed prompts."),
  
  // Freepik specific styling options
  freepikStylingColors: z.array(z.object({
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color code e.g. #FF0000"),
      weight: z.number().min(0.05).max(1).default(0.5)
  })).min(1).max(5).optional().describe("Up to 5 dominant hex colors for Freepik image generation, with optional weights."),
  freepikEffectColor: z.string().optional().describe("Freepik specific color effect enum (e.g., for Imagen3: 'b&w', 'pastel')."),
  freepikEffectLightning: z.string().optional().describe("Freepik specific lightning effect enum (e.g., for Imagen3: 'studio', 'warm')."),
  freepikEffectFraming: z.string().optional().describe("Freepik specific framing effect enum (e.g., for Imagen3: 'portrait', 'macro')."),
});
export type GenerateImagesInput = z.infer<typeof GenerateImagesInputSchema>;

const GenerateImagesOutputSchema = z.object({
  generatedImages: z.array(z
    .string() 
    .describe(
      "A generated image as a data URI, a task ID for asynchronous providers, or a direct image URL if immediately available from providers like Freepik/Imagen3."
    )
  ),
  promptUsed: z.string().describe("The text prompt that was used to generate the first image in the batch."),
  providerUsed: z.string().describe("The image generation provider that was used."),
});
export type GenerateImagesOutput = z.infer<typeof GenerateImagesOutputSchema>;

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
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
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

const freepikImagen3AspectRatios: Record<string, string> = {
    "1:1": "square_1_1",
    "9:16": "social_story_9_16",
    "16:9": "widescreen_16_9",
    "3:4": "traditional_3_4",
    "4:3": "classic_4_3",
    // Mapping 4:5 from general to a close Freepik option
    "4:5": "traditional_3_4", // Or "social_post_4_5" if that's preferred and supported by imagen3
};

const freepikValidStyles = ["photo", "digital-art", "3d", "painting", "low-poly", "pixel-art", "anime", "cyberpunk", "comic", "vintage", "cartoon", "vector", "studio-shot", "dark", "sketch", "mockup", "2000s-pone", "70s-vibe", "watercolor", "art-nouveau", "origami", "surreal", "fantasy", "traditional-japan"];


async function _initiateFreepikImageTask(params: { 
  textPrompt: string; 
  imageStyle: string; 
  exampleImage?: string; // Kept for consistent signature, but flux-dev doesn't use it
  negativePrompt?: string;
  aspectRatio?: string; 
  freepikStylingColors?: { color: string; weight: number }[];
  freepikEffectColor?: string;
  freepikEffectLightning?: string;
  freepikEffectFraming?: string;
  numberOfImages: number; // Added to pass to Freepik API
}): Promise<{ taskId: string; status: string; generatedUrls: string[] }> {
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  if (!freepikApiKey) {
    throw new Error("FREEPIK_API_KEY is not set in environment variables.");
  }

  if (params.textPrompt.length === 0) {
    throw new Error("Prompt cannot be empty for Freepik Imagen3 model.");
  }
  
  let finalFreepikAspectRatio = freepikImagen3AspectRatios[params.aspectRatio || "square_1_1"] || "square_1_1";

  const requestBody: any = {
    prompt: params.textPrompt,
    num_images: params.numberOfImages, // Use the passed numberOfImages
    aspect_ratio: finalFreepikAspectRatio,
    person_generation: "allow_all", 
    safety_settings: "block_none",  
  };
  
  if (params.negativePrompt) {
    requestBody.negative_prompt = params.negativePrompt;
  }

  const styling: any = {};
  if (params.imageStyle) {
      const directFreepikStyleMatch = freepikValidStyles.find(s => s.toLowerCase() === params.imageStyle.toLowerCase().trim().split(/[,.]/)[0]);
      if (directFreepikStyleMatch) {
          styling.style = directFreepikStyleMatch;
      } else {
          console.warn(`Freepik/Imagen3: Provided imageStyle "${params.imageStyle}" (or its first part) is not a direct Freepik enum. Relying on text prompt for detailed styling. Freepik's 'style' parameter will be omitted or set to 'photo' if no other style cues are in text prompt.`);
          if (params.imageStyle.toLowerCase().includes("photo") || params.imageStyle.toLowerCase().includes("photorealistic")) {
            styling.style = "photo";
          } else {
            // Omitting structural 'styling.style' if no direct match and not clearly 'photo', text prompt will guide Freepik.
            console.log("No direct Freepik style enum matched, omitting structural 'styling.style'. Text prompt will guide Freepik.");
          }
      }
  }

  const effects: any = {};
  if (params.freepikEffectColor && params.freepikEffectColor !== "none") effects.color = params.freepikEffectColor;
  if (params.freepikEffectLightning && params.freepikEffectLightning !== "none") effects.lightning = params.freepikEffectLightning;
  if (params.freepikEffectFraming && params.freepikEffectFraming !== "none") effects.framing = params.freepikEffectFraming;
  
  if (Object.keys(effects).length > 0) {
    styling.effects = effects;
  }

  if (params.freepikStylingColors && params.freepikStylingColors.length > 0) {
    styling.colors = params.freepikStylingColors.map(c => ({
        color: c.color,
        weight: c.weight 
    }));
  }
  
  if (Object.keys(styling).length > 0) {
      requestBody.styling = styling;
  }
  
  console.log("Sending request to Freepik API (imagen3) with body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch("https://api.freepik.com/v1/ai/text-to-image/imagen3", { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': freepikApiKey,
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log("Response from Freepik API (imagen3):", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      throw new Error(`Freepik API error (imagen3): ${response.status} - ${responseData.title || responseData.detail || JSON.stringify(responseData)}`);
    }

    if (responseData.data && responseData.data.task_id && responseData.data.status) {
      return { 
        taskId: responseData.data.task_id, 
        status: responseData.data.status,
        generatedUrls: responseData.data.generated || [] // Expecting URLs directly
      };
    } else {
      throw new Error("Freepik API (imagen3) did not return task_id and status in expected format.");
    }
  } catch (error: any) {
    console.error("Error calling Freepik API (imagen3):", error);
    throw new Error(`Freepik API request failed (imagen3): ${error.message}`);
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
      provider,
      brandDescription,
      industry,
      imageStyle, 
      exampleImage,
      aspectRatio,
      numberOfImages = 1,
      negativePrompt,
      seed,
      finalizedTextPrompt,
      freepikStylingColors,
      freepikEffectColor,
      freepikEffectLightning,
      freepikEffectFraming,
    } = input;

    const generatedImageResults: string[] = []; 
    const chosenProvider = input.provider || process.env.IMAGE_GENERATION_PROVIDER || 'GEMINI';
    let actualPromptUsedForFirstImage = "";
    const compositionGuidance = "IMPORTANT COMPOSITION RULE: When depicting human figures as the primary subject, the image *must* be well-composed. Avoid awkward or unintentional cropping of faces or key body parts. Ensure the figure is presented naturally and fully within the frame, unless the prompt *explicitly* requests a specific framing like 'close-up', 'headshot', 'upper body shot', or an artistic crop. Prioritize showing the entire subject if it's a person.";

    if (chosenProvider.toUpperCase() === 'FREEPIK') {
        console.log(`Freepik provider (imagen3) selected for a batch of ${numberOfImages} images.`);
        let textPromptForFreepik = "";
        const industryContext = industry ? ` The brand operates in the ${industry} industry.` : "";

        if (finalizedTextPrompt && finalizedTextPrompt.trim() !== "") {
            console.log(`Using finalized text prompt for Freepik batch: "${finalizedTextPrompt.substring(0,100)}..."`);
            textPromptForFreepik = finalizedTextPrompt;
            // Append composition guidance if not obviously handled by user
            if (
                !finalizedTextPrompt.toLowerCase().includes("human figure") &&
                !finalizedTextPrompt.toLowerCase().includes("crop") &&
                !finalizedTextPrompt.toLowerCase().includes("close-up") &&
                !finalizedTextPrompt.toLowerCase().includes("headshot") &&
                !finalizedTextPrompt.toLowerCase().includes("portrait") &&
                !finalizedTextPrompt.toLowerCase().includes("figure framing") &&
                !finalizedTextPrompt.toLowerCase().includes("composition")
            ) {
                 textPromptForFreepik += `\n\n${compositionGuidance}`;
            }
            // Batch instruction is handled by num_images parameter for Freepik, not textually appended to finalized prompt.
        } else {
            console.log(`Constructing prompt for Freepik batch as no finalized prompt was provided or it was empty.`);
            if (!brandDescription || !imageStyle) {
                throw new Error("Brand description and image style are required if not providing/using a finalized text prompt for Freepik.");
            }
            
            textPromptForFreepik = `Generate new, high-quality, visually appealing images suitable for social media platforms like Instagram.\n\nConcept: "${brandDescription}".${industryContext}\nDesired artistic style for these new images is: "${imageStyle}".`;
            if (negativePrompt) { 
                // Negative prompt for Freepik is handled structurally in the JSON body
                // but also including it here for textual reinforcement if needed by Freepik's text interpretation.
                textPromptForFreepik += `\n\nAvoid the following elements or characteristics in the image: ${negativePrompt}.`;
            }
            textPromptForFreepik +=`\n\n${compositionGuidance}`;
            // Batch instruction handled by num_images for Freepik.
        }
        actualPromptUsedForFirstImage = textPromptForFreepik;
        console.log(`Text component of prompt for Freepik batch: "${textPromptForFreepik.substring(0,200)}..."`);

        try {
            if (exampleImage) {
                console.warn("Freepik/Imagen3 model selected, but exampleImage was provided. The Imagen3 API for text-to-image does not currently support reference images via this parameter. The exampleImage will be ignored for this Freepik request.");
            }
            const freepikTask = await _initiateFreepikImageTask({
                textPrompt: textPromptForFreepik,
                imageStyle: imageStyle, // Used for styling.style enum
                negativePrompt: negativePrompt, // Used for requestBody.negative_prompt
                aspectRatio: aspectRatio,
                freepikStylingColors: freepikStylingColors,
                freepikEffectColor: freepikEffectColor,
                freepikEffectLightning: freepikEffectLightning,
                freepikEffectFraming: freepikEffectFraming,
                numberOfImages: numberOfImages, // Pass the batch size
            });
            
            if (freepikTask.generatedUrls && freepikTask.generatedUrls.length > 0) {
                freepikTask.generatedUrls.forEach(url => {
                    if (url) {
                        generatedImageResults.push(`image_url:${url}`); 
                        console.log(`Freepik/Imagen3 task ${freepikTask.taskId} returned image URL directly: ${url}`);
                    }
                });
            } else {
                // If no direct URLs, but a task ID, add the task ID for polling
                // The client expects an array, so even for one task_id representing a batch, send it as an array element.
                 generatedImageResults.push(`task_id:${freepikTask.taskId}`); 
                 console.log(`Freepik/Imagen3 task initiated: ${freepikTask.taskId}, Status: ${freepikTask.status}. Polling needed for a batch of ${numberOfImages}.`);
            }
        } catch (error: any) {
             console.error(`Error during Freepik batch generation. Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
             // Push error for each expected image if the batch call itself fails, or a single error.
             for (let i = 0; i < numberOfImages; i++) {
                 generatedImageResults.push(`error:Failed to process Freepik batch item ${i+1}. ${error.message || 'Unknown error'}`);
             }
        }

    } else { // For Gemini or other providers that generate one image per call
        for (let i = 0; i < numberOfImages; i++) {
            let textPromptContent = "";
            const industryContext = industry ? ` The brand operates in the ${industry} industry.` : "";
            
            if (finalizedTextPrompt && finalizedTextPrompt.trim() !== "") {
                console.log(`Using finalized text prompt for image ${i+1}: "${finalizedTextPrompt.substring(0,100)}..." (Provider: ${chosenProvider})`);
                textPromptContent = finalizedTextPrompt;
                
                if (chosenProvider === 'GEMINI') {
                    // Aspect ratio and seed are appended if not in finalized prompt for Gemini
                    if (aspectRatio && !finalizedTextPrompt.toLowerCase().includes("aspect ratio")) {
                      textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally, and the image content itself must fully occupy this ${aspectRatio} frame, without any artificial letterboxing or pillarboxing.`;
                    }
                    if (seed !== undefined && !finalizedTextPrompt.toLowerCase().includes("seed:")) {
                      textPromptContent += `\n\nUse seed: ${seed}.`;
                    }
                    // Composition guidance appended if not obviously handled by user in finalized prompt for Gemini
                    if (
                        !finalizedTextPrompt.toLowerCase().includes("human figure") &&
                        !finalizedTextPrompt.toLowerCase().includes("crop") &&
                        !finalizedTextPrompt.toLowerCase().includes("close-up") &&
                        !finalizedTextPrompt.toLowerCase().includes("headshot") &&
                        !finalizedTextPrompt.toLowerCase().includes("portrait") &&
                        !finalizedTextPrompt.toLowerCase().includes("figure framing") &&
                        !finalizedTextPrompt.toLowerCase().includes("composition")
                    ) {
                        textPromptContent += `\n\n${compositionGuidance}`;
                    }
                }
            } else {
                console.log(`Constructing prompt for image ${i+1}/${numberOfImages} as no finalized prompt was provided or it was empty. (Provider: ${chosenProvider})`);
                if (!brandDescription || !imageStyle) {
                    throw new Error("Brand description and image style are required if not providing/using a finalized text prompt.");
                }
                
                let baseTextPrompt = `Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.\n\n`;
                let coreInstructions = "";

                if (exampleImage) { 
                    coreInstructions = `The provided example image (sent first for Gemini) serves ONE primary purpose: to identify the *category* of the item depicted (e.g., 'a handbag', 'a t-shirt', 'a piece of furniture', 'a pair of shoes').

Your task is to generate a *completely new item* belonging to this *same category*.

The *design, appearance, theme, specific characteristics, and unique elements* of this NEW item must be **primarily and heavily derived** from the following inputs:
1.  **Brand Description**: "${brandDescription}"${industryContext}. This description informs the *theme, conceptual elements, and unique characteristics* of the new item.
2.  **Desired Artistic Style**: "${imageStyle}". This dictates the overall visual execution, including aspects like color palette (unless the brand description very strongly and specifically dictates a color scheme), lighting, and rendering style. If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic and look like a real product photo.

**Important Note on Color and Style**: While the brand description provides thematic guidance, strive for visual variety and avoid over-relying on a narrow color palette (like exclusively black and gold) unless the brand description *and* desired artistic style overwhelmingly and explicitly demand it. The goal is a fresh interpretation that fits the brand's *overall essence* and the *chosen artistic style*.

**Crucially, do NOT replicate or closely imitate the visual design details (color, pattern, specific shape elements beyond the basic category identification, embellishments) of the provided example image.** The example image is *only* for determining the item category. The new image should look like a distinct product that fits the brand description and desired artistic style.

**Example of Interaction:**
If the example image is a 'simple blue cotton t-shirt' (category: t-shirt), the Brand Description is 'luxury brand, minimalist ethos, inspired by serene nature, prefers organic materials', and the Desired Artistic Style is 'high-fashion product shot, muted earthy tones'.
You should generate an image of a *luxury t-shirt made from organic-looking material, in muted earthy tones (e.g., moss green, stone grey, soft beige), shot in a high-fashion product style*. It should evoke serenity and minimalism. It should NOT be the original blue cotton t-shirt, nor should it default to a generic "luxury" color scheme like black and gold unless those colors are specifically requested or strongly implied by the *combination* of inputs.
`;
                } else { 
                    coreInstructions = `The image should be based on the following concept: "${brandDescription}".${industryContext}
The desired artistic style for this new image is: "${imageStyle}". If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic.
**Important Note on Color and Style**: Strive for visual variety that aligns with the brand description and artistic style. Avoid defaulting to a narrow or stereotypical color palette unless the inputs strongly and explicitly demand it.
`;
                }
                textPromptContent = `${baseTextPrompt}${coreInstructions}`;
                if (negativePrompt) { 
                    textPromptContent += `\n\nAvoid the following elements or characteristics in the image: ${negativePrompt}.`;
                }
                if (chosenProvider !== 'FREEPIK') { // Freepik handles these structurally
                  textPromptContent +=`\n\n${compositionGuidance}`; 
                  if (aspectRatio) {
                    textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally, and the image content itself must fully occupy this ${aspectRatio} frame, without any artificial letterboxing or pillarboxing.`;
                  }
                  if (seed !== undefined) {
                    textPromptContent += `\n\nUse seed: ${seed}.`;
                  }
                }
            }
            
            // Batch generation instruction for non-Freepik providers if not using finalized prompt
            if (numberOfImages > 1 && chosenProvider !== 'FREEPIK' && (!finalizedTextPrompt || (!finalizedTextPrompt.toLowerCase().includes("batch generation") && !finalizedTextPrompt.toLowerCase().includes(`image ${i+1}`)))) {
                textPromptContent += `\n\nImportant for batch generation: You are generating image ${i + 1} of a set of ${numberOfImages}. All images in this set should feature the *same core subject or item* as described/derived from the inputs. For this specific image (${i + 1}/${numberOfImages}), try to vary the pose, angle, or minor background details slightly compared to other images in the set, while maintaining the identity of the primary subject. The goal is a cohesive set of images showcasing the same item from different perspectives or with subtle variations.`;
            }

            if (i === 0) {
                actualPromptUsedForFirstImage = textPromptContent;
            }
            
            console.log(`Text component of prompt for image ${i+1}/${numberOfImages} (Provider: ${chosenProvider}): "${textPromptContent.substring(0,200)}..."`);

            try {
                let resultValue = ""; 
                
                switch (chosenProvider.toUpperCase()) {
                    case 'GEMINI':
                        const finalPromptPartsForGemini: ({text: string} | {media: {url: string}})[] = [];
                        if (exampleImage) { 
                            finalPromptPartsForGemini.push({ media: { url: exampleImage } });
                        }
                        finalPromptPartsForGemini.push({ text: textPromptContent }); 
                        resultValue = await _generateImageWithGemini({
                            aiInstance: ai,
                            promptParts: finalPromptPartsForGemini
                        });
                        break;
                    case 'LEONARDO_AI':
                        resultValue = await _generateImageWithLeonardoAI_stub({ brandDescription, industry, imageStyle, exampleImage, aspectRatio, negativePrompt, seed, textPrompt: textPromptContent });
                        break;
                    case 'IMAGEN': 
                        resultValue = await _generateImageWithImagen_stub({ brandDescription, industry, imageStyle, exampleImage, aspectRatio, negativePrompt, seed, textPrompt: textPromptContent });
                        break;
                    default:
                        throw new Error(`Unsupported image generation provider: ${chosenProvider}`);
                }
                generatedImageResults.push(resultValue);
            } catch (error: any) {
                 console.error(`Error during generation of image ${i+1}/${numberOfImages} with provider ${chosenProvider}. Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
                 generatedImageResults.push(`error:Failed to process image ${i+1}. ${error.message || 'Unknown error'}`);
            }
        } 
    } 

    const finalGeneratedImages = generatedImageResults.filter(res => !res.startsWith('error:'));
    const errorsEncountered = generatedImageResults.filter(res => res.startsWith('error:')).map(err => err.substring(6));

    if (finalGeneratedImages.length === 0 && numberOfImages > 0 && errorsEncountered.length === numberOfImages) {
        throw new Error(`AI failed to generate any images/tasks for the batch. Errors: ${errorsEncountered.join('; ')}`);
    }
    if (errorsEncountered.length > 0) {
      console.warn(`Some images/tasks in the batch failed: ${errorsEncountered.join('; ')}`);
    }

    return {generatedImages: finalGeneratedImages, promptUsed: actualPromptUsedForFirstImage, providerUsed: chosenProvider };
  }
);
