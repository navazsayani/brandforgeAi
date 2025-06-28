
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
  // Base prompt with stricter guidelines
  let prompt = `
**Objective: Generate a versatile, professional, and modern brand logo.**

**Brand Information:**
- **Brand Name:** "${input.brandName}"
- **Brand Description:** "${input.brandDescription}"
- **Industry:** "${input.industry || 'General'}"
- **Keywords:** "${input.targetKeywords || 'N/A'}"

**CRITICAL LOGO REQUIREMENTS (MUST be strictly followed):**
1.  **Style:** A **clean, modern, minimalist, and flat vector-style graphic**. The design must be iconic and memorable. It should be suitable for high-resolution use, scaling, and app icons.
2.  **Background:** Generate ONLY the logo on a **plain white background**. This is non-negotiable. A transparent background is also acceptable if possible.
3.  **Content:** The output image must be a single, square image containing ONLY the logo graphic. **Absolutely NO extra text**, labels like "Logo Concept", or descriptions should be part of the image itself.
4.  **Simplicity:** The design must be simple enough to be easily recognizable even at a very small size. Avoid clutter.

**STRICT AVOIDANCE LIST (DO NOT include these elements):**
- **NO 3D rendering**, complex gradients, bevels, or embossing.
- **NO photographic elements**, shadows, realistic textures, or lighting effects.
- **NO overly intricate, busy, or complex details** that would be lost at small sizes.
- **NO literal or clichéd representations** of the industry (e.g., no dollar signs for finance, no shopping carts for e-commerce). Think abstractly and conceptually.

**Creative & Conceptual Direction:**
- **Abstract Representation:** The logo should visually symbolize the brand's core essence, values, or offerings in an abstract manner.
- **Typography (if used):** If creating a logotype or a mark that includes text, use a modern, clean, geometric, or professional sans-serif font. Consider a unique monogram (e.g., using initials) if the brand name is long. The text must be perfectly legible.
- **Color Palette:** Use a simple and professional color palette (2-3 colors maximum is ideal) that aligns with the brand's industry and description. Ensure high contrast for readability.
`;

  // --- Industry-Specific Conceptual Refinements ---
  const industry = input.industry?.toLowerCase() || '';

  if (industry.includes('tech') || industry.includes('saas')) {
      prompt += `
- **Industry Refinement (Technology & SaaS):** Focus on concepts of **efficiency, connectivity, intelligence, and data flow**. AVOID literal circuits, computer chips, or mouse pointers. Think abstractly about interconnected nodes, a subtle spark of intelligence, geometric forms suggesting structure or platforms, or an elegant monogram that feels modern and precise.`;
  } else if (industry.includes('fashion') || industry.includes('apparel')) {
      prompt += `
- **Industry Refinement (Fashion & Apparel):** Emphasize **elegance, style, and craftsmanship**. AVOID literal clothing items like a t-shirt or dress. Consider a stylish and unique monogram, an abstract mark that evokes fabric flow or a sophisticated stitch pattern, or a refined, high-end wordmark.`;
  } else if (industry.includes('beauty') || industry.includes('cosmetic')) {
      prompt += `
- **Industry Refinement (Beauty & Cosmetics):** Convey **freshness, nature, and science**. AVOID literal makeup items like lipstick tubes. Think about abstract organic shapes, a stylized leaf or petal, a minimalist water drop, or clean, scientific-looking geometric forms.`;
  } else if (industry.includes('food') || industry.includes('beverage')) {
      prompt += `
- **Industry Refinement (Food & Beverage):** Focus on **freshness, community, and quality**. AVOID generic forks and spoons. Consider minimalist and abstract representations of natural ingredients (e.g., a stylized leaf, grain, or fruit), or a shape that evokes a communal table or a plate.`;
  } else if (industry.includes('health') || industry.includes('wellness')) {
      prompt += `
- **Industry Refinement (Health & Wellness):** Emphasize **balance, vitality, and calm**. AVOID overly complex human figures. Focus on clean lines, calming colors, and abstract symbols of balance (e.g., stacked stones), nature (a simple leaf), vitality (a subtle pulse or spark), or care (abstracted heart or plus sign).`;
  } else if (industry.includes('travel') || industry.includes('hospitality')) {
      prompt += `
- **Industry Refinement (Travel & Hospitality):** Suggest **adventure, direction, and comfort**. AVOID generic airplanes or suitcases. Think about abstract compass lines, a stylized map pointer, a simple wave or sun, or an icon that combines a location pin with another element like a leaf or bed.`;
  } else if (industry.includes('commerce') || industry.includes('retail')) {
      prompt += `
- **Industry Refinement (E-commerce & Retail):** Focus on **speed, connection, and discovery**. AVOID literal shopping carts. Consider an abstract arrow indicating movement or delivery, an iconic, stylized representation of a package or gift box, or interlocking shapes representing connection between buyer and seller.`;
  } else if (industry.includes('education')) {
      prompt += `
- **Industry Refinement (Education):** Convey **growth, knowledge, and pathways**. AVOID literal graduation caps. Think about an abstract open book, a stylized tree of knowledge, overlapping shapes representing learning blocks, or an upward-pointing arrow forming part of an initial.`;
  } else if (industry.includes('finance') || industry.includes('fintech')) {
      prompt += `
- **Industry Refinement (Finance & Fintech):** Emphasize **trust, growth, and security**. AVOID literal dollar signs or money bags. Consider an abstract upward-trending graph, a modern and secure shield or lock shape, or stylized geometric shapes representing blocks or a distributed ledger.`;
  } else if (industry.includes('real estate')) {
      prompt += `
- **Industry Refinement (Real Estate):** Suggest **shelter, community, and property**. AVOID overly detailed house illustrations. Focus on a minimalist roofline, an abstract key shape, interlocking geometric forms representing community or plots of land, or a combination of a location pin and a house outline.`;
  } else if (industry.includes('arts') || industry.includes('entertainment')) {
      prompt += `
- **Industry Refinement (Arts & Entertainment):** Convey **creativity, sound, and vision**. Consider an abstract soundwave, a stylized spotlight, minimalist filmstrip geometry, or a play button integrated into a letterform.`;
  } else if (industry.includes('automotive')) {
      prompt += `
- **Industry Refinement (Automotive):** Focus on **speed, precision, and mechanics**. Think about abstract motion lines, a stylized representation of a road or a wheel, or a geometric shape that feels engineered and precise, like a modern shield or emblem.`;
  } else if (industry.includes('non-profit') || industry.includes('nonprofit')) {
      prompt += `
- **Industry Refinement (Non-profit):** Emphasize **community, help, and growth**. Think about abstract shapes of helping hands, a growing plant or sprout, interlocking circles representing community, or a simple heart integrated into the design.`;
  }

  return prompt;
};


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
