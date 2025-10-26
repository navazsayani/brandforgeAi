/**
 * Selective Gallery Regeneration Script
 *
 * Regenerates only specific gallery items that need to be fixed
 *
 * Run with: npx tsx src/lib/inspiration/regenerate-selective.ts
 */

import { generateBrandLogo } from '@/ai/flows/generate-brand-logo-flow';
import { generateImages } from '@/ai/flows/generate-images';
import fs from 'fs/promises';
import path from 'path';
import { gallerySpecs } from './generate-gallery';

// IDs of items to regenerate
const itemsToRegenerate = [
  'logo-hops-barrel',      // Fixed invalid logoType + improved spec
  'logo-paws-co',          // Enhanced pet service logo
  'img-workspace-flatlay', // Fixed dual laptop issue
  'img-quote-business',    // Enhanced business quote design
  'img-tech-office',       // Fixed unrealistic holograms
];

async function ensureDirectory(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function downloadImage(dataUri: string, filePath: string) {
  const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(filePath, buffer);
}

async function regenerateSelectiveItems() {
  console.log('🔄 Starting Selective Gallery Regeneration...\n');
  console.log(`📝 Items to regenerate: ${itemsToRegenerate.length}\n`);

  const publicDir = path.join(process.cwd(), 'public/gallery');
  await ensureDirectory(path.join(publicDir, 'logos'));
  await ensureDirectory(path.join(publicDir, 'images'));

  let successCount = 0;
  let failureCount = 0;

  // Filter specs to only regenerate specified items
  const specsToRegenerate = gallerySpecs.filter(spec =>
    itemsToRegenerate.includes(spec.id)
  );

  console.log('Items to process:');
  specsToRegenerate.forEach((spec, idx) => {
    console.log(`  ${idx + 1}. ${spec.id} (${spec.type})`);
  });
  console.log('\n');

  for (const spec of specsToRegenerate) {
    try {
      console.log(`\n📦 Regenerating: ${spec.id}`);

      if (spec.type === 'logo') {
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
        console.log(`  ✅ Saved: /gallery/logos/${spec.id.replace('logo-', '')}.png`);
        successCount++;

      } else {
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

          console.log(`  ✅ Saved: /gallery/images/${spec.id.replace('img-', '')}.png`);
          successCount++;
        } else {
          console.log(`  ❌ No image generated`);
          failureCount++;
        }
      }

    } catch (error) {
      console.error(`  ❌ Failed: ${error}`);
      failureCount++;
    }
  }

  console.log(`\n\n========================================`);
  console.log(`✅ Selective Regeneration Complete!`);
  console.log(`========================================\n`);
  console.log(`Total items processed: ${specsToRegenerate.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failures: ${failureCount}`);
  console.log(`\nSaved to: /public/gallery/`);
}

// Run if called directly
if (require.main === module) {
  regenerateSelectiveItems()
    .then(() => {
      console.log('\n✨ Regeneration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Regeneration failed:', error);
      console.error(error);
      process.exit(1);
    });
}

export { regenerateSelectiveItems };
