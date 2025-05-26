
export interface BrandData {
  brandName?: string;
  websiteUrl?: string;
  brandDescription?: string;
  imageStyle?: string;
  targetKeywords?: string;
  exampleImage?: string; // URL or Data URI
}

export interface GeneratedImage {
  id: string;
  src: string; // Data URI
  prompt: string;
  style: string;
}

export interface GeneratedSocialMediaPost {
  id: string;
  platform: 'Instagram';
  imageSrc: string; // reference to a generated image or uploaded one
  imageDescription: string;
  caption: string;
  hashtags: string;
  tone: string;
}

export interface GeneratedBlogPost {
  id:string;
  title: string;
  content: string;
  tags: string;
  platform: 'Medium' | 'Other';
}

export interface GeneratedAdCampaign {
  id: string;
  summary: string;
  platformDetails: Record<string, string>;
  targetPlatforms: ('google_ads' | 'meta')[];
}
