
"use client";

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import NextImage from 'next/image';
import { BrandProfileImage, LibraryImage } from '@/components/SafeImage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { db, storage } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import type { SavedGeneratedImage } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Images, UserCircle, FileImage, Trash2, Loader2, Wand2, Download, Paintbrush } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { handleDeleteSavedImageAction } from '@/lib/actions';
import type { FormState as DeleteFormState } from '@/lib/actions';
import { RefineImageDialog } from '@/components/RefineImageDialog';
import { checkFirebaseStorageUrl } from '@/lib/client-storage-utils';
import Link from 'next/link';


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

// Download handler function
const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.target = '_blank'; // For external URLs
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Delete brand profile image handler function
const handleDeleteBrandProfileImage = async (
    imageUrl: string,
    imageIndex: number,
    brandData: any,
    setBrandData: any,
    userId: string,
    toast: any
) => {
    if (!brandData || !brandData.exampleImages) {
        toast({ title: "Error", description: "No brand data available", variant: "destructive" });
        return;
    }

    try {
        // First, try to delete the image from Firebase Storage
        let storageDeleted = false;
        try {
            // Extract storage path from URL
            if (imageUrl.includes('firebase') && imageUrl.includes('appspot.com')) {
                const urlObj = new URL(imageUrl);
                const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
                if (pathMatch) {
                    const storagePath = decodeURIComponent(pathMatch[1]);
                    const fileRef = storageRef(storage, storagePath);
                    await deleteObject(fileRef);
                    storageDeleted = true;
                    console.log(`✓ Deleted storage file: ${storagePath}`);
                }
            }
        } catch (storageError: any) {
            console.warn('Could not delete from storage (file may not exist):', storageError.message);
            // Continue with database deletion even if storage deletion fails
        }

        // Create a new array without the deleted image
        const updatedExampleImages = brandData.exampleImages.filter((_: string, index: number) => index !== imageIndex);
        
        // Update the brand data
        const updatedBrandData = {
            ...brandData,
            exampleImages: updatedExampleImages
        };

        await setBrandData(updatedBrandData, userId);
        
        const message = storageDeleted
            ? "Brand profile image has been removed from both storage and database successfully."
            : "Brand profile image reference has been removed from database successfully.";
            
        toast({ title: "Image Deleted", description: message });
    } catch (error) {
        console.error('Error deleting brand profile image:', error);
        toast({ title: "Deletion Failed", description: "Failed to delete the image. Please try again.", variant: "destructive" });
    }
};

