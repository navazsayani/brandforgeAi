
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
import { enhanceBlogContentPrompt, storeContentForRAG, getAdaptiveRAGContext } from '@/lib/rag-integration';

const GenerateBlogContentInputSchema = z.object({
  brandName: z.string().describe('The name of the brand.'),
  brandDescription: z.string().describe('A detailed description of the brand, its values, and target audience.'),
  industry: z.string().optional().describe('The industry of the brand (e.g., Fashion, Technology). This helps tailor the content and tags.'),
  keywords: z.string().describe('Comma-separated keywords related to the brand and its industry.'),
  targetPlatform: z.enum(['Medium', 'Other']).describe('The platform where the blog will be published.'),
  websiteUrl: z.string().url().optional().describe('Optional URL of the brand\'s website for additional context for SEO and content relevance.'),
  blogOutline: z.string().describe('A detailed, structured outline for the blog post. The AI should strictly follow this outline.'),
  blogTone: z.string().describe('The desired tone and style for the blog post (e.g., Informative, Witty, Professional, Conversational).'),
  articleStyle: z.string().optional().describe("The format of the blog post, e.g., 'How-To Guide', 'Listicle'. This informs the content structure."),
  targetAudience: z.string().optional().describe("The intended audience for the blog post, e.g., 'Beginners', 'Experts'. This sets the content's complexity and language."),
});
export type GenerateBlogContentInput = z.infer<typeof GenerateBlogContentInputSchema>;

const GenerateBlogContentOutputSchema = z.object({
  title: z.string().describe('The title of the blog post, derived from the outline and overall theme.'),
  content: z.string().describe('The generated blog content, ready for publishing, adhering to the provided outline and tone.'),
  tags: z.string().describe('Relevant tags for the blog post, comma separated, optimized for SEO using keywords and website content if available, and relevant to the brand\'s industry.'),
});
export type GenerateBlogContentOutput = z.infer<typeof GenerateBlogContentOutputSchema>;

