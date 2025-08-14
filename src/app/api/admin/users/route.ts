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
    
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || 'Unknown',
        brandName: data.brandName || data.displayName || 'Unknown Brand'
      };
    }).filter(user => user.email !== 'Unknown'); // Filter out users without email

    console.log(`[Admin Users API] Found ${users.length} users`);

    return NextResponse.json({ users });

  } catch (error) {
    console.error('[Admin Users API] Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}