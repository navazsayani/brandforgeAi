#!/usr/bin/env node

/**
 * Simple test runner for the image flow tests
 * Run this with: node src/lib/run-tests.js
 */

// Import the test functions
const { runAllTests } = require('./test-all-image-flows.ts');

console.log('🚀 Starting BrandForge AI Image Flow Tests...\n');

try {
  runAllTests();
} catch (error) {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
}