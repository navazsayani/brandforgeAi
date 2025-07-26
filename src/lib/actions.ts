

'use server';

import crypto from 'crypto';
import { generateImages, type GenerateImagesInput } from '@/ai/flows/generate-images';
import { generateSocialMediaCaption, type GenerateSocialMediaCaptionInput } from '@/ai/flows/generate-social-media-caption';
import { generateBlogContent, type GenerateBlogContentInput } from '@/ai/flows/generate-blog-content';
import { generateAdCampaign, type GenerateAdCampaignInput, type GenerateAdCampaignOutput } from '@/ai/flows/generate-ad-campaign';
import { extractBrandInfoFromUrl, type ExtractBrandInfoFromUrlInput, type ExtractBrandInfoFromUrlOutput } from '@/ai/flows/extract-brand-info-from-url-flow';
import { describeImage, type DescribeImageInput, type DescribeImageOutput } from "@/ai/flows/describe-image-flow";
import { generateBlogOutline, type GenerateBlogOutlineInput, type GenerateBlogOutlineOutput } from '@/ai/flows/generate-blog-outline-flow';
import { generateBrandLogo, type GenerateBrandLogoInput, type GenerateBrandLogoOutput } from '@/ai/flows/generate-brand-logo-flow';
import { enhanceBrandDescription, type EnhanceBrandDescriptionInput, type EnhanceBrandDescriptionOutput } from '@/ai/flows/enhance-brand-description-flow';
import { generateBrandForgeAppLogo, type GenerateBrandForgeAppLogoOutput } from '@/ai/flows/generate-brandforge-app-logo-flow';
import { populateImageForm, type PopulateImageFormInput, type PopulateImageFormOutput } from '@/ai/flows/populate-image-form-flow';
import { populateSocialForm, type PopulateSocialFormInput, type PopulateSocialFormOutput } from '@/ai/flows/populate-social-form-flow';
import { populateBlogForm, type PopulateBlogFormInput, type PopulateBlogFormOutput } from '@/ai/flows/populate-blog-form-flow';
import { populateAdCampaignForm, type PopulateAdCampaignFormInput, type PopulateAdCampaignFormOutput } from '@/ai/flows/populate-ad-campaign-form-flow';
import { editImage, type EditImageInput, type EditImageOutput } from '@/ai/flows/edit-image-flow';
import { enhanceRefinePrompt, type EnhanceRefinePromptInput, type EnhanceRefinePromptOutput } from '@/ai/flows/enhance-refine-prompt-flow';
import { enhanceTextToFeature, type EnhanceTextToFeatureInput, type EnhanceTextToFeatureOutput } from '@/ai/flows/enhance-text-to-feature-flow';
import { storage, db } from '@/lib/firebaseConfig';
import { ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, getDocs, query as firestoreQuery, where, collectionGroup, deleteDoc, runTransaction } from 'firebase/firestore';
import type { UserProfileSelectItem, BrandData, ModelConfig, PlansConfig, MonthlyUsage, AdminUserUsage, ConnectedAccountsStatus, InstagramAccount, OrphanedImageScanResult } from '@/types';
import { getModelConfig, clearModelConfigCache } from './model-config';
import { getPlansConfig, clearPlansConfigCache } from './plans-config';
import { DEFAULT_PLANS_CONFIG } from './constants';
import { decodeHtmlEntitiesInUrl, verifyImageUrlExists } from './utils';
import { scanAllOrphanedImages, cleanupAllOrphanedImages } from './cleanup-orphaned-images';
import Razorpay from 'razorpay';
import admin from 'firebase-admin';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// Generic type for form state with error
export interface FormState<T = any> {
  data?: T;
  error?: string;
  message?: string;
  taskId?: string;
}

// Helper function to ensure user-specific brand profile document exists
async function ensureUserBrandProfileDocExists(userId: string, userEmail?: string): Promise<void> {
  console.log(`[ensureUserBrandProfileDocExists] Starting for userId: ${userId}`);
  if (!userId) {
    console.error("[ensureUserBrandProfileDocExists] CRITICAL ERROR: User ID is required.");
    throw new Error("User ID is required to ensure brand profile document exists.");
  }
  
  const userDocRef = doc(db, 'users', userId);
  console.log(`[ensureUserBrandProfileDocExists] Checking for top-level user doc at users/${userId}`);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    console.log(`[ensureUserBrandProfileDocExists] Top-level user document for ${userId} does not exist. Creating it...`);
    await setDoc(userDocRef, {
      email: userEmail || 'unknown',
      createdAt: new Date(),
    });
    console.log(`[ensureUserBrandProfileDocExists] Successfully created top-level user document for ${userId}.`);
  } else {
    console.log(`[ensureUserBrandProfileDocExists] Top-level user doc for ${userId} already exists.`);
  }

  const brandProfileDocRef = doc(db, `users/${userId}/brandProfiles/${userId}`);
  console.log(`[ensureUserBrandProfileDocExists] Checking for nested brand profile doc at users/${userId}/brandProfiles/${userId}`);
  const brandProfileDocSnap = await getDoc(brandProfileDocRef);

  if (!brandProfileDocSnap.exists()) {
    console.log(`[ensureUserBrandProfileDocExists] Brand profile document for user ${userId} does not exist. Creating it with default data...`);
    const initialProfileData: Partial<BrandData> = {
      brandName: "",
      websiteUrl: "",
      brandDescription: "",
      industry: "_none_",
      imageStyleNotes: "",
      exampleImages: [],
      targetKeywords: "",
      brandLogoUrl: "",
      plan: 'free',
      userEmail: userEmail || "",
      subscriptionEndDate: null,
    };
    await setDoc(brandProfileDocRef, initialProfileData);
    console.log(`[ensureUserBrandProfileDocExists] Successfully created brand profile document for user ${userId}.`);
  } else {
    console.log(`[ensureUserBrandProfileDocExists] Nested brand profile doc for ${userId} already exists.`);
  }
  console.log(`[ensureUserBrandProfileDocExists] Finished for userId: ${userId}`);
}

