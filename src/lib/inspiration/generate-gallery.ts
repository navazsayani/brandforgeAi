/**
 * Gallery Content Generation Script
 *
 * Generates logos and images for the Inspiration Gallery
 * Uses BrandForge AI flows to create real content
 *
 * Run with: npx tsx src/lib/inspiration/generate-gallery.ts
 * Test mode: npx tsx src/lib/inspiration/generate-gallery.ts --test
 */

import { generateBrandLogo } from '@/ai/flows/generate-brand-logo-flow';
import { generateImages } from '@/ai/flows/generate-images';
import fs from 'fs/promises';
import path from 'path';

// ========== GENERATION SPECIFICATIONS ==========

interface LogoSpec {
  type: 'logo';
  id: string;
  brandName: string;
  description: string;
  industry: string;
  logoStyle: string;
  logoType: string;
  logoShape?: string;
  logoColors: string;
  logoBackground?: string;
  tags: string[];
}

interface ImageSpec {
  type: 'image';
  id: string;
  templateId: string;
  industry: string;
  prompt: string;
  aspectRatio?: string;
  imageStyle?: string;
  tags: string[];
}

type GallerySpec = LogoSpec | ImageSpec;

const gallerySpecs: GallerySpec[] = [
  // ========== LOGOS (15 Items) ==========

  {
    type: 'logo',
    id: 'logo-wavelength',
    brandName: 'Wavelength',
    description: 'Modern podcast network producing engaging audio content across multiple genres with professional storytelling',
    industry: 'media_content',
    logoStyle: 'bold',
    logoType: 'logomark',
    logoShape: 'custom',
    logoColors: 'Deep purple, neon pink, black',
    tags: ['podcast', 'media', 'modern'],
  },

  {
    type: 'logo',
    id: 'logo-hops-barrel',
    brandName: 'Hops & Barrel',
    description: 'Craft brewery producing small-batch IPAs and ales with a rustic industrial taproom experience, featuring traditional brewing methods, local ingredients, and authentic vintage craftsmanship',
    industry: 'food_beverage',
    logoStyle: 'vintage',
    logoType: 'logomark',
    logoShape: 'circle',
    logoColors: 'Warm amber gold, rich copper brown, dark walnut, cream accents',
    logoBackground: 'Light cream background',
    tags: ['brewery', 'vintage', 'industrial'],
  },

  {
    type: 'logo',
    id: 'logo-cloudsync',
    brandName: 'CloudSync',
    description: 'Modern cloud-based collaboration platform helping teams work seamlessly across devices',
    industry: 'technology_saas',
    logoStyle: 'modern',
    logoType: 'logotype',
    logoShape: 'square',
    logoColors: 'Electric blue, purple gradient, white',
    tags: ['tech', 'saas', 'modern'],
  },

  {
    type: 'logo',
    id: 'logo-mindful',
    brandName: 'Mindful',
    description: 'Digital wellness app providing guided meditation and mindfulness exercises for busy professionals',
    industry: 'health_wellness',
    logoStyle: 'minimalist',
    logoType: 'logomark',
    logoShape: 'circle',
    logoColors: 'Soft lavender, calming blue, white',
    tags: ['wellness', 'app', 'meditation'],
  },

  {
    type: 'logo',
    id: 'logo-edge-barber',
    brandName: 'The Edge',
    description: 'Modern barbershop offering precision cuts and grooming services for the contemporary gentleman',
    industry: 'beauty_cosmetics',
    logoStyle: 'bold',
    logoType: 'logomark',
    logoShape: 'square',
    logoColors: 'Black, red, metallic silver',
    tags: ['barbershop', 'grooming', 'masculine'],
  },

  {
    type: 'logo',
    id: 'logo-sweet-alchemy',
    brandName: 'Sweet Alchemy',
    description: 'French-inspired patisserie creating exquisite pastries and desserts with artisan craftsmanship',
    industry: 'food_beverage',
    logoStyle: 'elegant',
    logoType: 'logomark',
    logoShape: 'custom',
    logoColors: 'Pastel pink, cream, gold',
    logoBackground: 'Light blush pink background',
    tags: ['bakery', 'patisserie', 'elegant'],
  },

  {
    type: 'logo',
    id: 'logo-core-grace',
    brandName: 'Core & Grace',
    description: 'Boutique pilates studio offering personalized sessions focused on strength, flexibility, and mindful movement',
    industry: 'health_wellness',
    logoStyle: 'elegant',
    logoType: 'logotype',
    logoShape: 'circle',
    logoColors: 'Soft rose, gold, white',
    tags: ['pilates', 'fitness', 'elegant'],
  },

  {
    type: 'logo',
    id: 'logo-urban-key',
    brandName: 'Urban Key',
    description: 'Luxury real estate agency specializing in premium urban properties and investment opportunities',
    industry: 'real_estate',
    logoStyle: 'modern',
    logoType: 'logomark',
    logoShape: 'hexagon',
    logoColors: 'Navy blue, gold, white',
    tags: ['real-estate', 'luxury', 'modern'],
  },

  {
    type: 'logo',
    id: 'logo-frame-light',
    brandName: 'Frame & Light',
    description: 'Professional photography studio specializing in commercial and portrait photography',
    industry: 'arts_entertainment',
    logoStyle: 'minimalist',
    logoType: 'logotype',
    logoShape: 'square',
    logoColors: 'Black, white, camera lens silver',
    tags: ['photography', 'creative', 'minimalist'],
  },

  {
    type: 'logo',
    id: 'logo-green-roots',
    brandName: 'Green Roots',
    description: 'Urban plant nursery offering curated selection of indoor plants and botanical accessories',
    industry: 'retail_ecommerce',
    logoStyle: 'organic',
    logoType: 'logomark',
    logoShape: 'circle',
    logoColors: 'Forest green, terracotta, sage',
    tags: ['plants', 'nursery', 'organic'],
  },

  {
    type: 'logo',
    id: 'logo-paws-co',
    brandName: 'Paws & Co',
    description: 'Premium modern pet care services including professional grooming, positive reinforcement training, and holistic wellness programs for beloved companion animals',
    industry: 'pet_services',
    logoStyle: 'playful',
    logoType: 'logomark',
    logoShape: 'circle',
    logoColors: 'Vibrant teal blue, warm coral pink, soft cream white',
    logoBackground: 'White background',
    tags: ['pet', 'grooming', 'playful'],
  },

  {
    type: 'logo',
    id: 'logo-luna-stone',
    brandName: 'Luna & Stone',
    description: 'Artisan jewelry designer creating handmade pieces with natural gemstones and precious metals',
    industry: 'fashion_apparel',
    logoStyle: 'elegant',
    logoType: 'logomark',
    logoShape: 'custom',
    logoColors: 'Rose gold, turquoise, cream',
    tags: ['jewelry', 'handmade', 'elegant'],
  },

  {
    type: 'logo',
    id: 'logo-canvas-form',
    brandName: 'Canvas & Form',
    description: 'High-end interior design studio transforming spaces with sophisticated and timeless aesthetics',
    industry: 'professional_services',
    logoStyle: 'minimalist',
    logoType: 'logotype',
    logoShape: 'square',
    logoColors: 'Charcoal, blush, gold',
    tags: ['interior-design', 'sophisticated', 'minimalist'],
  },

  {
    type: 'logo',
    id: 'logo-pure-press',
    brandName: 'Pure Press',
    description: 'Fresh juice bar serving cold-pressed juices and smoothie bowls made with organic ingredients',
    industry: 'food_beverage',
    logoStyle: 'modern',
    logoType: 'logomark',
    logoShape: 'circle',
    logoColors: 'Bright orange, lime green, yellow',
    tags: ['juice', 'health', 'fresh'],
  },

  {
    type: 'logo',
    id: 'logo-studio-frame',
    brandName: 'Studio Frame',
    description: 'Content creator brand producing engaging video content for YouTube and social media platforms',
    industry: 'media_content',
    logoStyle: 'bold',
    logoType: 'logotype',
    logoShape: 'square',
    logoColors: 'Vibrant red, electric blue, white',
    tags: ['content', 'creator', 'youtube'],
  },

  // ========== IMAGES (25 Items) ==========

  // Product Photos
  {
    type: 'image',
    id: 'img-earbuds',
    templateId: 'product_photo',
    industry: 'technology',
    prompt: 'Sleek white wireless earbuds on polished white marble surface, minimalist tech aesthetic, soft natural lighting, premium product photography',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['tech', 'product', 'minimalist'],
  },

  {
    type: 'image',
    id: 'img-candles',
    templateId: 'product_photo',
    industry: 'home_goods',
    prompt: 'Natural soy candles with dried flowers and botanical elements, rustic wood surface, warm soft lighting, handcrafted artisan aesthetic',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['home', 'product', 'artisan'],
  },

  {
    type: 'image',
    id: 'img-beer-bottles',
    templateId: 'product_photo',
    industry: 'food_beverage',
    prompt: 'Lineup of craft beer IPA bottles on rustic wood surface, brewery aesthetic, warm amber lighting, artisan craft beer photography',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['beer', 'product', 'brewery'],
  },

  {
    type: 'image',
    id: 'img-skincare-set',
    templateId: 'product_photo',
    industry: 'beauty_cosmetics',
    prompt: 'Minimalist skincare bottles and serums on white marble stone, clinical clean beauty aesthetic, bright natural light, spa-like presentation',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['skincare', 'beauty', 'product'],
  },

  {
    type: 'image',
    id: 'img-pet-treats',
    templateId: 'product_photo',
    industry: 'pet_services',
    prompt: 'Organic dog treats in glass jar on white background, natural pet wellness aesthetic, clean product photography, healthy pet food',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['pet', 'product', 'natural'],
  },

  {
    type: 'image',
    id: 'img-jewelry-rings',
    templateId: 'product_photo',
    industry: 'fashion_apparel',
    prompt: 'Handmade silver rings with gemstones on natural stone surface, artisan jewelry photography, soft natural lighting, elegant composition',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['jewelry', 'product', 'artisan'],
  },

  // Hero Banners
  {
    type: 'image',
    id: 'img-tech-office',
    templateId: 'hero_banner',
    industry: 'technology',
    prompt: 'Real modern tech startup office interior with software engineers working at standing desks with multiple monitors, large floor-to-ceiling windows showing city skyline, natural morning sunlight, sleek contemporary furniture, glass conference rooms, indoor plants, collaborative workspace, realistic professional photography, no holograms or futuristic sci-fi elements, authentic tech company office environment',
    aspectRatio: '16:9',
    imageStyle: 'photorealistic',
    tags: ['tech', 'office', 'startup'],
  },

  {
    type: 'image',
    id: 'img-luxury-home',
    templateId: 'hero_banner',
    industry: 'real_estate',
    prompt: 'Modern luxury home exterior with contemporary architectural design, beautiful landscaping, golden hour lighting, upscale real estate photography',
    aspectRatio: '16:9',
    imageStyle: 'photorealistic',
    tags: ['real-estate', 'luxury', 'home'],
  },

  {
    type: 'image',
    id: 'img-coworking',
    templateId: 'hero_banner',
    industry: 'professional_services',
    prompt: 'Creative coworking space with collaborative workspace, modern furniture, natural light, productive and inspiring environment',
    aspectRatio: '16:9',
    imageStyle: 'photorealistic',
    tags: ['coworking', 'workspace', 'professional'],
  },

  {
    type: 'image',
    id: 'img-beach-travel',
    templateId: 'hero_banner',
    industry: 'travel_hospitality',
    prompt: 'Stunning tropical beach at sunset, paradise destination, turquoise water and palm trees, wanderlust travel photography, golden hour',
    aspectRatio: '16:9',
    imageStyle: 'photorealistic',
    tags: ['travel', 'beach', 'paradise'],
  },

  {
    type: 'image',
    id: 'img-gym-interior',
    templateId: 'hero_banner',
    industry: 'health_wellness',
    prompt: 'Modern fitness gym interior with high-tech equipment, clean contemporary design, motivating atmosphere, professional fitness facility',
    aspectRatio: '16:9',
    imageStyle: 'photorealistic',
    tags: ['gym', 'fitness', 'modern'],
  },

  // Food Photography
  {
    type: 'image',
    id: 'img-sushi',
    templateId: 'food_photo',
    industry: 'food_beverage',
    prompt: 'Fresh sushi rolls elegantly arranged on black slate plate with chopsticks, Japanese restaurant presentation, dramatic side lighting, garnished with wasabi and ginger',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['food', 'sushi', 'japanese'],
  },

  {
    type: 'image',
    id: 'img-burger',
    templateId: 'food_photo',
    industry: 'food_beverage',
    prompt: 'Gourmet burger with craft beer, gastropub aesthetic, rustic wood table, warm ambient lighting, casual upscale dining presentation',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['food', 'burger', 'gastropub'],
  },

  {
    type: 'image',
    id: 'img-smoothie-bowl',
    templateId: 'food_photo',
    industry: 'health_wellness',
    prompt: 'Vibrant acai smoothie bowl topped with fresh berries granola and coconut, bright natural morning light, healthy breakfast, overhead flat lay',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['food', 'healthy', 'breakfast'],
  },

  {
    type: 'image',
    id: 'img-pastries',
    templateId: 'food_photo',
    industry: 'food_beverage',
    prompt: 'Fresh croissants and French pastries on marble surface, patisserie bakery aesthetic, soft morning light, elegant bakery photography',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['food', 'pastries', 'bakery'],
  },

  // Behind-the-Scenes
  {
    type: 'image',
    id: 'img-baker-bts',
    templateId: 'behind_scenes',
    industry: 'food_beverage',
    prompt: 'Baker hands kneading fresh bread dough at dawn in artisan bakery kitchen, flour dust in air, warm golden morning light, authentic craftsmanship moment',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['bts', 'baker', 'artisan'],
  },

  {
    type: 'image',
    id: 'img-potter-bts',
    templateId: 'behind_scenes',
    industry: 'arts_crafts',
    prompt: 'Close-up of hands shaping wet clay on pottery wheel, artisan studio, natural window light, handmade craftsmanship, artistic process',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['bts', 'pottery', 'artisan'],
  },

  {
    type: 'image',
    id: 'img-podcast-bts',
    templateId: 'behind_scenes',
    industry: 'media_content',
    prompt: 'Podcast hosts laughing during recording session, professional microphones and headphones, studio setup, authentic creative moment, media production',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['bts', 'podcast', 'media'],
  },

  // Quote Graphics
  {
    type: 'image',
    id: 'img-quote-motivational',
    templateId: 'quote_graphic',
    industry: 'general',
    prompt: 'Motivational quote "Create your own path" with bold gradient typography, vibrant purple to pink gradient background, modern inspirational social media graphic',
    aspectRatio: '1:1',
    imageStyle: 'minimalist',
    tags: ['quote', 'motivational', 'gradient'],
  },

  {
    type: 'image',
    id: 'img-quote-business',
    templateId: 'quote_graphic',
    industry: 'professional_services',
    prompt: 'Modern business quote graphic "Innovation starts here" with bold sophisticated sans-serif typography, elegant gradient background from deep navy blue to slate blue, subtle geometric accent lines and shapes, professional LinkedIn-style design, corporate thought leadership aesthetic, high-end marketing material quality',
    aspectRatio: '1:1',
    imageStyle: 'minimalist',
    tags: ['quote', 'business', 'professional'],
  },

  {
    type: 'image',
    id: 'img-quote-wellness',
    templateId: 'quote_graphic',
    industry: 'health_wellness',
    prompt: 'Wellness quote "Breathe. Be present." with natural organic textures, calming earth tones, botanical elements, peaceful mindfulness aesthetic',
    aspectRatio: '1:1',
    imageStyle: 'minimalist',
    tags: ['quote', 'wellness', 'mindfulness'],
  },

  // Flat Lays
  {
    type: 'image',
    id: 'img-coffee-flatlay',
    templateId: 'flat_lay',
    industry: 'food_beverage',
    prompt: 'Overhead flat lay of espresso coffee setup with beans, grinder, and brewing equipment on marble surface, modern coffee geek aesthetic, clean composition',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['flatlay', 'coffee', 'modern'],
  },

  {
    type: 'image',
    id: 'img-workspace-flatlay',
    templateId: 'flat_lay',
    industry: 'professional_services',
    prompt: 'Overhead flat lay of minimalist workspace with one open laptop computer displaying blank screen, closed spiral notebook with pen, white coffee mug, small succulent plant, wireless mouse, all arranged neatly on clean white desk surface, professional photography, organized composition, top-down view',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['flatlay', 'workspace', 'productivity'],
  },

  {
    type: 'image',
    id: 'img-skincare-flatlay',
    templateId: 'flat_lay',
    industry: 'beauty_cosmetics',
    prompt: 'Skincare routine flat lay with bottles and serums on marble surface, morning beauty ritual aesthetic, clean and organized composition',
    aspectRatio: '1:1',
    imageStyle: 'photorealistic',
    tags: ['flatlay', 'skincare', 'beauty'],
  },

  // Promotional
  {
    type: 'image',
    id: 'img-flash-sale',
    templateId: 'promotional_badge',
    industry: 'ecommerce_retail',
    prompt: 'Bold flash sale promotional graphic "50% OFF - 24 Hours Only", vibrant red and yellow colors, urgent e-commerce marketing design, attention-grabbing',
    aspectRatio: '1:1',
    imageStyle: 'vibrant',
    tags: ['promo', 'sale', 'urgent'],
  },

  {
    type: 'image',
    id: 'img-grand-opening',
    templateId: 'promotional_badge',
    industry: 'general',
    prompt: 'Celebratory grand opening promotional graphic "Now Open - Join Us!", festive colors, welcoming community-focused design, invitation aesthetic',
    aspectRatio: '1:1',
    imageStyle: 'vibrant',
    tags: ['promo', 'opening', 'celebration'],
  },
];

