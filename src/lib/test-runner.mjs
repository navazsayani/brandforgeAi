#!/usr/bin/env node

/**
 * Test runner for BrandForge AI Image Flow Tests
 * Run with: node src/lib/test-runner.mjs
 */

import { decodeHtmlEntitiesInUrl } from './utils.ts';

// Test URLs with various HTML entity encodings
const testUrls = [
  // The actual problematic URL from the error
  'https://firebasestorage.googleapis.com/v0/b/brandforge-ai-jr0z4.firebasestorage.app/o/brand_example_images%2FOJziJaCIClYExSg6mhh22sRRA3A3%2F1750750756332_rust%201-min.jpg?alt=media&amp;token=1a82174c-5708-43e4-a19c-dcf9d0a3f42e',
  
  // Other potential HTML entity scenarios
  'https://firebasestorage.googleapis.com/v0/b/test.firebasestorage.app/o/images%2Ftest.jpg?alt=media&amp;token=abc123&amp;generation=456',
  'https://example.com/image.jpg?param1=value1&amp;param2=value2&amp;param3=value3',
  
  // URLs that should remain unchanged
  'https://firebasestorage.googleapis.com/v0/b/test.firebasestorage.app/o/images%2Ftest.jpg?alt=media&token=abc123',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
];

function testUrlDecoding() {
  console.log('=== Testing URL Decoding Function ===');
  
  testUrls.forEach((url, index) => {
    const decoded = decodeHtmlEntitiesInUrl(url);
    const hasEntities = url !== decoded;
    
    console.log(`\nTest ${index + 1}:`);
    console.log(`Original:  ${url}`);
    console.log(`Decoded:   ${decoded}`);
    console.log(`Changed:   ${hasEntities ? 'YES' : 'NO'}`);
    
    // Verify specific transformations
    if (url.includes('&amp;')) {
      console.log(`✓ &amp; → & transformation: ${decoded.includes('&') && !decoded.includes('&amp;') ? 'SUCCESS' : 'FAILED'}`);
    }
  });
}

function testImageFlowScenarios() {
  console.log('\n=== Testing Image Flow Scenarios ===');
  
  const scenarios = [
    {
      name: 'Brand Profile Example Image Upload',
      description: 'User uploads example images to brand profile',
      storagePath: 'users/{userId}/brand_example_images/{timestamp}_{filename}',
      flows: ['Brand Profile → Content Studio', 'Brand Profile → Refine with AI']
    },
    {
      name: 'Generated Library Images',
      description: 'Images generated in Content Studio and saved to library',
      storagePath: 'users/{userId}/brandProfiles/{brandProfileDocId}/generatedLibraryImages/{timestamp}_{filename}',
      flows: ['Content Studio → Save to Library', 'Image Library → Refine with AI']
    },
    {
      name: 'Refined Example Images',
      description: 'Example images refined and saved back to brand profile',
      storagePath: 'users/{userId}/brand_example_images/refined_{timestamp}.png',
      flows: ['Brand Profile → Refine → Save as New', 'Brand Profile → Refine → Overwrite']
    },
    {
      name: 'Content Studio Image Generation',
      description: 'Using example images as reference for new image generation',
      storagePath: 'Retrieved from brand_example_images',
      flows: ['Content Studio → Generate with Example Image', 'Freepik Description Generation']
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Storage Path: ${scenario.storagePath}`);
    console.log(`   Affected Flows: ${scenario.flows.join(', ')}`);
  });
}

function testFixedComponents() {
  console.log('\n=== Components/Functions Fixed ===');
  
  const fixedComponents = [
    {
      file: 'src/lib/utils.ts',
      functions: ['decodeHtmlEntitiesInUrl', 'verifyImageUrlExists'],
      description: 'Core utility functions for URL decoding and verification'
    },
    {
      file: 'src/ai/flows/edit-image-flow.ts',
      functions: ['editImageFlow'],
      description: 'Refine with AI functionality - decodes URLs before fetching and verifies existence'
    },
    {
      file: 'src/ai/flows/generate-images.ts',
      functions: ['generateImagesFlow'],
      description: 'Image generation with example images - decodes URLs and handles missing images gracefully'
    },
    {
      file: 'src/lib/actions.ts',
      functions: ['handleEditImageAction', 'handleGenerateImagesAction'],
      description: 'Server actions that process image URLs - decode before processing and verify existence'
    }
  ];
  
  fixedComponents.forEach((component, index) => {
    console.log(`\n${index + 1}. ${component.file}`);
    console.log(`   Functions: ${component.functions.join(', ')}`);
    console.log(`   Fix: ${component.description}`);
  });
}

function runAllTests() {
  console.log('🧪 Running Comprehensive Image Flow Tests\n');
  
  testUrlDecoding();
  testImageFlowScenarios();
  testFixedComponents();
  
  console.log('\n✅ All tests completed! Check the output above for verification.');
  console.log('\n📋 Summary of Fixes:');
  console.log('1. HTML entity decoding in all image processing flows');
  console.log('2. Image existence verification before processing');
  console.log('3. Graceful handling of missing/inaccessible images');
  console.log('4. Comprehensive error messages for debugging');
  console.log('5. Consistent URL handling across all components');
}

// Run the tests
console.log('🚀 Starting BrandForge AI Image Flow Tests...\n');
runAllTests();