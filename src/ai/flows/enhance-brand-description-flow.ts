
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
  prompt: `You are an expert brand strategist and marketing copywriter. A user has provided a description for their brand. Your task is to analyze and enhance it to be more compelling, clear, and ready for marketing purposes.

**Original User-Provided Description:**
"{{{brandDescription}}}"

**Your Instructions:**
1.  **Identify the Core Essence:** What is the fundamental product, service, or value proposition?
2.  **Clarify the Target Audience:** Who is this brand for? If it's not explicit, infer a likely audience.
3.  **Refine the Tone:** Elevate the language to be more professional, engaging, and confident.
4.  **Strengthen the Value Proposition:** Clearly articulate what makes the brand unique or valuable.
5.  **Synthesize and Rewrite:** Combine your analysis into a single, cohesive paragraph of 2-4 powerful sentences. The result should be a description that could be used on a website's "About Us" section or in a marketing brochure.

**Do Not:**
-   Use placeholders like "[Brand Name]".
-   Simply rephrase sentences. Your goal is to add strategic value.
-   Make it overly long. Brevity with impact is key.

Produce only the final, enhanced description text in the 'enhancedDescription' field.
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

