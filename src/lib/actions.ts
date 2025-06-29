
"use server";

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
import { storage, db } from '@/lib/firebaseConfig';
import { ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, getDocs, query as firestoreQuery, where, collectionGroup, deleteDoc } from 'firebase/firestore';
import type { UserProfileSelectItem, BrandData, ModelConfig, PlansConfig } from '@/types';
import { getModelConfig } from './model-config';
import { getPlansConfig, DEFAULT_PLANS_CONFIG } from './plans-config';
import Razorpay from 'razorpay';

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
  
  // Step 1: Ensure the top-level user document exists.
  const userDocRef = doc(db, 'users', userId);
  console.log(`[ensureUserBrandProfileDocExists] Checking for top-level user doc at users/${userId}`);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    console.log(`[ensureUserBrandProfileDocExists] Top-level user document for ${userId} does not exist. Creating it...`);
    await setDoc(userDocRef, {
      email: userEmail || 'unknown',
      createdAt: new Date(), // Add a creation timestamp
    });
    console.log(`[ensureUserBrandProfileDocExists] Successfully created top-level user document for ${userId}.`);
  } else {
    console.log(`[ensureUserBrandProfileDocExists] Top-level user doc for ${userId} already exists.`);
  }

  // Step 2: Proceed with ensuring the nested brand profile document exists.
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


