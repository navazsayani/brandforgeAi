
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
    .describe('A detailed description of the brand and its values. This will be used for subtle thematic influence on the new item.'),
  imageStyle: z
    .string()
    .describe(
      'A description of the desired artistic style for the generated images, e.g., "photorealistic", "minimalist", "vibrant", "professional", "impressionistic". This heavily influences the final look.'
    ),
  exampleImage: z
    .string()
    .describe(
      "An example image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This image primarily defines the *item category* and provides strong visual style cues."
    )
    .optional(),
  aspectRatio: z
    .string()
    .describe("The desired aspect ratio for the image, e.g., '1:1', '4:5', '16:9'.")
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

// This text-oriented prompt is conceptual for the flow's input/output schema but not directly used for the final image generation call.
const textGenerationOrientedPrompt = ai.definePrompt({
  name: 'generateImagesTextPrompt',
  input: {schema: GenerateImagesInputSchema},
  output: {schema: GenerateImagesOutputSchema},
  prompt: `You are an AI image generation expert and creative designer.
You will be asked to generate a *new image*.

If an exampleImage is provided:
1.  Identify the main *category* of the item in the exampleImage (e.g., 'a dress', 'a chair', 'a logo').
2.  The exampleImage is the *primary reference* for the visual style, colors, and overall aesthetic of the newly generated image.
3.  The 'Desired Image Style' input (e.g., "photorealistic") acts as a critical instruction for the rendering. Prioritize realism if "photorealistic" or similar terms are used.
4.  The 'Brand Description' input is the **primary driver** for the core design, theme, specific characteristics, and unique elements of the *new* item. It should provide substantial conceptual input. For example, if the item category from the example image is 'sneakers' and the brand description is 'eco-friendly, minimalist, inspired by forest textures,' you should generate new sneakers that embody these eco-friendly and minimalist forest-inspired themes, not just subtly tweak the example sneakers.
5.  Goal: A high-quality, visually appealing image of the *same type of item* as the example, but as a *new, distinct version or variation* that heavily incorporates the brand themes and is rendered in the specified 'Desired Image Style'. Ensure the image is suitable for social media like Instagram.

If no exampleImage is provided:
1.  The 'Brand Description' provides the *concept* for the image.
2.  The 'Desired Image Style' dictates the visual execution.
3.  Aim for realism if the style implies it, and ensure the image is suitable for social media.

Example Image (if provided): {{media url=exampleImage}}
Brand Description (for conceptual design of the new item): {{{brandDescription}}}
Desired Image Style (critical for rendering, e.g., "photorealistic"): {{{imageStyle}}}
Target Aspect Ratio (if provided): {{{aspectRatio}}}
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
      aspectRatio,
    } = input;

    const finalPromptParts: ({text: string} | {media: {url: string}})[] = [];
    let textPromptContent = "";

    if (exampleImage && exampleImage.startsWith('data:')) {
        finalPromptParts.push({ media: { url: exampleImage } });
        textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.

The provided example image (sent first) is a reference.
1.  Identify the main *category* of the item in the example image (e.g., 'a handbag', 'a t-shirt', 'a piece of furniture').
2.  The example image provides *strong visual style cues* (like color palette, general aesthetic mood).
3.  The "Desired Artistic Style" input is: "${imageStyle}". This is a critical instruction for the final rendering. If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic.
4.  The "Brand Description" is: "${brandDescription}". This description is the **primary driver** for the core design, theme, specific characteristics, and unique elements of the *new* item. It should provide substantial conceptual input. For instance, if the example is a 'minimalist white sneaker' and the brand is 'eco-friendly, nature-inspired, with subtle leaf motifs', you should generate new minimalist white sneakers that prominently feature these eco-friendly and nature-inspired themes, perhaps with visible leaf motifs or textures derived from nature.
5.  The final image must be of the *same type of item* as the example image but should appear as a *new, distinct version or variation*. It should be clearly different from the example image while still being recognizable as belonging to the same category, now heavily infused with brand-thematic elements.

Do NOT simply replicate the example image. Create a new iteration that looks realistic (if implied by the style) and compelling.
`.trim();
    } else { // No example image
        textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.
The image should be based on the following concept: "${brandDescription}".
The desired artistic style for this new image is: "${imageStyle}". If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic.
`.trim();
    }

    if (aspectRatio) {
      textPromptContent += ` Please generate this image with an aspect ratio of ${aspectRatio} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9).`;
    }
    
    finalPromptParts.push({ text: textPromptContent });


    if (!brandDescription || !imageStyle) {
        throw new Error("Brand description and image style are required for image generation.");
    }
    if (exampleImage && !exampleImage.startsWith('data:')) {
        throw new Error("Example image was provided but is not a valid data URI.");
    }

    console.log("Attempting image generation with prompt parts:", JSON.stringify(finalPromptParts, null, 2));

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: finalPromptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            // Consider 'BLOCK_NONE' for some categories during deep debugging if necessary, but be mindful of content.
        ],
      },
    });

    if (!media || !media.url) {
        console.error("AI image generation failed. Media object or URL is missing. Response media:", JSON.stringify(media, null, 2));
        throw new Error("AI failed to generate an image or returned an invalid image format. This might be due to safety filters, an issue with the generation service, or the prompt being too restrictive. Check server logs for more details.");
    }
    if (typeof media.url !== 'string' || !media.url.startsWith('data:')) {
        console.error("AI image generation failed. Media URL is not a valid data URI. Received URL:", media.url);
        throw new Error("AI returned an image, but its format (URL) is invalid. Expected a data URI.");
    }

    return {generatedImage: media.url};
  }
);
