
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
  logoType: z.enum(['logomark', 'logotype', 'monogram', 'combination']).optional().default('logotype').describe('The type of logo to generate (Symbol, Wordmark, Initials, or Text+Symbol combination).'),
  logoShape: z.enum(['circle', 'square', 'shield', 'hexagon', 'diamond', 'triangle', 'custom']).optional().default('custom').describe('Preferred logo shape/form factor.'),
  logoStyle: z.enum(['minimalist', 'modern', 'classic', 'playful', 'bold', 'elegant', 'vintage', 'organic']).optional().default('modern').describe('Preferred logo style aesthetic.'),
  logoColors: z.string().optional().describe('A text description of the desired color palette (e.g., "deep teal, soft gold").'),
  logoBackground: z.enum(['white', 'light', 'transparent', 'dark']).optional().default('dark').describe('The desired background for the logo.'),
});
export type GenerateBrandLogoInput = z.infer<typeof GenerateBrandLogoInputSchema>;

const GenerateBrandLogoOutputSchema = z.object({
  logoDataUri: z.string().describe('The generated logo image as a data URI.'),
});
export type GenerateBrandLogoOutput = z.infer<typeof GenerateBrandLogoOutputSchema>;

// --- START: Helper functions for detailed prompt construction ---

function getStyleGuidance(style: string): string {
  const guidance = {
    minimalist: 'STYLE: Emphasize a clean, simple design with generous use of negative space and minimal elements. The focus is on pure, essential forms.',
    modern: 'STYLE: Create a contemporary, sleek look using clean lines, sharp edges, and current design trends. The result should feel fresh and forward-thinking.',
    classic: 'STYLE: Design a timeless, traditional logo with elegant proportions and a sense of heritage and enduring quality.',
    playful: 'STYLE: Develop a friendly, approachable design with a distinct personality. Use rounded shapes and dynamic elements to evoke fun and accessibility.',
    bold: 'STYLE: Construct a strong, confident design with high contrast, thick lines, and significant visual impact. The logo must command attention.',
    elegant: 'STYLE: Craft a sophisticated and refined logo with graceful lines and a sense of luxury and high quality.',
    vintage: 'STYLE: Create a nostalgic, retro-inspired design with classic design elements from past eras. The logo should evoke heritage, authenticity, and timeless appeal with vintage aesthetics.',
    organic: 'STYLE: Develop a natural, earth-inspired design with flowing, organic shapes and elements from nature. The logo should feel warm, sustainable, and connected to natural forms.'
  };
  return guidance[style as keyof typeof guidance] || guidance.modern;
}

