
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Decodes HTML entities in a URL that might have been HTML-encoded
 * This is particularly useful for Firebase Storage URLs that may contain &amp; instead of &
 * @param url - The potentially HTML-encoded URL
 * @returns The decoded URL
 */
export function decodeHtmlEntitiesInUrl(url: string): string {
  return url
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Verifies if a Firebase Storage URL is accessible by making a HEAD request
 * @param url The Firebase Storage URL to verify
 * @returns Promise<boolean> true if accessible, false otherwise
 */
export async function verifyImageUrlExists(url: string): Promise<boolean> {
  try {
    const decodedUrl = decodeHtmlEntitiesInUrl(url);
    console.log(`Verifying image URL exists: ${decodedUrl.substring(0, 100)}...`);
    
    const response = await fetch(decodedUrl, {
      method: 'HEAD',
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const exists = response.ok;
    console.log(`Image URL verification result: ${exists ? 'EXISTS' : 'NOT FOUND'} (Status: ${response.status})`);
    return exists;
  } catch (error: any) {
    console.warn(`Error verifying image URL: ${error.message}`);
    return false;
  }
}
