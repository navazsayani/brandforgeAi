"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SocialMediaPreviews from '@/components/SocialMediaPreviews';
import { getShowcaseById, getRandomShowcases } from '@/lib/showcase/showcase-data';
import type { ShowcaseBrand } from '@/lib/showcase/types';
import NextImage from 'next/image';

interface ShowcaseCarouselProps {
  showcaseIds?: string[];
  defaultTab?: 'logo' | 'instagram' | 'all-platforms';
  showTabs?: boolean;
  platforms?: ('instagram' | 'twitter' | 'facebook' | 'linkedin')[];
  autoRotate?: boolean;
  interval?: number;
  className?: string;
}

export default function ShowcaseCarousel({
  showcaseIds,
  defaultTab = 'instagram',
  showTabs = true,
  platforms = ['instagram', 'twitter', 'facebook', 'linkedin'],
  autoRotate = true,
  interval = 6000,
  className = '',
}: ShowcaseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [isPaused, setIsPaused] = useState(false);

  // Get showcase examples
  const showcases: ShowcaseBrand[] = showcaseIds
    ? showcaseIds.map(id => getShowcaseById(id)).filter(Boolean) as ShowcaseBrand[]
    : getRandomShowcases(3);

  const currentShowcase = showcases[currentIndex];

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || isPaused || !currentShowcase) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcases.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoRotate, isPaused, showcases.length, interval, currentShowcase]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + showcases.length) % showcases.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % showcases.length);
  };

  if (!currentShowcase || showcases.length === 0) {
    return null;
  }

  const currentPost = currentShowcase.posts[0]; // Show first post

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Card className="p-6">
        {/* Tabs */}
        {showTabs && (
          <div className="flex justify-center gap-2 mb-6">
            <Button
              variant={currentTab === 'logo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTab('logo')}
            >
              Logo
            </Button>
            <Button
              variant={currentTab === 'instagram' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTab('instagram')}
            >
              Instagram
            </Button>
            <Button
              variant={currentTab === 'all-platforms' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTab('all-platforms')}
            >
              All Platforms
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
          {/* Logo Tab */}
          {currentTab === 'logo' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-12 mb-6">
                <NextImage
                  src={currentShowcase.logo}
                  alt={currentShowcase.brandName}
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </div>
              <h4 className="text-xl font-bold mb-2">{currentShowcase.brandName}</h4>
              <p className="text-muted-foreground mb-4">{currentShowcase.industry}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {currentShowcase.logoType && (
                  <Badge variant="secondary">{currentShowcase.logoType}</Badge>
                )}
                {currentShowcase.logoStyle && (
                  <Badge variant="secondary">{currentShowcase.logoStyle}</Badge>
                )}
                {currentShowcase.logoShape && (
                  <Badge variant="secondary">{currentShowcase.logoShape}</Badge>
                )}
              </div>
              <Badge className="mt-4" variant="outline">
                ✨ Generated in 25 seconds
              </Badge>
            </div>
          )}

          {/* Instagram Tab */}
          {currentTab === 'instagram' && (
            <div className="flex justify-center">
              <div className="max-w-md w-full">
                <SocialMediaPreviews
                  caption={currentPost.caption}
                  hashtags={currentPost.hashtags}
                  imageSrc={currentPost.image}
                  brandName={currentShowcase.brandName}
                  brandLogoUrl={currentShowcase.logo}
                  selectedPlatform="instagram"
                />
                <div className="text-center mt-4">
                  <Badge variant="outline">
                    ✨ Generated in {currentPost.generationTime}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* All Platforms Tab */}
          {currentTab === 'all-platforms' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <div key={platform} className="border rounded-lg p-2">
                    <div className="mb-2 text-center">
                      <Badge variant="secondary" className="capitalize">
                        {platform}
                      </Badge>
                    </div>
                    <div className="transform scale-75 origin-top">
                      <SocialMediaPreviews
                        caption={currentPost.caption}
                        hashtags={currentPost.hashtags}
                        imageSrc={currentPost.image}
                        brandName={currentShowcase.brandName}
                        brandLogoUrl={currentShowcase.logo}
                        selectedPlatform={platform}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Badge variant="outline">
                  ✨ All platforms generated in 30 seconds
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={showcases.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Indicators */}
          <div className="flex gap-2">
            {showcases.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to example ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={showcases.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Brand Name Footer */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          <span className="font-medium">{currentShowcase.brandName}</span>
          {' • '}
          <span>{currentShowcase.industry}</span>
        </div>
      </Card>
    </div>
  );
}
