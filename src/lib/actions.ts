
"use server";

import { generateImages, type GenerateImagesInput } from '@/ai/flows/generate-images';
import { generateSocialMediaCaption, type GenerateSocialMediaCaptionInput } from '@/ai/flows/generate-social-media-caption';
import { generateBlogContent, type GenerateBlogContentInput } from '@/ai/flows/generate-blog-content';
import { generateAdCampaign, type GenerateAdCampaignInput } from '@/ai/flows/generate-ad-campaign';
import { extractBrandInfoFromUrl, type ExtractBrandInfoFromUrlInput, type ExtractBrandInfoFromUrlOutput } from '@/ai/flows/extract-brand-info-from-url-flow';


// Generic type for form state with error
export interface FormState<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export async function handleGenerateImagesAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState<string>> {
  try {
    const input: GenerateImagesInput = {
      brandDescription: formData.get("brandDescription") as string,
      imageStyle: formData.get("imageStyle") as string,
      exampleImage: formData.get("exampleImage") as string | undefined,
      aspectRatio: formData.get("aspectRatio") as string | undefined,
    };

    if (!input.brandDescription || !input.imageStyle) {
      return { error: "Brand description and image style are required." };
    }
    // Ensure exampleImage is not an empty string if provided
    if (input.exampleImage === "") {
      delete input.exampleImage;
    }
    if (input.aspectRatio === "") {
        delete input.aspectRatio;
    }
    
    const result = await generateImages(input);
    return { data: result.generatedImage, message: "Image generated successfully!" };
  } catch (e: any) {
    return { error: e.message || "Failed to generate image." };
  }
}

export async function handleGenerateSocialMediaCaptionAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ caption: string; hashtags: string }>> {
  try {
    const input: GenerateSocialMediaCaptionInput = {
      brandDescription: formData.get("brandDescription") as string,
      imageDescription: formData.get("imageDescription") as string,
      tone: formData.get("tone") as string,
    };
    if (!input.brandDescription || !input.imageDescription || !input.tone) {
      return { error: "Brand description, image description, and tone are required." };
    }
    const result = await generateSocialMediaCaption(input);
    return { data: result, message: "Social media content generated!" };
  } catch (e: any) {
    return { error: e.message || "Failed to generate social media caption." };
  }
}

export async function handleGenerateBlogContentAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ title: string; content: string; tags: string }>> {
  try {
    const input: GenerateBlogContentInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("brandDescription") as string,
      keywords: formData.get("keywords") as string,
      targetPlatform: formData.get("targetPlatform") as "Medium" | "Other",
    };
     if (!input.brandName || !input.brandDescription || !input.keywords || !input.targetPlatform) {
      return { error: "All fields are required for blog content generation." };
    }
    const result = await generateBlogContent(input);
    return { data: result, message: "Blog content generated!" };
  } catch (e: any)
