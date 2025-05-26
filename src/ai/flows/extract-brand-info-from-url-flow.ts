
'use server';
/**
 * @fileOverview AI agent that extracts brand information from a website URL.
 *
 * - extractBrandInfoFromUrl - A function that handles the brand info extraction process.
 * - ExtractBrandInfoFromUrlInput - The input type for the extractBrandInfoFromUrl function.
 * - ExtractBrandInfoFromUrlOutput - The return type for the extractBrandInfoFromUrl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchWebsiteContentTool } from '@/ai/tools/fetch-website-content-tool';

const ExtractBrandInfoFromUrlInputSchema = z.object({
  websiteUrl: z.string().url().describe('The URL of the brand\'s website.'),
});
export type ExtractBrandInfoFromUrlInput = z.infer<typeof ExtractBrandInfoFromUrlInputSchema>;

const ExtractBrandInfoFromUrlOutputSchema = z.object({
  brandDescription: z.string().describe('A concise but comprehensive description of the brand, its values, and target audience, derived from the website content. Should be at least 2-3 sentences long.'),
  targetKeywords: z.string().describe('A comma-separated list of 5-10 relevant target keywords for the brand, derived from the website content.'),
});
export type ExtractBrandInfoFromUrlOutput = z.infer<typeof ExtractBrandInfoFromUrlOutputSchema>;

export async function extractBrandInfoFromUrl(input: ExtractBrandInfoFromUrlInput): Promise<ExtractBrandInfoFromUrlOutput> {
  return extractBrandInfoFromUrlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractBrandInfoPrompt',
  input: {schema: z.object({
    websiteUrl: ExtractBrandInfoFromUrlInputSchema.shape.websiteUrl,
    websiteContent: z.string().describe('The main text content extracted from the website.'),
    extractionError: z.string().optional().describe('Any error that occurred during website content extraction.')
  })},
  output: {schema: ExtractBrandInfoFromUrlOutputSchema},
  tools: [fetchWebsiteContentTool], // Make the tool available
  prompt: `You are an expert brand analyst. Your task is to extract key brand information from the provided website content.

Website URL: {{{websiteUrl}}}

{{#if extractionError}}
There was an error fetching the website content: {{{extractionError}}}
Please generate a generic brand description and keywords based on common patterns for a website at this URL, or state if you cannot.
{{else}}
Extracted Website Content:
{{{websiteContent}}}

Based *only* on the Extracted Website Content and the Website URL:
1.  **Brand Description**: Generate a concise but comprehensive description of the brand. It should capture its essence, primary offerings/services, values, and target audience if discernible. Aim for 2-4 well-crafted sentences.
2.  **Target Keywords**: Identify 5-10 primary keywords that best represent the brand and its offerings. These should be suitable for SEO and ad campaigns. Provide them as a comma-separated list.

If the content is sparse or uninformative, make a reasonable attempt to infer the brand's nature from the URL and generate generic but plausible information, or state if it's not possible.
Do not use placeholders like "[Brand Name]".
{{/if}}
`,
});

const extractBrandInfoFromUrlFlow = ai.defineFlow(
  {
    name: 'extractBrandInfoFromUrlFlow',
    inputSchema: ExtractBrandInfoFromUrlInputSchema,
    outputSchema: ExtractBrandInfoFromUrlOutputSchema,
  },
  async (input) => {
    // First, use the tool to fetch website content
    const fetchResult = await fetchWebsiteContentTool({ url: input.websiteUrl });

    // Then, pass the fetched content (or error) to the main prompt
    const {output} = await prompt({
      websiteUrl: input.websiteUrl,
      websiteContent: fetchResult.textContent,
      extractionError: fetchResult.error,
    });
    
    if (!output) {
        throw new Error("AI failed to generate brand information.");
    }
    return output;
  }
);
