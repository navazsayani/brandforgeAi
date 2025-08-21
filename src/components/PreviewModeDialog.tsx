
"use client";

import React, { useState, useActionState, startTransition } from 'react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Eye, Sparkles, CheckCircle, ArrowRight, User, Star } from 'lucide-react';
import { handlePreviewModeImageGenerationAction, FormState } from '@/lib/actions';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SubmitButton } from './SubmitButton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PreviewModeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialPreviewState: FormState<{ generatedImages: string[] }> = { error: undefined, data: undefined };

const PREVIEW_PROMPT_SUGGESTIONS = [
  "A modern, minimalist logo for a tech startup called 'Innovate'",
  "An engaging social media image for a new coffee shop's grand opening",
  "A professional website banner for an online marketing course",
  "A vibrant, eye-catching illustration of a person working remotely from a beautiful location",
];

const SocialProofBanner = () => (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg mb-4 border border-blue-100 dark:from-blue-900/30 dark:to-purple-900/30 dark:border-blue-800/50">
        <div className="flex items-center gap-2 text-sm">
            <div className="flex -space-x-2">
                <User className="w-6 h-6 p-1 rounded-full bg-white border-2 border-white text-blue-500" />
                <User className="w-6 h-6 p-1 rounded-full bg-white border-2 border-white text-purple-500" />
                <User className="w-6 h-6 p-1 rounded-full bg-white border-2 border-white text-pink-500" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">
                <strong>17+</strong> brands created this week
            </span>
            <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/50">
                <Star className="w-3 h-3 mr-1" /> 4.6/5 rating
            </Badge>
        </div>
    </div>
);

const PromptSuggestions = ({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) => (
    <div className="space-y-3 mt-4">
        <p className="text-sm text-muted-foreground">
            Try one of these popular prompts to get started:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PREVIEW_PROMPT_SUGGESTIONS.map((prompt, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={() => onSelectPrompt(prompt)}
                    className="text-left p-3 rounded-md bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800/80 text-sm transition-colors"
                >
                    &quot;{prompt}&quot;
                </button>
            ))}
        </div>
    </div>
);


export function PreviewModeDialog({ isOpen, onOpenChange }: PreviewModeDialogProps) {
  const { userId } = useAuth();
  const { brandData, setBrandData } = useBrand();
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

  const handleClose = () => {
    // Only mark preview as used if an image was successfully generated
    if (generatedImage && brandData && !brandData.hasUsedPreviewMode && userId) {
        setBrandData({ ...brandData, hasUsedPreviewMode: true }, userId);
    }
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
      <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col">
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

        <div className="flex-1 overflow-y-auto pr-2 -mr-4 space-y-4">
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
                <div className="space-y-4">
                  <SocialProofBanner />
                  <form id="preview-form" action={previewAction}>
                    <input type="hidden" name="userId" value={userId || ''} />
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="preview-prompt">What would you like to create?</Label>
                        <Textarea
                          id="preview-prompt"
                          name="prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="e.g., a modern logo for a coffee shop, a professional headshot, a product mockup..."
                          rows={3}
                          required
                          className="mt-2"
                        />
                      </div>
                      <PromptSuggestions onSelectPrompt={setPrompt} />
                      <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={handleClose}>
                            Maybe Later
                        </Button>
                        <SubmitButton
                            className="w-full sm:w-auto"
                            loadingText="Generating Preview..."
                            disabled={!prompt.trim()}
                        >
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Free Preview
                        </SubmitButton>
                      </DialogFooter>
                    </div>
                  </form>
                </div>
            )}
        </div>
        
        {isComplete && (
            <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
              <Button asChild className="btn-gradient-primary">
                <Link href="/brand-profile">
                  Complete Brand Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
