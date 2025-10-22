/**
 * Script to regenerate 4 logos optimized for small circular display
 * Run with: npx tsx regenerate-4-logos.ts
 */

import { generateBrandLogo } from './src/ai/flows/generate-brand-logo-flow';
import fs from 'fs/promises';
import path from 'path';

// Brands to regenerate - optimized for small circular containers
const brandsToUpdate = [
  {
    id: 'zen-flow-yoga',
    brandName: 'Zen Flow Yoga',
    industry: 'health_wellness',
    description: 'Modern yoga studio offering mindful movement, meditation, and wellness classes for busy professionals',
    targetKeywords: 'yoga studio, mindfulness, meditation, stress relief, wellness',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'minimalist',
    logoColors: 'Calming teal (#008B8B), soft sage green (#9CAF88). SIMPLE icon: lotus flower or zen circle. Must be clean and recognizable at SMALL sizes. Avoid text, use pure symbol only.',
    logoBackground: 'light',
  },
  {
    id: 'bloom-beauty',
    brandName: 'Bloom Beauty',
    industry: 'beauty_cosmetics',
    description: 'Luxury beauty salon specializing in transformative hair styling, precision nail artistry, and personalized beauty treatments',
    targetKeywords: 'beauty salon, hair salon, luxury beauty, beauty treatments',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'elegant',
    logoColors: 'Coral pink (#FF7F7F), lavender purple (#B39FDB), soft gold. SIMPLE icon: stylized flower or beauty symbol. Must be elegant and clear at SMALL sizes. Avoid text, use pure symbol only.',
    logoBackground: 'light',
  },
  {
    id: 'chic-boutique',
    brandName: 'Chic Boutique',
    industry: 'fashion_apparel',
    description: 'Curated fashion boutique offering contemporary styles and timeless pieces for modern women',
    targetKeywords: 'fashion boutique, contemporary fashion, women\'s clothing',
    logoType: 'monogram',
    logoShape: 'circle',
    logoStyle: 'elegant',
    logoColors: 'Deep burgundy (#800020), rose gold. SIMPLE monogram: "CB" or "C" in elegant serif. Must be sophisticated and legible at SMALL sizes. Keep it minimal.',
    logoBackground: 'white',
  },
  {
    id: 'glow-skincare',
    brandName: 'Glow Skincare',
    industry: 'beauty_cosmetics',
    description: 'Natural skincare brand creating clean, effective products for radiant healthy skin with sustainably-sourced ingredients',
    targetKeywords: 'natural skincare, clean beauty, skincare products, healthy skin',
    logoType: 'logomark',
    logoShape: 'circle',
    logoStyle: 'minimalist',
    logoColors: 'Soft rose gold (#F4C2C2), mint green (#98D8C8). SIMPLE icon: leaf, droplet, or sun rays. Must be clean and modern at SMALL sizes. Avoid text, use pure symbol only.',
    logoBackground: 'white',
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
  console.log(`Optimized for: Small circular display`);
  console.log(`Type: ${brand.logoType} | Style: ${brand.logoStyle}`);
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
      logoColors: brand.logoColors,
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
  console.log('\n🎨 Regenerating 4 Logos Optimized for Small Circular Display\n');
  console.log(`Brands to process: ${brandsToUpdate.length}`);
  console.log(`Focus: Simple, clean icons that work well at small sizes\n`);

  for (const brand of brandsToUpdate) {
    await regenerateLogo(brand);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Logo Regeneration Complete!');
  console.log('💡 Tip: Hard refresh your browser (Ctrl+Shift+R) to see changes');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