const generateBlogContentPrompt = ai.definePrompt({
  name: 'generateBlogContentPrompt',
  input: {schema: z.object({
    brandName: GenerateBlogContentInputSchema.shape.brandName,
    brandDescription: GenerateBlogContentInputSchema.shape.brandDescription,
    industry: GenerateBlogContentInputSchema.shape.industry,
    keywords: GenerateBlogContentInputSchema.shape.keywords,
    targetPlatform: GenerateBlogContentInputSchema.shape.targetPlatform,
    websiteUrl: GenerateBlogContentInputSchema.shape.websiteUrl,
    blogOutline: GenerateBlogContentInputSchema.shape.blogOutline,
    blogTone: GenerateBlogContentInputSchema.shape.blogTone,
    articleStyle: GenerateBlogContentInputSchema.shape.articleStyle,
    targetAudience: GenerateBlogContentInputSchema.shape.targetAudience,
    websiteContent: z.string().optional().describe('The main text content extracted from the website, if URL was provided and fetching was successful.'),
    extractionError: z.string().optional().describe('Any error that occurred during website content extraction.')
  })},
  output: {schema: GenerateBlogContentOutputSchema},
  prompt: `You are an expert blog content creator specializing in writing for a '{{{targetAudience}}}' audience in the '{{{industry}}}' industry. Your task is to write a complete blog post based *strictly* on the provided outline and other parameters.

**Primary Instructions:**
- **Brand Name:** {{{brandName}}}
- **Brand Description:** {{{brandDescription}}}
- **Target Audience:** {{#if targetAudience}}"{{{targetAudience}}}"{{else}}General audience{{/if}}
- **Desired Tone/Style:** {{{blogTone}}}
- **Article Format:** {{#if articleStyle}}"{{{articleStyle}}}"{{else}}Standard blog post{{/if}}
- **Keywords for SEO:** {{{keywords}}}
- **Target Platform:** {{{targetPlatform}}}

**Contextual Information:**
{{#if websiteUrl}}
- **Website URL:** {{{websiteUrl}}}
  {{#if extractionError}}
  - Note: There was an error fetching content from the website: {{{extractionError}}}. Focus on other provided information.
  {{else}}
    {{#if websiteContent}}
    - Relevant Website Content Snippets (for thematic alignment and SEO): {{{websiteContent}}}
    {{else}}
    - Note: No significant text content was extracted from the website.
    {{/if}}
  {{/if}}
{{/if}}

**Blog Post Outline (Adhere to this structure very closely):**
{{{blogOutline}}}

**Execution Plan:**
1.  **Title**: Derive a compelling and SEO-friendly title directly from the blog outline's main heading.
2.  **Content**: Write the full blog post.
    - **Follow the Outline:** Ensure every section and bullet point from the outline is fully developed into a paragraph or a list as appropriate.
    - **Match the Tone:** Maintain the specified 'Desired Tone/Style' throughout the entire article.
    - **Audience-Centric:** Write in a way that is clear, engaging, and valuable for the specified 'Target Audience'.
    - **Format Correctly:** Structure the content to match the 'Article Format' (e.g., use numbered lists for a listicle, clear steps for a how-to guide).
    - **Use Markdown:** The entire output for the 'content' field **MUST** be in GitHub-flavored Markdown. Use headings (\`##\`, \`###\`), bold (\`**text**\`), italics (\`*text*\`), and lists (\`- item\`) for formatting. **DO NOT use HTML tags (e.g., \`<h2>\`, \`<p>\`).**
3.  **SEO & Keywords**: Naturally integrate the 'Keywords for SEO' into the content. Use insights from website content (if provided) to improve relevance.
4.  **Tags**: Generate 3-5 relevant, comma-separated tags. These tags should be SEO-friendly, reflect the main topics, keywords, and be highly relevant to the brand's industry.

Output only the generated title, content, and tags in the required format.
`,
});

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
    // 🔥 RAG ENHANCEMENT: Get user ID from input (will be passed from actions)
    const userId = (input as any).userId;
    
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

    // 🔥 RAG ENHANCEMENT: Get adaptive RAG context with insights
    let enhancedInput = input;
    let ragInsights: any[] = [];
    let wasRAGEnhanced = false;
    
    if (userId) {
      try {
        // Create base prompt text for enhancement
        const basePromptText = `Generate blog content for ${input.brandName} about ${input.keywords} in ${input.blogTone} tone`;
        
        // Get adaptive RAG context with insights
        const { context, insights } = await getAdaptiveRAGContext(
          userId,
          basePromptText,
          {
            userId,
            contentType: 'blog_post',
            industry: input.industry,
            minPerformance: 0.6,
            limit: 8,
            includeIndustryPatterns: true,
            timeframe: '90days'
          }
        );
        
        ragInsights = insights;
        wasRAGEnhanced = insights.length > 0;
        
        if (wasRAGEnhanced) {
          // Build enhanced prompt with RAG context
          let ragContextText = '';
          if (context.brandPatterns) ragContextText += `\nBRAND WRITING STYLE:\n${context.brandPatterns}`;
          if (context.successfulStyles) ragContextText += `\nSUCCESSFUL CONTENT APPROACHES:\n${context.successfulStyles}`;
          if (context.seoKeywords) ragContextText += `\nEFFECTIVE SEO KEYWORDS:\n${context.seoKeywords}`;
          if (context.performanceInsights) ragContextText += `\nCONTENT PERFORMANCE INSIGHTS:\n${context.performanceInsights}`;
          
          enhancedInput = {
            ...input,
            brandDescription: `${input.brandDescription}${ragContextText}`
          };
          
          console.log(`[RAG] Enhanced blog content prompt with ${insights.length} insights`);
        }
      } catch (error) {
        console.log(`[RAG] Failed to enhance prompt, using original:`, error);
      }
    }

    const { powerfulModel } = await getModelConfig();
    
    const {output} = await generateBlogContentPrompt({
      brandName: enhancedInput.brandName,
      brandDescription: enhancedInput.brandDescription,
      industry: enhancedInput.industry,
      keywords: enhancedInput.keywords,
      targetPlatform: enhancedInput.targetPlatform,
      websiteUrl: enhancedInput.websiteUrl,
      blogOutline: enhancedInput.blogOutline,
      blogTone: enhancedInput.blogTone,
      articleStyle: enhancedInput.articleStyle,
      targetAudience: enhancedInput.targetAudience,
      websiteContent: websiteContent,
      extractionError: extractionError,
    }, { model: powerfulModel });

    if (!output) {
        throw new Error("AI failed to generate blog content.");
    }
    
    // 🔥 RAG ENHANCEMENT: Store successful generation for future RAG
    if (userId && output) {
      try {
        const contentId = `blog_${Date.now()}`;
        await storeContentForRAG(
          userId,
          'blog_post',
          contentId,
          {
            prompt: `Blog: ${output.title}`,
            result: `${output.title}\n\n${output.content.substring(0, 500)}...`,
            style: input.blogTone,
            metadata: {
              platform: input.targetPlatform,
              articleStyle: input.articleStyle,
              targetAudience: input.targetAudience,
              industry: input.industry,
              wasRAGEnhanced,
              ragInsights: ragInsights.length > 0 ? ragInsights : undefined
            }
          }
        );
        console.log(`[RAG] Stored blog content generation for future context`);
      } catch (error) {
        console.log(`[RAG] Failed to store content for RAG:`, error);
      }
    }
    
    // Add RAG metadata to output for UI components
    return {
      ...output,
      _ragMetadata: {
        wasRAGEnhanced,
        ragInsights,
        contentId: `blog_${Date.now()}`,
        userId
      }
    };
  }
);
