
"use client";

import React, { useState, useActionState, startTransition, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, Sparkles, X, Check, RefreshCcw, Palette, Sun, Image as ImageIcon, Brush } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { handleEditImageAction, handleEnhanceRefinePromptAction, getPaymentMode } from '@/lib/actions';
import type { FormState } from '@/lib/actions';
import type { EditImageOutput, EnhanceRefinePromptOutput } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const initialEditImageState: FormState<EditImageOutput> = { error: undefined, data: undefined };
const initialEnhancePromptState: FormState<EnhanceRefinePromptOutput> = { error: undefined, data: undefined };

// Instruction Templates
const INSTRUCTION_TEMPLATES = {
  lighting: {
    icon: Sun,
    label: "Lighting",
    templates: [
      "Make the image brighter and more vibrant",
      "Add dramatic lighting with strong shadows",
      "Create a golden hour warm lighting effect",
      "Add soft, diffused lighting for a professional look",
      "Increase contrast and make colors more vivid",
      "Create moody, low-key lighting"
    ]
  },
  background: {
    icon: ImageIcon,
    label: "Background",
    templates: [
      "Remove the background completely",
      "Blur the background for depth of field",
      "Change background to a professional studio setting",
      "Replace background with a nature scene",
      "Add a gradient background",
      "Make the background pure white"
    ]
  },
  style: {
    icon: Brush,
    label: "Style",
    templates: [
      "Convert to black and white with high contrast",
      "Apply a vintage film photography style",
      "Make it look like a watercolor painting",
      "Add an oil painting artistic effect",
      "Create a modern, minimalist style",
      "Apply a cinematic color grading"
    ]
  },
  colors: {
    icon: Palette,
    label: "Colors",
    templates: [
      "Enhance the colors to be more saturated",
      "Make the image warmer with orange tones",
      "Add cool blue tones throughout",
      "Increase the vibrancy of specific colors",
      "Create a monochromatic color scheme",
      "Adjust colors for better skin tones"
    ]
  }
};

interface RefineImageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageToRefine: string | null;
  onRefinementAccepted: (originalUrl: string, newUrl:string) => void;
}

