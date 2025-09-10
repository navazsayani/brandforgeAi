
import type { PlansConfig } from '@/types';

export const industries = [
  { value: "fashion_apparel", label: "Fashion & Apparel" },
  { value: "beauty_cosmetics", label: "Beauty & Cosmetics" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "health_wellness", label: "Health & Wellness" },
  { value: "technology_saas", label: "Technology & SaaS" },
  { value: "travel_hospitality", label: "Travel & Hospitality" },
  { value: "ecommerce_retail", label: "E-commerce & Retail" },
  { value: "education", label: "Education" },
  { value: "finance_fintech", label: "Finance & Fintech" },
  { value: "real_estate", label: "Real Estate" },
  { value: "arts_entertainment", label: "Arts & Entertainment" },
  { value: "automotive", label: "Automotive" },
  { value: "non_profit", label: "Non-profit" },
  { value: "other", label: "Other" },
  { value: "_none_", label: "None / Not Applicable"}
];

export const imageStylePresets = [
  // --- Popular & Versatile ---
  { value: "photorealistic", label: "Photorealistic" },
  { value: "photo", label: "Photo (Freepik)" },
  { value: "cinematic", label: "Cinematic" },
  { value: "minimalist", label: "Minimalist" },
  { value: "vibrant", label: "Vibrant & Energetic" },
  { value: "3d", label: "3D Render (Freepik)" },
  { value: "digital-art", label: "Digital Art (Freepik)" },
  { value: "studio-shot", label: "Studio Shot (Freepik)" },
  
  // --- Artistic & Illustrative ---
  { value: "painting", label: "Painting (Freepik)" },
  { value: "watercolor", label: "Watercolor (Freepik)" },
  { value: "sketch", label: "Sketch (Freepik)" },
  { value: "impressionistic", label: "Impressionistic" },
  { value: "concept-art", label: "Concept Art" },
  { value: "line-art", label: "Line Art" },
  { value: "vector", label: "Vector Art (Freepik)" },
  { value: "cartoon", label: "Cartoon (Freepik)" },
  { value: "comic", label: "Comic Book Style (Freepik)" },
  
  // --- Thematic & Genre ---
  { value: "vintage", label: "Vintage (Freepik)" },
  { value: "dark_moody", label: "Dark & Moody (Generic)" },
  { value: "dark", label: "Dark (Freepik)" },
  { value: "fantasy", label: "Fantasy (Freepik)" },
  { value: "cyberpunk", label: "Cyberpunk (Freepik)" },
  { value: "steampunk", label: "Steampunk" },
  { value: "retro-futurism", label: "Retro-Futurism" },
  { value: "surreal", label: "Surreal (Freepik)" },
  
  // --- Specific & Niche ---
  { value: "abstract", label: "Abstract" },
  { value: "mockup", label: "Mockup (Freepik)" },
  { value: "isometric", label: "Isometric" },
  { value: "low-poly", label: "Low Poly (Freepik)" },
  { value: "pixel-art", label: "Pixel Art (Freepik)" },
  { value: "pop-art", label: "Pop Art" },
  { value: "art-deco", label: "Art Deco" },
  { value: "art-nouveau", label: "Art Nouveau (Freepik)" },
  { value: "claymation", label: "Claymation" },
  { value: "origami", label: "Origami (Freepik)" },
  { value: "monochrome", label: "Monochrome" },
  { value: "2000s-pone", label: "2000s Phone Aesthetic (Freepik)" },
  { value: "70s-vibe", label: "70s Vibe (Freepik)" },
  { value: "traditional-japan", label: "Traditional Japanese Art (Freepik)" },
];

export const blogTones = [
  { value: "Informative", label: "Informative & Educational" },
  { value: "Conversational", label: "Conversational & Friendly" },
  { value: "Professional", label: "Professional & Authoritative" },
  { value: "Witty", label: "Witty & Humorous" },
  { value: "Inspirational", label: "Inspirational & Motivational" },
  { value: "Technical", label: "Technical & In-depth" },
  { value: "Storytelling", label: "Storytelling & Narrative" },
];

