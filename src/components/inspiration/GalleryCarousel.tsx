'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getFeaturedItems } from '@/lib/inspiration/gallery-data';
import type { GalleryItem } from '@/lib/inspiration/gallery-types';

interface GalleryCarouselProps {
  itemCount?: number;
  autoScroll?: boolean;
  scrollSpeed?: number; // pixels per second
}

export default function GalleryCarousel({
  itemCount = 12,
  autoScroll = true,
  scrollSpeed = 30,
}: GalleryCarouselProps) {
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const featuredItems = getFeaturedItems(itemCount);

  // Duplicate items for seamless infinite scroll
  const items = [...featuredItems, ...featuredItems];

  // Auto-scroll effect using requestAnimationFrame for smooth mobile performance
  useEffect(() => {
    if (!autoScroll || isPaused) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let lastTimestamp = 0;

    const scroll = (timestamp: number) => {
      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
      }

      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Calculate scroll increment based on actual time elapsed
      const increment = (scrollSpeed * deltaTime) / 1000; // pixels per millisecond

      setScrollPosition(prev => {
        const maxScroll = container.scrollWidth / 2;
        const newPosition = prev + increment;

        // Seamless infinite scroll using modulo
        return newPosition >= maxScroll ? newPosition - maxScroll : newPosition;
      });

      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [autoScroll, isPaused, scrollSpeed]);

  // Apply scroll position with direct scrollLeft update
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollLeft = scrollPosition;
    }
  }, [scrollPosition]);

  const handleItemClick = (item: GalleryItem) => {
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('gallery_carousel_click', {
        itemId: item.id,
        templateId: item.templateId,
        type: item.type,
      });
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      <div className="container-responsive">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI-Generated Visuals</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See What Our <span className="text-gradient-brand">AI Creates</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real examples from our image & logo templates. Beautiful, professional visuals generated in seconds.
          </p>
        </div>

        {/* Infinite Scroll Container */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-scroll py-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              willChange: 'scroll-position',
            }}
          >
            {items.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="shrink-0 w-64 group cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                <Link href="/inspiration" className="block">
                  <div className="relative rounded-xl overflow-hidden border-2 border-border/30 shadow-lg hover:shadow-2xl hover:border-primary/40 transition-all duration-300">
                    {/* Image */}
                    <div className="relative aspect-square bg-muted">
                      <NextImage
                        src={item.imageUrl}
                        alt={item.description}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 256px, 256px"
                      />

                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Hover Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 text-center">
                        <p className="text-white font-semibold text-lg mb-1">
                          {item.type === 'logo' ? item.brandName : item.templateName}
                        </p>
                        <p className="text-white/80 text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-card">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {item.type === 'logo' ? 'Logo' : item.templateName}
                        </Badge>

                        {item.trendScore && item.trendScore >= 90 && item.templateId !== 'food_photo' && (
                          <Badge variant="outline" className="text-xs">
                            🔥 Trending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Gradient Fades on Edges */}
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-background via-background/50 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-background via-background/50 to-transparent pointer-events-none" />
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link href="/inspiration">
            <Button variant="outline" size="lg" className="group">
              Explore Full Gallery
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
