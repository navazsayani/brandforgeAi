
'use server';
/**
 * @fileOverview An AI agent that populates the social media form from a single user request.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getModelConfig } from '@/lib/model-config';
import { socialPostGoals, socialTones } from '@/lib/constants';

// Create a list of values from the constants for the prompt
const validPostGoals = socialPostGoals.map(p => p.label).join(', ');
const validTones = socialTones.map(p => p.value).join(', ');

const PopulateSocialFormInputSchema = z.object({
  userRequest: z.string().min(10, { message: "Please describe your social post idea in at least 10 characters." }).describe('A user\'s natural language request for a social media post.'),
  currentBrandDescription: z.string().optional().describe('The user\'s existing brand description for context.'),
});
export type PopulateSocialFormInput = z.infer<typeof PopulateSocialFormInputSchema>;

const PopulateSocialFormOutputSchema = z.object({
  postGoal: z.enum(socialPostGoals.map(p => p.value) as [string, ...string[]]).describe('The best-fitting post goal from the provided list.'),
  targetAudience: z.string().optional().describe("A concise description of the target audience inferred from the request (e.g., 'young professionals', 'eco-conscious consumers')."),
  callToAction: z.string().optional().describe("A specific call to action inferred from the request (e.g., 'Shop now', 'Learn more')."),
  tone: z.enum(socialTones.map(p => p.value) as [string, ...string[]]).describe('The most suitable tone from the provided list.'),
  customToneNuances: z.string().optional().describe("Any specific nuances for the tone (e.g., 'but slightly urgent', 'with a touch of humor')."),
  imageDescription: z.string().optional().describe("A suggested description for the image based on the user's request, to be used in the social post form. If no image is mentioned, leave empty."),
});
export type PopulateSocialFormOutput = z.infer<typeof PopulateSocialFormOutputSchema>;

const populateSocialFormPrompt = ai.definePrompt({
    name: 'populateSocialFormPrompt',
    input: { schema: PopulateSocialFormInputSchema },
    output: { schema: PopulateSocialFormOutputSchema },
    prompt: `You are an expert social media strategist. Your task is to interpret a user's request for a social media post and populate a detailed form.

**User's Request:**
"{{{userRequest}}}"

**Current Brand Description (for context):**
"{{{currentBrandDescription}}}"

Based on the user's request, fill out the following fields precisely.

1.  **postGoal**: Choose the single best goal from this list that matches the user's intent.
    Valid Goals: ${socialPostGoals.map(p => `'${p.value}' (${p.label})`).join(', ')}.

2.  **targetAudience**: Concisely describe the target audience if mentioned or implied in the request. If not mentioned, infer a likely audience from the brand description or leave empty.

3.  **callToAction**: Extract a specific call to action if mentioned (e.g., "ask them to click the link in bio"). If not, leave empty.

4.  **tone**: Select the most appropriate tone from the following list.
    Valid Tones: ${validTones}.

5.  **customToneNuances**: Add any extra descriptive words about the tone from the request (e.g., "a bit formal", "playful"). If none, leave empty.

6.  **imageDescription**: If the user describes an image they want to post with, create a concise description of that image. If they do not mention an image, leave this field empty.
`
});

export async function populateSocialForm(input: PopulateSocialFormInput): Promise<PopulateSocialFormOutput> {
  return populateSocialFormFlow(input);
}

const populateSocialFormFlow = ai.defineFlow(
  {
    name: 'populateSocialFormFlow',
    inputSchema: PopulateSocialFormInputSchema,
    outputSchema: PopulateSocialFormOutputSchema,
  },
  async (input) => {
    const { fastModel } = await getModelConfig();
    const { output } = await populateSocialFormPrompt(input, { model: fastModel });
    if (!output) {
      throw new Error("AI failed to process the request and populate the social media form.");
    }
    return output;
  }
);
