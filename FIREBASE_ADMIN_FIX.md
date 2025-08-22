# Firebase Admin SDK Authentication Fix

## Problem Description

The admin user deletion functionality was failing with the error:
```
"Failed to delete user: Could not refresh access token: Request failed with status code 500"
```

## Root Cause Analysis

The issue was caused by improper Firebase Admin SDK initialization and authentication:

1. **Authentication Method**: The code was using `admin.credential.applicationDefault()` which relies on Google Application Default Credentials
2. **Missing Credentials**: The environment likely didn't have proper service account credentials configured
3. **Error Handling**: There was insufficient error handling around Firebase Admin SDK operations
4. **Token Refresh**: When the Admin SDK couldn't authenticate properly, it failed to refresh access tokens needed for operations

## Solution Implemented

### 1. Enhanced Firebase Admin SDK Initialization

Created a centralized initialization utility (`src/lib/firebase-admin.ts`) that:
- Tries to use `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable first
- Falls back to Application Default Credentials if service account key is not available
- Provides better error messages and logging
- Prevents duplicate initialization

### 2. Improved Error Handling

Enhanced the `handleDeleteUserByAdminAction` function with:
- Better error detection and reporting
- Specific error messages for different failure scenarios
- Graceful handling of missing users or resources
- Detailed logging for debugging

### 3. Robust User Deletion Process

The user deletion now:
- Verifies Firebase Admin SDK initialization before proceeding
- Handles each deletion step (Storage, Firestore, Auth) separately with individual error handling
- Provides specific error messages for each failure type
- Continues with partial cleanup even if some steps fail

## Files Modified

1. **`src/lib/firebase-admin.ts`** (NEW)
   - Centralized Firebase Admin SDK initialization
   - Support for both service account key and application default credentials

2. **`src/lib/actions.ts`**
   - Updated to use centralized initialization
   - Enhanced error handling in `handleDeleteUserByAdminAction`
   - Better logging and error messages

3. **`src/lib/cleanup-orphaned-images.ts`**
   - Updated to use centralized initialization
   - Consistent Firebase Admin SDK setup

4. **`src/scripts/test-firebase-admin.ts`** (NEW)
   - Test script to verify Firebase Admin SDK configuration
   - Helps diagnose authentication issues

## Environment Variables Required

For optimal functionality, set one of these:

### Option 1: Service Account Key (Recommended)
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'
```

### Option 2: Application Default Credentials
Ensure your environment has Google Application Default Credentials configured:
- In development: Run `gcloud auth application-default login`
- In production: Use service account attached to the compute instance

### Required for both options:
```bash
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## Testing the Fix

1. **Test Firebase Admin SDK initialization:**
   ```bash
   npx ts-node src/scripts/test-firebase-admin.ts
   ```

2. **Test user deletion in admin dashboard:**
   - Login as admin user
   - Navigate to admin dashboard
   - Try deleting a test user
   - Check for improved error messages if issues occur

## Error Messages Guide

The enhanced error handling now provides specific messages:

- **"Firebase Admin SDK error: ..."** - Configuration or initialization issue
- **"Authentication failed: Could not refresh access token"** - Credentials issue
- **"Storage deletion failed: ..."** - Firebase Storage permission or access issue
- **"Database deletion failed: ..."** - Firestore permission or access issue
- **"User not found in Firebase Authentication"** - User already deleted or doesn't exist

## Prevention

To prevent similar issues in the future:

1. Always test Firebase Admin SDK operations in a staging environment
2. Monitor Firebase Admin SDK logs for authentication warnings
3. Ensure service account has proper permissions:
   - Firebase Authentication Admin
   - Cloud Firestore Admin
   - Firebase Storage Admin
4. Use the test script regularly to verify configuration

## Rollback Plan

If issues occur, you can rollback by:
1. Reverting the changes to `src/lib/actions.ts`
2. Removing `src/lib/firebase-admin.ts`
3. Restoring the original Firebase Admin SDK initialization

However, the new implementation is backward compatible and should work with existing configurations.