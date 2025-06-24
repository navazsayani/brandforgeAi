
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
import { fetchWebsiteContentTool } from '@/ai/tools/fetch-website-content-tool';
import { getModelConfig } from '@/lib/model-config';

const GenerateBlogContentInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  industry: z.string().optional().describe('The industry of the brand (e.g., Fashion, Technology). This helps tailor the content and tags.'),
  keywords: z.string().describe('Comma-separated keywords related to the brand and its industry.'),
  targetPlatform: z.enum(['Medium', 'Other']).describe('The platform where the blog will be published.'),
  websiteUrl: z.string().url().optional().describe('Optional URL of the brand\'s website for additional context for SEO and content relevance.'),
  blogOutline: z.string().describe('A detailed, structured outline for the blog post. The AI should strictly follow this outline.'),
  blogTone: z.string().describe('The desired tone and style for the blog post (e.g., Informative, Witty, Professional, Conversational).'),
});
export type GenerateBlogContentInput = z.infer<typeof GenerateBlogContentInputSchema>;

const GenerateBlogContentOutputSchema = z.object({
  title: z.string().describe('The title of the blog post, derived from the outline and overall theme.'),
  content: z.string().describe('The generated blog content, ready for publishing, adhering to the provided outline and tone.'),
  tags: z.string().describe('Relevant tags for the blog post, comma separated, optimized for SEO using keywords and website content if available, and relevant to the brand\'s industry.'),
});
export type GenerateBlogContentOutput = z.infer<typeof GenerateBlogContentOutputSchema>;

export async function generateBlogContent(input: GenerateBlogContentInput): Promise<GenerateBlogContentOutput> {
  return generateBlogContentFlow(input);
}

const generateBlogContentFlow = ai.defineFlow(
  {
    name: 'generateBlogContentFlow',
    inputSchema: GenerateBlogContentInputSchema,
    outputSchema: GenerateBlogContentOutputSchema,
  },
  async (input) => {
    let websiteContent: string | undefined = undefined;
    let extractionError: string | undefined = undefined;

    if (input.websiteUrl) {
      try {
        const fetchResult = await fetchWebsiteContentTool({ url: input.websiteUrl });
        if (fetchResult.error) {
          extractionError = fetchResult.error;
        } else {
          websiteContent = fetchResult.textContent;
        }
      } catch (e: any) {
        extractionError = `Failed to fetch website content: ${e.message}`;
      }
    }

    const { powerfulModel } = await getModelConfig();
    
    const prompt = ai.definePrompt({
      name: 'generateBlogContentPrompt',
      model: powerfulModel,
      input: {schema: z.object({
        brandName: GenerateBlogContentInputSchema.shape.brandName,
        brandDescription: GenerateBlogContentInputSchema.shape.brandDescription,
        industry: GenerateBlogContentInputSchema.shape.industry,
        keywords: GenerateBlogContentInputSchema.shape.keywords,
        targetPlatform: GenerateBlogContentInputSchema.shape.targetPlatform,
        websiteUrl: GenerateBlogContentInputSchema.shape.websiteUrl,
        blogOutline: GenerateBlogContentInputSchema.shape.blogOutline,
        blogTone: GenerateBlogContentInputSchema.shape.blogTone,
        websiteContent: z.string().optional().describe('The main text content extracted from the website, if URL was provided and fetching was successful.'),
        extractionError: z.string().optional().describe('Any error that occurred during website content extraction.')
      })},
      output: {schema: GenerateBlogContentOutputSchema},
      prompt: `You are an expert blog content creator specializing in the {{{industry}}} industry. Your task is to write a complete blog post based *strictly* on the provided outline, brand information, desired tone, and keywords.

Brand Name: {{{brandName}}}
Brand Description: {{{brandDescription}}}
{{#if industry}}
Industry: {{{industry}}}
{{/if}}
Keywords for SEO: {{{keywords}}}
Target Platform: {{{targetPlatform}}}
Desired Tone/Style: {{{blogTone}}}

{{#if websiteUrl}}
Website URL for context: {{{websiteUrl}}}
  {{#if extractionError}}
  Note: There was an error fetching content from the website: {{{extractionError}}}. Focus on other provided information for content and tags.
  {{else}}
    {{#if websiteContent}}
    Relevant Website Content Snippets (for thematic alignment and SEO tags):
    {{{websiteContent}}}
    {{else}}
    Note: No significant text content was extracted from the website.
    {{/if}}
  {{/if}}
{{/if}}

Blog Post Outline (Adhere to this structure closely):
{{{blogOutline}}}

Instructions:
1.  **Title**: Derive a compelling title from the blog outline, ensuring it is relevant to the {{{industry}}} industry.
2.  **Content**: Write the full blog post, ensuring each section of the outline is well-developed. The content should be informative, engaging, align with the brand's values, and be tailored to the target audience within the {{{industry}}} industry. Maintain the specified 'Desired Tone/Style' throughout the post.
3.  **SEO & Keywords**: Naturally integrate the 'Keywords for SEO'. If website content was provided, use insights from it to further optimize for SEO and to choose relevant tags.
4.  **Tags**: Generate 3-5 relevant, comma-separated tags for the blog post. These tags should be SEO-friendly, reflect the main topics, keywords, insights from website content (if available), and be highly relevant to the {{{industry}}} industry.

Output the generated title, content, and tags.
`,
    });

    const {output} = await prompt({
      brandName: input.brandName,
      brandDescription: input.brandDescription,
      industry: input.industry,
      keywords: input.keywords,
      targetPlatform: input.targetPlatform,
      websiteUrl: input.websiteUrl,
      blogOutline: input.blogOutline,
      blogTone: input.blogTone,
      websiteContent: websiteContent,
      extractionError: extractionError,
    });

    if (!output) {
        throw new Error("AI failed to generate blog content.");
    }
    return output;
  }
);
