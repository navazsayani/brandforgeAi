
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
  let prompt = `Generate a concept for a brand logo.
Brand Name: "${input.brandName}"
Brand Description: "${input.brandDescription}"
{{#if industry}}Industry: {{industry}}{{/if}}
{{#if targetKeywords}}Keywords: {{targetKeywords}}{{/if}}

The logo should be:
- Simple, clean, and modern.
- Memorable and iconic.
- Visually representative of the brand's essence as described.
- Suitable for use as a brand identity mark (e.g., on websites, social media, products).
- Preferably vector-like or easily convertible to a vector format. Avoid overly complex photographic details or textures that would not scale well.
- Focus on typography, abstract shapes, simple icons, or a combination thereof.
- If the brand name is short and distinctive, consider a logotype (text-based logo). If it's longer, an abstract mark or icon with the name might be better.
- Ensure high contrast and readability.
- The output should be a square image.
- Do not include any additional explanatory text, only the logo image.
`;
  if (input.industry?.toLowerCase().includes('fashion') || input.brandDescription.toLowerCase().includes('fashion')) {
    prompt += "\n- For fashion, consider elegance, style, and perhaps a unique monogram or abstract mark.";
  }
  if (input.industry?.toLowerCase().includes('technology') || input.brandDescription.toLowerCase().includes('technology')) {
    prompt += "\n- For technology, think modern, sleek, perhaps abstract representations of connectivity or innovation.";
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

    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
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


    

    