/**
 * Email Scheduler Cloud Function
 *
 * Sends activation emails to users based on their activity and signup time.
 * Runs every hour on Firebase Cloud Functions (free tier).
 *
 * IMPORTANT: This is SEPARATE from RAG functions and will not conflict.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ActivationReminderEmail from './emails/ActivationReminderEmail';
import ExampleShowcaseEmail from './emails/ExampleShowcaseEmail';
import TemplateShowcaseEmail from './emails/TemplateShowcaseEmail';
import FinalReminderEmail from './emails/FinalReminderEmail';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Resend with API key from Firebase config
// For development, falls back to process.env
const getResendApiKey = () => {
  try {
    return functions.config().resend?.api_key || process.env.RESEND_API_KEY;
  } catch (error) {
    return process.env.RESEND_API_KEY;
  }
};

const resend = new Resend(getResendApiKey());

interface UserActivity {
  signupDate: admin.firestore.Timestamp;
  hasCompletedQuickStart: boolean;
  firstGenerationAt: admin.firestore.Timestamp | null;
  lastActiveAt: admin.firestore.Timestamp;
  totalGenerations: number;
  emailsSent: {
    welcome?: admin.firestore.Timestamp;
    reminder2h?: admin.firestore.Timestamp;
    showcase24h?: admin.firestore.Timestamp;
    templates3d?: admin.firestore.Timestamp;
    final7d?: admin.firestore.Timestamp;
  };
}

interface BrandData {
  userEmail?: string;
  brandName?: string;
  industry?: string;
  userActivity?: UserActivity;
}

/**
 * Helper: Calculate hours since signup
 */
function getHoursSinceSignup(signupDate: admin.firestore.Timestamp): number {
  const now = admin.firestore.Timestamp.now().toMillis();
  const signup = signupDate.toMillis();
  return (now - signup) / (1000 * 60 * 60); // Convert to hours
}

/**
 * Helper: Send email via Resend
 */
async function sendEmailViaResend({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    // Use Firebase config or fall back to process.env for local development
    const getConfigValue = (key: string, fallback: string) => {
      try {
        const config = functions.config();
        if (key === 'from_email') return config.resend?.from_email || fallback;
        if (key === 'reply_to_email') return config.resend?.reply_to_email;
        return fallback;
      } catch {
        return process.env[key.toUpperCase().replace('_', '_')] || fallback;
      }
    };

    const fromEmail = getConfigValue('from_email', 'hello@brandforge.me');
    const replyToEmail = getConfigValue('reply_to_email', '');

    const emailOptions: any = {
      from: fromEmail,
      to: [to],
      subject,
      html,
    };

    if (replyToEmail) {
      emailOptions.replyTo = replyToEmail;
    }

    await resend.emails.send(emailOptions);
    console.log(`[Email Scheduler] Email sent successfully to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[Email Scheduler] Failed to send email to ${to}:`, error);
    return false;
  }
}

/**
 * Helper: Render React Email template to HTML
 */
async function renderEmailTemplate(component: React.ReactElement): Promise<string> {
  return await render(component);
}

/**
 * Main scheduled function - runs every hour
 * Free tier: 125,000 invocations/month (more than enough for hourly checks)
 */
