/**
 * Gallery Types
 *
 * Type definitions for the Inspiration Gallery feature
 */

export interface GalleryItem {
  id: string;
  type: 'logo' | 'image';

  // Visual assets
  imageUrl: string;
  thumbnailUrl?: string;  // Optimized for carousel

  // Template metadata
  templateId: string;  // Links to brandTemplates or contentTemplates
  templateName: string;

  // Brand context (for logos)
  brandName?: string;
  brandVibe?: string;  // "Rustic taproom" vs "Cozy cafe"

  // Generation details
  industry: string;
  generationPrompt: string;  // What created this image

  // User-facing information
  description: string;
  tags: string[];  // For filtering
  featured: boolean;  // Show in landing page carousel

  // Analytics & tracking
  trendScore?: number;  // 1-100, track popularity
  views?: number;
  clicks?: number;

  // Differentiation notes (internal)
  differentiationNote?: string;  // "Different from Daily Grind: Mobile cart vs cozy cafe"
}

export interface GalleryFilters {
  type?: 'all' | 'logo' | 'image';
  industry?: string;
  template?: string;
  tags?: string[];
}

export type GalleryItemType = 'logo' | 'image';
export type GalleryFilterType = 'all' | 'logos' | 'images' | 'industry' | 'template';
