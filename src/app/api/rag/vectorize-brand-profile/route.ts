import { NextRequest, NextResponse } from 'next/server';
import { vectorizeBrandProfile, vectorizeBrandLogo, shouldReVectorize } from '@/lib/rag-auto-vectorizer';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, serverTimestamp, collection, getDocs, query as fsQuery, where, limit as fsLimit } from 'firebase/firestore';

type BrandShape = {
  brandName?: string;
  brandDescription?: string;
  industry?: string;
  targetKeywords?: string;
  imageStyleNotes?: string;
  websiteUrl?: string;
  brandLogoUrl?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId: string;
      oldBrand?: BrandShape | null;
      newBrand: BrandShape;
    };

    const { userId, oldBrand, newBrand } = body || {};

    if (!userId || !newBrand) {
      return NextResponse.json({ error: 'Missing userId or newBrand' }, { status: 400 });
    }

    // Optional safety switch to skip server-side vectorization if Cloud Functions are re-enabled
    if (process.env.NEXT_PUBLIC_RAG_USE_CLOUD_FUNCTIONS === 'true') {
      return NextResponse.json({ skipped: true, reason: 'Cloud Functions flag enabled' });
    }

    // Threshold-aware re-vectorization for brand profile text
    const oldContent = oldBrand
      ? `${oldBrand.brandDescription || ''} ${oldBrand.targetKeywords || ''} ${oldBrand.imageStyleNotes || ''}`
      : '';
    const newContent = `${newBrand.brandDescription || ''} ${newBrand.targetKeywords || ''} ${newBrand.imageStyleNotes || ''}`;

    const shouldVectorizeText = !oldBrand || shouldReVectorize(oldContent, newContent);

    if (shouldVectorizeText) {
      try {
        await vectorizeBrandProfile(userId, newBrand as any);
        // no-throw: keep non-blocking
      } catch (err) {
        console.error('[RAG API] vectorizeBrandProfile failed:', err);
      }
    }

    // Logo vectorization on change when saved from Brand Profile page
    const oldLogoUrl = (oldBrand?.brandLogoUrl || '').trim();
    const newLogoUrl = (newBrand?.brandLogoUrl || '').trim();

    const logoChanged = !!newLogoUrl && oldLogoUrl !== newLogoUrl;

    // Track whether we actually vectorized the logo (avoid duplicates)
    let didLogoVectorize = false;

    if (logoChanged) {
      try {
        // Avoid duplicate logo vectors if already created by the dedicated logo action
        const vectorsRef = collection(db, `users/${userId}/ragVectors`);
        const existingLogoQ = fsQuery(
          vectorsRef,
          where('contentId', '==', 'currentLogo'),
          where('contentType', '==', 'brand_logo'),
          fsLimit(1)
        );
        const existingLogoDocs = await getDocs(existingLogoQ);

        if (existingLogoDocs.empty) {
          // Upsert a consistent logo document similar to the dedicated logo action
          const logoDocRef = doc(db, `users/${userId}/brandProfiles/${userId}/brandLogos`, 'currentLogo');
          await setDoc(
            logoDocRef,
            {
              logoUrl: newLogoUrl,
              updatedAt: serverTimestamp(),
              // createdAt only if first time; merge will not overwrite if already present
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );

          await vectorizeBrandLogo(
            userId,
            { logoData: newLogoUrl, createdAt: new Date() },
            'currentLogo'
          );
          didLogoVectorize = true;
        } else {
          // Already vectorized previously via another flow; skip to prevent duplicate vectors
          didLogoVectorize = false;
        }
      } catch (err) {
        console.error('[RAG API] vectorizeBrandLogo failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      textVectorized: shouldVectorizeText,
      logoVectorized: didLogoVectorize,
    });
  } catch (error: any) {
    console.error('[RAG API] Error in vectorize-brand-profile route:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}