async function checkAndIncrementUsage(userId: string, contentType: 'imageGenerations' | 'socialPosts' | 'blogPosts'): Promise<void> {
  const plansConfig = await getPlansConfig();
  const userProfileDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
  const userProfileSnap = await getDoc(userProfileDocRef);

  if (!userProfileSnap.exists()) {
    throw new Error("User profile not found.");
  }

  const brandData = userProfileSnap.data() as BrandData;
  const isAdmin = brandData.userEmail === 'admin@brandforge.ai';
  if (isAdmin) {
    console.log(`[Usage Check] Admin user ${userId}. Skipping quota check.`);
    return; 
  }

  const isPremiumActive = brandData.plan === 'premium' && brandData.subscriptionEndDate && (brandData.subscriptionEndDate.toDate ? brandData.subscriptionEndDate.toDate() : new Date(brandData.subscriptionEndDate)) > new Date();
  const planKey = isPremiumActive ? 'pro' : 'free';
  const planDetails = plansConfig.USD[planKey];
  const quotaLimit = planDetails.quotas[contentType];

  if (quotaLimit <= 0) {
    throw new Error(`Your current plan does not allow for more ${contentType.replace(/([A-Z])/g, ' $1').toLowerCase()}. Please upgrade.`);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const usageDocId = `${year}-${month}`;
  
  const usageDocRef = doc(db, `users/${userId}/usage`, usageDocId);

  try {
    await runTransaction(db, async (transaction) => {
      const usageDoc = await transaction.get(usageDocRef);
      
      let currentUsage: MonthlyUsage = {
        imageGenerations: 0,
        socialPosts: 0,
        blogPosts: 0,
      };

      if (usageDoc.exists()) {
        currentUsage = usageDoc.data() as MonthlyUsage;
      }
      
      const currentCount = currentUsage[contentType] || 0;

      if (currentCount >= quotaLimit) {
        throw new Error(`You have reached your monthly quota of ${quotaLimit} for ${contentType.replace(/([A-Z])/g, ' $1').toLowerCase()}. Your quota will reset next month.`);
      }

      const newCount = currentCount + 1;
      const updateData = { ...currentUsage, [contentType]: newCount };

      transaction.set(usageDocRef, updateData, { merge: true });
    });
    console.log(`[Usage Check] Usage for ${contentType} incremented for user ${userId}.`);
  } catch (error: any) {
    console.error(`[Usage Check] Transaction failed for user ${userId}:`, error.message);
    throw error;
  }
}


export async function handleGenerateImagesAction(
  prevState: FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string; }>,
  formData: FormData
): Promise<FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string; }>> {
  try {
    const userId = formData.get("userId") as string;
    if (!userId) {
      return { error: "User not authenticated. Cannot generate images." };
    }

    const numberOfImagesStr = formData.get("numberOfImages") as string;
    const numberOfImages = parseInt(numberOfImagesStr, 10) || 1;

    for (let i = 0; i < numberOfImages; i++) {
        await checkAndIncrementUsage(userId, 'imageGenerations');
    }
    
    const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { error: "User profile not found. Please set up your brand profile first." };
    }
    const brandData = userDocSnap.data() as BrandData;
    const isPremiumActive = brandData.plan === 'premium' && brandData.subscriptionEndDate && (brandData.subscriptionEndDate.toDate ? brandData.subscriptionEndDate.toDate() : new Date(brandData.subscriptionEndDate)) > new Date();
    const isAdmin = brandData.userEmail === 'admin@brandforge.ai';
    
    const plansConfig = await getPlansConfig();
    const planKey = isPremiumActive ? 'pro' : 'free';
    const planDetails = plansConfig.USD[planKey]; 

    if (!isAdmin && planDetails.quotas.imageGenerations <= 0) {
      return { error: "Image generation is not available on your current plan. Please upgrade." };
    }
    
    const chosenProvider = (formData.get("provider") as GenerateImagesInput['provider']) || process.env.IMAGE_GENERATION_PROVIDER || 'GEMINI';

    if (!isAdmin && !isPremiumActive) {
      if (numberOfImages > 1) {
        return { error: "Generating multiple images at once is a premium feature. Please upgrade your plan." };
      }
      if (chosenProvider === 'FREEPIK') {
        return { error: "The Freepik image generator is a premium feature. Please upgrade your plan." };
      }
    }
    
    const negativePromptValue = formData.get("negativePrompt") as string | null;
    const seedStr = formData.get("seed") as string | undefined;
    const seed = seedStr && !isNaN(parseInt(seedStr, 10)) ? parseInt(seedStr, 10) : undefined;
    
    let finalizedTextPromptValue = formData.get("finalizedTextPrompt") as string | undefined | null;
    if (finalizedTextPromptValue === "") {
      finalizedTextPromptValue = undefined;
    }

    const freepikDominantColorsInput = formData.get("freepikDominantColorsInput") as string | null;
    let freepikStylingColors: GenerateImagesInput['freepikStylingColors'] = undefined;
    if (freepikDominantColorsInput && freepikDominantColorsInput.trim() !== "") {
        freepikStylingColors = freepikDominantColorsInput
            .split(',')
            .map(color => color.trim())
            .filter(color => /^#[0-9a-fA-F]{6}$/.test(color))
            .slice(0, 5)
            .map(color => ({ color, weight: 0.5 }));
        if (freepikStylingColors.length === 0) freepikStylingColors = undefined;
    }
    
    const exampleImageUrl = formData.get("exampleImage") as string | undefined;
    let aiGeneratedDesc: string | undefined = undefined;
    const placeholderToReplace = "[An AI-generated description of your example image will be used here by the backend to guide content when Freepik/Imagen3 is selected.]";

    if (chosenProvider.toUpperCase() === 'FREEPIK' && exampleImageUrl && exampleImageUrl.trim() !== "") {
      try {
        const decodedExampleImageUrl = decodeHtmlEntitiesInUrl(exampleImageUrl);
        console.log(`Generate images action - Original example image URL: ${exampleImageUrl.substring(0, 100)}...`);
        console.log(`Generate images action - Decoded example image URL: ${decodedExampleImageUrl.substring(0, 100)}...`);
        
        // Verify the example image exists before trying to describe it
        const imageExists = await verifyImageUrlExists(exampleImageUrl);
        if (!imageExists) {
          console.warn(`Example image not found or inaccessible: ${decodedExampleImageUrl.substring(0, 100)}... Proceeding without description.`);
          aiGeneratedDesc = undefined;
        } else {
          const descriptionOutput = await describeImage({ imageDataUri: decodedExampleImageUrl });
          aiGeneratedDesc = descriptionOutput.description;
        }
        
        if (finalizedTextPromptValue && finalizedTextPromptValue.includes(placeholderToReplace)) {
          const replacementText = `The user provided an example image which is described as: "${aiGeneratedDesc || "No specific description available for the example image"}". Using that description as primary inspiration for the subject and main visual elements, continue with the rest of the prompt instructions which should guide the concept and style for the new image.`;
          finalizedTextPromptValue = finalizedTextPromptValue.replace(placeholderToReplace, replacementText);
        }
      } catch (descError: any) {
        console.warn(`Could not generate description for example image (Freepik): ${descError.message}. Proceeding without it.`);
      }
    }
    
    const input: GenerateImagesInput = {
      provider: formData.get("provider") as GenerateImagesInput['provider'] || undefined,
      brandDescription: formData.get("brandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      imageStyle: formData.get("imageStyle") as string,
      textToFeature: formData.get("textToFeature") as string | undefined,
      exampleImage: exampleImageUrl && exampleImageUrl.trim() !== "" ? decodeHtmlEntitiesInUrl(exampleImageUrl) : undefined,
      exampleImageDescription: aiGeneratedDesc,
      aspectRatio: formData.get("aspectRatio") as string | undefined,
      numberOfImages: numberOfImages,
      negativePrompt: negativePromptValue === null || negativePromptValue === "" ? undefined : negativePromptValue,
      seed: seed,
      finalizedTextPrompt: finalizedTextPromptValue === null || finalizedTextPromptValue === "" ? undefined : finalizedTextPromptValue,
      freepikStylingColors: freepikStylingColors,
      freepikEffectColor: (formData.get("freepikEffectColor") as string === "none" ? undefined : formData.get("freepikEffectColor") as string | undefined) || undefined,
      freepikEffectLightning: (formData.get("freepikEffectLightning") as string === "none" ? undefined : formData.get("freepikEffectLightning") as string | undefined) || undefined,
      freepikEffectFraming: (formData.get("freepikEffectFraming") as string === "none" ? undefined : formData.get("freepikEffectFraming") as string | undefined) || undefined,
    };
    
    if (!input.provider) delete input.provider;
    if (input.aspectRatio === "" || input.aspectRatio === undefined) delete input.aspectRatio;
    if (input.industry === "" || input.industry === undefined) delete input.industry;
    if (!input.exampleImage) delete input.exampleImage;
    if (!input.exampleImageDescription) delete input.exampleImageDescription;

    const result = await generateImages(input);
    const message = `${result.generatedImages.length} image(s)/task(s) processed using ${result.providerUsed || 'default provider'}.`;
    return { data: { generatedImages: result.generatedImages, promptUsed: result.promptUsed, providerUsed: result.providerUsed }, message: message };
  } catch (e: any) {
    console.error("Error in handleGenerateImagesAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Failed to generate image(s): ${e.message || "Unknown error. Check server logs."}` };
  }
}

export async function handleDescribeImageAction(
  prevState: FormState<DescribeImageOutput>,
  formData: FormData
): Promise<FormState<DescribeImageOutput>> {
  try {
    const imageDataUri = formData.get("imageDataUri") as string;
    if (!imageDataUri) {
      return { error: "Image data URI or URL is required to generate a description." };
    }
    const input: DescribeImageInput = { imageDataUri };
    const result = await describeImage(input);
    return { data: result, message: "Image description generated!" };
  } catch (e: any) {
    console.error("Error in handleDescribeImageAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Failed to generate image description: ${e.message || "Unknown error. Check server logs."}` };
  }
}

export async function handleGenerateSocialMediaCaptionAction(
  prevState: FormState<{ caption: string; hashtags: string; imageSrc: string | null }>,
  formData: FormData
): Promise<FormState<{ caption: string; hashtags: string; imageSrc: string | null }>> {
  try {
    const userId = formData.get('userId') as string;
    if (!userId) {
      return { error: "User ID is missing. Cannot save social media post."};
    }

    await checkAndIncrementUsage(userId, 'socialPosts');

    const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { error: "User profile not found. Please set up your brand profile first." };
    }
    const brandData = userDocSnap.data() as BrandData;
    const isPremiumActive = brandData.plan === 'premium' && brandData.subscriptionEndDate && (brandData.subscriptionEndDate.toDate ? brandData.subscriptionEndDate.toDate() : new Date(brandData.subscriptionEndDate)) > new Date();
    const isAdmin = brandData.userEmail === 'admin@brandforge.ai';

    const plansConfig = await getPlansConfig();
    const planKey = isPremiumActive ? 'pro' : 'free';
    const planDetails = plansConfig.USD[planKey];

    if (!isAdmin && planDetails.quotas.socialPosts <= 0) {
      return { error: "Social post generation is not available on your current plan. Please upgrade." };
    }

    const selectedImageSrc = formData.get("selectedImageSrcForSocialPost") as string;
    const imageSrc = selectedImageSrc && selectedImageSrc.trim() !== "" ? selectedImageSrc : null;
    const imageDescription = formData.get("socialImageDescription") as string;
    const presetTone = formData.get("tone") as string;
    const customNuances = formData.get("customSocialToneNuances") as string | null;
    const userEmail = formData.get('userEmail') as string | undefined;

    let finalTone = presetTone;
    if (customNuances && customNuances.trim() !== "") {
      finalTone = `${presetTone} ${customNuances.trim()}`;
    }
    
    const industry = formData.get("industry") as string | null;
    const postGoal = formData.get("postGoal") as string | null;
    const targetAudience = formData.get("targetAudience") as string | null;
    const callToAction = formData.get("callToAction") as string | null;

    const input: GenerateSocialMediaCaptionInput = {
      brandDescription: formData.get("brandDescription") as string,
      imageDescription: imageSrc ? imageDescription : undefined,
      tone: finalTone,
    };

    if (industry && industry.trim() !== "") {
      input.industry = industry.trim();
    }
    if (postGoal && postGoal.trim() !== "") {
      input.postGoal = postGoal.trim();
    }
    if (targetAudience && targetAudience.trim() !== "") {
      input.targetAudience = targetAudience.trim();
    }
    if (callToAction && callToAction.trim() !== "") {
      input.callToAction = callToAction.trim();
    }

    if (!input.brandDescription || !input.tone) {
      return { error: "Brand description and tone are required." };
    }
    if (imageSrc && (!imageDescription || imageDescription.trim() === "")) {
        return { error: "Image description is required if an image is selected for the post."}
    }

    const result = await generateSocialMediaCaption(input);
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/socialMediaPosts`);
    
    const docData: { [key: string]: any } = {
      caption: result.caption || "",
      hashtags: result.hashtags || "",
      imageSrc: imageSrc,
      tone: input.tone,
      createdAt: serverTimestamp(),
      status: 'draft',
    };
    
    if (input.industry) docData.industry = input.industry;
    if (input.postGoal) docData.postGoal = input.postGoal;
    if (input.targetAudience) docData.targetAudience = input.targetAudience;
    if (input.callToAction) docData.callToAction = input.callToAction;

    await addDoc(firestoreCollectionRef, docData);

    return { data: { ...result, imageSrc: imageSrc }, message: "Social media content generated and saved successfully!" };
  } catch (e: any)
   {
    console.error("Error in handleGenerateSocialMediaCaptionAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Failed to generate social media caption: ${e.message || "Unknown error. Check server logs."}` };
  }
}

export async function handleGenerateBlogOutlineAction(
    prevState: FormState<GenerateBlogOutlineOutput>,
    formData: FormData
): Promise<FormState<GenerateBlogOutlineOutput>> {
    try {
        const input: GenerateBlogOutlineInput = {
            brandName: formData.get("brandName") as string,
            brandDescription: formData.get("blogBrandDescription") as string,
            industry: formData.get("industry") as string | undefined,
            keywords: formData.get("blogKeywords") as string,
            websiteUrl: (formData.get("blogWebsiteUrl") as string) || undefined,
            articleStyle: formData.get("articleStyle") as string | undefined,
            targetAudience: formData.get("targetAudience") as string | undefined,
        };

        if (!input.brandName || !input.brandDescription || !input.keywords) {
            return { error: "Brand name, description, and keywords are required for outline generation." };
        }
        if (input.websiteUrl === "") delete input.websiteUrl;
        if (input.industry === "" || input.industry === undefined) delete input.industry;
        if (input.articleStyle === "" || input.articleStyle === undefined) delete input.articleStyle;
        if (input.targetAudience === "" || input.targetAudience === undefined) delete input.targetAudience;

        const result = await generateBlogOutline(input);
        return { data: result, message: "Blog outline generated successfully!" };
    } catch (e: any) {
        console.error("Error in handleGenerateBlogOutlineAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
        return { error: `Failed to generate blog outline: ${e.message || "Unknown error. Check server logs."}` };
    }
}

export async function handleGenerateBlogContentAction(
  prevState: FormState<{ title: string; content: string; tags: string }>,
  formData: FormData
): Promise<FormState<{ title: string; content: string; tags: string }>> {
  try {
    const userId = formData.get('userId') as string; 
    const userEmail = formData.get('userEmail') as string | undefined;

    if (!userId) return { error: "User ID is missing. Cannot generate blog post." };

    await checkAndIncrementUsage(userId, 'blogPosts');

    const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { error: "User profile not found. Please set up your brand profile first." };
    }
    const brandData = userDocSnap.data() as BrandData;
    const isAdmin = brandData.userEmail === 'admin@brandforge.ai';

    const plansConfig = await getPlansConfig();
    const planKey = (brandData.plan === 'premium') ? 'pro' : 'free';
    const planDetails = plansConfig.USD[planKey];

    if (!isAdmin && planDetails.quotas.blogPosts <= 0) {
      return { error: "Blog post generation is not available on your current plan. Please upgrade or check plan details." };
    }
    
    await ensureUserBrandProfileDocExists(userId, userEmail);

    const industry = formData.get("industry") as string | null;
    const websiteUrl = formData.get("blogWebsiteUrl") as string | null;
    const articleStyle = formData.get("articleStyle") as string | null;
    const targetAudience = formData.get("targetAudience") as string | null;

    const input: GenerateBlogContentInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("blogBrandDescription") as string,
      keywords: formData.get("blogKeywords") as string,
      targetPlatform: formData.get("targetPlatform") as "Medium" | "Other",
      blogOutline: formData.get("blogOutline") as string,
      blogTone: formData.get("blogTone") as string,
    };

    if (industry && industry.trim() !== "") {
      input.industry = industry.trim();
    }
    if (websiteUrl && websiteUrl.trim() !== "") {
      input.websiteUrl = websiteUrl.trim();
    }
    if (articleStyle && articleStyle.trim() !== "") {
      input.articleStyle = articleStyle.trim();
    }
    if (targetAudience && targetAudience.trim() !== "") {
      input.targetAudience = targetAudience.trim();
    }

     if (!input.brandName || !input.brandDescription || !input.keywords || !input.targetPlatform || !input.blogOutline || !input.blogTone) {
      return { error: "All fields (except optional website URL and industry) including outline and tone are required for blog content generation." };
    }
    
    const result = await generateBlogContent(input);
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/blogPosts`);
    
    const docData: { [key: string]: any } = {
      title: result.title || "Untitled",
      content: result.content || "",
      tags: result.tags || "",
      platform: input.targetPlatform,
      blogTone: input.blogTone,
      createdAt: serverTimestamp(),
      status: 'draft',
    };
    
    if (input.industry) docData.industry = input.industry;
    if (input.websiteUrl) docData.websiteUrl = input.websiteUrl;
    if (input.articleStyle) docData.articleStyle = input.articleStyle;
    if (input.targetAudience) docData.targetAudience = input.targetAudience;

    await addDoc(firestoreCollectionRef, docData);

    return { data: result, message: "Blog content generated and saved successfully!" };
  } catch (e: any) {
    console.error("Error in handleGenerateBlogContentAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Failed to generate blog content: ${e.message || "Unknown error. Check server logs."}` };
  }
}

