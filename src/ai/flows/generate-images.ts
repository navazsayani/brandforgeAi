
'use server';

/**
 * @fileOverview Generates images based on the extracted brand data for social media posting.
 *
 * - generateImages - A function that handles the image generation process.
 * - GenerateImagesInput - The input type for the generateImages function.
 * - GenerateImagesOutput - The return type for the generateImages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImagesInputSchema = z.object({
  brandDescription: z
    .string()
    .describe('A detailed description of the brand and its values. This will guide the design of the new item.'),
  imageStyle: z
    .string()
    .describe(
      'A description of the desired artistic style for the generated images, e.g., minimalist, vibrant, professional, photorealistic, impressionistic.'
    ),
  exampleImage: z
    .string()
    .describe(
      "An example image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image helps identify the *category* of item to be redesigned and can offer subtle style cues."
    )
    .optional(),
});
export type GenerateImagesInput = z.infer<typeof GenerateImagesInputSchema>;

const GenerateImagesOutputSchema = z.object({
  generatedImage: z
    .string()
    .describe(
      "A generated image as a data URI that includes a MIME type and uses Base64 encoding. The format will be: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImagesOutput = z.infer<typeof GenerateImagesOutputSchema>;

export async function generateImages(input: GenerateImagesInput): Promise<GenerateImagesOutput> {
  return generateImagesFlow(input);
}

// This prompt definition is for the ai.definePrompt object, which is not directly used
// for the image generation in this flow, but kept for conceptual consistency.
const textGenerationOrientedPrompt = ai.definePrompt({
  name: 'generateImagesTextPrompt',
  input: {schema: GenerateImagesInputSchema},
  output: {schema: GenerateImagesOutputSchema},
  prompt: `You are an AI image generation expert and creative designer.
You will be asked to generate a *new image*.

{{#if exampleImage}}
  An example image is provided. First, identify the main *category* of the item in the example image (e.g., 'a dress', 'a chair', 'a logo', 'a handbag').
  Your task is to generate a *new item* belonging to this *same category*.
  The *design* (color, pattern, shape, specific features, overall aesthetic) of this new item MUST be primarily derived from the 'Brand Description' and 'Desired Image Style' provided below. The brand description should be the main source of inspiration for the new item's theme, specific characteristics, and any unique elements it should possess.
  The example image should be used to understand the *type* of item to create. You may also take very subtle, high-level stylistic cues (like overall complexity or general aesthetic feel, if they align with the new design direction), but DO NOT replicate its specific design elements. The goal is a fresh interpretation and a new design deeply rooted in the brand's identity.

  Example Image (use this to identify item category): {{media url=exampleImage}}
  Brand Description (for the new item's core design, theme, and features): {{{brandDescription}}}
  Desired Image Style (for the new item's visual presentation and artistic rendering): {{{imageStyle}}}

  Ensure the newly generated image is a *distinct, original design* of the same item category as the example, but reimagined according to the brand description and desired image style. For instance, if the example is a bright, casual t-shirt and the brand description is "elegant, formal evening wear with celestial motifs", you should generate an elegant, formal t-shirt design incorporating celestial motifs, not a casual one.
{{else}}
  Generate a new image based on the following:
  Brand Description (for new image content and theme): {{{brandDescription}}}
  Desired Image Style (for new image aesthetics): {{{imageStyle}}}
{{/if}}
`,
});

const generateImagesFlow = ai.defineFlow(
  {
    name: 'generateImagesFlow',
    inputSchema: GenerateImagesInputSchema,
    outputSchema: GenerateImagesOutputSchema,
  },
  async (input) => {
    const {
      brandDescription,
      imageStyle,
      exampleImage,
    } = input;

    const finalPromptParts: ({text: string} | {media: {url: string}})[] = [];

    if (exampleImage && exampleImage.startsWith('data:')) {
        // Add the example image first in the parts array for the model to reference
        finalPromptParts.push({ media: { url: exampleImage } });

        // Construct the detailed text prompt
        const textForImageContextPrompt = `
Analyze the provided example image (sent first) to understand the main category of the item depicted (e.g., 'a dress', 'a handbag', 'a piece of furniture', 'a logo').

Your primary task is to generate a *new and unique item* belonging to that *same category*. This new item's design, aesthetics, and features should be predominantly inspired by the following 'Brand Description' and 'Desired Artistic Style'.

**Brand Description (this is the *primary driver* for the core design, theme, specific characteristics, and unique elements of the *new* item): "${brandDescription}"**
Desired Artistic Style (this guides the visual rendering, mood, and artistic approach for the *new* item): "${imageStyle}"

The example image serves these main purposes:
1.  To clearly identify the *category* of the item you need to create and redesign (e.g., if the example shows a dress, you will design a new dress).
2.  It may offer very subtle, high-level stylistic cues (like overall complexity, or a general aesthetic direction) ONLY IF they align with and enhance the new design direction set by the Brand Description and Desired Artistic Style.

However, you MUST NOT:
- Replicate the specific design, color, pattern, shape, or any distinct visual details of the item in the example image.
- Create a minor variation of the item in the example image. Your output must be a significantly different design.

The generated image should showcase a *fresh, original design* for an item of the same category, reflecting the new brand (as per Brand Description) and desired style.
For example, if the example image is a red, ornate, traditional evening gown, and the Brand Description is "minimalist, sustainable, futuristic, everyday wear with subtle geometric patterns" and Desired Artistic Style is "clean, vector art", you should generate a minimalist, futuristic everyday dress incorporating subtle geometric patterns, rendered in a clean vector art style. It should NOT be another red, ornate gown or a slight variation of it.
Your goal is to create a *new design* for the *same type of object* shown in the example, deeply infused with the concepts from the Brand Description.
`.trim();
        finalPromptParts.push({ text: textForImageContextPrompt });

    } else { // No example image, so a simpler prompt
        const textOnlyPrompt = `Generate a *new and unique* image primarily based on the following brand description: "${brandDescription}". The desired artistic style for this new image is: "${imageStyle}".`;
        finalPromptParts.push({ text: textOnlyPrompt });
    }

    if (!brandDescription || !imageStyle) {
        throw new Error("Brand description and image style are required for image generation.");
    }
    if (exampleImage && !exampleImage.startsWith('data:')) {
        throw new Error("Example image was provided but is not a valid data URI.");
    }


    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: This specific model is for image generation
      prompt: finalPromptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Must include IMAGE
      },
    });

    if (!media || !media.url) {
        throw new Error("AI failed to generate an image or returned an invalid image format.");
    }

    return {generatedImage: media.url};
  }
);

