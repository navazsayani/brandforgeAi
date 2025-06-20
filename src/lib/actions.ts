
"use server";

import { generateImages, type GenerateImagesInput } from '@/ai/flows/generate-images';
import { generateSocialMediaCaption, type GenerateSocialMediaCaptionInput } from '@/ai/flows/generate-social-media-caption';
import { generateBlogContent, type GenerateBlogContentInput } from '@/ai/flows/generate-blog-content';
import { generateAdCampaign, type GenerateAdCampaignInput, type GenerateAdCampaignOutput } from '@/ai/flows/generate-ad-campaign';
import { extractBrandInfoFromUrl, type ExtractBrandInfoFromUrlInput, type ExtractBrandInfoFromUrlOutput } from '@/ai/flows/extract-brand-info-from-url-flow';
import { describeImage, type DescribeImageInput, type DescribeImageOutput } from "@/ai/flows/describe-image-flow"; 
import { generateBlogOutline, type GenerateBlogOutlineInput, type GenerateBlogOutlineOutput } from '@/ai/flows/generate-blog-outline-flow';
import { generateBrandLogo, type GenerateBrandLogoInput, type GenerateBrandLogoOutput } from '@/ai/flows/generate-brand-logo-flow';
import { generateBrandForgeAppLogo, type GenerateBrandForgeAppLogoOutput } from '@/ai/flows/generate-brandforge-app-logo-flow'; // Added
import { storage, db } from '@/lib/firebaseConfig';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';

// Generic type for form state with error
export interface FormState<T = any> {
  data?: T;
  error?: string;
  message?: string;
  taskId?: string; 
}

