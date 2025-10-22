/**
 * Script to regenerate ONLY logos for specific showcase brands
 * Run with: npx tsx regenerate-logos-only.ts
 */

import { generateBrandLogo } from './src/ai/flows/generate-brand-logo-flow';
import fs from 'fs/promises';
import path from 'path';

// Brands to regenerate logos for
const brandsToUpdate = [
  {
    id: 'fitlife-performance',
    brandName: 'FitLife Performance',
    industry: 'health_wellness',
    description: 'High-performance fitness coaching delivering personalized training programs, expert nutrition guidance, and sustainable lifestyle transformation for lasting health results',
    targetKeywords: 'fitness coaching, personal training, workout plans, fitness transformation',
    logoType: 'logotype',  // Text-based with bold design
    logoShape: 'shield',
    logoStyle: 'bold',
    logoColors: 'Vibrant electric blue (#00A8E8), energetic orange (#FF6B35), white. Include a strong fitness symbol integrated with the text.',
    logoBackground: 'white',
  },
  {
    id: 'artisan-table',
    brandName: 'The Harvest Table',
    industry: 'food_beverage',
    description: 'Farm-to-table restaurant crafting seasonal dishes with locally-sourced ingredients, bringing culinary artistry and authentic flavors to every beautifully plated creation',
    targetKeywords: 'farm to table, restaurant, seasonal cuisine, local ingredients',
    logoType: 'logotype',  // Text with harvest/wheat iconography
    logoShape: 'custom',
    logoStyle: 'organic',
    logoColors: 'Warm amber (#D4A574), forest green (#2D5016), harvest gold (#E0A960). Include wheat or harvest elements.',
    logoBackground: 'light',
  },
  {
    id: 'glow-skincare',
    brandName: 'Glow Skincare',
    industry: 'beauty_cosmetics',
    description: 'Natural skincare brand creating clean, effective products for radiant healthy skin with sustainably-sourced ingredients',
    targetKeywords: 'natural skincare, clean beauty, skincare products, healthy skin',
    logoType: 'logomark',  // Symbol-focused with brand name
    logoShape: 'circle',
    logoStyle: 'elegant',
    logoColors: 'Soft rose gold (#F4C2C2), mint green (#98D8C8), champagne pink (#F7CAC9). Include botanical or radiance elements.',
    logoBackground: 'white',
  },
  {
    id: 'chic-boutique',
    brandName: 'Chic Boutique',
    industry: 'fashion_apparel',
    description: 'Curated fashion boutique offering contemporary styles and timeless pieces for modern women',
    targetKeywords: 'fashion boutique, contemporary fashion, women\'s clothing',
    logoType: 'logotype',  // Pure typography, no symbol
    logoShape: 'custom',
    logoStyle: 'elegant',
    logoColors: 'Deep burgundy (#800020), soft blush (#FFB6C1), rose gold. Elegant serif or fashion-forward typography.',
    logoBackground: 'dark',
  },
  {
    id: 'bloom-beauty',
    brandName: 'Bloom Beauty',
    industry: 'beauty_cosmetics',
    description: 'Luxury beauty salon specializing in transformative hair styling, precision nail artistry, and personalized beauty treatments',
    targetKeywords: 'beauty salon, hair salon, luxury beauty, beauty treatments',
    logoType: 'logotype',  // Text with floral elements
    logoShape: 'custom',
    logoStyle: 'modern',
    logoColors: 'Coral pink (#FF7F7F), lavender purple (#B39FDB), gold (#FFD700). Include floral or beauty-inspired elements with text.',
    logoBackground: 'light',
  },
  {
    id: 'zen-flow-yoga',
    brandName: 'Zen Flow Yoga',
    industry: 'health_wellness',
    description: 'Modern yoga studio offering mindful movement, meditation, and wellness classes for busy professionals',
    targetKeywords: 'yoga studio, mindfulness, meditation, stress relief, wellness',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'minimalist',
    logoColors: 'Calming teal (#008B8B), soft sage (#9CAF88), warm terracotta (#E07856)',
    logoBackground: 'light',
  },
];

async function downloadImage(dataUri: string, filePath: string) {
  const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(filePath, buffer);
}

async function regenerateLogo(brand: typeof brandsToUpdate[0]) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Regenerating: ${brand.brandName}`);
  console.log(`Style: ${brand.logoStyle} ${brand.logoType}`);
  console.log(`Colors: ${brand.logoColors}`);
  console.log(`Background: ${brand.logoBackground}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    const logoResult = await generateBrandLogo({
      brandName: brand.brandName,
      brandDescription: brand.description,
      industry: brand.industry,
      targetKeywords: brand.targetKeywords,
      logoType: brand.logoType as any,
      logoShape: brand.logoShape as any,
      logoStyle: brand.logoStyle as any,
      logoColors: `${brand.logoColors}. Background should be ${brand.logoBackground}`,
      logoBackground: brand.logoBackground as any,
    });

    // Save to the correct showcase directory
    const logoPath = path.join(
      process.cwd(),
      'public',
      'showcase',
      'examples',
      brand.id,
      'logo.png'
    );

    await downloadImage(logoResult.logoDataUri, logoPath);

    console.log(`✅ SUCCESS: Logo saved to ${logoPath}\n`);

    // Wait 3 seconds between generations to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.log(`❌ ERROR: Failed to generate logo`);
    console.log(`   ${error}\n`);
  }
}

async function main() {
  console.log('\n🎨 Starting Logo Regeneration for 6 Showcase Brands\n');
  console.log(`Total brands to process: ${brandsToUpdate.length}`);
  console.log(`Estimated time: ~${brandsToUpdate.length * 15} seconds\n`);

  for (const brand of brandsToUpdate) {
    await regenerateLogo(brand);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Logo Regeneration Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
