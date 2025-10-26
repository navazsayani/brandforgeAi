"use client";

import React, { useState } from 'react';
import { X, ArrowRight, ChevronLeft, ChevronRight, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SocialMediaPreviews from '@/components/SocialMediaPreviews';
import { getShowcaseById } from '@/lib/showcase/showcase-data';
import { cn } from '@/lib/utils';

interface ShowcasePreviewModalProps {
  showcaseId: string;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate?: () => void;
}

const platformIcons = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
};

export default function ShowcasePreviewModal({
  showcaseId,
  isOpen,
  onClose,
  onUseTemplate,
}: ShowcasePreviewModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [currentPostIndex, setCurrentPostIndex] = useState(0);

  const showcase = getShowcaseById(showcaseId);

  if (!showcase) {
    return null;
  }

  // Map platforms to different posts for variety
  const platformPostMap: Record<string, number> = {
    instagram: 0, // Post 1
    twitter: Math.min(1, showcase.posts.length - 1), // Post 2 (if available)
    facebook: Math.min(2, showcase.posts.length - 1), // Post 3 (if available)
    linkedin: 0, // Post 1 (same as Instagram)
  };

  // Get the post based on selected platform
  const currentPost = showcase.posts[platformPostMap[selectedPlatform] || 0];
  const hasMultiplePosts = showcase.posts.length > 1;

  const goToPreviousPost = () => {
    setCurrentPostIndex((prev) => (prev - 1 + showcase.posts.length) % showcase.posts.length);
  };

  const goToNextPost = () => {
    setCurrentPostIndex((prev) => (prev + 1) % showcase.posts.length);
  };

  // Handle platform change - show different post per platform
  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        {/* Sticky Header with Platform Switcher */}
        <div className="shrink-0 bg-background border-b">
          <DialogHeader className="p-4 md:p-6 pb-3">
            <div className="flex-1">
              <DialogTitle className="text-xl md:text-2xl">{showcase.brandName}</DialogTitle>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{showcase.industry}</p>
            </div>
          </DialogHeader>

          {/* Platform Switcher - Always visible */}
          <div className="flex items-center justify-center gap-2 pb-4 px-4">
            {(['instagram', 'twitter', 'facebook', 'linkedin'] as const).map((platform) => {
              const Icon = platformIcons[platform];
              return (
                <button
                  key={platform}
                  onClick={() => handlePlatformChange(platform)}
                  className={cn(
                    "p-2.5 md:p-3 rounded-lg border-2 transition-all",
                    selectedPlatform === platform
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={platform}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4">
            {/* Main Preview - Reduced padding */}
            <div className="flex justify-center bg-muted/20 rounded-lg p-2 md:p-4">
              <div className="w-full max-w-md">
                <SocialMediaPreviews
                  caption={currentPost.caption}
                  hashtags={currentPost.hashtags}
                  imageSrc={currentPost.image}
                  brandName={showcase.brandName}
                  brandLogoUrl={showcase.logo}
                  selectedPlatform={selectedPlatform}
                />
              </div>
            </div>

            {/* Generation Time Badge */}
            <div className="text-center">
              <Badge variant="outline">
                ✨ Generated in {currentPost.generationTime}
              </Badge>
            </div>
          </div>
        </div>

        {/* Sticky CTA Footer */}
        {onUseTemplate && (
          <div className="shrink-0 border-t bg-background p-4 md:p-6">
            <Button
              onClick={() => {
                onUseTemplate();
                onClose();
              }}
              className="w-full btn-gradient-primary"
              size="lg"
            >
              Use This Template
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
