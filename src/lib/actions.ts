
"use server";

import { generateImages, type GenerateImagesInput } from '@/ai/flows/generate-images';
import { generateSocialMediaCaption, type GenerateSocialMediaCaptionInput } from '@/ai/flows/generate-social-media-caption';
import { generateBlogContent, type GenerateBlogContentInput } from '@/ai/flows/generate-blog-content';
import { generateAdCampaign, type GenerateAdCampaignInput, type GenerateAdCampaignOutput } from '@/ai/flows/generate-ad-campaign';
import { extractBrandInfoFromUrl, type ExtractBrandInfoFromUrlInput, type ExtractBrandInfoFromUrlOutput } from '@/ai/flows/extract-brand-info-from-url-flow';
import { describeImage, type DescribeImageInput, type DescribeImageOutput } from '@/ai/flows/describe-image-flow';
import { generateBlogOutline, type GenerateBlogOutlineInput, type GenerateBlogOutlineOutput } from '@/ai/flows/generate-blog-outline-flow';


// Generic type for form state with error
export interface FormState<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export async function handleGenerateImagesAction(
  prevState: FormState<{ generatedImages: string[]; promptUsed: string; }>,
  formData: FormData
): Promise<FormState<{ generatedImages: string[]; promptUsed: string; }>> {
  try {
    const numberOfImagesStr = formData.get("numberOfImages") as string;
    const numberOfImages = parseInt(numberOfImagesStr, 10) || 1;
    
    const negativePromptValue = formData.get("negativePrompt") as string | null; // Can be null if field is empty
    const seedStr = formData.get("seed") as string | undefined;
    const seed = seedStr && !isNaN(parseInt(seedStr, 10)) ? parseInt(seedStr, 10) : undefined;
    
    let finalizedTextPromptValue = formData.get("finalizedTextPrompt") as string | undefined;
    if (finalizedTextPromptValue === "") {
      finalizedTextPromptValue = undefined;
    }

    const input: GenerateImagesInput = {
      brandDescription: formData.get("brandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      imageStyle: formData.get("imageStyle") as string,
      exampleImage: formData.get("exampleImage") as string | undefined,
      aspectRatio: formData.get("aspectRatio") as string | undefined,
      numberOfImages: numberOfImages,
      negativePrompt: negativePromptValue === null || negativePromptValue === "" ? undefined : negativePromptValue, // Ensure undefined if empty/null
      seed: seed,
      finalizedTextPrompt: finalizedTextPromptValue,
    };

    if (!input.finalizedTextPrompt && (!input.brandDescription || !input.imageStyle)) {
      return { error: "Brand description and image style are required if not providing a finalized text prompt." };
    }
    if (input.exampleImage === "") delete input.exampleImage;
    if (input.aspectRatio === "" || input.aspectRatio === undefined) delete input.aspectRatio;
    if (input.industry === "") delete input.industry;


    const result = await generateImages(input);
    const message = result.generatedImages.length > 1
        ? `${result.generatedImages.length} images generated successfully!`
        : "Image generated successfully!";
    return { data: { generatedImages: result.generatedImages, promptUsed: result.promptUsed }, message: message };
  } catch (e: any) {
    console.error("Error in handleGenerateImagesAction:", e);
    return { error: e.message || "Failed to generate image(s)." };
  }
}

export async function handleDescribeImageAction(
  prevState: FormState<DescribeImageOutput>,
  formData: FormData
): Promise<FormState<DescribeImageOutput>> {
  try {
    const imageDataUri = formData.get("imageDataUri") as string;
    if (!imageDataUri) {
      return { error: "Image data URI is required to generate a description." };
    }
    const input: DescribeImageInput = { imageDataUri };
    const result = await describeImage(input);
    return { data: result, message: "Image description generated!" };
  } catch (e: any) {
    console.error("Error in handleDescribeImageAction:", e);
    return { error: e.message || "Failed to generate image description." };
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


    const input: GenerateSocialMediaCaptionInput = {
      brandDescription: formData.get("brandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      imageDescription: imageSrc ? imageDescription : undefined, 
      tone: formData.get("tone") as string,
    };

    if (!input.brandDescription || !input.tone) {
      return { error: "Brand description and tone are required." };
    }
    if (imageSrc && (!imageDescription || imageDescription.trim() === "")) {
        return { error: "Image description is required if an image is selected for the post."}
    }
    if (input.industry === "") delete input.industry;


    const result = await generateSocialMediaCaption(input);
    return { data: { ...result, imageSrc: imageSrc }, message: "Social media content generated!" };
  } catch (e: any) {
    console.error("Error in handleGenerateSocialMediaCaptionAction:", e);
    return { error: e.message || "Failed to generate social media caption." };
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
        if (input.industry === "") delete input.industry;


        const result = await generateBlogOutline(input);
        return { data: result, message: "Blog outline generated successfully!" };
    } catch (e: any) {
        console.error("Error in handleGenerateBlogOutlineAction:", e);
        return { error: e.message || "Failed to generate blog outline." };
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
    if (input.industry === "") delete input.industry;

    const result = await generateBlogContent(input);
    return { data: result, message: "Blog content generated!" };
  } catch (e: any) {
    console.error("Error in handleGenerateBlogContentAction:", e);
    return { error: e.message || "Failed to generate blog content." };
  }
}

export async function handleGenerateAdCampaignAction(
  prevState: FormState<GenerateAdCampaignOutput>,
  formData: FormData
): Promise<FormState<GenerateAdCampaignOutput>> {
  try {
    const platformsString = formData.get("platforms") as string;
    const platformsArray = platformsString ? platformsString.split(',') as ('google_ads' | 'meta')[] : [];

    let generatedContent = formData.get("generatedContent") as string;
    if (generatedContent === "Custom content for ad campaign") {
        generatedContent = formData.get("customGeneratedContent") as string;
    }


    const input: GenerateAdCampaignInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("brandDescription") as string,
      industry: formData.get("industry") as string | undefined,
      generatedContent: generatedContent,
      targetKeywords: formData.get("targetKeywords") as string,
      budget: Number(formData.get("budget")),
      platforms: platformsArray,
    };

    if (!input.brandName || !input.brandDescription || !input.generatedContent || !input.targetKeywords || isNaN(input.budget) || input.platforms.length === 0) {
        return { error: "All fields are required, budget must be a number, and at least one platform must be selected." };
    }
    if (!generatedContent.trim()) {
        return { error: "Ad content (selected or custom) cannot be empty."};
    }
    if (input.industry === "") delete input.industry;


    const result = await generateAdCampaign(input);
    return { data: result, message: "Ad campaign variations generated successfully!" };
  } catch (e: any) {
    console.error("Error in handleGenerateAdCampaignAction:", e);
    return { error: e.message || "Failed to generate ad campaign variations." };
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
        console.error("Error in handleExtractBrandInfoFromUrlAction:", e);
        return { error: e.message || "Failed to extract brand information from URL." };
    }
}


    