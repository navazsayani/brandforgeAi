/**
 * Testimonial Utility Functions
 *
 * Helper functions for querying and manipulating testimonial data.
 * Provides consistent interface for accessing testimonials across the app.
 */

import { allTestimonials, testimonialIndustries } from './testimonials-data';
import type { Testimonial, TestimonialWithBrand, TestimonialFilters } from './types';

/**
 * Get all testimonials
 * @returns All available testimonials
 */
export function getAllTestimonials(): TestimonialWithBrand[] {
  return allTestimonials;
}

/**
 * Get a specific testimonial by ID
 * @param id - Testimonial ID
 * @returns Testimonial or undefined
 */
export function getTestimonialById(id: string): TestimonialWithBrand | undefined {
  return allTestimonials.find((testimonial) => testimonial.id === id);
}

/**
 * Get testimonials by industry
 * @param industry - Industry name to filter by
 * @returns Testimonials matching the industry
 */
export function getTestimonialsByIndustry(industry: string): TestimonialWithBrand[] {
  return allTestimonials.filter((testimonial) => testimonial.brandIndustry === industry);
}

/**
 * Get featured testimonials
 * @param limit - Maximum number of testimonials to return
 * @returns Featured testimonials
 */
export function getFeaturedTestimonials(limit?: number): TestimonialWithBrand[] {
  const featured = allTestimonials.filter((testimonial) => testimonial.featured);
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * Get verified testimonials
 * @param limit - Maximum number of testimonials to return
 * @returns Verified testimonials
 */
export function getVerifiedTestimonials(limit?: number): TestimonialWithBrand[] {
  const verified = allTestimonials.filter((testimonial) => testimonial.verified);
  return limit ? verified.slice(0, limit) : verified;
}

/**
 * Get random testimonials
 * @param count - Number of testimonials to return
 * @param filters - Optional filters to apply before randomization
 * @returns Random selection of testimonials
 */
export function getRandomTestimonials(
  count: number = 3,
  filters?: TestimonialFilters
): TestimonialWithBrand[] {
  let testimonials = allTestimonials;

  // Apply filters if provided
  if (filters) {
    testimonials = filterTestimonials(testimonials, filters);
  }

  // Shuffle and return requested count
  const shuffled = [...testimonials].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get testimonials with brand context (only testimonials linked to brands)
 * @param limit - Maximum number of testimonials to return
 * @returns Testimonials with full brand information
 */
export function getTestimonialsWithBrands(limit?: number): TestimonialWithBrand[] {
  const withBrands = allTestimonials.filter((testimonial) => testimonial.brandId);
  return limit ? withBrands.slice(0, limit) : withBrands;
}

/**
 * Filter testimonials based on criteria
 * @param testimonials - Array of testimonials to filter
 * @param filters - Filter criteria
 * @returns Filtered testimonials
 */
export function filterTestimonials(
  testimonials: TestimonialWithBrand[],
  filters: TestimonialFilters
): TestimonialWithBrand[] {
  let filtered = testimonials;

  if (filters.industry) {
    filtered = filtered.filter((t) => t.brandIndustry === filters.industry);
  }

  if (filters.featured !== undefined) {
    filtered = filtered.filter((t) => t.featured === filters.featured);
  }

  if (filters.verified !== undefined) {
    filtered = filtered.filter((t) => t.verified === filters.verified);
  }

  if (filters.minRating) {
    filtered = filtered.filter((t) => t.rating && t.rating >= filters.minRating!);
  }

  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Get testimonials for a specific brand
 * @param brandId - Brand ID to get testimonials for
 * @returns Testimonials for the brand
 */
export function getTestimonialsForBrand(brandId: string): TestimonialWithBrand[] {
  return allTestimonials.filter((testimonial) => testimonial.brandId === brandId);
}

/**
 * Get all available industries with testimonials
 * @returns Array of unique industry names
 */
export function getTestimonialIndustries(): string[] {
  return testimonialIndustries;
}

/**
 * Search testimonials by text content
 * @param query - Search query
 * @returns Testimonials matching the query
 */
export function searchTestimonials(query: string): TestimonialWithBrand[] {
  const lowercaseQuery = query.toLowerCase();
  return allTestimonials.filter(
    (testimonial) =>
      testimonial.quote.toLowerCase().includes(lowercaseQuery) ||
      testimonial.author.toLowerCase().includes(lowercaseQuery) ||
      testimonial.role.toLowerCase().includes(lowercaseQuery) ||
      testimonial.brandName.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Get testimonial statistics
 * @returns Object with testimonial counts and stats
 */
export function getTestimonialStats() {
  const total = allTestimonials.length;
  const featured = allTestimonials.filter((t) => t.featured).length;
  const verified = allTestimonials.filter((t) => t.verified).length;
  const withBrands = allTestimonials.filter((t) => t.brandId).length;
  const industries = testimonialIndustries.length;

  return {
    total,
    featured,
    verified,
    withBrands,
    standalone: total - withBrands,
    industries,
  };
}
