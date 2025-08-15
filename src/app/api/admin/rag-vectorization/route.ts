import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { ragEngine } from '@/lib/rag-engine';

interface VectorizationJob {
  id: string;
  type: 'all_users' | 'single_user' | 'content_type';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
  details: {
    userId?: string;
    userEmail?: string;
    brandName?: string;
    contentType?: string;
  };
}

// GET - Fetch vectorization jobs
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

    console.log('[RAG Vectorization API] Fetching vectorization jobs...');

    // Get jobs from admin collection
    const jobsRef = collection(db, 'adminJobs');
    const jobsQuery = query(jobsRef, where('type', '==', 'vectorization'));
    const jobsSnapshot = await getDocs(jobsQuery);

    const jobs: VectorizationJob[] = jobsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.jobType,
        status: data.status,
        progress: data.progress || 0,
        totalItems: data.totalItems || 0,
        processedItems: data.processedItems || 0,
        failedItems: data.failedItems || 0,
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        estimatedTimeRemaining: data.estimatedTimeRemaining,
        details: data.details || {}
      };
    });

    return NextResponse.json({ jobs });

  } catch (error) {
    console.error('[RAG Vectorization API] Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vectorization jobs' },
      { status: 500 }
    );
  }
}

// POST - Start, pause, resume, or cancel vectorization jobs
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
    const { action, type, userId, contentType, jobId } = body;

    console.log(`[RAG Vectorization API] Action: ${action}`);

    switch (action) {
      case 'start':
        return await startVectorizationJob(type, userId, contentType, adminEmail);
      
      case 'pause':
        return await controlJob(jobId, 'paused', adminEmail);
      
      case 'resume':
        return await controlJob(jobId, 'running', adminEmail);
      
      case 'cancel':
        return await controlJob(jobId, 'failed', adminEmail);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('[RAG Vectorization API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process vectorization request' },
      { status: 500 }
    );
  }
}

