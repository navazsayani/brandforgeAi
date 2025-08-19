
'use server';
/**
 * @fileOverview An AI agent that generates a brand logo concept.
 *
 * - generateBrandLogo - A function that handles the logo generation process.
 * - GenerateBrandLogoInput - The input type for the generateBrandLogo function.
 * - GenerateBrandLogoOutput - The return type for the generateBrandLogo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getModelConfig } from '@/lib/model-config';
import { GoogleGenAI } from "@google/genai";
import { compressDataUriServer } from '@/lib/utils';

const GenerateBrandLogoInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  industry: z.string().optional().describe('The industry of the brand (e.g., Fashion, Technology).'),
  targetKeywords: z.string().optional().describe('Comma-separated list of target keywords for the brand.'),
  logoType: z.enum(['logomark', 'logotype', 'monogram']).optional().default('logomark').describe('The type of logo to generate (Symbol, Wordmark, or Initials).'),
  logoShape: z.enum(['circle', 'square', 'shield', 'hexagon', 'diamond', 'custom']).optional().default('circle').describe('Preferred logo shape/form factor.'),
  logoStyle: z.enum(['minimalist', 'modern', 'classic', 'playful', 'bold', 'elegant']).optional().default('modern').describe('Preferred logo style aesthetic.'),
  logoColors: z.string().optional().describe('A text description of the desired color palette (e.g., "deep teal, soft gold").'),
  logoBackground: z.enum(['white', 'transparent', 'dark']).optional().default('white').describe('The desired background for the logo.'),
  logoSize: z.enum(['small', 'medium', 'large']).optional().default('medium').describe('The preferred logo size for different use cases.'),
});
export type GenerateBrandLogoInput = z.infer<typeof GenerateBrandLogoInputSchema>;

const GenerateBrandLogoOutputSchema = z.object({
  logoDataUri: z.string().describe('The generated logo image as a data URI.'),
});
export type GenerateBrandLogoOutput = z.infer<typeof GenerateBrandLogoOutputSchema>;

// --- START: Helper functions for detailed prompt construction ---

function getStyleGuidance(style: string): string {
  const guidance = {
    minimalist: 'STYLE: Clean, simple design with plenty of white space and minimal elements.',
    modern: 'STYLE: Contemporary look with clean lines and current design trends.',
    classic: 'STYLE: Timeless, traditional design with elegant proportions.',
    playful: 'STYLE: Friendly, approachable design with personality.',
    bold: 'STYLE: Strong, confident design with high contrast and impact.',
    elegant: 'STYLE: Sophisticated, refined design with graceful elements.'
  };
  return guidance[style as keyof typeof guidance] || guidance.modern;
}

function getEnhancedIndustryGuidance(industry: string, brandDescription: string): string {
  const industryLower = industry.toLowerCase();
  let baseGuidance = '';
  let brandSpecificElements = '';
  
  if (industryLower.includes('tech') || industryLower.includes('saas')) {
    baseGuidance = 'INDUSTRY CONTEXT: Technology/Software - Consider clean geometric shapes, connectivity concepts, innovation symbols, digital transformation themes.';
    brandSpecificElements = 'Tech brands should convey trust, innovation, scalability, and forward-thinking. Consider circuit patterns, network nodes, abstract data flows, or minimalist geometric forms that reflect the brand\'s specific technology focus.';
  } else if (industryLower.includes('health') || industryLower.includes('wellness')) {
    baseGuidance = 'INDUSTRY CONTEXT: Health/Wellness - Consider balance, vitality, care, growth, healing, and holistic well-being concepts.';
    brandSpecificElements = 'Health brands should evoke trust, care, professionalism, and positive outcomes. Consider organic shapes, growth symbols, protective elements, or calming elements that align with the brand\'s healthcare approach.';
  } else if (industryLower.includes('food') || industryLower.includes('beverage')) {
    baseGuidance = 'INDUSTRY CONTEXT: Food/Beverage - Consider freshness, quality, nourishment, culinary excellence, and appetite appeal.';
    brandSpecificElements = 'Food brands should suggest quality, freshness, taste, and satisfaction. Consider organic shapes, natural elements, or stylized food symbols that reflect the brand\'s culinary identity.';
  } else if (industryLower.includes('finance') || industryLower.includes('fintech')) {
    baseGuidance = 'INDUSTRY CONTEXT: Finance - Consider trust, security, growth, stability, prosperity, and financial success.';
    brandSpecificElements = 'Financial brands must convey reliability, security, and growth. Consider upward arrows, shield symbols, stable geometric forms, or abstract representations of progress and security.';
  } else if (industryLower.includes('education')) {
    baseGuidance = 'INDUSTRY CONTEXT: Education - Consider growth, knowledge, development, learning, enlightenment, and academic excellence.';
    brandSpecificElements = 'Educational brands should inspire learning and growth. Consider book symbols, growth elements, light/illumination concepts, or abstract representations of knowledge and development.';
  } else if (industryLower.includes('fashion') || industryLower.includes('apparel')) {
    baseGuidance = 'INDUSTRY CONTEXT: Fashion/Apparel - Consider style, elegance, craftsmanship, personal expression, and aesthetic appeal.';
    brandSpecificElements = 'Fashion brands should reflect style and sophistication. Consider elegant lines, fabric textures, fashion silhouettes, or abstract style elements that capture the brand\'s fashion identity.';
  } else if (industryLower.includes('real estate')) {
    baseGuidance = 'INDUSTRY CONTEXT: Real Estate - Consider homes, community, stability, investment, shelter, and property value.';
    brandSpecificElements = 'Real estate brands should suggest stability and home. Consider house symbols, architectural elements, key concepts, or abstract representations of shelter and community.';
  } else {
    baseGuidance = `INDUSTRY CONTEXT: ${industry} - Consider concepts and visual elements relevant to this industry.`;
    brandSpecificElements = 'Ensure the logo reflects industry-appropriate symbolism and appeals to the target market within this sector.';
  }
  
  return `${baseGuidance}\n${brandSpecificElements}\nBRAND ALIGNMENT: The logo must authentically represent the specific brand essence: "${brandDescription}" while fitting industry expectations.`;
}

function getShapeGuidance(shape: string): string {
  const shapeGuidance = {
    circle: 'SHAPE: Design to fit within a circular boundary - the logo should work well in a round frame and convey unity, completeness, and harmony.',
    square: 'SHAPE: Design to fit within a square/rectangular boundary - the logo should work well in a square frame and convey stability, balance, and reliability.',
    shield: 'SHAPE: Design to fit within a shield-shaped boundary - the logo should work well in a shield-like frame and convey protection, security, and strength.',
    hexagon: 'SHAPE: Design to fit within a hexagonal boundary - the logo should work well in a hexagon frame and convey efficiency, structure, and innovation.',
    diamond: 'SHAPE: Design to fit within a diamond/rhombus boundary - the logo should work well in a diamond frame and convey luxury, precision, and uniqueness.',
    custom: 'SHAPE: Create a unique, organic shape that perfectly fits the brand identity - break free from standard geometric boundaries while maintaining professional appeal. The logo itself can define its own optimal shape.'
  };
  return shapeGuidance[shape as keyof typeof shapeGuidance] || shapeGuidance.circle;
}

function getLogoSizeGuidance(size: string): string {
  const sizeGuidance = {
    small: 'SIZE: Design for small applications (business cards, favicons, app icons) - prioritize simplicity and clarity at small scales. Avoid fine details that may not be visible.',
    medium: 'SIZE: Design for standard business applications (letterheads, websites, signage) - balanced detail level that works across most use cases.',
    large: 'SIZE: Design for large format applications (billboards, banners, large displays) - can include more intricate details and complex elements.'
  };
  return sizeGuidance[size as keyof typeof sizeGuidance] || sizeGuidance.medium;
}

function getLogoTypeInstruction(logoType: string, brandName: string): string {
    switch (logoType) {
        case 'logotype':
            return `**Design Focus: Logotype/Wordmark** - The primary focus MUST be on the stylized text of the brand name: "${brandName}". Create a unique, memorable typographic treatment. A small, simple icon can accompany the text, but the text itself must be the hero.`;
        case 'monogram':
            const initials = brandName.split(' ').map(n => n[0]).join('');
            return `**Design Focus: Monogram/Lettermark** - Create a powerful and creative monogram using the initials "${initials}". The initials should be artfully combined into a single, cohesive symbol.`;
        case 'logomark':
        default:
            return `**Design Focus: Logomark/Icon** - Create a compelling, abstract, or symbolic icon that represents the essence of "${brandName}". The icon should be clean, recognizable, and memorable on its own, optionally accompanied by the brand name in a clean font.`;
    }
}

// --- END: Helper functions ---


// Helper function for creating Gemini-optimized prompts (conversational style)
function _createGeminiLogoPrompt(input: GenerateBrandLogoInput): string {
    const { brandName, brandDescription, industry, targetKeywords, logoType, logoShape, logoStyle, logoColors, logoBackground, logoSize } = input;
    
    const conversationalPrompt = `I need you to design a compelling and memorable logo for "${brandName}". Let me tell you about this brand and what I'm envisioning:

**About the Brand:**
${brandDescription}

${industry && industry !== '_none_' ? `This brand operates in the ${industry} industry, so the logo should feel authentic to that space while standing out from competitors.` : ''}

${targetKeywords ? `Key themes that should influence the design: ${targetKeywords}` : ''}

**Design Vision:**
${getLogoTypeInstruction(logoType || 'logomark', brandName)}

I'm thinking the overall aesthetic should be ${logoStyle || 'modern'} - something that really captures the brand's personality. ${getShapeGuidance(logoShape || 'circle')}

${logoColors ? `For colors, I'd love to see a palette based on: ${logoColors}. These colors should reflect the brand's character.` : 'Please choose colors that authentically represent the brand\'s personality and appeal to their target audience.'}

The logo will be used on a ${logoBackground || 'white'} background, so please design accordingly. ${getLogoSizeGuidance(logoSize || 'medium')}

${industry && industry !== '_none_' ? getEnhancedIndustryGuidance(industry, brandDescription) : ''}

**What I'm Looking For:**
Can you create something that not only looks professional and polished, but also tells this brand's story at first glance? The logo should feel like it truly belongs to this specific brand - not something generic that could work for anyone. I want people to see it and immediately understand what this brand is about and feel drawn to it.

Make it memorable, authentic, and perfectly suited for all business applications - from business cards to billboards.`;
    
    return conversationalPrompt;
}

// Helper function for creating Imagen-optimized prompts (direct descriptive style)
function _createImagenLogoPrompt(input: GenerateBrandLogoInput): string {
    const { brandName, brandDescription, industry, targetKeywords, logoType, logoShape, logoStyle, logoColors, logoBackground, logoSize } = input;
    
    // Build visual description based on logo type
    let visualDescription = '';
    let avoidanceClause = '';
    
    switch (logoType) {
        case 'logotype':
            visualDescription = `Stylized typography logo featuring the text "${brandName}" with custom lettering design`;
            avoidanceClause = ', avoid abstract symbols or pure icons';
            break;
        case 'monogram':
            const initials = brandName.split(' ').map(n => n[0]).join('');
            visualDescription = `Artistic monogram design combining only the letters "${initials}" into a unified symbol`;
            avoidanceClause = ', avoid full words or company names or additional text beyond the initials';
            break;
        case 'logomark':
        default:
            // For logomark, create a descriptive visual concept without mentioning text
            const industryVisuals = getIndustryVisualConcepts(industry, brandDescription);
            visualDescription = `Pure abstract symbol design with ${industryVisuals}, text-free icon`;
            avoidanceClause = ', completely avoid any text, letters, words, typography, writing, alphabet, numbers, characters, readable text, brand names, or any text elements whatsoever';
    }
    
    // Build style and color description
    const styleDesc = getStyleDescription(logoStyle || 'modern');
    const shapeDesc = getShapeDescription(logoShape || 'circle');
    const colorDesc = logoColors || 'professional color palette with 2-3 colors';
    
    // Create direct visual prompt for Imagen with avoidance built in
    const imagenPrompt = `${visualDescription}, ${styleDesc}, ${shapeDesc}, ${colorDesc}, ${logoBackground || 'white'} background, high quality vector-style graphic, professional logo design, clean and scalable${avoidanceClause}`;
    
    return imagenPrompt;
}

// Helper function to get industry-specific visual concepts for logomarks
function getIndustryVisualConcepts(industry: string | undefined, brandDescription: string): string {
    if (!industry || industry === '_none_') {
        return 'geometric shapes representing innovation and growth';
    }
    
    const industryLower = industry.toLowerCase();
    
    if (industryLower.includes('tech') || industryLower.includes('saas')) {
        return 'geometric shapes, circuit patterns, or connectivity symbols';
    } else if (industryLower.includes('health') || industryLower.includes('wellness')) {
        return 'organic curves, leaf shapes, or wellness symbols';
    } else if (industryLower.includes('food') || industryLower.includes('beverage')) {
        return 'organic shapes, natural elements, or culinary symbols';
    } else if (industryLower.includes('finance') || industryLower.includes('fintech')) {
        return 'upward arrows, shield shapes, or stability symbols';
    } else if (industryLower.includes('education')) {
        return 'growth symbols, book shapes, or knowledge representations';
    } else if (industryLower.includes('fashion') || industryLower.includes('apparel')) {
        return 'elegant curves, fashion silhouettes, or style elements';
    } else if (industryLower.includes('real estate')) {
        return 'house shapes, architectural elements, or home symbols';
    } else {
        return 'abstract geometric shapes representing the brand essence';
    }
}

// Helper function to get style descriptions for Imagen
function getStyleDescription(style: string): string {
    const styleMap = {
        minimalist: 'clean minimal design with simple lines',
        modern: 'contemporary sleek design with sharp edges',
        classic: 'timeless elegant design with refined proportions',
        playful: 'friendly rounded design with approachable elements',
        bold: 'strong impactful design with thick lines',
        elegant: 'sophisticated graceful design with flowing curves'
    };
    return styleMap[style as keyof typeof styleMap] || styleMap.modern;
}

// Helper function to get shape descriptions for Imagen
function getShapeDescription(shape: string): string {
    const shapeMap = {
        circle: 'circular composition with rounded elements',
        square: 'square composition with balanced proportions',
        shield: 'shield-shaped composition conveying protection',
        hexagon: 'hexagonal composition with structured angles',
        diamond: 'diamond-shaped composition with precise geometry',
        custom: 'organic custom shape following natural proportions'
    };
    return shapeMap[shape as keyof typeof shapeMap] || shapeMap.circle;
}

// Helper function to detect if a model is an Imagen model
function isImagenModel(modelName: string): boolean {
  return modelName.toLowerCase().includes('imagen');
}

// Helper function to validate and clean Imagen model names
function validateImagenModel(modelName: string): string {
  // Remove "googleai/" prefix if present (Imagen API doesn't use this prefix)
  let cleanModelName = modelName.replace(/^googleai\//, '');
  
  // Log prefix removal if it happened
  if (modelName !== cleanModelName) {
    console.log(`[Logo Gen] Removed "googleai/" prefix from Imagen model: "${modelName}" → "${cleanModelName}"`);
  }
  
  console.log(`[Logo Gen] Imagen model validation: input="${modelName}", cleaned="${cleanModelName}"`);
  return cleanModelName;
}

// Helper function to optimize prompts for Imagen models
function optimizePromptForImagen(originalPrompt: string, modelName: string): string {
  console.log(`[Logo Gen] Optimizing prompt for Imagen model: ${modelName}`);
  
  // Remove Gemini-specific formatting and instructions
  let optimizedPrompt = originalPrompt
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .replace(/^-\s/gm, '') // Remove bullet points
    .replace(/^\d+\.\s/gm, '') // Remove numbered lists
    
    // Clean up extra whitespace and newlines
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\s{2,}/g, ' '); // Replace multiple spaces with single
  
  console.log(`[Logo Gen] Original prompt length: ${originalPrompt.length}, Optimized length: ${optimizedPrompt.length}`);
  return optimizedPrompt;
}

// New function to generate logos using Google's Imagen API
async function _generateLogoWithImagen(params: {
  model: string;
  prompt: string;
  logoType: string;
}): Promise<string> {
  const validatedModel = validateImagenModel(params.model);
  console.log(`[Logo Gen] === IMAGEN API LOGO GENERATION ===`);
  console.log(`[Logo Gen] Model: ${validatedModel}`);
  console.log(`[Logo Gen] Logo Type: ${params.logoType}`);
  console.log(`[Logo Gen] Prompt: ${params.prompt.substring(0, 200)}...`);
  
  // Optimize the prompt for Imagen models
  const optimizedPrompt = optimizePromptForImagen(params.prompt, validatedModel);
  
  console.log(`[Logo Gen] Logo type-specific avoidance built into main prompt`);
  
  try {
    // Initialize GoogleGenAI with API key from environment
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Google AI API key not found. Please set GOOGLE_AI_API_KEY or GOOGLE_API_KEY environment variable.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Build request config optimized for logo generation
    const requestConfig: any = {
      numberOfImages: 1,
      aspectRatio: "1:1", // Logos are typically square
      personGeneration: "allow_adult",
      safetySettings: "block_few",
      outputOptions: {
        compressionQuality: "high",
        mimeType: "image/png"
      }
    };
    
    console.log(`[Logo Gen] Making Imagen API call...`);
    
    const response = await ai.models.generateImages({
      model: validatedModel,
      prompt: optimizedPrompt,
      config: requestConfig
    });

    console.log(`[Logo Gen] Imagen API response received:`, {
      hasGeneratedImages: !!response.generatedImages,
      imageCount: response.generatedImages?.length || 0
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("Imagen API returned no images in response");
    }

    // Convert imageBytes to data URI
    const generatedImage = response.generatedImages[0];
    if (!generatedImage.image?.imageBytes) {
      throw new Error(`Imagen API returned invalid image data. Missing imageBytes.`);
    }
    
    const dataUri = `data:image/png;base64,${generatedImage.image.imageBytes}`;
    console.log(`[Logo Gen] Successfully generated logo using Imagen model: ${validatedModel}`);
    
    // Compress the image if it's too large
    const compressedDataUri = compressDataUriServer(dataUri, 800 * 1024); // 800KB limit
    console.log(`[Logo Gen] Image compression: Original ${dataUri.length} bytes, Final ${compressedDataUri.length} bytes`);
    
    return compressedDataUri;

  } catch (error: any) {
    console.error("[Logo Gen] === IMAGEN API ERROR ===");
    console.error("Error details:", error);
    
    // Provide more specific error messages
    if (error.message?.includes('404') || error.status === 404) {
      throw new Error(`Imagen model "${validatedModel}" not found. Please verify the model name in admin settings. Available models: imagen-3.0-generate-001, imagen-3.0-fast-generate-001`);
    } else if (error.message?.includes('401') || error.status === 401) {
      throw new Error(`Authentication failed for Imagen API. Please check your Google AI API key.`);
    } else if (error.message?.includes('403') || error.status === 403) {
      throw new Error(`Access denied for Imagen API. Your API key may not have access to Imagen models.`);
    }
    
    throw new Error(`Imagen API request failed: ${error.message}`);
  }
}

const generateBrandLogoFlow = ai.defineFlow(
  {
    name: 'generateBrandLogoFlow',
    inputSchema: GenerateBrandLogoInputSchema,
    outputSchema: GenerateBrandLogoOutputSchema,
  },
  async (input) => {
    const { textToImageModel } = await getModelConfig();
    const isImagen = isImagenModel(textToImageModel);

    const promptText = isImagen
      ? _createImagenLogoPrompt(input)
      : _createGeminiLogoPrompt(input);
      
    console.log(`[Logo Gen] Using ${isImagen ? 'Imagen' : 'Gemini'} approach for model: ${textToImageModel}`);
    console.log(`[Logo Gen] Prompt preview:`, promptText.substring(0, 300) + "...");

    try {
      if (isImagen) {
        // Use Imagen API directly
        const logoDataUri = await _generateLogoWithImagen({
          model: textToImageModel,
          prompt: promptText,
          logoType: input.logoType || 'logomark'
        });
        return { logoDataUri };
      } else {
        // Use Genkit for Gemini models
        const {media} = await ai.generate({
          model: textToImageModel,
          prompt: promptText,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        if (!media || !media.url || !media.url.startsWith('data:')) {
          console.error('Gemini logo generation failed or returned invalid data URI. Response media:', JSON.stringify(media, null, 2));
          throw new Error('AI failed to generate a valid logo image or the format was unexpected.');
        }
        
        // Compress the image if it's too large
        const compressedDataUri = compressDataUriServer(media.url, 800 * 1024); // 800KB limit
        console.log(`[Logo Gen] Gemini image compression: Original ${media.url.length} bytes, Final ${compressedDataUri.length} bytes`);
        
        return { logoDataUri: compressedDataUri };
      }
    } catch (error: any) {
      console.error("Error during logo generation:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw new Error(`Error during logo generation: ${error.message || 'Unknown error'}`);
    }
  }
);

export async function generateBrandLogo(
  input: GenerateBrandLogoInput
): Promise<GenerateBrandLogoOutput> {
  return generateBrandLogoFlow(input);
}
