
'use server';
/**
 * @fileOverview A Genkit tool to fetch the main text content of a website.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FetchWebsiteContentInputSchema = z.object({
  url: z.string().url().describe('The URL of the website to fetch content from.'),
});

const FetchWebsiteContentOutputSchema = z.object({
  textContent: z.string().describe('The extracted main text content of the website.'),
  error: z.string().optional().describe('Error message if fetching failed.'),
});

export const fetchWebsiteContentTool = ai.defineTool(
  {
    name: 'fetchWebsiteContent',
    description: 'Fetches the main textual content from a given public website URL. It tries to extract meaningful text from the body of the HTML.',
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
      
      // Basic text extraction (can be improved with a proper HTML parser like cheerio or jsdom if needed for more complex scenarios)
      // This regex attempts to strip HTML tags and extract content. It's not perfect.
      let text = html.replace(/<style[^>]*>.*<\/style>/gs, ''); // Remove style tags
      text = text.replace(/<script[^>]*>.*<\/script>/gs, ''); // Remove script tags
      text = text.replace(/<[^>]+>/g, ' '); // Remove all other tags, replace with space
      text = text.replace(/\s\s+/g, ' ').trim(); // Normalize whitespace

      // A very naive way to get "main" content - look for longer paragraphs
      // This is highly heuristic and might need significant improvement
      const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 100);
      const mainContent = paragraphs.length > 0 ? paragraphs.join('\n\n') : text.substring(0, 5000); // Fallback to first 5000 chars

      return { textContent: mainContent || "No significant text content found." };

    } catch (e: any) {
      console.error('Error fetching website content:', e);
      return { textContent: '', error: `An error occurred: ${e.message}` };
    }
  }
);