async function startVectorizationJob(
  type: 'all_users' | 'single_user' | 'content_type',
  userId?: string,
  contentType?: string,
  adminEmail?: string
) {
  try {
    // Generate job ID
    const jobId = `vectorization_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get job details based on type
    let jobDetails: any = {};
    let totalItems = 0;

    if (type === 'all_users') {
      // Count all users with content
      const usersSnapshot = await getDocs(collection(db, 'users'));
      totalItems = usersSnapshot.docs.length;
      jobDetails = { description: 'Vectorize all users content' };
      
    } else if (type === 'single_user' && userId) {
      // Get user details
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      // Get brand name from brand profiles subcollection
      let brandName = 'Unknown Brand';
      try {
        const brandProfilesSnapshot = await getDocs(collection(db, `users/${userId}/brandProfiles`));
        if (!brandProfilesSnapshot.empty) {
          const primaryBrandProfile = brandProfilesSnapshot.docs[0]?.data();
          brandName = primaryBrandProfile?.brandName || userData?.displayName || 'Unknown Brand';
        } else {
          // Fallback to user document fields if no brand profiles exist
          brandName = userData?.brandName || userData?.displayName || 'Unknown Brand';
        }
      } catch (error) {
        console.warn(`[RAG Vectorization API] Error fetching brand profile for user ${userId}:`, error);
        brandName = userData?.brandName || userData?.displayName || 'Unknown Brand';
      }
      
      totalItems = 1; // Will be updated when we count actual content
      jobDetails = {
        userId,
        userEmail: userData?.email || 'Unknown',
        brandName
      };
      
    } else if (type === 'content_type' && contentType) {
      // Count content of specific type across all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      totalItems = usersSnapshot.docs.length; // Approximate
      jobDetails = { contentType };
    }

    // Create job document
    const jobData = {
      type: 'vectorization',
      jobType: type,
      status: 'pending',
      progress: 0,
      totalItems,
      processedItems: 0,
      failedItems: 0,
      startedAt: new Date(),
      createdBy: adminEmail,
      details: jobDetails
    };

    await setDoc(doc(db, 'adminJobs', jobId), jobData);

    // Start the vectorization process asynchronously
    // Note: In a production environment, this would be handled by a background job queue
    processVectorizationJob(jobId, type, userId, contentType);

    return NextResponse.json({ 
      success: true, 
      message: `Vectorization job started: ${jobId}`,
      jobId 
    });

  } catch (error) {
    console.error('[RAG Vectorization API] Error starting job:', error);
    throw error;
  }
}

async function controlJob(jobId: string, newStatus: string, adminEmail?: string) {
  try {
    const jobRef = doc(db, 'adminJobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists()) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: adminEmail
    };

    if (newStatus === 'failed') {
      updateData.completedAt = new Date();
    }

    await setDoc(jobRef, updateData, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: `Job ${newStatus === 'failed' ? 'cancelled' : newStatus}` 
    });

  } catch (error) {
    console.error('[RAG Vectorization API] Error controlling job:', error);
    throw error;
  }
}

// Background job processor (simplified version)
async function processVectorizationJob(
  jobId: string, 
  type: 'all_users' | 'single_user' | 'content_type',
  userId?: string,
  contentType?: string
) {
  try {
    console.log(`[RAG Vectorization] Starting job ${jobId} of type ${type}`);
    
    // Update job status to running
    await setDoc(doc(db, 'adminJobs', jobId), {
      status: 'running',
      startedAt: new Date()
    }, { merge: true });

    let processedItems = 0;
    let failedItems = 0;
    let totalItems = 0;

    if (type === 'all_users') {
      // Process all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      totalItems = usersSnapshot.docs.length;
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          // Check if job is still running
          const jobDoc = await getDoc(doc(db, 'adminJobs', jobId));
          if (jobDoc.data()?.status !== 'running') {
            console.log(`[RAG Vectorization] Job ${jobId} was paused/cancelled`);
            break;
          }

          const result = await processUserContent(userDoc.id);
          processedItems += result.processed;
          failedItems += result.failed;
          
          // Update progress
          const progress = (processedItems / totalItems) * 100;
          await setDoc(doc(db, 'adminJobs', jobId), {
            progress,
            processedItems,
            failedItems,
            totalItems
          }, { merge: true });
          
        } catch (error) {
          console.error(`[RAG Vectorization] Error processing user ${userDoc.id}:`, error);
          failedItems++;
        }
      }
      
    } else if (type === 'single_user' && userId) {
      // Process single user
      try {
        const result = await processUserContent(userId);
        processedItems = result.processed;
        failedItems = result.failed;
        totalItems = result.processed + result.failed + result.skipped;
        
        console.log(`[RAG Vectorization] Single user processing complete: ${result.processed} processed, ${result.failed} failed, ${result.skipped} skipped`);
      } catch (error) {
        console.error(`[RAG Vectorization] Error processing user ${userId}:`, error);
        failedItems = 1;
        totalItems = 1;
      }
    }

    // Mark job as completed
    await setDoc(doc(db, 'adminJobs', jobId), {
      status: 'completed',
      progress: 100,
      processedItems,
      failedItems,
      totalItems,
      completedAt: new Date()
    }, { merge: true });

    console.log(`[RAG Vectorization] Job ${jobId} completed. Processed: ${processedItems}, Failed: ${failedItems}`);

  } catch (error: any) {
    console.error(`[RAG Vectorization] Job ${jobId} failed:`, error);
    
    // Mark job as failed
    await setDoc(doc(db, 'adminJobs', jobId), {
      status: 'failed',
      completedAt: new Date(),
      error: error.message || 'Unknown error'
    }, { merge: true });
  }
}

async function processUserContent(userId: string): Promise<{ processed: number; failed: number; skipped: number }> {
  console.log(`[RAG Vectorization] Processing content for user: ${userId}`);
  
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // Get existing vectors to avoid duplicates
    const existingVectorsSnapshot = await getDocs(collection(db, `users/${userId}/ragVectors`));
    const existingContentIds = new Set(
      existingVectorsSnapshot.docs.map(doc => doc.data().contentId)
    );

    // Process Brand Profiles
    try {
      const brandProfilesSnapshot = await getDocs(collection(db, `users/${userId}/brandProfiles`));
      console.log(`[RAG Vectorization] Found ${brandProfilesSnapshot.docs.length} brand profiles for user ${userId}`);
      
      for (const brandDoc of brandProfilesSnapshot.docs) {
        const contentId = `brand_${brandDoc.id}`;
        
        if (existingContentIds.has(contentId)) {
          skipped++;
          continue;
        }

        try {
          const brandData = brandDoc.data();
          const textContent = [
            brandData.brandName ? `Brand: ${brandData.brandName}` : '',
            brandData.description ? `Description: ${brandData.description}` : '',
            brandData.industry ? `Industry: ${brandData.industry}` : '',
            brandData.targetAudience ? `Target Audience: ${brandData.targetAudience}` : '',
            brandData.brandVoice ? `Brand Voice: ${brandData.brandVoice}` : '',
            brandData.values ? `Values: ${brandData.values.join(', ')}` : '',
            brandData.uniqueSellingPoints ? `USPs: ${brandData.uniqueSellingPoints.join(', ')}` : ''
          ].filter(Boolean).join('\n');

          if (textContent.trim()) {
            await ragEngine.storeContentVector(
              userId,
              'brand_profile',
              contentId,
              textContent,
              {
                industry: brandData.industry,
                style: brandData.brandVoice,
                performance: 0.7, // Default good performance for brand profiles
                createdAt: brandData.createdAt || new Date(),
                updatedAt: brandData.updatedAt || new Date(),
                version: 1
              },
              'brandProfiles',
              brandDoc.id
            );
            processed++;
            console.log(`[RAG Vectorization] Vectorized brand profile: ${brandDoc.id}`);
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`[RAG Vectorization] Error processing brand profile ${brandDoc.id}:`, error);
          failed++;
        }
      }
    } catch (error) {
      console.error(`[RAG Vectorization] Error querying brand profiles for user ${userId}:`, error);
    }

    // Process Social Media Posts
    try {
      const socialMediaSnapshot = await getDocs(collection(db, `users/${userId}/socialMediaPosts`));
      console.log(`[RAG Vectorization] Found ${socialMediaSnapshot.docs.length} social media posts for user ${userId}`);
      
      for (const postDoc of socialMediaSnapshot.docs) {
        const contentId = `social_${postDoc.id}`;
        
        if (existingContentIds.has(contentId)) {
          skipped++;
          continue;
        }

        try {
          const postData = postDoc.data();
          const textContent = [
            postData.caption ? `Caption: ${postData.caption}` : '',
            postData.hashtags ? `Hashtags: ${postData.hashtags.join(' ')}` : '',
            postData.platform ? `Platform: ${postData.platform}` : '',
            postData.tone ? `Tone: ${postData.tone}` : ''
          ].filter(Boolean).join('\n');

          if (textContent.trim()) {
            await ragEngine.storeContentVector(
              userId,
              'social_media',
              contentId,
              textContent,
              {
                platform: postData.platform,
                style: postData.tone,
                performance: postData.engagement || 0.5,
                engagement: postData.likes || 0,
                tags: postData.hashtags || [],
                createdAt: postData.createdAt || new Date(),
                updatedAt: postData.updatedAt || new Date(),
                version: 1
              },
              'socialMediaPosts',
              postDoc.id
            );
            processed++;
            console.log(`[RAG Vectorization] Vectorized social media post: ${postDoc.id}`);
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`[RAG Vectorization] Error processing social media post ${postDoc.id}:`, error);
          failed++;
        }
      }
    } catch (error) {
      console.error(`[RAG Vectorization] Error querying social media posts for user ${userId}:`, error);
    }

    // Process Blog Posts
    try {
      const blogPostsSnapshot = await getDocs(collection(db, `users/${userId}/blogPosts`));
      console.log(`[RAG Vectorization] Found ${blogPostsSnapshot.docs.length} blog posts for user ${userId}`);
      
      for (const blogDoc of blogPostsSnapshot.docs) {
        const contentId = `blog_${blogDoc.id}`;
        
        if (existingContentIds.has(contentId)) {
          skipped++;
          continue;
        }

        try {
          const blogData = blogDoc.data();
          const textContent = [
            blogData.title ? `Title: ${blogData.title}` : '',
            blogData.content ? `Content: ${blogData.content.substring(0, 1000)}` : '',
            blogData.tags ? `Tags: ${blogData.tags.join(', ')}` : '',
            blogData.tone ? `Tone: ${blogData.tone}` : ''
          ].filter(Boolean).join('\n');

          if (textContent.trim()) {
            await ragEngine.storeContentVector(
              userId,
              'blog_post',
              contentId,
              textContent,
              {
                style: blogData.tone,
                performance: blogData.views ? Math.min(blogData.views / 1000, 1) : 0.5,
                tags: blogData.tags || [],
                createdAt: blogData.createdAt || new Date(),
                updatedAt: blogData.updatedAt || new Date(),
                version: 1
              },
              'blogPosts',
              blogDoc.id
            );
            processed++;
            console.log(`[RAG Vectorization] Vectorized blog post: ${blogDoc.id}`);
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`[RAG Vectorization] Error processing blog post ${blogDoc.id}:`, error);
          failed++;
        }
      }
    } catch (error) {
      console.error(`[RAG Vectorization] Error querying blog posts for user ${userId}:`, error);
    }

    // Process Saved Images
    try {
      const savedImagesSnapshot = await getDocs(collection(db, `users/${userId}/savedImages`));
      console.log(`[RAG Vectorization] Found ${savedImagesSnapshot.docs.length} saved images for user ${userId}`);
      
      for (const imageDoc of savedImagesSnapshot.docs) {
        const contentId = `image_${imageDoc.id}`;
        
        if (existingContentIds.has(contentId)) {
          skipped++;
          continue;
        }

        try {
          const imageData = imageDoc.data();
          const textContent = [
            imageData.prompt ? `Prompt: ${imageData.prompt}` : '',
            imageData.style ? `Style: ${imageData.style}` : '',
            imageData.description ? `Description: ${imageData.description}` : '',
            imageData.tags ? `Tags: ${imageData.tags.join(', ')}` : ''
          ].filter(Boolean).join('\n');

          if (textContent.trim()) {
            await ragEngine.storeContentVector(
              userId,
              'saved_image',
              contentId,
              textContent,
              {
                style: imageData.style,
                performance: imageData.rating || 0.5,
                tags: imageData.tags || [],
                createdAt: imageData.createdAt || new Date(),
                updatedAt: imageData.updatedAt || new Date(),
                version: 1
              },
              'savedImages',
              imageDoc.id
            );
            processed++;
            console.log(`[RAG Vectorization] Vectorized saved image: ${imageDoc.id}`);
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`[RAG Vectorization] Error processing saved image ${imageDoc.id}:`, error);
          failed++;
        }
      }
    } catch (error) {
      console.error(`[RAG Vectorization] Error querying saved images for user ${userId}:`, error);
    }

    // Process Ad Campaigns
    try {
      const adCampaignsSnapshot = await getDocs(collection(db, `users/${userId}/adCampaigns`));
      console.log(`[RAG Vectorization] Found ${adCampaignsSnapshot.docs.length} ad campaigns for user ${userId}`);
      
      for (const campaignDoc of adCampaignsSnapshot.docs) {
        const contentId = `campaign_${campaignDoc.id}`;
        
        if (existingContentIds.has(contentId)) {
          skipped++;
          continue;
        }

        try {
          const campaignData = campaignDoc.data();
          const textContent = [
            campaignData.title ? `Campaign: ${campaignData.title}` : '',
            campaignData.description ? `Description: ${campaignData.description}` : '',
            campaignData.targetAudience ? `Target: ${campaignData.targetAudience}` : '',
            campaignData.platforms ? `Platforms: ${campaignData.platforms.join(', ')}` : '',
            campaignData.tone ? `Tone: ${campaignData.tone}` : ''
          ].filter(Boolean).join('\n');

          if (textContent.trim()) {
            await ragEngine.storeContentVector(
              userId,
              'ad_campaign',
              contentId,
              textContent,
              {
                style: campaignData.tone,
                performance: campaignData.performance || 0.5,
                tags: campaignData.platforms || [],
                createdAt: campaignData.createdAt || new Date(),
                updatedAt: campaignData.updatedAt || new Date(),
                version: 1
              },
              'adCampaigns',
              campaignDoc.id
            );
            processed++;
            console.log(`[RAG Vectorization] Vectorized ad campaign: ${campaignDoc.id}`);
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`[RAG Vectorization] Error processing ad campaign ${campaignDoc.id}:`, error);
          failed++;
        }
      }
    } catch (error) {
      console.error(`[RAG Vectorization] Error querying ad campaigns for user ${userId}:`, error);
    }

    console.log(`[RAG Vectorization] Completed processing for user ${userId}: ${processed} processed, ${failed} failed, ${skipped} skipped`);
    return { processed, failed, skipped };

  } catch (error) {
    console.error(`[RAG Vectorization] Error processing user content for ${userId}:`, error);
    throw error;
  }
}