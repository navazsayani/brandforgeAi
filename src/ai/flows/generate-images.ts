
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Action } from 'genkit'; 
import { describeImage } from './describe-image-flow'; // For Freepik description
import { industries, freepikValidStyles } from '../../lib/constants'; // Added freepikValidStyles
import { getModelConfig } from '@/lib/model-config';

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
}): Promise<string> {
  const { aiInstance, promptParts } = params;
  const { imageGenerationModel } = await getModelConfig();

  console.log("Final prompt parts array for Gemini _generateImageWithGemini:", JSON.stringify(promptParts, null, 2));

  try {
    const {media} = await aiInstance.generate({
      model: imageGenerationModel,
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

async function _generateImageWithImagen_stub(params: { 
  brandDescription: string;
  industry?: string;
  imageStyle: string;
  exampleImage?: string;
  aspectRatio?: string;
  negativePrompt?: number;
  seed?: number;
  textPrompt: string;
}): Promise<string> {
  console.warn("Imagen (e.g., via Vertex AI) provider is called but not implemented. Parameters:", params);
  throw new Error("Imagen provider (e.g., via Vertex AI) is not implemented yet. This would typically involve a different Genkit plugin or direct API calls.");
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
            if (exampleImageDescription) {
                console.log(`Freepik prompt using example image description: "${exampleImageDescription.substring(0,100)}..."`);
                baseContentPrompt = `An example image was provided, which is described as: "${exampleImageDescription}". Using that description as primary inspiration for the subject and main visual elements, now generate an image based on the following concept: "${brandDescription}".`;
            } else {
                baseContentPrompt = `Generate an image based on the concept: "${brandDescription}".`;
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
        for (let i = 0; i < numberOfImages; i++) {
            let textPromptContent = "";
            
            if (finalizedTextPrompt && finalizedTextPrompt.trim() !== "") {
                console.log(`Using finalized text prompt for image ${i+1}: "${finalizedTextPrompt.substring(0,100)}..." (Provider: ${chosenProvider})`);
                textPromptContent = finalizedTextPrompt;
                
                if (chosenProvider !== 'FREEPIK') { 
                    if (aspectRatio && !finalizedTextPrompt.toLowerCase().includes("aspect ratio")) {
                      textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally, and the image content itself must fully occupy this ${aspectRatio} frame, without any artificial letterboxing or pillarboxing.`;
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
                 if (numberOfImages > 1 && chosenProvider !== 'FREEPIK') {
                    textPromptContent += `\n\nImportant for batch generation: You are generating image ${i + 1} of a set of ${numberOfImages}. All images in this set should feature the *same core subject or item* as described/derived from the inputs. For this specific image (${i + 1}/${numberOfImages}), try to vary the pose, angle, or minor background details slightly compared to other images in the set, while maintaining the identity of the primary subject. The goal is a cohesive set of images showcasing the same item from different perspectives or with subtle variations.`;
                }
            } else { 
                console.log(`Constructing prompt for image ${i+1}/${numberOfImages}. (Provider: ${chosenProvider})`);
                if (!brandDescription || !imageStyle) {
                    throw new Error("Brand description and image style are required if not providing/using a finalized text prompt.");
                }
                
                let coreInstructions = "";

                if (exampleImage && chosenProvider === 'GEMINI') { 
                    coreInstructions = `You are creating a strategic brand marketing image designed to drive engagement, build brand awareness, and convert viewers into customers on social media platforms.

**BRAND STRATEGY CONTEXT:**
The provided example image serves as a category reference only. Your mission is to create a completely new, brand-aligned visual asset that:
- Captures attention in crowded social media feeds
- Communicates brand values instantly
- Appeals to the target demographic
- Encourages social sharing and engagement
- Supports the brand's marketing objectives

**CORE CREATIVE BRIEF:**
1. **Brand Identity**: "${brandDescription}"${industryContext}
   - Extract the brand's personality, values, and unique selling proposition
   - Consider the target audience's lifestyle, aspirations, and pain points
   - Identify what makes this brand different from competitors
   - Think about the emotional connection the brand wants to create

2. **Visual Execution Style**: "${imageStyle}"
   - This defines the aesthetic approach, mood, and technical execution
   - For realistic styles: Create professional, market-ready visuals
   - For artistic styles: Balance creativity with brand recognition
   - Consider platform-specific best practices (Instagram, TikTok, etc.)

**MARKETING OPTIMIZATION REQUIREMENTS:**
- **Scroll-stopping power**: The image must stand out in social feeds
- **Brand consistency**: Align with the brand's visual identity and messaging
- **Target audience appeal**: Resonate with the specific demographic
- **Conversion potential**: Include subtle elements that encourage action
- **Shareability factor**: Create content people want to share
- **Platform optimization**: Consider where this will be posted

**CREATIVE GUIDELINES:**
- Use the example image ONLY for category identification
- Create something completely new that embodies the brand essence
- Avoid generic or cliché visual approaches
- Include contextual elements that tell a brand story
- Consider seasonal trends and cultural relevance
- Ensure the image works both as standalone content and in campaigns

**QUALITY STANDARDS:**
- Professional marketing-grade quality
- Optimized for social media engagement
- Culturally sensitive and inclusive
- Technically excellent (lighting, composition, clarity)
- Brand-appropriate and on-message
`;
                } else { 
                    coreInstructions = `You are creating a strategic brand marketing image designed to maximize social media engagement and brand recognition.

**BRAND MARKETING OBJECTIVE:**
Create a compelling visual that represents: "${brandDescription}"${industryContext}

**STRATEGIC REQUIREMENTS:**
- **Brand Storytelling**: The image should instantly communicate the brand's core value proposition
- **Target Audience Appeal**: Consider who this brand serves and what resonates with them
- **Social Media Optimization**: Design for maximum engagement on platforms like Instagram, TikTok, Facebook
- **Conversion Focus**: Include elements that encourage viewers to learn more or take action
- **Brand Differentiation**: Highlight what makes this brand unique in its market

**VISUAL EXECUTION STYLE**: "${imageStyle}"
- For realistic styles: Create professional, market-ready content
- For artistic styles: Balance creativity with brand clarity
- Ensure the style enhances rather than overshadows the brand message

**MARKETING BEST PRACTICES:**
- Use colors and composition that align with brand personality
- Include contextual elements that tell a brand story
- Consider current social media trends and visual preferences
- Ensure the image works both standalone and in marketing campaigns
- Create content that encourages social sharing and engagement

**QUALITY STANDARDS:**
- Professional marketing-grade execution
- Culturally appropriate and inclusive
- Technically excellent (lighting, composition, clarity)
- Brand-consistent and strategically aligned
`;
                }
                textPromptContent = `Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.\n\n${coreInstructions}`;
                
                if (chosenProvider !== 'FREEPIK') { 
                  if (negativePrompt) {
                      textPromptContent += `\n\nAvoid the following elements or characteristics in the image: ${negativePrompt}.`;
                  }
                  if (aspectRatio) { 
                    textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally, and the image content itself must fully occupy this ${aspectRatio} frame, without any artificial letterboxing or pillarboxing.`;
                  }
                  if (seed !== undefined) { 
                    textPromptContent += `\n\nUse seed: ${seed}.`;
                  }
                   textPromptContent +=`\n\n${compositionGuidance}`; 
                }
                if (numberOfImages > 1 && chosenProvider !== 'FREEPIK') {
                    textPromptContent += `\n\nImportant for batch generation: You are generating image ${i + 1} of a set of ${numberOfImages}. All images in this set should feature the *same core subject or item* as described/derived from the inputs. For this specific image (${i + 1}/${numberOfImages}), try to vary the pose, angle, or minor background details slightly compared to other images in the set, while maintaining the identity of the primary subject. The goal is a cohesive set of images showcasing the same item from different perspectives or with subtle variations.`;
                }
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
                        console.log("Final prompt parts array for Gemini (loop):", JSON.stringify(finalPromptPartsForGemini, null, 2));
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
                        throw new Error(`Unsupported image generation provider in loop: ${chosenProvider}`);
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

    if (finalGeneratedImages.length === 0 && numberOfImages > 0 && errorsEncountered.length > 0 && (chosenProvider.toUpperCase() !== 'FREEPIK' || errorsEncountered.length === 1)) {
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
        // Fallback if something went wrong before full prompt capture
        actualPromptUsedForFirstImage = `Concept: "${brandDescription}". Add stylistic details: "${imageStyle}". (Error occurred before full prompt capture for batch)`;
    }

    return {generatedImages: finalGeneratedImages, promptUsed: actualPromptUsedForFirstImage, providerUsed: chosenProvider };
  }
);

// Action.define(generateImagesFlow, { 
//     name: 'testGenerateImages',
//     input: {
//         schema: GenerateImagesInputSchema,
//         examples: [
//             {
//                 provider: 'GEMINI',
//                 brandDescription: 'A futuristic eco-friendly tech company.',
//                 imageStyle: 'cyberpunk, neon lights, detailed illustration',
//                 numberOfImages: 1,
//                 aspectRatio: '16:9',
//                 negativePrompt: 'blurry, low quality'
//             },
//             {
//                 provider: 'FREEPIK',
//                 brandDescription: 'A luxury Italian coffee brand.',
//                 imageStyle: 'photo', 
//                 numberOfImages: 2,
//                 aspectRatio: 'square_1_1', 
//                 freepikEffectColor: 'sepia',
//                 freepikEffectFraming: 'close-up'
//             }
//         ],
//     },
//     output: {
//         schema: GenerateImagesOutputSchema,
//     },
// });

    
