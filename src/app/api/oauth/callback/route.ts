
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Helper function to validate token by making a test API call
async function validateMetaToken(accessToken: string): Promise<{ isValid: boolean; error?: string; userInfo?: any }> {
  try {
    const testUrl = `https://graph.facebook.com/v19.0/me?access_token=${accessToken}&fields=id,name`;
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.error) {
      return {
        isValid: false,
        error: `Token validation failed: ${data.error.message} (Code: ${data.error.code})`
      };
    }
    
    return {
      isValid: true,
      userInfo: { id: data.id, name: data.name }
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: `Token validation request failed: ${error.message}`
    };
  }
}

// Helper function to get long-lived token
async function exchangeForLongLivedToken(shortLivedToken: string, clientId: string, clientSecret: string): Promise<{ token?: string; expiresIn?: number; error?: string }> {
  try {
    const exchangeUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    exchangeUrl.searchParams.append('grant_type', 'fb_exchange_token');
    exchangeUrl.searchParams.append('client_id', clientId);
    exchangeUrl.searchParams.append('client_secret', clientSecret);
    exchangeUrl.searchParams.append('fb_exchange_token', shortLivedToken);

    const response = await fetch(exchangeUrl.toString());
    const data = await response.json();

    if (data.error) {
      return { error: `Long-lived token exchange failed: ${data.error.message}` };
    }

    return {
      token: data.access_token,
      expiresIn: data.expires_in
    };
  } catch (error: any) {
    return { error: `Long-lived token exchange request failed: ${error.message}` };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorReason = searchParams.get('error_reason');
  const errorDescription = searchParams.get('error_description');

  const platform = 'meta';
  const requestId = Math.random().toString(36).substring(2, 10);

  console.log(`[OAuth Callback:${requestId}] === OAUTH CALLBACK STARTED ===`);
  console.log(`[OAuth Callback:${requestId}] Request URL: ${request.url}`);
  console.log(`[OAuth Callback:${requestId}] Parameters - code: ${code ? 'present' : 'missing'}, state: ${state ? 'present' : 'missing'}, error: ${error || 'none'}`);
  
  // Get state data first to access origin for proper redirects
  let origin: string | undefined;
  let userId: string | undefined;
  
  if (state) {
    console.log(`[OAuth Callback:${requestId}] Validating state parameter: ${state}`);
    const stateDocRef = doc(db, 'oauthStates', state);
    
    let stateDocSnap;
    try {
      stateDocSnap = await getDoc(stateDocRef);
      if (stateDocSnap.exists()) {
        const stateData = stateDocSnap.data();
        userId = stateData.userId;
        origin = stateData.origin;
        console.log(`[OAuth Callback:${requestId}] State validated - userId: ${userId}, origin: ${origin}`);
        
        // Clean up state document
        try {
          await deleteDoc(stateDocRef);
          console.log(`[OAuth Callback:${requestId}] State document cleaned up successfully`);
        } catch (cleanupError: any) {
          console.warn(`[OAuth Callback:${requestId}] Failed to cleanup state document:`, cleanupError);
          // Continue processing even if cleanup fails
        }
      }
    } catch (firestoreError: any) {
      console.error(`[OAuth Callback:${requestId}] Firestore error while fetching state:`, firestoreError);
      const redirectUrl = new URL('/settings', origin || request.url);
      redirectUrl.searchParams.set('error', 'Database error during authentication. Please try again.');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Enhanced error handling for OAuth errors
  if (error) {
    console.error(`[OAuth Callback:${requestId}] OAuth error received from ${platform}:`);
    console.error(`[OAuth Callback:${requestId}] - Error: ${error}`);
    console.error(`[OAuth Callback:${requestId}] - Reason: ${errorReason || 'not provided'}`);
    console.error(`[OAuth Callback:${requestId}] - Description: ${errorDescription || 'not provided'}`);
    
    const redirectUrl = new URL('/settings', origin || request.url);
    let errorMessage = `Authorization failed on ${platform}: ${error}`;
    if (errorDescription) {
      errorMessage += ` - ${errorDescription}`;
    }
    redirectUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    console.error(`[OAuth Callback:${requestId}] Missing required parameters - code: ${!!code}, state: ${!!state}`);
    const redirectUrl = new URL('/settings', origin || request.url);
    redirectUrl.searchParams.set('error', 'Incomplete callback from authorization server. Please try connecting again.');
    return NextResponse.redirect(redirectUrl);
  }

  if (!userId || !origin) {
    console.error(`[OAuth Callback:${requestId}] Invalid or expired state parameter. Potential CSRF attack or expired session.`);
    const redirectUrl = new URL('/settings', origin || request.url);
    redirectUrl.searchParams.set('error', 'Invalid or expired authentication session. Please try connecting again.');
    return NextResponse.redirect(redirectUrl);
  }

  // --- Enhanced Token Exchange Process ---
  try {
    const clientId = process.env.META_CLIENT_ID;
    const clientSecret = process.env.META_CLIENT_SECRET;
    const redirectUri = `${origin}/api/oauth/callback`;

    console.log(`[OAuth Callback:${requestId}] Environment check - clientId: ${clientId ? 'present' : 'missing'}, clientSecret: ${clientSecret ? 'present' : 'missing'}`);
    console.log(`[OAuth Callback:${requestId}] Redirect URI: ${redirectUri}`);

    if (!clientId || !clientSecret) {
      throw new Error("Meta application credentials are not configured on the server.");
    }
    
    // Step 1: Exchange authorization code for short-lived access token
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', clientId);
    tokenUrl.searchParams.append('redirect_uri', redirectUri);
    tokenUrl.searchParams.append('client_secret', clientSecret);
    tokenUrl.searchParams.append('code', code);

    console.log(`[OAuth Callback:${requestId}] Step 1: Exchanging authorization code for access token...`);
    console.log(`[OAuth Callback:${requestId}] Token URL: ${tokenUrl.toString().replace(clientSecret, '[REDACTED]')}`);
    
    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BrandForge-OAuth/1.0'
      }
    });
    
    console.log(`[OAuth Callback:${requestId}] Token response status: ${tokenResponse.status}`);
    
    const tokenData = await tokenResponse.json();
    console.log(`[OAuth Callback:${requestId}] Token response data:`, {
      ...tokenData,
      access_token: tokenData.access_token ? '[REDACTED]' : 'missing'
    });

    if (tokenData.error) {
      console.error(`[OAuth Callback:${requestId}] Token exchange error:`, tokenData.error);
      throw new Error(`Token exchange failed: ${tokenData.error.message} (Code: ${tokenData.error.code || 'unknown'})`);
    }

    if (!tokenData.access_token) {
      console.error(`[OAuth Callback:${requestId}] No access token in response:`, tokenData);
      throw new Error('No access token received from Meta');
    }

    const shortLivedToken = tokenData.access_token;
    const shortLivedExpiresIn = tokenData.expires_in;
    
    console.log(`[OAuth Callback:${requestId}] Step 1 complete - Short-lived token obtained (expires in ${shortLivedExpiresIn} seconds)`);

    // Step 2: Validate the short-lived token
    console.log(`[OAuth Callback:${requestId}] Step 2: Validating short-lived token...`);
    const validation = await validateMetaToken(shortLivedToken);
    
    if (!validation.isValid) {
      console.error(`[OAuth Callback:${requestId}] Token validation failed:`, validation.error);
      throw new Error(validation.error || 'Token validation failed');
    }
    
    console.log(`[OAuth Callback:${requestId}] Step 2 complete - Token validated for user:`, validation.userInfo);

    // Step 3: Exchange for long-lived token
    console.log(`[OAuth Callback:${requestId}] Step 3: Exchanging for long-lived token...`);
    const longLivedResult = await exchangeForLongLivedToken(shortLivedToken, clientId, clientSecret);
    
    let finalToken = shortLivedToken;
    let finalExpiresIn = shortLivedExpiresIn;
    
    if (longLivedResult.error) {
      console.warn(`[OAuth Callback:${requestId}] Long-lived token exchange failed, using short-lived token:`, longLivedResult.error);
    } else if (longLivedResult.token) {
      finalToken = longLivedResult.token;
      finalExpiresIn = longLivedResult.expiresIn;
      console.log(`[OAuth Callback:${requestId}] Step 3 complete - Long-lived token obtained (expires in ${finalExpiresIn} seconds)`);
    }

    // Step 4: Final validation of the token we're about to store
    console.log(`[OAuth Callback:${requestId}] Step 4: Final validation of token to be stored...`);
    const finalValidation = await validateMetaToken(finalToken);
    
    if (!finalValidation.isValid) {
      console.error(`[OAuth Callback:${requestId}] Final token validation failed:`, finalValidation.error);
      throw new Error(finalValidation.error || 'Final token validation failed');
    }

    // Step 5: Store the validated token
    console.log(`[OAuth Callback:${requestId}] Step 5: Storing validated token in Firestore...`);
    const credentialsRef = doc(db, 'userApiCredentials', userId);
    const tokenDataToStore = {
      accessToken: finalToken,
      expiresAt: finalExpiresIn ? new Date(Date.now() + finalExpiresIn * 1000) : null,
      updatedAt: serverTimestamp(),
      tokenType: longLivedResult.token ? 'long_lived' : 'short_lived',
      validatedAt: serverTimestamp(),
      metaUserId: finalValidation.userInfo?.id,
      metaUserName: finalValidation.userInfo?.name,
    };
    
    await setDoc(credentialsRef, { [platform]: tokenDataToStore }, { merge: true });
    console.log(`[OAuth Callback:${requestId}] Step 5 complete - Token stored successfully for user ${userId}`);
    
    // Step 6: Test the stored token by making a test API call
    console.log(`[OAuth Callback:${requestId}] Step 6: Testing stored token with pages API call...`);
    try {
      const testPagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${finalToken}&fields=id,name&limit=1`;
      const testResponse = await fetch(testPagesUrl);
      const testData = await testResponse.json();
      
      if (testData.error) {
        console.warn(`[OAuth Callback:${requestId}] Test pages API call failed:`, testData.error);
      } else {
        console.log(`[OAuth Callback:${requestId}] Step 6 complete - Token successfully tested with pages API`);
      }
    } catch (testError: any) {
      console.warn(`[OAuth Callback:${requestId}] Test API call failed:`, testError.message);
    }
    
    console.log(`[OAuth Callback:${requestId}] === OAUTH CALLBACK COMPLETED SUCCESSFULLY ===`);
    const finalRedirectUrl = new URL('/settings', origin);
    finalRedirectUrl.searchParams.set('connected', platform);
    finalRedirectUrl.searchParams.set('success', 'true');
    
    return NextResponse.redirect(finalRedirectUrl);

  } catch (e: any) {
    console.error(`[OAuth Callback:${requestId}] === OAUTH CALLBACK FAILED ===`);
    console.error(`[OAuth Callback:${requestId}] Error details:`, {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    
    const redirectUrl = new URL('/settings', origin || request.url);
    redirectUrl.searchParams.set('error', `Connection failed: ${e.message}`);
    redirectUrl.searchParams.set('error_type', 'token_exchange');
    return NextResponse.redirect(redirectUrl);
  }
}
