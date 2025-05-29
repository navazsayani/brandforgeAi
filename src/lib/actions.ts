
"use server";

import { generateImages, type GenerateImagesInput } from '@/ai/flows/generate-images';
import { generateSocialMediaCaption, type GenerateSocialMediaCaptionInput } from '@/ai/flows/generate-social-media-caption';
import { generateBlogContent, type GenerateBlogContentInput } from '@/ai/flows/generate-blog-content';
import { generateAdCampaign, type GenerateAdCampaignInput } from '@/ai/flows/generate-ad-campaign';
import { extractBrandInfoFromUrl, type ExtractBrandInfoFromUrlInput, type ExtractBrandInfoFromUrlOutput } from '@/ai/flows/extract-brand-info-from-url-flow';
import { describeImage, type DescribeImageInput, type DescribeImageOutput } from '@/ai/flows/describe-image-flow';


// Generic type for form state with error
export interface FormState<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export async function handleGenerateImagesAction(
  prevState: FormState<string[]>, 
  formData: FormData
): Promise<FormState<string[]>> {
  try {
    const numberOfImagesStr = formData.get("numberOfImages") as string;
    const numberOfImages = parseInt(numberOfImagesStr, 10) || 1;
    const negativePrompt = formData.get("negativePrompt") as string | undefined;
    const seedStr = formData.get("seed") as string | undefined;
    const seed = seedStr && !isNaN(parseInt(seedStr, 10)) ? parseInt(seedStr, 10) : undefined;


    const input: GenerateImagesInput = {
      brandDescription: formData.get("brandDescription") as string,
      imageStyle: formData.get("imageStyle") as string,
      exampleImage: formData.get("exampleImage") as string | undefined,
      aspectRatio: formData.get("aspectRatio") as string | undefined,
      numberOfImages: numberOfImages,
      negativePrompt: negativePrompt === "" ? undefined : negativePrompt,
      seed: seed,
    };

    if (!input.brandDescription || !input.imageStyle) {
      return { error: "Brand description and image style are required." };
    }
    if (input.exampleImage === "") {
      delete input.exampleImage;
    }
    if (input.aspectRatio === "" || input.aspectRatio === undefined) {
        delete input.aspectRatio;
    }
    
    const result = await generateImages(input);
    const message = result.generatedImages.length > 1 
        ? `${result.generatedImages.length} images generated successfully!` 
        : "Image generated successfully!";
    return { data: result.generatedImages, message: message };
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
    const imageSrc = selectedImageSrc && selectedImageSrc !== "" ? selectedImageSrc : null;
    const imageDescription = formData.get("imageDescription") as string;

    const input: GenerateSocialMediaCaptionInput = {
      brandDescription: formData.get("brandDescription") as string,
      imageDescription: imageSrc ? imageDescription : undefined,
      tone: formData.get("tone") as string,
    };

    if (!input.brandDescription || !input.tone) {
      return { error: "Brand description and tone are required." };
    }
    if (imageSrc && !imageDescription) {
        return { error: "Image description is required if an image is selected for the post."}
    }
    
    const result = await generateSocialMediaCaption(input);
    return { data: { ...result, imageSrc: imageSrc }, message: "Social media content generated!" };
  } catch (e: any) {
    console.error("Error in handleGenerateSocialMediaCaptionAction:", e);
    return { error: e.message || "Failed to generate social media caption." };
  }
}

export async function handleGenerateBlogContentAction(
  prevState: FormState<{ title: string; content: string; tags: string }>,
  formData: FormData
): Promise<FormState<{ title: string; content: string; tags: string }>> {
  try {
    const input: GenerateBlogContentInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("brandDescription") as string,
      keywords: formData.get("keywords") as string,
      targetPlatform: formData.get("targetPlatform") as "Medium" | "Other",
      websiteUrl: formData.get("websiteUrl") as string || undefined,
    };
     if (!input.brandName || !input.brandDescription || !input.keywords || !input.targetPlatform) {
      return { error: "All fields (except optional website URL) are required for blog content generation." };
    }
    if (input.websiteUrl === "") delete input.websiteUrl;

    const result = await generateBlogContent(input);
    return { data: result, message: "Blog content generated!" };
  } catch (e: any) {
    console.error("Error in handleGenerateBlogContentAction:", e);
    return { error: e.message || "Failed to generate blog content." };
  }
}

export async function handleGenerateAdCampaignAction(
  prevState: FormState<{ campaignSummary: string; platformDetails: Record<string, string> }>,
  formData: FormData
): Promise<FormState<{ campaignSummary: string; platformDetails: Record<string, string> }>> {
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
      generatedContent: generatedContent,
      targetKeywords: formData.get("targetKeywords") as string,
      budget: Number(formData.get("budget")),
      platforms: platformsArray,
    };

    if (!input.brandName || !input.brandDescription || !input.generatedContent || !input.targetKeywords || isNaN(input.budget) || input.platforms.length === 0) {
        return { error: "All fields are required and budget must be a number. At least one platform must be selected." };
    }

    const result = await generateAdCampaign(input);
    return { data: result, message: "Ad campaign details generated successfully!" };
  } catch (e: any) {
    console.error("Error in handleGenerateAdCampaignAction:", e);
    return { error: e.message || "Failed to generate ad campaign details." };
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

    