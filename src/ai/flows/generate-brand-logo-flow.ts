
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

function getSimpleIndustryGuidance(industry: string): string {
  const industryLower = industry.toLowerCase();
  if (industryLower.includes('tech') || industryLower.includes('saas')) return 'INDUSTRY CONTEXT: Technology/Software - Consider clean geometric shapes, connectivity, or innovation symbols.';
  if (industryLower.includes('health') || industryLower.includes('wellness')) return 'INDUSTRY CONTEXT: Health/Wellness - Consider balance, vitality, care, or growth concepts.';
  if (industryLower.includes('food') || industryLower.includes('beverage')) return 'INDUSTRY CONTEXT: Food/Beverage - Consider freshness, quality, nourishment, or culinary concepts.';
  if (industryLower.includes('finance') || industryLower.includes('fintech')) return 'INDUSTRY CONTEXT: Finance - Consider trust, security, growth, or stability concepts.';
  if (industryLower.includes('education')) return 'INDUSTRY CONTEXT: Education - Consider growth, knowledge, development, or learning concepts.';
  if (industryLower.includes('fashion') || industryLower.includes('apparel')) return 'INDUSTRY CONTEXT: Fashion/Apparel - Consider style, elegance, craftsmanship, or personal expression.';
  if (industryLower.includes('real estate')) return 'INDUSTRY CONTEXT: Real Estate - Consider homes, community, stability, or investment concepts.';
  return `INDUSTRY CONTEXT: ${industry} - Consider concepts relevant to this industry.`;
}

function getShapeGuidance(shape: string): string {
  const shapeGuidance = {
    circle: 'SHAPE: Design to fit within a circular boundary.',
    square: 'SHAPE: Design to fit within a square/rectangular boundary.',
    shield: 'SHAPE: Design to fit within a shield-shaped boundary.',
    hexagon: 'SHAPE: Design to fit within a hexagonal boundary.',
    diamond: 'SHAPE: Design to fit within a diamond/rhombus boundary.',
    custom: 'SHAPE: Create a unique, organic shape that perfectly fits the brand identity.'
  };
  return shapeGuidance[shape as keyof typeof shapeGuidance] || shapeGuidance.circle;
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


// Helper function for creating Gemini-optimized prompts
function _createGeminiLogoPrompt(input: GenerateBrandLogoInput): string {
    const { brandName, brandDescription, industry, targetKeywords, logoType, logoShape, logoStyle, logoColors, logoBackground } = input;
    
    const promptParts = [
        `You are a world-class branding expert and logo designer. Your task is to design a professional, unique, and memorable logo for the brand "${brandName}".`,
        `\n**//-- BRAND CONTEXT --//**`,
        `- **Brand Essence:** ${brandDescription}`,
        industry && industry !== '_none_' ? `- **Industry:** ${industry}` : '',
        targetKeywords ? `- **Key Themes:** ${targetKeywords}` : '',
        
        `\n**//-- DESIGN SPECIFICATIONS --//**`,
        getLogoTypeInstruction(logoType || 'logomark', brandName),
        getStyleGuidance(logoStyle || 'modern'),
        getShapeGuidance(logoShape || 'circle'),
        logoColors ? `- **Color Palette:** Strictly use a palette based on: ${logoColors}.` : '- **Color Palette:** Use a professional and appropriate color palette (max 3 colors).',
        `- **Background:** The logo MUST be on a ${logoBackground} background. For 'transparent', ensure there's no background color.`,
        `- **Quality:** Professional, vector-style graphic suitable for all business uses.`,
        
        industry && industry !== '_none_' ? getSimpleIndustryGuidance(industry) : '',

        `\n**//-- CRITICAL REQUIREMENTS --//**`,
        `1.  **Relevance:** The design must be deeply connected to the brand's identity, essence, and industry.`,
        `2.  **Simplicity & Memorability:** Avoid overly complex or cluttered designs. The logo must be easily recognizable.`,
        `3.  **Originality:** Generate a completely original and custom design. Avoid generic clip-art.`,
    ];
    
    return promptParts.filter(Boolean).join('\n');
}

// Helper function for creating Imagen-optimized prompts
function _createImagenLogoPrompt(input: GenerateBrandLogoInput): string {
    const { brandName, brandDescription, industry, targetKeywords, logoType, logoShape, logoStyle, logoColors, logoBackground } = input;
    
    let prompt = `Professional logo for "${brandName}". `;
    
    switch (logoType) {
        case 'logotype':
            prompt += `A stylized logotype (wordmark). `;
            break;
        case 'monogram':
            const initials = brandName.split(' ').map(n => n[0]).join('');
            prompt += `A creative monogram using the initials "${initials}". `;
            break;
        case 'logomark':
        default:
            prompt += `An iconic logomark (symbol). `;
    }

    prompt += `Style: ${logoStyle}, minimalist, clean vector graphic. `;
    
    if (logoColors) {
        prompt += `Color Palette: ${logoColors}. `;
    } else {
        prompt += `Professional color palette. `;
    }
    
    prompt += `Shape: ${logoShape}. `;
    prompt += `Background: ${logoBackground} background. `;
    prompt += `Brand Context: ${brandDescription}. ${industry && industry !== '_none_' ? `Industry: ${industry}.` : ''} ${targetKeywords ? `Keywords: ${targetKeywords}.` : ''}`;

    return prompt;
}

const generateBrandLogoFlow = ai.defineFlow(
  {
    name: 'generateBrandLogoFlow',
    inputSchema: GenerateBrandLogoInputSchema,
    outputSchema: GenerateBrandLogoOutputSchema,
  },
  async (input) => {
    const { textToImageModel } = await getModelConfig();
    const isImagen = textToImageModel.toLowerCase().includes('imagen');

    const promptText = isImagen
      ? _createImagenLogoPrompt(input)
      : _createGeminiLogoPrompt(input);
      
    console.log(`[Logo Gen] Using ${isImagen ? 'Imagen' : 'Gemini'} prompt for model: ${textToImageModel}`);
    console.log(`[Logo Gen] Prompt:`, promptText.substring(0, 500) + "...");

    try {
      const {media} = await ai.generate({
        model: textToImageModel,
        prompt: promptText,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media || !media.url || !media.url.startsWith('data:')) {
        console.error('AI logo generation failed or returned invalid data URI. Response media:', JSON.stringify(media, null, 2));
        throw new Error('AI failed to generate a valid logo image or the format was unexpected.');
      }
      return { logoDataUri: media.url };
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
