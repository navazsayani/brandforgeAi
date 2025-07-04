
"use client";

import React, { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { SavedGeneratedImage } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Images, UserCircle, FileImage, Trash2, Loader2 } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { handleDeleteSavedImageAction } from '@/lib/actions';
import type { FormState as DeleteFormState } from '@/lib/actions';


const fetchSavedLibraryImages = async (userId: string): Promise<SavedGeneratedImage[]> => {
  if (!userId) {
    throw new Error("User ID is required to fetch saved images.");
  }
  // The brandProfileDocId is the same as userId for user-specific brand profiles
  const brandProfileDocId = userId;
  const imagesCollectionRef = collection(db, `users/${userId}/brandProfiles/${brandProfileDocId}/savedLibraryImages`);
  const q = query(imagesCollectionRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const images: SavedGeneratedImage[] = [];
  querySnapshot.forEach((doc) => {
    images.push({ id: doc.id, ...doc.data() } as SavedGeneratedImage);
  });
  return images;
};

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            disabled={pending}
            title="Delete image"
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    );
}

function SavedImageCard({ image, userId }: { image: SavedGeneratedImage; userId: string }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const formRef = useRef<HTMLFormElement>(null);
    const initialDeleteState: DeleteFormState<{ success: boolean }> = { error: undefined, data: undefined };

    const [state, formAction] = useActionState(handleDeleteSavedImageAction, initialDeleteState);

    useEffect(() => {
        if (state.error) {
            toast({ title: "Deletion Failed", description: state.error, variant: "destructive" });
        }
        if (state.data?.success) {
            toast({ title: "Image Deleted", description: state.message });
            queryClient.invalidateQueries({ queryKey: ['savedLibraryImages', userId] });
        }
    }, [state, toast, queryClient, userId]);

    return (
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
            <div className="relative w-full aspect-square bg-muted overflow-hidden">
                <NextImage
                    src={image.storageUrl}
                    alt={`Saved image generated with prompt: ${image.prompt.substring(0, 50)}...`}
                    fill
                    style={{ objectFit: "contain" }}
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="library image"
                />
                <form action={formAction} ref={formRef}>
                    <input type="hidden" name="userId" value={userId} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <input type="hidden" name="storageUrl" value={image.storageUrl} />
                    <DeleteButton />
                </form>
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
    );
}


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
        {isLoadingUser || (isLoadingSaved && !user) && ( // Show skeletons if user is loading or saved images are loading AND user isn't available yet for query
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
        {!isLoadingSaved && !errorSaved && savedImages.length === 0 && user && ( // Only show "empty" if not loading, no error, and user is present (so query would have run)
          <Card className="shadow-sm">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Your AI-generated image library is empty.</p>
              <p className="text-sm text-muted-foreground">
                Generate images in the Content Studio and save them to see them here.
              </p>
            </CardContent>
          </Card>
        )}
        {!isLoadingSaved && !errorSaved && savedImages.length > 0 && user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {savedImages.map((image) => (
                <SavedImageCard key={image.id} image={image} userId={user.uid} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
