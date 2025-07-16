
import { type NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { handleStoreUserApiTokenAction } from '@/lib/actions';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const platform = 'meta'; 

  console.log('[OAuth Callback] Received request.');
  
  if (error) {
    console.error(`[OAuth Callback] Error received from ${platform}:`, error);
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('error', `Authorization failed on ${platform}: ${error}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    console.error('[OAuth Callback] Missing code or state parameter.');
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('error', 'Incomplete callback from authorization server.');
    return NextResponse.redirect(redirectUrl);
  }
  
  // Retrieve the original userId from the state document in Firestore
  const stateDocRef = doc(db, 'oauthStates', state);
  const stateDocSnap = await getDoc(stateDocRef);

  if (!stateDocSnap.exists()) {
    console.error('[OAuth Callback] Invalid or expired state parameter. Potential CSRF attack.');
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('error', 'Invalid state. Please try connecting again.');
    return NextResponse.redirect(redirectUrl);
  }

  const { userId } = stateDocSnap.data();

  // Clean up the state document
  await deleteDoc(stateDocRef);

  if (!userId) {
     console.error('[OAuth Callback] Could not determine current user from state. Cannot store token.');
     const redirectUrl = new URL('/settings', request.url);
     redirectUrl.searchParams.set('error', 'You must be logged in to connect an account.');
     return NextResponse.redirect(redirectUrl);
  }


  console.log(`[OAuth Callback] Simulating token exchange for platform: ${platform} with code: ${code}`);

  const simulatedAccessToken = `sim_access_token_${platform}_${randomBytes(16).toString('hex')}`;
  const simulatedRefreshToken = `sim_refresh_token_${platform}_${randomBytes(16).toString('hex')}`;
  
  console.log(`[OAuth Callback] Simulated access token obtained for user ${userId}.`);

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