// Freepik Imagen3 Specific Options
export const freepikImagen3EffectColors = [
  { value: "b&w", label: "Black & White" },
  { value: "pastel", label: "Pastel" },
  { value: "sepia", label: "Sepia" },
  { value: "dramatic", label: "Dramatic" },
  { value: "vibrant", label: "Vibrant" },
  { value: "orange&teal", label: "Orange & Teal" },
  { value: "film-filter", label: "Film Filter" },
  { value: "split", label: "Split Tone" },
  { value: "electric", label: "Electric" },
  { value: "pastel-pink", label: "Pastel Pink" },
  { value: "gold-glow", label: "Gold Glow" },
  { value: "autumn", label: "Autumn" },
  { value: "muted-green", label: "Muted Green" },
  { value: "deep-teal", label: "Deep Teal" },
  { value: "duotone", label: "Duotone" },
  { value: "terracotta&teal", label: "Terracotta & Teal" },
  { value: "red&blue", label: "Red & Blue" },
  { value: "cold-neon", label: "Cold Neon" },
  { value: "burgundy&blue", label: "Burgundy & Blue" },
];

export const freepikImagen3EffectLightnings = [
  { value: "studio", label: "Studio" },
  { value: "warm", label: "Warm" },
  { value: "cinematic", label: "Cinematic" },
  { value: "volumetric", label: "Volumetric" },
  { value: "golden-hour", label: "Golden Hour" },
  { value: "long-exposure", label: "Long Exposure" },
  { value: "cold", label: "Cold" },
  { value: "iridescent", label: "Iridescent" },
  { value: "dramatic", label: "Dramatic Lighting" },
  { value: "hardlight", label: "Hard Light" },
  { value: "redscale", label: "Redscale" },
  { value: "indoor-light", label: "Indoor Light" },
];

export const freepikImagen3EffectFramings = [
  { value: "portrait", label: "Portrait" },
  { value: "macro", label: "Macro" },
  { value: "panoramic", label: "Panoramic" },
  { value: "aerial-view", label: "Aerial View" },
  { value: "close-up", label: "Close-up" },
  { value: "cinematic", label: "Cinematic Framing" },
  { value: "high-angle", label: "High Angle" },
  { value: "low-angle", label: "Low Angle" },
  { value: "symmetry", label: "Symmetry" },
  { value: "fish-eye", label: "Fish Eye" },
  { value: "first-person", label: "First Person" },
];

// For Freepik/Imagen3 Provider
export const freepikImagen3AspectRatios = [
    { value: "square_1_1", label: "1:1 (Square)" },
    { value: "social_story_9_16", label: "9:16 (Social Story)" },
    { value: "widescreen_16_9", label: "16:9 (Widescreen)" },
    { value: "traditional_3_4", label: "3:4 (Traditional)" }, // Corresponds to UI 4:5 roughly
    { value: "classic_4_3", label: "4:3 (Classic)" },
];

// For General/Gemini Provider
export const generalAspectRatios = [
    { value: "1:1", label: "1:1 (Square)" },
    { value: "4:5", label: "4:5 (Portrait)" },
    { value: "16:9", label: "16:9 (Landscape)" },
    { value: "9:16", label: "9:16 (Tall Portrait)" },
    { value: "3:2", label: "3:2 (Landscape)" },
    { value: "2:3", label: "2:3 (Portrait)" },
];

// This list is used by backend generate-images flow to match Freepik structural styles
// and now by client-side preview for better accuracy.
export const freepikValidStyles = ["photo", "digital-art", "3d", "painting", "low-poly", "pixel-art", "anime", "cyberpunk", "comic", "vintage", "cartoon", "vector", "studio-shot", "dark", "sketch", "mockup", "2000s-pone", "70s-vibe", "watercolor", "art-nouveau", "origami", "surreal", "fantasy", "traditional-japan"];

// New constants for Social Media and Blog content forms
export const socialPostGoals = [
  { value: "brand_awareness", label: "Brand Awareness" },
  { value: "engagement", label: "Engagement (Likes, Comments)" },
  { value: "promotion", label: "Promotion / Sale" },
  { value: "informational", label: "Informational / Educational" },
  { value: "community_building", label: "Community Building" },
];

export const socialTones = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly & Approachable" },
  { value: "funny", label: "Witty & Humorous" },
  { value: "informative", label: "Informative & Direct" },
  { value: "inspirational", label: "Inspirational & Uplifting" },
  { value: "urgent", label: "Urgent & Action-Oriented" },
];


