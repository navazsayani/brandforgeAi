import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const adminEmail = request.headers.get('x-admin-email');
    if (adminEmail !== 'admin@brandforge.ai') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    console.log('[RAG Admin API] Fetching limited users...');

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const limitedUserIds: string[] = [];

    // Check each user for rate limiting settings
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;
        const rateLimitDoc = await getDoc(doc(db, `users/${userId}/adminSettings`, 'ragRateLimit'));
        
        if (rateLimitDoc.exists()) {
          const rateLimitData = rateLimitDoc.data();
          if (rateLimitData.enabled === true) {
            limitedUserIds.push(userId);
          }
        }
      } catch (error) {
        console.error(`[RAG Admin API] Error checking rate limit for user ${userDoc.id}:`, error);
      }
    }

    console.log(`[RAG Admin API] Found ${limitedUserIds.length} limited users`);

    return NextResponse.json({ limitedUserIds });

  } catch (error) {
    console.error('[RAG Admin API] Error fetching limited users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch limited users' },
      { status: 500 }
    );
  }
}