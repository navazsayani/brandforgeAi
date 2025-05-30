
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
  seed: z.number().int().optional().describe("An optional seed for image generation to promote reproducibility. Freepik range: 1 <= x <= 4294967295"),
  finalizedTextPrompt: z.string().optional().describe("A complete, user-edited text prompt that should be used directly for image generation, potentially overriding constructed prompts."),
  
  // Freepik flux-dev specific styling options
  freepikStylingColors: z.array(z.object({
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color code e.g. #FF0000"),
      weight: z.number().min(0).max(1).default(0.5) // Default weight as per example
  })).min(1).max(5).optional().describe("Up to 5 dominant hex colors for Freepik image generation, with optional weights."),
  freepikEffectColor: z.string().optional().describe("Freepik flux-dev specific color effect enum."),
  freepikEffectLightning: z.string().optional().describe("Freepik flux-dev specific lightning effect enum."),
  freepikEffectFraming: z.string().optional().describe("Freepik flux-dev specific framing effect enum."),
});
export type GenerateImagesInput = z.infer<typeof GenerateImagesInputSchema>;

const GenerateImagesOutputSchema = z.object({
  generatedImages: z.array(z
    .string() // Can be data URI (Gemini) or task_id string (Freepik step 1)
    .describe(
      "A generated image as a data URI, or a task ID for asynchronous providers like Freepik flux-dev."
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

const freepikFluxValidAspectRatios: Record<string, string> = {
    "1:1": "square_1_1",
    "4:3": "classic_4_3",
    "3:4": "traditional_3_4",
    "16:9": "widescreen_16_9",
    "9:16": "social_story_9_16",
    "3:2": "standard_3_2",
    "2:3": "portrait_2_3",
    "2:1": "horizontal_2_1",
    "1:2": "vertical_1_2",
    "4:5": "social_post_4_5",
    // Direct enum values also accepted
    "square_1_1": "square_1_1",
    "classic_4_3": "classic_4_3",
    "traditional_3_4": "traditional_3_4",
    "widescreen_16_9": "widescreen_16_9",
    "social_story_9_16": "social_story_9_16",
    "standard_3_2": "standard_3_2",
    "portrait_2_3": "portrait_2_3",
    "horizontal_2_1": "horizontal_2_1",
    "vertical_1_2": "vertical_1_2",
    "social_post_4_5": "social_post_4_5",
};


// Updated for flux-dev POST call - returns task_id
async function _initiateFreepikFluxImageGeneration(params: {
  textPrompt: string; 
  // imageStyle is used in textPrompt. Freepik's 'styling.style' is more restrictive.
  // exampleImage is ignored for flux-dev in this step as per API.
  negativePrompt?: string;
  seed?: number;
  aspectRatio?: string; // e.g., "1:1", or direct Freepik enum "square_1_1"
  freepikStylingColors?: { color: string; weight: number }[];
  freepikEffectColor?: string;
  freepikEffectLightning?: string;
  freepikEffectFraming?: string;
}): Promise<{ taskId: string; status: string }> { // Returns task info
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  if (!freepikApiKey) {
    throw new Error("FREEPIK_API_KEY is not set in environment variables.");
  }

  if (params.textPrompt.length === 0) {
    throw new Error("Prompt cannot be empty for Freepik flux-dev model.");
  }
  
  let finalFreepikAspectRatio = freepikFluxValidAspectRatios[params.aspectRatio || "1:1"] || "square_1_1";


  const requestBody: any = {
    prompt: params.textPrompt,
    // webhook_url: "YOUR_OPTIONAL_WEBHOOK_URL", // Omitted for now
    aspect_ratio: finalFreepikAspectRatio,
  };
  
  if (params.seed !== undefined) {
    // Ensure seed is within Freepik's valid range
    requestBody.seed = Math.max(1, Math.min(params.seed, 4294967295));
  }

  const styling: any = {};
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
        weight: c.weight || 0.5 // Use provided weight or default
    }));
  }
  
  if (Object.keys(styling).length > 0) {
      requestBody.styling = styling;
  }
  
  // Note: 'styling.style' specific enum for Freepik is not used here with flux-dev's first call
  // The main 'prompt' field carries all textual style descriptions.

  console.log("Sending request to Freepik API (flux-dev) with body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch("https://api.freepik.com/v1/ai/text-to-image/flux-dev", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': freepikApiKey,
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log("Response from Freepik API (flux-dev):", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      throw new Error(`Freepik API error (flux-dev): ${response.status} - ${responseData.title || responseData.detail || JSON.stringify(responseData)}`);
    }

    if (responseData.data && responseData.data.task_id && responseData.data.status) {
      return { taskId: responseData.data.task_id, status: responseData.data.status };
    } else {
      throw new Error("Freepik API (flux-dev) did not return task_id and status in expected format.");
    }
  } catch (error: any) {
    console.error("Error calling Freepik API (flux-dev):", error);
    throw new Error(`Freepik API request failed (flux-dev): ${error.message}`);
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
      provider, // Provider chosen from UI
      brandDescription,
      industry,
      imageStyle, // Combined preset + custom notes
      exampleImage,
      aspectRatio,
      numberOfImages = 1,
      negativePrompt,
      seed,
      finalizedTextPrompt,
      // Freepik specific
      freepikStylingColors,
      freepikEffectColor,
      freepikEffectLightning,
      freepikEffectFraming,
    } = input;

    const generatedImageResults: string[] = []; // Will store URLs or task_ids
    const chosenProvider = provider || process.env.IMAGE_GENERATION_PROVIDER || 'GEMINI';
    let actualPromptUsedForFirstImage = "";
    const compositionGuidance = "IMPORTANT COMPOSITION RULE: When depicting human figures as the primary subject, the image *must* be well-composed. Avoid awkward or unintentional cropping of faces or key body parts. Ensure the figure is presented naturally and fully within the frame, unless the prompt *explicitly* requests a specific framing like 'close-up', 'headshot', 'upper body shot', or an artistic crop. Prioritize showing the entire subject if it's a person.";


    for (let i = 0; i < numberOfImages; i++) {
        let textPromptContent = "";
        const industryContext = industry ? ` The brand operates in the ${industry} industry.` : "";
        
        if (finalizedTextPrompt && finalizedTextPrompt.trim() !== "") {
            console.log(`Using finalized text prompt for image ${i+1}: "${finalizedTextPrompt.substring(0,100)}..." (Provider: ${chosenProvider})`);
            textPromptContent = finalizedTextPrompt;
            
            if (chosenProvider === 'GEMINI') {
                // Append structural params if not likely in finalized prompt (heuristic)
                if (aspectRatio && !finalizedTextPrompt.toLowerCase().includes("aspect ratio")) {
                  textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally.`;
                }
                if (seed !== undefined && !finalizedTextPrompt.toLowerCase().includes("seed:")) {
                  textPromptContent += `\n\nUse seed: ${seed}.`;
                }
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
            console.log(`Constructing prompt for image ${i+1} as no finalized prompt was provided or it was empty. (Provider: ${chosenProvider})`);
            if (!brandDescription || !imageStyle) {
                throw new Error("Brand description and image style are required if not providing/using a finalized text prompt.");
            }
            
            const baseTextPrompt = `Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.\n\n`;
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
            textPromptContent = `${baseTextPrompt}${coreInstructions}\n${compositionGuidance}`;

            if (negativePrompt) {
                textPromptContent += `\n\nAvoid the following elements or characteristics in the image: ${negativePrompt}.`;
            }
            if (chosenProvider !== 'FREEPIK') { // Freepik flux-dev takes aspectRatio structurally
                if (aspectRatio) {
                  textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally.`;
                }
            }
            if (chosenProvider !== 'FREEPIK') { // Freepik flux-dev takes seed structurally
                if (seed !== undefined) {
                  textPromptContent += `\n\nUse seed: ${seed}.`;
                }
            }
        }
        
        if (numberOfImages > 1 && (!finalizedTextPrompt || (!finalizedTextPrompt.toLowerCase().includes("batch generation") && !finalizedTextPrompt.toLowerCase().includes(`image ${i+1}`)))) {
             textPromptContent += `\n\nImportant for batch generation: You are generating image ${i + 1} of a set of ${numberOfImages}. All images in this set should feature the *same core subject or item* as described/derived from the inputs. For this specific image (${i + 1}/${numberOfImages}), try to vary the pose, angle, or minor background details slightly compared to other images in the set, while maintaining the identity of the primary subject. The goal is a cohesive set of images showcasing the same item from different perspectives or with subtle variations.`;
        }

        if (i === 0) {
            actualPromptUsedForFirstImage = textPromptContent;
        }
        
        console.log(`Text component of prompt for image ${i+1}/${numberOfImages} (Provider: ${chosenProvider}): "${textPromptContent.substring(0,200)}..."`);

        try {
            let resultValue = ""; // Will be image URL or task_id
            
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
                case 'FREEPIK':
                    if (exampleImage) {
                        console.warn("Freepik flux-dev model selected, but exampleImage was provided. The flux-dev API for text-to-image does not currently support reference images. The exampleImage will be ignored for this Freepik request.");
                    }
                    const freepikTask = await _initiateFreepikFluxImageGeneration({
                        textPrompt: textPromptContent,
                        negativePrompt: negativePrompt,
                        seed: seed,
                        aspectRatio: aspectRatio,
                        freepikStylingColors: freepikStylingColors,
                        freepikEffectColor: freepikEffectColor,
                        freepikEffectLightning: freepikEffectLightning,
                        freepikEffectFraming: freepikEffectFraming,
                    });
                    // For now, store task_id prefixed so client can identify it
                    resultValue = `task_id:${freepikTask.taskId}`; 
                    console.log(`Freepik flux-dev task initiated: ${freepikTask.taskId}, Status: ${freepikTask.status}`);
                    break;
                default:
                    throw new Error(`Unsupported image generation provider: ${chosenProvider}`);
            }
            generatedImageResults.push(resultValue);
        } catch (error: any) {
             console.error(`Error during generation of image ${i+1}/${numberOfImages} with provider ${chosenProvider}. Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
             const failingPromptSnippet = textPromptContent.substring(0, 200) + (textPromptContent.length > 200 ? "..." : "");
             // Don't throw here, allow other images in batch to attempt generation
             generatedImageResults.push(`error:Failed to process image ${i+1}. ${error.message || 'Unknown error'}`);
        }
    }

    // Filter out errors from results if needed or handle them appropriately
    const finalGeneratedImages = generatedImageResults.filter(res => !res.startsWith('error:'));
    const errorsEncountered = generatedImageResults.filter(res => res.startsWith('error:')).map(err => err.substring(6));

    if (finalGeneratedImages.length === 0 && numberOfImages > 0 && errorsEncountered.length === numberOfImages) {
        throw new Error(`AI failed to generate any images for the batch. Errors: ${errorsEncountered.join('; ')}`);
    }
    if (errorsEncountered.length > 0) {
      console.warn(`Some images in the batch failed: ${errorsEncountered.join('; ')}`);
      // You might want to include these errors in the response or handle them
    }


    return {generatedImages: finalGeneratedImages, promptUsed: actualPromptUsedForFirstImage, providerUsed: chosenProvider };
  }
);

    