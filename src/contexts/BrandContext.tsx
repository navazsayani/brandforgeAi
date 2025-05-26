
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';
import type { BrandData, GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';

interface BrandContextType {
  brandData: BrandData | null;
  setBrandData: (data: BrandData) => void;
  generatedImages: GeneratedImage[];
  addGeneratedImage: (image: GeneratedImage) => void;
  generatedSocialPosts: GeneratedSocialMediaPost[];
  addGeneratedSocialPost: (post: GeneratedSocialMediaPost) => void;
  generatedBlogPosts: GeneratedBlogPost[];
  addGeneratedBlogPost: (post: GeneratedBlogPost) => void;
  generatedAdCampaigns: GeneratedAdCampaign[];
  addGeneratedAdCampaign: (campaign: GeneratedAdCampaign) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brandData, setBrandDataState] = useState<BrandData | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedSocialPosts, setGeneratedSocialPosts] = useState<GeneratedSocialMediaPost[]>([]);
  const [generatedBlogPosts, setGeneratedBlogPosts] = useState<GeneratedBlogPost[]>([]);
  const [generatedAdCampaigns, setGeneratedAdCampaigns] = useState<GeneratedAdCampaign[]>([]);

  const setBrandData = (data: BrandData) => {
    setBrandDataState(data);
  };

  const addGeneratedImage = (image: GeneratedImage) => {
    setGeneratedImages(prev => [...prev, image]);
  }

  const addGeneratedSocialPost = (post: GeneratedSocialMediaPost) => {
    setGeneratedSocialPosts(prev => [...prev, post]);
  }

  const addGeneratedBlogPost = (post: GeneratedBlogPost) => {
    setGeneratedBlogPosts(prev => [...prev, post]);
  }

  const addGeneratedAdCampaign = (campaign: GeneratedAdCampaign) => {
    setGeneratedAdCampaigns(prev => [...prev, campaign]);
  }

  return (
    <BrandContext.Provider value={{ 
      brandData, setBrandData,
      generatedImages, addGeneratedImage,
      generatedSocialPosts, addGeneratedSocialPost,
      generatedBlogPosts, addGeneratedBlogPost,
      generatedAdCampaigns, addGeneratedAdCampaign
    }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
