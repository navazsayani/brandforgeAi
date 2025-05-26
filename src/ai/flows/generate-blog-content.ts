'use server';
/**
 * @fileOverview AI agent that generates blog content for brand visibility.
 *
 * - generateBlogContent - A function that handles the blog content generation process.
 * - GenerateBlogContentInput - The input type for the generateBlogContent function.
 * - GenerateBlogContentOutput - The return type for the generateBlogContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogContentInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  keywords: z.string().describe('Comma-separated keywords related to the brand and its industry.'),
  targetPlatform: z.enum(['Medium', 'Other']).describe('The platform where the blog will be published.'),
});
export type GenerateBlogContentInput = z.infer<typeof GenerateBlogContentInputSchema>;

const GenerateBlogContentOutputSchema = z.object({
  title: z.string().describe('The title of the blog post.'),
  content: z.string().describe('The generated blog content, ready for publishing.'),
  tags: z.string().describe('Relevant tags for the blog post, comma separated.'),
});
export type GenerateBlogContentOutput = z.infer<typeof GenerateBlogContentOutputSchema>;

export async function generateBlogContent(input: GenerateBlogContentInput): Promise<GenerateBlogContentOutput> {
  return generateBlogContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBlogContentPrompt',
  input: {schema: GenerateBlogContentInputSchema},
  output: {schema: GenerateBlogContentOutputSchema},
  prompt: `You are an expert blog content creator, specializing in generating engaging and SEO-friendly blog posts for various brands.

  Based on the provided brand information, generate a blog post suitable for the specified platform. The blog post should be well-structured, informative, and tailored to attract the brand's target audience.  In addition, use the brand keywords to provide better SEO and visibility. Ensure that the content aligns with the brand's values and messaging.

  Brand Name: {{{brandName}}}
  Brand Description: {{{brandDescription}}}
  Keywords: {{{keywords}}}
  Target Platform: {{{targetPlatform}}}

  Blog Post Title: {{title}}
  Blog Post Content: {{content}}
  Tags: {{tags}}`,
});

const generateBlogContentFlow = ai.defineFlow(
  {
    name: 'generateBlogContentFlow',
    inputSchema: GenerateBlogContentInputSchema,
    outputSchema: GenerateBlogContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
