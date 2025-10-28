'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { getItemById, galleryItems } from '@/lib/inspiration/gallery-data';

interface GalleryLightboxProps {
  itemId: string | null;
  onClose: () => void;
}

export default function GalleryLightbox({ itemId, onClose }: GalleryLightboxProps) {
  const router = useRouter();
  const [currentItemId, setCurrentItemId] = useState<string | null>(itemId);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setCurrentItemId(itemId);
  }, [itemId]);

  // Keyboard navigation
  useEffect(() => {
    if (!currentItemId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentItemId]);

  const item = currentItemId ? getItemById(currentItemId) : null;

  if (!item) return null;

  // Get current index and navigation
  const currentIndex = galleryItems.findIndex(i => i.id === currentItemId);
  const totalItems = galleryItems.length;
  const prevItem = currentIndex > 0 ? galleryItems[currentIndex - 1] : null;
  const nextItem = currentIndex < galleryItems.length - 1 ? galleryItems[currentIndex + 1] : null;

  const handlePrevious = () => {
    if (prevItem && !isTransitioning) {
      setIsTransitioning(true);

      // Analytics
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('gallery_lightbox_navigate', {
          direction: 'previous',
          fromItemId: currentItemId,
          toItemId: prevItem.id,
        });
      }

      // Update state and URL
      setCurrentItemId(prevItem.id);
      window.history.replaceState({}, '', `/inspiration?item=${prevItem.id}`);

      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleNext = () => {
    if (nextItem && !isTransitioning) {
      setIsTransitioning(true);

      // Analytics
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('gallery_lightbox_navigate', {
          direction: 'next',
          fromItemId: currentItemId,
          toItemId: nextItem.id,
        });
      }

      // Update state and URL
      setCurrentItemId(nextItem.id);
      window.history.replaceState({}, '', `/inspiration?item=${nextItem.id}`);

      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleUseTemplate = () => {
    // Map gallery templateIds to actual system templates
    const galleryToSystemTemplateMap: Record<string, string> = {
      // Brand Templates - Map conceptual IDs to closest actual templates
      'craft_brewery': 'restaurant',           // Food/beverage business
      'meditation_app': 'online_course_creator', // Digital wellness/content
      'barbershop': 'beauty_salon',            // Personal care services
      'pilates_studio': 'yoga_studio',         // Fitness/wellness studio
      'plant_nursery': 'ecommerce_store',      // Retail/products
      'interior_design': 'consulting_business', // Professional services
      'juice_bar': 'restaurant',               // Food/beverage business

      // Content Templates - Images work differently, map to product_photo
      'food_photo': 'product_photo',           // Visual content

      // Templates that already exist - pass through
      'podcast_host': 'podcast_host',
      'tech_startup': 'tech_startup',
      'photography_studio': 'photography_studio',
      'real_estate_agent': 'real_estate_agent',
      'handmade_jewelry': 'handmade_jewelry',
      'pet_services': 'pet_services',
      'content_creator': 'content_creator',
      'coffee_shop': 'coffee_shop',
      'bakery': 'bakery',
      'yoga_studio': 'yoga_studio',
      'product_photo': 'product_photo',
      'hero_banner': 'hero_banner',
      'behind_scenes': 'behind_scenes',
      'quote_graphic': 'quote_graphic',
      'flat_lay': 'flat_lay',
      'promotional_badge': 'promotional_badge',
    };

    // Get mapped template ID (fallback to content_creator if not found)
    const systemTemplateId = galleryToSystemTemplateMap[item.templateId] || 'content_creator';

    // Analytics - track both original and mapped IDs
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('gallery_use_template', {
        itemId: item.id,
        galleryTemplateId: item.templateId, // Original
        systemTemplateId: systemTemplateId,  // Mapped
        type: item.type,
      });
    }

    // Redirect to signup with mapped template and inspiration reference
    router.push(`/signup?template=${systemTemplateId}&source=gallery&inspiration=${item.id}`);
  };

  return (
    <Dialog open={!!itemId} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background border border-border shadow-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Navigation Buttons */}
        {prevItem && (
          <button
            onClick={handlePrevious}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-background/80 hover:bg-background border border-border shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {nextItem && (
          <button
            onClick={handleNext}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-background/80 hover:bg-background border border-border shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Position Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-background/80 border border-border shadow-lg text-sm font-medium">
          {currentIndex + 1} / {totalItems}
        </div>

        <div className={`grid md:grid-cols-2 gap-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          {/* Image Side */}
          <div className="relative bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center p-8 md:p-12">
            <div className="relative rounded-lg border border-border/40 shadow-xl overflow-hidden bg-background/50 backdrop-blur-sm p-4">
              <NextImage
                src={item.imageUrl}
                alt={item.description}
                width={600}
                height={600}
                className="max-w-full max-h-[65vh] object-contain rounded"
              />
            </div>
          </div>

          {/* Details Side */}
          <div className="p-8 flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs capitalize">
                  {item.type === 'logo' ? 'Logo Design' : item.templateName}
                </Badge>
                {item.trendScore && item.trendScore >= 90 && item.templateId !== 'food_photo' && (
                  <Badge variant="outline" className="text-xs">🔥 Trending</Badge>
                )}
              </div>

              <h2 className="text-3xl font-bold mb-3">
                {item.type === 'logo' ? item.brandName : item.templateName}
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Key Details */}
            <div className="space-y-4 mb-6 flex-grow">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Category: </span>
                  <span className="text-sm font-semibold capitalize">{item.industry.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {item.brandVibe && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Style: </span>
                    <span className="text-sm font-semibold">{item.brandVibe}</span>
                  </div>
                </div>
              )}

              {/* Template Info */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border mt-4">
                <h3 className="text-sm font-semibold mb-2">About This Template</h3>
                <p className="text-sm text-muted-foreground">
                  {item.type === 'logo'
                    ? `Professional ${item.templateName} design that captures the essence of ${item.industry.replace(/_/g, ' ')} businesses. Perfect for building brand identity.`
                    : `High-quality ${item.templateName} template ideal for ${item.industry.replace(/_/g, ' ')} content. Great for social media, marketing, and web use.`
                  }
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mt-auto">
              <Button
                onClick={handleUseTemplate}
                className="w-full btn-gradient-primary"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create With This Template
              </Button>

              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={onClose}
              >
                Back to Gallery
              </Button>
            </div>

            {/* Navigation Hint */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Use ← → arrow keys to navigate • ESC to close
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