function getEnhancedIndustryGuidance(industry: string, brandDescription: string): string {
  const industryLower = industry.toLowerCase();
  let baseGuidance = '';
  let brandSpecificElements = '';
  
  if (industryLower.includes('tech') || industryLower.includes('saas')) {
    baseGuidance = 'INDUSTRY CONTEXT: Technology/Software - Modern, human-centered design that conveys innovation through simplicity and forward-thinking aesthetics.';
    brandSpecificElements = 'Tech brands should convey trust, innovation, and scalability through clean, contemporary visual language. Consider modern geometric abstraction, dynamic shapes suggesting progress and growth, or refined letterforms. Avoid literal tech clichés like circuits, chips, or network nodes. Modern SaaS brands favor approachable, human-centered design over technical imagery.';
  } else if (industryLower.includes('health') || industryLower.includes('wellness')) {
    baseGuidance = 'INDUSTRY CONTEXT: Health/Wellness - Use visual motifs that suggest balance, vitality, care, growth, healing, and holistic well-being.';
    brandSpecificElements = 'Health brands must evoke trust, care, and professionalism. Consider organic shapes, growth symbols (like a leaf or sprout), protective forms (like hands or a shield), or calming elements that align with the brand\'s specific healthcare approach.';
  } else if (industryLower.includes('food') || industryLower.includes('beverage')) {
    baseGuidance = 'INDUSTRY CONTEXT: Food/Beverage - The design should evoke freshness, quality, nourishment, culinary excellence, and appetite appeal.';
    brandSpecificElements = 'Food brands should visually suggest quality, freshness, and taste. This can be achieved through organic shapes, natural elements, or stylized symbols of food/ingredients that directly reflect the brand’s culinary identity.';
  } else if (industryLower.includes('finance') || industryLower.includes('fintech')) {
    baseGuidance = 'INDUSTRY CONTEXT: Finance/Fintech - Visuals should communicate trust, security, growth, stability, and financial success.';
    brandSpecificElements = 'Financial brands must convey reliability and growth. Utilize visual elements like upward-trending arrows, shield symbols, stable geometric forms (like pillars or blocks), or abstract representations of progress and security.';
  } else if (industryLower.includes('education')) {
    baseGuidance = 'INDUSTRY CONTEXT: Education - The logo should represent growth, knowledge, development, learning, and academic excellence.';
    brandSpecificElements = 'Educational brands should inspire learning. Consider symbols like books, graduation caps, trees of knowledge, lightbulbs (for ideas), or abstract forms representing pathways and development.';
  } else if (industryLower.includes('fashion') || industryLower.includes('apparel')) {
    baseGuidance = 'INDUSTRY CONTEXT: Fashion/Apparel - The design must reflect style, elegance, craftsmanship, and personal expression.';
    brandSpecificElements = 'Fashion brands need a logo that is as stylish as their products. Think elegant lines, abstract representations of fabric or stitches, or a sophisticated typographic treatment that captures the brand’s aesthetic.';
  } else if (industryLower.includes('real estate')) {
    baseGuidance = 'INDUSTRY CONTEXT: Real Estate - The logo should suggest homes, community, stability, and property value.';
    brandSpecificElements = 'Real estate logos need to evoke feelings of home and security. Common successful motifs include rooflines, keys, architectural elements, or abstract shapes that suggest shelter and community.';
  } else {
    baseGuidance = `INDUSTRY CONTEXT: ${industry} - Consider concepts and visual elements relevant to this industry.`;
    brandSpecificElements = 'Ensure the logo reflects industry-appropriate symbolism and appeals to the target market within this sector.';
  }
  
  return `${baseGuidance}\n${brandSpecificElements}\nBRAND ALIGNMENT: The final logo must authentically represent the specific brand essence described here: "${brandDescription}" while fitting within the visual expectations of its industry.`;
}

function getShapeGuidance(shape: string): string {
  const shapeGuidance = {
    circle: 'SHAPE CONSTRAINT: The final logo must be designed to fit perfectly within a circular boundary. It should feel balanced and complete when enclosed in a circle, conveying unity and harmony.',
    square: 'SHAPE CONSTRAINT: The final logo must be designed to fit perfectly within a square boundary. It should feel stable, balanced, and reliable when enclosed in a square frame.',
    shield: 'SHAPE CONSTRAINT: The final logo must be designed to fit within a shield-shaped boundary. It should evoke feelings of protection, security, and strength.',
    hexagon: 'SHAPE CONSTRAINT: The final logo must be designed to fit within a hexagonal boundary. It should convey a sense of structure, efficiency, and innovation.',
    diamond: 'SHAPE CONSTRAINT: The final logo must be designed to fit within a diamond or rhombus-shaped boundary. It should suggest luxury, precision, and uniqueness.',
    triangle: 'SHAPE CONSTRAINT: The final logo must be designed to fit within a triangular boundary. It should convey dynamism, direction, stability, and forward movement.',
    custom: 'SHAPE CONSTRAINT: Create a unique, organic, or abstract shape for the logo itself. It should break free from standard geometric boundaries while maintaining a professional and balanced form factor.'
  };
  return shapeGuidance[shape as keyof typeof shapeGuidance] || shapeGuidance.custom;
}

function getLogoTypeInstruction(logoType: string, brandName: string): string {
    switch (logoType) {
        case 'logotype':
            return `**Design Focus: Logotype/Wordmark** - The absolute primary focus MUST be on the stylized text of the brand name: "${brandName}". Create a unique, memorable typographic treatment that acts as the logo itself. A very small, simple icon can *accompany* the text, but the text must be the hero and stand alone as the logo.`;
        case 'monogram':
            const initials = brandName.split(' ').map(n => n[0]).join('');
            return `**Design Focus: Monogram/Lettermark** - The design MUST be a creative monogram using ONLY the initials "${initials}". The letters should be artfully combined into a single, cohesive, and memorable symbol. Do not include the full brand name.`;
        case 'combination':
            return `**Design Focus: Combination Mark** - Create a balanced logo combining BOTH a distinctive icon/symbol AND the brand name "${brandName}" as text. The icon and text should work together as a unified design - both elements are equally important. The text should be clearly readable in a professional font (like Montserrat Medium), positioned harmoniously with the icon (typically icon above text, or icon to the left of text). This creates a complete logo where symbol and wordmark complement each other.`;
        case 'logomark':
        default:
            return `**Design Focus: Logomark/Icon** - Create a compelling, abstract, or symbolic icon that represents the essence of "${brandName}". The icon must be the primary focus and should be clean, recognizable, and memorable on its own. If the brand name is included, set it in Montserrat Medium, all-caps, with slight letter spacing, positioned below or to the side of the icon to maintain balance and harmony.`;
    }
}