export function RefineImageDialog({ isOpen, onOpenChange, imageToRefine, onRefinementAccepted }: RefineImageDialogProps) {
  const { userId } = useAuth();
  const { toast } = useToast();

  const [editState, editAction] = useActionState(handleEditImageAction, initialEditImageState);
  const [enhanceState, enhanceAction] = useActionState(handleEnhanceRefinePromptAction, initialEnhancePromptState);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const [instruction, setInstruction] = useState('');
  const [refinementHistory, setRefinementHistory] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  
  // Template selection state
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string | null>(null);
  
  // Fireworks AI state
  const [fireworksEnabled, setFireworksEnabled] = useState(false);
  const [fireworksSDXLTurboEnabled, setFireworksSDXLTurboEnabled] = useState(false);
  const [fireworksSDXL3Enabled, setFireworksSDXL3Enabled] = useState(false);
  const [qualityMode, setQualityMode] = useState<'fast' | 'balanced' | 'premium'>('balanced');
  
  const isProcessing = isEditing || isEnhancing;

  useEffect(() => {
    if (imageToRefine && isOpen) {
      setCurrentImage(imageToRefine);
      setRefinementHistory([imageToRefine]);
    } else if (!isOpen) {
      // Reset state when dialog closes
      setCurrentImage(null);
      setRefinementHistory([]);
      setInstruction('');
      setSelectedTemplateCategory(null);
    }
  }, [imageToRefine, isOpen]);

  // Handler for template selection
  const handleTemplateSelection = (categoryKey: string, template: string) => {
    setInstruction(template);
    setSelectedTemplateCategory(categoryKey);
  };

  // Fetch Fireworks configuration when dialog opens
  useEffect(() => {
    if (isOpen) {
      async function fetchConfig() {
        try {
          const result = await getPaymentMode();
          if (!result.error) {
            setFireworksEnabled(result.fireworksEnabled || false);
            setFireworksSDXLTurboEnabled(result.fireworksSDXLTurboEnabled || false);
            setFireworksSDXL3Enabled(result.fireworksSDXL3Enabled || false);
          }
        } catch (error) {
          console.error('Failed to fetch Fireworks config:', error);
        }
      }
      fetchConfig();
    }
  }, [isOpen]);


  useEffect(() => {
    if (editState.data || editState.error) {
        setIsEditing(false); // Action is complete
    }
    if (editState.data?.editedImageDataUri) {
      const newImage = editState.data.editedImageDataUri;
      setCurrentImage(newImage);
      setRefinementHistory(prev => [...prev, newImage]);
      toast({ title: "Refinement Complete", description: "Image has been updated. You can continue refining or accept the changes." });
    }
    if (editState.error) {
      toast({ title: "Refinement Failed", description: editState.error, variant: "destructive" });
    }
  }, [editState, toast]);

  useEffect(() => {
    if (enhanceState.data || enhanceState.error) {
        setIsEnhancing(false); // Action is complete
    }
    if (enhanceState.data?.enhancedInstruction) {
      setInstruction(enhanceState.data.enhancedInstruction);
      toast({ title: "Prompt Enhanced", description: "Your refinement instruction has been improved by AI." });
    }
    if (enhanceState.error) {
      toast({ title: "Enhancement Failed", description: enhanceState.error, variant: "destructive" });
    }
  }, [enhanceState, toast]);

  const handleEnhancePrompt = () => {
    if (instruction.trim().length < 3) {
      toast({ title: "Instruction too short", description: "Please provide a longer instruction to enhance.", variant: "default" });
      return;
    }
    setIsEnhancing(true);
    const formData = new FormData();
    formData.append("instruction", instruction);
    startTransition(() => enhanceAction(formData));
  };
  
  const handleRefineSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentImage || !instruction) return;
    
    // Ensure currentImage matches the last item in refinement history to prevent state mismatch after revert
    const expectedImage = refinementHistory[refinementHistory.length - 1];
    if (currentImage !== expectedImage) {
      setCurrentImage(expectedImage);
      return;
    }
    
    setIsEditing(true);

    const formData = new FormData();
    formData.append("userId", userId || "");
    // Pass the URL directly to the server action
    formData.append("imageDataUri", currentImage);
    formData.append("instruction", instruction);
    
    // Add quality mode if Fireworks is enabled
    if (fireworksEnabled && (fireworksSDXLTurboEnabled || fireworksSDXL3Enabled)) {
      formData.append("qualityMode", qualityMode);
    }
    
    startTransition(() => editAction(formData));
  };

  const handleRevertToVersion = (versionUrl: string) => {
    setCurrentImage(versionUrl);
    const versionIndex = refinementHistory.indexOf(versionUrl);
    setRefinementHistory(prev => prev.slice(0, versionIndex + 1));
  };
  
  const handleAcceptAndClose = () => {
    if (imageToRefine && currentImage && currentImage !== imageToRefine) {
      onRefinementAccepted(imageToRefine, currentImage);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isProcessing) onOpenChange(open); }}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-2xl"><Wand2 className="w-7 h-7 text-primary"/>AI Image Refinement Studio</DialogTitle>
          <DialogDescription>Iteratively refine your image with AI instructions. Each refinement generates a new version.</DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-[1fr_300px] gap-6 flex-1 overflow-y-auto p-6">
          {/* Main Content Area */}
          <div className="flex flex-col gap-6">
            <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center">
              {isEditing ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4"/>
                  <p className="font-semibold">Generating refinement...</p>
                </div>
              ) : currentImage ? (
                <div className="relative w-full h-full">
                  <NextImage src={currentImage} alt="Image to refine" fill className="object-contain p-2"/>
                </div>
              ) : (
                 <div className="text-muted-foreground">No Image Loaded</div>
              )}
            </div>

            <form onSubmit={handleRefineSubmit} className="space-y-4">
              <div>
                <Label htmlFor="refine-instruction" className="text-base font-medium">Instruction</Label>
                <p className="text-sm text-muted-foreground mb-3">Be specific. E.g., "Change the background to a beach at sunset", "Add a steam effect to the coffee cup".</p>
                
                {/* Template Selection */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Quick Templates</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {Object.entries(INSTRUCTION_TEMPLATES).map(([key, category]) => {
                      const IconComponent = category.icon;
                      return (
                        <Select
                          key={key}
                          value={selectedTemplateCategory === key ? instruction : ""}
                          onValueChange={(value) => handleTemplateSelection(key, value)}
                          disabled={isProcessing}
                        >
                          <SelectTrigger className="h-auto p-3">
                            <div className="flex items-center gap-2 w-full">
                              <IconComponent className="w-4 h-4 text-muted-foreground" />
                              <SelectValue placeholder={category.label} />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {category.templates.map((template, index) => (
                              <SelectItem key={index} value={template}>
                                <div className="text-sm">{template}</div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })}
                  </div>
                </div>

                <div className="relative">
                  <Textarea
                    id="refine-instruction"
                    value={instruction}
                    onChange={(e) => {
                      setInstruction(e.target.value);
                      // Clear template selection when user manually types
                      if (selectedTemplateCategory) {
                        setSelectedTemplateCategory(null);
                      }
                    }}
                    placeholder="Type your change here or select from templates above..."
                    rows={4}
                    className="pr-12 text-base"
                    disabled={isProcessing}
                  />
                  <Button
                    type="button"
                    variant="ghost" size="icon"
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || isEditing || instruction.length < 3}
                    className="absolute bottom-2 right-2 h-9 w-9 text-muted-foreground hover:text-primary"
                    title="Enhance instruction with AI"
                  >
                    {isEnhancing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5"/>}
                  </Button>
                </div>
              </div>

              {/* Fireworks AI Quality Mode Selector */}
              {fireworksEnabled && (fireworksSDXLTurboEnabled || fireworksSDXL3Enabled) && (
                <div>
                  <Label htmlFor="quality-mode" className="text-base font-medium">Image Quality</Label>
                  <p className="text-sm text-muted-foreground mb-2">Choose the quality level for your refinement.</p>
                  <Select value={qualityMode} onValueChange={(value: 'fast' | 'balanced' | 'premium') => setQualityMode(value)} disabled={isProcessing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {fireworksSDXLTurboEnabled && (
                        <SelectItem value="fast">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Fast Preview</span>
                            <span className="text-xs text-muted-foreground">SDXL Turbo • 2-3 seconds</span>
                          </div>
                        </SelectItem>
                      )}
                      <SelectItem value="balanced">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Standard Quality</span>
                          <span className="text-xs text-muted-foreground">Current models • 5-8 seconds</span>
                        </div>
                      </SelectItem>
                      {fireworksSDXL3Enabled && (
                        <SelectItem value="premium">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Premium Quality</span>
                            <span className="text-xs text-muted-foreground">SDXL 3 • 8-12 seconds</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full text-base py-3" disabled={isProcessing || !instruction}>
                 {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                 {isProcessing ? 'Generating...' : 'Generate Refinement'}
              </Button>
              {editState.error && <p className="text-sm text-destructive text-center">{editState.error}</p>}
            </form>
          </div>

          {/* History Sidebar */}
          <div className="flex flex-col gap-4 border-l -ml-6 pl-6 h-full">
            <h3 className="text-lg font-semibold border-b pb-2">History</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {refinementHistory.map((versionUrl, index) => (
                <AlertDialog key={index}>
                    <AlertDialogTrigger asChild>
                        <div className="relative group cursor-pointer">
                          <div className="relative aspect-square w-full rounded-md overflow-hidden border-2 group-hover:border-primary transition-colors">
                            <NextImage src={versionUrl} alt={`Version ${index + 1}`} fill className="object-contain"/>
                          </div>
                          <Badge
                            variant={versionUrl === currentImage ? 'default' : 'secondary'}
                            className="absolute top-2 left-2 z-10"
                          >
                            {index === 0 ? 'Original' : `Version ${index}`}
                          </Badge>
                          {versionUrl !== currentImage && !isProcessing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                              <div className="flex items-center text-white font-semibold">
                                <RefreshCcw className="w-4 h-4 mr-2"/> Revert
                              </div>
                            </div>
                          )}
                        </div>
                    </AlertDialogTrigger>
                    {versionUrl !== currentImage && (
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Revert to this version?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will discard any changes made after this version. You can always refine again from here.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRevertToVersion(versionUrl)}>
                                Yes, Revert
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    )}
                </AlertDialog>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 border-t bg-background flex-shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            <X className="mr-2 h-4 w-4"/>
            Cancel
          </Button>
          <Button onClick={handleAcceptAndClose} disabled={isProcessing || currentImage === imageToRefine} className="btn-gradient-primary">
            <Check className="mr-2 h-4 w-4"/>
            Accept & Use Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
