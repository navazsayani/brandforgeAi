/**
 * Fix Showcase Content Issues
 *
 * Fixes:
 * 1. Shorten captions to 150-200 chars
 * 2. Remove emojis from captions
 * 3. Vary hashtag counts (5-8)
 * 4. Regenerate Elevate Consulting images (remove hologram issue)
 * 5. Regenerate Bloom Beauty post-1 (remove text overlay)
 * 6. Improve basic logos if needed
 */

import { generateSocialMediaCaption } from '@/ai/flows/generate-social-media-caption';
import { generateImages } from '@/ai/flows/generate-images';
import { generateBrandLogo } from '@/ai/flows/generate-brand-logo-flow';
import fs from 'fs/promises';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Helper to download and save image
async function downloadImage(dataUri: string, outputPath: string) {
  const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(outputPath, buffer);
}

// Helper to shorten caption intelligently
function shortenCaption(caption: string): string {
  // Remove emojis
  caption = caption.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();

  // If already short enough, return
  if (caption.length <= 200) return caption;

  // Find first sentence or natural break point
  const sentences = caption.split(/[.!?]\s+/);
  if (sentences[0].length <= 200) {
    return sentences[0] + '.';
  }

  // Cut at last space before 180 chars and add ellipsis
  const cutPoint = caption.lastIndexOf(' ', 180);
  return caption.substring(0, cutPoint) + '...';
}

// Helper to vary hashtag count
function varyHashtags(hashtags: string, targetCount: number): string {
  const tags = hashtags.split(' ').filter(t => t.startsWith('#'));
  return tags.slice(0, targetCount).join(' ');
}

async function fixCaptions() {
  console.log('\n📝 Fixing captions...\n');

  const brands = [
    'daily-grind-coffee',
    'zen-flow-yoga',
    'elevate-consulting',
    'bloom-beauty',
    'artisan-table',
    'fitlife-performance',
    'chic-boutique',
    'glow-skincare'
  ];

  const hashtagCounts = [6, 7, 5, 6, 8, 7, 6, 5]; // Varied counts

  for (let i = 0; i < brands.length; i++) {
    const brandId = brands[i];
    console.log(`  Fixing ${brandId}...`);

    for (let postNum = 1; postNum <= 3; postNum++) {
      const dataPath = path.join(PUBLIC_DIR, 'showcase/examples', brandId, 'posts', `post-${postNum}-data.json`);
      const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

      // Shorten caption
      const originalLength = data.caption.length;
      data.caption = shortenCaption(data.caption);

      // Vary hashtags
      data.hashtags = varyHashtags(data.hashtags, hashtagCounts[i]);

      // Update previewProps too
      data.previewProps.caption = data.caption;
      data.previewProps.hashtags = data.hashtags;

      await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
      console.log(`    ✓ Post ${postNum}: ${originalLength} → ${data.caption.length} chars`);
    }
  }

  console.log('\n✅ Captions fixed!\n');
}