export async function handleGenerateImagesAction(
  prevState: FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string; }>,
  formData: FormData
): Promise<FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string; }>> {
  try {
    const numberOfImagesStr = formData.get("numberOfImages") as string;
    const numberOfImages = parseInt(numberOfImagesStr, 10) || 1;
    
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
    const chosenProvider = (formData.get("provider") as GenerateImagesInput['provider']) || process.env.IMAGE_GENERATION_PROVIDER || 'GEMINI';
    let aiGeneratedDesc: string | undefined = undefined;
    const placeholderToReplace = "[An AI-generated description of your example image will be used here by the backend to guide content when Freepik/Imagen3 is selected.]";

    if (chosenProvider.toUpperCase() === 'FREEPIK' && exampleImageUrl && exampleImageUrl.trim() !== "") {
      try {
        const descriptionOutput = await describeImage({ imageDataUri: exampleImageUrl });
        aiGeneratedDesc = descriptionOutput.description;
        
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
      exampleImage: exampleImageUrl && exampleImageUrl.trim() !== "" ? exampleImageUrl : undefined,
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
    const selectedImageSrc = formData.get("selectedImageSrcForSocialPost") as string;
    const imageSrc = selectedImageSrc && selectedImageSrc.trim() !== "" ? selectedImageSrc : null;
    const imageDescription = formData.get("socialImageDescription") as string;
    const presetTone = formData.get("tone") as string;
    const customNuances = formData.get("customSocialToneNuances") as string | null;
    const userId = formData.get('userId') as string; 
    const userEmail = formData.get('userEmail') as string | undefined;

    let finalTone = presetTone;
    if (customNuances && customNuances.trim() !== "") {
      finalTone = `${presetTone} ${customNuances.trim()}`;
    }
    
    const input: GenerateSocialMediaCaptionInput = {
      brandDescription: formData.get("brandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      imageDescription: imageSrc ? imageDescription : undefined,
      tone: finalTone,
      postGoal: formData.get("postGoal") as string | undefined,
      targetAudience: formData.get("targetAudience") as string | undefined,
      callToAction: formData.get("callToAction") as string | undefined,
    };

    if (!input.brandDescription || !input.tone) {
      return { error: "Brand description and tone are required." };
    }
    if (imageSrc && (!imageDescription || imageDescription.trim() === "")) {
        return { error: "Image description is required if an image is selected for the post."}
    }
    if (input.industry === "" || input.industry === undefined) delete input.industry;
    if (input.postGoal === "" || input.postGoal === undefined) delete input.postGoal;
    if (input.targetAudience === "" || input.targetAudience === undefined) delete input.targetAudience;
    if (input.callToAction === "" || input.callToAction === undefined) delete input.callToAction;
    if (!userId) {
        return { error: "User ID is missing. Cannot save social media post."};
    }
    await ensureUserBrandProfileDocExists(userId, userEmail);

    const result = await generateSocialMediaCaption(input);
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/socialMediaPosts`);
    await addDoc(firestoreCollectionRef, {
      caption: result.caption || "",
      hashtags: result.hashtags || "",
      imageSrc: imageSrc,
      postGoal: input.postGoal,
      targetAudience: input.targetAudience,
      callToAction: input.callToAction,
      tone: input.tone,
    });
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

    // Feature Gating Check
    const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) return { error: "User profile not found." };
    const brandData = userDocSnap.data() as BrandData;
    
    const plansConfig = await getPlansConfig();
    const planDetails = plansConfig.USD[brandData.plan || 'free']; // Assume USD for quota logic

    if ((brandData.plan || 'free') === 'free' && planDetails.quotas.blogPosts <= 0) {
      return { error: "Full blog post generation is a premium feature. Please upgrade your plan." };
    }


    const input: GenerateBlogContentInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("blogBrandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      keywords: formData.get("blogKeywords") as string,
      targetPlatform: formData.get("targetPlatform") as "Medium" | "Other",
      websiteUrl: formData.get("blogWebsiteUrl") as string || undefined,
      blogOutline: formData.get("blogOutline") as string,
      blogTone: formData.get("blogTone") as string,
      articleStyle: formData.get("articleStyle") as string | undefined,
      targetAudience: formData.get("targetAudience") as string | undefined,
    };
     if (!input.brandName || !input.brandDescription || !input.keywords || !input.targetPlatform || !input.blogOutline || !input.blogTone) {
      return { error: "All fields (except optional website URL and industry) including outline and tone are required for blog content generation." };
    }
    if (input.websiteUrl === "") delete input.websiteUrl;
    if (input.industry === "" || input.industry === undefined) delete input.industry;
    if (input.articleStyle === "" || input.articleStyle === undefined) delete input.articleStyle;
    if (input.targetAudience === "" || input.targetAudience === undefined) delete input.targetAudience;
    
    await ensureUserBrandProfileDocExists(userId, userEmail);

    const result = await generateBlogContent(input);
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/blogPosts`);
    await addDoc(firestoreCollectionRef, {
      title: result.title || "Untitled",
      content: result.content || "",
      tags: result.tags || "",
      platform: input.targetPlatform,
      articleStyle: input.articleStyle,
      targetAudience: input.targetAudience,
      blogTone: input.blogTone,
    });
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

    const input: GenerateAdCampaignInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("brandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      generatedContent: generatedContent,
      targetKeywords: formData.get("targetKeywords") as string,
      budget: budgetNum,
      platforms: platformsArray,
    };

    if (!input.brandName || !input.brandDescription || !input.generatedContent || !input.targetKeywords || input.platforms.length === 0) {
        return { error: "Brand name, description, inspirational content, target keywords, and at least one platform are required." };
    }
    if (!input.generatedContent || !input.generatedContent.trim()) {
        return { error: "Inspirational content (selected or custom) cannot be empty."};
    }
    if (input.industry === "" || input.industry === undefined) delete input.industry;
     if (!userId) {
        return { error: "User ID is missing. Cannot save ad campaign."};
    }
    await ensureUserBrandProfileDocExists(userId, userEmail);

    const result = await generateAdCampaign(input);
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/adCampaigns`);
    await addDoc(firestoreCollectionRef, {
      campaignConcept: result.campaignConcept || "",
      headlines: result.headlines || [],
      bodyTexts: result.bodyTexts || [],
      platformGuidance: result.platformGuidance || "",
      targetKeywords: input.targetKeywords,
      budget: input.budget,
      platforms: input.platforms,
    });
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
            createdAt: new Date(),
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
  
  // In a real production app, you'd verify the userId against the authenticated session.
  // Here, we rely on the client sending the correct ID and Firestore rules for security.

  try {
      // Delete the Firestore document first
      const imageDocRef = doc(db, 'users', userId, 'brandProfiles', userId, 'savedLibraryImages', imageId);
      await deleteDoc(imageDocRef);

      // Then, delete the file from Firebase Storage
      try {
          const imageStorageRef = storageRef(storage, storageUrl);
          await deleteObject(imageStorageRef);
      } catch (storageError: any) {
          // Log this error but don't fail the whole action, as the reference is already gone from the UI.
          // This can happen if the storage object was already deleted or permissions changed.
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
    };

    if (!input.brandName || !input.brandDescription) {
      return { error: "Brand name and description are required for logo generation." };
    }
     if (input.industry === "" || input.industry === undefined) delete input.industry;
     if (input.targetKeywords === "" || input.targetKeywords === undefined) delete input.targetKeywords;
    if (!userId) {
        return { error: "User ID is missing. Cannot save brand logo."};
    }
    await ensureUserBrandProfileDocExists(userId, userEmail);


    const result = await generateBrandLogo(input);
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/brandLogos`);
    await addDoc(firestoreCollectionRef, {
      logoData: result.logoDataUri || "", 
      brandName: input.brandName,
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
    } else { // 'free' plan
      updateData.subscriptionEndDate = null;
    }

    await setDoc(brandProfileRef, updateData, { merge: true });
    
    return { data: { success: true }, message: `Successfully updated ${userId}'s plan to ${newPlan}.` };

  } catch (e: any) {
    console.error("Error updating user plan by admin:", e);
    return { error: `Failed to update user plan: ${e.message || "Unknown error"}` };
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
    const modelConfig = await getModelConfig();
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
      fastModel: formData.get("fastModel") as string,
      visionModel: formData.get("visionModel") as string,
      powerfulModel: formData.get("powerfulModel") as string,
      paymentMode: formData.get("paymentMode") as 'live' | 'test' | undefined,
      freepikEnabled: formData.get("freepikEnabled") === 'true',
    };
    
    if (!modelConfig.imageGenerationModel || !modelConfig.fastModel || !modelConfig.visionModel || !modelConfig.powerfulModel) {
        return { error: "All model fields are required." };
    }

    const configDocRef = doc(db, 'configuration', 'models');
    await setDoc(configDocRef, modelConfig, { merge: true });

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
      // Payment is legit. Update user's plan in Firestore.
      const brandDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); // Set expiry to 30 days from now

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

export async function getPaymentMode(): Promise<{ paymentMode: 'live' | 'test', freepikEnabled: boolean, error?: string }> {
  try {
    const { paymentMode, freepikEnabled } = await getModelConfig();
    return { paymentMode: paymentMode || 'test', freepikEnabled: freepikEnabled || false };
  } catch (e: any) {
    console.error("Error fetching payment mode:", e);
    return { paymentMode: 'test', freepikEnabled: false, error: `Could not retrieve payment mode configuration.` };
  }
}


// New actions for plan configuration
export async function handleGetPlansConfigAction(
  prevState: FormState<PlansConfig>,
  formData?: FormData
): Promise<FormState<PlansConfig>> {
   const adminRequesterEmail = formData?.get('adminRequesterEmail') as string | undefined;
   // Allow non-admins to fetch read-only plan data, but check for admin for updates.
   // This action is safe as it's read-only.
  try {
    const plansConfig = await getPlansConfig();
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
    const currentConfig = await getPlansConfig();

    const updatedConfig: PlansConfig = {
      ...currentConfig,
      USD: {
        ...currentConfig.USD,
        pro: {
          ...currentConfig.USD.pro,
          price: {
            ...currentConfig.USD.pro.price,
            amount: formData.get('usd_pro_price') as string,
            originalAmount: formData.get('usd_pro_original_price') as string || undefined,
          },
          quotas: {
            imageGenerations: parseInt(formData.get('pro_images_quota') as string, 10),
            socialPosts: parseInt(formData.get('pro_social_quota') as string, 10),
            blogPosts: parseInt(formData.get('pro_blogs_quota') as string, 10),
          }
        },
        free: {
          ...currentConfig.USD.free,
           quotas: {
            imageGenerations: parseInt(formData.get('free_images_quota') as string, 10),
            socialPosts: parseInt(formData.get('free_social_quota') as string, 10),
            blogPosts: parseInt(formData.get('free_blogs_quota') as string, 10),
          }
        }
      },
      INR: {
        ...currentConfig.INR,
        pro: {
          ...currentConfig.INR.pro,
          price: {
            ...currentConfig.INR.pro.price,
            amount: formData.get('inr_pro_price') as string,
            originalAmount: formData.get('inr_pro_original_price') as string || undefined,
          },
           quotas: {
            imageGenerations: parseInt(formData.get('pro_images_quota') as string, 10),
            socialPosts: parseInt(formData.get('pro_social_quota') as string, 10),
            blogPosts: parseInt(formData.get('pro_blogs_quota') as string, 10),
          }
        },
         free: {
          ...currentConfig.INR.free,
           quotas: {
            imageGenerations: parseInt(formData.get('free_images_quota') as string, 10),
            socialPosts: parseInt(formData.get('free_social_quota') as string, 10),
            blogPosts: parseInt(formData.get('free_blogs_quota') as string, 10),
          }
        }
      }
    };
    
    const configDocRef = doc(db, 'configuration', 'plans');
    await setDoc(configDocRef, updatedConfig, { merge: true });

    return { data: updatedConfig, message: "Plans configuration updated successfully." };
  } catch (e: any) {
    console.error("Error in handleUpdatePlansConfigAction:", e);
    return { error: `Failed to update plans configuration: ${e.message || "Unknown error."}` };
  }
}
