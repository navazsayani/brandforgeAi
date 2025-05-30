
export interface BrandData {
  brandName?: string;
  websiteUrl?: string;
  brandDescription?: string;
  industry?: string;
  imageStyleNotes?: string; // For custom free-text style notes
  targetKeywords?: string;
  exampleImages?: string[]; // URLs from Firebase Storage
  brandLogoUrl?: string; // URL from Firebase Storage for the brand logo
}

export interface GeneratedImage {
  id: string;
  src: string; // Data URI from AI generation, or Firebase Storage URL if saved
  prompt: string;
  style: string;
}

// New type for images saved to the user's library
export interface SavedGeneratedImage {
  id: string; // Firestore document ID
  storageUrl: string; // Firebase Storage URL
  prompt: string;
  style: string;
  createdAt: any; // Firestore Timestamp
}

export interface GeneratedSocialMediaPost {
  id: string;
  platform: 'Instagram';
  imageSrc: string | null;
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
  // The following fields are based on the input to help associate the campaign
  brandName?: string;
  brandDescription?: string;
  industry?: string;
  inspirationalContent?: string;
  targetKeywords?: string;
  budget?: number;
}