export async function handleGenerateAdCampaignAction(
  prevState: FormState<GenerateAdCampaignOutput>,
  formData: FormData
): Promise<FormState<GenerateAdCampaignOutput>> {
  try {
    const userId = formData.get('userId') as string; 
    const userEmail = formData.get('userEmail') as string | undefined;
    const platformsString = formData.get("platforms") as string;
    const platformsArray = platformsString ? platformsString.split(',').map(p => p.trim()).filter(p => p) as ('google_ads' | 'meta')[] : [];

    let generatedContent = formData.get("generatedContent") as string;
    if (generatedContent === "Custom content for ad campaign") {
        generatedContent = formData.get("customGeneratedContent") as string;
    }

    const budgetStr = formData.get("budget") as string;
    const budgetNum = budgetStr ? Number(budgetStr) : undefined;
    if (budgetNum === undefined || isNaN(budgetNum)) {
        return { error: "Budget must be a valid number." };
    }

    const industry = formData.get("industry") as string | null;
    const campaignGoal = formData.get("campaignGoal") as string | null;
    const targetAudience = formData.get("targetAudience") as string | null;
    const callToAction = formData.get("callToAction") as string | null;

    const input: GenerateAdCampaignInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("brandDescription") as string,
      generatedContent: generatedContent,
      targetKeywords: formData.get("targetKeywords") as string,
      budget: budgetNum,
      platforms: platformsArray,
    };

    if (industry && industry.trim() !== "") {
      input.industry = industry.trim();
    }
    if (campaignGoal && campaignGoal.trim() !== "") {
      input.campaignGoal = campaignGoal.trim();
    }
    if (targetAudience && targetAudience.trim() !== "") {
      input.targetAudience = targetAudience.trim();
    }
    if (callToAction && callToAction.trim() !== "") {
      input.callToAction = callToAction.trim();
    }

    if (!input.brandName || !input.brandDescription || !input.generatedContent || !input.targetKeywords || input.platforms.length === 0) {
        return { error: "Brand name, description, inspirational content, target keywords, and at least one platform are required." };
    }
    if (!input.generatedContent || !input.generatedContent.trim()) {
        return { error: "Inspirational content (selected or custom) cannot be empty."};
    }
     if (!userId) {
        return { error: "User ID is missing. Cannot save ad campaign."};
    }
    await ensureUserBrandProfileDocExists(userId, userEmail);

    const result = await generateAdCampaign(input);
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/adCampaigns`);
    
    const docData: { [key: string]: any } = {
      campaignConcept: result.campaignConcept || "",
      headlines: result.headlines || [],
      bodyTexts: result.bodyTexts || [],
      platformGuidance: result.platformGuidance || "",
      targetKeywords: input.targetKeywords,
      budget: input.budget,
      platforms: input.platforms,
      inspirationalContent: generatedContent,
      createdAt: serverTimestamp(),
      status: 'draft',
    };

    if (input.campaignGoal) docData.campaignGoal = input.campaignGoal;
    if (input.targetAudience) docData.targetAudience = input.targetAudience;
    if (input.callToAction) docData.callToAction = input.callToAction;

    await addDoc(firestoreCollectionRef, docData);
    return { data: result, message: "Ad campaign variations generated and saved successfully!" };
  } catch (e: any) {
    console.error("Error in handleGenerateAdCampaignAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Failed to generate ad campaign variations: ${e.message || "Unknown error. Check server logs."}` };
  }
}

export async function handleExtractBrandInfoFromUrlAction(
  prevState: FormState<ExtractBrandInfoFromUrlOutput>,
  formData: FormData
): Promise<FormState<ExtractBrandInfoFromUrlOutput>> {
  const websiteUrl = formData.get("websiteUrl") as string;
  if (!websiteUrl) {
      return { error: "Website URL is required." };
  }
  try {
      const input: ExtractBrandInfoFromUrlInput = { websiteUrl };
      const result = await extractBrandInfoFromUrl(input);
      return { data: result, message: "Brand information extracted successfully." };
  } catch (e: any) {
      console.error("Error in handleExtractBrandInfoFromUrlAction (Outer):", JSON.stringify(e, Object.getOwnPropertyNames(e)));
      return { error: `Failed to extract brand information from URL: ${e.message || "Unknown error. Check server logs."}` };
  }
}

export async function handleEnhanceBrandDescriptionAction(
  prevState: FormState<EnhanceBrandDescriptionOutput>,
  formData: FormData
): Promise<FormState<EnhanceBrandDescriptionOutput>> {
  const brandDescription = formData.get("brandDescription") as string;
  if (!brandDescription || brandDescription.length < 10) {
    return { error: "Brand description must be at least 10 characters long to enhance." };
  }
  try {
    const input: EnhanceBrandDescriptionInput = { brandDescription };
    const result = await enhanceBrandDescription(input);
    return { data: result, message: "Description enhanced successfully." };
  } catch (e: any) {
    console.error("Error in handleEnhanceBrandDescriptionAction:", e);
    return { error: `Failed to enhance description: ${e.message || "Unknown error."}` };
  }
}

export async function handlePopulateImageFormAction(
  prevState: FormState<PopulateImageFormOutput>,
  formData: FormData
): Promise<FormState<PopulateImageFormOutput>> {
  const userRequest = formData.get("userRequest") as string;
  const currentBrandDescription = formData.get("currentBrandDescription") as string;
  if (!userRequest) {
    return { error: "Please describe what you want to create." };
  }
  try {
    const input: PopulateImageFormInput = { userRequest, currentBrandDescription };
    const result = await populateImageForm(input);
    return { data: result, message: "Form fields populated by AI!" };
  } catch (e: any) {
    console.error("Error in handlePopulateImageFormAction:", e);
    return { error: `Failed to populate form: ${e.message || "Unknown error."}` };
  }
}

export async function handlePopulateSocialFormAction(
  prevState: FormState<PopulateSocialFormOutput>,
  formData: FormData
): Promise<FormState<PopulateSocialFormOutput>> {
  const userRequest = formData.get("userRequest") as string;
  const currentBrandDescription = formData.get("currentBrandDescription") as string;
  if (!userRequest) {
    return { error: "Please describe your social post idea." };
  }
  try {
    const input: PopulateSocialFormInput = { userRequest, currentBrandDescription };
    const result = await populateSocialForm(input);
    return { data: result, message: "Social media form populated by AI!" };
  } catch (e: any) {
    console.error("Error in handlePopulateSocialFormAction:", e);
    return { error: `Failed to populate form: ${e.message || "Unknown error."}` };
  }
}

export async function handlePopulateBlogFormAction(
  prevState: FormState<PopulateBlogFormOutput>,
  formData: FormData
): Promise<FormState<PopulateBlogFormOutput>> {
  const userRequest = formData.get("userRequest") as string;
  const currentBrandDescription = formData.get("currentBrandDescription") as string;
  const currentKeywords = formData.get("currentKeywords") as string;
  if (!userRequest) {
    return { error: "Please describe your blog post idea." };
  }
  try {
    const input: PopulateBlogFormInput = { userRequest, currentBrandDescription, currentKeywords };
    const result = await populateBlogForm(input);
    return { data: result, message: "Blog form populated by AI!" };
  } catch (e: any) {
    console.error("Error in handlePopulateBlogFormAction:", e);
    return { error: `Failed to populate form: ${e.message || "Unknown error."}` };
  }
}

export async function handlePopulateAdCampaignFormAction(
  prevState: FormState<PopulateAdCampaignFormOutput>,
  formData: FormData
): Promise<FormState<PopulateAdCampaignFormOutput>> {
  const userRequest = formData.get("userRequest") as string;
  const currentBrandDescription = formData.get("currentBrandDescription") as string;
  const currentKeywords = formData.get("currentKeywords") as string;

  if (!userRequest) {
    return { error: "Please describe your ad campaign idea." };
  }
  try {
    const input: PopulateAdCampaignFormInput = { userRequest, currentBrandDescription, currentKeywords };
    const result = await populateAdCampaignForm(input);
    return { data: result, message: "Ad campaign form populated by AI!" };
  } catch (e: any) {
    console.error("Error in handlePopulateAdCampaignFormAction:", e);
    return { error: `Failed to populate form: ${e.message || "Unknown error."}` };
  }
}

export async function handleEditImageAction(
  prevState: FormState<EditImageOutput>,
  formData: FormData
): Promise<FormState<EditImageOutput>> {
  try {
    const userId = formData.get("userId") as string;
    if (!userId) {
      return { error: "User not authenticated. Cannot refine image." };
    }

    await checkAndIncrementUsage(userId, 'imageGenerations');

    let imageDataUri = formData.get("imageDataUri") as string;
    const instruction = formData.get("instruction") as string;

    if (!imageDataUri || !instruction) {
      return { error: "Base image and an instruction are required for refinement." };
    }

    // If the image is a URL, fetch it on the server and convert to data URI
    if (imageDataUri.startsWith('http')) {
        // Decode HTML entities that might be present in the URL (e.g., &amp; -> &)
        const decodedUrl = decodeHtmlEntitiesInUrl(imageDataUri);
        
        console.log(`[handleEditImageAction] Received URL, fetching image data from: ${decodedUrl}`);
        if (decodedUrl !== imageDataUri) {
          console.log(`[handleEditImageAction] URL was HTML-encoded, decoded from: ${imageDataUri}`);
        }
        
        try {
            const response = await fetch(decodedUrl);
            if (!response.ok) {
                throw new Error(`HTTP error fetching media '${decodedUrl}': ${response.status} ${response.statusText}`);
            }
            const blob = await response.blob();
            const buffer = Buffer.from(await blob.arrayBuffer());
            imageDataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;
            console.log(`[handleEditImageAction] Successfully converted URL to data URI.`);
        } catch (fetchError: any) {
            console.error(`[handleEditImageAction] Failed to fetch image from URL:`, fetchError);
            throw new Error(`Error fetching image data: ${fetchError.message}`);
        }
    }
    
    const input: EditImageInput = {
      imageDataUri,
      instruction,
    };
    
    const result = await editImage(input);
    
    // The result from editImage is a data URI. Return it directly.
    return { data: { editedImageDataUri: result.editedImageDataUri }, message: "Image refinement successful." };
  } catch (e: any) {
    console.error("Error in handleEditImageAction:", e);
    return { error: `Failed to refine image: ${e.message || "Unknown error."}` };
  }
}

export async function handleEnhanceRefinePromptAction(
  prevState: FormState<EnhanceRefinePromptOutput>,
  formData: FormData
): Promise<FormState<EnhanceRefinePromptOutput>> {
  try {
    const input: EnhanceRefinePromptInput = {
      instruction: formData.get("instruction") as string,
    };

    if (!input.instruction) {
      return { error: "An instruction is required to enhance the prompt." };
    }

    const result = await enhanceRefinePrompt(input);
    return { data: result, message: "Refinement prompt enhanced." };
  } catch (e: any) {
    console.error("Error in handleEnhanceRefinePromptAction:", e);
    return { error: `Failed to enhance prompt: ${e.message || "Unknown error."}` };
  }
}

export async function handleEnhanceTextToFeatureAction(
  prevState: FormState<EnhanceTextToFeatureOutput>,
  formData: FormData
): Promise<FormState<EnhanceTextToFeatureOutput>> {
  try {
    const input: EnhanceTextToFeatureInput = {
      textToFeature: formData.get("textToFeature") as string,
    };

    if (!input.textToFeature) {
      return { error: "Text to feature is required to enhance the prompt." };
    }

    const result = await enhanceTextToFeature(input);
    return { data: result, message: "Text-to-Feature prompt enhanced." };
  } catch (e: any) {
    console.error("Error in handleEnhanceTextToFeatureAction:", e);
    return { error: `Failed to enhance prompt: ${e.message || "Unknown error."}` };
  }
}


