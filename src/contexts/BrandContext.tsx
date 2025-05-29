
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
          // No existing profile, not an error.
          setBrandDataState(null);
        }
      } catch (e: any) {
        console.error("Error fetching brand data:", e);
        if (e.message && e.message.toLowerCase().includes("client is offline")) {
          setError("Failed to connect to the database. Please check your internet connection and Firebase project configuration (e.g., correct Project ID in .env).");
        } else if (e.message && e.message.toLowerCase().includes("missing or insufficient permissions")) {
          setError("Database permission error. Please check your Firestore security rules in the Firebase console.");
        } else if (e.code && e.code === "unavailable") {
           setError("The Firebase service is temporarily unavailable. Please try again later.");
        }
        else {
          setError(`Failed to fetch brand data: ${e.message || "Unknown error. Check console."}`);
        }
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
      if (e.message && e.message.toLowerCase().includes("client is offline")) {
        setError("Failed to save data. Client is offline. Check your internet connection.");
      } else if (e.message && e.message.toLowerCase().includes("missing or insufficient permissions")) {
          setError("Failed to save data due to database permission error. Check Firestore security rules.");
      } else {
        setError(`Failed to save brand profile: ${e.message || "Unknown error. Check console."}`);
      }
      // Re-throw the error if you want calling components to be able to catch it too
      // Or handle it fully here by not re-throwing and relying on the `error` state
      throw e; 
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addGeneratedImage = useCallback((image: GeneratedImage) => {
    setGeneratedImages(prev => [image, ...prev.slice(0,19)]); // Keep latest 20
  }, []);

  const addGeneratedSocialPost = useCallback((post: GeneratedSocialMediaPost) => {
    setGeneratedSocialPosts(prev => [post, ...prev.slice(0,19)]); // Keep latest 20
  }, []);

  const addGeneratedBlogPost = useCallback((post: GeneratedBlogPost) => {
    setGeneratedBlogPosts(prev => [post, ...prev.slice(0,19)]); // Keep latest 20
  }, []);

  const addGeneratedAdCampaign = useCallback((campaign: GeneratedAdCampaign) => {
    setGeneratedAdCampaigns(prev => [campaign, ...prev.slice(0,19)]); // Keep latest 20
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