// --- END: Helper functions ---

// New helper function for detailed style guidance (expanded for Gemini)
function getDetailedStyleGuidance(style: string): string {
  const detailedGuidance = {
    minimalist: 'Clean, simple design with generous negative space and minimal elements. Pure essential forms with restrained color palette. Emphasis on clarity and simplicity through reduction to core visual elements.',
    modern: 'Contemporary, sleek design with clean lines, sharp edges, and current design trends. Fresh, forward-thinking aesthetic with balanced proportions and sophisticated simplicity.',
    classic: 'Timeless, traditional design with elegant proportions and heritage quality. Refined composition conveying enduring reliability, sophistication, and established authority.',
    playful: 'Friendly, approachable design with rounded shapes and dynamic elements. Fun, accessible aesthetic with distinctive personality, warmth, and inviting character.',
    bold: 'Strong, confident design with high contrast, thick lines, and significant visual impact. Commanding presence with assertive composition and powerful visual statement.',
    elegant: 'Sophisticated, refined design with graceful lines and luxurious quality. Flowing curves and balanced proportions suggesting premium status and refined taste.',
    vintage: 'Nostalgic, retro-inspired design with classic elements from past design eras. Heritage aesthetic evoking authenticity, tradition, and timeless appeal through vintage styling.',
    organic: 'Natural, earth-inspired design with flowing shapes and elements from nature. Warm, sustainable aesthetic featuring organic curves, natural forms, and eco-friendly character.'
  };
  return detailedGuidance[style as keyof typeof detailedGuidance] || detailedGuidance.modern;
}

// New helper function for text rendering specifications
function getTextRenderingSpecs(logoType: string, brandName: string): string {
  if (logoType === 'logotype') {
    return `Brand Text: "${brandName}" (complete brand name rendered as text)
Typography: Professional sans-serif or serif font with medium to bold weight, custom stylized letterforms
Text Quality: Crystal clear, sharp, perfectly legible text rendering with smooth edges
Letter Spacing: Appropriate tracking for readability and visual balance, professional kerning
Text as Hero: Brand name occupies 70-80% of composition as primary visual element
Text Rendering: Crisp, high-resolution text with smooth anti-aliasing and perfect letter definition
Font Treatment: Unique typographic styling that transforms the text into a distinctive logo mark`;
  } else if (logoType === 'monogram') {
    const initials = brandName.split(' ').map(n => n[0]).join('');
    return `Initials: "${initials}" only (lettermark monogram design)
Typography: Artistic letterforms creatively combined into unified symbol, bold distinctive characters
Text Quality: Sharp, perfectly rendered letters with clear definition and crisp edges
Letter Integration: Initials artfully merged, interlocked, or stacked while maintaining legibility
Scale: Letters as primary element occupying 60-70% of composition
Text Rendering: Crisp, vector-quality letterforms with perfect edges and smooth curves
Monogram Style: Creative typographic fusion making letters work together as cohesive symbol`;
  } else if (logoType === 'combination') {
    return `Brand Text: "${brandName}" (complete brand name rendered alongside icon)
Typography: Professional sans-serif font (Montserrat Medium or similar), medium to bold weight
Text Quality: Crystal clear, sharp, perfectly legible text rendering
Text Positioning: Harmoniously placed with icon (typically below or to right of symbol)
Layout Balance: Icon and text work as unified composition, both clearly visible
Scale: Icon and text share visual importance (roughly 50-50 or 40-60 split)
Text Rendering: Crisp, high-resolution text with smooth anti-aliasing
Combined Design: Symbol and wordmark complement each other as complete logo system`;
  }
  return '';
}

