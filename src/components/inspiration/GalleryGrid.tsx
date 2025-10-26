'use client';

import React, { useState, useMemo } from 'react';
import GalleryCard from './GalleryCard';
import GalleryFilters from './GalleryFilters';
import GalleryLightbox from './GalleryLightbox';
import { galleryItems, getItemsByType, getItemsByIndustry, getItemsByTemplate } from '@/lib/inspiration/gallery-data';

export default function GalleryGrid() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Filter items based on selected filter
  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') {
      return galleryItems;
    } else if (selectedFilter === 'logo' || selectedFilter === 'image') {
      return getItemsByType(selectedFilter);
    } else if (selectedFilter.startsWith('industry:')) {
      const industry = selectedFilter.replace('industry:', '');
      return getItemsByIndustry(industry);
    } else if (selectedFilter.startsWith('template:')) {
      const templateId = selectedFilter.replace('template:', '');
      return getItemsByTemplate(templateId);
    }
    return galleryItems;
  }, [selectedFilter]);

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);

    // Analytics
    if (typeof window !== 'undefined' && (window as any).analytics) {
      const item = galleryItems.find(i => i.id === itemId);
      (window as any).analytics.track('gallery_item_view', {
        itemId,
        templateId: item?.templateId,
        type: item?.type,
        source: 'gallery_grid',
      });
    }
  };

  const handleCloseLightbox = () => {
    setSelectedItemId(null);
  };

  return (
    <>
      {/* Filters */}
      <GalleryFilters
        selectedFilter={selectedFilter}
        onChange={setSelectedFilter}
      />

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Showing <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Masonry Grid */}
      {filteredItems.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filteredItems.map(item => (
            <GalleryCard
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No items found matching your filters.</p>
          <button
            onClick={() => setSelectedFilter('all')}
            className="text-primary hover:underline mt-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      <GalleryLightbox
        itemId={selectedItemId}
        onClose={handleCloseLightbox}
      />
    </>
  );
}
