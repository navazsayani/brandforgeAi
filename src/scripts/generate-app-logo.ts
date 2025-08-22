/**
 * Script to generate the BrandForge AI application logo.
 * 
 * To run this script from your terminal:
 * npx ts-node src/scripts/generate-app-logo.ts
 * 
 * Each run will generate a new logo concept and save it to the `public` directory.
 * The script will automatically increment the filename (e.g., brandforge-app-logo-1.png, brandforge-app-logo-2.png, etc.).
 */

import { generateBrandForgeAppLogo } from '../ai/flows/generate-brandforge-app-logo-flow';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  console.log('🚀 Generating new BrandForge AI logo concept...');

  try {
    const result = await generateBrandForgeAppLogo();

    if (result.logoDataUri) {
      // Decode the data URI
      const base64Data = result.logoDataUri.replace(/^data:image\/png;base64,/, "");
      
      // Determine the output directory and create it if it doesn't exist
      const outputDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(outputDir)){
          fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Find the next available filename
      let fileIndex = 1;
      let outputPath = path.join(outputDir, `brandforge-app-logo-${fileIndex}.png`);
      while (fs.existsSync(outputPath)) {
          fileIndex++;
          outputPath = path.join(outputDir, `brandforge-app-logo-${fileIndex}.png`);
      }
      
      // Save the file
      fs.writeFileSync(outputPath, base64Data, 'base64');
      
      console.log(`✅ Logo concept successfully generated and saved to: ${path.relative(process.cwd(), outputPath)}`);
      console.log('Run the script again to generate another unique option.');
      
    } else {
      console.error('❌ Logo generation failed. The AI did not return a valid image.');
    }
  } catch (error) {
    console.error('❌ An error occurred during logo generation:', error);
  }
}

// Execute the script
run();