export const blogArticleStyles = [
  { value: "how_to_guide", label: "How-To Guide / Tutorial" },
  { value: "listicle", label: "Listicle (e.g., 'Top 5 Ways...')" },
  { value: "case_study", label: "Case Study / Success Story" },
  { value: "opinion_piece", label: "Opinion Piece / Thought Leadership" },
  { value: "news_update", label: "News Update / Announcement" },
  { value: "comparison", label: "Comparison (e.g., 'X vs. Y')" },
  { value: "faq", label: "FAQ / Q&A" },
];

export const adCampaignGoals = [
  { value: "brand_awareness", label: "Brand Awareness" },
  { value: "website_traffic", label: "Website Traffic" },
  { value: "lead_generation", label: "Lead Generation" },
  { value: "sales_conversion", label: "Sales Conversion" },
  { value: "engagement", label: "Engagement" },
];


export const DEFAULT_PLANS_CONFIG: PlansConfig = {
  USD: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started and exploring core features.',
      price: { amount: '$0', unit: '/ month' },
      features: [
        { name: 'Brand Profile Setup', included: true },
        { name: 'AI-Powered Idea Generation', included: true },
        { name: 'Blog Outline Generation', included: true },
      ],
      quotas: {
        imageGenerations: 10,
        socialPosts: 5,
        blogPosts: 0, // 0 means feature is disabled
      },
      cta: 'Your Current Plan',
    },
    pro: {
      id: 'pro_usd',
      name: 'Pro',
      description: 'For professionals and small businesses who need more power.',
      price: { amount: '$12', originalAmount: '$29', unit: '/ month' },
      features: [
        { name: 'Everything in Free, plus:', included: true },
        { name: 'Full Blog Post Generation', included: true },
        { name: 'Access to Premium Image Models', included: true },
        { name: 'Save Images to Library', included: true },
        { name: 'Priority Support', included: true },
      ],
      quotas: {
        imageGenerations: 100,
        socialPosts: 50,
        blogPosts: 5,
      },
      cta: 'Upgrade to Pro',
    },
  },
  INR: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started and exploring core features.',
      price: { amount: '₹0', unit: '/ month' },
      features: [
        { name: 'Brand Profile Setup', included: true },
        { name: 'AI-Powered Idea Generation', included: true },
        { name: 'Blog Outline Generation', included: true },
      ],
      quotas: {
        imageGenerations: 10,
        socialPosts: 5,
        blogPosts: 0,
      },
      cta: 'Your Current Plan',
    },
    pro: {
      id: 'pro_inr',
      name: 'Pro',
      description: 'For professionals and small businesses who need more power.',
      price: { amount: '₹399', originalAmount: '₹999', unit: '/ month' },
      features: [
        { name: 'Everything in Free, plus:', included: true },
        { name: 'Full Blog Post Generation', included: true },
        { name: 'Access to Premium Image Models', included: true },
        { name: 'Save Images to Library', included: true },
        { name: 'Priority Support', included: true },
      ],
      quotas: {
        imageGenerations: 100,
        socialPosts: 50,
        blogPosts: 5,
      },
      cta: 'Upgrade to Pro',
    },
  },
};

// Platform-specific constants for social media optimization
export const socialMediaPlatforms = [
  { value: "all", label: "All Platforms (Multi-optimized)" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter/X" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube Community" },
  { value: "tiktok", label: "TikTok" },
];