// New helper function for visual logo description
function getVisualLogoDescription(logoType: string, brandName: string, brandDescription: string, industry?: string): string {
  const industryVisual = industry && industry !== '_none_' ? getIndustryVisualConcepts(industry, brandDescription) : 'geometric shapes representing innovation and growth';

  if (logoType === 'logomark') {
    return `Pure symbolic icon design featuring ${industryVisual}. The icon serves as the primary brand identifier, designed to be instantly recognizable and memorable. Clean, scalable symbol that works standalone without requiring text support. Abstract or representational visual mark embodying brand essence.`;
  } else if (logoType === 'logotype') {
    return `Wordmark logo design with "${brandName}" rendered in custom stylized typography as the primary element. The text treatment itself forms the complete logo through unique typographic design. Professional lettering with distinctive character that embodies the brand personality. Typography is the logo - text styled to be memorable and ownable.`;
  } else if (logoType === 'monogram') {
    const initials = brandName.split(' ').map(n => n[0]).join('');
    return `Monogram lettermark design combining only the initials "${initials}" into a unified artistic symbol. Letters are creatively interwoven, stacked, or merged to form a single cohesive mark. Sophisticated typographic integration creating memorable brand identifier through artistic letter combination.`;
  } else if (logoType === 'combination') {
    return `Combination mark logo design featuring both a distinctive icon with ${industryVisual} AND the brand name "${brandName}" in professional typography. The symbol and text work together as a unified, balanced composition where both elements complement each other. Icon provides instant visual recognition while text ensures brand name legibility. Complete logo system combining the best of both symbolic and typographic identity.`;
  }
  return '';
}

// Helper function for creating Gemini-optimized prompts (descriptive narrative style)
function _createGeminiLogoPrompt(input: GenerateBrandLogoInput): string {
    const { brandName, brandDescription, industry, targetKeywords, logoType, logoShape, logoStyle, logoColors, logoBackground } = input;

    const descriptivePrompt = `A professional ${logoStyle || 'modern'} logo design for "${brandName}"

LOGO DESCRIPTION:
${getVisualLogoDescription(logoType || 'logomark', brandName, brandDescription, industry)}

BRAND CONTEXT (CRITICAL):
Brand: ${brandName}
Brand Story: ${brandDescription}
${industry && industry !== '_none_' ? `Industry: ${industry}` : ''}
${targetKeywords ? `Key Themes: ${targetKeywords}` : ''}

${logoType === 'logotype' || logoType === 'monogram' || logoType === 'combination' ? `TEXT RENDERING REQUIREMENTS:
${getTextRenderingSpecs(logoType || 'logomark', brandName)}

` : ''}DESIGN SPECIFICATIONS:
Style: ${getDetailedStyleGuidance(logoStyle || 'modern')}
Shape: ${getShapeGuidance(logoShape || 'custom')}
Color Palette: ${logoColors || 'Professional color scheme authentically representing the brand personality, 2-3 complementary colors'}
Background: ${logoBackground || 'dark'} background providing optimal contrast
${industry && industry !== '_none_' ? getEnhancedIndustryGuidance(industry, brandDescription) : ''}

RENDERING QUALITY:
Professional high-quality rendering with sharp details
High-resolution output suitable for business cards to billboards
Design maintaining clarity at all sizes from favicon to outdoor signage
Polished, publication-ready professional logo with commercial-grade quality
Well-crafted elements with smooth execution throughout the logo

OUTPUT REQUIREMENTS:
The final logo must be memorable, unique, and authentically represent ${brandName}'s brand identity. ${logoType === 'logomark' ? 'Pure icon design without any text, letters, words, or typography elements - symbol only.' : ''}${logoType === 'logotype' ? `Text "${brandName}" must be rendered clearly with professional typography as the primary logo element.` : ''}${logoType === 'monogram' ? `Initials must be artistically combined with crystal-clear letterforms as the complete logo.` : ''}${logoType === 'combination' ? `Both icon and text "${brandName}" must be clearly visible, balanced, and work together as a unified logo system.` : ''} Professional quality suitable for immediate business use across all applications including print, digital, merchandise, and signage.`;

    return descriptivePrompt;
}

