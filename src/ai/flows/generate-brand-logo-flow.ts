
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
  let prompt = `
**Task: Generate a professional and modern brand logo.**

**Brand Information:**
- **Brand Name:** "${input.brandName}"
- **Brand Description:** "${input.brandDescription}"
{{#if industry}}
- **Industry:** "{{industry}}"
{{/if}}
{{#if targetKeywords}}
- **Keywords:** "{{targetKeywords}}"
{{/if}}

**Core Logo Requirements (MUST be followed):**
- **Style:** Create a **clean, modern, and minimalist** logo. It must be a **vector-style graphic**, suitable for high-resolution use and scaling.
- **Simplicity:** The design should be iconic and easily recognizable at a small size.
- **Background:** Generate the logo on a **plain white or transparent background**. This is critical.
- **Format:** The final output must be a single, square image containing only the logo. **Do NOT include any text, descriptions, or labels like "Logo Concept" in the image itself.**

**What to AVOID (Strictly):**
- **NO 3D rendering or complex gradients.**
- **NO photographic elements, shadows, or realistic textures.**
- **NO overly intricate or busy details.**

**Creative Direction & Concepts:**
- **Conceptual Link:** The logo should visually represent the brand's core essence. For example, if the brand is about "growth," consider abstract leaf or arrow shapes. If it's about "connectivity," think about nodes or links.
- **Typography:** If using a logotype (text-based), choose a modern, clean sans-serif font. Consider a unique monogram (e.g., using initials) if the brand name is long.
- **Color Palette:** Use a simple and professional color palette (2-3 colors maximum) that aligns with the brand's industry and description. Ensure high contrast for readability.
`;
  
  // Refined industry-specific hints
  if (input.industry?.toLowerCase().includes('fashion') || input.brandDescription.toLowerCase().includes('fashion')) {
    prompt += "\n- **Industry Hint (Fashion):** Lean towards elegance and sophistication. A stylish monogram, abstract mark, or a refined wordmark would be appropriate.";
  }
  if (input.industry?.toLowerCase().includes('technology') || input.brandDescription.toLowerCase().includes('technology')) {
    prompt += "\n- **Industry Hint (Technology):** Emphasize a sleek, modern, and precise feel. Geometric shapes, abstract representations of data, circuits, or connectivity are good starting points.";
  }
  if (input.industry?.toLowerCase().includes('food') || input.brandDescription.toLowerCase().includes('food')) {
    prompt += "\n- **Industry Hint (Food & Beverage):** Consider organic shapes, natural elements, or minimalist representations of food/drink items. The feeling should be fresh and appealing.";
  }
  if (input.industry?.toLowerCase().includes('health') || input.brandDescription.toLowerCase().includes('health')) {
    prompt += "\n- **Industry Hint (Health & Wellness):** Focus on clean lines, calming colors, and abstract symbols of balance, nature, or vitality (like a simple leaf, heart, or plus sign).";
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