// ========== HELPER FUNCTIONS ==========

async function ensureDirectory(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function downloadImage(dataUri: string, filePath: string) {
  // Convert data URI to buffer and save
  const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(filePath, buffer);
}

// ========== MAIN GENERATION FUNCTION ==========

async function generateGalleryContent(testMode = false) {
  console.log('🎨 Starting Gallery Content Generation...\n');

  // In test mode, only generate first 3 items
  const specsToGenerate = testMode ? gallerySpecs.slice(0, 3) : gallerySpecs;

  console.log(`Generating ${specsToGenerate.length} items${testMode ? ' (TEST MODE)' : ''}\n`);

  const publicDir = path.join(process.cwd(), 'public/gallery');
  await ensureDirectory(path.join(publicDir, 'logos'));
  await ensureDirectory(path.join(publicDir, 'images'));

  let successCount = 0;
  let failureCount = 0;

  for (const spec of specsToGenerate) {
    try {
      console.log(`\n📦 Generating: ${spec.id}`);

      if (spec.type === 'logo') {
        // Generate logo
        console.log(`  🎨 Logo: ${spec.brandName}`);

        // Determine background enum
        let backgroundEnum: 'white' | 'light' | 'transparent' | 'dark' = 'white';
        if (spec.logoBackground) {
          const bgLower = spec.logoBackground.toLowerCase();
          if (bgLower.includes('light') || bgLower.includes('cream') || bgLower.includes('blush')) {
            backgroundEnum = 'light';
          }
        }

        const result = await generateBrandLogo({
          brandName: spec.brandName,
          brandDescription: spec.description,
          industry: spec.industry as any,
          targetKeywords: spec.tags.join(', '),
          logoType: spec.logoType as any,
          logoShape: (spec.logoShape as any) || 'custom',
          logoStyle: spec.logoStyle as any,
          logoColors: spec.logoColors,
          logoBackground: backgroundEnum,
        });

        const logoPath = path.join(publicDir, 'logos', `${spec.id.replace('logo-', '')}.png`);
        await downloadImage(result.logoDataUri, logoPath);
        console.log(`  ✓ Saved: /gallery/logos/${spec.id.replace('logo-', '')}.png`);
        successCount++;

      } else {
        // Generate image
        console.log(`  🖼️  Image: ${spec.templateId}`);

        const result = await generateImages({
          brandDescription: spec.prompt,
          industry: spec.industry as any,
          imageStyle: spec.imageStyle || 'photorealistic',
          aspectRatio: spec.aspectRatio || '1:1',
          numberOfImages: 1,
          provider: 'AUTO',
        });

        if (result.generatedImages && result.generatedImages.length > 0) {
          const imageDataOrUrl = result.generatedImages[0];
          const imagePath = path.join(publicDir, 'images', `${spec.id.replace('img-', '')}.png`);

          if (imageDataOrUrl.startsWith('data:')) {
            await downloadImage(imageDataOrUrl, imagePath);
          } else {
            const imageResponse = await fetch(imageDataOrUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            await fs.writeFile(imagePath, Buffer.from(imageBuffer));
          }

          console.log(`  ✓ Saved: /gallery/images/${spec.id.replace('img-', '')}.png`);
          successCount++;
        } else {
          console.log(`  ✗ No image generated`);
          failureCount++;
        }
      }

    } catch (error) {
      console.error(`  ✗ Failed: ${error}`);
      failureCount++;
    }
  }

  console.log(`\n\n========================================`);
  console.log(`✅ Gallery Generation Complete!`);
  console.log(`========================================\n`);
  console.log(`Total items: ${specsToGenerate.length}`);
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Failures: ${failureCount}`);
  console.log(`\nSaved to: /public/gallery/`);
}

// Run if called directly
if (require.main === module) {
  const isTestMode = process.argv.includes('--test');

  generateGalleryContent(isTestMode)
    .then(() => {
      console.log('\n✨ All done!');
      if (isTestMode) {
        console.log('\n💡 Test successful! Run without --test to generate all items:');
        console.log('   npx tsx src/lib/inspiration/generate-gallery.ts\n');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Generation failed:', error);
      console.error(error);
      process.exit(1);
    });
}

export { generateGalleryContent, gallerySpecs };
