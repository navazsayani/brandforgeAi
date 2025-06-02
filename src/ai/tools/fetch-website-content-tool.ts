
'use server';
/**
 * @fileOverview A Genkit tool to fetch the main text content of a website.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';

const FetchWebsiteContentInputSchema = z.object({
  url: z.string().url().describe('The URL of the website to fetch content from.'),
});

const FetchWebsiteContentOutputSchema = z.object({
  textContent: z.string().describe('The extracted main text content of the website, including meta description and keywords.'),
  error: z.string().optional().describe('Error message if fetching failed.'),
});

export const fetchWebsiteContentTool = ai.defineTool(
  {
    name: 'fetchWebsiteContent',
    description: 'Fetches the main textual content and meta information from a given public website URL.',
    inputSchema: FetchWebsiteContentInputSchema,
    outputSchema: FetchWebsiteContentOutputSchema,
  },
  async (input) => {
    try {
      const response = await fetch(input.url, {
        headers: {
          'User-Agent': 'BrandForgeAI/1.0 (+https://firebase.google.com/products/studio)', // Be a good internet citizen
          'Accept': 'text/html',
        },
        redirect: 'follow', // Follow redirects
      });

      if (!response.ok) {
        return { textContent: '', error: `Failed to fetch URL: ${response.status} ${response.statusText}` };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/html')) {
        return { textContent: '', error: `Invalid content type: ${contentType}. Expected text/html.` };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract meta description and keywords
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      const metaKeywords = $('meta[name="keywords"]').attr('content') || '';

      // Extract main text content from the body
      let textContent = $('body').text().trim();
      
      // Normalize whitespace
      textContent = textContent.replace(/\s\s+/g, ' ');

      // Combine meta description and keywords with the body text
      const combinedContent = `${metaDescription}. ${metaKeywords}. ${textContent}`;

      return { textContent: combinedContent || "No significant text content found." };

    } catch (e: any) {
      console.error('Error fetching website content:', e);
      return { textContent: '', error: `An error occurred: ${e.message}` };
    }
  }
);
