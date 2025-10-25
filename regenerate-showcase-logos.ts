/**
 * Script to regenerate showcase logos with more colorful and distinct designs
 */

import { generateBrandLogo } from './src/ai/flows/generate-brand-logo-flow';

const brands = [
  {
    id: 'fitlife-performance',
    name: 'FitLife Performance',
    industry: 'Fitness Coaching',
    description: 'High-performance fitness coaching for athletes and fitness enthusiasts seeking results',
    logoType: 'logomark' as const,
    logoStyle: 'bold' as const,
    colors: ['energetic orange', 'electric blue', 'vibrant red'],
    background: 'white background',
    prompt: 'Create a dynamic, energetic logo for FitLife Performance fitness coaching on a clean WHITE background. Use bold geometric shapes that convey strength and movement. Incorporate vibrant, saturated colors like energetic orange (#FF6B35) or electric blue (#00A8E8). The logo should feel modern, powerful, and motivating with high contrast against the white background.'
  },
  {
    id: 'artisan-table',
    name: 'The Harvest Table',
    industry: 'Restaurant',
    description: 'Farm-to-table restaurant celebrating local ingredients and seasonal flavors',
    logoType: 'logomark' as const,
    logoStyle: 'organic' as const,
    colors: ['warm amber', 'forest green', 'harvest gold'],
    background: 'light cream background',
    prompt: 'Create a warm, rustic logo for The Harvest Table farm-to-table restaurant on a LIGHT CREAM background (#F9F6F0). Use organic, hand-drawn style shapes with rich, earthy colors like warm amber (#D4A574), forest green (#2D5016), or harvest gold (#E0A960). Include subtle wheat or vegetable illustrations. The logo should feel artisanal and welcoming.'
  },
  {
    id: 'glow-skincare',
    name: 'Glow Skincare',
    industry: 'Skincare Brand',
    description: 'Natural skincare products for radiant, healthy skin',
    logoType: 'logomark' as const,
    logoStyle: 'elegant' as const,
    colors: ['soft rose gold', 'mint green', 'champagne pink'],
    background: 'white background',
    prompt: 'Create an elegant, luminous logo for Glow Skincare on a pure WHITE background. Use soft, glowing colors like rose gold (#F4C2C2), mint green (#98D8C8), or champagne pink (#F7CAC9). Design should include graceful curves or botanical elements. The logo must feel luxurious, clean, and radiant with metallic/shimmer effect suggestion.'
  },
  {
    id: 'chic-boutique',
    name: 'Chic Boutique',
    industry: 'Fashion Boutique',
    description: 'Curated fashion boutique offering unique, stylish pieces for modern women',
    logoType: 'logotype' as const,
    logoStyle: 'elegant' as const,
    colors: ['deep burgundy', 'soft blush', 'rich navy'],
    background: 'dark background',
    prompt: 'Create a chic, sophisticated wordmark logo for Chic Boutique on a DARK CHARCOAL background (#2C2C2C). Use elegant serif typography with refined colors like deep burgundy (#800020), soft blush (#FFB6C1), or rich navy (#001F3F) for excellent contrast. The design should feel high-fashion, luxurious, and timeless with premium aesthetics.'
  },
  {
    id: 'bloom-beauty',
    name: 'Bloom Beauty',
    industry: 'Beauty Salon',
    description: 'Modern beauty salon offering hair, nails, and beauty treatments',
    logoType: 'logomark' as const,
    logoStyle: 'modern' as const,
    colors: ['coral pink', 'lavender purple', 'gold'],
    background: 'light pink background',
    prompt: 'Create a vibrant, beautiful logo for Bloom Beauty salon on a LIGHT BLUSH PINK background (#FFF0F5). Use fresh, bright colors like coral pink (#FF7F7F), lavender purple (#B39FDB), or gold (#FFD700) accents. Include stylized floral or beauty elements. The logo should feel fresh, modern, cheerful, and Instagram-worthy.'
  },
  {
    id: 'zen-flow-yoga',
    name: 'Zen Flow Yoga',
    industry: 'Yoga Studio',
    description: 'Modern yoga studio offering mindful movement and meditation',
    logoType: 'logomark' as const,
    logoStyle: 'minimalist' as const,
    colors: ['calming teal', 'soft sage', 'warm terracotta'],
    background: 'light sage background',
    prompt: 'Create a peaceful, flowing logo for Zen Flow Yoga studio on a LIGHT SAGE background (#E8F0E8). Use calming, natural colors like deep teal (#008B8B), sage green (#9CAF88), or warm terracotta (#E07856). Design should incorporate flowing lines, lotus petals, or meditation-inspired geometric shapes. Feel serene, balanced, and modern.'
  }
];

async function regenerateLogos() {
  console.log('Starting logo regeneration for 6 showcase brands...\n');

  for (const brand of brands) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Regenerating logo for: ${brand.name}`);
    console.log(`Industry: ${brand.industry}`);
    console.log(`Style: ${brand.logoStyle} ${brand.logoType}`);
    console.log(`Colors: ${brand.colors.join(', ')}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
      const result = await generateBrandLogo({
        brandName: brand.name,
        brandDescription: brand.description,
        logoType: brand.logoType,
        logoStyle: brand.logoStyle,
        logoShape: 'custom',
        logoBackground: 'white',
      });

      if (result.logoDataUri) {
        console.log(`✅ SUCCESS: Logo generated for ${brand.name}`);
        console.log(`   Logo data available`);
        console.log(`   Save to: public/showcase/examples/${brand.id}/logo.png\n`);
      } else {
        console.log(`❌ FAILED: ${brand.name}`);
        console.log(`   Error: No logo data returned\n`);
      }

      // Wait 2 seconds between generations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`❌ ERROR generating logo for ${brand.name}:`);
      console.log(`   ${error}\n`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Logo regeneration complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the script
regenerateLogos().catch(console.error);
