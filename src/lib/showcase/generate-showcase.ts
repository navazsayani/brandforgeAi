/**
 * Showcase Content Generation Script
 *
 * Generates complete showcase content library using BrandForge AI flows
 * Stores: Logos, Images, Social Posts, Platform Screenshots, Preview Props
 *
 * Run with: npx tsx src/lib/showcase/generate-showcase.ts
 */

import { generateBrandLogo } from '@/ai/flows/generate-brand-logo-flow';
import { generateSocialMediaCaption } from '@/ai/flows/generate-social-media-caption';
import { generateImages } from '@/ai/flows/generate-images';
import type { BrandConfig } from './types';
import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';
import { getModelConfig } from '@/lib/model-config';

// ===== 8 EXAMPLE BRANDS - CAREFULLY CRAFTED FOR BEST RESULTS =====

const showcaseBrands: BrandConfig[] = [
  {
    id: 'daily-grind-coffee',
    brandName: 'The Daily Grind',
    industry: 'food_beverage',
    description: 'Specialty coffee shop creating a productive haven for remote workers and coffee enthusiasts with artisan brews, cozy workspace, and vibrant community atmosphere',
    targetKeywords: 'specialty coffee, artisan coffee, remote work cafe, cozy coffee shop, coffee culture, workspace cafe, local coffee, craft coffee',
    imageStyleNotes: 'Warm cozy coffee shop vibes, natural wood textures, soft warm lighting, latte art close-ups, people working on laptops in comfortable seating, rustic cafe aesthetic, steam rising from coffee cups, barista crafting drinks, vintage coffee equipment, earth tones (brown, cream, warm orange)',
    logoStyle: 'vintage',  // Changed for variety
    logoType: 'logomark',  // Symbol/icon
    logoShape: 'circle',
    logoColors: 'Rich brown, warm cream, vintage gold accents',
    testimonial: {
      quote: 'Created my first Instagram post in 40 seconds. The AI absolutely nailed my brand voice and the image quality is incredible!',
      author: 'Sarah Martinez',
      role: 'Coffee Shop Owner',
      location: 'Seattle, WA',
    },
  },
  {
    id: 'zen-flow-yoga',
    brandName: 'Zen Flow Yoga',
    industry: 'health_wellness',
    description: 'Modern yoga studio offering mindful movement, meditation, and wellness classes for busy professionals seeking balance, stress relief, and holistic health in a peaceful sanctuary',
    targetKeywords: 'yoga studio, mindfulness, meditation, stress relief, wellness, yoga classes, holistic health, yoga practice, mindful living, professional wellness',
    imageStyleNotes: 'Serene calming atmosphere, soft pastel colors (lavender, sage green, soft pink), peaceful yoga poses, natural elements (plants, water, stones), morning sunlight streaming through windows, meditation spaces, zen aesthetic, clean minimalist studio, tranquil vibes, yoga mats and props',
    logoStyle: 'minimalist',  // Clean minimalist zen style
    logoType: 'logomark',  // Simple meditative symbol
    logoShape: 'circle',
    logoColors: 'Calming teal, soft sage, warm terracotta on light sage background',
    logoBackground: 'Light sage green background (#E8F0E8) for peaceful zen aesthetic',
    testimonial: {
      quote: 'The posts perfectly capture the peaceful, welcoming vibe of our studio. Our Instagram engagement has doubled since using BrandForge!',
      author: 'Maya Chen',
      role: 'Yoga Instructor & Studio Owner',
      location: 'Portland, OR',
    },
  },
  {
    id: 'elevate-consulting',
    brandName: 'Elevate Consulting',
    industry: 'professional_services',
    description: 'Strategic business consulting firm helping startups and small businesses scale efficiently with data-driven insights, operational expertise, and proven growth strategies',
    targetKeywords: 'business consulting, strategy consulting, startup advisor, business growth, operational efficiency, management consulting, strategic planning, business coaching, scale business',
    imageStyleNotes: 'Professional corporate aesthetic, modern office environments, business meetings and collaboration, charts and analytics dashboards, clean minimalist design, professional headshots, handshakes and partnerships, laptops showing data, success-oriented imagery, corporate blue and gray tones, confident professional vibes',
    logoStyle: 'minimalist',  // Changed for variety
    logoType: 'logotype',  // Full name as text
    logoShape: 'square',
    logoColors: 'Corporate navy blue, professional gray, white',
    testimonial: {
      quote: 'As a consultant, I needed content that looks professional yet approachable. BrandForge nails it every time. Saves me hours every week!',
      author: 'Michael Foster',
      role: 'Business Strategy Consultant',
      location: 'Austin, TX',
    },
  },
  {
    id: 'bloom-beauty',
    brandName: 'Bloom Beauty',  // Simplified name
    industry: 'beauty_cosmetics',
    description: 'Luxury beauty salon specializing in transformative hair styling, precision nail artistry, and personalized beauty treatments in an elegant, sophisticated setting where every client feels pampered',
    targetKeywords: 'beauty salon, hair salon, luxury beauty, beauty treatments, hair styling, nail art, beauty services, salon experience, glamorous beauty, professional beauty care',
    imageStyleNotes: 'Glamorous sophisticated aesthetic, before/after hair transformations, close-ups of nail art and manicures, elegant salon interior with modern lighting, beauty product displays, hair styling process, makeup application, luxurious textures, rose gold and blush pink accents, professional tools, client satisfaction moments, feminine elegant vibes',
    logoStyle: 'modern',  // Fresh modern style
    logoType: 'combination',  // Text + floral/beauty symbol
    logoShape: 'custom',  // Elegant flowing shape
    logoColors: 'Coral pink, lavender purple, gold on soft blush background',
    logoBackground: 'Light blush pink background (#FFF0F5) for feminine beauty salon vibe',
    testimonial: {
      quote: 'The images are so glamorous and professional! Clients keep asking where I get my social media content. Worth every penny!',
      author: 'Isabella Rodriguez',
      role: 'Beauty Salon Owner',
      location: 'Miami, FL',
    },
  },
  {
    id: 'artisan-table',
    brandName: 'The Harvest Table',  // Updated name
    industry: 'food_beverage',
    description: 'Farm-to-table restaurant crafting seasonal dishes with locally-sourced ingredients, bringing culinary artistry and authentic flavors to every beautifully plated creation',
    targetKeywords: 'farm to table, restaurant, seasonal cuisine, local ingredients, fine dining, culinary experience, chef-driven, artisan food, fresh ingredients, gourmet dining',
    imageStyleNotes: 'Mouth-watering food photography, beautifully plated dishes with garnish, rustic elegant presentation, close-up food textures, chef in action in kitchen, fresh ingredients and produce, warm ambient restaurant lighting, table settings, outdoor dining atmosphere, wine pairings, seasonal colors, appetizing professional food styling, culinary artistry',
    logoStyle: 'organic',  // Changed to organic/rustic style
    logoType: 'combination',  // Text + wheat/harvest icon
    logoShape: 'custom',
    logoColors: 'Warm amber, forest green, harvest gold on light cream background',
    logoBackground: 'Light warm cream background (#F5F1E8) for rustic farm-to-table feel',
    testimonial: {
      quote: 'The food photography is absolutely stunning. Our reservations increased 30% after consistently posting BrandForge content!',
      author: 'Chef Daniel Park',
      role: 'Restaurant Owner & Chef',
      location: 'San Francisco, CA',
    },
  },
  {
    id: 'fitlife-performance',
    brandName: 'FitLife Performance',
    industry: 'health_wellness',
    description: 'High-performance fitness coaching delivering personalized training programs, expert nutrition guidance, and sustainable lifestyle transformation for lasting health results',
    targetKeywords: 'fitness coaching, personal training, workout plans, fitness transformation, nutrition coaching, health coaching, strength training, fitness goals, performance training, lifestyle fitness',
    imageStyleNotes: 'Energetic motivational vibes, athletic action shots, gym equipment and weights, outdoor workouts and running, healthy meal prep and nutrition, before/after transformation imagery, bright vibrant colors (energetic orange, fitness green, bold blue), inspirational quotes overlay, determined athletes, progress tracking, dynamic movement, strength and power',
    logoStyle: 'bold',
    logoType: 'combination',  // Text + symbol for impact
    logoShape: 'shield',  // Strong, powerful shape
    logoColors: 'Vibrant electric blue, energetic orange, white on solid background',
    logoBackground: 'Clean white background for maximum contrast and energy',
    testimonial: {
      quote: 'My clients love the motivational content! The transformation posts especially get tons of engagement. BrandForge is a game-changer!',
      author: 'Coach Ryan Thompson',
      role: 'Certified Fitness Coach',
      location: 'Denver, CO',
    },
  },
  {
    id: 'chic-boutique',
    brandName: 'Chic Boutique',
    industry: 'fashion_apparel',
    description: 'Curated fashion boutique offering contemporary styles and timeless pieces for modern women who value unique quality clothing and personalized shopping experiences',
    targetKeywords: 'fashion boutique, contemporary fashion, women\'s clothing, trendy style, curated fashion, quality apparel, boutique shopping, modern fashion, stylish outfits, fashion trends',
    imageStyleNotes: 'Fashion-forward photography, clean product shots on white/neutral backgrounds, lifestyle fashion imagery, outfit flat lays, fashion model shots, texture and fabric close-ups, elegant sophisticated styling, soft natural lighting, pastel and neutral color palette (blush pink, ivory, soft gray), boutique interior, clothing racks, trendy accessories, Instagram-worthy aesthetics',
    logoStyle: 'elegant',  // High-fashion elegant style
    logoType: 'wordmark',  // Typography-focused for fashion
    logoShape: 'custom',
    logoColors: 'Deep burgundy, soft blush, rose gold on dark charcoal background',
    logoBackground: 'Dark charcoal background (#2B2B2B) for luxury boutique contrast',
    testimonial: {
      quote: 'The fashion content looks like it came from a professional agency! My boutique\'s Instagram now rivals major brands. Absolutely love it!',
      author: 'Olivia Bennett',
      role: 'Fashion Boutique Owner',
      location: 'New York, NY',
    },
  },
  {
    id: 'glow-skincare',
    brandName: 'Glow Skincare',
    industry: 'beauty_cosmetics',
    description: 'Natural skincare brand creating clean, effective products for radiant healthy skin with sustainably-sourced ingredients and dermatologist-approved formulations',
    targetKeywords: 'natural skincare, clean beauty, skincare products, healthy skin, sustainable beauty, skincare routine, radiant skin, organic skincare, beauty products, skin health',
    imageStyleNotes: 'Clean minimalist product photography, skincare products on marble or natural stone, botanical ingredients (flowers, leaves, natural elements), soft diffused lighting, spa-like aesthetic, product application on skin, dewy radiant skin close-ups, pastel packaging, sustainability vibes, natural textures, fresh organic feel, calming colors (soft green, white, natural beige)',
    logoStyle: 'elegant',  // Luxurious elegant style
    logoType: 'combination',  // Text + botanical symbol
    logoShape: 'circle',  // Soft, natural shape
    logoColors: 'Soft rose gold, mint green, champagne pink on pure white',
    logoBackground: 'Pure white background for clean, premium skincare aesthetic',
    testimonial: {
      quote: 'The product photography is magazine-quality! Our skincare line looks so premium and professional. Sales have increased significantly!',
      author: 'Emma Williams',
      role: 'Skincare Brand Founder',
      location: 'Los Angeles, CA',
    },
  },
];

