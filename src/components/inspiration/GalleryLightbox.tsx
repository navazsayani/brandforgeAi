'use client';

import React from 'react';
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
  const item = itemId ? getItemById(itemId) : null;

  if (!item) return null;

  // Get current index and navigation
  const currentIndex = galleryItems.findIndex(i => i.id === itemId);
  const prevItem = currentIndex > 0 ? galleryItems[currentIndex - 1] : null;
  const nextItem = currentIndex < galleryItems.length - 1 ? galleryItems[currentIndex + 1] : null;

  const handlePrevious = () => {
    if (prevItem) {
      // Analytics
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('gallery_lightbox_navigate', {
          direction: 'previous',
          fromItemId: itemId,
          toItemId: prevItem.id,
        });
      }
      // Update URL or state without closing modal
      window.history.replaceState({}, '', `/inspiration?item=${prevItem.id}`);
    }
  };

  const handleNext = () => {
    if (nextItem) {
      // Analytics
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('gallery_lightbox_navigate', {
          direction: 'next',
          fromItemId: itemId,
          toItemId: nextItem.id,
        });
      }
      window.history.replaceState({}, '', `/inspiration?item=${nextItem.id}`);
    }
  };

  const handleUseTemplate = () => {
    // Analytics
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('gallery_use_template', {
        itemId: item.id,
        templateId: item.templateId,
        type: item.type,
      });
    }

    // Redirect to signup with template context
    router.push(`/signup?template=${item.templateId}&source=gallery`);
  };

  return (
    <Dialog open={!!itemId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Navigation Buttons */}
        {prevItem && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {nextItem && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <div className="grid md:grid-cols-2 gap-0 h-full">
          {/* Image Side */}
          <div className="relative bg-muted flex items-center justify-center p-8">
            <NextImage
              src={item.imageUrl}
              alt={item.description}
              width={600}
              height={600}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>

          {/* Details Side */}
          <div className="p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="capitalize">
                  {item.type === 'logo' ? 'Logo' : item.templateName}
                </Badge>
                {item.trendScore && item.trendScore > 85 && (
                  <Badge variant="outline">🔥 Trending</Badge>
                )}
              </div>

              <h2 className="text-2xl font-bold mb-2">
                {item.type === 'logo' ? item.brandName : item.templateName}
              </h2>

              <p className="text-muted-foreground">
                {item.description}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                  Industry
                </h3>
                <p className="capitalize">{item.industry.replace(/_/g, ' ')}</p>
              </div>

              {item.brandVibe && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                    Brand Vibe
                  </h3>
                  <p>{item.brandVibe}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                  Generation Prompt
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.generationPrompt}
                </p>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleUseTemplate}
                className="w-full btn-gradient-primary"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Use This Template
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
              Use arrow keys or buttons to navigate
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