const generateFilenamePart = () => Math.random().toString(36).substring(2, 10);

export async function handleSaveGeneratedImagesAction(
  prevState: FormState<{savedCount: number}>,
  formData: FormData
): Promise<FormState<{savedCount: number}>> {
  console.log('--- [Save Images Action] START ---');
  const userId = formData.get('userId') as string;
  const userEmail = formData.get('userEmail') as string | undefined; 
  
  console.log(`[Save Images Action] User ID received: ${userId}`);
  console.log(`[Save Images Action] User Email received: ${userEmail}`);

  if (!userId || typeof userId !== 'string') {
    const errorMsg = 'User not authenticated - userId is missing or invalid.';
    console.error(`[Save Images Action] ERROR: ${errorMsg}`);
    return { error: errorMsg };
  }

  try {
    console.log(`[Save Images Action] STEP 1: Ensuring brand profile exists for userId: ${userId}`);
    await ensureUserBrandProfileDocExists(userId, userEmail);
    console.log(`[Save Images Action] STEP 1 COMPLETE.`);
    
    console.log('[Save Images Action] STEP 2: Retrieving image data from form.');
    const imagesToSaveString = formData.get('imagesToSaveJson') as string;
    if (!imagesToSaveString) {
      const errorMsg = "No image data received from the client (imagesToSaveJson is missing).";
      console.error(`[Save Images Action] ERROR: ${errorMsg}`);
      return { error: errorMsg };
    }
    console.log(`[Save Images Action] Raw imagesToSaveJson string (first 200 chars): ${imagesToSaveString.substring(0, 200)}...`);


    console.log('[Save Images Action] STEP 3: Parsing JSON data.');
    let imagesToSave: { dataUri: string; prompt: string; style: string; }[];
    try {
      imagesToSave = JSON.parse(imagesToSaveString);
      console.log(`[Save Images Action] JSON parsed successfully. Number of images to process: ${imagesToSave.length}`);
    } catch (e: any) {
      const errorMsg = `Invalid image data format received from client: ${e.message}.`;
      console.error(`[Save Images Action] JSON PARSE ERROR: ${errorMsg}`, JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
      return { error: errorMsg };
    }

    if (!Array.isArray(imagesToSave) || imagesToSave.length === 0) {
      const errorMsg = "No images selected or data is not in expected array format after parsing.";
      console.error(`[Save Images Action] ERROR: ${errorMsg}. Parsed data:`, imagesToSave);
      return { error: errorMsg };
    }
    
    console.log('[Save Images Action] STEP 4: Starting loop to process and save images.');
    const brandProfileDocId = userId; 
    let savedCount = 0;
    const saveErrors: string[] = [];

    for (const [index, image] of imagesToSave.entries()) {
      console.log(`[Save Images Action] -> Processing image ${index + 1}/${imagesToSave.length}...`);
      
      if (!image.dataUri || !(image.dataUri.startsWith('data:image') || image.dataUri.startsWith('image_url:') || image.dataUri.startsWith('https://'))) {
          const errorDetail = `Invalid or missing data URI for image ${index + 1}. URI starts with: ${image.dataUri?.substring(0, 30) || 'N/A'}...`;
          console.warn(`[Save Images Action] -> WARNING: ${errorDetail}. Skipping save for this image.`);
          saveErrors.push(errorDetail);
          continue;
      }

      try {
        let imageUrlToSave = image.dataUri;
        
        if (image.dataUri.startsWith('data:image')) {
            console.log(`[Save Images Action] -> Image ${index + 1} is a data URI. Preparing to upload to Storage...`);
            const fileExtensionMatch = image.dataUri.match(/^data:image\/([a-zA-Z+]+);base64,/);
            const fileExtension = fileExtensionMatch ? fileExtensionMatch[1] : 'png';
            const filePath = `users/${userId}/brandProfiles/${brandProfileDocId}/generatedLibraryImages/${Date.now()}_${generateFilenamePart()}.${fileExtension}`;
            const imageStorageRef = storageRef(storage, filePath);
            console.log(`[Save Images Action] -> Uploading to path: ${filePath}`);
            const snapshot = await uploadString(imageStorageRef, image.dataUri, 'data_url');
            imageUrlToSave = await getDownloadURL(snapshot.ref);
            console.log(`[Save Images Action] -> Image ${index + 1} uploaded to Storage. URL: ${imageUrlToSave}`);
        } else {
            console.log(`[Save Images Action] -> Image ${index + 1} is a URL. Saving directly.`);
            if (image.dataUri.startsWith('image_url:')) {
                imageUrlToSave = image.dataUri.substring(10);
            }
        }

        const firestoreCollectionPath = `users/${userId}/brandProfiles/${brandProfileDocId}/savedLibraryImages`;
        console.log(`[Save Images Action] -> Preparing to write image ${index + 1} metadata to Firestore at path: ${firestoreCollectionPath}`);
        const firestoreCollectionRef = collection(db, firestoreCollectionPath);
        const docToWrite = {
            storageUrl: imageUrlToSave,
            prompt: image.prompt || "N/A",
            style: image.style || "N/A",
            createdAt: serverTimestamp(),
        };
        console.log(`[Save Images Action] -> Document to write:`, docToWrite);
        await addDoc(firestoreCollectionRef, docToWrite);
        console.log(`[Save Images Action] -> Successfully wrote image ${index + 1} metadata to Firestore.`);
        savedCount++;
      } catch (e: any) {
        const specificError = `Failed during processing of image ${index + 1}: ${(e as Error).message?.substring(0,150)}`;
        console.error(`[Save Images Action] -> LOOP ERROR for image ${index+1}: ${specificError}. Full error:`, JSON.stringify(e, Object.getOwnPropertyNames(e)));
        saveErrors.push(specificError);
        continue;
      }
    }

    console.log(`[Save Images Action] STEP 4 COMPLETE. Finished processing all images. Saved: ${savedCount}, Errors: ${saveErrors.length}`);

    if (savedCount > 0 && saveErrors.length > 0) {
      const finalMessage = `Successfully saved ${savedCount} image(s). Some errors occurred: ${saveErrors.join('. ')}`;
      console.log(`[Save Images Action] RETURNING (partial success): ${finalMessage}`);
      return { data: {savedCount}, message: finalMessage };
    } else if (savedCount > 0) {
      const finalMessage = `${savedCount} image(s) saved successfully to your library!`;
      console.log(`[Save Images Action] RETURNING (full success): ${finalMessage}`);
      return { data: {savedCount}, message: finalMessage };
    } else if (saveErrors.length > 0) {
      const finalMessage = `Failed to save any images. Errors: ${saveErrors.join('. ')}`;
      console.log(`[Save Images Action] RETURNING (full failure): ${finalMessage}`);
      return { error: finalMessage };
    } else {
      const finalMessage = "No images were processed or saved. This might be due to an issue with the input data or no images being selected.";
      console.log(`[Save Images Action] RETURNING (no images processed): ${finalMessage}`);
      return { error: finalMessage };
    }
  } catch (e: any) {
      const criticalErrorMsg = `A critical server error occurred during image saving: ${e.message || "Unknown error"}.`;
      console.error("[Save Images Action] CRITICAL ERROR (outer try-catch):", JSON.stringify(e, Object.getOwnPropertyNames(e), 2), `UserId: '${userId}'`);
      return { error: criticalErrorMsg };
  }
}

export async function handleDeleteSavedImageAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const userId = formData.get('userId') as string;
  const imageId = formData.get('imageId') as string;
  const storageUrl = formData.get('storageUrl') as string;

  if (!userId || !imageId || !storageUrl) {
      return { error: 'Missing required information to delete the image.' };
  }
  
  try {
      const imageDocRef = doc(db, 'users', userId, 'brandProfiles', userId, 'savedLibraryImages', imageId);
      await deleteDoc(imageDocRef);

      try {
          const imageStorageRef = storageRef(storage, storageUrl);
          await deleteObject(imageStorageRef);
      } catch (storageError: any) {
          console.warn(`[handleDeleteSavedImageAction] Failed to delete file from Storage, but Firestore doc was deleted. This may result in an orphaned file. URL: ${storageUrl}. Error:`, storageError);
      }

      return { data: { success: true }, message: 'Image deleted successfully.' };

  } catch (e: any) {
      console.error('Error in handleDeleteSavedImageAction:', e);
      if (e.code === 'permission-denied') {
          return { error: "Permission denied. You can't delete this image." };
      }
      return { error: `Failed to delete image: ${e.message || "Unknown error."}` };
  }
}

async function _checkFreepikTaskStatus(taskId: string): Promise<{ status: string; images: string[] | null }> {
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  if (!freepikApiKey) {
    throw new Error("FREEPIK_API_KEY is not set in environment variables for checking task status.");
  }

  const url = `https://api.freepik.com/v1/ai/text-to-image/imagen3/${taskId}`;
  

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-freepik-api-key': freepikApiKey,
      },
    });

    const responseData = await response.json();
    

    if (!response.ok) {
      throw new Error(`Freepik GET API error for task ${taskId}: ${response.status} - ${responseData.title || responseData.detail || JSON.stringify(responseData)}`);
    }

    if (responseData.data && responseData.data.status) {
      if (responseData.data.status === 'COMPLETED' && responseData.data.generated && responseData.data.generated.length > 0) {
        return { status: responseData.data.status, images: responseData.data.generated as string[] };
      }
      return { status: responseData.data.status, images: null };
    } else {
      throw new Error(`Freepik GET API for task ${taskId} did not return data in expected format.`);
    }
  } catch (error: any) {
    console.error(`Error calling Freepik GET API for task ${taskId}:`, error);
    throw new Error(`Freepik GET API request failed for task ${taskId}: ${error.message}`);
  }
}

export async function handleCheckFreepikTaskStatusAction(
  prevState: FormState<{ status: string; images: string[] | null; taskId: string }>,
  formData: FormData
): Promise<FormState<{ status: string; images: string[] | null; taskId: string }>> {
  const taskId = formData.get("taskId") as string;
  if (!taskId) {
    return { error: "Task ID is required.", taskId: "" };
  }
  try {
    const result = await _checkFreepikTaskStatus(taskId);
    if (result.status === 'COMPLETED' && result.images && result.images.length > 0) {
      return { data: { ...result, taskId }, message: `Task ${taskId.substring(0,8)}... completed. Image(s) retrieved.` };
    } else if (result.status === 'IN_PROGRESS') {
      return { data: { ...result, taskId }, message: `Task ${taskId.substring(0,8)}... is still in progress.` };
    } else if (result.status === 'FAILED') {
       return { data: { ...result, taskId }, error: `Task ${taskId.substring(0,8)}... FAILED on Freepik's side.`};
    } else {
      return { data: { ...result, taskId }, error: `Task ${taskId.substring(0,8)}... status: ${result.status}. No images available yet or unexpected status.`};
    }
  } catch (e: any) {
    console.error(`Error in handleCheckFreepikTaskStatusAction for task ${taskId}:`, JSON.stringify(e, Object.getOwnPropertyNames(e)));
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return { error: `Failed to check Freepik task status for ${taskId.substring(0,8)}...: ${errorMessage}.`, taskId };
  }
}