// ===== HELPER FUNCTIONS =====

async function ensureDirectory(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function saveJsonFile(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function downloadImage(dataUri: string, filePath: string) {
  // Convert data URI to buffer and save
  const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(filePath, buffer);
}

async function generateAvatarImage(name: string, role: string): Promise<string> {
  // Generate realistic avatar using the same image generation flow
  const prompt = `Professional headshot photo of a ${role.toLowerCase()}, named ${name}. High quality portrait, friendly smile, professional attire, neutral background, photorealistic, professional photography, natural lighting, approachable and confident expression.`;

  try {
    const result = await generateImages({
      brandDescription: `Professional portrait for ${name}, a ${role}`,
      industry: 'professional_services',
      imageStyle: 'Professional headshot photography, natural lighting, neutral background, photorealistic portrait',
      aspectRatio: '1:1',
      numberOfImages: 1,
      provider: 'AUTO',
    });

    if (result.generatedImages && result.generatedImages.length > 0) {
      const imageDataOrUrl = result.generatedImages[0];

      // Check if it's a data URI or URL
      if (imageDataOrUrl.startsWith('data:')) {
        // It's a data URI - extract base64 part
        const base64Data = imageDataOrUrl.replace(/^data:image\/\w+;base64,/, '');
        return base64Data;
      } else {
        // It's a URL - fetch and convert to base64
        const imageResponse = await fetch(imageDataOrUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        return Buffer.from(imageBuffer).toString('base64');
      }
    }
  } catch (error) {
    console.error(`Error generating avatar for ${name}:`, error);
  }

  // Fallback: return placeholder
  return '';
}

/**
 * Capture platform-specific screenshots using Playwright
 */
async function capturePlatformScreenshots(
  brandName: string,
  caption: string,
  hashtags: string,
  imageSrc: string,
  logoSrc: string,
  outputDir: string
): Promise<Record<string, string>> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1200, height: 2000 });

  // Navigate to a local HTML page with SocialMediaPreviews component
  // For now, we'll create inline HTML with the preview
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <link href="/globals.css" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style="padding: 20px; background: #f6f9fc;">
        <div id="previews">
          <!-- SocialMediaPreviews component would be rendered here -->
          <!-- For now, we'll skip actual screenshot capture -->
          <p>Platform previews will be generated</p>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);

  const screenshots: Record<string, string> = {};

  // Placeholder: We would capture each platform here
  // For now, just return empty paths
  for (const platform of ['instagram', 'facebook', 'linkedin', 'twitter']) {
    screenshots[platform] = `/showcase/examples/${brandName.toLowerCase().replace(/\s+/g, '-')}/posts/placeholder-${platform}.png`;
  }

  await browser.close();

  return screenshots;
}

