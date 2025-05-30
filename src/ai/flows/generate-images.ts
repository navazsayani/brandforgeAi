
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
    .describe("The desired aspect ratio for the image, e.g., '1:1', '4:5', '16:9'.")
    .optional(),
  numberOfImages: z.number().int().min(1).max(4).optional().default(1)
    .describe("The number of images to generate in this batch (1-4)."),
  negativePrompt: z.string().optional().describe("Elements to avoid in the generated image."),
  seed: z.number().int().optional().describe("An optional seed for image generation to promote reproducibility."),
  finalizedTextPrompt: z.string().optional().describe("A complete, user-edited text prompt that should be used directly for image generation, potentially overriding constructed prompts."),
  // Freepik specific styling options
  freepikStylingColors: z.array(z.object({
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color code e.g. #FF0000"),
      weight: z.number().min(0).max(1).default(1)
  })).min(1).max(5).optional().describe("Up to 5 dominant hex colors for Freepik image generation, with optional weights."),
  freepikEffectColor: z.string().optional().describe("Freepik specific color effect enum."),
  freepikEffectLightning: z.string().optional().describe("Freepik specific lightning effect enum."),
  freepikEffectFraming: z.string().optional().describe("Freepik specific framing effect enum."),
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
  providerUsed: z.string().describe("The image generation provider that was used."),
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

const freepikValidStyles = ["photo", "digital-art", "3d", "painting", "low-poly", "pixel-art", "anime", "cyberpunk", "comic", "vintage", "cartoon", "vector", "studio-shot", "dark", "sketch", "mockup", "2000s-pone", "70s-vibe", "watercolor", "art-nouveau", "origami", "surreal", "fantasy", "traditional-japan"];