export async function handleGenerateBrandLogoAction(
  prevState: FormState<GenerateBrandLogoOutput>,
  formData: FormData
): Promise<FormState<GenerateBrandLogoOutput>> {
  try {
    const userId = formData.get('userId') as string;
    const userEmail = formData.get('userEmail') as string | undefined;

    const input: GenerateBrandLogoInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("brandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      targetKeywords: formData.get("targetKeywords") as string | undefined,
      logoShape: formData.get("logoShape") as GenerateBrandLogoInput['logoShape'] | undefined,
      logoStyle: formData.get("logoStyle") as GenerateBrandLogoInput['logoStyle'] | undefined,
    };

    if (!input.brandName || !input.brandDescription) {
      return { error: "Brand name and description are required for logo generation." };
    }
     if (input.industry === "" || input.industry === undefined) delete input.industry;
     if (input.targetKeywords === "" || input.targetKeywords === undefined) delete input.targetKeywords;
     if (!input.logoShape || input.logoShape === undefined) delete input.logoShape;
     if (!input.logoStyle || input.logoStyle === undefined) delete input.logoStyle;
    if (!userId) {
        return { error: "User ID is missing. Cannot save brand logo."};
    }
    await ensureUserBrandProfileDocExists(userId, userEmail);


    const result = await generateBrandLogo(input);
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/brandLogos`);
    await addDoc(firestoreCollectionRef, {
      logoData: result.logoDataUri || "",
      brandName: input.brandName,
      logoShape: input.logoShape || "circle",
      logoStyle: input.logoStyle || "modern",
      createdAt: serverTimestamp(),
    });
    return { data: result, message: "Brand logo generated and saved successfully!" };
  } catch (e: any) {
    console.error("Error in handleGenerateBrandLogoAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Failed to generate brand logo: ${e.message || "Unknown error. Check server logs."}` };
  }
}

export async function handleGenerateBrandForgeAppLogoAction(
  prevState: FormState<GenerateBrandForgeAppLogoOutput>,
  formData: FormData 
): Promise<FormState<GenerateBrandForgeAppLogoOutput>> {
  try {
    const result = await generateBrandForgeAppLogo();
    return { data: result, message: "BrandForge AI application logo generated successfully!" };
  } catch (e: any) {
    console.error("Error in handleGenerateBrandForgeAppLogoAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Failed to generate BrandForge AI app logo: ${e.message || "Unknown error. Check server logs."}` };
  }
}

export async function handleGetAllUserProfilesForAdminAction(
  prevState: FormState<UserProfileSelectItem[]>,
  formData: FormData
): Promise<FormState<UserProfileSelectItem[]>> {
  const adminRequesterEmail = formData.get('adminRequesterEmail') as string;

  if (adminRequesterEmail !== 'admin@brandforge.ai') {
    return { error: "Unauthorized: You do not have permission to perform this action." };
  }

  try {
    const usersCollectionRef = collection(db, 'users');
    const userDocsSnapshot = await getDocs(usersCollectionRef);
    
    if (userDocsSnapshot.empty) {
      return { data: [], message: "No users found in the database." };
    }

    const profiles: UserProfileSelectItem[] = [];
    for (const userDoc of userDocsSnapshot.docs) {
      const userId = userDoc.id;
      const profileDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
      const profileDocSnap = await getDoc(profileDocRef);

      if (profileDocSnap.exists()) {
        const data = profileDocSnap.data() as BrandData;
        const endDate = data.subscriptionEndDate;
        profiles.push({
          userId: userId,
          brandName: data.brandName || "Unnamed Brand",
          userEmail: data.userEmail || userDoc.data().email || "No Email",
          plan: data.plan || 'free',
          subscriptionEndDate: endDate ? (endDate as any).toDate().toISOString() : null,
        });
      }
    }
    
    return { data: profiles, message: "User profiles fetched successfully." };

  } catch (e: any) {
    if (e.code === 'permission-denied') {
        return { error: "Database permission error. Check Firestore rules." };
    } else if (e.code === 'unavailable') {
        return { error: "Database unavailable. Check internet connection." };
    }
    
    return { error: `Failed to fetch user profiles: ${e.message || "Unknown error"}` };
  }
}

export async function handleGetUsageForAllUsersAction(
  prevState: FormState<AdminUserUsage[]>,
  formData: FormData
): Promise<FormState<AdminUserUsage[]>> {
  const adminRequesterEmail = formData.get('adminRequesterEmail') as string;

  if (adminRequesterEmail !== 'admin@brandforge.ai') {
    return { error: "Unauthorized: You do not have permission to perform this action." };
  }

  try {
    const userIndexRef = doc(db, 'userIndex', 'profiles');
    const userIndexSnap = await getDoc(userIndexRef);

    if (!userIndexSnap.exists()) {
      return { data: [], message: "No user index found." };
    }
    
    const userIndex = userIndexSnap.data();
    const userIds = Object.keys(userIndex);

    if (userIds.length === 0) {
      return { data: [], message: "No users found." };
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const usageDocId = `${year}-${month}`;

    const usageDataPromises = userIds.map(async (userId) => {
      const usageDocRef = doc(db, `users/${userId}/usage`, usageDocId);
      const usageDocSnap = await getDoc(usageDocRef);
      
      const userData = userIndex[userId];
      
      if (usageDocSnap.exists()) {
        const usage = usageDocSnap.data() as MonthlyUsage;
        return {
          userId,
          brandName: userData.brandName || "Unnamed Brand",
          userEmail: userData.userEmail || "No Email",
          ...usage
        };
      } else {
        return {
          userId,
          brandName: userData.brandName || "Unnamed Brand",
          userEmail: userData.userEmail || "No Email",
          imageGenerations: 0,
          socialPosts: 0,
          blogPosts: 0,
        };
      }
    });

    const allUsageData = await Promise.all(usageDataPromises);

    return { data: allUsageData, message: "User usage data fetched successfully." };

  } catch (e: any) {
    if (e.code === 'permission-denied') {
      return { error: "Database permission error. Check Firestore rules." };
    }
    return { error: `Failed to fetch usage data: ${e.message || "Unknown error."}` };
  }
}

export async function handleResetUserUsageByAdminAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const adminRequesterEmail = formData.get('adminRequesterEmail') as string;
  const userId = formData.get('userId') as string;

  if (adminRequesterEmail !== 'admin@brandforge.ai') {
    return { error: "Unauthorized: You do not have permission to perform this action." };
  }

  if (!userId) {
    return { error: "User ID is required to reset usage." };
  }

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const usageDocId = `${year}-${month}`;
    
    const usageDocRef = doc(db, 'users', userId, 'usage', usageDocId);
    
    await deleteDoc(usageDocRef);

    return { data: { success: true }, message: `Successfully reset current month's usage quota for user.` };

  } catch (e: any) {
    console.error("Error resetting user usage by admin:", e);
    return { error: `Failed to reset user usage: ${e.message || "Unknown error."}` };
  }
}


export async function handleUpdateUserPlanByAdminAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const adminRequesterEmail = formData.get('adminRequesterEmail') as string;
  const userId = formData.get('userId') as string;
  const newPlan = formData.get('plan') as 'free' | 'premium';
  const newEndDateStr = formData.get('subscriptionEndDate') as string | null;

  if (adminRequesterEmail !== 'admin@brandforge.ai') {
    return { error: "Unauthorized: You do not have permission to perform this action." };
  }
  if (!userId || !newPlan) {
    return { error: "User ID and new plan are required." };
  }

  try {
    const brandProfileRef = doc(db, 'users', userId, 'brandProfiles', userId);
    const updateData: Partial<BrandData> = { plan: newPlan };

    if (newPlan === 'premium') {
      if (newEndDateStr) {
        updateData.subscriptionEndDate = new Date(newEndDateStr);
      } else {
        const profileSnap = await getDoc(brandProfileRef);
        const currentData = profileSnap.data() as BrandData | undefined;
        const currentEndDate = currentData?.subscriptionEndDate?.toDate
          ? currentData.subscriptionEndDate.toDate()
          : currentData?.subscriptionEndDate
          ? new Date(currentData.subscriptionEndDate)
          : null;

        if (!currentEndDate || currentEndDate <= new Date()) {
          const newEndDate = new Date();
          newEndDate.setDate(newEndDate.getDate() + 30);
          updateData.subscriptionEndDate = newEndDate;
        }
      }
    } else { 
      updateData.subscriptionEndDate = null;
    }

    await setDoc(brandProfileRef, updateData, { merge: true });
    
    return { data: { success: true }, message: `Successfully updated ${userId}'s plan to ${newPlan}.` };

  } catch (e: any) {
    console.error("Error updating user plan by admin:", e);
    return { error: `Failed to update user plan: ${e.message || "Unknown error."}` };
  }
}


export async function handleGetSettingsAction(
  prevState: FormState<ModelConfig>,
  formData: FormData
): Promise<FormState<ModelConfig>> {
  const adminRequesterEmail = formData.get('adminRequesterEmail') as string;
  if (adminRequesterEmail !== 'admin@brandforge.ai') {
    return { error: "Unauthorized: You do not have permission to perform this action." };
  }
  try {
    const modelConfig = await getModelConfig(true); 
    return { data: modelConfig, message: "Model configuration loaded." };
  } catch (e: any) {
    console.error("Error in handleGetSettingsAction:", e);
    return { error: `Failed to load model configuration: ${e.message || "Unknown error."}` };
  }
}

export async function handleUpdateSettingsAction(
  prevState: FormState<ModelConfig>,
  formData: FormData
): Promise<FormState<ModelConfig>> {
  const adminRequesterEmail = formData.get('adminRequesterEmail') as string;
  if (adminRequesterEmail !== 'admin@brandforge.ai') {
    return { error: "Unauthorized: You do not have permission to perform this action." };
  }

  try {
    const modelConfig: ModelConfig = {
      imageGenerationModel: formData.get("imageGenerationModel") as string,
      textToImageModel: formData.get("textToImageModel") as string,
      fastModel: formData.get("fastModel") as string,
      visionModel: formData.get("visionModel") as string,
      powerfulModel: formData.get("powerfulModel") as string,
      paymentMode: formData.get("paymentMode") as 'live' | 'test' | undefined,
      freepikEnabled: formData.get("freepikEnabled") === 'true',
      socialMediaConnectionsEnabled: formData.get("socialMediaConnectionsEnabled") === 'true',
    };
    
    if (!modelConfig.imageGenerationModel || !modelConfig.textToImageModel || !modelConfig.fastModel || !modelConfig.visionModel || !modelConfig.powerfulModel) {
        return { error: "All model fields are required." };
    }

    const configDocRef = doc(db, 'configuration', 'models');
    await setDoc(configDocRef, modelConfig, { merge: true });
    clearModelConfigCache();

    return { data: modelConfig, message: "Model configuration updated successfully." };
  } catch (e: any) {
    console.error("Error in handleUpdateSettingsAction:", e);
    return { error: `Failed to update model configuration: ${e.message || "Unknown error."}` };
  }
}

export async function handleCreateSubscriptionAction(
  prevState: FormState<{ orderId: string; amount: number; currency: string } | null>,
  formData: FormData
): Promise<FormState<{ orderId: string; amount: number; currency: string } | null>> {
  const planId = formData.get('planId') as string;
  const userId = formData.get('userId') as string;
  const currency = formData.get('currency') as 'USD' | 'INR';

  const settings = await getModelConfig();
  const isTestMode = settings.paymentMode === 'test';

  const keyId = isTestMode ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID_TEST : process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = isTestMode ? process.env.RAZORPAY_KEY_SECRET_TEST : process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    const errorMsg = "Payment gateway is not configured correctly for the selected mode (Live/Test). Please contact support.";
    console.error(`Razorpay API keys are not configured correctly for ${isTestMode ? 'Test' : 'Live'} mode.`);
    return { error: errorMsg };
  }

  if (!planId || !userId || !currency) {
    return { error: "Plan, user ID, and currency are required to create a subscription." };
  }

  const plansConfig = await getPlansConfig();
  const planDetails = plansConfig[currency]?.pro;

  if (!planDetails || !planDetails.price.amount.match(/\d+/)) {
      return { error: "Selected plan is invalid or has no price." };
  }
  
  const amountInPaise = parseInt(planDetails.price.amount.replace(/[^0-9]/g, ''), 10) * 100;

  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `bf_rcpt_${crypto.randomBytes(8).toString('hex')}`,
      notes: {
        userId: userId,
        planId: planId,
      }
    };
    
    const order = await razorpay.orders.create(options);
    
    if (!order) {
        return { error: "Failed to create order with payment gateway." };
    }

    return {
        data: {
            orderId: order.id,
            amount: Number(order.amount),
            currency: order.currency
        },
        message: "Order created successfully."
    };

  } catch (e: any) {
    console.error("Error creating Razorpay order:", JSON.stringify(e, null, 2));
    const errorMessage = e?.error?.description || e.message || "An unexpected error occurred with the payment gateway.";
    return { error: `Failed to create subscription order: ${errorMessage}` };
  }
}

