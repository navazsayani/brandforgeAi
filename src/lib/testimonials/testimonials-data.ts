/**
 * Testimonials Data Store
 *
 * Centralized data source for all testimonials across the application.
 * Supports both showcase-linked testimonials and standalone testimonials.
 *
 * To add a new testimonial:
 * 1. Add testimonial object to `standaloneTestimonials` array (or link to showcase brand)
 * 2. Ensure avatar image exists in /public directory
 * 3. Testimonial will automatically be available via utility functions
 */

import { showcaseExamples } from '@/lib/showcase/showcase-data';
import type { Testimonial, TestimonialWithBrand } from './types';

/**
 * Standalone testimonials not linked to showcase brands
 * Add new testimonials here for easy management
 */
export const standaloneTestimonials: Testimonial[] = [
  // Example standalone testimonial (commented out - add when you have real ones)
  // {
  //   id: 'john-smith-marketing',
  //   quote: 'BrandForge AI transformed how we create content. What used to take days now takes minutes.',
  //   author: 'John Smith',
  //   role: 'Marketing Director',
  //   location: 'New York, NY',
  //   avatar: '/testimonials/avatars/john-smith.jpg',
  //   rating: 5,
  //   featured: true,
  //   verified: true,
  // },
];

/**
 * Get all testimonials from showcase brands
 * Automatically extracts testimonials from showcase data
 */
function getShowcaseTestimonials(): TestimonialWithBrand[] {
  return showcaseExamples.map((brand) => ({
    ...brand.testimonial,
    id: `showcase-${brand.id}`,
    brandId: brand.id,
    brandName: brand.brandName,
    brandIndustry: brand.industry,
    brandLogo: brand.logo,
    // Default featured flag for showcase testimonials
    featured: true,
  }));
}

/**
 * Combined array of all testimonials (showcase + standalone)
 * This is the main data source used by utility functions
 */
export const allTestimonials: TestimonialWithBrand[] = [
  ...getShowcaseTestimonials(),
  // Map standalone testimonials to include empty brand context
  ...standaloneTestimonials.map(
    (testimonial): TestimonialWithBrand => ({
      ...testimonial,
      id: testimonial.id || `standalone-${testimonial.author.toLowerCase().replace(/\s+/g, '-')}`,
      brandName: '',
      brandIndustry: '',
      brandLogo: '',
      brandId: '',
    })
  ),
];

/**
 * Export count for easy reference
 */
export const testimonialsCount = allTestimonials.length;

/**
 * Industries with testimonials (for filtering)
 */
export const testimonialIndustries = Array.from(
  new Set(allTestimonials.filter((t) => t.brandIndustry).map((t) => t.brandIndustry))
);
