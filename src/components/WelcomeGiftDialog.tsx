
"use client";

import React, { useState, useActionState, startTransition, useEffect } from 'react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Wand2, Save, Gift, CheckCircle } from 'lucide-react';
import { handleWelcomeGiftImageGenerationAction, handleSaveGeneratedImagesAction, FormState } from '@/lib/actions';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { SubmitButton } from './SubmitButton';

interface WelcomeGiftDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialGenerationState: FormState<{ generatedImages: string[] }> = { error: undefined, data: undefined };
const initialSaveState: FormState<{ savedCount: number }> = { error: undefined, data: undefined };

export function WelcomeGiftDialog({ isOpen, onOpenChange }: WelcomeGiftDialogProps) {
  const { userId, currentUser } = useAuth();
  const { brandData, setBrandData } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [generationState, generationAction] = useActionState(handleWelcomeGiftImageGenerationAction, initialGenerationState);
  const [saveState, saveAction] = useActionState(handleSaveGeneratedImagesAction, initialSaveState);

  // Auto-trigger generation when the dialog opens with valid data
  useEffect(() => {
    if (isOpen && !isGenerating && generatedImages.length === 0 && !isComplete) {
      if (userId && brandData?.brandDescription) {
        setIsGenerating(true);
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('brandDescription', brandData.brandDescription);
        formData.append('imageStyle', brandData.imageStyleNotes || 'modern, professional');
        
        startTransition(() => {
          generationAction(formData);
        });
      }
    }
  }, [isOpen, userId, brandData, isGenerating, generatedImages, isComplete, generationAction]);

  useEffect(() => {
    if (generationState.data) {
      setGeneratedImages(generationState.data.generatedImages);
      setIsGenerating(false);
    }
    if (generationState.error) {
      toast({ title: "Generation Failed", description: generationState.error, variant: "destructive" });
      setIsGenerating(false);
      // Close dialog on failure to prevent user being stuck
      setTimeout(() => onOpenChange(false), 2000);
    }
  }, [generationState, toast, onOpenChange]);

  useEffect(() => {
    if (saveState.data) {
      toast({ title: "Images Saved!", description: `${saveState.data.savedCount} images have been saved to your library.` });
      setIsComplete(true);
      setIsSaving(false);
      queryClient.invalidateQueries({ queryKey: ['savedLibraryImages', userId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding_hasImages', userId] });
    }
    if (saveState.error) {
      toast({ title: "Save Failed", description: saveState.error, variant: "destructive" });
      setIsSaving(false);
    }
  }, [saveState, toast, queryClient, userId]);

  const handleSaveImages = () => {
    if (generatedImages.length === 0 || !userId || isSaving) return;

    setIsSaving(true);

    const imagesToSave = generatedImages.map(url => ({
      dataUri: url,
      prompt: "AI-generated welcome gift: Brand Starter Kit",
      style: brandData?.imageStyleNotes || 'modern, professional',
    }));

    const formData = new FormData();
    formData.append('imagesToSaveJson', JSON.stringify(imagesToSave));
    formData.append('userId', userId);
    formData.append('userEmail', currentUser?.email || '');

    startTransition(() => {
      saveAction(formData);
    });
  };

  const closeAndFinalize = async () => {
    if (userId && brandData && !brandData.welcomeGiftOffered) {
        try {
            await setBrandData({ ...brandData, welcomeGiftOffered: true }, userId);
        } catch (error) {
            console.error("Failed to mark welcome gift as offered:", error);
        }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeAndFinalize}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Gift className="w-7 h-7 text-primary" />
            Your Welcome Gift!
          </DialogTitle>
          <DialogDescription>
            {isComplete
                ? "Your new brand images are ready for you in your Image Library!"
                : generatedImages.length > 0
                ? "Here are 3 on-brand images generated just for you. Save them to start creating!"
                : "As a thank you for setting up your brand, we're generating a starter kit of 3 free images for you..."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6 flex-1 overflow-y-auto">
            {isComplete ? (
                 <div className="text-center py-10 space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                    <h3 className="text-xl font-semibold">Images Saved!</h3>
                    <p className="text-muted-foreground">Your new brand images are waiting for you in the Image Library.</p>
                 </div>
            ) : isSaving ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4"/>
                    <p className="font-semibold">Saving images to your library...</p>
                    <p className="text-sm text-muted-foreground">Using parallel uploads for faster performance</p>
                </div>
            ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4"/>
                    <p className="font-semibold">Generating your brand starter kit...</p>
                    <p className="text-sm text-muted-foreground">This may take a moment.</p>
                </div>
            ) : generatedImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {generatedImages.map((src, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                      <NextImage src={src} alt={`Generated Image ${index + 1}`} fill style={{ objectFit: 'contain' }} className="p-2" />
                    </div>
                  ))}
                </div>
            ) : null }
        </div>
        
        <DialogFooter className="flex-col sm:flex-row pt-4 border-t">
            <Button variant="ghost" onClick={closeAndFinalize} className="w-full sm:w-auto">
                Close
            </Button>
            {!isComplete && generatedImages.length > 0 && (
                <Button
                    onClick={handleSaveImages}
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save All to Library
                        </>
                    )}
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
