
export interface BrandData {
  brandName?: string;
  websiteUrl?: string;
  brandDescription?: string;
  industry?: string;
  imageStyleNotes?: string; // For custom free-text style notes
  targetKeywords?: string;
  exampleImages?: string[]; // URLs from Firebase Storage
  brandLogoUrl?: string; // URL from Firebase Storage for the brand logo
  plan?: 'free' | 'premium';
  userEmail?: string; // Added user's email
  subscriptionEndDate?: any; // Can be a Firestore Timestamp object
}

export interface GeneratedImage {
  id: string;
  src: string; // Data URI from AI generation, or Firebase Storage URL if saved
  prompt: string;
  style: string;
}

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
  postGoal?: string;
  targetAudience?: string;
  callToAction?: string;
  createdAt?: any;
  status: 'draft' | 'scheduled' | 'deployed';
}

export interface GeneratedBlogPost {
  id:string;
  title: string;
  content: string;
  tags: string;
  platform: 'Medium' | 'Other';
  articleStyle?: string;
  targetAudience?: string;
  blogTone?: string;
  createdAt?: any;
  status: 'draft' | 'scheduled' | 'deployed';
  outline?: string;
}

export interface GeneratedAdCampaign {
  id: string;
  campaignConcept: string;
  headlines: string[];
  bodyTexts: string[];
  platformGuidance: string;
  targetPlatforms: ('google_ads' | 'meta')[];
  brandName?: string;
  brandDescription?: string;
  industry?: string;
  inspirationalContent?: string;
  targetKeywords?: string;
  budget?: number;
  campaignGoal?: string;
  targetAudience?: string;
  callToAction?: string;
  createdAt?: any;
  status: 'draft' | 'scheduled' | 'deployed';
}

export interface UserProfileSelectItem {
  userId: string;
  brandName: string;
  userEmail: string;
  plan?: 'free' | 'premium';
  subscriptionEndDate?: string | null;
}

export interface ModelConfig {
  imageGenerationModel: string;
  textToImageModel: string;
  fastModel: string;
  visionModel: string;
  powerfulModel: string;
  paymentMode?: 'live' | 'test';
  freepikEnabled?: boolean;
  socialMediaConnectionsEnabled?: boolean;
}

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface PlanQuotas {
  imageGenerations: number;
  socialPosts: number;
  blogPosts: number;
}

export interface PlanPrice {
  amount: string;
  originalAmount?: string;
  unit: string;
}

export interface PlanDetails {
  id: string;
  name: string;
  description: string;
  price: PlanPrice;
  features: PlanFeature[];
  quotas: PlanQuotas;
  cta: string;
}

export interface PlansConfig {
  [currency: string]: {
    free: PlanDetails;
    pro: PlanDetails;
  };
}

export interface MonthlyUsage {
  imageGenerations: number;
  socialPosts: number;
  blogPosts: number;
}

export interface AdminUserUsage extends MonthlyUsage {
  userId: string;
  brandName: string;
  userEmail: string;
}

// For OAuth connections
export interface ConnectedAccountsStatus {
    meta: boolean;
    x: boolean;
    metaHealth?: 'healthy' | 'expired' | 'invalid' | 'unknown';
    metaExpiresAt?: string;
    metaLastValidated?: string;
    xHealth?: 'healthy' | 'expired' | 'invalid' | 'unknown';
}

export interface UserApiCredentials {
    [platform: string]: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: any; // Firestore Timestamp
        updatedAt: any; // Firestore Timestamp
        tokenType?: 'short_lived' | 'long_lived';
        validatedAt?: any; // Firestore Timestamp
        metaUserId?: string;
        metaUserName?: string;
        lastRefreshed?: any; // Firestore Timestamp
    };
}

export interface InstagramAccount {
  id: string;
  username: string;
}