async function _generateImageWithFreepik(params: {
  textPrompt: string; 
  imageStyle: string; 
  negativePrompt?: string;
  seed?: number;
  aspectRatio?: string;
  freepikStylingColors?: { color: string; weight: number }[];
  freepikEffectColor?: string;
  freepikEffectLightning?: string;
  freepikEffectFraming?: string;
}): Promise<string> {
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  if (!freepikApiKey) {
    throw new Error("FREEPIK_API_KEY is not set in environment variables.");
  }

  let freepikSize = "square_1_1"; 
  if (params.aspectRatio) {
    switch (params.aspectRatio) {
      case "1:1": freepikSize = "square_1_1"; break;
      case "4:5": freepikSize = "traditional_3_4"; console.warn(`Mapping UI aspect ratio '4:5' to Freepik 'traditional_3_4'.`); break; 
      case "16:9": freepikSize = "widescreen_16_9"; break;
      case "9:16": freepikSize = "social_story_9_16"; break;
      default: console.warn(`Unsupported aspect ratio '${params.aspectRatio}' for Freepik, defaulting to square_1_1.`); freepikSize = "square_1_1";
    }
  }
  
  let finalFreepikStyle = params.imageStyle;
  if (!freepikValidStyles.includes(params.imageStyle.toLowerCase().split(/[,.]\s*/)[0])) { // Check first part of style string
    console.warn(`Provided imageStyle "${params.imageStyle}" does not start with a specific Freepik style enum. Defaulting to "photo" for Freepik. Original style notes are still in the main text prompt.`);
    finalFreepikStyle = "photo"; 
  } else {
    finalFreepikStyle = params.imageStyle.toLowerCase().split(/[,.]\s*/)[0]; // Use the matched Freepik style
  }


  const requestBody: any = {
    prompt: params.textPrompt,
    num_images: 1,
    image: { size: freepikSize },
    guidance_scale: 1.0, 
    filter_nsfw: true,
  };
  
  if (finalFreepikStyle) {
    requestBody.styling = { style: finalFreepikStyle };
  }


  if (params.negativePrompt) requestBody.negative_prompt = params.negativePrompt;
  if (params.seed !== undefined) requestBody.seed = params.seed;

  if (params.freepikStylingColors && params.freepikStylingColors.length > 0) {
    if (!requestBody.styling) requestBody.styling = {};
    requestBody.styling.colors = params.freepikStylingColors;
  }

  const effects: any = {};
  if (params.freepikEffectColor && params.freepikEffectColor !== "none") effects.color = params.freepikEffectColor;
  if (params.freepikEffectLightning && params.freepikEffectLightning !== "none") effects.lightning = params.freepikEffectLightning;
  if (params.freepikEffectFraming && params.freepikEffectFraming !== "none") effects.framing = params.freepikEffectFraming;

  if (Object.keys(effects).length > 0) {
    if (!requestBody.styling) requestBody.styling = {}; // Ensure styling object exists
    requestBody.styling.effects = effects;
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

    if (responseData.data && responseData.data.length > 0 && responseData.data[0].base64) {
      const base64Data = responseData.data[0].base64;
      // Freepik doesn't specify MIME type in this response, assume PNG for now.
      // In a real scenario, you might need to infer or have a default.
      return `data:image/png;base64,${base64Data}`; 
    } else {
      throw new Error("Freepik API did not return image base64 data in expected format.");
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
      // Freepik specific
      freepikStylingColors,
      freepikEffectColor,
      freepikEffectLightning,
      freepikEffectFraming,
    } = input;

    const generatedImageUrls: string[] = [];
    const imageGenerationProvider = provider || process.env.IMAGE_GENERATION_PROVIDER || 'GEMINI';
    let actualPromptUsedForFirstImage = "";
    const compositionGuidance = "IMPORTANT COMPOSITION RULE: When depicting human figures as the primary subject, the image *must* be well-composed. Avoid awkward or unintentional cropping of faces or key body parts. Ensure the figure is presented naturally and fully within the frame, unless the prompt *explicitly* requests a specific framing like 'close-up', 'headshot', 'upper body shot', or an artistic crop. Prioritize showing the entire subject if it's a person.";


    for (let i = 0; i < numberOfImages; i++) {
        let textPromptContent = "";
        const industryContext = industry ? ` The brand operates in the ${industry} industry.` : "";
        
        if (finalizedTextPrompt && finalizedTextPrompt.trim() !== "") {
            console.log(`Using finalized text prompt for image ${i+1}: "${finalizedTextPrompt.substring(0,100)}..." (Provider: ${imageGenerationProvider})`);
            textPromptContent = finalizedTextPrompt;
            
            if (imageGenerationProvider.toUpperCase() === 'GEMINI') {
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
            console.log(`Constructing prompt for image ${i+1} as no finalized prompt was provided or it was empty. (Provider: ${imageGenerationProvider})`);
            if (!brandDescription || !imageStyle) {
                throw new Error("Brand description and image style are required if not providing/using a finalized text prompt.");
            }
            
            const baseTextPrompt = `Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.\n\n`;
            let coreInstructions = "";

            if (exampleImage) {
                coreInstructions = `The provided example image (sent first) serves ONE primary purpose: to identify the *category* of the item depicted (e.g., 'a handbag', 'a t-shirt', 'a piece of furniture', 'a pair of shoes').

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
            } else { // No example image
                coreInstructions = `The image should be based on the following concept: "${brandDescription}".${industryContext}
The desired artistic style for this new image is: "${imageStyle}". If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic.
**Important Note on Color and Style**: Strive for visual variety that aligns with the brand description and artistic style. Avoid defaulting to a narrow or stereotypical color palette unless the inputs strongly and explicitly demand it.
`;
            }
            textPromptContent = `${baseTextPrompt}${coreInstructions}\n${compositionGuidance}`;


            if (negativePrompt) {
                textPromptContent += `\n\nAvoid the following elements or characteristics in the image: ${negativePrompt}.`;
            }
            
            if (imageGenerationProvider.toUpperCase() !== 'FREEPIK' || (imageGenerationProvider.toUpperCase() === 'FREEPIK' && !aspectRatio) ) { 
                if (aspectRatio) {
                  textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally.`;
                }
            }
             if (imageGenerationProvider.toUpperCase() !== 'FREEPIK' || (imageGenerationProvider.toUpperCase() === 'FREEPIK' && seed === undefined) ) { 
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
        
        console.log(`Text component of prompt for image ${i+1}/${numberOfImages} (Provider: ${imageGenerationProvider}): "${textPromptContent.substring(0,200)}..."`);

        try {
            let imageUrl = "";
            const finalPromptPartsForGemini: ({text: string} | {media: {url: string}})[] = [];
            
            if (exampleImage && imageGenerationProvider.toUpperCase() === 'GEMINI') { 
                finalPromptPartsForGemini.push({ media: { url: exampleImage } });
            }
            finalPromptPartsForGemini.push({ text: textPromptContent }); 

            switch (imageGenerationProvider.toUpperCase()) {
                case 'GEMINI':
                    imageUrl = await _generateImageWithGemini({
                        aiInstance: ai,
                        promptParts: finalPromptPartsForGemini
                    });
                    break;
                case 'LEONARDO_AI':
                    imageUrl = await _generateImageWithLeonardoAI_stub({ brandDescription, industry, imageStyle, exampleImage, aspectRatio, negativePrompt, seed, textPrompt: textPromptContent });
                    break;
                case 'IMAGEN': 
                    imageUrl = await _generateImageWithImagen_stub({ brandDescription, industry, imageStyle, exampleImage, aspectRatio, negativePrompt, seed, textPrompt: textPromptContent });
                    break;
                case 'FREEPIK':
                    imageUrl = await _generateImageWithFreepik({
                        textPrompt: textPromptContent,
                        imageStyle: imageStyle, // This is the combined preset + custom notes
                        negativePrompt: negativePrompt,
                        seed: seed,
                        aspectRatio: aspectRatio,
                        freepikStylingColors: freepikStylingColors,
                        freepikEffectColor: freepikEffectColor,
                        freepikEffectLightning: freepikEffectLightning,
                        freepikEffectFraming: freepikEffectFraming,
                    });
                    break;
                default:
                    throw new Error(`Unsupported image generation provider: ${imageGenerationProvider}`);
            }
            generatedImageUrls.push(imageUrl);
        } catch (error: any) {
             console.error(`Error during generation of image ${i+1}/${numberOfImages} with provider ${imageGenerationProvider}. Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
             const failingPromptSnippet = textPromptContent.substring(0, 200) + (textPromptContent.length > 200 ? "..." : "");
             throw new Error(`Failed to generate image ${i+1} of ${numberOfImages}. Error from provider ${imageGenerationProvider}: ${error.message || 'Unknown error'}. Prompt snippet: "${failingPromptSnippet}".`);
        }
    }

    if (generatedImageUrls.length === 0 && numberOfImages > 0) {
        throw new Error("AI failed to generate any images for the batch.");
    }

    return {generatedImages: generatedImageUrls, promptUsed: actualPromptUsedForFirstImage, providerUsed: imageGenerationProvider };
  }
);
