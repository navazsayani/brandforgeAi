
import { type NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { handleStoreUserApiTokenAction } from '@/lib/actions';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// This is a helper function to get the current user on the server.
// In a real app, you might use a library that handles this more robustly.
const getCurrentUser = (): Promise<import('firebase/auth').User | null> => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
};


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const platform = searchParams.get('platform');
  const error = searchParams.get('error');

  console.log('[OAuth Callback] Received request.');
  
  if (error) {
    console.error(`[OAuth Callback] Error received from ${platform}:`, error);
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('error', `Authorization failed on ${platform}: ${error}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !platform) {
    console.error('[OAuth Callback] Missing code or platform parameter.');
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('error', 'Incomplete callback from authorization server.');
    return NextResponse.redirect(redirectUrl);
  }

  // At this point, you would typically exchange the `code` for an access token.
  // We will simulate this process.
  console.log(`[OAuth Callback] Simulating token exchange for platform: ${platform} with code: ${code}`);

  // In a real app, you'd get the current user's ID to associate the token.
  // For this simulation, we'll just log it.
  const currentUser = await getCurrentUser();
  const userId = currentUser?.uid;

  if (!userId) {
     console.error('[OAuth Callback] Could not determine current user. Cannot store token.');
     const redirectUrl = new URL('/settings', request.url);
     redirectUrl.searchParams.set('error', 'You must be logged in to connect an account.');
     return NextResponse.redirect(redirectUrl);
  }

  // Simulate exchanging the code for a token
  const simulatedAccessToken = `sim_access_token_${platform}_${randomBytes(16).toString('hex')}`;
  const simulatedRefreshToken = `sim_refresh_token_${platform}_${randomBytes(16).toString('hex')}`;
  
  console.log(`[OAuth Callback] Simulated access token obtained for user ${userId}.`);

  // Call the placeholder server action to "store" the token.
  const storeResult = await handleStoreUserApiTokenAction({
    userId,
    platform,
    accessToken: simulatedAccessToken,
    refreshToken: simulatedRefreshToken,
    expiresIn: 3600, // Simulate 1 hour expiry
  });

  const redirectUrl = new URL('/settings', request.url);
  if (storeResult.success) {
      redirectUrl.searchParams.set('connected', platform);
  } else {
      redirectUrl.searchParams.set('error', storeResult.error || `Failed to store token for ${platform}.`);
  }
  
  return NextResponse.redirect(redirectUrl);
}
