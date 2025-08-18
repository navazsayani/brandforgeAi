"use client";

import React, { useState, useActionState, startTransition } from 'react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2, Eye, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { handlePreviewModeImageGenerationAction, FormState } from '@/lib/actions';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SubmitButton } from './SubmitButton';
import Link from 'next/link';

interface PreviewModeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialPreviewState: FormState<{ generatedImages: string[] }> = { error: undefined, data: undefined };

export function PreviewModeDialog({ isOpen, onOpenChange }: PreviewModeDialogProps) {
  const { userId } = useAuth();
  const { brandData } = useBrand();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [previewState, previewAction] = useActionState(handlePreviewModeImageGenerationAction, initialPreviewState);

  React.useEffect(() => {
    if (previewState.data) {
      setGeneratedImage(previewState.data.generatedImages[0] || null);
      setIsComplete(true);
    }
    if (previewState.error) {
      toast({ title: "Preview Failed", description: previewState.error, variant: "destructive" });
    }
  }, [previewState, toast]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || !userId) return;

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('prompt', prompt);

    startTransition(() => {
      previewAction(formData);
    });
  };

  const handleClose = () => {
    setPrompt('');
    setGeneratedImage(null);
    setIsComplete(false);
    onOpenChange(false);
  };

  // Don't show if user has already used preview mode or has completed brand profile
  if (brandData?.hasUsedPreviewMode || brandData?.brandDescription) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Eye className="w-7 h-7 text-primary" />
            Try AI Preview
          </DialogTitle>
          <DialogDescription>
            {isComplete 
                ? "Here's your AI-generated preview! Complete your brand profile to unlock unlimited generations with better quality."
                : "Get a taste of BrandForge AI! Generate one free image to see what our AI can create for you."
            }
          </DialogDescription>
        </DialogHeader>

        {isComplete ? (
          <div className="space-y-6">
            {generatedImage && (
              <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted max-w-md mx-auto">
                <NextImage 
                  src={generatedImage} 
                  alt="AI Preview Image" 
                  fill 
                  style={{ objectFit: 'contain' }} 
                  className="p-4" 
                />
              </div>
            )}
            
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="font-semibold text-green-700 dark:text-green-400">
                  Preview Generated Successfully!
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <p className="font-semibold text-foreground">
                    Ready to unlock the full power?
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete your brand profile to get unlimited generations, better quality, and personalized results!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="py-4 space-y-4">
              <Label htmlFor="preview-prompt">What would you like to create?</Label>
              <Textarea
                id="preview-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., a modern logo for a coffee shop, a professional headshot, a product mockup..."
                rows={3}
                required
              />
              <div className="text-xs text-muted-foreground">
                💡 Tip: Be specific about what you want to create for better results
              </div>
            </div>
            <DialogFooter>
              <SubmitButton
                className="w-full"
                loadingText="Generating Preview..."
                disabled={!prompt.trim()}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Free Preview
              </SubmitButton>
            </DialogFooter>
          </form>
        )}
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isComplete ? (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
              <Button asChild className="btn-gradient-primary">
                <Link href="/brand-profile">
                  Complete Brand Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={handleClose}>
              Maybe Later
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}