/**
 * TypeScript interfaces for Showcase Content Library
 */

export interface ShowcasePost {
  image: string; // Path to raw AI-generated image
  caption: string;
  hashtags: string;
  generationTime: string;
  platformScreenshots?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  previewProps: {
    caption: string;
    hashtags: string;
    imageSrc: string;
    brandName: string;
    brandLogoUrl: string;
    selectedPlatform?: string;
  };
}

export interface ShowcaseTestimonial {
  quote: string;
  author: string;
  role: string;
  location?: string;
  avatar: string;
}

export interface ShowcaseBrand {
  id: string;
  brandName: string;
  industry: string;
  description: string;
  logo: string;
  logoType?: 'logomark' | 'logotype' | 'monogram' | 'combination';
  logoStyle?: string;
  logoShape?: string;
  posts: ShowcasePost[];
  testimonial: ShowcaseTestimonial;
}

export interface BrandConfig {
  id: string;
  brandName: string;
  industry: string;
  description: string;
  targetKeywords: string;
  imageStyleNotes: string;
  logoStyle?: string;
  logoColors?: string;
  logoType?: string;
  logoShape?: string;
  logoBackground?: string;
  testimonial: {
    quote: string;
    author: string;
    role: string;
    location?: string;
  };
}
