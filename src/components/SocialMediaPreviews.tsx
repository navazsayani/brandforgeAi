
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
}

interface MockupProps {
  caption: string;
  hashtags: string;
  imageSrc?: string | null;
  brandName?: string;
  brandLogoUrl?: string | null;
}

// Instagram Mockup Component
const InstagramMockup: React.FC<MockupProps> = ({ caption, hashtags, imageSrc, brandName = "YourBrand", brandLogoUrl }) => {
  const combinedText = `${caption}\n\n${hashtags}`;
  const truncatedText = combinedText.length > 125 ? `${combinedText.substring(0, 125)}...` : combinedText;
  const username = brandName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  
  return (
    <Card className="bg-white border-0 shadow-lg rounded-xl overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
              {brandLogoUrl ? (
                <NextImage
                  src={brandLogoUrl}
                  alt={`${brandName} Logo`}
                  width={32}
                  height={32}
                  className="object-contain rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{brandName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <p className="font-semibold text-sm text-gray-900">{username}</p>
              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Sponsored</p>
          </div>
        </div>
        <MoreHorizontal className="w-6 h-6 text-gray-600" />
      </div>
      
      {/* Image */}
      {imageSrc && (
        <div className="relative bg-gray-50">
          <div className="aspect-square relative">
            <NextImage
              src={imageSrc}
              alt="Instagram post"
              fill
              className="object-cover"
              sizes="400px"
            />
            {/* Instagram-style overlay elements */}
            <div className="absolute top-4 right-4">
              <div className="bg-black/20 backdrop-blur-sm rounded-full p-2">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Heart className="w-7 h-7 text-gray-800 hover:text-red-500 cursor-pointer transition-colors" />
            <MessageCircle className="w-7 h-7 text-gray-800 hover:text-gray-600 cursor-pointer transition-colors" />
            <Send className="w-7 h-7 text-gray-800 hover:text-gray-600 cursor-pointer transition-colors" />
          </div>
          <Bookmark className="w-7 h-7 text-gray-800 hover:text-gray-600 cursor-pointer transition-colors" />
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">2,847 likes</p>
          
          <div className="text-sm text-gray-900 leading-relaxed">
            <span className="font-semibold">{username} </span>
            <span className="whitespace-pre-wrap">{truncatedText}</span>
            {combinedText.length > 125 && (
              <button className="text-gray-500 ml-1 font-medium">more</button>
            )}
          </div>
          
          <button className="text-sm text-gray-500 font-medium">View all 47 comments</button>
          <p className="text-xs text-gray-400 uppercase tracking-wide">2 HOURS AGO</p>
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
    <Card className="bg-white border-0 shadow-lg rounded-xl overflow-hidden max-w-sm mx-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
            {brandLogoUrl ? (
              <NextImage
                src={brandLogoUrl}
                alt={`${brandName} Logo`}
                width={48}
                height={48}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-lg font-bold">{brandName.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 mb-1">
              <p className="font-bold text-base text-gray-900 truncate">{brandName}</p>
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <p className="text-sm truncate">@{twitterHandle}</p>
              <span>·</span>
              <p className="text-sm">2h</p>
            </div>
          </div>
          <MoreHorizontal className="w-5 h-5 text-gray-500 mt-1" />
        </div>
        
        {/* Content */}
        <div className="mb-4">
          <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed">{combinedText}</p>
        </div>
        
        {/* Image */}
        {imageSrc && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-gray-200">
            <div className="aspect-video relative bg-gray-100">
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
        <div className="text-sm text-gray-500 mb-3 border-b border-gray-100 pb-3">
          <span className="font-semibold text-gray-900">12:34 PM</span>
          <span className="mx-1">·</span>
          <span>Dec 15, 2024</span>
          <span className="mx-1">·</span>
          <span className="font-semibold text-gray-900">1.2M</span>
          <span className="ml-1">Views</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between text-gray-500 max-w-md">
          <div className="flex items-center space-x-2 hover:text-blue-500 cursor-pointer transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">127</span>
          </div>
          <div className="flex items-center space-x-2 hover:text-green-500 cursor-pointer transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
              <Repeat2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">89</span>
          </div>
          <div className="flex items-center space-x-2 hover:text-red-500 cursor-pointer transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">2.1K</span>
          </div>
          <div className="flex items-center space-x-2 hover:text-blue-500 cursor-pointer transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
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
    <Card className="bg-white border-0 shadow-lg rounded-xl overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
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
                <p className="font-semibold text-base text-gray-900">{brandName}</p>
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  Sponsored
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>2h</span>
                <span>·</span>
                <span>🌍</span>
              </div>
            </div>
          </div>
          <MoreHorizontal className="w-6 h-6 text-gray-600" />
        </div>
        
        {/* Content */}
        <div className="mb-3">
          <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed">{combinedText}</p>
        </div>
      </div>
      
      {/* Image */}
      {imageSrc && (
        <div className="relative bg-gray-100">
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
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
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
        
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-around">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
              <Heart className="w-5 h-5" />
              <span className="font-medium">Like</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
              <Share className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </Button>
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
  className 
}) => {
  return (
    <div className={cn("space-y-8", className)}>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Social Media Previews
          </h3>
        </div>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          See how your content will look across different social media platforms with authentic styling and interactions
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">IG</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Instagram</h4>
          </div>
          <InstagramMockup 
            caption={caption}
            hashtags={hashtags}
            imageSrc={imageSrc}
            brandName={brandName}
            brandLogoUrl={brandLogoUrl}
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">𝕏</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Twitter / X</h4>
          </div>
          <TwitterMockup 
            caption={caption}
            hashtags={hashtags}
            imageSrc={imageSrc}
            brandName={brandName}
            brandLogoUrl={brandLogoUrl}
          />
        </div>
        
        <div className="space-y-4 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">f</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Facebook</h4>
          </div>
          <FacebookMockup 
            caption={caption}
            hashtags={hashtags}
            imageSrc={imageSrc}
            brandName={brandName}
            brandLogoUrl={brandLogoUrl}
          />
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-full inline-block">
          💡 These previews show how your content will appear to your audience
        </p>
      </div>
    </div>
  );
};

export default SocialMediaPreviews;

    