
"use server";

import { generateImages, type GenerateImagesInput } from '@/ai/flows/generate-images';
import { generateSocialMediaCaption, type GenerateSocialMediaCaptionInput } from '@/ai/flows/generate-social-media-caption';
import { generateBlogContent, type GenerateBlogContentInput } from '@/ai/flows/generate-blog-content';
import { generateAdCampaign, type GenerateAdCampaignInput } from '@/ai/flows/generate-ad-campaign';

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
    };

    if (!input.brandDescription || !input.imageStyle) {
      return { error: "Brand description and image style are required." };
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
  } catch (e: any) {
    return { error: e.message || "Failed to generate blog content." };
  }
}

export async function handleGenerateAdCampaignAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ campaignSummary: string; platformDetails: Record<string, string> }>> {
  try {
    const platformsValue = formData.get("platforms") as string;
    const platforms = platformsValue ? platformsValue.split(',') as ('google_ads' | 'meta')[] : [];

    const input: GenerateAdCampaignInput = {
      brandName: formData.get("brandName") as string,
      brandDescription: formData.get("brandDescription") as string,
      generatedContent: formData.get("generatedContent") as string,
      targetKeywords: formData.get("targetKeywords") as string,
      budget: parseFloat(formData.get("budget") as string),
      platforms: platforms,
    };

    if (!input.brandName || !input.brandDescription || !input.generatedContent || !input.targetKeywords || isNaN(input.budget) || input.platforms.length === 0) {
      return { error: "All fields are required and budget must be a valid number for ad campaign generation." };
    }
    const result = await generateAdCampaign(input);
    return { data: result, message: "Ad campaign generated!" };
  } catch (e: any) {
    return { error: e.message || "Failed to generate ad campaign." };
  }
}
