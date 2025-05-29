
"use client";

import React, { useEffect, useState } from 'react';
import NextImage from 'next/image';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import type { SavedGeneratedImage } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Images } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';

// Assuming a fixed brand profile ID for now, as per current app structure
const BRAND_PROFILE_DOC_ID = "defaultBrandProfile";

export default function ImageLibraryPage() {
  const [savedImages, setSavedImages] = useState<SavedGeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedImages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const imagesCollectionRef = collection(db, `brandProfiles/${BRAND_PROFILE_DOC_ID}/savedLibraryImages`);
        // Order by creation time, newest first, and limit for pagination in the future
        const q = query(imagesCollectionRef, orderBy("createdAt", "desc"), limit(20)); 
        const querySnapshot = await getDocs(q);
        
        const images: SavedGeneratedImage[] = [];
        querySnapshot.forEach((doc) => {
          images.push({ id: doc.id, ...doc.data() } as SavedGeneratedImage);
        });
        setSavedImages(images);
      } catch (e: any) {
        console.error("Error fetching saved images:", e);
        setError(`Failed to load saved images: ${e.message}. Check Firestore permissions and connectivity.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedImages();
  }, []);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <CardHeader className="px-0 mb-6">
          <div className="flex items-center space-x-3">
            <Images className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">Image Library</CardTitle>
              <CardDescription className="text-lg">
                Browse your saved AI-generated images.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full aspect-square bg-muted" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2 bg-muted" />
                  <Skeleton className="h-3 w-1/2 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Images</AlertTitle>
            <p>{error}</p>
          </Alert>
        )}

        {!isLoading && !error && savedImages.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="pt-6 text-center">
              <p className="text-lg text-muted-foreground">Your image library is empty.</p>
              <p className="text-sm text-muted-foreground">
                Generate images in the Content Studio and save them to see them here.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && savedImages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {savedImages.map((image) => (
              <Card key={image.id} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
                <div className="relative w-full aspect-square bg-muted overflow-hidden">
                  <NextImage
                    src={image.storageUrl}
                    alt={`Saved image generated with prompt: ${image.prompt.substring(0, 50)}...`}
                    fill
                    style={{objectFit: "contain"}}
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="library image"
                  />
                </div>
                <CardContent className="p-3 space-y-1">
                  <p className="text-xs text-muted-foreground truncate" title={image.prompt}>
                    <strong>Prompt:</strong> {image.prompt || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={image.style}>
                    <strong>Style:</strong> {image.style || 'N/A'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
