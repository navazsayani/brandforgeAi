/**
 * Gallery Content Data
 *
 * Curated collection of AI-generated logos and images for the Inspiration Gallery
 * Content is selected based on:
 * - High visual impact
 * - Trending industries 2024-2025
 * - Template coverage
 * - Diverse aesthetics
 */

import type { GalleryItem } from './gallery-types';

export const galleryItems: GalleryItem[] = [
  // ========== LOGOS (15-18 Items) ==========

  // Podcast Network - High Trend, Creator Economy
  {
    id: 'logo-wavelength',
    type: 'logo',
    imageUrl: '/gallery/logos/wavelength.png',
    templateId: 'podcast_host',
    templateName: 'Podcast Network',
    brandName: 'Wavelength',
    brandVibe: 'Creative media production',
    industry: 'media_content',
    generationPrompt: 'Modern podcast network logo with soundwave motif, bold typography, deep purple and neon pink colors, creative and dynamic',
    description: 'Creative media production logo with soundwave design',
    tags: ['podcast', 'media', 'modern', 'bold', 'creative', 'trending'],
    featured: true,
    trendScore: 95,
  },

  // Craft Brewery - Visual Appeal + Different from Coffee Shop
  {
    id: 'logo-hops-barrel',
    type: 'logo',
    imageUrl: '/gallery/logos/hops-barrel.png',
    templateId: 'craft_brewery',
    templateName: 'Craft Brewery',
    brandName: 'Hops & Barrel',
    brandVibe: 'Rustic industrial taproom',
    industry: 'food_beverage',
    generationPrompt: 'Vintage industrial craft brewery logo with hop and barrel elements, rustic amber and copper colors, warm brown tones',
    description: 'Rustic craft brewery logo with vintage industrial vibe',
    tags: ['brewery', 'vintage', 'industrial', 'beer', 'food-beverage'],
    featured: true,
    trendScore: 85,
    differentiationNote: 'Different from Daily Grind Coffee: Industrial brewery taproom vs cozy neighborhood cafe',
  },

  // Tech Startup - Trending, Modern
  {
    id: 'logo-cloudsync',
    type: 'logo',
    imageUrl: '/gallery/logos/cloudsync.png',
    templateId: 'tech_startup',
    templateName: 'Tech Startup',
    brandName: 'CloudSync',
    brandVibe: 'Cutting-edge cloud technology',
    industry: 'technology_saas',
    generationPrompt: 'Modern tech startup logo with geometric cloud icon, electric blue and purple gradient colors, sleek and innovative',
    description: 'Modern SaaS technology logo with geometric design',
    tags: ['tech', 'saas', 'modern', 'geometric', 'startup', 'trending'],
    featured: true,
    trendScore: 92,
    differentiationNote: 'Different from Elevate Consulting: Cutting-edge tech vs corporate consulting',
  },

  // Meditation App - Digital Wellness Trend
  {
    id: 'logo-mindful',
    type: 'logo',
    imageUrl: '/gallery/logos/mindful.png',
    templateId: 'meditation_app',
    templateName: 'Meditation App',
    brandName: 'Mindful',
    brandVibe: 'Digital wellness and mindfulness',
    industry: 'health_wellness',
    generationPrompt: 'Modern meditation app logo with zen circle icon, soft lavender and calming blue colors, peaceful and serene digital aesthetic',
    description: 'Digital wellness app logo with zen design',
    tags: ['wellness', 'app', 'meditation', 'modern', 'digital', 'trending'],
    featured: true,
    trendScore: 88,
    differentiationNote: 'Different from Zen Flow Yoga: Digital wellness app vs physical yoga studio',
  },

  // Barbershop - Different from Beauty Salon
  {
    id: 'logo-edge-barber',
    type: 'logo',
    imageUrl: '/gallery/logos/edge-barber.png',
    templateId: 'barbershop',
    templateName: 'Barbershop',
    brandName: 'The Edge',
    brandVibe: 'Modern masculine grooming',
    industry: 'beauty_cosmetics',
    generationPrompt: 'Bold modern barbershop logo with razor blade icon, black red and metallic silver colors, masculine and edgy aesthetic',
    description: 'Bold barbershop logo with masculine edge',
    tags: ['barbershop', 'grooming', 'masculine', 'bold', 'modern'],
    featured: true,
    trendScore: 82,
    differentiationNote: 'Different from Bloom Beauty: Masculine edgy barber vs feminine glamorous salon',
  },

  // Bakery Patisserie - Visual Appeal
  {
    id: 'logo-sweet-alchemy',
    type: 'logo',
    imageUrl: '/gallery/logos/sweet-alchemy.png',
    templateId: 'bakery',
    templateName: 'Bakery Patisserie',
    brandName: 'Sweet Alchemy',
    brandVibe: 'Parisian chic pastries',
    industry: 'food_beverage',
    generationPrompt: 'Elegant French patisserie logo with delicate pastry icon, pastel pink cream and gold colors, sophisticated and charming',
    description: 'Elegant French bakery logo with Parisian charm',
    tags: ['bakery', 'patisserie', 'elegant', 'french', 'food'],
    featured: true,
    trendScore: 86,
    differentiationNote: 'Different from Harvest Table: Parisian chic pastries vs rustic farm-to-table',
  },

  // Pilates Studio - Different from Performance Fitness
  {
    id: 'logo-core-grace',
    type: 'logo',
    imageUrl: '/gallery/logos/core-grace.png',
    templateId: 'pilates_studio',
    templateName: 'Pilates Studio',
    brandName: 'Core & Grace',
    brandVibe: 'Feminine luxury fitness',
    industry: 'health_wellness',
    generationPrompt: 'Elegant minimalist pilates studio logo with graceful movement icon, soft rose gold and white colors, feminine and sophisticated',
    description: 'Elegant pilates studio logo with feminine touch',
    tags: ['pilates', 'fitness', 'elegant', 'feminine', 'luxury'],
    featured: true,
    trendScore: 84,
    differentiationNote: 'Different from FitLife Performance: Feminine luxury pilates vs bold high-performance training',
  },

  // Real Estate - Professional Services
  {
    id: 'logo-urban-key',
    type: 'logo',
    imageUrl: '/gallery/logos/urban-key.png',
    templateId: 'real_estate_agent',
    templateName: 'Real Estate',
    brandName: 'Urban Key',
    brandVibe: 'Luxury property',
    industry: 'real_estate',
    generationPrompt: 'Bold modern real estate logo with key and building icon, navy gold and white colors, luxury and professional',
    description: 'Luxury real estate logo with modern design',
    tags: ['real-estate', 'property', 'luxury', 'modern', 'professional'],
    featured: true,
    trendScore: 80,
  },

  // Photography Studio - Creative Professional
  {
    id: 'logo-frame-light',
    type: 'logo',
    imageUrl: '/gallery/logos/frame-light.png',
    templateId: 'photography_studio',
    templateName: 'Photography Studio',
    brandName: 'Frame & Light',
    brandVibe: 'Professional creative photography',
    industry: 'arts_entertainment',
    generationPrompt: 'Minimalist elegant photography studio logo with camera aperture icon, black white and silver colors, clean and professional',
    description: 'Minimalist photography studio logo',
    tags: ['photography', 'creative', 'minimalist', 'professional', 'arts'],
    featured: true,
    trendScore: 83,
  },

  // Plant Shop - Trending, Visual
  {
    id: 'logo-green-roots',
    type: 'logo',
    imageUrl: '/gallery/logos/green-roots.png',
    templateId: 'plant_nursery',
    templateName: 'Plant Shop',
    brandName: 'Green Roots',
    brandVibe: 'Urban jungle nursery',
    industry: 'retail_ecommerce',
    generationPrompt: 'Organic natural plant shop logo with botanical leaf icon, forest green terracotta and sage colors, earthy and fresh',
    description: 'Natural plant nursery logo with organic vibe',
    tags: ['plants', 'nursery', 'organic', 'natural', 'retail', 'trending'],
    featured: true,
    trendScore: 87,
  },

  // Pet Services - Popular
  {
    id: 'logo-paws-co',
    type: 'logo',
    imageUrl: '/gallery/logos/paws-co.png',
    templateId: 'pet_services',
    templateName: 'Pet Services',
    brandName: 'Paws & Co',
    brandVibe: 'Modern pet care',
    industry: 'pet_services',
    generationPrompt: 'Playful friendly pet services logo with paw print icon, vibrant teal and coral colors, welcoming and fun',
    description: 'Playful pet care logo with friendly vibe',
    tags: ['pet', 'grooming', 'playful', 'friendly', 'modern'],
    featured: false,
    trendScore: 81,
  },

  // Jewelry Designer - Artisan
  {
    id: 'logo-luna-stone',
    type: 'logo',
    imageUrl: '/gallery/logos/luna-stone.png',
    templateId: 'handmade_jewelry',
    templateName: 'Jewelry Designer',
    brandName: 'Luna & Stone',
    brandVibe: 'Artisan handmade jewelry',
    industry: 'fashion_apparel',
    generationPrompt: 'Elegant bohemian jewelry logo with moon and gemstone icon, rose gold turquoise and cream colors, artisan and delicate',
    description: 'Artisan jewelry logo with bohemian elegance',
    tags: ['jewelry', 'handmade', 'elegant', 'bohemian', 'artisan'],
    featured: false,
    trendScore: 79,
    differentiationNote: 'Different from Chic Boutique: Artisan handmade jewelry vs contemporary fashion clothing',
  },

  // Interior Design - Professional
  {
    id: 'logo-canvas-form',
    type: 'logo',
    imageUrl: '/gallery/logos/canvas-form.png',
    templateId: 'interior_design',
    templateName: 'Interior Design',
    brandName: 'Canvas & Form',
    brandVibe: 'High-end sophisticated design',
    industry: 'professional_services',
    generationPrompt: 'Sophisticated minimalist interior design logo with abstract geometric icon, charcoal blush and gold colors, elegant and modern',
    description: 'Sophisticated interior design logo',
    tags: ['interior-design', 'design', 'sophisticated', 'minimalist', 'luxury'],
    featured: false,
    trendScore: 78,
  },

  // Juice Bar - Health Trend
  {
    id: 'logo-pure-press',
    type: 'logo',
    imageUrl: '/gallery/logos/pure-press.png',
    templateId: 'juice_bar',
    templateName: 'Juice Bar',
    brandName: 'Pure Press',
    brandVibe: 'Energetic health bar',
    industry: 'food_beverage',
    generationPrompt: 'Fresh modern juice bar logo with citrus fruit icon, bright orange lime green and yellow colors, vibrant and healthy',
    description: 'Vibrant juice bar logo with fresh appeal',
    tags: ['juice', 'health', 'fresh', 'modern', 'vibrant'],
    featured: false,
    trendScore: 83,
  },

  // Content Creator - Trending
  {
    id: 'logo-studio-frame',
    type: 'logo',
    imageUrl: '/gallery/logos/studio-frame.png',
    templateId: 'content_creator',
    templateName: 'Content Creator',
    brandName: 'Studio Frame',
    brandVibe: 'Personal YouTube/TikTok brand',
    industry: 'media_content',
    generationPrompt: 'Minimalist modern content creator logo with video frame icon, vibrant red and electric blue colors, bold and creative',
    description: 'Modern content creator brand logo',
    tags: ['content', 'creator', 'youtube', 'modern', 'bold', 'trending'],
    featured: false,
    trendScore: 91,
  },

  // ========== IMAGES (20-25 Items) ==========

  // Product Photo: Tech Gadget
  {
    id: 'img-earbuds',
    type: 'image',
    imageUrl: '/gallery/images/earbuds.png',
    templateId: 'product_photo',
    templateName: 'Product Photo',
    industry: 'technology',
    generationPrompt: 'Sleek white wireless earbuds on polished white marble surface, minimalist tech aesthetic, soft natural lighting, premium product photography',
    description: 'Tech product photography - wireless earbuds',
    tags: ['tech', 'product', 'minimalist', 'clean', 'gadget'],
    featured: true,
    trendScore: 90,
  },

  // Product Photo: Artisan Candle
  {
    id: 'img-candles',
    type: 'image',
    imageUrl: '/gallery/images/candles.png',
    templateId: 'product_photo',
    templateName: 'Product Photo',
    industry: 'home_goods',
    generationPrompt: 'Natural soy candles with dried flowers and botanical elements, rustic wood surface, warm soft lighting, handcrafted artisan aesthetic',
    description: 'Artisan candle product photography',
    tags: ['home', 'product', 'artisan', 'natural', 'handmade'],
    featured: true,
    trendScore: 84,
  },

  // Product Photo: Craft Beer
  {
    id: 'img-beer-bottles',
    type: 'image',
    imageUrl: '/gallery/images/beer-bottles.png',
    templateId: 'product_photo',
    templateName: 'Product Photo',
    industry: 'food_beverage',
    generationPrompt: 'Lineup of craft beer IPA bottles on rustic wood surface, brewery aesthetic, warm amber lighting, artisan craft beer photography',
    description: 'Craft beer product photography',
    tags: ['beer', 'product', 'brewery', 'artisan', 'rustic'],
    featured: true,
    trendScore: 82,
  },

  // Product Photo: Skincare Set
  {
    id: 'img-skincare-set',
    type: 'image',
    imageUrl: '/gallery/images/skincare-set.png',
    templateId: 'product_photo',
    templateName: 'Product Photo',
    industry: 'beauty_cosmetics',
    generationPrompt: 'Minimalist skincare bottles and serums on white marble stone, clinical clean beauty aesthetic, bright natural light, spa-like presentation',
    description: 'Clean beauty skincare photography',
    tags: ['skincare', 'beauty', 'product', 'clean', 'minimalist'],
    featured: true,
    trendScore: 88,
    differentiationNote: 'Different from Glow Skincare: Clinical clean aesthetic vs organic natural vibe',
  },

  // Product Photo: Pet Treats
  {
    id: 'img-pet-treats',
    type: 'image',
    imageUrl: '/gallery/images/pet-treats.png',
    templateId: 'product_photo',
    templateName: 'Product Photo',
    industry: 'pet_services',
    generationPrompt: 'Organic dog treats in glass jar on white background, natural pet wellness aesthetic, clean product photography, healthy pet food',
    description: 'Natural pet treats product photo',
    tags: ['pet', 'product', 'natural', 'wellness', 'treats'],
    featured: false,
    trendScore: 77,
  },

  // Hero Banner: Tech Office
  {
    id: 'img-tech-office',
    type: 'image',
    imageUrl: '/gallery/images/tech-office.png',
    templateId: 'hero_banner',
    templateName: 'Hero Banner',
    industry: 'technology',
    generationPrompt: 'Modern tech startup office with panoramic city skyline view, innovative collaborative workspace, morning natural light, professional and aspirational',
    description: 'Tech startup office hero banner',
    tags: ['tech', 'office', 'startup', 'hero', 'wide', 'modern'],
    featured: true,
    trendScore: 89,
  },

  // Hero Banner: Luxury Home
  {
    id: 'img-luxury-home',
    type: 'image',
    imageUrl: '/gallery/images/luxury-home.png',
    templateId: 'hero_banner',
    templateName: 'Hero Banner',
    industry: 'real_estate',
    generationPrompt: 'Modern luxury home exterior with architectural design, beautiful landscaping, golden hour lighting, upscale real estate photography',
    description: 'Luxury real estate hero banner',
    tags: ['real-estate', 'luxury', 'home', 'hero', 'wide', 'architecture'],
    featured: true,
    trendScore: 85,
  },

  // Hero Banner: Coworking Space
  {
    id: 'img-coworking',
    type: 'image',
    imageUrl: '/gallery/images/coworking.png',
    templateId: 'hero_banner',
    templateName: 'Hero Banner',
    industry: 'professional_services',
    generationPrompt: 'Creative coworking space with collaborative workspace, modern furniture, natural light, productive and inspiring environment',
    description: 'Coworking space hero banner',
    tags: ['coworking', 'workspace', 'professional', 'hero', 'wide', 'collaborative'],
    featured: false,
    trendScore: 81,
  },

  // Hero Banner: Beach Travel
  {
    id: 'img-beach-travel',
    type: 'image',
    imageUrl: '/gallery/images/beach-travel.png',
    templateId: 'hero_banner',
    templateName: 'Hero Banner',
    industry: 'travel_hospitality',
    generationPrompt: 'Stunning tropical beach at sunset, paradise destination, turquoise water and palm trees, wanderlust travel photography, golden hour',
    description: 'Travel destination hero banner',
    tags: ['travel', 'beach', 'paradise', 'hero', 'wide', 'wanderlust'],
    featured: false,
    trendScore: 83,
  },

  // Food Photography: Sushi
  {
    id: 'img-sushi',
    type: 'image',
    imageUrl: '/gallery/images/sushi.png',
    templateId: 'food_photo',
    templateName: 'Food Photography',
    industry: 'food_beverage',
    generationPrompt: 'Fresh sushi rolls elegantly arranged on black slate plate with chopsticks, Japanese restaurant presentation, dramatic side lighting, garnished with wasabi and ginger',
    description: 'Elegant sushi restaurant photography',
    tags: ['food', 'sushi', 'japanese', 'elegant', 'restaurant'],
    featured: true,
    trendScore: 88,
    differentiationNote: 'Different from Harvest Table: Elegant Asian fusion vs rustic farm-to-table',
  },

  // Food Photography: Gourmet Burger
  {
    id: 'img-burger',
    type: 'image',
    imageUrl: '/gallery/images/burger.png',
    templateId: 'food_photo',
    templateName: 'Food Photography',
    industry: 'food_beverage',
    generationPrompt: 'Gourmet burger with craft beer, gastropub aesthetic, rustic wood table, warm ambient lighting, casual upscale dining',
    description: 'Gastropub burger photography',
    tags: ['food', 'burger', 'gastropub', 'casual', 'dining'],
    featured: true,
    trendScore: 86,
  },

  // Food Photography: Smoothie Bowl
  {
    id: 'img-smoothie-bowl',
    type: 'image',
    imageUrl: '/gallery/images/smoothie-bowl.png',
    templateId: 'food_photo',
    templateName: 'Food Photography',
    industry: 'health_wellness',
    generationPrompt: 'Vibrant acai smoothie bowl topped with fresh berries granola and coconut, bright natural morning light, healthy breakfast, overhead flat lay',
    description: 'Health food smoothie bowl photography',
    tags: ['food', 'healthy', 'breakfast', 'fresh', 'wellness'],
    featured: false,
    trendScore: 84,
  },

  // Food Photography: Pastries
  {
    id: 'img-pastries',
    type: 'image',
    imageUrl: '/gallery/images/pastries.png',
    templateId: 'food_photo',
    templateName: 'Food Photography',
    industry: 'food_beverage',
    generationPrompt: 'Fresh croissants and French pastries on marble surface, patisserie bakery aesthetic, soft morning light, elegant bakery photography',
    description: 'French bakery pastries photography',
    tags: ['food', 'pastries', 'bakery', 'french', 'elegant'],
    featured: false,
    trendScore: 82,
  },

  // Behind-the-Scenes: Baker
  {
    id: 'img-baker-bts',
    type: 'image',
    imageUrl: '/gallery/images/baker-bts.png',
    templateId: 'behind_scenes',
    templateName: 'Behind-the-Scenes',
    industry: 'food_beverage',
    generationPrompt: 'Baker hands kneading fresh bread dough at dawn in artisan bakery kitchen, flour dust in air, warm golden morning light, authentic craftsmanship moment',
    description: 'Artisan baker behind-the-scenes',
    tags: ['bts', 'baker', 'artisan', 'authentic', 'bakery'],
    featured: true,
    trendScore: 80,
  },

  // Behind-the-Scenes: Potter
  {
    id: 'img-potter-bts',
    type: 'image',
    imageUrl: '/gallery/images/potter-bts.png',
    templateId: 'behind_scenes',
    templateName: 'Behind-the-Scenes',
    industry: 'arts_crafts',
    generationPrompt: 'Close-up of hands shaping wet clay on pottery wheel, artisan studio, natural window light, handmade craftsmanship, artistic process',
    description: 'Pottery artisan behind-the-scenes',
    tags: ['bts', 'pottery', 'artisan', 'handmade', 'crafts'],
    featured: false,
    trendScore: 76,
  },

  // Behind-the-Scenes: Podcast
  {
    id: 'img-podcast-bts',
    type: 'image',
    imageUrl: '/gallery/images/podcast-bts.png',
    templateId: 'behind_scenes',
    templateName: 'Behind-the-Scenes',
    industry: 'media_content',
    generationPrompt: 'Podcast hosts laughing during recording session, professional microphones and headphones, studio setup, authentic creative moment, media production',
    description: 'Podcast recording behind-the-scenes',
    tags: ['bts', 'podcast', 'media', 'authentic', 'creative'],
    featured: false,
    trendScore: 85,
  },

  // Quote Graphic: Motivational
  {
    id: 'img-quote-motivational',
    type: 'image',
    imageUrl: '/gallery/images/quote-motivational.png',
    templateId: 'quote_graphic',
    templateName: 'Quote Graphic',
    industry: 'general',
    generationPrompt: 'Motivational quote "Create your own path" with bold gradient typography, vibrant purple to pink gradient background, modern inspirational social media graphic',
    description: 'Motivational quote graphic',
    tags: ['quote', 'motivational', 'gradient', 'bold', 'inspirational'],
    featured: false,
    trendScore: 81,
  },

  // Quote Graphic: Business
  {
    id: 'img-quote-business',
    type: 'image',
    imageUrl: '/gallery/images/quote-business.png',
    templateId: 'quote_graphic',
    templateName: 'Quote Graphic',
    industry: 'professional_services',
    generationPrompt: 'Business quote "Innovation starts here" with minimalist corporate typography, clean professional design, neutral gray and blue tones, thought leadership',
    description: 'Professional business quote graphic',
    tags: ['quote', 'business', 'professional', 'minimalist', 'corporate'],
    featured: false,
    trendScore: 78,
  },

  // Quote Graphic: Wellness
  {
    id: 'img-quote-wellness',
    type: 'image',
    imageUrl: '/gallery/images/quote-wellness.png',
    templateId: 'quote_graphic',
    templateName: 'Quote Graphic',
    industry: 'health_wellness',
    generationPrompt: 'Wellness quote "Breathe. Be present." with natural organic textures, calming earth tones, botanical elements, peaceful mindfulness aesthetic',
    description: 'Wellness mindfulness quote graphic',
    tags: ['quote', 'wellness', 'mindfulness', 'natural', 'calm'],
    featured: false,
    trendScore: 83,
  },

  // Flat Lay: Coffee Setup
  {
    id: 'img-coffee-flatlay',
    type: 'image',
    imageUrl: '/gallery/images/coffee-flatlay.png',
    templateId: 'flat_lay',
    templateName: 'Flat Lay',
    industry: 'food_beverage',
    generationPrompt: 'Overhead flat lay of espresso coffee setup with beans, grinder, and brewing equipment on marble surface, modern coffee geek aesthetic, clean composition',
    description: 'Modern coffee setup flat lay',
    tags: ['flatlay', 'coffee', 'modern', 'overhead', 'minimal'],
    featured: false,
    trendScore: 79,
    differentiationNote: 'Different from Daily Grind showcase: Modern coffee geek setup vs cozy cafe atmosphere',
  },

  // Flat Lay: Workspace
  {
    id: 'img-workspace-flatlay',
    type: 'image',
    imageUrl: '/gallery/images/workspace-flatlay.png',
    templateId: 'flat_lay',
    templateName: 'Flat Lay',
    industry: 'professional_services',
    generationPrompt: 'Minimalist workspace flat lay with laptop, notebook, coffee, and plant on white desk, overhead view, clean productivity aesthetic, organized workspace',
    description: 'Minimalist workspace flat lay',
    tags: ['flatlay', 'workspace', 'productivity', 'minimalist', 'desk'],
    featured: false,
    trendScore: 80,
  },

  // Promotional: Flash Sale
  {
    id: 'img-flash-sale',
    type: 'image',
    imageUrl: '/gallery/images/flash-sale.png',
    templateId: 'promotional_badge',
    templateName: 'Promotional Badge',
    industry: 'ecommerce_retail',
    generationPrompt: 'Bold flash sale promotional graphic "50% OFF - 24 Hours Only", vibrant red and yellow colors, urgent e-commerce marketing design, attention-grabbing',
    description: 'Flash sale promotional graphic',
    tags: ['promo', 'sale', 'urgent', 'bold', 'ecommerce'],
    featured: false,
    trendScore: 75,
  },
];