export async function handleGenerateImagesAction(
  prevState: FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string; }>,
  formData: FormData
): Promise<FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string; }>> {
  try {
    console.log('=== handleGenerateImagesAction START ===');
    console.log('Environment check:');
    console.log('  GOOGLE_API_KEY exists:', !!process.env.GOOGLE_API_KEY);
    console.log('  GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
    console.log('  GOOGLE_GENAI_API_KEY exists:', !!process.env.GOOGLE_GENAI_API_KEY);
    console.log('  IMAGE_GENERATION_PROVIDER:', process.env.IMAGE_GENERATION_PROVIDER);
    
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${typeof value === 'string' ? value.substring(0, 100) : '[File/Blob]'}`);
    }
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
        console.log(`Attempting to describe example image for Freepik prompt: ${exampleImageUrl}`);
        const descriptionOutput = await describeImage({ imageDataUri: exampleImageUrl });
        aiGeneratedDesc = descriptionOutput.description;
        console.log(`Successfully described example image for Freepik: ${aiGeneratedDesc}`);
        
        if (finalizedTextPromptValue && finalizedTextPromptValue.includes(placeholderToReplace)) {
          const replacementText = `The user provided an example image which is described as: "${aiGeneratedDesc || "No specific description available for the example image"}". Using that description as primary inspiration for the subject and main visual elements, continue with the rest of the prompt instructions which should guide the concept and style for the new image.`;
          finalizedTextPromptValue = finalizedTextPromptValue.replace(placeholderToReplace, replacementText);
          console.log("Server Action: Replaced placeholder in finalizedTextPrompt. New prompt starts with:", finalizedTextPromptValue.substring(0,150) + "...");
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
    
    console.log("Server Action: Calling generateImages flow with input (finalizedTextPrompt excerpt):", JSON.stringify({ ...input, finalizedTextPrompt: input.finalizedTextPrompt?.substring(0,150) + "..." }, null, 2) );

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

    const result = await generateSocialMediaCaption(input);
    // For SaaS, userId should come from authenticated session, not form.
    // Assuming this action is called by an authenticated user, we'd get userId from auth state.
    // For now, let's assume 'userId' is passed in formData if needed, or retrieved server-side.
    const userId = formData.get('userId') as string; // This needs to be the actual authenticated user's ID.
    if (!userId) {
        return { error: "User ID is missing. Cannot save social media post."};
    }
    // Use userId for the brandProfileDocId as well, simplifying to one brand profile per user.
    const brandProfileDocId = userId; 
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${brandProfileDocId}/socialMediaPosts`);
    await addDoc(firestoreCollectionRef, {
      caption: result.caption || "",
      hashtags: result.hashtags || "",
      imageSrc: imageSrc,
      createdAt: serverTimestamp()
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

    const result = await generateBlogContent(input);
    const userId = formData.get('userId') as string; // Needs to be actual authenticated user's ID
    if (!userId) {
        return { error: "User ID is missing. Cannot save blog post."};
    }
    const brandProfileDocId = userId; // Using userId for the brand profile doc
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${brandProfileDocId}/blogPosts`);
    await addDoc(firestoreCollectionRef, {
      title: result.title || "Untitled",
      content: result.content || "",
      tags: result.tags || "",
      createdAt: serverTimestamp()
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

    const result = await generateAdCampaign(input);
    const userId = formData.get('userId') as string; // Needs to be actual authenticated user's ID
     if (!userId) {
        return { error: "User ID is missing. Cannot save ad campaign."};
    }
    const brandProfileDocId = userId; // Using userId for the brand profile doc
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${brandProfileDocId}/adCampaigns`);
    await addDoc(firestoreCollectionRef, {
      campaignConcept: result.campaignConcept || "",
      headlines: result.headlines || [],
      bodyTexts: result.bodyTexts || [],
      platformGuidance: result.platformGuidance || "",
      targetKeywords: input.targetKeywords,
      budget: input.budget,
      platforms: input.platforms,
      createdAt: serverTimestamp()
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
  console.log("handleSaveGeneratedImagesAction called");
  try {
    const userId = formData.get('userId') as string;
    console.log(`handleSaveGeneratedImagesAction: userId from formData: ${userId}`);
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

    if (!userId || typeof userId !== 'string') {
      console.error('handleSaveGeneratedImagesAction: User not authenticated - userId is missing or invalid.');
      return { error: 'User not authenticated - User not logged in cannot save image.' };
    }
    
    // The brand profile document ID will be the same as the userId
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
        console.log(`Processing image for saving. Data URI starts with: ${image.dataUri.substring(0,30)}...`);
        let imageUrlToSave = image.dataUri;
        let isFreepikImage = false;

        if (image.dataUri.startsWith('data:image')) {
            const fileExtensionMatch = image.dataUri.match(/^data:image\/([a-zA-Z+]+);base64,/);
            const fileExtension = fileExtensionMatch ? fileExtensionMatch[1] : 'png';
            // Use brandProfileDocId (which is userId) in the storage path for images
            const filePath = `users/${userId}/brandProfiles/${brandProfileDocId}/generatedLibraryImages/${Date.now()}_${generateFilenamePart()}.${fileExtension}`;
            const imageStorageRef = storageRef(storage, filePath);

            console.log(`handleSaveGeneratedImagesAction: Attempting to upload image data URI to: ${filePath}`);
            try {
                const snapshot = await uploadString(imageStorageRef, image.dataUri, 'data_url');
                console.log(`handleSaveGeneratedImagesAction: Successfully uploaded image: ${filePath}`);
                imageUrlToSave = await getDownloadURL(snapshot.ref);
                console.log(`handleSaveGeneratedImagesAction: Obtained download URL: ${imageUrlToSave}`);
            } catch (uploadError: any) {
                const uploadErrorDetail = `Failed to upload image to Firebase Storage: ${uploadError.message}`;
                console.error(`handleSaveGeneratedImagesAction: ${uploadErrorDetail}`, JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError)));
                saveErrors.push(uploadErrorDetail);
                continue;
            }
        } else if (image.dataUri.startsWith('image_url:')) {
            imageUrlToSave = image.dataUri.substring(10);
            console.log(`handleSaveGeneratedImagesAction: Image is a direct URL (likely from Freepik GET), not uploading to storage: ${imageUrlToSave}`);
            isFreepikImage = true;
        } else if (image.dataUri.startsWith('https://')) {
            console.log(`handleSaveGeneratedImagesAction: Image is already an HTTPS URL, not uploading to storage: ${imageUrlToSave}`);
        }

        // Ensure the parent brand profile document exists
        const userBrandProfileDocRef = doc(db, `users/${userId}/brandProfiles/${brandProfileDocId}`);
        const brandProfileDocSnap = await getDoc(userBrandProfileDocRef);

        if (!brandProfileDocSnap.exists()) {
            console.log(`handleSaveGeneratedImagesAction: Brand profile document ${brandProfileDocId} does not exist for user ${userId}. Creating it...`);
            await setDoc(userBrandProfileDocRef, {
                // Initialize with minimal data or fetch from user's main profile if needed
                brandName: "Default Brand Name", // Placeholder, ideally get from user's actual profile
                createdAt: serverTimestamp(),
            });
            console.log(`handleSaveGeneratedImagesAction: Successfully created brand profile document for user ${userId}.`);
        }

        // Save to the 'savedLibraryImages' subcollection under the user-specific brand profile document
        const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${brandProfileDocId}/savedLibraryImages`);
        try {
            await addDoc(firestoreCollectionRef, {
                storageUrl: imageUrlToSave,
                prompt: image.prompt || "N/A",
                style: image.style || "N/A",
                createdAt: serverTimestamp(),
            });
            console.log(`handleSaveGeneratedImagesAction: Successfully saved image metadata to Firestore for URL: ${imageUrlToSave}`);
            savedCount++;
        } catch (firestoreError: any) {
            const firestoreErrorDetail = `Failed to save image metadata to Firestore: ${firestoreError.message}`;
            console.error(`handleSaveGeneratedImagesAction: ${firestoreErrorDetail}`, JSON.stringify(firestoreError, Object.getOwnPropertyNames(firestoreError)));
            saveErrors.push(firestoreErrorDetail);
            continue;
        }

        if (isFreepikImage) {
            try {
                new URL(imageUrlToSave);
            } catch (urlError: any) {
                const urlErrorDetail = `Freepik image URL is invalid: ${urlError.message}`;
                console.error(`handleSaveGeneratedImagesAction: ${urlErrorDetail}`);
                saveErrors.push(urlErrorDetail);
                continue;
            }
        }
      } catch (e: any) {
        const specificError = `Failed to save image (prompt: ${promptSnippet}): ${(e as Error).message?.substring(0,100)}`;
        console.error(`handleSaveGeneratedImagesAction: ${specificError}. Full error:`, JSON.stringify(e, Object.getOwnPropertyNames(e)));
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
      const criticalErrorMsg = `A critical server error occurred during image saving: ${e.message || "Unknown error"}. Please check server logs.`;
      console.error("Critical error in handleSaveGeneratedImagesAction (outside loop):", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
      return { error: criticalErrorMsg };
  }
}

async function _checkFreepikTaskStatus(taskId: string): Promise<{ status: string; images: string[] | null }> {
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  if (!freepikApiKey) {
    throw new Error("FREEPIK_API_KEY is not set in environment variables for checking task status.");
  }

  const url = `https://api.freepik.com/v1/ai/text-to-image/imagen3/${taskId}`;
  console.log(`Checking Freepik task status for ${taskId} at URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-freepik-api-key': freepikApiKey,
      },
    });

    const responseData = await response.json();
    console.log(`Response from Freepik GET API for task ${taskId}:`, JSON.stringify(responseData, null, 2));

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


    const result = await generateBrandLogo(input);
    const userId = formData.get('userId') as string; // Needs to be actual authenticated user's ID
    if (!userId) {
        return { error: "User ID is missing. Cannot save brand logo."};
    }
    const brandProfileDocId = userId; // Using userId for the brand profile doc
    const firestoreCollectionRef = collection(db, `users/${userId}/brandProfiles/${brandProfileDocId}/brandLogos`);
    await addDoc(firestoreCollectionRef, {
      logoData: result.logoDataUri || "", // Storing data URI directly, consider storage if very large.
      brandName: input.brandName,
      createdAt: serverTimestamp()
    });
    return { data: result, message: "Brand logo generated and saved successfully!" };
  } catch (e: any) {
    console.error("Error in handleGenerateBrandLogoAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Failed to generate brand logo: ${e.message || "Unknown error. Check server logs."}` };
  }
}

export async function handleGenerateBrandForgeAppLogoAction(
  prevState: FormState<GenerateBrandForgeAppLogoOutput>,
  formData: FormData // FormData is passed by useActionState but not used by this specific flow
): Promise<FormState<GenerateBrandForgeAppLogoOutput>> {
  try {
    // No input needed from formData as the flow hardcodes BrandForge AI details
    const result = await generateBrandForgeAppLogo();
    return { data: result, message: "BrandForge AI application logo generated successfully!" };
  } catch (e: any) {
    console.error("Error in handleGenerateBrandForgeAppLogoAction:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Failed to generate BrandForge AI app logo: ${e.message || "Unknown error. Check server logs."}` };
  }
}
