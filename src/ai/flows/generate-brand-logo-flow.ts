
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

const GenerateBrandLogoInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  industry: z.string().optional().describe('The industry of the brand (e.g., Fashion, Technology).'),
  targetKeywords: z.string().optional().describe('Comma-separated list of target keywords for the brand.'),
  logoShape: z.enum(['circle', 'square', 'shield', 'hexagon', 'diamond', 'custom']).optional().describe('Preferred logo shape/form factor.'),
  logoStyle: z.enum(['minimalist', 'modern', 'classic', 'playful', 'bold', 'elegant']).optional().describe('Preferred logo style aesthetic.'),
});
export type GenerateBrandLogoInput = z.infer<typeof GenerateBrandLogoInputSchema>;

const GenerateBrandLogoOutputSchema = z.object({
  logoDataUri: z.string().describe('The generated logo image as a data URI.'),
});
export type GenerateBrandLogoOutput = z.infer<typeof GenerateBrandLogoOutputSchema>;

export async function generateBrandLogo(
  input: GenerateBrandLogoInput
): Promise<GenerateBrandLogoOutput> {
  return generateBrandLogoFlow(input);
}

const generateLogoPromptText = (input: GenerateBrandLogoInput): string => {
  const { brandName, brandDescription, industry, targetKeywords, logoShape = 'circle', logoStyle = 'modern' } = input;
  
  // Simplified, brand-focused prompt that prioritizes relevance
  let prompt = `Create a professional logo for "${brandName}".

BRAND ESSENCE:
${brandDescription}
${industry && industry !== '_none_' ? `Industry: ${industry}` : ''}
${targetKeywords ? `Key themes: ${targetKeywords}` : ''}

DESIGN SPECIFICATIONS:
- Professional quality suitable for business use
- Clean, memorable, and directly related to "${brandName}" and its business
- Vector-style graphic on white background
- Maximum 3 colors with good contrast

${getShapeGuidance(logoShape)}

${getStyleGuidance(logoStyle)}

${industry && industry !== '_none_' ? getSimpleIndustryGuidance(industry) : ''}

CRITICAL REQUIREMENTS:
1. The logo MUST clearly represent "${brandName}" and reflect its business/industry
2. Focus on creating a design that someone would immediately associate with "${brandName}"
3. Avoid generic symbols - make it specific to this brand's identity
4. The design should be professional and memorable

Create a logo that clearly represents "${brandName}" and its business purpose.`;

  return prompt;
};

// Simplified style guidance
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

// Simplified industry guidance
function getSimpleIndustryGuidance(industry: string): string {
  const industryLower = industry.toLowerCase();
  
  if (industryLower.includes('tech') || industryLower.includes('saas')) {
    return 'INDUSTRY CONTEXT: Technology/Software - Consider clean geometric shapes, connectivity concepts, or innovation symbols.';
  } else if (industryLower.includes('health') || industryLower.includes('wellness')) {
    return 'INDUSTRY CONTEXT: Health/Wellness - Consider balance, vitality, care, or growth concepts.';
  } else if (industryLower.includes('food') || industryLower.includes('beverage')) {
    return 'INDUSTRY CONTEXT: Food/Beverage - Consider freshness, quality, nourishment, or culinary concepts.';
  } else if (industryLower.includes('finance') || industryLower.includes('fintech')) {
    return 'INDUSTRY CONTEXT: Finance - Consider trust, security, growth, or stability concepts.';
  } else if (industryLower.includes('education')) {
    return 'INDUSTRY CONTEXT: Education - Consider growth, knowledge, development, or learning concepts.';
  } else if (industryLower.includes('fashion') || industryLower.includes('apparel')) {
    return 'INDUSTRY CONTEXT: Fashion/Apparel - Consider style, elegance, craftsmanship, or personal expression.';
  } else if (industryLower.includes('real estate')) {
    return 'INDUSTRY CONTEXT: Real Estate - Consider homes, community, stability, or investment concepts.';
  }
  
  return `INDUSTRY CONTEXT: ${industry} - Consider concepts relevant to this industry.`;
}

// Get shape-specific guidance
function getShapeGuidance(shape: string): string {
  const shapeGuidance = {
    circle: 'SHAPE: Design to fit within a circular boundary - the logo should work well in a round frame.',
    square: 'SHAPE: Design to fit within a square/rectangular boundary - the logo should work well in a square frame.',
    shield: 'SHAPE: Design to fit within a shield-shaped boundary - the logo should work well in a shield-like frame.',
    hexagon: 'SHAPE: Design to fit within a hexagonal boundary - the logo should work well in a hexagon frame.',
    diamond: 'SHAPE: Design to fit within a diamond/rhombus boundary - the logo should work well in a diamond frame.',
    custom: 'SHAPE: Create a unique, organic shape that perfectly fits the brand identity - break free from standard geometric boundaries while maintaining professional appeal. The logo itself can define its own optimal shape.'
  };
  return shapeGuidance[shape as keyof typeof shapeGuidance] || shapeGuidance.circle;
}


const generateBrandLogoFlow = ai.defineFlow(
  {
    name: 'generateBrandLogoFlow',
    inputSchema: GenerateBrandLogoInputSchema,
    outputSchema: GenerateBrandLogoOutputSchema,
  },
  async (input) => {
    const promptText = generateLogoPromptText(input);
    console.log("Attempting logo generation with prompt:", promptText);

    const { imageGenerationModel } = await getModelConfig();

    try {
      const {media} = await ai.generate({
        model: imageGenerationModel,
        prompt: promptText,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          // safetySettings removed as per request
        },
      });

      if (!media || !media.url || !media.url.startsWith('data:')) {
        console.error('AI logo generation failed or returned invalid data URI. Response media:', JSON.stringify(media, null, 2));
        throw new Error('AI failed to generate a valid logo image or the format was unexpected.');
      }
      return { logoDataUri: media.url };
    } catch (error: any) {
      console.error("Error during ai.generate call for logo:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw new Error(`Error during logo generation API call: ${error.message || 'Unknown error from ai.generate()'}`);
    }
  }
);
