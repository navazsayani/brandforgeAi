
'use server';
/**
 * @fileOverview An AI agent that enhances a user's image refinement prompt.
 *
 * - enhanceRefinePrompt - A function that handles the prompt enhancement.
 * - EnhanceRefinePromptInput - The input type for the function.
 * - EnhanceRefinePromptOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getModelConfig } from '@/lib/model-config';

export const EnhanceRefinePromptInputSchema = z.object({
  instruction: z.string().min(3, { message: "Instruction must be at least 3 characters." }).describe('The user-provided simple instruction to be enhanced.'),
});
export type EnhanceRefinePromptInput = z.infer<typeof EnhanceRefinePromptInputSchema>;

export const EnhanceRefinePromptOutputSchema = z.object({
  enhancedInstruction: z.string().describe('The AI-enhanced, more detailed instruction for the image editing model.'),
});
export type EnhanceRefinePromptOutput = z.infer<typeof EnhanceRefinePromptOutputSchema>;

export async function enhanceRefinePrompt(input: EnhanceRefinePromptInput): Promise<EnhanceRefinePromptOutput> {
  return enhanceRefinePromptFlow(input);
}

const enhanceRefinePromptGenkit = ai.definePrompt({
  name: 'enhanceRefinePrompt',
  input: {schema: EnhanceRefinePromptInputSchema},
  output: {schema: EnhanceRefinePromptOutputSchema},
  prompt: `You are an expert prompt engineer specializing in image generation models. Your task is to take a user's simple instruction for editing an image and expand it into a more detailed, effective prompt for an AI image editor.

Original Instruction:
"{{{instruction}}}"

Instructions:
1.  Rewrite the instruction to be more descriptive and clear for an AI model.
2.  Specify visual details. For example, if the user says "make it darker", you might say "Decrease the overall brightness of the image to create a moodier, evening atmosphere while preserving the details in the shadows."
3.  Do not add any new elements that the user did not ask for. Only expand on the user's original request.
4.  The output should be a single, concise instruction.

Produce only the enhanced instruction text.
`,
});

const enhanceRefinePromptFlow = ai.defineFlow(
  {
    name: 'enhanceRefinePromptFlow',
    inputSchema: EnhanceRefinePromptInputSchema,
    outputSchema: EnhanceRefinePromptOutputSchema,
  },
  async (input) => {
    const { fastModel } = await getModelConfig();

    const {output} = await enhanceRefinePromptGenkit(input, { model: fastModel });

    if (!output) {
      throw new Error("AI failed to generate an enhanced refinement prompt.");
    }
    return output;
  }
);
