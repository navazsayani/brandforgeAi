/**
 * Testimonials Library
 *
 * Centralized exports for testimonial data, types, and utilities
 */

// Data
export { allTestimonials, standaloneTestimonials, testimonialsCount, testimonialIndustries } from './testimonials-data';

// Types
export type {
  Testimonial,
  TestimonialWithBrand,
  TestimonialFilters,
  TestimonialLayout,
  TestimonialVariant,
} from './types';

// Utilities
export {
  getAllTestimonials,
  getTestimonialById,
  getTestimonialsByIndustry,
  getFeaturedTestimonials,
  getVerifiedTestimonials,
  getRandomTestimonials,
  getTestimonialsWithBrands,
  filterTestimonials,
  getTestimonialsForBrand,
  getTestimonialIndustries,
  searchTestimonials,
  getTestimonialStats,
} from './testimonials-utils';
