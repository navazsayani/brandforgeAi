
'use server';
/**
 * @fileOverview An AI agent that generates a brand logo for the BrandForge AI application itself.
 *
 * - generateBrandForgeAppLogo - A function that handles the logo generation process.
 * - GenerateBrandForgeAppLogoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
Generate a concept for a brand logo for "${brandName}".
Brand Description: "${brandDescription}"
Industry: "${industry}"

The logo should be:
- Simple, clean, and modern.
- Memorable and iconic.
- Visually representative of the brand's essence: AI, creation (forge), branding, intelligence, automation, sleekness.
- Suitable for use as a brand identity mark on websites, social media, and within the app.
- Preferably vector-like or easily convertible to a vector format. Avoid overly complex photographic details or textures that would not scale well.
- Focus on typography (perhaps a stylized "BF" or "B"), abstract shapes, or simple icons that subtly suggest a forge, a spark, or a neural network element.
- Consider using the color palette: Deep Teal as a primary or strong accent, with Gold as a secondary accent, and dark grays/off-whites for neutrality.
- Ensure high contrast and readability.
- The output should be a square image.
- Do NOT include any additional explanatory text or background, only the logo graphic itself on a transparent or simple background if possible, otherwise a solid background that allows easy removal.
- For technology, think modern, sleek, perhaps abstract representations of connectivity or innovation. Emphasize the 'forge' aspect -- creation and building.
`;

    console.log("Attempting BrandForge AI app logo generation with prompt:", promptText);

    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation', // Consistent with existing logo flow
        prompt: promptText,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
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
