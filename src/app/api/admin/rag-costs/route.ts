import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit, doc, setDoc } from 'firebase/firestore';

interface RAGCostMetrics {
  totalEmbeddings: number;
  estimatedMonthlyCost: number;
  costPerUser: number;
  activeUsers: number;
  lastUpdated: Date;
  recentActivity: {
    date: string;
    embeddings: number;
    cost: number;
  }[];
  topUsers: {
    userId: string;
    userEmail: string;
    brandName: string;
    embeddings: number;
    cost: number;
    lastActivity: string;
    avgPerformance: number;
  }[];
}

// Cost per 1K embeddings for OpenAI text-embedding-3-small
const COST_PER_1K_EMBEDDINGS = 0.02; // $0.02 per 1K embeddings

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

    console.log('[RAG Admin API] Fetching real RAG cost metrics...');

    // Get all users to calculate metrics
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userIds = usersSnapshot.docs.map(doc => doc.id);

    let totalEmbeddings = 0;
    let activeUsers = 0;
    const userMetrics: { [userId: string]: {
      embeddings: number;
      cost: number;
      userEmail: string;
      brandName: string;
      lastActivity: Date;
      avgPerformance: number;
    } } = {};
    const recentActivity: { [date: string]: { embeddings: number; cost: number; users: Set<string> } } = {};

    // Calculate metrics for each user
    for (const userId of userIds) {
      try {
        // Get user profile information
        const userDoc = usersSnapshot.docs.find(doc => doc.id === userId);
        const userData = userDoc?.data();
        const userEmail = userData?.email || 'Unknown';
        const brandName = userData?.brandName || userData?.displayName || 'Unknown Brand';

        // Get user's RAG vectors
        const vectorsRef = collection(db, `users/${userId}/ragVectors`);
        const vectorsSnapshot = await getDocs(vectorsRef);
        
        const userEmbeddings = vectorsSnapshot.docs.length;
        
        if (userEmbeddings > 0) {
          activeUsers++;
          totalEmbeddings += userEmbeddings;
          
          const userCost = (userEmbeddings / 1000) * COST_PER_1K_EMBEDDINGS;
          
          // Calculate average performance and last activity
          let totalPerformance = 0;
          let performanceCount = 0;
          let lastActivity = new Date(0);

          // Track recent activity (last 30 days) and calculate performance
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          vectorsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const createdAt = data.metadata?.createdAt?.toDate?.() || new Date(data.metadata?.createdAt);
            const performance = data.metadata?.performance || 0;
            
            // Track performance
            if (performance > 0) {
              totalPerformance += performance;
              performanceCount++;
            }
            
            // Track last activity
            if (createdAt > lastActivity) {
              lastActivity = createdAt;
            }
            
            // Track recent activity for charts
            if (createdAt >= thirtyDaysAgo) {
              const dateKey = createdAt.toISOString().split('T')[0];
              if (!recentActivity[dateKey]) {
                recentActivity[dateKey] = { embeddings: 0, cost: 0, users: new Set() };
              }
              recentActivity[dateKey].embeddings += 1;
              recentActivity[dateKey].cost += COST_PER_1K_EMBEDDINGS / 1000;
              recentActivity[dateKey].users.add(userId);
            }
          });

          const avgPerformance = performanceCount > 0 ? totalPerformance / performanceCount : 0;

          userMetrics[userId] = {
            embeddings: userEmbeddings,
            cost: userCost,
            userEmail,
            brandName,
            lastActivity,
            avgPerformance
          };
        }
      } catch (error) {
        console.error(`[RAG Admin API] Error processing user ${userId}:`, error);
      }
    }

    // Calculate costs
    const estimatedMonthlyCost = (totalEmbeddings / 1000) * COST_PER_1K_EMBEDDINGS;
    const costPerUser = activeUsers > 0 ? estimatedMonthlyCost / activeUsers : 0;

    // Get top users by cost
    const topUsers = Object.entries(userMetrics)
      .sort(([,a], [,b]) => b.cost - a.cost)
      .slice(0, 10)
      .map(([userId, metrics]) => ({
        userId,
        userEmail: metrics.userEmail,
        brandName: metrics.brandName,
        embeddings: metrics.embeddings,
        cost: metrics.cost,
        lastActivity: metrics.lastActivity.toISOString(),
        avgPerformance: metrics.avgPerformance
      }));

    // Format recent activity with enhanced data
    const recentActivityArray = Object.entries(recentActivity)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Last 7 days
      .map(([date, metrics]) => ({
        date,
        embeddings: metrics.embeddings,
        cost: metrics.cost,
        activeUsers: metrics.users.size
      }));

    const metrics: RAGCostMetrics = {
      totalEmbeddings,
      estimatedMonthlyCost,
      costPerUser,
      activeUsers,
      lastUpdated: new Date(),
      recentActivity: recentActivityArray,
      topUsers
    };

    console.log(`[RAG Admin API] Calculated metrics:`, {
      totalEmbeddings,
      estimatedMonthlyCost: estimatedMonthlyCost.toFixed(4),
      activeUsers,
      topUsersCount: topUsers.length
    });

    return NextResponse.json({ data: metrics });

  } catch (error) {
    console.error('[RAG Admin API] Error fetching RAG costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RAG cost metrics' },
      { status: 500 }
    );
  }
}

// POST endpoint for rate limiting controls
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const adminEmail = request.headers.get('x-admin-email');
    if (adminEmail !== 'admin@brandforge.ai') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userId } = body;

    console.log(`[RAG Admin API] Rate limiting action: ${action} for user: ${userId || 'all'}`);

    switch (action) {
      case 'enable_global_rate_limiting':
        // Store global rate limiting setting
        await setDoc(doc(db, 'adminSettings', 'ragRateLimiting'), {
          enabled: true,
          maxEmbeddingsPerHour: 50,
          maxEmbeddingsPerDay: 500,
          enabledAt: new Date(),
          enabledBy: adminEmail
        });
        
        console.log('[RAG Admin API] Global rate limiting enabled');
        return NextResponse.json({ success: true, message: 'Global rate limiting enabled' });

      case 'disable_global_rate_limiting':
        await setDoc(doc(db, 'adminSettings', 'ragRateLimiting'), {
          enabled: false,
          disabledAt: new Date(),
          disabledBy: adminEmail
        });
        
        console.log('[RAG Admin API] Global rate limiting disabled');
        return NextResponse.json({ success: true, message: 'Global rate limiting disabled' });

      case 'limit_user':
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        
        // Set user-specific rate limit
        await setDoc(doc(db, `users/${userId}/adminSettings`, 'ragRateLimit'), {
          enabled: true,
          maxEmbeddingsPerHour: 10,
          maxEmbeddingsPerDay: 100,
          limitedAt: new Date(),
          limitedBy: adminEmail
        });
        
        console.log(`[RAG Admin API] Rate limiting enabled for user: ${userId}`);
        return NextResponse.json({ success: true, message: `Rate limiting enabled for user ${userId}` });

      case 'unlimit_user':
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        
        // Remove user-specific rate limit
        await setDoc(doc(db, `users/${userId}/adminSettings`, 'ragRateLimit'), {
          enabled: false,
          unlimitedAt: new Date(),
          unlimitedBy: adminEmail
        });
        
        console.log(`[RAG Admin API] Rate limiting removed for user: ${userId}`);
        return NextResponse.json({ success: true, message: `Rate limiting removed for user ${userId}` });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('[RAG Admin API] Error in rate limiting action:', error);
    return NextResponse.json(
      { error: 'Failed to execute rate limiting action' },
      { status: 500 }
    );
  }
}