'use server';
/**
 * @fileOverview An AI agent that generates a brand logo for the BrandForge AI application itself.
 *
 * - generateBrandForgeAppLogo - A function that handles the logo generation process.
 * - GenerateBrandForgeAppLogoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getModelConfig } from '@/lib/model-config';

const GenerateBrandForgeAppLogoOutputSchema = z.object({
  logoDataUri: z.string().describe('The generated logo image for BrandForge AI as a data URI.'),
});
export type GenerateBrandForgeAppLogoOutput = z.infer<typeof GenerateBrandForgeAppLogoOutputSchema>;

export async function generateBrandForgeAppLogo(): Promise<GenerateBrandForgeAppLogoOutput> {
  return generateBrandForgeAppLogoFlow();
}

const generateBrandForgeAppLogoFlow = ai.defineFlow(
  {
    name: 'generateBrandForgeAppLogoFlow',
    outputSchema: GenerateBrandForgeAppLogoOutputSchema,
  },
  async () => {
    const brandName = "BrandForge AI";
    const brandDescription = "A cutting-edge AI-powered application designed to help businesses and creators forge strong brand identities. BrandForge AI offers tools for logo generation, content creation (social media, blogs), marketing campaign strategy, and visual asset generation. It emphasizes modern aesthetics, intelligent automation, and streamlined workflows, making professional branding accessible and efficient.";
    const industry = "AI Software, Marketing Technology";

    const promptText = `
Generate a sophisticated and **modern, chic, and minimalist** brand logo concept for "${brandName}".
Brand Description: "${brandDescription}"
Industry: "${industry}"

The logo MUST be:
- **Minimalist & Clean:** Extremely simple, avoiding clutter. Focus on essential, iconic forms. Effective use of negative space is highly encouraged.
- **Modern & Sleek:** Contemporary feel, sharp lines, possibly geometric or elegantly fluid shapes. Avoid anything ornate or overly detailed.
- **Chic & Elegant:** Sophisticated and refined. It should feel premium and intelligent.
- **Abstract or Stylized Logomark/Logotype:** Do NOT create an illustrative logo. It should be an abstract mark, a stylized monogram (e.g., "BF", "B"), or a very clean, modern logotype.
- **Conceptually Relevant (Subtly):** Subtly hint at "AI" (e.g., clean neural pathway, a spark of intelligence, interconnected nodes) and "forge" (e.g., a strong, foundational shape, a spark of creation). These elements should be abstract and integrated seamlessly, not literal.
- **Color Palette:** Strongly prefer a color palette based on Deep Teal as a primary or strong accent, with Soft Gold as a secondary accent. Dark grays or off-whites should be used for neutrality and background if not transparent.
- **Vector-like Quality:** The design should be easily convertible to a vector format. Avoid photographic textures, complex gradients, or elements that do not scale well.
- **High Contrast & Readability:** Ensure the logo is clear and impactful, even at small sizes.
- **Square Image Output:** The final image must be square.
- **No Explanatory Text:** Output ONLY the logo graphic itself on a transparent or simple, solid background that allows easy removal. Do NOT include any text labels like "Logo Concept" or descriptions with the image.

Example direction: Think of a sleek, abstract 'B' that subtly incorporates a spark or a clean, geometric network pattern. Or, a very minimalist abstract shape that evokes both a forge's strength and AI's precision.
`;

    console.log("Attempting BrandForge AI app logo generation with REFINED prompt:", promptText);
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
        console.error('BrandForge AI app logo generation failed or returned invalid data URI. Response media:', JSON.stringify(media, null, 2));
        throw new Error('AI failed to generate a valid logo image for BrandForge AI or the format was unexpected.');
      }
      return { logoDataUri: media.url };
    } catch (error: any) {
      console.error("Error during ai.generate call for BrandForge AI app logo:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw new Error(`Error during BrandForge AI app logo generation API call: ${error.message || 'Unknown error from ai.generate()'}`);
    }
  }
);