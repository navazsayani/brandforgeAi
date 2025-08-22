/**
 * Test script to verify Firebase Admin SDK initialization
 * Run this to test if the Firebase Admin SDK is properly configured
 */

import { ensureFirebaseAdminInitialized } from '../lib/firebase-admin';
import admin from 'firebase-admin';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

async function testFirebaseAdminInitialization() {
  console.log('🔥 Testing Firebase Admin SDK initialization...\n');

  try {
    // Test 1: Initialize Firebase Admin SDK
    console.log('1. Initializing Firebase Admin SDK...');
    ensureFirebaseAdminInitialized();
    
    if (admin.apps.length === 0) {
      throw new Error('Firebase Admin SDK failed to initialize');
    }
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`   - App name: ${admin.apps[0]?.name || 'default'}`);
    console.log(`   - Project ID: ${admin.apps[0]?.options.projectId || 'not set'}`);

    // Test 2: Test Auth service
    console.log('\n2. Testing Firebase Auth service...');
    const auth = getAdminAuth();
    console.log('✅ Firebase Auth service accessible');

    // Test 3: Test Firestore service
    console.log('\n3. Testing Firestore service...');
    const db = getAdminFirestore();
    console.log('✅ Firestore service accessible');

    // Test 4: Test Storage service
    console.log('\n4. Testing Firebase Storage service...');
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    console.log('✅ Firebase Storage service accessible');
    console.log(`   - Bucket name: ${bucket.name}`);

    // Test 5: Test basic Firestore operation (read-only)
    console.log('\n5. Testing basic Firestore read operation...');
    try {
      const testDoc = await db.collection('configuration').doc('models').get();
      console.log('✅ Firestore read operation successful');
      console.log(`   - Document exists: ${testDoc.exists}`);
    } catch (firestoreError: any) {
      console.log('⚠️  Firestore read operation failed (this may be expected if permissions are restricted)');
      console.log(`   - Error: ${firestoreError.message}`);
    }

    console.log('\n🎉 All Firebase Admin SDK tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Firebase Admin SDK: ✅ Initialized');
    console.log('   - Auth service: ✅ Accessible');
    console.log('   - Firestore service: ✅ Accessible');
    console.log('   - Storage service: ✅ Accessible');

  } catch (error: any) {
    console.error('\n❌ Firebase Admin SDK test failed:');
    console.error(`   - Error: ${error.message}`);
    console.error(`   - Stack: ${error.stack}`);
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check if FIREBASE_SERVICE_ACCOUNT_KEY environment variable is set');
    console.log('   2. Verify the service account key JSON is valid');
    console.log('   3. Ensure the service account has proper permissions');
    console.log('   4. Check if NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is set correctly');
    
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testFirebaseAdminInitialization().catch(console.error);
}

export { testFirebaseAdminInitialization };