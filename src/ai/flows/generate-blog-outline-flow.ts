
'use server';
/**
 * @fileOverview AI agent that generates a blog post outline.
 *
 * - generateBlogOutline - A function that handles blog outline generation.
 * - GenerateBlogOutlineInput - The input type for the generateBlogOutline function.
 * - GenerateBlogOutlineOutput - The return type for the generateBlogOutline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchWebsiteContentTool } from '@/ai/tools/fetch-website-content-tool';

const GenerateBlogOutlineInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  industry: z.string().optional().describe('The industry of the brand (e.g., Fashion, Technology). This helps tailor the outline topics and relevance.'),
  keywords: z.string().describe('Comma-separated keywords related to the brand and its industry.'),
  websiteUrl: z.string().url().optional().describe('Optional URL of the brand\'s website for additional context.'),
});
export type GenerateBlogOutlineInput = z.infer<typeof GenerateBlogOutlineInputSchema>;

const GenerateBlogOutlineOutputSchema = z.object({
  outline: z.string().describe('A structured blog post outline, including main sections and key points. Formatted with headings and bullet points.'),
});
export type GenerateBlogOutlineOutput = z.infer<typeof GenerateBlogOutlineOutputSchema>;

export async function generateBlogOutline(input: GenerateBlogOutlineInput): Promise<GenerateBlogOutlineOutput> {
  return generateBlogOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBlogOutlinePrompt',
  input: {schema: z.object({
    brandName: GenerateBlogOutlineInputSchema.shape.brandName,
    brandDescription: GenerateBlogOutlineInputSchema.shape.brandDescription,
    industry: GenerateBlogOutlineInputSchema.shape.industry,
    keywords: GenerateBlogOutlineInputSchema.shape.keywords,
    websiteUrl: GenerateBlogOutlineInputSchema.shape.websiteUrl,
    websiteContent: z.string().optional().describe('The main text content extracted from the website, if URL was provided and fetching was successful.'),
    extractionError: z.string().optional().describe('Any error that occurred during website content extraction.')
  })},
  output: {schema: GenerateBlogOutlineOutputSchema},
  prompt: `You are an expert content strategist and blog writer. Your task is to generate a detailed and structured blog post outline.

Brand Name: {{{brandName}}}
Brand Description: {{{brandDescription}}}
{{#if industry}}
Industry: {{{industry}}}
{{/if}}
Keywords: {{{keywords}}}

{{#if websiteUrl}}
Website URL: {{{websiteUrl}}}
  {{#if extractionError}}
  Note: There was an error fetching content from the website: {{{extractionError}}}. Please generate the outline based on other provided information.
  {{else}}
    {{#if websiteContent}}
    Relevant Website Content Snippets:
    {{{websiteContent}}}
    Instruction: Use the website content to identify key themes, topics, and relevant information that should be covered in the blog post outline.
    {{else}}
    Note: No significant text content was extracted from the website. Please generate the outline based on other provided information.
    {{/if}}
  {{/if}}
{{/if}}

Based on all the information above (especially considering the brand's industry if provided), create a comprehensive blog post outline. The outline should:
- Have a clear, engaging main title relevant to the brand and its industry.
- Be structured with main sections (e.g., using H2 or similar markdown for headings).
- Include key talking points or sub-topics as bullet points under each main section, relevant to the industry.
- Be logical and flow well.
- Be optimized for SEO using the provided keywords and insights from the website content (if available).
- Be suitable for a blog post that aims to enhance brand visibility and engage the target audience within its specific industry.

Output the outline as a well-formatted text. For example:

# Engaging Blog Post Title Here (Tailored to Industry)

## Section 1: Introduction (Industry Context)
- Hook the reader (with an industry-specific angle)
- Briefly introduce the topic and its relevance to the brand within its industry
- Thesis statement or main point

## Section 2: Main Point A (Industry Challenge/Opportunity)
- Key talking point 1
- Key talking point 2
- Examples or supporting details relevant to the industry

## Section 3: Main Point B (Brand's Solution/Perspective in Industry)
- Key talking point 1
- Key talking point 2
- Call to action related to this section (if applicable)

## Section 4: Conclusion
- Summarize key takeaways for the industry audience
- Reiterate brand relevance within the industry
- Final call to action or thought-provoking question for the industry
`,
});

const generateBlogOutlineFlow = ai.defineFlow(
  {
    name: 'generateBlogOutlineFlow',
    inputSchema: GenerateBlogOutlineInputSchema,
    outputSchema: GenerateBlogOutlineOutputSchema,
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

    const {output} = await prompt({
      brandName: input.brandName,
      brandDescription: input.brandDescription,
      industry: input.industry,
      keywords: input.keywords,
      websiteUrl: input.websiteUrl,
      websiteContent: websiteContent,
      extractionError: extractionError,
    });
    
    if (!output) {
        throw new Error("AI failed to generate a blog outline.");
    }
    return output;
  }
);
