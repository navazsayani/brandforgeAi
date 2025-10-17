

import { z } from 'zod';

export interface BrandData {
  brandName?: string;
  websiteUrl?: string;
  brandDescription?: string;
  industry?: string;
  imageStyleNotes?: string; // For custom free-text style notes
  targetKeywords?: string;
  exampleImages?: string[]; // URLs from Firebase Storage
  brandLogoUrl?: string; // URL from Firebase Storage for the brand logo
  logoType?: 'logomark' | 'logotype' | 'monogram';
  logoShape?: 'circle' | 'square' | 'shield' | 'hexagon' | 'diamond' | 'custom';
  logoStyle?: 'minimalist' | 'modern' | 'classic' | 'playful' | 'bold' | 'elegant';
  logoColors?: string;
  logoBackground?: 'white' | 'transparent' | 'dark';
  plan?: 'free' | 'premium';
  userEmail?: string; // Added user's email
  subscriptionEndDate?: any; // Can be a Firestore Timestamp object
  welcomeGiftOffered?: boolean; // To track if the user has received the welcome gift
  hasUsedPreviewMode?: boolean; // To track if user has used AI preview before profile completion
}

export interface GeneratedImage {
  id: string;
  src: string; // Data URI from AI generation, or Firebase Storage URL if saved
  prompt: string;
  style: string;
  ragMetadata?: {
    wasRAGEnhanced: boolean;
    ragInsights: any[];
    contentId: string;
    userId: string;
  };
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
  platform: 'Instagram' | 'LinkedIn' | 'Twitter' | 'Facebook' | 'all';
  imageSrc: string | null;
  imageDescription: string;
  caption: string;
  hashtags: string;
  tone: string;
  postGoal?: string;
  targetAudience?: string;
  callToAction?: string;
  language?: string;
  createdAt?: any;
  status: 'draft' | 'scheduled' | 'deployed';
  ragMetadata?: {
    wasRAGEnhanced: boolean;
    ragInsights: any[];
    contentId: string;
    userId: string;
  };
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
  ragMetadata?: {
    wasRAGEnhanced: boolean;
    ragInsights: any[];
    contentId: string;
    userId: string;
  };
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
  ragMetadata?: {
    wasRAGEnhanced: boolean;
    ragInsights: any[];
    contentId: string;
    userId: string;
  };
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
  // Fireworks AI configuration
  fireworksEnabled?: boolean;
  fireworksSDXLTurboEnabled?: boolean;
  fireworksSDXL3Enabled?: boolean;
  intelligentModelSelection?: boolean;
  showAdvancedImageControls?: boolean;
  // Admin-configurable Fireworks model names
  fireworksSDXLTurboModel?: string;
  fireworksSDXL3Model?: string;
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
        updatedAt?: any; // Firestore Timestamp
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

// Schemas for new Image Refinement feature
export const EditImageInputSchema = z.object({
  imageDataUri: z.string().describe("The base image to edit, as a data URI."),
  instruction: z.string().min(3, { message: "Instruction must be at least 3 characters." }).describe('The user\'s instruction on how to edit the image.'),
  // Quality mode for consistent UX with image generation
  qualityMode: z.enum(['fast', 'balanced', 'premium']).default('balanced').optional().describe("Quality mode: fast (SDXL Turbo), balanced (Gemini), premium (SDXL 3)"),
  // Optional provider selection for editing (overrides qualityMode)
  provider: z.enum(['GEMINI', 'FIREWORKS_SDXL_TURBO', 'FIREWORKS_SDXL_3']).optional().describe("The provider to use for image editing."),
  // Fireworks-specific editing parameters
  fireworksImg2ImgStrength: z.number().min(0).max(1).default(0.7).optional().describe("Strength for img2img transformation during editing"),
  fireworksGuidanceScale: z.number().min(1).max(20).default(7.5).optional().describe("Guidance scale for editing precision"),
});
export type EditImageInput = z.infer<typeof EditImageInputSchema>;

export const EditImageOutputSchema = z.object({
  editedImageDataUri: z.string().describe('The edited image as a data URI.'),
  providerUsed: z.string().optional().describe('The provider used for the image edit operation.'),
});
export type EditImageOutput = z.infer<typeof EditImageOutputSchema>;

export const EnhanceRefinePromptInputSchema = z.object({
  instruction: z.string().min(3, { message: "Instruction must be at least 3 characters." }).describe('The user-provided simple instruction to be enhanced.'),
});
export type EnhanceRefinePromptInput = z.infer<typeof EnhanceRefinePromptInputSchema>;

export const EnhanceRefinePromptOutputSchema = z.object({
  enhancedInstruction: z.string().describe('The AI-enhanced, more detailed instruction for the image editing model.'),
});
export type EnhanceRefinePromptOutput = z.infer<typeof EnhanceRefinePromptOutputSchema>;



// Types for admin orphaned images cleanup
export interface OrphanedBrandImage {
  userId: string;
  userEmail?: string;
  imageUrl: string;
}

export interface OrphanedLibraryImage {
  userId: string;
  userEmail?: string;
  imageId: string;
  imageUrl: string;
}

export interface OrphanedLogoImage {
  userId: string;
  userEmail?: string;
  logoId: string;
  imageUrl: string;
}

export interface OrphanedImageScanResult {
  orphanedBrandImages: OrphanedBrandImage[];
  orphanedLibraryImages: OrphanedLibraryImage[];
  orphanedLogoImages: OrphanedLogoImage[];
  totalScanned: number;
  scanTimestamp: string;
}

// Housekeeping scan results
export interface HousekeepingScanResult {
  oldDeployedContent: {
    socialPosts: number;
    blogPosts: number;
    adCampaigns: number;
  };
  oldDraftContent: {
    socialPosts: number;
    blogPosts: number;
    adCampaigns: number;
  };
  oldLibraryImages: {
    count: number;
    estimatedSize: number;
  };
  orphanedRAGVectors: {
    count: number;
  };
  totalUsers: number;
  scanTimestamp: string;
}

export interface HousekeepingCleanupResult {
  deletedDeployedContent: number;
  deletedDraftContent: number;
  deletedLibraryImages: number;
  deletedRAGVectors: number;
  savedStorageSpace: number;
  errors: string[];
}

// RAG metadata interface
export interface RAGMetadata {
  wasRAGEnhanced: boolean;
  ragInsights: any[];
  contentId: string;
  userId: string;
  brandPatterns?: string;
  voicePatterns?: string;
  successfulStyles?: string;
  effectiveHashtags?: string;
  performanceInsights?: string;
  seoKeywords?: string;
  seasonalTrends?: string;
  avoidPatterns?: string;
}

// Last generation result interfaces
export interface LastImageGenerationResult {
  generatedImages: string[];
  promptUsed: string;
  providerUsed: string;
  ragMetadata?: RAGMetadata;
}
