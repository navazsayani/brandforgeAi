
import { type NextRequest, NextResponse } from 'next/server';
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
  
  const stateDocRef = doc(db, 'oauthStates', state);
  const stateDocSnap = await getDoc(stateDocRef);

  if (!stateDocSnap.exists()) {
    console.error('[OAuth Callback] Invalid or expired state parameter. Potential CSRF attack.');
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('error', 'Invalid state. Please try connecting again.');
    return NextResponse.redirect(redirectUrl);
  }

  const { userId, origin } = stateDocSnap.data();

  await deleteDoc(stateDocRef);

  if (!userId) {
     console.error('[OAuth Callback] Could not determine current user from state. Cannot store token.');
     const redirectUrl = new URL('/settings', request.url);
     redirectUrl.searchParams.set('error', 'You must be logged in to connect an account.');
     return NextResponse.redirect(redirectUrl);
  }

  // --- Start Real Token Exchange ---
  try {
    const clientId = process.env.META_CLIENT_ID;
    const clientSecret = process.env.META_CLIENT_SECRET;
    const redirectUri = `${origin}/api/oauth/callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Meta application credentials are not configured on the server.");
    }
    
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', clientId);
    tokenUrl.searchParams.append('redirect_uri', redirectUri);
    tokenUrl.searchParams.append('client_secret', clientSecret);
    tokenUrl.searchParams.append('code', code);

    console.log(`[OAuth Callback] Exchanging code for access token for user ${userId}...`);
    const tokenResponse = await fetch(tokenUrl.toString(), { method: 'GET' });
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(`Token exchange failed: ${tokenData.error.message}`);
    }

    const { access_token, expires_in } = tokenData;
    console.log(`[OAuth Callback] Real access token obtained for user ${userId}.`);

    const storeResult = await handleStoreUserApiTokenAction({
      userId,
      platform,
      accessToken: access_token,
      expiresIn: expires_in,
    });

    const finalRedirectUrl = new URL('/settings', request.url);
    if (storeResult.success) {
        finalRedirectUrl.searchParams.set('connected', platform);
    } else {
        finalRedirectUrl.searchParams.set('error', storeResult.error || `Failed to store token for ${platform}.`);
    }
    
    return NextResponse.redirect(finalRedirectUrl);

  } catch (e: any) {
    console.error('[OAuth Callback] CRITICAL ERROR during token exchange:', e);
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('error', `Token exchange failed: ${e.message}`);
    return NextResponse.redirect(redirectUrl);
  }
  // --- End Real Token Exchange ---
}