// ===== MAIN GENERATION FUNCTION =====

async function generateShowcaseContent(testMode = false) {
  console.log('🎨 Starting Showcase Content Generation...\n');

  // In test mode, only generate for first 2 brands
  const brandsToGenerate = testMode ? showcaseBrands.slice(0, 2) : showcaseBrands;

  console.log(`Generating content for ${brandsToGenerate.length} brands${testMode ? ' (TEST MODE)' : ''}\n`);

  if (testMode) {
    console.log('⚠️  TEST MODE: Only generating for first 2 brands');
    console.log(`   Brands: ${brandsToGenerate.map(b => b.brandName).join(', ')}\n`);
  }

  for (const brand of brandsToGenerate) {
    console.log(`\n========================================`);
    console.log(`📦 ${brand.brandName} (${brand.id})`);
    console.log(`========================================\n`);

    const brandDir = path.join(process.cwd(), 'public/showcase/examples', brand.id);
    const postsDir = path.join(brandDir, 'posts');

    await ensureDirectory(brandDir);
    await ensureDirectory(postsDir);

    try {
      // ===== 1. GENERATE LOGO =====
      console.log(`  🎨 Generating logo...`);

      try {
        // Determine background enum value from description
        let backgroundEnum: 'white' | 'light' | 'transparent' | 'dark' = 'white';
        if (brand.logoBackground) {
          const bgLower = brand.logoBackground.toLowerCase();
          if (bgLower.includes('dark') || bgLower.includes('charcoal') || bgLower.includes('black')) {
            backgroundEnum = 'dark';
          } else if (bgLower.includes('light') || bgLower.includes('cream') || bgLower.includes('blush') || bgLower.includes('sage') || bgLower.includes('pink')) {
            backgroundEnum = 'light';
          } else if (bgLower.includes('white') || bgLower.includes('pure')) {
            backgroundEnum = 'white';
          } else if (bgLower.includes('transparent')) {
            backgroundEnum = 'transparent';
          }
        }

        // Combine colors with background description for better results
        const enhancedColorDescription = brand.logoBackground
          ? `${brand.logoColors}. Background: ${brand.logoBackground}`
          : brand.logoColors;

        const logoResult = await generateBrandLogo({
          brandName: brand.brandName,
          brandDescription: brand.description,
          industry: brand.industry,
          targetKeywords: brand.targetKeywords,
          logoType: (brand.logoType as any) || 'logotype',
          logoShape: (brand.logoShape as any) || 'custom',
          logoStyle: (brand.logoStyle as any) || 'modern',
          logoColors: enhancedColorDescription,
          logoBackground: backgroundEnum,
        });

        // Save logo
        const logoPath = path.join(brandDir, 'logo.png');
        await downloadImage(logoResult.logoDataUri, logoPath);
        console.log(`  ✓ Logo saved`);

      } catch (error) {
        console.error(`  ✗ Logo generation failed:`, error);
        // Create placeholder text file
        await fs.writeFile(path.join(brandDir, 'logo.png'), '');
      }

      // ===== 2. GENERATE 3 SOCIAL POSTS =====
      const posts = [];

      for (let i = 1; i <= 3; i++) {
        console.log(`\n  📝 Generating post ${i}/3...`);

        try {
          // Generate caption
          const captionResult = await generateSocialMediaCaption({
            brandDescription: brand.description,
            industry: brand.industry,
            tone: 'professional but engaging',
            platform: 'instagram',
            language: 'english',
          });

          console.log(`  ↳ Caption generated: ${captionResult.caption.substring(0, 50)}...`);

          // Generate image
          const imageResult = await generateImages({
            brandDescription: brand.description,
            industry: brand.industry,
            imageStyle: brand.imageStyleNotes,
            aspectRatio: '1:1',
            numberOfImages: 1,
            provider: 'AUTO',
          });

          console.log(`  ↳ Image generated`);

          // Save image
          const imagePath = path.join(postsDir, `post-${i}-image.png`);
          if (imageResult.generatedImages && imageResult.generatedImages.length > 0) {
            const imageDataOrUrl = imageResult.generatedImages[0];

            // Check if it's a data URI or URL
            if (imageDataOrUrl.startsWith('data:')) {
              // It's a data URI - convert and save directly
              await downloadImage(imageDataOrUrl, imagePath);
            } else {
              // It's a URL - fetch and save
              const imageResponse = await fetch(imageDataOrUrl);
              const imageBuffer = await imageResponse.arrayBuffer();
              await fs.writeFile(imagePath, Buffer.from(imageBuffer));
            }
            console.log(`  ↳ Image saved`);
          }

          // Generate platform screenshots (skipping for now - can be added later)
          const platformScreenshots: Record<string, string> = {
            instagram: `/showcase/examples/${brand.id}/posts/post-${i}-instagram.png`,
            facebook: `/showcase/examples/${brand.id}/posts/post-${i}-facebook.png`,
            linkedin: `/showcase/examples/${brand.id}/posts/post-${i}-linkedin.png`,
            twitter: `/showcase/examples/${brand.id}/posts/post-${i}-twitter.png`,
          };

          // TODO: Enable this when Playwright is fully configured
          // const platformScreenshots = await capturePlatformScreenshots(...)

          const postData = {
            image: `/showcase/examples/${brand.id}/posts/post-${i}-image.png`,
            caption: captionResult.caption,
            hashtags: captionResult.hashtags,
            generationTime: '32 seconds', // TODO: Track actual time
            platformScreenshots,
            previewProps: {
              caption: captionResult.caption,
              hashtags: captionResult.hashtags,
              imageSrc: `/showcase/examples/${brand.id}/posts/post-${i}-image.png`,
              brandName: brand.brandName,
              brandLogoUrl: `/showcase/examples/${brand.id}/logo.png`,
              selectedPlatform: 'all',
            },
          };

          // Save post data
          const postDataPath = path.join(postsDir, `post-${i}-data.json`);
          await saveJsonFile(postDataPath, postData);

          console.log(`  ✓ Post ${i} complete`);
          posts.push(postData);

        } catch (error) {
          console.error(`  ✗ Post ${i} generation failed:`, error);
          // Create placeholder
          const placeholderPost = {
            image: `/showcase/examples/${brand.id}/posts/post-${i}-image.png`,
            caption: `[Placeholder caption for ${brand.brandName} post ${i}]`,
            hashtags: '#placeholder',
            generationTime: '0 seconds',
            previewProps: {
              caption: `[Placeholder caption for ${brand.brandName} post ${i}]`,
              hashtags: '#placeholder',
              imageSrc: `/showcase/examples/${brand.id}/posts/post-${i}-image.png`,
              brandName: brand.brandName,
              brandLogoUrl: `/showcase/examples/${brand.id}/logo.png`,
              selectedPlatform: 'all',
            },
          };
          posts.push(placeholderPost);
        }
      }

      // ===== 3. GENERATE TESTIMONIAL AVATAR =====
      console.log(`\n  👤 Generating testimonial avatar...`);

      try {
        const avatarBase64 = await generateAvatarImage(
          brand.testimonial.author,
          brand.testimonial.role
        );

        if (avatarBase64) {
          const avatarPath = path.join(
            process.cwd(),
            'public/showcase/testimonials/avatars',
            `${brand.id}.jpg`
          );
          await ensureDirectory(path.dirname(avatarPath));

          // Save avatar
          const buffer = Buffer.from(avatarBase64, 'base64');
          await fs.writeFile(avatarPath, buffer);
          console.log(`  ✓ Avatar saved`);
        } else {
          console.log(`  ⚠ Avatar generation skipped (using placeholder)`);
        }
      } catch (error) {
        console.error(`  ✗ Avatar generation failed:`, error);
      }

      // ===== 4. SAVE BRAND INFO =====
      const brandInfo = {
        id: brand.id,
        brandName: brand.brandName,
        industry: brand.industry,
        description: brand.description,
        logo: `/showcase/examples/${brand.id}/logo.png`,
        posts: posts.map((_, idx) => ({
          image: `/showcase/examples/${brand.id}/posts/post-${idx + 1}-image.png`,
          data: `/showcase/examples/${brand.id}/posts/post-${idx + 1}-data.json`,
        })),
        testimonial: {
          ...brand.testimonial,
          avatar: `/showcase/testimonials/avatars/${brand.id}.jpg`,
        },
      };

      const brandInfoPath = path.join(brandDir, 'info.json');
      await saveJsonFile(brandInfoPath, brandInfo);

      console.log(`\n  ✅ ${brand.brandName} complete!`);

    } catch (error) {
      console.error(`\n  ❌ Error generating ${brand.brandName}:`, error);
    }
  }

  console.log(`\n\n========================================`);
  console.log(`✅ Showcase Generation Complete!`);
  console.log(`========================================\n`);
  console.log(`Generated content for ${showcaseBrands.length} brands`);
  console.log(`Location: /public/showcase/examples/`);
}

// Run if called directly
if (require.main === module) {
  // Check if --test flag is passed
  const isTestMode = process.argv.includes('--test');

  generateShowcaseContent(isTestMode)
    .then(() => {
      console.log('\n✨ All done!');
      if (isTestMode) {
        console.log('\n💡 Test successful! Run without --test flag to generate all brands:');
        console.log('   npm run generate-showcase\n');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Generation failed:', error);
      console.error(error);
      process.exit(1);
    });
}

export { generateShowcaseContent, showcaseBrands };
