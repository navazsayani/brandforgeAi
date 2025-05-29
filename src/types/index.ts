
export interface BrandData {
  brandName?: string;
  websiteUrl?: string;
  brandDescription?: string;
  imageStyle?: string;
  targetKeywords?: string;
  exampleImages?: string[]; // Changed from exampleImage: string
}

export interface GeneratedImage {
  id: string;
  src: string; // Data URI
  prompt: string;
  style: string;
}

export interface GeneratedSocialMediaPost {
  id: string;
  platform: 'Instagram'; // Example, could be extended
  imageSrc: string | null; // reference to a generated image or uploaded one
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
  campaignConcept: string;
  headlines: string[];
  bodyTexts: string[];
  platformGuidance: string;
  targetPlatforms: ('google_ads' | 'meta')[];
}