export const sendActivationEmails = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    console.log('[Email Scheduler] Starting scheduled email check...');

    try {
      const db = admin.firestore();

      // Use Firebase config for app URL or fall back to default
      const getAppUrl = () => {
        try {
          return functions.config().app?.url || 'https://www.brandforge.me';
        } catch {
          return process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandforge.me';
        }
      };

      const appUrl = getAppUrl();

      // Query all user brand profiles
      const userIndexRef = db.doc('userIndex/profiles');
      const userIndexSnap = await userIndexRef.get();

      if (!userIndexSnap.exists) {
        console.log('[Email Scheduler] No user index found');
        return null;
      }

      const userIndex = userIndexSnap.data() || {};
      const userIds = Object.keys(userIndex);
      console.log(`[Email Scheduler] Found ${userIds.length} users to check`);

      let emailsSent = 0;

      for (const userId of userIds) {
        const profileRef = db.doc(`users/${userId}/brandProfiles/${userId}`);
        const profileSnap = await profileRef.get();

        if (!profileSnap.exists) {
          continue; // Skip if no brand profile
        }

        const brandData = profileSnap.data() as BrandData;
        const userActivity = brandData.userActivity;

        // Skip if no user activity tracking
        if (!userActivity || !userActivity.signupDate) {
          continue;
        }

        const hoursSinceSignup = getHoursSinceSignup(userActivity.signupDate);
        const hasCompleted = userActivity.hasCompletedQuickStart;
        const userEmail = brandData.userEmail;
        const userName = brandData.brandName || '';
        const industry = brandData.industry || 'business';

        if (!userEmail) {
          continue; // Skip if no email
        }

        const emailsSentRecord = userActivity.emailsSent || {};

        // EMAIL #2: +2 hours reminder (if not completed Quick Start)
        if (
          !hasCompleted &&
          hoursSinceSignup >= 2 &&
          hoursSinceSignup < 24 &&
          !emailsSentRecord.reminder2h
        ) {
          const html = await renderEmailTemplate(
            ActivationReminderEmail({
              userName,
              quickStartUrl: `${appUrl}/quick-start`,
            })
          );
          const sent = await sendEmailViaResend({
            to: userEmail,
            subject: "Quick question - what's blocking you?",
            html,
          });

          if (sent) {
            await profileRef.update({
              'userActivity.emailsSent.reminder2h': admin.firestore.FieldValue.serverTimestamp(),
            });
            emailsSent++;
          }
        }

        // EMAIL #3: +24 hours showcase (if still no activity)
        if (
          !hasCompleted &&
          hoursSinceSignup >= 24 &&
          hoursSinceSignup < 72 &&
          !emailsSentRecord.showcase24h
        ) {
          const html = await renderEmailTemplate(
            ExampleShowcaseEmail({
              userName,
              quickStartUrl: `${appUrl}/quick-start`,
            })
          );
          const sent = await sendEmailViaResend({
            to: userEmail,
            subject: 'See what brands created with BrandForge AI in 30 seconds',
            html,
          });

          if (sent) {
            await profileRef.update({
              'userActivity.emailsSent.showcase24h': admin.firestore.FieldValue.serverTimestamp(),
            });
            emailsSent++;
          }
        }

        // EMAIL #4: +3 days templates (if still no activity)
        if (
          !hasCompleted &&
          hoursSinceSignup >= 72 &&
          hoursSinceSignup < 168 &&
          !emailsSentRecord.templates3d
        ) {
          const html = await renderEmailTemplate(
            TemplateShowcaseEmail({
              userName,
              templatesUrl: `${appUrl}/templates`,
            })
          );
          const sent = await sendEmailViaResend({
            to: userEmail,
            subject: 'Skip the setup with 20+ industry templates inside BrandForge AI',
            html,
          });

          if (sent) {
            await profileRef.update({
              'userActivity.emailsSent.templates3d': admin.firestore.FieldValue.serverTimestamp(),
            });
            emailsSent++;
          }
        }

        // EMAIL #5: +7 days final reminder (if still no activity)
        if (
          !hasCompleted &&
          hoursSinceSignup >= 168 &&
          !emailsSentRecord.final7d
        ) {
          const html = await renderEmailTemplate(
            FinalReminderEmail({
              userName,
              quickStartUrl: `${appUrl}/quick-start`,
            })
          );
          const sent = await sendEmailViaResend({
            to: userEmail,
            subject: 'Should I close your BrandForge AI account? (One last quick win inside)',
            html,
          });

          if (sent) {
            await profileRef.update({
              'userActivity.emailsSent.final7d': admin.firestore.FieldValue.serverTimestamp(),
            });
            emailsSent++;
          }
        }
      }

      console.log(`[Email Scheduler] Completed. Sent ${emailsSent} emails.`);
      return null;
    } catch (error) {
      console.error('[Email Scheduler] Error in scheduled function:', error);
      return null;
    }
  });
