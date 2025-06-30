
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'; // Added deleteDoc for potential future use
import { db } from '@/lib/firebaseConfig';
import type { BrandData, GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';
import { useAuth } from './AuthContext'; 

interface LastImageGenerationResult {
  generatedImages: string[];
  promptUsed: string;
  providerUsed: string;
}

interface BrandContextType {
  userId: string | null; 
  brandData: BrandData | null;
  setBrandData: (data: BrandData, userId: string) => Promise<void>; 
  isLoading: boolean;
  error: string | null;
  refetchBrandData: () => Promise<void>;
  generatedImages: GeneratedImage[];
  addGeneratedImage: (image: GeneratedImage) => void;
  generatedSocialPosts: GeneratedSocialMediaPost[];
  addGeneratedSocialPost: (post: GeneratedSocialMediaPost) => void;
  generatedBlogPosts: GeneratedBlogPost[];
  addGeneratedBlogPost: (post: GeneratedBlogPost) => void;
  generatedAdCampaigns: GeneratedAdCampaign[];
  addGeneratedAdCampaign: (campaign: GeneratedAdCampaign) => void;
  sessionLastImageGenerationResult: LastImageGenerationResult | null; 
  setSessionLastImageGenerationResult: (result: LastImageGenerationResult | null) => void; 
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const defaultEmptyBrandData: BrandData = {
    brandName: "",
    websiteUrl: "",
    brandDescription: "",
    industry: "_none_", 
    imageStyleNotes: "",
    exampleImages: [],
    targetKeywords: "",
    brandLogoUrl: "", // Changed from undefined to empty string to prevent Firestore errors
    plan: 'free',
    userEmail: "",
    subscriptionEndDate: null,
};

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth(); 
  const [brandData, setBrandDataState] = useState<BrandData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedSocialPosts, setGeneratedSocialPosts] = useState<GeneratedSocialMediaPost[]>([]);
  const [generatedBlogPosts, setGeneratedBlogPosts] = useState<GeneratedBlogPost[]>([]);
  const [generatedAdCampaigns, setGeneratedAdCampaigns] = useState<GeneratedAdCampaign[]>([]);
  const [sessionLastImageGenerationResult, setSessionLastImageGenerationResultState] = useState<LastImageGenerationResult | null>(null); 

  const setBrandDataCB = useCallback(async (data: BrandData, userIdToSaveFor: string) => { 
    if (!userIdToSaveFor) {
      const noUserError = "User ID to save for is missing. Cannot save brand profile.";
      setError(noUserError);
      throw new Error(noUserError);
    }

    setIsLoading(true);
    setError(null);
    try {
      const dataToSave: BrandData = {
        ...defaultEmptyBrandData, 
        ...data,
      };
      if (dataToSave.industry === "" || dataToSave.industry === undefined || dataToSave.industry === null) {
        dataToSave.industry = "_none_";
      }
      if (!dataToSave.plan || !['free', 'premium'].includes(dataToSave.plan)) {
        dataToSave.plan = 'free';
      }
       if (dataToSave.plan === 'free') {
        dataToSave.subscriptionEndDate = null;
      }

      if (currentUser && userIdToSaveFor === currentUser.uid && currentUser.email) {
        dataToSave.userEmail = currentUser.email;
      } else if (!dataToSave.userEmail && data.userEmail) { 
        dataToSave.userEmail = data.userEmail;
      }

      const brandDocRef = doc(db, "users", userIdToSaveFor, "brandProfiles", userIdToSaveFor); 
      await setDoc(brandDocRef, dataToSave, { merge: true }); 

      // ADDED: Update the central user index
      const userIndexRef = doc(db, "userIndex", "profiles");
      const indexUpdateData = {
          [`${userIdToSaveFor}`]: { // Use a dynamic key for the user's UID
              brandName: dataToSave.brandName || "Unnamed Brand",
              userEmail: dataToSave.userEmail || "No Email",
          }
      };
      await setDoc(userIndexRef, indexUpdateData, { merge: true });

      if (currentUser && userIdToSaveFor === currentUser.uid) {
        setBrandDataState(dataToSave); 
      }
    } catch (e: any) {
      console.error("Error saving brand data to Firestore:", e);
      let specificError = `Failed to save brand profile: ${e.message || "Unknown error. Check console."}`;
       if (e.code === 'unavailable' || (e.message && (e.message.toLowerCase().includes("client is offline") || e.message.toLowerCase().includes("could not reach cloud firestore backend")))) {
        specificError = "Connection Error: Your changes have been saved locally and will be uploaded when the connection is restored.";
         console.warn("FIRESTORE OFFLINE: Could not reach Cloud Firestore backend during save. Client operating in offline mode.", e);
      } else if (e.message && e.message.toLowerCase().includes("missing or insufficient permissions")) {
          specificError = "Failed to save data due to database permission error. Check Firestore security rules.";
      }
      setError(specificError);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const fetchBrandDataCB = useCallback(async () => {
    if (!currentUser) {
      setBrandDataState(defaultEmptyBrandData);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const userId = currentUser.uid;
    let isNewUserSetupFlow = false; // Flag to track if this is a new user setup

    try {
      const newBrandDocRef = doc(db, "users", userId, "brandProfiles", userId);
      const oldBrandDocRef = doc(db, "brandProfiles", userId); 

      let docSnap = await getDoc(newBrandDocRef);
      let dataToSet: BrandData | null = null;
      let needsSave = false;

      if (docSnap.exists()) {
        dataToSet = docSnap.data() as BrandData;
      } else {
        docSnap = await getDoc(oldBrandDocRef);
        if (docSnap.exists()) {
          dataToSet = docSnap.data() as BrandData;
          needsSave = true;
        }
      }

      if (dataToSet) {
        const normalizedData = { ...defaultEmptyBrandData, ...dataToSet }; 
        if (!normalizedData.industry || normalizedData.industry.trim() === "") {
            normalizedData.industry = "_none_";
        }
        if (!normalizedData.plan) normalizedData.plan = 'free';
        
        if (!normalizedData.userEmail && currentUser.email) {
            normalizedData.userEmail = currentUser.email;
            needsSave = true; 
        }

        if (normalizedData.plan === 'premium' && normalizedData.subscriptionEndDate) {
            const endDate = (normalizedData.subscriptionEndDate as any).toDate();
            if (new Date() > endDate) {
                // Subscription has expired, downgrade to free
                normalizedData.plan = 'free';
                normalizedData.subscriptionEndDate = null;
                needsSave = true;
            }
        }

        setBrandDataState(normalizedData);

        if (needsSave) {
          isNewUserSetupFlow = true; // This is part of setup/migration
          await setBrandDataCB(normalizedData, userId);
        }
      } else {
        isNewUserSetupFlow = true; // This is a new user setup
        const defaultWithEmail = { ...defaultEmptyBrandData, userEmail: currentUser.email || "", subscriptionEndDate: null };
        setBrandDataState(defaultWithEmail);
        await setBrandDataCB(defaultWithEmail, userId);
      }
    } catch (e: any) {
      // If the error happens during the new user setup flow, just log it
      // and don't show a disruptive toast message.
      if (isNewUserSetupFlow) {
        console.error("Non-critical error during initial brand profile setup:", e);
        // Fallback to a clean default state without showing an error to the user
        setBrandDataState({ ...defaultEmptyBrandData, userEmail: currentUser?.email || "", subscriptionEndDate: null });
      } else {
        // For existing users, an error fetching data is more critical.
        console.error("Error fetching brand data from Firestore:", e);
        let specificError = `Failed to fetch brand data: ${e.message || "Unknown error. Check console."}`;
        
        const isConnectionError = e.code === 'unavailable' || 
                                  (e.message && (e.message.toLowerCase().includes("client is offline") || 
                                                 e.message.toLowerCase().includes("could not reach cloud firestore backend")));
        
        if (isConnectionError) {
          specificError = "Connection Error: Unable to reach our servers. You can continue working with cached data.";
          console.warn("FIRESTORE OFFLINE: Could not reach Cloud Firestore backend. Client operating in offline mode.", e);
          // Set error to inform user via toast, but DO NOT clear existing brand data.
          // This allows the app to feel responsive using Firestore's cache.
          setError(specificError);
        } else {
          // For other errors (permissions, etc.), it's safer to reset the state.
          if (e.message && e.message.toLowerCase().includes("missing or insufficient permissions")) {
            specificError = "Database permission error. Please check your Firestore security rules in the Firebase console.";
          }
          setError(specificError);
          setBrandDataState({ ...defaultEmptyBrandData, userEmail: currentUser?.email || "", subscriptionEndDate: null });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, setBrandDataCB]); 

  const refetchBrandData = useCallback(async () => {
    await fetchBrandDataCB();
  }, [fetchBrandDataCB]);

  useEffect(() => {
    fetchBrandDataCB();
  }, [fetchBrandDataCB]); 

  const addGeneratedImageCB = useCallback((image: GeneratedImage) => {
    setGeneratedImages(prev => [image, ...prev.slice(0,19)]);
  }, []);

  const addGeneratedSocialPostCB = useCallback((post: GeneratedSocialMediaPost) => {
    setGeneratedSocialPosts(prev => [post, ...prev.slice(0,19)]);
  }, []);

  const addGeneratedBlogPostCB = useCallback((post: GeneratedBlogPost) => {
    setGeneratedBlogPosts(prev => [post, ...prev.slice(0,19)]);
  }, []);

  const addGeneratedAdCampaignCB = useCallback((campaign: GeneratedAdCampaign) => {
    setGeneratedAdCampaigns(prev => [campaign, ...prev.slice(0,19)]);
  }, []);

  const setSessionLastImageGenerationResultCB = useCallback((result: LastImageGenerationResult | null) => {
    setSessionLastImageGenerationResultState(result);
  }, []);

  const contextValue = useMemo(() => ({
    userId: currentUser?.uid || null, 
    brandData,
    setBrandData: setBrandDataCB,
    isLoading,
    error,
    refetchBrandData,
    generatedImages,
    addGeneratedImage: addGeneratedImageCB,
    generatedSocialPosts,
    addGeneratedSocialPost: addGeneratedSocialPostCB,
    generatedBlogPosts,
    addGeneratedBlogPost: addGeneratedBlogPostCB,
    generatedAdCampaigns,
    addGeneratedAdCampaign: addGeneratedAdCampaignCB,
    sessionLastImageGenerationResult, 
    setSessionLastImageGenerationResult: setSessionLastImageGenerationResultCB 
  }), [
    currentUser, brandData, setBrandDataCB, isLoading, error, refetchBrandData,
    generatedImages, addGeneratedImageCB,
    generatedSocialPosts, addGeneratedSocialPostCB,
    generatedBlogPosts, addGeneratedBlogPostCB,
    generatedAdCampaigns, addGeneratedAdCampaignCB,
    sessionLastImageGenerationResult, setSessionLastImageGenerationResultCB 
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
