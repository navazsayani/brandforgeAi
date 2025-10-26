"use client";

import React from 'react';
import { Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import TestimonialList from './TestimonialList';
import {
  getAllTestimonials,
  getFeaturedTestimonials,
  getRandomTestimonials,
  getTestimonialsByIndustry,
} from '@/lib/testimonials/testimonials-utils';
import type { Testimonial, TestimonialWithBrand, TestimonialLayout, TestimonialVariant } from '@/lib/testimonials/types';

export interface TestimonialSectionProps {
  // Content props
  title?: React.ReactNode;
  description?: string;
  testimonials?: (Testimonial | TestimonialWithBrand)[]; // Provide testimonials directly

  // Query props (used if testimonials not provided)
  count?: number; // How many testimonials to show
  featured?: boolean; // Show only featured testimonials
  industry?: string; // Filter by industry
  randomize?: boolean; // Randomize testimonials

  // Layout props
  layout?: TestimonialLayout;
  variant?: TestimonialVariant;
  columns?: 1 | 2 | 3 | 4;
  showBrandLogos?: boolean;
  showRating?: boolean;
  autoRotate?: boolean;

  // Section styling
  sectionClassName?: string;
  containerClassName?: string;
  showEyebrow?: boolean;
  eyebrowText?: string;
}

/**
 * TestimonialSection Component
 *
 * Complete testimonial section with heading, description, and testimonials.
 * Can fetch testimonials internally based on filters, or accept them as props.
 * Perfect for adding testimonials to any page.
 *
 * @example
 * ```tsx
 * // Auto-fetch featured testimonials
 * <TestimonialSection
 *   title="Loved by Entrepreneurs"
 *   count={3}
 *   featured={true}
 * />
 *
 * // Provide specific testimonials
 * <TestimonialSection
 *   testimonials={myTestimonials}
 *   layout="carousel"
 * />
 *
 * // Filter by industry
 * <TestimonialSection
 *   industry="Coffee Shop"
 *   count={1}
 *   variant="compact"
 * />
 * ```
 */
export default function TestimonialSection({
  title = 'Loved by Entrepreneurs & Creators',
  description = 'See what our users have to say about transforming their brands with AI',
  testimonials: providedTestimonials,
  count = 3,
  featured = true,
  industry,
  randomize = false,
  layout = 'grid',
  variant = 'default',
  columns = 3,
  showBrandLogos = true,
  showRating = false,
  autoRotate = false,
  sectionClassName,
  containerClassName,
  showEyebrow = true,
  eyebrowText = 'Testimonials',
}: TestimonialSectionProps) {
  // Get testimonials based on props
  const getTestimonials = (): (Testimonial | TestimonialWithBrand)[] => {
    // If testimonials provided directly, use them
    if (providedTestimonials && providedTestimonials.length > 0) {
      return providedTestimonials.slice(0, count);
    }

    // Otherwise, fetch based on filters
    if (industry) {
      const industryTestimonials = getTestimonialsByIndustry(industry);
      return randomize
        ? getRandomTestimonials(count, { industry })
        : industryTestimonials.slice(0, count);
    }

    if (featured) {
      return getFeaturedTestimonials(count);
    }

    if (randomize) {
      return getRandomTestimonials(count);
    }

    return getAllTestimonials().slice(0, count);
  };

  const displayTestimonials = getTestimonials();

  // Don't render if no testimonials
  if (!displayTestimonials || displayTestimonials.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-12 sm:py-16', sectionClassName)}>
      <div className={cn('container-responsive', containerClassName)}>
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Eyebrow */}
          {showEyebrow && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              <span>{eyebrowText}</span>
            </div>
          )}

          {/* Title */}
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              {title}
            </h2>
          )}

          {/* Description */}
          {description && (
            <p className="text-lg text-muted-foreground text-balance">
              {description}
            </p>
          )}
        </div>

        {/* Testimonials */}
        <TestimonialList
          testimonials={displayTestimonials}
          layout={layout}
          variant={variant}
          columns={columns}
          showBrandLogos={showBrandLogos}
          showRating={showRating}
          autoRotate={autoRotate}
        />
      </div>
    </section>
  );
}