// ========== HELPER FUNCTIONS ==========

/**
 * Get featured items for landing page carousel
 */
export function getFeaturedItems(count: number = 12): GalleryItem[] {
  return galleryItems
    .filter(item => item.featured)
    .sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0))
    .slice(0, count);
}

/**
 * Get items by type
 */
export function getItemsByType(type: 'logo' | 'image'): GalleryItem[] {
  return galleryItems.filter(item => item.type === type);
}

/**
 * Get items by industry
 */
export function getItemsByIndustry(industry: string): GalleryItem[] {
  return galleryItems.filter(item => item.industry === industry);
}

/**
 * Get items by template
 */
export function getItemsByTemplate(templateId: string): GalleryItem[] {
  return galleryItems.filter(item => item.templateId === templateId);
}

/**
 * Get items by tags
 */
export function getItemsByTags(tags: string[]): GalleryItem[] {
  return galleryItems.filter(item =>
    tags.some(tag => item.tags.includes(tag))
  );
}

/**
 * Get all unique industries
 */
export function getAllIndustries(): string[] {
  const industries = new Set(galleryItems.map(item => item.industry));
  return Array.from(industries).sort();
}

/**
 * Get all unique templates
 */
export function getAllTemplates(): Array<{ id: string; name: string }> {
  const templates = new Map<string, string>();
  galleryItems.forEach(item => {
    templates.set(item.templateId, item.templateName);
  });
  return Array.from(templates.entries()).map(([id, name]) => ({ id, name }));
}

/**
 * Get item by ID
 */
export function getItemById(id: string): GalleryItem | undefined {
  return galleryItems.find(item => item.id === id);
}

/**
 * Search items by query
 */
export function searchItems(query: string): GalleryItem[] {
  const lowerQuery = query.toLowerCase();
  return galleryItems.filter(
    item =>
      item.description.toLowerCase().includes(lowerQuery) ||
      item.templateName.toLowerCase().includes(lowerQuery) ||
      item.industry.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      item.brandName?.toLowerCase().includes(lowerQuery)
  );
}
