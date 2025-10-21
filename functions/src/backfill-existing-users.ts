/**
 * One-time script to backfill userActivity for existing users
 *
 * This script adds userActivity tracking to existing users who signed up
 * before the email automation system was deployed.
 *
 * IMPORTANT: Run this ONCE after deploying the email system
 *
 * Usage:
 * 1. Deploy this as a callable function
 * 2. Call it once via Firebase Console or CLI
 * 3. Delete/disable after running
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

interface BackfillOptions {
  dryRun?: boolean; // If true, just log what would happen without making changes
  sendImmediateEmail?: boolean; // If true, send first showcase email immediately to activated users
}

/**
 * Callable function to backfill existing users
 * Can be called via Firebase Console or CLI
 */
export const backfillExistingUsers = functions.https.onCall(
  async (data: BackfillOptions = {}, context) => {
    // Optional: Require authentication
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    // }

    const dryRun = data.dryRun ?? false;
    const sendImmediateEmail = data.sendImmediateEmail ?? false;

    console.log(`[Backfill] Starting backfill (dryRun: ${dryRun})`);

    try {
      const db = admin.firestore();

      // Get all user IDs
      const userIndexRef = db.doc('userIndex/profiles');
      const userIndexSnap = await userIndexRef.get();

      if (!userIndexSnap.exists) {
        return {
          success: false,
          error: 'No user index found',
          usersProcessed: 0
        };
      }

      const userIndex = userIndexSnap.data() || {};
      const userIds = Object.keys(userIndex);

      console.log(`[Backfill] Found ${userIds.length} users to process`);

      let usersUpdated = 0;
      let usersSkipped = 0;
      const errors: string[] = [];

      for (const userId of userIds) {
        try {
          const profileRef = db.doc(`users/${userId}/brandProfiles/${userId}`);
          const profileSnap = await profileRef.get();

          if (!profileSnap.exists) {
            console.log(`[Backfill] No profile found for user ${userId}`);
            usersSkipped++;
            continue;
          }

          const brandData = profileSnap.data();

          // TEMPORARILY DISABLED - Force update all users to reset email sequence
          // Check if userActivity already exists
          // if (brandData?.userActivity?.signupDate) {
          //   console.log(`[Backfill] User ${userId} already has userActivity, skipping`);
          //   usersSkipped++;
          //   continue;
          // }

          // For backfilled users, set signup date to NOW so they start fresh email sequence
          const estimatedSignupDate = admin.firestore.Timestamp.now();

          // Mark all backfilled users as "not completed" so they receive activation emails
          const hasGeneratedContent = false;

          const userActivity = {
            signupDate: estimatedSignupDate,
            hasCompletedQuickStart: false,
            firstGenerationAt: null,
            lastActiveAt: admin.firestore.Timestamp.now(),
            totalGenerations: 0,
            isBackfilledUser: true, // Flag to identify existing users who were backfilled
            emailsSent: {
              // Mark welcome as sent (we don't want to resend it)
              welcome: estimatedSignupDate
            }
          };

          if (dryRun) {
            console.log(`[Backfill] DRY RUN - Would update user ${userId}:`, {
              signupDate: estimatedSignupDate.toDate().toISOString(),
              hasCompletedQuickStart: hasGeneratedContent,
              userEmail: brandData?.userEmail
            });
          } else {
            await profileRef.update({
              userActivity
            });
            console.log(`[Backfill] Updated user ${userId}`);
          }

          usersUpdated++;
        } catch (error) {
          console.error(`[Backfill] Error processing user ${userId}:`, error);
          errors.push(`User ${userId}: ${error}`);
        }
      }

      const result = {
        success: true,
        dryRun,
        totalUsers: userIds.length,
        usersUpdated,
        usersSkipped,
        errors: errors.length > 0 ? errors : undefined,
        message: dryRun
          ? `Dry run completed. Would update ${usersUpdated} users, skip ${usersSkipped} users.`
          : `Backfill completed. Updated ${usersUpdated} users, skipped ${usersSkipped} users.`
      };

      console.log('[Backfill] Result:', result);
      return result;
    } catch (error) {
      console.error('[Backfill] Fatal error:', error);
      return {
        success: false,
        error: String(error),
        usersProcessed: 0
      };
    }
  }
);

/**
 * Alternative: HTTP endpoint version (easier to call from browser/Postman)
 */
export const backfillExistingUsersHTTP = functions.https.onRequest(
  async (req, res) => {
    // Optional: Add authentication/authorization here
    // For security, you might want to check an API key or admin token

    const dryRun = req.query.dryRun === 'true';

    try {
      const db = admin.firestore();

      // Get all user IDs
      const userIndexRef = db.doc('userIndex/profiles');
      const userIndexSnap = await userIndexRef.get();

      if (!userIndexSnap.exists) {
        res.status(404).json({
          success: false,
          error: 'No user index found'
        });
        return;
      }

      const userIndex = userIndexSnap.data() || {};
      const userIds = Object.keys(userIndex);

      console.log(`[Backfill HTTP] Found ${userIds.length} users to process`);

      let usersUpdated = 0;
      let usersSkipped = 0;
      const updates: any[] = [];

      for (const userId of userIds) {
        try {
          const profileRef = db.doc(`users/${userId}/brandProfiles/${userId}`);
          const profileSnap = await profileRef.get();

          if (!profileSnap.exists) {
            usersSkipped++;
            continue;
          }

          const brandData = profileSnap.data();

          // TEMPORARILY DISABLED - Force update all users to reset email sequence
          // Check if userActivity already exists
          // if (brandData?.userActivity?.signupDate) {
          //   usersSkipped++;
          //   continue;
          // }

          // For backfilled users, set signup date to NOW so they start fresh email sequence
          const estimatedSignupDate = admin.firestore.Timestamp.now();

          // Mark all backfilled users as "not completed" so they receive activation emails
          const hasGeneratedContent = false;

          const userActivity = {
            signupDate: estimatedSignupDate,
            hasCompletedQuickStart: false,
            firstGenerationAt: null,
            lastActiveAt: admin.firestore.Timestamp.now(),
            totalGenerations: 0,
            isBackfilledUser: true, // Flag to identify existing users who were backfilled
            emailsSent: {
              welcome: estimatedSignupDate
            }
          };

          if (dryRun) {
            updates.push({
              userId,
              userEmail: brandData?.userEmail,
              signupDate: estimatedSignupDate.toDate().toISOString(),
              hasCompletedQuickStart: hasGeneratedContent
            });
          } else {
            await profileRef.update({
              userActivity
            });
          }

          usersUpdated++;
        } catch (error) {
          console.error(`[Backfill HTTP] Error processing user ${userId}:`, error);
        }
      }

      res.status(200).json({
        success: true,
        dryRun,
        totalUsers: userIds.length,
        usersUpdated,
        usersSkipped,
        updates: dryRun ? updates : undefined,
        message: dryRun
          ? `Dry run completed. Would update ${usersUpdated} users.`
          : `Backfill completed. Updated ${usersUpdated} users.`
      });
    } catch (error) {
      console.error('[Backfill HTTP] Fatal error:', error);
      res.status(500).json({
        success: false,
        error: String(error)
      });
    }
  }
);
