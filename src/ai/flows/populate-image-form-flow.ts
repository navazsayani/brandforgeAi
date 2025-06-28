
'use server';
/**
 * @fileOverview An AI agent that populates the image generation form from a single user request.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getModelConfig } from '@/lib/model-config';
import { imageStylePresets, generalAspectRatios } from '@/lib/constants';

// Create a list of values from the constants for the prompt
const validStylePresets = imageStylePresets.map(p => p.value).join(', ');
const validAspectRatios = generalAspectRatios.map(r => r.value).join(', ');

const PopulateImageFormInputSchema = z.object({
  userRequest: z.string().min(10, { message: "Please describe what you want to create in at least 10 characters." }).describe('A user\'s natural language request for an image.'),
  currentBrandDescription: z.string().optional().describe('The user\'s existing brand description for context.'),
});
export type PopulateImageFormInput = z.infer<typeof PopulateImageFormInputSchema>;

const PopulateImageFormOutputSchema = z.object({
  refinedBrandDescription: z.string().describe("A refined, concise brand/image description suitable for the image generation prompt, based on the user's request and original brand description."),
  imageStylePreset: z.enum(imageStylePresets.map(p => p.value) as [string, ...string[]]).describe('The most suitable image style preset from the provided list.'),
  customStyleNotes: z.string().optional().describe("Additional specific style notes extracted from the user's request (e.g., 'dramatic lighting', 'a touch of gold')."),
  negativePrompt: z.string().optional().describe("A comma-separated list of elements to avoid in the image, based on common best practices and the user's request (e.g., 'blurry, text, watermark')."),
  aspectRatio: z.enum(generalAspectRatios.map(r => r.value) as [string, ...string[]]).describe('The most suitable aspect ratio from the provided list for the intended use case (e.g., social media post).'),
});
export type PopulateImageFormOutput = z.infer<typeof PopulateImageFormOutputSchema>;

export async function populateImageForm(input: PopulateImageFormInput): Promise<PopulateImageFormOutput> {
  return populateImageFormFlow(input);
}

const populateImageFormPrompt = ai.definePrompt({
    name: 'populateImageFormPrompt',
    input: { schema: PopulateImageFormInputSchema },
    output: { schema: PopulateImageFormOutputSchema },
    prompt: `You are an expert creative director and prompt engineer. Your task is to interpret a user's request for an image and populate a detailed image generation form.

User's Request:
"{{{userRequest}}}"

Current Brand Description (for context, may be empty):
"{{{currentBrandDescription}}}"

Based on the user's request, fill out the following fields.

1.  **refinedBrandDescription**: Synthesize the user's request and their current brand description into a single, effective description for the image generation model. This should be a concise paragraph capturing the essence of the desired image.

2.  **imageStylePreset**: Choose the *single best* style preset from the following list that matches the user's request.
    Valid presets: ${validStylePresets}

3.  **customStyleNotes**: Extract any specific, additional stylistic details from the user's request that aren't covered by the main preset. Examples: 'with a vintage filter', 'neon glow', 'close-up shot'. If none, leave empty.

4.  **negativePrompt**: Suggest a few comma-separated terms to exclude, based on best practices and the request. Default to 'text, blurry, watermark, bad anatomy' if no other negatives are implied.

5.  **aspectRatio**: Select the most appropriate aspect ratio from the list below, inferring the intended use if possible (e.g., "instagram post" implies square or portrait). Default to 1:1 if unsure.
    Valid aspect ratios: ${validAspectRatios}
`
});

const populateImageFormFlow = ai.defineFlow(
  {
    name: 'populateImageFormFlow',
    inputSchema: PopulateImageFormInputSchema,
    outputSchema: PopulateImageFormOutputSchema,
  },
  async (input) => {
    const { fastModel } = await getModelConfig();
    const { output } = await populateImageFormPrompt(input, { model: fastModel });
    if (!output) {
      throw new Error("AI failed to process the request and populate the form fields.");
    }
    return output;
  }
);
