/**
 * Testimonial Types
 *
 * Enhanced types for testimonials with future-ready fields
 * Supports both showcase-linked and standalone testimonials
 */

/**
 * Core testimonial interface with all possible fields
 */
export interface Testimonial {
  id?: string; // Unique identifier (optional for showcase testimonials)
  quote: string; // Testimonial text
  author: string; // Person's name
  role: string; // Job title/position
  location?: string; // City, State or Country
  avatar: string; // Path to avatar image

  // Optional enhanced fields for future use
  rating?: 1 | 2 | 3 | 4 | 5; // Star rating
  date?: string; // When testimonial was given (ISO date string)
  brandId?: string; // Link to showcase brand
  featured?: boolean; // Should this be featured prominently?
  verified?: boolean; // Is this a verified testimonial?
  videoUrl?: string; // Optional video testimonial URL
  brandLogo?: string; // Optional brand logo override
}

/**
 * Testimonial with full brand context
 * Used when displaying testimonial alongside brand information
 */
export interface TestimonialWithBrand extends Testimonial {
  brandName: string;
  brandIndustry: string;
  brandLogo: string;
  brandId: string;
}

/**
 * Filter options for querying testimonials
 */
export interface TestimonialFilters {
  industry?: string;
  featured?: boolean;
  minRating?: number;
  verified?: boolean;
  limit?: number;
}

/**
 * Layout variants for testimonial components
 */
export type TestimonialLayout = 'grid' | 'carousel' | 'list' | 'masonry';

/**
 * Display variants for testimonial cards
 */
export type TestimonialVariant = 'default' | 'compact' | 'minimal' | 'featured';
