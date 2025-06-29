
'use server';
/**
 * @fileOverview An AI agent that populates the blog post form from a single user request.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getModelConfig } from '@/lib/model-config';
import { blogArticleStyles, blogTones } from '@/lib/constants';

// Create a list of values from the constants for the prompt
const validArticleStyles = blogArticleStyles.map(p => p.label).join(', ');
const validTones = blogTones.map(p => p.label).join(', ');

const PopulateBlogFormInputSchema = z.object({
  userRequest: z.string().min(10, { message: "Please describe your blog post idea in at least 10 characters." }).describe('A user\'s natural language request for a blog post.'),
  currentBrandDescription: z.string().optional().describe('The user\'s existing brand description for context.'),
  currentKeywords: z.string().optional().describe('Comma-separated list of existing keywords for context.'),
});
export type PopulateBlogFormInput = z.infer<typeof PopulateBlogFormInputSchema>;

const PopulateBlogFormOutputSchema = z.object({
  targetAudience: z.string().optional().describe("A concise description of the target audience inferred from the request (e.g., 'beginners in marketing', 'expert developers')."),
  articleStyle: z.enum(blogArticleStyles.map(p => p.value) as [string, ...string[]]).describe('The most suitable article style from the provided list.'),
  blogTone: z.enum(blogTones.map(p => p.value) as [string, ...string[]]).describe('The most suitable blog tone from the provided list.'),
  generatedOutline: z.string().describe("A complete, well-structured blog post outline, including an SEO-friendly title, main sections (H2s), and bullet points for talking points, based on the user's request."),
});
export type PopulateBlogFormOutput = z.infer<typeof PopulateBlogFormOutputSchema>;

const populateBlogFormPrompt = ai.definePrompt({
    name: 'populateBlogFormPrompt',
    input: { schema: PopulateBlogFormInputSchema },
    output: { schema: PopulateBlogFormOutputSchema },
    prompt: `You are an expert content strategist and SEO specialist. Your task is to interpret a user's request for a blog post and populate a detailed form, including creating a full blog outline.

**User's Request:**
"{{{userRequest}}}"

**Contextual Information:**
- **Brand Description:** "{{{currentBrandDescription}}}"
- **Keywords:** "{{{currentKeywords}}}"

Based on the user's request and the contextual information, fill out the following fields.

1.  **targetAudience**: Concisely describe the target audience if mentioned or implied. If not, infer a likely audience from the brand description or topic.

2.  **articleStyle**: Choose the *single best* style from the following list that matches the user's request.
    Valid Styles: ${blogArticleStyles.map(s => `'${s.value}' (${s.label})`).join(', ')}.

3.  **blogTone**: Select the most appropriate tone from the following list.
    Valid Tones: ${blogTones.map(t => `'${t.value}' (${t.label})`).join(', ')}.

4.  **generatedOutline**: This is the most important field. Create a complete, detailed, and SEO-optimized blog post outline based on the user's request.
    - The outline **MUST** start with a compelling H1-level title (e.g., "# Title Here").
    - It **MUST** be well-structured with multiple main sections using H2-level headings (e.g., "## Section Title").
    - Each section **MUST** include several bullet points with key talking points.
    - The structure should match the chosen 'articleStyle' (e.g., use steps for a how-to guide).
    - The content should be tailored to the 'targetAudience'.
    - Naturally weave in the provided 'Keywords'.
`
});

export async function populateBlogForm(input: PopulateBlogFormInput): Promise<PopulateBlogFormOutput> {
  return populateBlogFormFlow(input);
}

const populateBlogFormFlow = ai.defineFlow(
  {
    name: 'populateBlogFormFlow',
    inputSchema: PopulateBlogFormInputSchema,
    outputSchema: PopulateBlogFormOutputSchema,
  },
  async (input) => {
    const { powerfulModel } = await getModelConfig(); // Use a powerful model for good outline generation
    const { output } = await populateBlogFormPrompt(input, { model: powerfulModel });
    if (!output) {
      throw new Error("AI failed to process the request and populate the blog form.");
    }
    return output;
  }
);
