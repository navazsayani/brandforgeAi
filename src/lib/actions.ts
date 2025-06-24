
"use server";

import { generateImages, type GenerateImagesInput } from '@/ai/flows/generate-images';
import { generateSocialMediaCaption, type GenerateSocialMediaCaptionInput } from '@/ai/flows/generate-social-media-caption';
import { generateBlogContent, type GenerateBlogContentInput } from '@/ai/flows/generate-blog-content';
import { generateAdCampaign, type GenerateAdCampaignInput, type GenerateAdCampaignOutput } from '@/ai/flows/generate-ad-campaign';
import { extractBrandInfoFromUrl, type ExtractBrandInfoFromUrlInput, type ExtractBrandInfoFromUrlOutput } from '@/ai/flows/extract-brand-info-from-url-flow';
import { describeImage, type DescribeImageInput, type DescribeImageOutput } from "@/ai/flows/describe-image-flow";
import { generateBlogOutline, type GenerateBlogOutlineInput, type GenerateBlogOutlineOutput } from '@/ai/flows/generate-blog-outline-flow';
import { generateBrandLogo, type GenerateBrandLogoInput, type GenerateBrandLogoOutput } from '@/ai/flows/generate-brand-logo-flow';
import { generateBrandForgeAppLogo, type GenerateBrandForgeAppLogoOutput } from '@/ai/flows/generate-brandforge-app-logo-flow';
import { storage, db } from '@/lib/firebaseConfig';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, getDocs, query as firestoreQuery, where, collectionGroup } from 'firebase/firestore';
import type { UserProfileSelectItem, BrandData, ModelConfig } from '@/types';
import { getModelConfig } from './model-config';
import { auth } from '@/lib/firebaseConfig';

// Generic type for form state with error
export interface FormState<T = any> {
  data?: T;
  error?: string;
  message?: string;
  taskId?: string;
}