// Helper function for creating Imagen-optimized prompts (direct descriptive style)
function _createImagenLogoPrompt(input: GenerateBrandLogoInput): string {
    const { brandName, brandDescription, industry, targetKeywords, logoType, logoShape, logoStyle, logoColors, logoBackground } = input;
    
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
        case 'combination':
            const industryVisualsCombo = getIndustryVisualConcepts(industry, brandDescription);
            visualDescription = `Combination mark logo with both a distinctive icon featuring ${industryVisualsCombo} AND the brand name "${brandName}" in professional typography, icon and text working together as unified design`;
            avoidanceClause = ', ensure both icon and text are clearly visible and balanced';
            break;
        case 'logomark':
        default:
            // For logomark, create a descriptive visual concept without mentioning text
            const industryVisuals = getIndustryVisualConcepts(industry, brandDescription);
            visualDescription = `Pure symbolic design with ${industryVisuals}, professional logo icon`;
            avoidanceClause = ', completely avoid any text, letters, words, typography, writing, alphabet, numbers, characters, readable text, brand names, or any text elements whatsoever';
    }
    
    // Build style and color description
    const styleDesc = getStyleDescription(logoStyle || 'modern');
    const shapeDesc = getShapeDescription(logoShape || 'circle');
    const colorDesc = logoColors || 'professional color palette with 2-3 colors';
    
    // Create direct visual prompt for Imagen with avoidance built in
    const imagenPrompt = `${visualDescription}, ${styleDesc}, ${shapeDesc}, ${colorDesc}, ${logoBackground || 'white'} background, high quality professional logo design${avoidanceClause}`;
    
    return imagenPrompt;
}

// Helper function to get industry-specific visual concepts for logomarks
function getIndustryVisualConcepts(industry: string | undefined, brandDescription: string): string {
    if (!industry || industry === '_none_') {
        return 'geometric shapes representing innovation and growth';
    }
    
    const industryLower = industry.toLowerCase();
    
    if (industryLower.includes('tech') || industryLower.includes('saas')) {
        return 'clean geometric abstraction, dynamic shapes suggesting progress, or modern minimalist forms';
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
        elegant: 'sophisticated graceful design with flowing curves',
        vintage: 'nostalgic retro design with heritage aesthetics',
        organic: 'natural flowing design with earth-inspired shapes'
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
        triangle: 'triangular composition with dynamic directional flow',
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

// Helper to make a generation attempt
async function makeGenerationAttempt(promptText: string, textToImageModel: string, logoType: string) {
    const isImagen = isImagenModel(textToImageModel);
    if (isImagen) {
        return _generateLogoWithImagen({
            model: textToImageModel,
            prompt: promptText,
            logoType: logoType
        });
    } else {
        const { media } = await ai.generate({
            model: textToImageModel,
            prompt: promptText,
            config: {
                responseModalities: ['IMAGE'],  // Only image output needed for logos
                imageConfig: {
                    aspectRatio: "1:1"  // Logos are square format
                }
            },
        });
        return media?.url;
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
        let logoDataUri = await makeGenerationAttempt(promptText, textToImageModel, input.logoType || 'logomark');

        // If the first attempt fails, try a simplified prompt as a fallback
        if (!logoDataUri || !logoDataUri.startsWith('data:')) {
            console.warn("[Logo Gen] First attempt failed or returned invalid data. Retrying with a simplified prompt...");
            
            const simplifiedPrompt = `A simple, clean logo for "${input.brandName}". Style: ${input.logoStyle || 'modern'}. Colors: ${input.logoColors || 'blue and silver'}. No text.`;
            
            logoDataUri = await makeGenerationAttempt(simplifiedPrompt, textToImageModel, input.logoType || 'logomark');

            if (!logoDataUri || !logoDataUri.startsWith('data:')) {
                console.error('Logo generation failed on both attempts. Last response:', logoDataUri);
                throw new Error('AI failed to generate a valid logo image after multiple attempts. Please try rephrasing your description.');
            }
        }
        
        // Compress the image if it's too large
        const compressedDataUri = compressDataUriServer(logoDataUri, 800 * 1024); // 800KB limit
        console.log(`[Logo Gen] Final image compression: Original ${logoDataUri.length} bytes, Final ${compressedDataUri.length} bytes`);
        
        return { logoDataUri: compressedDataUri };

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
