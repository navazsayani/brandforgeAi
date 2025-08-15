import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// GET - Fetch users for admin operations
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

    console.log('[Admin Users API] Fetching users for admin operations...');

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const users = await Promise.all(
      usersSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get brand name from brand profiles subcollection
        let brandName = 'Unknown Brand';
        try {
          const brandProfilesSnapshot = await getDocs(collection(db, `users/${doc.id}/brandProfiles`));
          if (!brandProfilesSnapshot.empty) {
            const primaryBrandProfile = brandProfilesSnapshot.docs[0]?.data();
            brandName = primaryBrandProfile?.brandName || data.displayName || 'Unknown Brand';
          } else {
            // Fallback to user document fields if no brand profiles exist
            brandName = data.brandName || data.displayName || 'Unknown Brand';
          }
        } catch (error) {
          console.warn(`[Admin Users API] Error fetching brand profile for user ${doc.id}:`, error);
          brandName = data.brandName || data.displayName || 'Unknown Brand';
        }
        
        return {
          id: doc.id,
          email: data.email || 'Unknown',
          brandName
        };
      })
    );
    
    const filteredUsers = users.filter(user => user.email !== 'Unknown'); // Filter out users without email

    console.log(`[Admin Users API] Found ${filteredUsers.length} users`);

    return NextResponse.json({ users: filteredUsers });

  } catch (error) {
    console.error('[Admin Users API] Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}