export async function handleVerifyPaymentAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
  const razorpay_order_id = formData.get('razorpay_order_id') as string;
  const razorpay_signature = formData.get('razorpay_signature') as string;
  const userId = formData.get('userId') as string;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !userId) {
    return { error: 'Missing payment verification details.' };
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  try {
    const settings = await getModelConfig();
    const isTestMode = settings.paymentMode === 'test';
    const secretToUse = isTestMode ? process.env.RAZORPAY_KEY_SECRET_TEST : process.env.RAZORPAY_KEY_SECRET;

    if (!secretToUse) {
      console.error(`Razorpay secret key is not configured for the current payment mode: ${isTestMode ? 'Test' : 'Live'}`);
      return { error: "Payment verification failed: Server configuration error." };
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secretToUse)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const usageDocId = `${year}-${month}`;
      const usageDocRef = doc(db, 'users', userId, 'usage', usageDocId);
      
      await deleteDoc(usageDocRef);
      console.log(`[Plan Renewal] Usage quota for ${usageDocId} has been reset for user ${userId}.`);
      
      const brandDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); 

      await setDoc(brandDocRef, { 
        plan: 'premium',
        subscriptionEndDate: subscriptionEndDate 
      }, { merge: true });
      
      return { data: { success: true }, message: 'Payment verified and plan updated.' };
    } else {
      return { error: 'Payment verification failed. Invalid signature.' };
    }
  } catch (e: any) {
    console.error('Error during payment verification:', e);
    return { error: `An unexpected error occurred: ${e.message}` };
  }
}

export async function getPaymentMode(): Promise<{ paymentMode: 'live' | 'test', freepikEnabled: boolean, socialMediaConnectionsEnabled: boolean, error?: string }> {
  try {
    const { paymentMode, freepikEnabled, socialMediaConnectionsEnabled } = await getModelConfig();
    return { 
      paymentMode: paymentMode || 'test', 
      freepikEnabled: freepikEnabled || false,
      socialMediaConnectionsEnabled: socialMediaConnectionsEnabled !== false // default to true if undefined
    };
  } catch (e: any) {
    console.error("Error fetching payment mode:", e);
    return { paymentMode: 'test', freepikEnabled: false, socialMediaConnectionsEnabled: true, error: `Could not retrieve payment mode configuration.` };
  }
}

export async function handleGetPlansConfigAction(
  prevState: FormState<PlansConfig>,
  formData?: FormData
): Promise<FormState<PlansConfig>> {
   const adminRequesterEmail = formData?.get('adminRequesterEmail') as string | undefined;
   const forceRefresh = !!adminRequesterEmail; 
  try {
    const plansConfig = await getPlansConfig(forceRefresh);
    return { data: plansConfig, message: "Plans configuration loaded." };
  } catch (e: any) {
    console.error("Error in handleGetPlansConfigAction:", e);
    return { error: `Failed to load plans configuration: ${e.message || "Unknown error."}` };
  }
}

export async function handleUpdatePlansConfigAction(
  prevState: FormState<PlansConfig>,
  formData: FormData
): Promise<FormState<PlansConfig>> {
  const adminRequesterEmail = formData.get('adminRequesterEmail') as string;
  if (adminRequesterEmail !== 'admin@brandforge.ai') {
    return { error: "Unauthorized: You do not have permission to perform this action." };
  }

  try {
    const currentConfig = await getPlansConfig(true); // Get the latest config to merge with
    
    const updatedConfig: PlansConfig = JSON.parse(JSON.stringify(currentConfig)); // Deep copy

    // Update USD Pro Plan
    updatedConfig.USD.pro.price.amount = formData.get('usd_pro_price') as string;
    updatedConfig.USD.pro.price.originalAmount = formData.get('usd_pro_original_price') as string || undefined;
    updatedConfig.USD.pro.quotas.imageGenerations = Number(formData.get('pro_images_quota'));
    updatedConfig.USD.pro.quotas.socialPosts = Number(formData.get('pro_social_quota'));
    updatedConfig.USD.pro.quotas.blogPosts = Number(formData.get('pro_blogs_quota'));
    
    // Update INR Pro Plan
    updatedConfig.INR.pro.price.amount = formData.get('inr_pro_price') as string;
    updatedConfig.INR.pro.price.originalAmount = formData.get('inr_pro_original_price') as string || undefined;
    updatedConfig.INR.pro.quotas.imageGenerations = Number(formData.get('pro_images_quota'));
    updatedConfig.INR.pro.quotas.socialPosts = Number(formData.get('pro_social_quota'));
    updatedConfig.INR.pro.quotas.blogPosts = Number(formData.get('pro_blogs_quota'));

    // Update Free Plan (quotas are the same across currencies)
    updatedConfig.USD.free.quotas.imageGenerations = Number(formData.get('free_images_quota'));
    updatedConfig.USD.free.quotas.socialPosts = Number(formData.get('free_social_quota'));
    updatedConfig.USD.free.quotas.blogPosts = Number(formData.get('free_blogs_quota'));
    updatedConfig.INR.free.quotas.imageGenerations = Number(formData.get('free_images_quota'));
    updatedConfig.INR.free.quotas.socialPosts = Number(formData.get('free_social_quota'));
    updatedConfig.INR.free.quotas.blogPosts = Number(formData.get('free_blogs_quota'));

    const configDocRef = doc(db, 'configuration', 'plans');
    await setDoc(configDocRef, updatedConfig);
    clearPlansConfigCache();

    return { data: updatedConfig, message: "Plans configuration updated successfully." };
  } catch (e: any) {
    console.error("Error in handleUpdatePlansConfigAction:", e);
    return { error: `Failed to update plans configuration: ${e.message || "Unknown error."}` };
  }
}

export async function handleUpdateContentStatusAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const userId = formData.get('userId') as string;
  const docPath = formData.get('docPath') as string;
  const newStatus = formData.get('newStatus') as 'draft' | 'scheduled' | 'deployed';

  if (!userId || !docPath || !newStatus) {
    return { error: 'Missing required information to update content status.' };
  }

  if (!docPath.startsWith(`users/${userId}/`)) {
    return { error: "Permission denied. You cannot modify this content." };
  }

  try {
    const docRef = doc(db, docPath);
    await setDoc(docRef, { status: newStatus }, { merge: true });
    return { data: { success: true }, message: `Content status updated to ${newStatus}.` };
  } catch (e: any) {
    console.error('Error in handleUpdateContentStatusAction:', e);
    return { error: `Failed to update status: ${e.message || "Unknown error."}` };
  }
}

export async function handleUpdateContentAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const userId = formData.get('userId') as string;
  const docPath = formData.get('docPath') as string;
  const contentType = formData.get('contentType') as 'social' | 'blog' | 'ad';

  if (!userId || !docPath || !contentType) {
    return { error: 'Missing required information to update content.' };
  }

  if (!docPath.startsWith(`users/${userId}/`)) {
    return { error: "Permission denied. You cannot modify this content." };
  }
  
  try {
    const docRef = doc(db, docPath);
    const updateData: { [key: string]: any } = {};

    switch (contentType) {
        case 'social':
            updateData.caption = formData.get('caption') as string;
            updateData.hashtags = formData.get('hashtags') as string;
            break;
        case 'blog':
            updateData.title = formData.get('title') as string;
            updateData.content = formData.get('content') as string;
            updateData.tags = formData.get('tags') as string;
            break;
        case 'ad':
            updateData.campaignConcept = formData.get('campaignConcept') as string;
            updateData.headlines = formData.getAll('headlines[]') as string[];
            updateData.bodyTexts = formData.getAll('bodyTexts[]') as string[];
            break;
        default:
            return { error: "Invalid content type for update." };
    }

    await setDoc(docRef, updateData, { merge: true });
    return { data: { success: true }, message: `Content updated successfully.` };
  } catch (e: any) {
    console.error('Error in handleUpdateContentAction:', e);
    return { error: `Failed to update content: ${e.message || "Unknown error."}` };
  }
}

export async function handleSimulatedDeployAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const userId = formData.get('userId') as string;
  const docPath = formData.get('docPath') as string;
  const platform = formData.get('platform') as string;

  if (!userId || !docPath || !platform) {
    return { error: 'Missing required information to deploy content.' };
  }

  if (!docPath.startsWith(`users/${userId}/`)) {
    return { error: "Permission denied. You cannot modify this content." };
  }

  try {
    console.log(`[SIMULATED DEPLOY] Deploying content from path '${docPath}' to platform '${platform}' for user '${userId}'.`);
    
    const docRef = doc(db, docPath);
    await setDoc(docRef, { status: 'deployed' }, { merge: true });

    return { data: { success: true }, message: `Simulated deployment to ${platform} was successful.` };
  } catch (e: any) {
    console.error('Error in handleSimulatedDeployAction:', e);
    return { error: `Failed to simulate deployment: ${e.message || "Unknown error."}` };
  }
}

export async function handleDeleteContentAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const userId = formData.get('userId') as string;
  const docPath = formData.get('docPath') as string;

  if (!userId || !docPath) {
    return { error: 'Missing required information to delete content.' };
  }

  if (!docPath.startsWith(`users/${userId}/`)) {
    return { error: "Permission denied. You cannot modify this content." };
  }
  
  try {
    const docRef = doc(db, docPath);
    await deleteDoc(docRef);
    return { data: { success: true }, message: `Content deleted successfully.` };
  } catch (e: any) {
    console.error('Error in handleDeleteContentAction:', e);
    return { error: `Failed to delete content: ${e.message || "Unknown error."}` };
  }
}

