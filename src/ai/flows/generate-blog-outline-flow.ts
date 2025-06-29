
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
import { getModelConfig } from '@/lib/model-config';

const GenerateBlogOutlineInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  industry: z.string().optional().describe('The industry of the brand (e.g., Fashion, Technology). This helps tailor the outline topics and relevance.'),
  keywords: z.string().describe('Comma-separated keywords related to the brand and its industry.'),
  websiteUrl: z.string().url().optional().describe('Optional URL of the brand\'s website for additional context.'),
  articleStyle: z.string().optional().describe("The desired format of the blog post, e.g., 'How-To Guide', 'Listicle'. This helps structure the outline."),
  targetAudience: z.string().optional().describe("The intended audience for the blog post, e.g., 'Beginners', 'Experts'. This sets the tone and complexity."),
});
export type GenerateBlogOutlineInput = z.infer<typeof GenerateBlogOutlineInputSchema>;

const GenerateBlogOutlineOutputSchema = z.object({
  outline: z.string().describe('A structured blog post outline, including main sections and key points. Formatted with headings and bullet points.'),
});
export type GenerateBlogOutlineOutput = z.infer<typeof GenerateBlogOutlineOutputSchema>;

const generateBlogOutlinePrompt = ai.definePrompt({
  name: 'generateBlogOutlinePrompt',
  input: {schema: z.object({
    brandName: GenerateBlogOutlineInputSchema.shape.brandName,
    brandDescription: GenerateBlogOutlineInputSchema.shape.brandDescription,
    industry: GenerateBlogOutlineInputSchema.shape.industry,
    keywords: GenerateBlogOutlineInputSchema.shape.keywords,
    websiteUrl: GenerateBlogOutlineInputSchema.shape.websiteUrl,
    articleStyle: GenerateBlogOutlineInputSchema.shape.articleStyle,
    targetAudience: GenerateBlogOutlineInputSchema.shape.targetAudience,
    websiteContent: z.string().optional().describe('The main text content extracted from the website, if URL was provided and fetching was successful.'),
    extractionError: z.string().optional().describe('Any error that occurred during website content extraction.')
  })},
  output: {schema: GenerateBlogOutlineOutputSchema},
  prompt: `You are an expert content strategist and SEO specialist. Your task is to generate a detailed and structured blog post outline.

**Primary Inputs:**
- **Brand Name:** {{{brandName}}}
- **Brand Description:** {{{brandDescription}}}
- **Industry:** {{#if industry}}"{{{industry}}}"{{else}}General{{/if}}
- **Keywords:** {{{keywords}}}
- **Target Audience:** {{#if targetAudience}}"{{{targetAudience}}}"{{else}}General audience{{/if}}
- **Article Style:** {{#if articleStyle}}"{{{articleStyle}}}"{{else}}Standard blog post{{/if}}

{{#if websiteUrl}}
**Contextual Information:**
- **Website URL:** {{{websiteUrl}}}
  {{#if extractionError}}
  - **Note:** Error fetching content: {{{extractionError}}}. Generate outline based on other info.
  {{else}}
    {{#if websiteContent}}
    - **Website Content:** Use themes from this content to inform the outline: "{{{websiteContent}}}"
    {{else}}
    - **Note:** No text content extracted. Generate outline based on other info.
    {{/if}}
  {{/if}}
{{/if}}

**Instructions:**
Based on all the information above, create a comprehensive blog post outline. The outline must:
1.  **Have a compelling, SEO-friendly title** that incorporates keywords and is relevant to the brand, industry, and target audience.
2.  **Be structured for the specified 'Article Style'.** For a 'How-To Guide', use step-by-step sections. For a 'Listicle', use numbered or bulleted main points.
3.  **Be tailored to the 'Target Audience'.** If the audience is 'Beginners', keep concepts simple. If 'Experts', use more advanced topics.
4.  **Organize content logically** with main sections (e.g., using H2 or similar markdown) and key talking points as bullet points under each section.
5.  **Naturally integrate the 'Keywords'** into headings and talking points.
6.  **Be suitable for a blog post** that aims to enhance brand visibility and engage the target audience within its specific industry.

**Example Structure (for a 'How-To Guide'):**

# Engaging Blog Post Title Here

## Section 1: Introduction
- Hook the reader by stating a common problem for the 'Target Audience'.
- Briefly introduce the topic and why it's important for the 'Industry'.
- State what the reader will learn.

## Section 2: Prerequisite/Setup (if applicable)
- What you'll need before you start.
- Key concepts to understand.

## Section 3: Step-by-Step Guide
- **Step 1:** [First Action]
  - Detail for step 1.
- **Step 2:** [Second Action]
  - Detail for step 2.
- **Step 3:** [Third Action]
  - Detail for step 3.

## Section 4: Common Pitfalls / Pro-Tips
- Mistakes to avoid.
- Expert tips for the 'Target Audience'.

## Section 5: Conclusion
- Summarize the key takeaways.
- Reiterate the main benefit for the reader.
- Final call to action (e.g., "Try it yourself", "What are your thoughts?").

---
Produce only the well-formatted outline text based on the request.
`,
});

export async function generateBlogOutline(input: GenerateBlogOutlineInput): Promise<GenerateBlogOutlineOutput> {
  return generateBlogOutlineFlow(input);
}

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

    const { fastModel } = await getModelConfig();

    const {output} = await generateBlogOutlinePrompt({
      brandName: input.brandName,
      brandDescription: input.brandDescription,
      industry: input.industry,
      keywords: input.keywords,
      websiteUrl: input.websiteUrl,
      articleStyle: input.articleStyle,
      targetAudience: input.targetAudience,
      websiteContent: websiteContent,
      extractionError: extractionError,
    }, { model: fastModel });
    
    if (!output) {
        throw new Error("AI failed to generate a blog outline.");
    }
    return output;
  }
);
