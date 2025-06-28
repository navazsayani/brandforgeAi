
'use server';
/**
 * @fileOverview An AI agent that enhances a brand description.
 *
 * - enhanceBrandDescription - A function that handles the brand description enhancement process.
 * - EnhanceBrandDescriptionInput - The input type for the enhanceBrandDescription function.
 * - EnhanceBrandDescriptionOutput - The return type for the enhanceBrandDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getModelConfig } from '@/lib/model-config';

const EnhanceBrandDescriptionInputSchema = z.object({
  brandDescription: z.string().min(10, { message: "Brand description must be at least 10 characters." }).describe('The user-provided brand description to be enhanced.'),
});
export type EnhanceBrandDescriptionInput = z.infer<typeof EnhanceBrandDescriptionInputSchema>;

const EnhanceBrandDescriptionOutputSchema = z.object({
  enhancedDescription: z.string().describe('The AI-enhanced, compelling brand description.'),
});
export type EnhanceBrandDescriptionOutput = z.infer<typeof EnhanceBrandDescriptionOutputSchema>;

export async function enhanceBrandDescription(input: EnhanceBrandDescriptionInput): Promise<EnhanceBrandDescriptionOutput> {
  return enhanceBrandDescriptionFlow(input);
}

const enhanceBrandDescriptionPrompt = ai.definePrompt({
  name: 'enhanceBrandDescriptionPrompt',
  input: {schema: EnhanceBrandDescriptionInputSchema},
  output: {schema: EnhanceBrandDescriptionOutputSchema},
  prompt: `You are an expert brand strategist and copywriter. Your task is to take the following brand description and enhance it.

Original Description:
"{{{brandDescription}}}"

Instructions:
1.  Rewrite the description to be more compelling, clear, and engaging.
2.  Focus on capturing the brand's essence, value proposition, and target audience if discernible.
3.  The final output should be a single, cohesive paragraph of 2-4 sentences.
4.  Maintain a professional but approachable tone. Do not use placeholders like "[Brand Name]".

Produce only the enhanced description text.
`,
});

const enhanceBrandDescriptionFlow = ai.defineFlow(
  {
    name: 'enhanceBrandDescriptionFlow',
    inputSchema: EnhanceBrandDescriptionInputSchema,
    outputSchema: EnhanceBrandDescriptionOutputSchema,
  },
  async (input) => {
    const { fastModel } = await getModelConfig();

    const {output} = await enhanceBrandDescriptionPrompt(input, { model: fastModel });

    if (!output) {
      throw new Error("AI failed to generate an enhanced description.");
    }
    return output;
  }
);
