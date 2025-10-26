'use client';

import React from 'react';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { GalleryItem } from '@/lib/inspiration/gallery-types';

interface GalleryCardProps {
  item: GalleryItem;
  onClick: () => void;
}

export default function GalleryCard({ item, onClick }: GalleryCardProps) {
  return (
    <div
      className="break-inside-avoid mb-4 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative rounded-lg overflow-hidden border-2 border-border/30 shadow-md hover:shadow-2xl hover:border-primary/50 transition-all duration-300">
        {/* Image */}
        <div className="relative bg-muted">
          <NextImage
            src={item.imageUrl}
            alt={item.description}
            width={400}
            height={item.type === 'logo' ? 400 : 300}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Hover Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 text-center">
            <p className="text-white font-semibold text-base mb-1">
              {item.type === 'logo' ? item.brandName : item.templateName}
            </p>
            <p className="text-white/80 text-sm line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-card">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge variant="secondary" className="text-xs capitalize">
              {item.type === 'logo' ? 'Logo' : item.templateName}
            </Badge>

            {item.trendScore && item.trendScore > 85 && (
              <Badge variant="outline" className="text-xs">
                🔥 Trending
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.industry.replace(/_/g, ' ')}
          </p>
        </div>
      </div>
    </div>
  );
}
