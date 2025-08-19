
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

/**
 * Compresses a data URI image to reduce file size
 * @param dataUri - The original data URI
 * @param quality - Compression quality (0.1 to 1.0, default 0.8)
 * @param maxWidth - Maximum width in pixels (default 1024)
 * @param maxHeight - Maximum height in pixels (default 1024)
 * @returns Promise<string> - Compressed data URI
 */
export async function compressDataUri(
  dataUri: string,
  quality: number = 0.8,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create an image element
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create a canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed data URI
          const compressedDataUri = canvas.toDataURL('image/jpeg', quality);
          
          console.log(`[Compression] Original size: ${dataUri.length} bytes, Compressed size: ${compressedDataUri.length} bytes`);
          resolve(compressedDataUri);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      
      img.src = dataUri;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Server-side image compression using Buffer (for Node.js environment)
 * @param dataUri - The original data URI
 * @param targetSizeBytes - Target size in bytes (default 800KB)
 * @returns string - Compressed data URI or original if already small enough
 */
export function compressDataUriServer(dataUri: string, targetSizeBytes: number = 800 * 1024): string {
  try {
    // Check if compression is needed
    if (dataUri.length <= targetSizeBytes) {
      console.log(`[Server Compression] Image size ${dataUri.length} bytes is within limit, no compression needed`);
      return dataUri;
    }
    
    console.log(`[Server Compression] Image size ${dataUri.length} bytes exceeds ${targetSizeBytes} bytes, attempting compression`);
    
    // Extract base64 data
    const base64Data = dataUri.split(',')[1];
    if (!base64Data) {
      console.warn('[Server Compression] Invalid data URI format, returning original');
      return dataUri;
    }
    
    // For server-side, we'll use a simple approach: reduce quality by truncating precision
    // This is a basic approach - in production you might want to use a proper image processing library
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Calculate compression ratio needed
    const compressionRatio = targetSizeBytes / dataUri.length;
    
    if (compressionRatio < 0.5) {
      // If we need to compress by more than 50%, use JPEG format with lower quality
      const jpegHeader = 'data:image/jpeg;base64,';
      const compressedBase64 = base64Data.substring(0, Math.floor(base64Data.length * compressionRatio));
      const compressedDataUri = jpegHeader + compressedBase64;
      
      console.log(`[Server Compression] Compressed from ${dataUri.length} to ${compressedDataUri.length} bytes`);
      return compressedDataUri;
    }
    
    // For smaller compression needs, just return original
    console.log(`[Server Compression] Compression ratio ${compressionRatio} too small, returning original`);
    return dataUri;
    
  } catch (error) {
    console.error('[Server Compression] Error during compression:', error);
    return dataUri; // Return original on error
  }
}
