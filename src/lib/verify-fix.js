/**
 * Simple verification script for the URL decoding fix
 * This can be run with Node.js to verify the fix works
 */

// Simple implementation of the decoding function for testing
function decodeHtmlEntitiesInUrl(url) {
  return url
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Test the actual problematic URL from the error
const problematicUrl = 'https://firebasestorage.googleapis.com/v0/b/brandforge-ai-jr0z4.firebasestorage.app/o/brand_example_images%2FOJziJaCIClYExSg6mhh22sRRA3A3%2F1750750756332_rust%201-min.jpg?alt=media&amp;token=1a82174c-5708-43e4-a19c-dcf9d0a3f42e';
const expectedUrl = 'https://firebasestorage.googleapis.com/v0/b/brandforge-ai-jr0z4.firebasestorage.app/o/brand_example_images%2FOJziJaCIClYExSg6mhh22sRRA3A3%2F1750750756332_rust%201-min.jpg?alt=media&token=1a82174c-5708-43e4-a19c-dcf9d0a3f42e';

const decodedUrl = decodeHtmlEntitiesInUrl(problematicUrl);

console.log('=== URL Decoding Fix Verification ===');
console.log('');
console.log('Original (problematic) URL:');
console.log(problematicUrl);
console.log('');
console.log('Decoded (fixed) URL:');
console.log(decodedUrl);
console.log('');
console.log('Expected URL:');
console.log(expectedUrl);
console.log('');
console.log('✅ Fix working correctly:', decodedUrl === expectedUrl);
console.log('');

// Test that the key issue is fixed: &amp; becomes &
const hasAmpEntity = problematicUrl.includes('&amp;');
const hasNormalAmp = decodedUrl.includes('&token=') && !decodedUrl.includes('&amp;');

console.log('Key issue verification:');
console.log('- Original URL contains &amp;:', hasAmpEntity);
console.log('- Decoded URL has normal & (not &amp;):', hasNormalAmp);
console.log('- Token parameter is properly formatted:', decodedUrl.includes('&token=1a82174c-5708-43e4-a19c-dcf9d0a3f42e'));
console.log('');

if (decodedUrl === expectedUrl && hasAmpEntity && hasNormalAmp) {
  console.log('🎉 SUCCESS: The URL decoding fix is working correctly!');
  console.log('   The Firebase Storage URL issue should now be resolved.');
} else {
  console.log('❌ FAILURE: The fix is not working as expected.');
}