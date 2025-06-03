
"use client";

import React from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { SavedGeneratedImage } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Images, UserCircle, FileImage } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

// const BRAND_PROFILE_DOC_ID = "defaultBrandProfile"; // Not used directly in this component after refactor

const fetchSavedLibraryImages = async (userId: string): Promise<SavedGeneratedImage[]> => {
  if (!userId) {
    throw new Error("User ID is required to fetch saved images.");
  }
  const imagesCollectionRef = collection(db, `users/${userId}/brandProfiles/defaultBrandProfile/savedLibraryImages`);
  const q = query(imagesCollectionRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const images: SavedGeneratedImage[] = [];
  querySnapshot.forEach((doc) => {
    images.push({ id: doc.id, ...doc.data() } as SavedGeneratedImage);
  });
  return images;
};

export default function ImageLibraryPage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const { brandData, isLoading: isLoadingBrand, error: errorBrand } = useBrand();

  const { 
    data: savedImages = [], 
    isLoading: isLoadingSaved, 
    error: errorSavedFetch 
  } = useQuery<SavedGeneratedImage[], Error>({
    queryKey: ['savedLibraryImages', user?.uid],
    queryFn: () => fetchSavedLibraryImages(user!.uid),
    enabled: !!user, // Only run query if user is available
  });
  
  const errorSaved = errorSavedFetch ? `Failed to load AI-generated images: ${errorSavedFetch.message}. Check Firestore permissions and connectivity.` : null;

  const brandProfileImages = brandData?.exampleImages || [];

  return (
    // AppShell is now handled by AuthenticatedLayout
    <div className="max-w-6xl mx-auto">
      <CardHeader className="px-0 mb-6">
        <div className="flex items-center space-x-3">
          <Images className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-3xl font-bold">Image Library</CardTitle>
            <CardDescription className="text-lg">
              Browse your saved AI-generated images and Brand Profile example images.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Section for Brand Profile Example Images */}
      <section className="mb-12">
        <h2 className="flex items-center mb-6 text-2xl font-semibold">
          <UserCircle className="w-7 h-7 mr-3 text-primary" />
          Brand Profile Example Images ({brandProfileImages.length})
        </h2>
        {isLoadingBrand && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={`brand-skeleton-${i}`} className="overflow-hidden">
                <Skeleton className="w-full aspect-square bg-muted" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-20 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {errorBrand && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Brand Profile Images</AlertTitle>
            <p>{errorBrand}</p>
          </Alert>
        )}
        {!isLoadingBrand && !errorBrand && brandProfileImages.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No example images uploaded to your Brand Profile.</p>
              <p className="text-sm text-muted-foreground">Visit the Brand Profile page to add some.</p>
            </CardContent>
          </Card>
        )}
        {!isLoadingBrand && !errorBrand && brandProfileImages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brandProfileImages.map((imageUrl, index) => (
              <Card key={`brand-img-${index}`} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
                <div className="relative w-full aspect-square bg-muted overflow-hidden">
                  <NextImage
                    src={imageUrl}
                    alt={`Brand profile example image ${index + 1}`}
                    fill
                    style={{ objectFit: "contain" }}
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="brand example"
                  />
                </div>
                  <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground truncate">Profile Image {index + 1}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section for AI-Generated Library Images */}
      <section className="mb-12">
        <h2 className="flex items-center mb-6 text-2xl font-semibold">
          <FileImage className="w-7 h-7 mr-3 text-primary" />
          AI-Generated Library Images ({savedImages.length})
        </h2>
        {isLoadingSaved && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={`ai-skeleton-${i}`} className="overflow-hidden">
                <Skeleton className="w-full aspect-square bg-muted" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2 bg-muted" />
                  <Skeleton className="h-3 w-1/2 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {errorSaved && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading AI-Generated Images</AlertTitle>
            <p>{errorSaved}</p>
          </Alert>
        )}
        {!isLoadingSaved && !errorSaved && savedImages.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Your AI-generated image library is empty.</p>
              <p className="text-sm text-muted-foreground">
                Generate images in the Content Studio and save them to see them here.
              </p>
            </CardContent>
          </Card>
        )}
        {!isLoadingSaved && !errorSaved && savedImages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {savedImages.map((image) => (
              <Card key={image.id} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
                <div className="relative w-full aspect-square bg-muted overflow-hidden">
                  <NextImage
                    src={image.storageUrl}
                    alt={`Saved image generated with prompt: ${image.prompt.substring(0, 50)}...`}
                    fill
                    style={{ objectFit: "contain" }}
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
      </section>
    </div>
  );
}
