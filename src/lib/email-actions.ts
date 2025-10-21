'use server';

import { sendWelcomeEmail } from './email-service';
import { db } from './firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Server action to send welcome email after signup
 * Called from signup form after successful user creation
 * Also initializes user activity tracking in Firestore
 */
export async function sendWelcomeEmailAction({
  email,
  userName,
  userId,
}: {
  email: string;
  userName?: string;
  userId: string;
}) {
  try {
    console.log('[Email Action] Sending welcome email to:', email);

    // Send welcome email
    const result = await sendWelcomeEmail({
      to: email,
      userName,
      userId,
    });

    if (result.success) {
      console.log('[Email Action] Welcome email sent successfully');

      // Initialize user activity tracking in Firestore
      try {
        const userDocRef = doc(db, `users/${userId}/brandProfiles/${userId}`);
        await setDoc(userDocRef, {
          userActivity: {
            signupDate: serverTimestamp(),
            hasCompletedQuickStart: false,
            firstGenerationAt: null,
            lastActiveAt: serverTimestamp(),
            totalGenerations: 0,
            emailsSent: {
              welcome: serverTimestamp(),
            },
          },
        }, { merge: true });

        console.log('[Email Action] User activity tracking initialized');
      } catch (firestoreError) {
        console.error('[Email Action] Failed to initialize user activity:', firestoreError);
        // Don't fail the whole operation if Firestore update fails
      }

      return { success: true };
    } else {
      console.error('[Email Action] Failed to send welcome email:', result.error);
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error) {
    console.error('[Email Action] Error in sendWelcomeEmailAction:', error);
    return { success: false, error: 'Unexpected error sending email' };
  }
}