async function regenerateElevateConsultingImages() {
  console.log('\n🎨 Regenerating Elevate Consulting images (fixing hologram issue)...\n');

  const brandId = 'elevate-consulting';
  const brandName = 'Elevate Consulting';
  const description = 'Strategic business consulting firm helping startups and small businesses scale efficiently with proven growth strategies';

  // Updated style notes - REMOVED "charts and analytics dashboards" to avoid holograms
  const imageStyleNotes = 'Professional realistic business photography, modern office environments with natural lighting, real business meetings and authentic collaboration, professionals working on laptops, handshakes and partnerships, confident business conversations, clean office interiors, real people in professional attire, natural corporate settings, warm professional atmosphere, NO holograms, NO futuristic elements, photorealistic business scenes only';

  for (let i = 1; i <= 3; i++) {
    console.log(`  Generating post ${i}/3...`);

    const result = await generateImages({
      brandName,
      brandDescription: description,
      industry: 'professional_services',
      targetKeywords: 'business consulting, strategy, professional services',
      numberOfImages: 1,
      imageStyle: imageStyleNotes,
      aspectRatio: '1:1',
    });

    if (result.generatedImages && result.generatedImages.length > 0) {
      const imageDataOrUrl = result.generatedImages[0];
      const imagePath = path.join(PUBLIC_DIR, 'showcase/examples', brandId, 'posts', `post-${i}-image.png`);

      if (imageDataOrUrl.startsWith('data:')) {
        await downloadImage(imageDataOrUrl, imagePath);
      } else {
        const imageResponse = await fetch(imageDataOrUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        await fs.writeFile(imagePath, Buffer.from(imageBuffer));
      }

      console.log(`  ✓ Post ${i} image regenerated`);
    }
  }

  console.log('\n✅ Elevate Consulting images fixed!\n');
}

async function regenerateBloomBeautyPost1() {
  console.log('\n🎨 Regenerating Bloom Beauty post-1 (removing text overlay)...\n');

  const brandId = 'bloom-beauty';
  const brandName = 'Bloom Beauty Bar';
  const description = 'Luxury beauty salon specializing in transformative hair styling, precision nail artistry, and personalized beauty treatments';

  // Add explicit note: NO text overlays
  const imageStyleNotes = 'Glamorous sophisticated aesthetic, elegant salon interior with modern lighting, professional beauty treatments in action, hair styling process, luxurious textures, rose gold and blush pink accents, professional tools, client satisfaction moments, feminine elegant vibes, clean professional photos WITHOUT text overlays or captions';

  const result = await generateImages({
    brandName,
    brandDescription: description,
    industry: 'beauty_cosmetics',
    targetKeywords: 'beauty salon, hair salon, luxury beauty',
    numberOfImages: 1,
    imageStyle: imageStyleNotes,
    aspectRatio: '1:1',
  });

  if (result.generatedImages && result.generatedImages.length > 0) {
    const imageDataOrUrl = result.generatedImages[0];
    const imagePath = path.join(PUBLIC_DIR, 'showcase/examples', brandId, 'posts', 'post-1-image.png');

    if (imageDataOrUrl.startsWith('data:')) {
      await downloadImage(imageDataOrUrl, imagePath);
    } else {
      const imageResponse = await fetch(imageDataOrUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      await fs.writeFile(imagePath, Buffer.from(imageBuffer));
    }

    console.log('  ✓ Bloom Beauty post-1 image regenerated');
  }

  console.log('\n✅ Bloom Beauty fixed!\n');
}

async function regenerateElevateConsultingLogo() {
  console.log('\n🎨 Regenerating Elevate Consulting logo...\n');

  const logoResult = await generateBrandLogo({
    brandName: 'Elevate Consulting',
    brandDescription: 'Strategic business consulting firm helping startups scale',
    industry: 'professional_services',
    targetKeywords: 'business consulting, strategy, growth',
    logoType: 'logotype',
    logoShape: 'square',
    logoStyle: 'minimalist',
    logoColors: 'Corporate navy blue, professional gray, white',
    logoBackground: 'dark',
  });

  if (logoResult.base64Image) {
    const logoPath = path.join(PUBLIC_DIR, 'showcase/examples/elevate-consulting/logo.png');
    const buffer = Buffer.from(logoResult.base64Image, 'base64');
    await fs.writeFile(logoPath, buffer);
    console.log('  ✓ Logo regenerated');
  }

  console.log('\n✅ Elevate Consulting logo fixed!\n');
}

async function main() {
  console.log('🔧 Starting showcase content optimization...\n');

  try {
    // Step 1: Fix all captions (quick)
    await fixCaptions();

    // Step 2: Regenerate Elevate Consulting images (slow - 3 images)
    await regenerateElevateConsultingImages();

    // Step 3: Regenerate Bloom Beauty post-1 (1 image)
    await regenerateBloomBeautyPost1();

    // Step 4: Regenerate Elevate Consulting logo
    await regenerateElevateConsultingLogo();

    console.log('\n========================================');
    console.log('✅ Showcase Optimization Complete!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  }
}

main();