export async function handleInitiateOAuthAction(
  prevState: FormState<{ redirectUrl: string }>,
  formData: FormData
): Promise<FormState<{ redirectUrl: string }>> {
  const platform = formData.get('platform') as 'meta' | 'x';
  const userId = formData.get('userId') as string;
  const origin = formData.get('origin') as string;

  if (!userId || !platform || !origin) {
    return { error: 'User ID, platform, and origin are required to initiate connection.' };
  }

  const allowedOrigins = [
    'https://brandforge.me',
    'https://app.labelmunazzahsayani.in',
    'https://ai.brandforge.me',
  ];
  
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch (e) {
    console.error(`[OAuth] Invalid origin URL format: ${origin}`);
    return { error: 'Invalid origin format. Request blocked for security reasons.' };
  }

  const isAllowed = allowedOrigins.some(allowed => parsedOrigin.origin === allowed) || 
                    parsedOrigin.hostname.endsWith('.cloudworkstations.dev');

  if (!isAllowed) {
    console.error(`[OAuth] Disallowed origin detected: ${origin}`);
    return { error: 'Invalid origin. Request blocked for security reasons.' };
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${parsedOrigin.origin}/api/oauth/callback`;
    
  const stateDocRef = doc(db, 'oauthStates', state);
  await setDoc(stateDocRef, { 
    userId,
    origin, // Store origin to reconstruct redirect_uri in callback
    createdAt: serverTimestamp()
  });


  let authUrl = '';

  if (platform === 'meta') {
    const clientId = process.env.META_CLIENT_ID;
    if (!clientId) return { error: "Meta integration is not configured on the server." };
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      scope: 'instagram_basic,pages_show_list,instagram_content_publish,pages_read_engagement',
      response_type: 'code',
    });
    authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  } else if (platform === 'x') {
    return { error: "Connecting to X (Twitter) is not yet implemented." };
  } else {
    return { error: 'Unsupported platform specified.' };
  }

  return { data: { redirectUrl: authUrl } };
}


export async function handleStoreUserApiTokenAction(input: {
  userId: string;
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}): Promise<{ success: boolean; error?: string }> {
  console.log('[handleStoreUserApiTokenAction] Received request to store token.');
  
  if (!input.userId || !input.platform || !input.accessToken) {
    const errorMsg = "User ID, platform, and access token are required.";
    console.error(`[handleStoreUserApiTokenAction] ERROR: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const credentialsRef = doc(db, 'userApiCredentials', input.userId);
    const tokenData = {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt: input.expiresIn ? new Date(Date.now() + input.expiresIn * 1000) : null,
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(credentialsRef, { [input.platform]: tokenData }, { merge: true });

    console.log(`[handleStoreUserApiTokenAction] Successfully stored token for platform '${input.platform}' for user '${input.userId}'.`);
    return { success: true };
  } catch (e: any) {
    console.error("Error storing API token in Firestore:", e);
    return { success: false, error: `Failed to save connection credentials: ${e.message}` };
  }
}

export async function handleGetConnectedAccountsStatusAction(
  prevState: FormState<ConnectedAccountsStatus>,
  formData: FormData
): Promise<FormState<ConnectedAccountsStatus>> {
  const userId = formData.get('userId') as string;
  const requestId = Math.random().toString(36).substring(2, 10);

  console.log(`[Connection Status:${requestId}] === CHECKING CONNECTION STATUS ===`);

  if (!userId) {
    console.error(`[Connection Status:${requestId}] No user ID provided`);
    return { error: 'User not authenticated.' };
  }

  try {
    console.log(`[Connection Status:${requestId}] Fetching credentials for user ${userId}`);
    const credentialsRef = doc(db, 'userApiCredentials', userId);
    const docSnap = await getDoc(credentialsRef);

    if (!docSnap.exists()) {
      console.log(`[Connection Status:${requestId}] No credentials document found`);
      return { data: { meta: false, x: false } };
    }
    
    const data = docSnap.data();
    console.log(`[Connection Status:${requestId}] Credentials document found, checking platforms`);

    // Enhanced status with health checks
    const status: ConnectedAccountsStatus & {
      metaHealth?: 'healthy' | 'expired' | 'invalid' | 'unknown';
      metaExpiresAt?: string;
      metaLastValidated?: string;
      xHealth?: 'healthy' | 'expired' | 'invalid' | 'unknown';
    } = {
      meta: false,
      x: false,
    };

    // Check Meta connection
    if (data.meta?.accessToken) {
      console.log(`[Connection Status:${requestId}] Meta token found, performing health check`);
      status.meta = true;
      
      // Check expiration
      if (data.meta.expiresAt) {
        const expirationDate = data.meta.expiresAt.toDate ? data.meta.expiresAt.toDate() : new Date(data.meta.expiresAt);
        status.metaExpiresAt = expirationDate.toISOString();
        
        const now = new Date();
        const timeUntilExpiry = expirationDate.getTime() - now.getTime();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
        
        if (timeUntilExpiry < 0) {
          status.metaHealth = 'expired';
          console.warn(`[Connection Status:${requestId}] Meta token expired at ${expirationDate}`);
        } else if (timeUntilExpiry < bufferTime) {
          status.metaHealth = 'expired'; // Treat as expired if expiring soon
          console.warn(`[Connection Status:${requestId}] Meta token expiring soon at ${expirationDate}`);
        } else {
          // Check if token was recently validated (within last 30 minutes)
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          const validatedAt = data.meta.validatedAt?.toDate();
          
          if (validatedAt && validatedAt > thirtyMinutesAgo) {
            status.metaHealth = 'healthy';
            console.log(`[Connection Status:${requestId}] Meta token recently validated at ${validatedAt.toISOString()}, skipping validation test`);
          } else {
            // Perform a quick validation test
            try {
              const testUrl = `https://graph.facebook.com/v19.0/me?access_token=${data.meta.accessToken}&fields=id`;
              const testResponse = await fetch(testUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5 second timeout
              });
              const testData = await testResponse.json();
              
              if (testData.error) {
                status.metaHealth = 'invalid';
                console.warn(`[Connection Status:${requestId}] Meta token validation failed:`, testData.error);
              } else {
                status.metaHealth = 'healthy';
                console.log(`[Connection Status:${requestId}] Meta token is healthy`);
                
                // Update the validation timestamp in Firestore
                try {
                  const credentialsRef = doc(db, 'userApiCredentials', userId);
                  await setDoc(credentialsRef, {
                    meta: {
                      ...data.meta,
                      validatedAt: serverTimestamp()
                    }
                  }, { merge: true });
                  console.log(`[Connection Status:${requestId}] Updated validation timestamp for healthy token`);
                } catch (updateError: any) {
                  console.warn(`[Connection Status:${requestId}] Failed to update validation timestamp:`, updateError.message);
                }
              }
            } catch (testError: any) {
              // If validation test fails, but token is not expired, assume it might still be healthy
              // This handles cases where the validation test fails due to network issues
              if (testError.name === 'TimeoutError' || testError.message.includes('timeout')) {
                status.metaHealth = 'healthy'; // Assume healthy if just a timeout
                console.warn(`[Connection Status:${requestId}] Meta token validation timed out, assuming healthy:`, testError.message);
              } else {
                status.metaHealth = 'unknown';
                console.warn(`[Connection Status:${requestId}] Meta token validation test failed:`, testError.message);
              }
            }
          }
        }
      } else {
        // No expiration date, assume long-lived token, still test it
        try {
          const testUrl = `https://graph.facebook.com/v19.0/me?access_token=${data.meta.accessToken}&fields=id`;
          const testResponse = await fetch(testUrl, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          const testData = await testResponse.json();
          
          if (testData.error) {
            status.metaHealth = 'invalid';
            console.warn(`[Connection Status:${requestId}] Meta token (no expiry) validation failed:`, testData.error);
          } else {
            status.metaHealth = 'healthy';
            console.log(`[Connection Status:${requestId}] Meta token (no expiry) is healthy`);
          }
        } catch (testError: any) {
          status.metaHealth = 'unknown';
          console.warn(`[Connection Status:${requestId}] Meta token (no expiry) validation test failed:`, testError.message);
        }
      }
      
      if (data.meta.validatedAt) {
        const validatedDate = data.meta.validatedAt.toDate ? data.meta.validatedAt.toDate() : new Date(data.meta.validatedAt);
        status.metaLastValidated = validatedDate.toISOString();
      }
    } else {
      console.log(`[Connection Status:${requestId}] No Meta token found`);
    }

    // Check X connection (placeholder for future implementation)
    if (data.x?.accessToken) {
      console.log(`[Connection Status:${requestId}] X token found`);
      status.x = true;
      status.xHealth = 'unknown'; // X integration not fully implemented
    } else {
      console.log(`[Connection Status:${requestId}] No X token found`);
    }

    console.log(`[Connection Status:${requestId}] === STATUS CHECK COMPLETE ===`, {
      meta: status.meta,
      metaHealth: status.metaHealth,
      x: status.x
    });

    return { data: status as ConnectedAccountsStatus };
  } catch (e: any) {
    console.error(`[Connection Status:${requestId}] === ERROR ===`, {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    return { error: `Failed to fetch connection status: ${e.message}` };
  }
}

export async function handleDisconnectAccountAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const userId = formData.get('userId') as string;
  const platform = formData.get('platform') as 'meta' | 'x';
  const requestId = Math.random().toString(36).substring(2, 10);

  console.log(`[Disconnect Account:${requestId}] === DISCONNECTING ${platform.toUpperCase()} ACCOUNT ===`);

  if (!userId || !platform) {
    console.error(`[Disconnect Account:${requestId}] Missing required parameters`);
    return { error: 'User ID and platform are required to disconnect account.' };
  }

  try {
    console.log(`[Disconnect Account:${requestId}] Removing ${platform} credentials for user ${userId}`);
    const credentialsRef = doc(db, 'userApiCredentials', userId);
    
    // Remove the specific platform's credentials
    const updateData = {
      [platform]: null
    };
    
    await setDoc(credentialsRef, updateData, { merge: true });
    
    console.log(`[Disconnect Account:${requestId}] Successfully disconnected ${platform} account for user ${userId}`);
    return {
      data: { success: true },
      message: `${platform === 'meta' ? 'Meta (Facebook & Instagram)' : 'X (Twitter)'} account disconnected successfully.`
    };
  } catch (e: any) {
    console.error(`[Disconnect Account:${requestId}] === ERROR ===`, {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    return { error: `Failed to disconnect ${platform} account: ${e.message}` };
  }
}

// Helper function to validate and refresh Meta token if needed
async function validateAndRefreshMetaToken(userId: string, currentToken: string): Promise<{ token: string; refreshed: boolean; error?: string }> {
  try {
    // First, test the current token
    const testUrl = `https://graph.facebook.com/v19.0/me?access_token=${currentToken}&fields=id,name`;
    const testResponse = await fetch(testUrl);
    const testData = await testResponse.json();
    
    if (!testData.error) {
      console.log(`[Token Validation] Current token is valid for user ${userId}`);
      return { token: currentToken, refreshed: false };
    }
    
    console.warn(`[Token Validation] Current token invalid for user ${userId}:`, testData.error);
    
    // If token is invalid, we can't refresh it automatically with the current Meta API
    // The user needs to re-authenticate
    return { 
      token: currentToken, 
      refreshed: false, 
      error: `Token expired or invalid: ${testData.error.message}. Please reconnect your Meta account.` 
    };
    
  } catch (error: any) {
    console.error(`[Token Validation] Validation failed for user ${userId}:`, error);
    return { 
      token: currentToken, 
      refreshed: false, 
      error: `Token validation failed: ${error.message}` 
    };
  }
}

// Helper function to check token expiration
function isTokenExpired(expiresAt: any): boolean {
  if (!expiresAt) return false; // No expiration date means it doesn't expire
  
  const expirationDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  
  return expirationDate.getTime() - now.getTime() < bufferTime;
}

export async function handleGetInstagramAccountsAction(
  prevState: FormState<{ accounts: InstagramAccount[] }>,
  formData: FormData
): Promise<FormState<{ accounts: InstagramAccount[] }>> {
  let userId = formData.get('userId') as string;
  const requestId = formData.get('requestId') as string || Math.random().toString(36).substring(2, 10);

  console.log(`[Instagram Accounts:${requestId}] === FETCHING INSTAGRAM ACCOUNTS ===`);
  
  const config = await getModelConfig();
  if (config.socialMediaConnectionsEnabled === false) {
    console.warn(`[Instagram Accounts:${requestId}] Social media connections are disabled. Aborting.`);
    return { data: { accounts: [] }, message: "Social media connections are disabled by the administrator." };
  }

  if (!userId) {
    const sessionCookie = formData.get('__session') as string;
    if (sessionCookie) {
        try {
            const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
            userId = decodedToken.uid;
            console.log(`[Instagram Accounts:${requestId}] User ID extracted from session: ${userId}`);
        } catch(e) {
            console.error(`[Instagram Accounts:${requestId}] Session validation failed:`, e);
            return { error: 'Invalid session. Please log in again.' };
        }
    }
  }
  
  if (!userId) {
    console.error(`[Instagram Accounts:${requestId}] No user ID available`);
    return { error: 'User not authenticated.' };
  }

  try {
    console.log(`[Instagram Accounts:${requestId}] Step 1: Fetching stored credentials for user ${userId}`);
    const credsDocRef = doc(db, 'userApiCredentials', userId);
    const credsDocSnap = await getDoc(credsDocRef);

    if (!credsDocSnap.exists()) {
      console.error(`[Instagram Accounts:${requestId}] No credentials document found for user ${userId}`);
      return { error: "Meta account not connected. Please connect your Meta account first." };
    }

    const credsData = credsDocSnap.data();
    const metaData = credsData?.meta;

    if (!metaData?.accessToken) {
      console.error(`[Instagram Accounts:${requestId}] No Meta access token found for user ${userId}`);
      return { error: "Meta account not connected or access token is missing. Please reconnect your Meta account." };
    }

    console.log(`[Instagram Accounts:${requestId}] Step 2: Checking token expiration`);
    const tokenExpired = isTokenExpired(metaData.expiresAt);
    if (tokenExpired) {
      console.warn(`[Instagram Accounts:${requestId}] Token is expired or expiring soon for user ${userId}`);
      return { error: "Your Meta access token has expired. Please reconnect your Meta account in Settings." };
    }

    console.log(`[Instagram Accounts:${requestId}] Step 3: Validating current token`);
    const tokenValidation = await validateAndRefreshMetaToken(userId, metaData.accessToken);
    
    if (tokenValidation.error) {
      console.error(`[Instagram Accounts:${requestId}] Token validation failed:`, tokenValidation.error);
      return { error: tokenValidation.error };
    }

    const accessToken = tokenValidation.token;
    console.log(`[Instagram Accounts:${requestId}] Step 4: Token validated successfully (refreshed: ${tokenValidation.refreshed})`);

    // If token was refreshed, update it in Firestore
    if (tokenValidation.refreshed) {
      console.log(`[Instagram Accounts:${requestId}] Updating refreshed token in Firestore`);
      await setDoc(credsDocRef, { 
        meta: { 
          ...metaData, 
          accessToken: tokenValidation.token,
          updatedAt: serverTimestamp(),
          lastRefreshed: serverTimestamp()
        } 
      }, { merge: true });
    }

    console.log(`[Instagram Accounts:${requestId}] Step 5: Fetching Facebook pages`);
    // 1. Get Facebook pages the user has access to
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token`;
    const pagesResponse = await fetch(pagesUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BrandForge-Instagram/1.0'
      }
    });
    
    console.log(`[Instagram Accounts:${requestId}] Pages API response status: ${pagesResponse.status}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.error(`[Instagram Accounts:${requestId}] Pages API error:`, pagesData.error);
      
      // Handle specific error cases
      if (pagesData.error.code === 190) {
        return { error: "Your Meta access token is invalid or expired. Please reconnect your Meta account." };
      } else if (pagesData.error.code === 102) {
        return { error: "Session key invalid. Please reconnect your Meta account." };
      }
      
      throw new Error(`Failed to fetch pages: ${pagesData.error.message} (Code: ${pagesData.error.code})`);
    }
    
    if (!pagesData.data || pagesData.data.length === 0) {
      console.log(`[Instagram Accounts:${requestId}] No Facebook pages found for user ${userId}`);
      return { data: { accounts: [] }, message: "No Facebook Pages found. You need to have a Facebook Page connected to an Instagram Business Account." };
    }

    console.log(`[Instagram Accounts:${requestId}] Step 6: Found ${pagesData.data.length} Facebook pages, checking for Instagram accounts`);

    // 2. For each page, get the connected Instagram Business Account
    const igAccounts: InstagramAccount[] = [];
    for (const [index, page] of pagesData.data.entries()) {
      console.log(`[Instagram Accounts:${requestId}] Checking page ${index + 1}/${pagesData.data.length}: ${page.name} (${page.id})`);
      
      const igUrl = `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account{id,username}&access_token=${accessToken}`;
      const igResponse = await fetch(igUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BrandForge-Instagram/1.0'
        }
      });
      
      const igData = await igResponse.json();
      console.log(`[Instagram Accounts:${requestId}] Instagram check for page ${page.name}:`, {
        hasInstagram: !!igData.instagram_business_account,
        error: igData.error || 'none'
      });

      if (igData.error) {
        console.warn(`[Instagram Accounts:${requestId}] Error checking Instagram for page ${page.name}:`, igData.error);
        continue;
      }

      if (igData.instagram_business_account) {
        igAccounts.push({
          id: igData.instagram_business_account.id,
          username: igData.instagram_business_account.username,
        });
        console.log(`[Instagram Accounts:${requestId}] Found Instagram account: @${igData.instagram_business_account.username}`);
      }
    }

    console.log(`[Instagram Accounts:${requestId}] === COMPLETED: Found ${igAccounts.length} Instagram accounts ===`);
    return { data: { accounts: igAccounts }, message: `Found ${igAccounts.length} Instagram account(s).` };

  } catch (e: any) {
    console.error(`[Instagram Accounts:${requestId}] === ERROR ===`, {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    return { error: `Failed to fetch Instagram accounts: ${e.message}` };
  }
}

export async function handleTestInstagramPermissionsAction(
  prevState: FormState<{ success: boolean; testResults: any }>,
  formData: FormData
): Promise<FormState<{ success: boolean; testResults: any }>> {
  const userId = formData.get('userId') as string;
  const requestId = Math.random().toString(36).substring(2, 10);

  console.log(`[Test Instagram Permissions:${requestId}] === TESTING INSTAGRAM PERMISSIONS ===`);

  if (!userId) {
    return { error: 'User not authenticated.' };
  }

  // Admin-only restriction - this is app-level configuration
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      return { error: 'User not found.' };
    }
    
    const userData = userDocSnap.data();
    if (!userData || userData.email !== 'admin@brandforge.ai') {
      return { error: 'Unauthorized: Admin access required for permission testing.' };
    }
  } catch (e: any) {
    return { error: 'Failed to verify admin access.' };
  }

  try {
    console.log(`[Test Instagram Permissions:${requestId}] Step 1: Fetching stored credentials for user ${userId}`);
    const credsDocRef = doc(db, 'userApiCredentials', userId);
    const credsDocSnap = await getDoc(credsDocRef);

    if (!credsDocSnap.exists()) {
      return { error: "Meta account not connected. Please connect your Meta account first." };
    }

    const credsData = credsDocSnap.data();
    const metaData = credsData?.meta;

    if (!metaData?.accessToken) {
      return { error: "Meta account not connected or access token is missing." };
    }

    const accessToken = metaData.accessToken;
    const testResults: any = {};

    console.log(`[Test Instagram Permissions:${requestId}] Step 2: Testing basic user info`);
    // Test 1: Basic user info (should work)
    try {
      const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}&fields=id,name`);
      const userData = await userResponse.json();
      testResults.userInfo = userData;
      console.log(`[Test Instagram Permissions:${requestId}] User info test:`, userData.error ? 'FAILED' : 'SUCCESS');
    } catch (e: any) {
      testResults.userInfo = { error: e.message };
    }

    console.log(`[Test Instagram Permissions:${requestId}] Step 3: Testing pages access`);
    // Test 2: Pages access (should work with current permissions)
    try {
      const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token`);
      const pagesData = await pagesResponse.json();
      testResults.pages = pagesData;
      console.log(`[Test Instagram Permissions:${requestId}] Pages test:`, pagesData.error ? 'FAILED' : `SUCCESS (${pagesData.data?.length || 0} pages)`);
    } catch (e: any) {
      testResults.pages = { error: e.message };
    }

    console.log(`[Test Instagram Permissions:${requestId}] Step 4: Testing Instagram Business Account access`);
    // Test 3: Try to access Instagram Business Account (this is the key test)
    if (testResults.pages?.data && testResults.pages.data.length > 0) {
      const firstPage = testResults.pages.data[0];
      try {
        const igResponse = await fetch(`https://graph.facebook.com/v19.0/${firstPage.id}?fields=instagram_business_account{id,username}&access_token=${accessToken}`);
        const igData = await igResponse.json();
        testResults.instagramTest = igData;
        console.log(`[Test Instagram Permissions:${requestId}] Instagram test:`, igData.error ? `FAILED: ${igData.error.message}` : 'SUCCESS');
        
        // If this succeeds, try to get more Instagram account details
        if (igData.instagram_business_account) {
          try {
            const igDetailsResponse = await fetch(`https://graph.facebook.com/v19.0/${igData.instagram_business_account.id}?fields=id,username,account_type,media_count&access_token=${accessToken}`);
            const igDetailsData = await igDetailsResponse.json();
            testResults.instagramDetails = igDetailsData;
            console.log(`[Test Instagram Permissions:${requestId}] Instagram details test:`, igDetailsData.error ? 'FAILED' : 'SUCCESS');
          } catch (e: any) {
            testResults.instagramDetails = { error: e.message };
          }
        }
      } catch (e: any) {
        testResults.instagramTest = { error: e.message };
      }
    }

    console.log(`[Test Instagram Permissions:${requestId}] Step 5: Testing Instagram content publish capability`);
    // Test 4: Test Instagram content publish (this will likely fail but activates the permission)
    if (testResults.instagramTest?.instagram_business_account) {
      try {
        const igAccountId = testResults.instagramTest.instagram_business_account.id;
        // Try to get media (this requires instagram_content_publish permission)
        const mediaResponse = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?access_token=${accessToken}&fields=id,media_type,media_url,timestamp`);
        const mediaData = await mediaResponse.json();
        testResults.mediaTest = mediaData;
        console.log(`[Test Instagram Permissions:${requestId}] Media test:`, mediaData.error ? `FAILED: ${mediaData.error.message}` : 'SUCCESS');
      } catch (e: any) {
        testResults.mediaTest = { error: e.message };
      }
    }

    console.log(`[Test Instagram Permissions:${requestId}] === TEST COMPLETED ===`);
    
    // Determine if tests were successful enough to activate permission request
    const hasPages = testResults.pages?.data && testResults.pages.data.length > 0;
    const hasInstagramAccount = testResults.instagramTest?.instagram_business_account;
    const madeInstagramApiCall = testResults.instagramTest || testResults.mediaTest;

    let message = "Permission tests completed. ";
    if (hasPages && hasInstagramAccount) {
      message += "Instagram Business Account detected! ";
    } else if (hasPages && !hasInstagramAccount) {
      message += "Facebook Pages found but no Instagram Business Account linked. ";
    }
    
    if (madeInstagramApiCall) {
      message += "Instagram API calls made - this should activate the permission request button within 24 hours.";
    }

    return {
      data: { success: true, testResults },
      message
    };

  } catch (e: any) {
    console.error(`[Test Instagram Permissions:${requestId}] === ERROR ===`, e);
    return { error: `Failed to test Instagram permissions: ${e.message}` };
  }
}

export async function handleAdminScanOrphanedImagesAction(
  prevState: FormState<OrphanedImageScanResult>,
  formData: FormData
): Promise<FormState<OrphanedImageScanResult>> {
  const adminRequesterEmail = formData.get('adminRequesterEmail') as string;

  if (adminRequesterEmail !== 'admin@brandforge.ai') {
    return { error: "Unauthorized: You do not have permission to perform this action." };
  }

  try {
    console.log('[Admin Scan Orphaned Images] Starting system-wide orphaned images scan...');
    const scanResult = await scanAllOrphanedImages();
    
    const totalOrphans = scanResult.orphanedBrandImages.length + scanResult.orphanedLibraryImages.length;
    console.log(`[Admin Scan Orphaned Images] Scan completed. Found ${totalOrphans} orphaned images.`);
    
    return {
      data: scanResult,
      message: `Scan completed. Found ${totalOrphans} orphaned image references across ${scanResult.totalScanned} users.`
    };
  } catch (e: any) {
    console.error('Error in handleAdminScanOrphanedImagesAction:', e);
    return { error: `Failed to scan orphaned images: ${e.message || "Unknown error."}` };
  }
}

export async function handleAdminCleanupOrphanedImagesAction(
  prevState: FormState<{ success: boolean; deletedCount: number }>,
  formData: FormData
): Promise<FormState<{ success: boolean; deletedCount: number }>> {
  const adminRequesterEmail = formData.get('adminRequesterEmail') as string;

  if (adminRequesterEmail !== 'admin@brandforge.ai') {
    return { error: "Unauthorized: You do not have permission to perform this action." };
  }

  try {
    console.log('[Admin Cleanup Orphaned Images] Starting system-wide orphaned images cleanup...');
    const cleanupResult = await cleanupAllOrphanedImages();
    
    console.log(`[Admin Cleanup Orphaned Images] Cleanup completed. Deleted ${cleanupResult.deletedCount} orphaned references.`);
    
    return {
      data: { success: true, deletedCount: cleanupResult.deletedCount },
      message: `Successfully cleaned up ${cleanupResult.deletedCount} orphaned image references.`
    };
  } catch (e: any) {
    console.error('Error in handleAdminCleanupOrphanedImagesAction:', e);
    return { error: `Failed to cleanup orphaned images: ${e.message || "Unknown error."}` };
  }
}