// Helper function to ensure user-specific brand profile document exists
async function ensureUserBrandProfileDocExists(userId: string, userEmail?: string): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to ensure brand profile document exists.");
  }
  
  // Step 1: Ensure the top-level user document exists.
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    console.log(`Top-level user document for ${userId} does not exist. Creating it...`);
    // Create the main user document. This is crucial before creating subcollections.
    await setDoc(userDocRef, {
      email: userEmail || 'unknown',
    });
    console.log(`Successfully created top-level user document for ${userId}.`);
  }

  // Step 2: Proceed with ensuring the nested brand profile document exists.
  const brandProfileDocRef = doc(db, `users/${userId}/brandProfiles/${userId}`);
  const brandProfileDocSnap = await getDoc(brandProfileDocRef);

  if (!brandProfileDocSnap.exists()) {
    console.log(`Brand profile document for user ${userId} does not exist. Creating it...`);
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
    };
    if (userEmail) {
      initialProfileData.userEmail = userEmail;
    }
    await setDoc(brandProfileDocRef, initialProfileData);
    console.log(`Successfully created brand profile document for user ${userId}.`);
  }
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
    const userEmail = formData.get('userEmail') as string | undefined; // For ensuring profile exists with email

    let finalTone = presetTone;
    if (customNuances && customNuances.trim() !== "") {
      finalTone = `${presetTone} ${customNuances.trim()}`;
    }
    
    const input: GenerateSocialMediaCaptionInput = {
      brandDescription: formData.get("brandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      imageDescription: imageSrc ? imageDescription : undefined,
      tone: finalTone,
    };

    if (!input.brandDescription || !input.tone) {
      return { error: "Brand description and tone are required." };
    }
    if (imageSrc && (!imageDescription || imageDescription.trim() === "")) {
        return { error: "Image description is required if an image is selected for the post."}
    }
    if (input.industry === "" || input.industry === undefined) delete input.industry;
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
        };

        if (!input.brandName || !input.brandDescription || !input.keywords) {
            return { error: "Brand name, description, and keywords are required for outline generation." };
        }
        if (input.websiteUrl === "") delete input.websiteUrl;
        if (input.industry === "" || input.industry === undefined) delete input.industry;

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

    const input: GenerateBlogContentInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("blogBrandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      keywords: formData.get("blogKeywords") as string,
      targetPlatform: formData.get("targetPlatform") as "Medium" | "Other",
      websiteUrl: formData.get("blogWebsiteUrl") as string || undefined,
      blogOutline: formData.get("blogOutline") as string,
      blogTone: formData.get("blogTone") as string,
    };
     if (!input.brandName || !input.brandDescription || !input.keywords || !input.targetPlatform || !input.blogOutline || !input.blogTone) {
      return { error: "All fields (except optional website URL and industry) including outline and tone are required for blog content generation." };
    }
    if (input.websiteUrl === "") delete input.websiteUrl;
    if (input.industry === "" || input.industry === undefined) delete input.industry;
    if (!userId) {
        return { error: "User ID is missing. Cannot save blog post."};
    }
    await ensureUserBrandProfileDocExists(userId, userEmail);

    const result = await generateBlogContent(input);
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/blogPosts`);
    await addDoc(firestoreCollectionRef, {
      title: result.title || "Untitled",
      content: result.content || "",
      tags: result.tags || "",
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

const generateFilenamePart = () => Math.random().toString(36).substring(2, 10);

export async function handleSaveGeneratedImagesAction(
  prevState: FormState<{savedCount: number}>,
  formData: FormData
): Promise<FormState<{savedCount: number}>> {
  const userId = formData.get('userId') as string;
  const userEmail = formData.get('userEmail') as string | undefined; 
  


  if (!userId || typeof userId !== 'string') {
    console.error('handleSaveGeneratedImagesAction: User not authenticated - userId is missing or invalid.');
    return { error: 'User not authenticated - User not logged in cannot save image.' };
  }

  try {
    
    await ensureUserBrandProfileDocExists(userId, userEmail);
    
    const imagesToSaveString = formData.get('imagesToSaveJson') as string;
    if (!imagesToSaveString) {
      const errorMsg = "No image data received from the client (imagesToSaveJson is missing).";
      console.error(`handleSaveGeneratedImagesAction: ${errorMsg}`);
      return { error: errorMsg };
    }

    let imagesToSave: { dataUri: string; prompt: string; style: string; }[];
    try {
      imagesToSave = JSON.parse(imagesToSaveString);
    } catch (e: any) {
      const errorMsg = `Invalid image data format received from client: ${e.message}. Received: ${imagesToSaveString.substring(0, 200)}...`;
      console.error(`handleSaveGeneratedImagesAction: ${errorMsg}`, JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
      return { error: errorMsg };
    }

    if (!Array.isArray(imagesToSave) || imagesToSave.length === 0) {
      const errorMsg = "No images selected or data is not in expected array format after parsing.";
      console.error(`handleSaveGeneratedImagesAction: ${errorMsg}. Parsed data:`, imagesToSave);
      return { error: errorMsg };
    }
    
    const brandProfileDocId = userId; 
    let savedCount = 0;
    const saveErrors: string[] = [];

    for (const image of imagesToSave) {
      const promptSnippet = image.prompt ? image.prompt.substring(0,30) + "..." : "N/A";
      if (!image.dataUri) {
        const errorDetail = `Invalid data URI or URL for an image (prompt: ${promptSnippet}). dataUri is missing.`;
        console.warn(`handleSaveGeneratedImagesAction: ${errorDetail}. Skipping save for this image.`);
        saveErrors.push(errorDetail);
        continue;
      }

      if (!(image.dataUri.startsWith('data:image') || image.dataUri.startsWith('image_url:') || image.dataUri.startsWith('https://'))) {
          const errorDetail = `Invalid data URI or URL format for an image (prompt: ${promptSnippet}). URI starts with: ${image.dataUri.substring(0, 30)}...`;
          console.warn(`handleSaveGeneratedImagesAction: ${errorDetail}. Skipping save for this image.`);
          saveErrors.push(errorDetail);
          continue;
      }

      try {
        
        let imageUrlToSave = image.dataUri;
        let isFreepikImage = false;

        if (image.dataUri.startsWith('data:image')) {
            const fileExtensionMatch = image.dataUri.match(/^data:image\/([a-zA-Z+]+);base64,/);
            const fileExtension = fileExtensionMatch ? fileExtensionMatch[1] : 'png';
            const filePath = `users/${userId}/brandProfiles/${brandProfileDocId}/generatedLibraryImages/${Date.now()}_${generateFilenamePart()}.${fileExtension}`;
            const imageStorageRef = storageRef(storage, filePath);

            
            try {
                const snapshot = await uploadString(imageStorageRef, image.dataUri, 'data_url');
                imageUrlToSave = await getDownloadURL(snapshot.ref);
            } catch (uploadError: any) {
                const uploadErrorDetail = `Failed to upload image to Firebase Storage for prompt "${promptSnippet}": ${uploadError.message}. Code: ${uploadError.code}. Path: ${filePath}`;
                console.error(`handleSaveGeneratedImagesAction Storage Upload Error: ${uploadErrorDetail}`, JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError)));
                saveErrors.push(uploadErrorDetail);
                continue;
            }
        } else if (image.dataUri.startsWith('image_url:')) {
            imageUrlToSave = image.dataUri.substring(10);
            
            isFreepikImage = true;
        } else if (image.dataUri.startsWith('https://')) {
            
        }

        const firestoreCollectionPath = `users/${userId}/brandProfiles/${brandProfileDocId}/savedLibraryImages`;
        
        const firestoreCollectionRef = collection(db, firestoreCollectionPath);
        try {
            await addDoc(firestoreCollectionRef, {
                storageUrl: imageUrlToSave,
                prompt: image.prompt || "N/A",
                style: image.style || "N/A",
            });
            
            savedCount++;
        } catch (firestoreError: any) {
            const firestoreErrorDetail = `Failed to save image metadata to Firestore for prompt "${promptSnippet}": ${firestoreError.message}. Code: ${firestoreError.code}. Path: ${firestoreCollectionPath}`;
            console.error(`handleSaveGeneratedImagesAction Firestore Write Error: ${firestoreErrorDetail}`, JSON.stringify(firestoreError, Object.getOwnPropertyNames(firestoreError)));
            saveErrors.push(firestoreErrorDetail);
            continue;
        }

        if (isFreepikImage) {
            try {
                new URL(imageUrlToSave);
            } catch (urlError: any) {
                const urlErrorDetail = `Freepik image URL is invalid for prompt "${promptSnippet}": ${urlError.message}`;
                console.error(`handleSaveGeneratedImagesAction: ${urlErrorDetail}`);
                saveErrors.push(urlErrorDetail);
                continue;
            }
        }
      } catch (e: any) {
        const specificError = `Failed to save image (prompt: ${promptSnippet}): ${(e as Error).message?.substring(0,100)}`;
        console.error(`handleSaveGeneratedImagesAction Loop Error: ${specificError}. Full error:`, JSON.stringify(e, Object.getOwnPropertyNames(e)));
        saveErrors.push(specificError);
        continue;
      }
    }

    if (savedCount > 0 && saveErrors.length > 0) {
      return { data: {savedCount}, message: `Successfully saved ${savedCount} image(s). Some errors occurred: ${saveErrors.join('. ')}` };
    } else if (savedCount > 0) {
      return { data: {savedCount}, message: `${savedCount} image(s) saved successfully to your library!` };
    } else if (saveErrors.length > 0) {
      return { error: `Failed to save any images. Errors: ${saveErrors.join('. ')}` };
    } else {
      return { error: "No images were processed or saved. This might be due to an issue with the input data or no images being selected."};
    }
  } catch (e: any) {
      const criticalErrorMsg = `A critical server error occurred during image saving: ${e.message || "Unknown error"}. Please check server logs. UserId used: '${userId}'`;
      console.error("Critical error in handleSaveGeneratedImagesAction (outer try-catch):", JSON.stringify(e, Object.getOwnPropertyNames(e), 2), `UserId: '${userId}'`);
      return { error: criticalErrorMsg };
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
    const userIndexRef = doc(db, "userIndex", "profiles");
    const userIndexSnap = await getDoc(userIndexRef);

    if (!userIndexSnap.exists()) {
        return { data: [], message: "No user profiles have been saved yet." };
    }

    const indexData = userIndexSnap.data();
    const profiles: UserProfileSelectItem[] = Object.entries(indexData).map(([userId, userData]) => ({
      userId: userId,
      brandName: (userData as any).brandName || "Unnamed Brand",
      userEmail: (userData as any).userEmail || "No Email",
    }));
    
    return { data: profiles, message: "User profiles fetched successfully." };

  } catch (e: any) {
    if (e.code === 'permission-denied') {
        return { error: "Database permission error. Please check your Firestore security rules in the Firebase console." };
    } else if (e.code === 'unavailable') {
        return { error: "Database unavailable. Please check your internet connection." };
    }
    
    return { error: `Failed to fetch user profiles: ${e.message || "Unknown error"}` };
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
    };
    
    // Basic validation
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
