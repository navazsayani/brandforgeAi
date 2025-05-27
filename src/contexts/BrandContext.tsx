
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { BrandData, GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';

const BRAND_PROFILE_DOC_ID = "defaultBrandProfile"; // Using a fixed ID for simplicity

interface BrandContextType {
  brandData: BrandData | null;
  setBrandData: (data: BrandData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedSocialPosts, setGeneratedSocialPosts] = useState<GeneratedSocialMediaPost[]>([]);
  const [generatedBlogPosts, setGeneratedBlogPosts] = useState<GeneratedBlogPost[]>([]);
  const [generatedAdCampaigns, setGeneratedAdCampaigns] = useState<GeneratedAdCampaign[]>([]);

  useEffect(() => {
    const fetchBrandData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const brandDocRef = doc(db, "brandProfiles", BRAND_PROFILE_DOC_ID);
        const docSnap = await getDoc(brandDocRef);
        if (docSnap.exists()) {
          setBrandDataState(docSnap.data() as BrandData);
        } else {
          setBrandDataState(null);
        }
      } catch (e) {
        console.error("Error fetching brand data:", e);
        setError("Failed to fetch brand data.");
        setBrandDataState(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrandData();
  }, []);

  const setBrandData = useCallback(async (data: BrandData) => {
    setIsLoading(true);
    setError(null);
    try {
      const brandDocRef = doc(db, "brandProfiles", BRAND_PROFILE_DOC_ID);
      await setDoc(brandDocRef, data, { merge: true });
      setBrandDataState(data);
    } catch (e: any) {
      console.error("Error saving brand data:", e);
      setError("Failed to save brand data.");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies from BrandProvider's scope

  const addGeneratedImage = useCallback((image: GeneratedImage) => {
    setGeneratedImages(prev => [...prev, image]);
  }, []);

  const addGeneratedSocialPost = useCallback((post: GeneratedSocialMediaPost) => {
    setGeneratedSocialPosts(prev => [...prev, post]);
  }, []);

  const addGeneratedBlogPost = useCallback((post: GeneratedBlogPost) => {
    setGeneratedBlogPosts(prev => [...prev, post]);
  }, []);

  const addGeneratedAdCampaign = useCallback((campaign: GeneratedAdCampaign) => {
    setGeneratedAdCampaigns(prev => [...prev, campaign]);
  }, []);

  const contextValue = useMemo(() => ({
    brandData,
    setBrandData,
    isLoading,
    error,
    generatedImages,
    addGeneratedImage,
    generatedSocialPosts,
    addGeneratedSocialPost,
    generatedBlogPosts,
    addGeneratedBlogPost,
    generatedAdCampaigns,
    addGeneratedAdCampaign
  }), [
    brandData, setBrandData, isLoading, error,
    generatedImages, addGeneratedImage,
    generatedSocialPosts, addGeneratedSocialPost,
    generatedBlogPosts, addGeneratedBlogPost,
    generatedAdCampaigns, addGeneratedAdCampaign
  ]);

  return (
    <BrandContext.Provider value={contextValue}>
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