function SavedImageCard({ image, userId, onRefineClick }: { image: SavedGeneratedImage; userId: string; onRefineClick: (url: string) => void; }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const formRef = useRef<HTMLFormElement>(null);
    const initialDeleteState: DeleteFormState<{ success: boolean }> = { error: undefined, data: undefined };
    const [isCheckingOrphan, setIsCheckingOrphan] = useState(false);

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

    const handleEnhancedDelete = async () => {
        setIsCheckingOrphan(true);
        
        try {
            // Check if the image actually exists in storage
            const imageExists = await checkFirebaseStorageUrl(image.storageUrl);
            
            if (!imageExists) {
                // Image is orphaned - show special message and proceed with deletion
                toast({
                    title: "Orphaned Image Detected",
                    description: "This image reference is outdated. Cleaning up...",
                    variant: "default"
                });
            }
            
            // Proceed with normal deletion (which will handle both cases)
            if (formRef.current) {
                const formData = new FormData(formRef.current);
                formAction(formData);
            }
        } catch (error) {
            console.warn('Error checking image existence:', error);
            // If check fails, proceed with normal deletion
            if (formRef.current) {
                const formData = new FormData(formRef.current);
                formAction(formData);
            }
        } finally {
            setIsCheckingOrphan(false);
        }
    };

    return (
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-shadow group flex flex-col">
            <div className="relative w-full aspect-square bg-muted overflow-hidden">
                <LibraryImage
                    src={image.storageUrl}
                    alt={`Saved image generated with prompt: ${image.prompt.substring(0, 50)}...`}
                    fill
                    style={{ objectFit: "contain" }}
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="library image"
                />
                <form ref={formRef}>
                    <input type="hidden" name="userId" value={userId} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <input type="hidden" name="storageUrl" value={image.storageUrl} />
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-12 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Download full size image"
                        onClick={() => handleDownload(image.storageUrl, `library-image-${image.id}.png`)}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        disabled={isCheckingOrphan}
                        title="Delete image"
                        onClick={handleEnhancedDelete}
                    >
                        {isCheckingOrphan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
            <CardContent className="p-3 space-y-2 flex-grow flex flex-col">
                <p className="text-xs text-muted-foreground truncate flex-grow" title={image.prompt}>
                    <strong>Prompt:</strong> {image.prompt || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground truncate" title={image.style}>
                    <strong>Style:</strong> {image.style || 'N/A'}
                </p>
                <Button
                    className="btn-gradient-primary w-full mt-2"
                    size="sm"
                    onClick={() => onRefineClick(image.storageUrl)}
                >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Refine with AI
                </Button>
            </CardContent>
        </Card>
    );
}


export default function ImageLibraryPage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const { brandData, isLoading: isLoadingBrand, error: errorBrand, setSessionLastImageGenerationResult, setBrandData } = useBrand();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [refineModalOpen, setRefineModalOpen] = useState(false);
  const [imageToRefine, setImageToRefine] = useState<string | null>(null);

  const { 
    data: savedImages = [], 
    isLoading: isLoadingSaved, 
    error: errorSavedFetch 
  } = useQuery<SavedGeneratedImage[], Error>({
    queryKey: ['savedLibraryImages', user?.uid],
    queryFn: () => fetchSavedLibraryImages(user!.uid),
    enabled: !!user,
  });
  
  const errorSaved = errorSavedFetch ? `Failed to load AI-generated images: ${errorSavedFetch.message}. Check Firestore permissions and connectivity.` : null;

  const brandProfileImages = brandData?.exampleImages || [];

  const handleOpenRefineModal = (url: string) => {
    setImageToRefine(url);
    setRefineModalOpen(true);
  };

  const handleRefinementAccepted = (originalUrl: string, newUrl: string) => {
    // When a user accepts a refinement from the library, send it to the Content Studio
    // to be treated as a new generation. This prevents direct modification of the library
    // and allows the user to save it as a new asset.
    setSessionLastImageGenerationResult({
        generatedImages: [newUrl],
        promptUsed: "Image refined from the library.",
        providerUsed: "refine" 
    });
    toast({
        title: "Refinement Ready",
        description: "Your refined image is now available in the Content Studio to be saved to your library.",
        duration: 8000
    });
    queryClient.invalidateQueries({ queryKey: ['savedLibraryImages', user?.uid] });
  };


  return (
    <div className="max-w-6xl mx-auto">
      <RefineImageDialog
          isOpen={refineModalOpen}
          onOpenChange={setRefineModalOpen}
          imageToRefine={imageToRefine}
          onRefinementAccepted={handleRefinementAccepted}
      />
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
            <Card className="text-center py-12 px-6 bg-secondary/30 border-dashed border-2">
                <div className="w-fit mx-auto p-3 bg-primary/10 rounded-full mb-4">
                    <UserCircle className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No Example Images</h3>
                <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                    You haven't uploaded any example images to your brand profile yet. Adding some will help the AI understand your visual style.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/brand-profile">Go to Brand Profile</Link>
                </Button>
            </Card>
        )}
        {!isLoadingBrand && !errorBrand && brandProfileImages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brandProfileImages.map((imageUrl, index) => (
              <Card key={`brand-img-${index}`} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow group flex flex-col">
                <div className="relative w-full aspect-square bg-muted overflow-hidden">
                   <div className="relative w-full h-full">
                      <BrandProfileImage
                        src={imageUrl}
                        alt={`Brand profile example image ${index + 1}`}
                        fill
                        style={{ objectFit: "contain" }}
                        className="transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint="brand example"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-12 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Download full size image"
                        onClick={() => handleDownload(imageUrl, `brand-profile-image-${index + 1}.png`)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Delete brand profile image"
                        onClick={() => handleDeleteBrandProfileImage(imageUrl, index, brandData, setBrandData, user?.uid || '', toast)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                </div>
                <CardContent className="p-3 flex flex-col flex-grow">
                    <p className="text-xs text-muted-foreground truncate flex-grow">Profile Image {index + 1}</p>
                    <Button
                        className="btn-gradient-primary w-full mt-2"
                        size="sm"
                        onClick={() => handleOpenRefineModal(imageUrl)}
                    >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Refine with AI
                    </Button>
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
        {!isLoadingSaved && !errorSaved && savedImages.length === 0 && user && (
            <Card className="text-center py-12 px-6 bg-secondary/30 border-dashed border-2">
                <div className="w-fit mx-auto p-3 bg-primary/10 rounded-full mb-4">
                    <FileImage className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Your Library is Empty</h3>
                <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                   Images you generate in the Content Studio and save will appear here.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/content-studio">
                        <Paintbrush className="w-4 h-4 mr-2" />
                        Generate an Image
                    </Link>
                </Button>
            </Card>
        )}
        {!isLoadingSaved && !errorSaved && savedImages.length > 0 && user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {savedImages.map((image) => (
                <SavedImageCard key={image.id} image={image} userId={user.uid} onRefineClick={handleOpenRefineModal} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
