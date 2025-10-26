"use client";

import React from 'react';
import NextImage from 'next/image';
import { Star, Quote, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Testimonial, TestimonialWithBrand, TestimonialVariant } from '@/lib/testimonials/types';

export interface TestimonialCardProps {
  testimonial: Testimonial | TestimonialWithBrand;
  variant?: TestimonialVariant;
  showBrandLogo?: boolean;
  showRating?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * TestimonialCard Component
 *
 * Displays a single testimonial with avatar, quote, and author information.
 * Supports multiple variants for different use cases.
 *
 * @example
 * ```tsx
 * <TestimonialCard
 *   testimonial={testimonial}
 *   variant="featured"
 *   showBrandLogo={true}
 * />
 * ```
 */
export default function TestimonialCard({
  testimonial,
  variant = 'default',
  showBrandLogo = false,
  showRating = true,
  onClick,
  className,
}: TestimonialCardProps) {
  const isBrandTestimonial = 'brandName' in testimonial && testimonial.brandName;
  const hasRating = testimonial.rating && testimonial.rating > 0;

  // Get initials for avatar fallback
  const initials = testimonial.author
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Render star rating
  const renderStars = () => {
    if (!hasRating || !showRating) return null;

    return (
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              'w-4 h-4',
              index < (testimonial.rating || 0)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  // Minimal variant - just quote and author
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-4',
          onClick && 'cursor-pointer hover:bg-muted/50 rounded-lg transition-colors',
          className
        )}
        onClick={onClick}
      >
        <Avatar className="w-18 h-18 shrink-0">
          <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground italic mb-2">&ldquo;{testimonial.quote}&rdquo;</p>
          <p className="text-sm font-semibold">{testimonial.author}</p>
          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    );
  }

  // Compact variant - smaller card
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'group hover:border-primary/50 transition-all',
          onClick && 'cursor-pointer hover:shadow-lg',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-18 h-18 shrink-0">
              <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{testimonial.author}</p>
              <p className="text-xs text-muted-foreground truncate">{testimonial.role}</p>
            </div>
          </div>

          {renderStars()}

          <p className="text-sm text-muted-foreground italic line-clamp-3">&ldquo;{testimonial.quote}&rdquo;</p>

          {testimonial.location && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{testimonial.location}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Featured variant - large, prominent display
  if (variant === 'featured') {
    return (
      <Card
        className={cn(
          'group relative overflow-hidden border-2 hover:border-primary/50 hover:shadow-xl transition-all',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        <CardContent className="relative p-6 md:p-8">
          {/* Quote icon */}
          <div className="mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Quote className="w-6 h-6 text-primary" />
            </div>
          </div>

          {renderStars()}

          {/* Quote */}
          <blockquote className="text-lg md:text-xl text-foreground mb-6 italic leading-relaxed">
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>

          {/* Author section */}
          <div className="flex items-center gap-4">
            <Avatar className="w-18 h-18 shrink-0 ring-2 ring-primary/10">
              <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg">{testimonial.author}</p>
              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              {testimonial.location && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{testimonial.location}</span>
                </div>
              )}
            </div>

            {/* Brand logo */}
            {showBrandLogo && isBrandTestimonial && (
              <div className="shrink-0">
                <NextImage
                  src={(testimonial as TestimonialWithBrand).brandLogo}
                  alt={(testimonial as TestimonialWithBrand).brandName}
                  width={48}
                  height={48}
                  className="object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Verified badge */}
          {testimonial.verified && (
            <Badge variant="secondary" className="mt-4">
              ✓ Verified Customer
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant - standard card
  return (
    <Card
      className={cn(
        'group h-full hover:border-primary/50 hover:shadow-lg transition-all',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col h-full">
        {/* Stars at top */}
        {renderStars()}

        {/* Quote */}
        <blockquote className="text-base text-muted-foreground italic mb-6 flex-grow">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Author section */}
        <div className="flex items-center gap-3">
          <Avatar className="w-18 h-18 shrink-0">
            <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold">{testimonial.author}</p>
            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
            {testimonial.location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{testimonial.location}</span>
              </div>
            )}
          </div>

          {/* Brand logo for default variant */}
          {showBrandLogo && isBrandTestimonial && (
            <div className="shrink-0">
              <NextImage
                src={(testimonial as TestimonialWithBrand).brandLogo}
                alt={(testimonial as TestimonialWithBrand).brandName}
                width={40}
                height={40}
                className="object-contain rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>

        {/* Verified badge */}
        {testimonial.verified && (
          <Badge variant="outline" className="mt-3 w-fit text-xs">
            ✓ Verified
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
