'use server';
/**
 * @fileOverview An AI agent that populates the ad campaign form from a single user request.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getModelConfig } from '@/lib/model-config';

const PopulateAdCampaignFormInputSchema = z.object({
  userRequest: z.string().min(10, { message: "Please describe your ad campaign idea in at least 10 characters." }).describe('A user\'s natural language request for an ad campaign.'),
  currentBrandDescription: z.string().optional().describe('The user\'s existing brand description for context.'),
  currentKeywords: z.string().optional().describe('Comma-separated list of existing keywords for context.'),
});
export type PopulateAdCampaignFormInput = z.infer<typeof PopulateAdCampaignFormInputSchema>;

const PopulateAdCampaignFormOutputSchema = z.object({
  budget: z.number().optional().describe('A suggested budget based on the user request, if any is mentioned (e.g., "a small campaign", "a $500 budget").'),
  platforms: z.array(z.enum(['google_ads', 'meta'])).optional().describe('An array of platforms to target, inferred from the user request (e.g., "on Instagram" implies "meta").'),
  targetKeywords: z.string().optional().describe("A comma-separated list of 3-5 highly relevant keywords for the campaign, derived from the user request and existing keywords."),
  inspirationalContent: z.string().describe("A concise summary of the user's core request to be used as the inspirational content for the ad generation."),
});
export type PopulateAdCampaignFormOutput = z.infer<typeof PopulateAdCampaignFormOutputSchema>;

const populateAdCampaignFormPrompt = ai.definePrompt({
    name: 'populateAdCampaignFormPrompt',
    input: { schema: PopulateAdCampaignFormInputSchema },
    output: { schema: PopulateAdCampaignFormOutputSchema },
    prompt: `You are an expert digital marketing strategist. Your task is to interpret a user's request for an ad campaign and populate a form.

**User's Request:**
"{{{userRequest}}}"

**Contextual Information:**
- **Brand Description:** "{{{currentBrandDescription}}}"
- **Existing Keywords:** "{{{currentKeywords}}}"

Based on the user's request and the contextual information, fill out the following fields.

1.  **budget**: If the user mentions a budget (e.g., "$1000", "a small budget"), provide a numeric value. If not, leave empty. For "small budget", use 100. For "medium", 500. For "large", 2000.

2.  **platforms**: Infer the platforms. "Instagram" or "Facebook" implies 'meta'. "Google" or "search ads" implies 'google_ads'. If both, include both. If none, select both by default. Valid values: 'google_ads', 'meta'.

3.  **targetKeywords**: Generate a comma-separated list of 3-5 highly relevant keywords based on the user's request and existing keywords.

4.  **inspirationalContent**: Create a concise, one-sentence summary of the user's core ad idea or message to be used as the main inspirational content.
`
});

export async function populateAdCampaignForm(input: PopulateAdCampaignFormInput): Promise<PopulateAdCampaignFormOutput> {
  return populateAdCampaignFormFlow(input);
}

const populateAdCampaignFormFlow = ai.defineFlow(
  {
    name: 'populateAdCampaignFormFlow',
    inputSchema: PopulateAdCampaignFormInputSchema,
    outputSchema: PopulateAdCampaignFormOutputSchema,
  },
  async (input) => {
    const { fastModel } = await getModelConfig();
    const { output } = await populateAdCampaignFormPrompt(input, { model: fastModel });
    if (!output) {
      throw new Error("AI failed to process the request and populate the ad campaign form.");
    }
    return output;
  }
);