// Platform-specific configurations for image-focused content
export const platformConfigurations = {
  instagram: {
    name: "Instagram",
    maxCaptionLength: 2200,
    hashtagStrategy: "mix of trending and niche hashtags (20-30)",
    tone: "visual-first, story-driven, authentic",
    preferredAspectRatios: ["1:1", "4:5", "9:16"],
    imageStyle: "lifestyle, aesthetic, behind-the-scenes",
    callToAction: "subtle story-based CTA, encourage saves/shares",
    contentFocus: "Visual storytelling with complementary captions",
    audienceExpectation: "Authentic, visually appealing, personal connection"
  },
  linkedin: {
    name: "LinkedIn",
    maxCaptionLength: 1300,
    hashtagStrategy: "professional hashtags (3-5 max)",
    tone: "professional, authority-building, industry insights",
    preferredAspectRatios: ["16:9", "1.91:1", "1:1"],
    imageStyle: "professional, clean, business-oriented",
    callToAction: "professional engagement, thought-provoking questions",
    contentFocus: "Business insights with supporting professional imagery",
    audienceExpectation: "Educational, professional value, industry expertise"
  },
  twitter: {
    name: "Twitter/X",
    maxCaptionLength: 280,
    hashtagStrategy: "trending hashtags (1-3 max)",
    tone: "conversational, quick insights, engaging",
    preferredAspectRatios: ["16:9", "1:1", "2:1"],
    imageStyle: "attention-grabbing, meme-worthy, news-style",
    callToAction: "encourage retweets, replies, engagement",
    contentFocus: "Concise message with impactful visual support",
    audienceExpectation: "Quick consumption, shareable, conversation starter"
  },
  facebook: {
    name: "Facebook",
    maxCaptionLength: 2000,
    hashtagStrategy: "relevant hashtags (5-10)",
    tone: "community-focused, conversational, inclusive",
    preferredAspectRatios: ["16:9", "1:1", "4:5"],
    imageStyle: "community-oriented, event photos, lifestyle",
    callToAction: "community engagement, event participation",
    contentFocus: "Community building with visual storytelling",
    audienceExpectation: "Social connection, community value, inclusive content"
  },
  youtube: {
    name: "YouTube Community",
    maxCaptionLength: 1000,
    hashtagStrategy: "video-related hashtags (5-8)",
    tone: "engaging, educational, entertainment value",
    preferredAspectRatios: ["16:9", "9:16", "1:1"],
    imageStyle: "thumbnail-style, educational graphics, behind-the-scenes",
    callToAction: "subscribe, watch, comment encouragement",
    contentFocus: "Video-supporting content with strong visual hooks",
    audienceExpectation: "Entertainment/educational value, video-centric"
  },
  tiktok: {
    name: "TikTok",
    maxCaptionLength: 150,
    hashtagStrategy: "trending hashtags (3-5 mix of viral/niche)",
    tone: "trendy, fun, authentic, energetic",
    preferredAspectRatios: ["9:16"],
    imageStyle: "trendy, energetic, Gen-Z aesthetic",
    callToAction: "encourage follows, duets, shares",
    contentFocus: "Trend-aware content with viral potential",
    audienceExpectation: "Entertaining, trendy, authentic, quick consumption"
  },
  all: {
    name: "Multi-Platform",
    maxCaptionLength: 280, // Safe for all platforms
    hashtagStrategy: "universal hashtags (3-5)",
    tone: "versatile, professional yet approachable",
    preferredAspectRatios: ["1:1", "16:9"],
    imageStyle: "clean, professional, universally appealing",
    callToAction: "general engagement",
    contentFocus: "Platform-agnostic content optimized for broad appeal",
    audienceExpectation: "Professional quality, broad appeal, versatile"
  }
};

// Multi-language support for global markets
export const supportedLanguages = [
  { value: "english", label: "English", code: "en" },
  { value: "spanish", label: "Español (Spanish)", code: "es" },
  { value: "french", label: "Français (French)", code: "fr" },
  { value: "german", label: "Deutsch (German)", code: "de" },
  { value: "italian", label: "Italiano (Italian)", code: "it" },
  { value: "portuguese", label: "Português (Portuguese)", code: "pt" },
  { value: "hindi", label: "हिंदी (Hindi)", code: "hi" },
  { value: "hinglish", label: "Hinglish (Hindi-English Mix)", code: "hi-en" },
  { value: "japanese", label: "日本語 (Japanese)", code: "ja" },
  { value: "korean", label: "한국어 (Korean)", code: "ko" },
  { value: "chinese_simplified", label: "简体中文 (Chinese Simplified)", code: "zh-cn" },
  { value: "arabic", label: "العربية (Arabic)", code: "ar" },
  { value: "russian", label: "Русский (Russian)", code: "ru" },
];

