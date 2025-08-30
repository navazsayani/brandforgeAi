
"use client";

import React, { useState, useActionState, startTransition } from 'react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

  const [prompt, setPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const [generationState, generationAction] = useActionState(handleWelcomeGiftImageGenerationAction, initialGenerationState);
  const [saveState, saveAction] = useActionState(handleSaveGeneratedImagesAction, initialSaveState);

  React.useEffect(() => {
    if (generationState.data) {
      setGeneratedImages(generationState.data.generatedImages);
    }
    if (generationState.error) {
      toast({ title: "Generation Failed", description: generationState.error, variant: "destructive" });
    }
  }, [generationState, toast]);

  React.useEffect(() => {
    if (saveState.data) {
      toast({ title: "Images Saved!", description: `${saveState.data.savedCount} images have been saved to your library.` });
      setIsComplete(true);
      queryClient.invalidateQueries({ queryKey: ['savedLibraryImages', userId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding_hasImages', userId] });
    }
    if (saveState.error) {
      toast({ title: "Save Failed", description: saveState.error, variant: "destructive" });
    }
  }, [saveState, toast, queryClient, userId]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || !userId || !brandData) return;

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('prompt', prompt);
    formData.append('brandDescription', brandData.brandDescription || '');
    formData.append('imageStyle', brandData.imageStyleNotes || 'modern, professional');

    startTransition(() => {
      generationAction(formData);
    });
  };

  const handleSaveImages = () => {
    if (generatedImages.length === 0 || !userId) return;

    const imagesToSave = generatedImages.map(url => ({
      dataUri: url,
      prompt: prompt,
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
            {generatedImages.length === 0 
                ? "Describe your first brand image, and we'll generate 3 options for you, completely free."
                : "Here are your free images! Save them to your library to use them later."
            }
          </DialogDescription>
        </DialogHeader>

        {isComplete ? (
             <div className="text-center py-10 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold">Images Saved!</h3>
                <p className="text-muted-foreground">Your new brand images are waiting for you in the Image Library.</p>
             </div>
        ) : generatedImages.length > 0 ? (
          <div className="py-4 space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedImages.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <NextImage src={src} alt={`Generated Image ${index + 1}`} fill style={{ objectFit: 'contain' }} className="p-2" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="py-4 space-y-4">
              <Label htmlFor="welcome-prompt">Image Idea</Label>
              <Textarea
                id="welcome-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., a modern logo for a coffee brand"
                rows={3}
                required
              />
            </div>
            <DialogFooter>
                <SubmitButton
                    className="w-full"
                    loadingText="Generating..."
                    disabled={!prompt.trim()}
                >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate My Free Images
                </SubmitButton>
            </DialogFooter>
          </form>
        )}
        
        {!isComplete && (
            <DialogFooter className="flex-col sm:flex-row">
                 <Button variant="ghost" onClick={closeAndFinalize} className="w-full sm:w-auto">
                   {generatedImages.length > 0 ? "Close" : "Maybe Later"}
                </Button>
                {generatedImages.length > 0 && (
                    <SubmitButton 
                        onClick={handleSaveImages}
                        loadingText="Saving..."
                        className="w-full sm:w-auto"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Save All to Library
                    </SubmitButton>
                )}
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
