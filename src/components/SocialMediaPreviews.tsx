
"use client";

import React from 'react';
import NextImage from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Repeat2, Share, Play, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialMediaPreviewsProps {
  caption: string;
  hashtags: string;
  imageSrc?: string | null;
  brandName?: string;
  brandLogoUrl?: string | null;
  className?: string;
  selectedPlatform?: string; // New prop to control which platforms to show
  selectedLanguage?: string; // New prop for language context
}

interface MockupProps {
  caption: string;
  hashtags: string;
  imageSrc?: string | null;
  brandName?: string;
  brandLogoUrl?: string | null;
}

// Instagram Mockup Component
const InstagramMockup: React.FC<MockupProps & { aspectRatio?: string }> = ({
  caption,
  hashtags,
  imageSrc,
  brandName = "YourBrand",
  brandLogoUrl,
  aspectRatio = "1:1"
}) => {
  const combinedText = `${caption}\n\n${hashtags}`;
  const truncatedText = combinedText.length > 125 ? `${combinedText.substring(0, 125)}...` : combinedText;
  const username = brandName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  
  // Determine aspect ratio class based on platform requirements
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "1:1": return "aspect-square";
      case "4:5": return "aspect-[4/5]";
      case "9:16": return "aspect-[9/16]";
      default: return "aspect-square";
    }
  };
  
  return (
    <Card className="bg-card text-foreground border shadow-lg rounded-xl overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-card ring-primary/50 p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-card flex items-center justify-center">
              {brandLogoUrl ? (
                <NextImage
                  src={brandLogoUrl}
                  alt={`${brandName} Logo`}
                  width={32}
                  height={32}
                  className="object-contain rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">{brandName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <p className="font-semibold text-sm text-foreground">{username}</p>
              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Sponsored</p>
          </div>
        </div>
        <MoreHorizontal className="w-6 h-6 text-muted-foreground" />
      </div>
      
      {/* Image */}
      {imageSrc && (
        <div className="relative bg-muted/50">
          <div className={cn("relative", getAspectRatioClass(aspectRatio))}>
            <NextImage
              src={imageSrc}
              alt="Instagram post"
              fill
              className="object-cover"
              sizes="400px"
            />
            {/* Instagram-style overlay elements */}
            <div className="absolute top-4 right-4">
              <div className="bg-black/40 backdrop-blur-sm rounded-full p-2">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Heart className="w-7 h-7 text-foreground hover:text-red-500 cursor-pointer transition-colors" />
            <MessageCircle className="w-7 h-7 text-foreground hover:text-muted-foreground cursor-pointer transition-colors" />
            <Send className="w-7 h-7 text-foreground hover:text-muted-foreground cursor-pointer transition-colors" />
          </div>
          <Bookmark className="w-7 h-7 text-foreground hover:text-muted-foreground cursor-pointer transition-colors" />
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">2,847 likes</p>
          
          <div className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold">{username} </span>
            <span className="whitespace-pre-wrap">{truncatedText}</span>
            {combinedText.length > 125 && (
              <button className="text-muted-foreground ml-1 font-medium">more</button>
            )}
          </div>
          
          <button className="text-sm text-muted-foreground font-medium">View all 47 comments</button>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">2 HOURS AGO</p>
        </div>
      </div>
    </Card>
  );
};

// Twitter/X Mockup Component
const TwitterMockup: React.FC<MockupProps> = ({ caption, hashtags, imageSrc, brandName = "YourBrand", brandLogoUrl }) => {
  const combinedText = `${caption} ${hashtags}`;
  const twitterHandle = brandName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  
  return (
    <Card className="bg-card text-foreground border shadow-lg rounded-xl overflow-hidden max-w-sm mx-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-muted">
            {brandLogoUrl ? (
              <NextImage
                src={brandLogoUrl}
                alt={`${brandName} Logo`}
                width={48}
                height={48}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground text-lg font-bold">{brandName.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 mb-1">
              <p className="font-bold text-base text-foreground truncate">{brandName}</p>
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <p className="text-sm truncate">@{twitterHandle}</p>
              <span>·</span>
              <p className="text-sm">2h</p>
            </div>
          </div>
          <MoreHorizontal className="w-5 h-5 text-muted-foreground mt-1" />
        </div>
        
        {/* Content */}
        <div className="mb-4">
          <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">{combinedText}</p>
        </div>
        
        {/* Image */}
        {imageSrc && (
          <div className="mb-4 rounded-2xl overflow-hidden border">
            <div className="aspect-video relative bg-muted">
              <NextImage
                src={imageSrc}
                alt="Twitter post"
                fill
                className="object-cover"
                sizes="400px"
              />
            </div>
          </div>
        )}
        
        {/* Engagement Stats */}
        <div className="text-sm text-muted-foreground mb-3 border-b border-border pb-3">
          <span className="font-semibold text-foreground">12:34 PM</span>
          <span className="mx-1">·</span>
          <span>Dec 15, 2024</span>
          <span className="mx-1">·</span>
          <span className="font-semibold text-foreground">1.2M</span>
          <span className="ml-1">Views</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between text-muted-foreground max-w-md">
          <div className="flex items-center space-x-2 hover:text-blue-500 cursor-pointer transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">127</span>
          </div>
          <div className="flex items-center space-x-2 hover:text-green-500 cursor-pointer transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
              <Repeat2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">89</span>
          </div>
          <div className="flex items-center space-x-2 hover:text-red-500 cursor-pointer transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">2.1K</span>
          </div>
          <div className="flex items-center space-x-2 hover:text-blue-500 cursor-pointer transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
              <Share className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Facebook Mockup Component
const FacebookMockup: React.FC<MockupProps> = ({ caption, hashtags, imageSrc, brandName = "YourBrand", brandLogoUrl }) => {
  const combinedText = `${caption}\n\n${hashtags}`;
  
  return (
    <Card className="bg-card text-foreground border shadow-lg rounded-xl overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
              {brandLogoUrl ? (
                <NextImage
                  src={brandLogoUrl}
                  alt={`${brandName} Logo`}
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">{brandName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <p className="font-semibold text-base text-foreground">{brandName}</p>
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  Sponsored
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>2h</span>
                <span>·</span>
                <span>🌍</span>
              </div>
            </div>
          </div>
          <MoreHorizontal className="w-6 h-6 text-muted-foreground" />
        </div>
        
        {/* Content */}
        <div className="mb-3">
          <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">{combinedText}</p>
        </div>
      </div>
      
      {/* Image */}
      {imageSrc && (
        <div className="relative bg-muted">
          <div className="aspect-video relative">
            <NextImage
              src={imageSrc}
              alt="Facebook post"
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="p-4 bg-card">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">👍</div>
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">❤️</div>
              <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">😊</div>
            </div>
            <span className="ml-2">You and 1,847 others</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>156 comments</span>
            <span>23 shares</span>
          </div>
        </div>
        
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-around">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:bg-accent/50 px-4 py-2 rounded-lg transition-colors">
              <Heart className="w-5 h-5" />
              <span className="font-medium">Like</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:bg-accent/50 px-4 py-2 rounded-lg transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:bg-accent/50 px-4 py-2 rounded-lg transition-colors">
              <Share className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// LinkedIn Mockup Component
const LinkedInMockup: React.FC<MockupProps> = ({ caption, hashtags, imageSrc, brandName = "YourBrand", brandLogoUrl }) => {
  const combinedText = `${caption}\n\n${hashtags}`;
  const truncatedText = combinedText.length > 200 ? `${combinedText.substring(0, 200)}...` : combinedText;
  
  return (
    <Card className="bg-card text-foreground border shadow-sm rounded-lg overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="p-4 bg-card border-b">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
            {brandLogoUrl ? (
              <NextImage
                src={brandLogoUrl}
                alt={`${brandName} Logo`}
                width={48}
                height={48}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white text-lg font-bold">{brandName.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1 mb-1">
              <p className="font-semibold text-sm text-foreground">{brandName}</p>
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-blue-500/50 text-blue-600">
                Promoted
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{brandName} • 1st</p>
            <p className="text-xs text-muted-foreground">2h • 🌍</p>
          </div>
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </div>
        
        {/* Content */}
        <div className="mt-3">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{truncatedText}</p>
          {combinedText.length > 200 && (
            <button className="text-sm text-blue-600 hover:underline">...see more</button>
          )}
        </div>
      </div>
      
      {/* Image */}
      {imageSrc && (
        <div className="relative bg-muted">
          <div className="aspect-[1.91/1] relative">
            <NextImage
              src={imageSrc}
              alt="LinkedIn post"
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="p-4 bg-card">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">👍</span>
              </div>
              <span>Sarah Johnson and 284 others</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span>47 comments</span>
            <span>12 reposts</span>
          </div>
        </div>
        
        <div className="border-t pt-3 flex items-center justify-around">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:bg-accent/50 px-3 py-2 rounded-md">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Like</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:bg-accent/50 px-3 py-2 rounded-md">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Comment</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:bg-accent/50 px-3 py-2 rounded-md">
            <Repeat2 className="w-4 h-4" />
            <span className="text-sm font-medium">Repost</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:bg-accent/50 px-3 py-2 rounded-md">
            <Send className="w-4 h-4" />
            <span className="text-sm font-medium">Send</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

// TikTok Mockup Component
const TikTokMockup: React.FC<MockupProps> = ({ caption, hashtags, imageSrc, brandName = "YourBrand", brandLogoUrl }) => {
  const combinedText = `${caption} ${hashtags}`;
  const truncatedText = combinedText.length > 80 ? `${combinedText.substring(0, 80)}...` : combinedText;
  const username = brandName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  
  return (
    <Card className="bg-black border-2 border-foreground/10 shadow-lg rounded-2xl overflow-hidden max-w-[280px] mx-auto">
      {/* Main Content Area */}
      <div className="relative">
        {/* Background Image or Video Preview */}
        {imageSrc ? (
          <div className="aspect-[9/16] relative bg-gray-900">
            <NextImage
              src={imageSrc}
              alt="TikTok video thumbnail"
              fill
              className="object-cover"
              sizes="280px"
            />
            {/* TikTok UI Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            
            {/* Side Actions */}
            <div className="absolute right-3 bottom-20 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <p className="text-white text-xs font-medium">12.3K</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-white text-xs font-medium">2,847</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1">
                  <Share className="w-6 h-6 text-white" />
                </div>
                <p className="text-white text-xs font-medium">Share</p>
              </div>
            </div>
            
            {/* Bottom Content */}
            <div className="absolute bottom-4 left-4 right-16">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                  {brandLogoUrl ? (
                    <NextImage
                      src={brandLogoUrl}
                      alt={`${brandName} Logo`}
                      width={32}
                      height={32}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{brandName.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <span className="text-white font-semibold text-sm">@{username}</span>
                <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-full text-xs">
                  Follow
                </Button>
              </div>
              <p className="text-white text-sm leading-tight mb-1">{truncatedText}</p>
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-white" />
                <span className="text-white text-xs">Original sound - {brandName}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-[9/16] relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 flex items-center justify-center">
            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold">@{username}</p>
                <p className="text-white text-sm opacity-90">{truncatedText}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// YouTube Community Mockup Component
const YouTubeMockup: React.FC<MockupProps> = ({ caption, hashtags, imageSrc, brandName = "YourBrand", brandLogoUrl }) => {
  const combinedText = `${caption}\n\n${hashtags}`;
  const truncatedText = combinedText.length > 300 ? `${combinedText.substring(0, 300)}...` : combinedText;
  
  return (
    <Card className="bg-card text-foreground border shadow-sm rounded-lg overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="p-4 bg-card">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
            {brandLogoUrl ? (
              <NextImage
                src={brandLogoUrl}
                alt={`${brandName} Logo`}
                width={40}
                height={40}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">{brandName.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <p className="font-semibold text-sm text-foreground">{brandName}</p>
              <div className="w-4 h-4 bg-muted-foreground rounded-full flex items-center justify-center">
                <span className="text-card text-xs">✓</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">2 hours ago</p>
          </div>
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </div>
        
        {/* Content */}
        <div className="mt-3 mb-4">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{truncatedText}</p>
          {combinedText.length > 300 && (
            <button className="text-sm text-blue-600 hover:underline mt-1">Show more</button>
          )}
        </div>
      </div>
      
      {/* Image */}
      {imageSrc && (
        <div className="relative bg-muted">
          <div className="aspect-video relative">
            <NextImage
              src={imageSrc}
              alt="YouTube community post"
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="p-4 bg-card border-t">
        <div className="flex items-center space-x-6 text-muted-foreground">
          <div className="flex items-center space-x-2 hover:text-foreground cursor-pointer transition-colors">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">1.2K</span>
          </div>
          <div className="flex items-center space-x-2 hover:text-foreground cursor-pointer transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">89</span>
          </div>
          <div className="flex items-center space-x-2 hover:text-foreground cursor-pointer transition-colors">
            <Share className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Main Preview Component
const SocialMediaPreviews: React.FC<SocialMediaPreviewsProps> = ({
  caption,
  hashtags,
  imageSrc,
  brandName = "YourBrand",
  brandLogoUrl,
  className,
  selectedPlatform = "all",
  selectedLanguage = "english"
}) => {
  
  // Platform configuration for image aspect ratios
  const getPlatformImageAspectRatio = (platform: string): string => {
    switch (platform) {
      case "instagram": return "1:1";
      case "linkedin": return "1.91:1";
      case "twitter": return "16:9";
      case "facebook": return "16:9";
      case "youtube": return "16:9";
      case "tiktok": return "9:16";
      default: return "1:1";
    }
  };

  // Determine which platforms to show
  const shouldShowPlatform = (platform: string): boolean => {
    return selectedPlatform === "all" || selectedPlatform === platform;
  };

  // Platform-specific title based on selection
  const getPreviewTitle = (): string => {
    if (selectedPlatform === "all") {
      return "Social Media Previews";
    }
    const platformNames: { [key: string]: string } = {
      "instagram": "Instagram Preview",
      "linkedin": "LinkedIn Preview",
      "twitter": "Twitter/X Preview",
      "facebook": "Facebook Preview",
      "youtube": "YouTube Preview",
      "tiktok": "TikTok Preview"
    };
    return platformNames[selectedPlatform] || "Platform Preview";
  };

  const getPreviewDescription = (): string => {
    if (selectedPlatform === "all") {
      return "See how your content will look across different social media platforms with authentic styling and interactions";
    }
    return `Preview optimized for ${selectedPlatform} with proper dimensions and platform-specific styling`;
  };

  return (
    <div className={cn("space-y-8", className)}>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {getPreviewTitle()}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {getPreviewDescription()}
        </p>
        {selectedLanguage !== "english" && (
          <Badge variant="outline" className="text-xs">
            Content optimized for {selectedLanguage} audience
          </Badge>
        )}
      </div>
      
      <div className={cn(
        "grid gap-8",
        selectedPlatform === "all" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 max-w-sm mx-auto"
      )}>
        {shouldShowPlatform("instagram") && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">IG</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">Instagram</h4>
            </div>
            <InstagramMockup
              caption={caption}
              hashtags={hashtags}
              imageSrc={imageSrc}
              brandName={brandName}
              brandLogoUrl={brandLogoUrl}
              aspectRatio={getPlatformImageAspectRatio("instagram")}
            />
          </div>
        )}
        
        {shouldShowPlatform("linkedin") && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">in</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">LinkedIn</h4>
            </div>
            <LinkedInMockup
              caption={caption}
              hashtags={hashtags}
              imageSrc={imageSrc}
              brandName={brandName}
              brandLogoUrl={brandLogoUrl}
            />
          </div>
        )}
        
        {shouldShowPlatform("twitter") && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background text-xs font-bold">𝕏</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">Twitter / X</h4>
            </div>
            <TwitterMockup
              caption={caption}
              hashtags={hashtags}
              imageSrc={imageSrc}
              brandName={brandName}
              brandLogoUrl={brandLogoUrl}
            />
          </div>
        )}
        
        {shouldShowPlatform("facebook") && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">Facebook</h4>
            </div>
            <FacebookMockup
              caption={caption}
              hashtags={hashtags}
              imageSrc={imageSrc}
              brandName={brandName}
              brandLogoUrl={brandLogoUrl}
            />
          </div>
        )}

        {shouldShowPlatform("youtube") && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">YouTube Community</h4>
            </div>
            <YouTubeMockup
              caption={caption}
              hashtags={hashtags}
              imageSrc={imageSrc}
              brandName={brandName}
              brandLogoUrl={brandLogoUrl}
            />
          </div>
        )}

        {shouldShowPlatform("tiktok") && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">TT</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">TikTok</h4>
            </div>
            <TikTokMockup
              caption={caption}
              hashtags={hashtags}
              imageSrc={imageSrc}
              brandName={brandName}
              brandLogoUrl={brandLogoUrl}
            />
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full inline-block">
          💡 {selectedPlatform === "all"
            ? "These previews show how your content will appear to your audience"
            : `Preview shows ${selectedPlatform}-optimized dimensions and styling`}
        </p>
      </div>
    </div>
  );
};

export default SocialMediaPreviews;
