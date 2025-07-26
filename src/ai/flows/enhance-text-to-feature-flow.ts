
'use server';
/**
 * @fileOverview An AI agent that enhances a user's prompt for the Text-to-Feature image generation.
 *
 * - enhanceTextToFeature - A function that handles the prompt enhancement.
 * - EnhanceTextToFeatureInput - The input type for the function.
 * - EnhanceTextToFeatureOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getModelConfig } from '@/lib/model-config';
import { EnhanceTextToFeatureInputSchema, EnhanceTextToFeatureOutputSchema, type EnhanceTextToFeatureInput, type EnhanceTextToFeatureOutput } from '@/types';

export type { EnhanceTextToFeatureInput, EnhanceTextToFeatureOutput };

export async function enhanceTextToFeature(input: EnhanceTextToFeatureInput): Promise<EnhanceTextToFeatureOutput> {
  return enhanceTextToFeatureFlow(input);
}

const enhanceTextToFeaturePrompt = ai.definePrompt({
  name: 'enhanceTextToFeaturePrompt',
  input: {schema: EnhanceTextToFeatureInputSchema},
  output: {schema: EnhanceTextToFeatureOutputSchema},
  prompt: `You are an expert creative director specializing in turning abstract text concepts into concrete, visually rich prompts for an image generation AI.

**User's Core Idea:**
"{{{textToFeature}}}"

**Your Task:**
Rewrite the user's core idea into a more descriptive and effective prompt. The goal is to guide the AI to create a **visual representation** of the idea, not just an illustration.

**Instructions:**
1.  **Identify the Core Concept:** What is the user trying to communicate? (e.g., growth, security, 5 simple steps).
2.  **Brainstorm Visual Metaphors:** How can this concept be shown visually? (e.g., 'growth' could be a rising chart or a sprouting plant; 'security' could be a shield or a vault).
3.  **Add Rich Detail:** Include descriptive adjectives about the mood, style, and composition. (e.g., "A clean, minimalist infographic with 5 sleek icons...", "A vibrant and dynamic image showing...").
4.  **Do Not Add New Elements:** Only expand on the user's original request. Do not introduce completely new topics.
5.  **Keep it Concise:** The output should be a single, powerful sentence or two.

**Example:**
-   **User Input:** "5 ways to improve SEO"
-   **Your Output:** "Create a visually engaging infographic with 5 distinct, minimalist icons representing key SEO concepts like keywords, high-quality content, backlinks, site speed, and mobile-friendliness, arranged in a clean, easy-to-follow layout."

Produce only the enhanced prompt text.
`,
});

const enhanceTextToFeatureFlow = ai.defineFlow(
  {
    name: 'enhanceTextToFeatureFlow',
    inputSchema: EnhanceTextToFeatureInputSchema,
    outputSchema: EnhanceTextToFeatureOutputSchema,
  },
  async (input) => {
    const { fastModel } = await getModelConfig();

    const {output} = await enhanceTextToFeaturePrompt(input, { model: fastModel });

    if (!output) {
      throw new Error("AI failed to generate an enhanced Text-to-Feature prompt.");
    }
    return output;
  }
);
