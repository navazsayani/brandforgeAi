"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TestimonialCard from './TestimonialCard';
import type { Testimonial, TestimonialWithBrand, TestimonialLayout, TestimonialVariant } from '@/lib/testimonials/types';

export interface TestimonialListProps {
  testimonials: (Testimonial | TestimonialWithBrand)[];
  layout?: TestimonialLayout;
  variant?: TestimonialVariant;
  columns?: 1 | 2 | 3 | 4;
  showBrandLogos?: boolean;
  showRating?: boolean;
  showNavigation?: boolean;
  autoRotate?: boolean;
  autoRotateInterval?: number;
  onTestimonialClick?: (testimonial: Testimonial | TestimonialWithBrand) => void;
  className?: string;
}

/**
 * TestimonialList Component
 *
 * Displays multiple testimonials in various layouts (grid, carousel, list).
 * Responsive and supports auto-rotation for carousel mode.
 *
 * @example
 * ```tsx
 * <TestimonialList
 *   testimonials={testimonials}
 *   layout="grid"
 *   columns={3}
 *   variant="default"
 * />
 * ```
 */
export default function TestimonialList({
  testimonials,
  layout = 'grid',
  variant = 'default',
  columns = 3,
  showBrandLogos = false,
  showRating = true,
  showNavigation = true,
  autoRotate = false,
  autoRotateInterval = 5000,
  onTestimonialClick,
  className,
}: TestimonialListProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotation for carousel
  useEffect(() => {
    if (layout !== 'carousel' || !autoRotate || isPaused || testimonials.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoRotateInterval);

    return () => clearInterval(timer);
  }, [layout, autoRotate, isPaused, testimonials.length, autoRotateInterval]);

  // Navigation handlers
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Empty state
  if (!testimonials || testimonials.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-muted-foreground">No testimonials available.</p>
      </div>
    );
  }

  // List layout - vertical stack
  if (layout === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={(testimonial as any).id || index}
            testimonial={testimonial}
            variant={variant}
            showBrandLogo={showBrandLogos}
            showRating={showRating}
            onClick={onTestimonialClick ? () => onTestimonialClick(testimonial) : undefined}
          />
        ))}
      </div>
    );
  }

  // Carousel layout - single item with navigation
  if (layout === 'carousel') {
    const currentTestimonial = testimonials[currentIndex];

    return (
      <div
        className={cn('relative', className)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Current testimonial */}
        <div className="transition-opacity duration-500">
          <TestimonialCard
            testimonial={currentTestimonial}
            variant={variant}
            showBrandLogo={showBrandLogos}
            showRating={showRating}
            onClick={onTestimonialClick ? () => onTestimonialClick(currentTestimonial) : undefined}
          />
        </div>

        {/* Navigation controls */}
        {showNavigation && testimonials.length > 1 && (
          <>
            {/* Previous/Next buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                disabled={testimonials.length <= 1}
                className="shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Indicators */}
              <div className="flex gap-2 mx-4">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                disabled={testimonials.length <= 1}
                className="shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Counter */}
            <div className="text-center mt-4 text-sm text-muted-foreground">
              {currentIndex + 1} of {testimonials.length}
            </div>
          </>
        )}
      </div>
    );
  }

  // Masonry layout - Pinterest-style (future enhancement, for now use grid)
  if (layout === 'masonry') {
    // For now, fall back to grid. Can be enhanced with a masonry library later
    return (
      <div
        className={cn(
          'grid gap-6',
          columns === 1 && 'grid-cols-1',
          columns === 2 && 'grid-cols-1 md:grid-cols-2',
          columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className
        )}
      >
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={(testimonial as any).id || index}
            testimonial={testimonial}
            variant={variant}
            showBrandLogo={showBrandLogos}
            showRating={showRating}
            onClick={onTestimonialClick ? () => onTestimonialClick(testimonial) : undefined}
          />
        ))}
      </div>
    );
  }

  // Grid layout (default) - responsive grid
  return (
    <div
      className={cn(
        'grid gap-6',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {testimonials.map((testimonial, index) => (
        <TestimonialCard
          key={(testimonial as any).id || index}
          testimonial={testimonial}
          variant={variant}
          showBrandLogo={showBrandLogos}
          showRating={showRating}
          onClick={onTestimonialClick ? () => onTestimonialClick(testimonial) : undefined}
        />
      ))}
    </div>
  );
}