// Language-specific content nuances for global markets
export const languageConfigurations = {
  english: {
    name: "English",
    tone: "Professional, clear, direct",
    culturalContext: "Global business standard, straightforward communication",
    hashtagStyle: "English hashtags, trending topics",
    contentStyle: "Formal to casual depending on platform"
  },
  spanish: {
    name: "Español",
    tone: "Warm, expressive, community-oriented",
    culturalContext: "Family-oriented, celebratory, relationship-focused",
    hashtagStyle: "Spanish hashtags, regional variations",
    contentStyle: "More expressive, emotional connection"
  },
  french: {
    name: "Français",
    tone: "Sophisticated, elegant, culturally refined",
    culturalContext: "Art, culture, lifestyle appreciation",
    hashtagStyle: "French hashtags, cultural references",
    contentStyle: "Sophisticated language, cultural nuances"
  },
  german: {
    name: "Deutsch",
    tone: "Precise, efficient, quality-focused",
    culturalContext: "Engineering excellence, sustainability, innovation",
    hashtagStyle: "German hashtags, compound words",
    contentStyle: "Detailed, quality-emphasizing, structured"
  },
  italian: {
    name: "Italiano",
    tone: "Passionate, artistic, lifestyle-focused",
    culturalContext: "Art, food, family, craftsmanship",
    hashtagStyle: "Italian hashtags, regional pride",
    contentStyle: "Expressive, artistic, lifestyle-centered"
  },
  portuguese: {
    name: "Português",
    tone: "Warm, friendly, community-spirited",
    culturalContext: "Community-focused, celebration, diversity",
    hashtagStyle: "Portuguese hashtags, Brazilian/Portuguese variations",
    contentStyle: "Friendly, inclusive, celebration-oriented"
  },
  hindi: {
    name: "हिंदी",
    tone: "Respectful, family-oriented, traditional values",
    culturalContext: "Family, festivals, respect for elders, traditions",
    hashtagStyle: "Hindi hashtags, cultural festivals",
    contentStyle: "Respectful language, cultural sensitivity, family focus"
  },
  hinglish: {
    name: "Hinglish",
    tone: "Casual, relatable, modern Indian",
    culturalContext: "Urban India, modern lifestyle, cultural fusion",
    hashtagStyle: "Mix of English/Hindi hashtags, trending topics",
    contentStyle: "Code-switching, colloquial, trendy, relatable"
  },
  japanese: {
    name: "日本語",
    tone: "Polite, respectful, detail-oriented",
    culturalContext: "Respect, quality, seasonal awareness, craftsmanship",
    hashtagStyle: "Japanese hashtags, seasonal references",
    contentStyle: "Polite forms, seasonal sensitivity, quality focus"
  },
  korean: {
    name: "한국어",
    tone: "Trendy, community-focused, respectful",
    culturalContext: "K-culture, community, respect for hierarchy",
    hashtagStyle: "Korean hashtags, K-pop/culture references",
    contentStyle: "Respectful language levels, trend-aware, community-focused"
  },
  chinese_simplified: {
    name: "简体中文",
    tone: "Respectful, prosperity-focused, community-minded",
    culturalContext: "Success, community, traditional values, innovation",
    hashtagStyle: "Chinese hashtags, cultural celebrations",
    contentStyle: "Respectful, success-oriented, community values"
  },
  arabic: {
    name: "العربية",
    tone: "Respectful, community-oriented, traditional",
    culturalContext: "Family, respect, hospitality, traditions",
    hashtagStyle: "Arabic hashtags, cultural/religious sensitivity",
    contentStyle: "Respectful language, cultural sensitivity, community focus"
  },
  russian: {
    name: "Русский",
    tone: "Direct, expressive, community-focused",
    culturalContext: "Community, directness, cultural pride",
    hashtagStyle: "Russian hashtags, cultural references",
    contentStyle: "Direct communication, cultural awareness, community-oriented"
  }
};

// Platform-specific aspect ratio mappings for image generation
export const platformAspectRatios = {
  instagram: {
    feed: "1:1",
    story: "9:16",
    reel: "9:16",
    carousel: "1:1"
  },
  linkedin: {
    post: "16:9",
    article: "16:9",
    company: "1.91:1"
  },
  twitter: {
    post: "16:9",
    header: "3:1",
    card: "2:1"
  },
  facebook: {
    post: "16:9",
    cover: "16:9",
    story: "9:16"
  },
  youtube: {
    thumbnail: "16:9",
    community: "16:9",
    short: "9:16"
  },
  tiktok: {
    video: "9:16"
  },
  all: {
    universal: "1:1",
    landscape: "16:9"
  }
};
