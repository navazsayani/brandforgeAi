
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Action } from 'genkit';
import { describeImage } from './describe-image-flow'; // For Freepik description
import { industries, freepikValidStyles } from '../../lib/constants'; // Added freepikValidStyles
import { getModelConfig } from '@/lib/model-config';
import { GoogleGenAI } from "@google/genai";
import { decodeHtmlEntitiesInUrl, verifyImageUrlExists } from '@/lib/utils';

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
  textToFeature: z
    .string()
    .optional()
    .describe('Text content to be transformed into contextual visual content. When provided, this takes priority over other prompt generation methods.'),
  exampleImage: z
    .string()
    .url()
    .describe(
      "An example image as a URL. This image primarily defines the *item category*."
    )
    .optional(),
  exampleImageDescription: z.string().optional().describe("An AI-generated description of the exampleImage, to be used if the provider is Freepik."),
  aspectRatio: z
    .string()
    .describe("The desired aspect ratio for the image, e.g., '1:1', '4:5', '16:9' for general, or Freepik specific enums like 'square_1_1'.")
    .optional(),
  numberOfImages: z.number().int().min(1).max(4).optional().default(1)
    .describe("The number of images to generate in this batch (1-4)."),
  negativePrompt: z.string().optional().describe("Elements to avoid in the generated image."),
  seed: z.number().int().optional().describe("An optional seed for image generation to promote reproducibility. For Freepik/Imagen3, this is not currently passed."),
  finalizedTextPrompt: z.string().optional().describe("A complete, user-edited text prompt that should be used directly for image generation, potentially overriding constructed prompts."),
  
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
  model: string;
}): Promise<string> {
  const { aiInstance, promptParts, model } = params;

  console.log("Final prompt parts array for Gemini _generateImageWithGemini:", JSON.stringify(promptParts, null, 2));

  try {
    const {media} = await aiInstance.generate({
      model: model,
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        // safetySettings removed as per request
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


// Helper function to detect if a model is an Imagen model
function isImagenModel(modelName: string): boolean {
  return modelName.toLowerCase().includes('imagen');
}

// Helper function to map UI aspect ratios to Imagen supported ratios
function mapToImagenAspectRatio(uiAspectRatio?: string): string {
  const mapping: Record<string, string> = {
    "1:1": "1:1",
    "4:5": "3:4", // Closest match to 4:5
    "3:4": "3:4",
    "4:3": "4:3",
    "16:9": "16:9",
    "9:16": "9:16"
  };
  return mapping[uiAspectRatio || "1:1"] || "1:1";
}

// Helper function to validate Imagen model names
function validateImagenModel(modelName: string): string {
  return modelName.replace(/^googleai\//, '');
}

// New function to generate images using Google's Imagen API
async function _generateImageWithImagen(params: {
  model: string;
  prompt: string;
  aspectRatio?: string;
  numberOfImages: number;
  negativePrompt?: string;
  seed?: number;
}): Promise<string[]> {
  const validatedModel = validateImagenModel(params.model);
  console.log(`[Imagen API] Generating with model: ${validatedModel}, Prompt: "${params.prompt.substring(0, 100)}..."`);
  
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Google AI API key not found in environment variables.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const requestConfig: any = {
      number_of_images: params.numberOfImages,
      aspect_ratio: mapToImagenAspectRatio(params.aspectRatio),
    };
    
    if (params.negativePrompt && params.negativePrompt.trim()) {
      requestConfig.negative_prompt = params.negativePrompt.trim();
    }
    
    if (params.seed !== undefined) {
      requestConfig.seed = params.seed;
    }
    
    const response = await ai.models.generateImages({
      model: validatedModel,
      prompt: params.prompt,
      ...requestConfig
    });

    if (!response.images || response.images.length === 0) {
      throw new Error("Imagen API returned no images in response");
    }

    const dataUris = response.images.map((generatedImage) => {
      if (!generatedImage.image) {
        throw new Error("Imagen API returned invalid image data. Missing imageBytes.");
      }
      return `data:image/png;base64,${generatedImage.image}`;
    });

    console.log(`[Imagen API] Successfully generated ${dataUris.length} image(s) using model: ${validatedModel}`);
    return dataUris;

  } catch (error: any) {
    console.error("[Imagen API] ERROR:", error);
    if (error.message?.includes('404')) {
      throw new Error(`Imagen model "${validatedModel}" not found. Please verify the model name and your API key access.`);
    }
    throw new Error(`Imagen API request failed: ${error.message}`);
  }
}

// For Freepik/Imagen3 provider
const freepikImagen3ApiAspectRatios: Record<string, string> = {
    "1:1": "square_1_1",
    "9:16": "social_story_9_16",
    "16:9": "widescreen_16_9",
    "3:4": "traditional_3_4",
    "4:3": "classic_4_3",
};

async function _initiateFreepikImageTask(params: { 
  textPrompt: string; 
  imageStyle: string; // This is the combined string (preset + custom notes)
  exampleImage?: string; 
  negativePrompt?: string;
  aspectRatio?: string; 
  freepikStylingColors?: { color: string; weight: number }[];
  freepikEffectColor?: string;
  freepikEffectLightning?: string;
  freepikEffectFraming?: string;
  numberOfImages: number;
}): Promise<{ taskId: string; status: string; generatedUrls: string[] }> {
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  if (!freepikApiKey) {
    throw new Error("FREEPIK_API_KEY is not set in environment variables.");
  }

  if (params.textPrompt.length === 0) {
    throw new Error("Prompt cannot be empty for Freepik Imagen3 model.");
  }
  
  let finalFreepikAspectRatio = freepikImagen3ApiAspectRatios[params.aspectRatio || "1:1"] || "square_1_1";
  if (params.aspectRatio === "4:5") { 
      finalFreepikAspectRatio = "traditional_3_4"; 
      console.log("Freepik/Imagen3: Mapping UI aspect ratio 4:5 to Freepik's 'traditional_3_4'");
  }

  const requestBody: any = {
    prompt: params.textPrompt,
    num_images: params.numberOfImages,
    aspect_ratio: finalFreepikAspectRatio,
    person_generation: "allow_all", 
    safety_settings: "block_none",  
  };
  
  if (params.negativePrompt) {
    requestBody.negative_prompt = params.negativePrompt;
  }

  const styling: any = {};
  if (params.imageStyle) {
      // Try to extract the first keyword from the combined imageStyle string (preset + custom notes)
      // to set the structural Freepik style enum.
      const firstStyleKeyword = params.imageStyle.toLowerCase().trim().split(/[,.]|\s-\s/)[0].trim(); 
      const directFreepikStyleMatch = freepikValidStyles.find(s => s.toLowerCase() === firstStyleKeyword);

      if (directFreepikStyleMatch) {
          styling.style = directFreepikStyleMatch;
          console.log(`Freepik/Imagen3 STRUCTURAL: Using direct style enum match: "${directFreepikStyleMatch}" from input imageStyle (preset part): "${params.imageStyle}"`);
      } else {
          console.warn(`Freepik/Imagen3 STRUCTURAL: Provided imageStyle "${params.imageStyle}" (or its first part "${firstStyleKeyword}") is not a direct Freepik enum. Freepik's 'style' parameter will default to 'photo' if not otherwise cued by text prompt or structural parameters.`);
          if (params.imageStyle.toLowerCase().includes("photo") || params.imageStyle.toLowerCase().includes("photorealistic")) {
            styling.style = "photo"; 
          } else {
            console.log("No direct Freepik style enum matched and not clearly 'photo'. Omitting structural 'styling.style'. Text prompt will guide Freepik, or it defaults to 'photo'.");
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

  if (params.exampleImage) {
    console.warn("Freepik/Imagen3 model (text-to-image endpoint) selected, but exampleImage was provided. The exampleImage itself will be ignored for this Freepik request, but its AI-generated description (if available) might be used in the text prompt.");
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
        generatedUrls: responseData.data.generated || [] 
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
      brandDescription,
      industry,
      imageStyle, // This is the combined string (preset.value + custom_notes_if_any)
      textToFeature,
      exampleImage,
      exampleImageDescription,
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

    const { imageGenerationModel, textToImageModel } = await getModelConfig();
    const chosenProvider = input.provider || process.env.IMAGE_GENERATION_PROVIDER || 'GEMINI';
    console.log(`Image generation flow started. Chosen provider: ${chosenProvider}, Number of images: ${numberOfImages}`);

    const generatedImageResults: string[] = [];
    let actualPromptUsedForFirstImage = ""; 
    const compositionGuidance = "IMPORTANT COMPOSITION RULE: When depicting human figures as the primary subject, the image *must* be well-composed. Avoid awkward or unintentional cropping of faces or key body parts. Ensure the figure is presented naturally and fully within the frame, unless the prompt *explicitly* requests a specific framing like 'close-up', 'headshot', 'upper body shot', or an artistic crop. Prioritize showing the entire subject if it's a person.";

    let industryLabel = "";
    if (industry && industry !== "_none_") { 
        const foundIndustry = industries.find(i => i.value === industry);
        industryLabel = foundIndustry ? foundIndustry.label : industry; 
    }
    const industryContext = (industryLabel && industryLabel !== "None / Not Applicable") 
                            ? ` The brand operates in the ${industryLabel} industry.` 
                            : "";


    if (chosenProvider.toUpperCase() === 'FREEPIK') {
        console.log(`Freepik provider (imagen3) selected for a batch of ${numberOfImages} images.`);
        let textPromptForFreepik = "";

        if (finalizedTextPrompt && finalizedTextPrompt.trim() !== "") {
            console.log(`Using finalized text prompt for Freepik batch: "${finalizedTextPrompt.substring(0,100)}..."`);
            textPromptForFreepik = finalizedTextPrompt;
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
        } else {
            console.log(`Constructing prompt for Freepik batch as no finalized prompt was provided or it was empty.`);
            if (!brandDescription || !imageStyle) {
                throw new Error("Brand description and image style (preset/custom notes) are required if not providing/using a finalized text prompt for Freepik.");
            }
            
            let baseContentPrompt = "";
            if (textToFeature && textToFeature.trim() !== "") {
                console.log(`Freepik prompt using text-to-feature content: "${textToFeature.substring(0,100)}..."`);
                baseContentPrompt = `You are an expert brand marketing designer specializing in creating contextual, engaging visual content that transforms text concepts into compelling brand-aligned graphics. Your mission is to understand the meaning and context behind the text and create a strategic visual representation that drives engagement and brand recognition.

**Text Content to Transform:**
"${textToFeature}"

**STRATEGIC CONTENT ANALYSIS:**
First, analyze the text content to understand:
- What is the core message or value proposition?
- What type of content is this? (tips, benefits, questions, statements, calls-to-action, etc.)
- What emotions or actions should this content inspire?
- Who is the target audience for this message?
- What visual metaphors or concepts would best represent this content?

**BRAND STRATEGY CONTEXT:**
- **Brand Identity:** "${brandDescription}"${industryContext}
  - Extract the brand's personality, values, and visual identity cues
  - Consider how this brand would communicate this specific message
  - Think about the brand's target audience and their preferences
  - Ensure the visual approach aligns with the brand's positioning

**VISUAL EXECUTION STRATEGY:**
- Apply the specified style to enhance the content's impact and brand alignment
- For realistic styles: Create professional, market-ready visuals with authentic appeal
- For artistic styles: Balance creative expression with clear message communication
- Ensure the style reinforces both the text content and brand personality

**CONTEXTUAL DESIGN REQUIREMENTS:**
- **Content-Driven Visuals:** Do NOT just display text - create visual representations of the concepts.
- **Strategic Messaging:** The image should work as standalone content that communicates the message even without reading every word.
- **Engagement Optimization:** Design for social media sharing, saving, and interaction.
- **Brand Consistency:** Maintain visual consistency with the brand's identity and values.
- **Audience Appeal:** Consider what would resonate with the brand's target demographic.

**ENHANCED CREATIVE GUIDELINES:**
- **Conceptual Visualization:** If the text mentions "5 benefits," create visual elements that represent those benefits, not just list them.
- **Metaphorical Thinking:** Use visual metaphors that reinforce the message (e.g., growth charts for improvement tips, lightbulbs for ideas).
- **Contextual Elements:** Include relevant icons, illustrations, or design elements that support the content theme.
- **Hierarchy & Flow:** Guide the viewer's eye through the content in a logical, engaging way.

**QUALITY STANDARDS:**
- Professional marketing-grade execution suitable for paid advertising.
- Optimized for maximum social media engagement and algorithmic performance.
- Brand-appropriate messaging that aligns with company values and positioning.

**FINAL OUTPUT:** Create a single, high-quality marketing image that transforms the text content into a compelling visual experience that drives engagement, communicates value, and strengthens brand recognition. Do NOT write the input text on the image.`;
            } else if (exampleImageDescription) {
                console.log(`Freepik prompt using example image description: "${exampleImageDescription.substring(0,100)}..."`);
                baseContentPrompt = `An example image was provided, which is described as: "${exampleImageDescription}". Using that description as primary inspiration for the subject and main visual elements, now generate an image based on the following concept: "${brandDescription}".`;
            } else {
                baseContentPrompt = `Create a strategic brand marketing image that embodies the concept: "${brandDescription}".${industryContext}

**BRAND MARKETING OBJECTIVES:**
- Capture attention in social media feeds with scroll-stopping visual appeal
- Communicate the brand's unique value proposition and personality instantly
- Appeal to the target demographic's aspirations, lifestyle, and visual preferences
- Encourage engagement, sharing, and brand recognition
- Support conversion goals through compelling visual storytelling

**CREATIVE EXECUTION REQUIREMENTS:**
- Avoid generic or stock-photo-like approaches
- Include rich contextual elements that tell the brand's story
- Use visual hierarchy and composition to guide viewer attention
- Consider current social media trends while maintaining brand authenticity
- Create content that works both standalone and in marketing campaigns
- Ensure professional, market-ready quality suitable for paid advertising`;
            }

            let textualStyleComponent = "";
            const firstStyleKeywordOfCombined = imageStyle.toLowerCase().trim().split(/[,.]|\s-\s/)[0].trim();
            const isStructuralStyleLikelyApplied = freepikValidStyles.includes(firstStyleKeywordOfCombined);

            if (isStructuralStyleLikelyApplied) {
                // A structural style (like "photo") was likely applied by _initiateFreepikImageTask.
                // We add the full imageStyle textually if it contains more than just the structural keyword
                // (e.g., "photo with dramatic lighting" or if the preset itself was "photorealistic" which implies "photo" + "realistic").
                if (imageStyle.toLowerCase().trim() !== firstStyleKeywordOfCombined) {
                    textualStyleComponent = `\nIncorporate these stylistic details and elements: "${imageStyle}".`;
                } else {
                    // imageStyle is essentially just the structural keyword (e.g., "photo").
                    // No need to add it textually if _initiateFreepikImageTask handled it structurally.
                    textualStyleComponent = ""; 
                }
            } else {
                // The primary style (e.g., "minimalist") is not a structural Freepik style, so the full `imageStyle` string is relevant textually.
                textualStyleComponent = `\nIncorporate these stylistic details and elements: "${imageStyle}".`;
            }
            
            textPromptForFreepik = `${baseContentPrompt}${industryContext}${textualStyleComponent}`;
            textPromptForFreepik +=`\n\n${compositionGuidance}`;
        }
        actualPromptUsedForFirstImage = textPromptForFreepik; 
        console.log(`Text component of prompt for Freepik batch: "${textPromptForFreepik.substring(0,200)}..."`);

        try {
            const freepikTask = await _initiateFreepikImageTask({
                textPrompt: textPromptForFreepik, 
                imageStyle: imageStyle, // Pass the combined style string for _initiateFreepikImageTask to parse for structural style
                exampleImage: exampleImage,
                negativePrompt: negativePrompt, 
                aspectRatio: aspectRatio, 
                freepikStylingColors: freepikStylingColors,
                freepikEffectColor: freepikEffectColor,
                freepikEffectLightning: freepikEffectLightning,
                freepikEffectFraming: freepikEffectFraming,
                numberOfImages: numberOfImages, 
            });
            
            if (freepikTask.generatedUrls && freepikTask.generatedUrls.length > 0) {
                freepikTask.generatedUrls.forEach(url => {
                    if (url) {
                        generatedImageResults.push(`image_url:${url}`); 
                    }
                });
                 console.log(`Freepik/Imagen3 task ${freepikTask.taskId} returned ${freepikTask.generatedUrls.length} image URL(s) directly.`);
            } else {
                 generatedImageResults.push(`task_id:${freepikTask.taskId}`); 
                 console.log(`Freepik/Imagen3 task initiated: ${freepikTask.taskId}, Status: ${freepikTask.status}. Polling needed for a batch of ${numberOfImages}.`);
            }
        } catch (error: any) {
             console.error(`Error during Freepik batch generation. Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
             generatedImageResults.push(`error:Failed to process Freepik batch. ${error.message || 'Unknown error'}`);
        }
    } else { 
        // This block handles non-Freepik providers like Gemini and Imagen
        let textPromptContent = "";
        
        if (finalizedTextPrompt && finalizedTextPrompt.trim() !== "") {
            console.log(`Using finalized text prompt for batch: "${finalizedTextPrompt.substring(0,100)}..." (Provider: ${chosenProvider})`);
            textPromptContent = finalizedTextPrompt;
            
            // For non-Imagen Gemini models, we must inject aspect ratio into the text prompt
            if (chosenProvider === 'GEMINI' && !isImagenModel(textToImageModel) && aspectRatio && !finalizedTextPrompt.toLowerCase().includes("aspect ratio")) {
              textPromptContent += `\n\n**CRITICAL REQUIREMENT**: The generated image *must* have an aspect ratio of exactly **${aspectRatio}**.`;
            }
            if (seed !== undefined && !finalizedTextPrompt.toLowerCase().includes("seed:")) {
              textPromptContent += `\n\nUse seed: ${seed}.`;
            }
             if (
                !finalizedTextPrompt.toLowerCase().includes("human figure") &&
                !finalizedTextPrompt.toLowerCase().includes("crop")
            ) {
                textPromptContent += `\n\n${compositionGuidance}`;
            }
        } else {
             // Construct prompt if no finalized prompt is provided
            console.log(`Constructing prompt for batch. (Provider: ${chosenProvider})`);
            if (!brandDescription || !imageStyle) {
                throw new Error("Brand description and image style are required if not providing a finalized text prompt.");
            }
            // (Prompt construction logic remains the same as before)
            let coreInstructions = "";
            if (textToFeature && textToFeature.trim() !== "") {
                coreInstructions = `You are an expert brand marketing designer...
**Text Content to Transform:**
"${textToFeature}"
...`;
            } else if (exampleImage && chosenProvider === 'GEMINI' && !isImagenModel(imageGenerationModel)) {
                coreInstructions = `You are creating a strategic brand marketing image...
**CORE CREATIVE BRIEF:**
1. **Brand Identity**: "${brandDescription}"${industryContext}
...`;
            } else {
                coreInstructions = `You are creating a strategic brand marketing image...
**CORE CREATIVE BRIEF:**
1. **Brand Identity Deep Dive**: "${brandDescription}"${industryContext}
...`;
            }
            textPromptContent = `Generate a new, high-quality image...\n\n${coreInstructions}`;
            if (negativePrompt) {
                textPromptContent += `\n\nAvoid: ${negativePrompt}.`;
            }
            if (chosenProvider === 'GEMINI' && !isImagenModel(textToImageModel) && aspectRatio) {
                textPromptContent += `\n\n**CRITICAL REQUIREMENT**: Aspect Ratio must be **${aspectRatio}**.`;
            }
            if (seed !== undefined) {
                textPromptContent += `\n\nUse seed: ${seed}.`;
            }
            textPromptContent += `\n\n${compositionGuidance}`;
        }
        
        actualPromptUsedForFirstImage = textPromptContent;
        
        // Model-aware generation logic
        const modelToUse = exampleImage ? imageGenerationModel : textToImageModel;
        console.log(`Selected model for this task: ${modelToUse}`);
        
        try {
            if (isImagenModel(modelToUse) && !exampleImage) {
                console.log(`Routing to Imagen API for text-to-image with model: ${modelToUse}`);
                const imagenResults = await _generateImageWithImagen({
                    model: modelToUse,
                    prompt: textPromptContent,
                    aspectRatio: aspectRatio,
                    numberOfImages: numberOfImages,
                    negativePrompt: negativePrompt,
                    seed: seed
                });
                generatedImageResults.push(...imagenResults);
            } else {
                console.log(`Routing to Gemini Genkit for multimodal or Gemini text-to-image with model: ${modelToUse}`);
                for (let i = 0; i < numberOfImages; i++) {
                    let loopPrompt = textPromptContent;
                    if (numberOfImages > 1) {
                         loopPrompt += `\n\nImportant: This is image ${i + 1} of ${numberOfImages}. Vary pose or angle slightly.`;
                    }
                    const finalPromptPartsForGemini: ({text: string} | {media: {url: string}})[] = [];
                    if (exampleImage) {
                        const decodedExampleImageUrl = decodeHtmlEntitiesInUrl(exampleImage);
                        const imageExists = await verifyImageUrlExists(exampleImage);
                        if (imageExists) {
                             finalPromptPartsForGemini.push({ media: { url: decodedExampleImageUrl } });
                        } else {
                           console.warn(`Example image not found: ${decodedExampleImageUrl}. Proceeding without it.`);
                        }
                    }
                    finalPromptPartsForGemini.push({ text: loopPrompt });
                    
                    const resultValue = await _generateImageWithGemini({
                        aiInstance: ai,
                        promptParts: finalPromptPartsForGemini,
                        model: modelToUse,
                    });
                    generatedImageResults.push(resultValue);
                }
            }
        } catch (error: any) {
             console.error(`Error during generation of image batch with provider ${chosenProvider}. Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
             generatedImageResults.push(`error:Failed to process image batch. ${error.message || 'Unknown error'}`);
        }
    }

    const finalGeneratedImages = generatedImageResults.filter(res => !res.startsWith('error:'));
    const errorsEncountered = generatedImageResults.filter(res => res.startsWith('error:')).map(err => err.substring(6));

    if (finalGeneratedImages.length === 0 && numberOfImages > 0 && errorsEncountered.length > 0) {
      const allErrors = errorsEncountered.join('; ');
      console.error(`AI failed to generate ANY images/tasks for the batch. Provider: ${chosenProvider}. Errors: ${allErrors}`);
      throw new Error(`AI failed to generate any images/tasks for the batch. Errors: ${allErrors}`);
    }
    if (errorsEncountered.length > 0) {
      console.warn(`Some images/tasks in the batch failed: ${errorsEncountered.join('; ')}`);
    }
    
    if (chosenProvider.toUpperCase() === 'FREEPIK' && !actualPromptUsedForFirstImage && finalizedTextPrompt) {
        actualPromptUsedForFirstImage = finalizedTextPrompt; 
    } else if (chosenProvider.toUpperCase() === 'FREEPIK' && !actualPromptUsedForFirstImage) {
        actualPromptUsedForFirstImage = `Concept: "${brandDescription}". Add stylistic details: "${imageStyle}". (Error occurred before full prompt capture for batch)`;
    }

    return {generatedImages: finalGeneratedImages, promptUsed: actualPromptUsedForFirstImage, providerUsed: chosenProvider };
  }
);

    