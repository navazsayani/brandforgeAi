/**
 * Manual test to verify URL decoding functionality
 * This can be run to test the fix for the Firebase Storage URL issue
 */

import { decodeHtmlEntitiesInUrl } from './utils';

export function testUrlDecoding() {
  console.log('=== Testing URL Decoding Fix ===');
  
  // Test case 1: The actual problematic URL from the error
  const problematicUrl = 'https://firebasestorage.googleapis.com/v0/b/brandforge-ai-jr0z4.firebasestorage.app/o/brand_example_images%2FOJziJaCIClYExSg6mhh22sRRA3A3%2F1750750756332_rust%201-min.jpg?alt=media&amp;token=1a82174c-5708-43e4-a19c-dcf9d0a3f42e';
  const expectedUrl = 'https://firebasestorage.googleapis.com/v0/b/brandforge-ai-jr0z4.firebasestorage.app/o/brand_example_images%2FOJziJaCIClYExSg6mhh22sRRA3A3%2F1750750756332_rust%201-min.jpg?alt=media&token=1a82174c-5708-43e4-a19c-dcf9d0a3f42e';
  
  const decodedUrl = decodeHtmlEntitiesInUrl(problematicUrl);
  
  console.log('Test 1: Firebase Storage URL with &amp; entity');
  console.log('Original (problematic):', problematicUrl);
  console.log('Decoded (fixed):', decodedUrl);
  console.log('Expected:', expectedUrl);
  console.log('✅ Test 1 PASSED:', decodedUrl === expectedUrl);
  console.log('');
  
  // Test case 2: Multiple HTML entities
  const multiEntityUrl = 'https://example.com/path?param1=value1&amp;param2=value2&lt;test&gt;&quot;quoted&quot;&#39;apostrophe&#39;';
  const expectedMultiUrl = 'https://example.com/path?param1=value1&param2=value2<test>"quoted"\'apostrophe\'';
  const decodedMultiUrl = decodeHtmlEntitiesInUrl(multiEntityUrl);
  
  console.log('Test 2: Multiple HTML entities');
  console.log('Original:', multiEntityUrl);
  console.log('Decoded:', decodedMultiUrl);
  console.log('Expected:', expectedMultiUrl);
  console.log('✅ Test 2 PASSED:', decodedMultiUrl === expectedMultiUrl);
  console.log('');
  
  // Test case 3: Normal URL (should remain unchanged)
  const normalUrl = 'https://example.com/path?param1=value1&param2=value2';
  const decodedNormalUrl = decodeHtmlEntitiesInUrl(normalUrl);
  
  console.log('Test 3: Normal URL (should remain unchanged)');
  console.log('Original:', normalUrl);
  console.log('Decoded:', decodedNormalUrl);
  console.log('✅ Test 3 PASSED:', decodedNormalUrl === normalUrl);
  console.log('');
  
  const allTestsPassed = (
    decodedUrl === expectedUrl &&
    decodedMultiUrl === expectedMultiUrl &&
    decodedNormalUrl === normalUrl
  );
  
  console.log('=== Test Results ===');
  console.log(allTestsPassed ? '🎉 ALL TESTS PASSED! The URL decoding fix is working correctly.' : '❌ Some tests failed. Please check the implementation.');
  
  return allTestsPassed;
}

// Export for potential use in other files
export { decodeHtmlEntitiesInUrl };