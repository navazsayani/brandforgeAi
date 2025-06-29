
"use client";

import React, { useState, useEffect, useActionState, startTransition, useRef, useMemo } from 'react';
import NextImage from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebaseConfig'; 
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; 

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/contexts/AuthContext'; 
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, MessageSquareText, Newspaper, Palette, Type, ThumbsUp, Copy, Ratio, ImageUp, UserSquare, Wand2, Loader2, Trash2, Images, Globe, ExternalLink, CircleSlash, Pipette, FileText, ListOrdered, Mic2, Edit, Briefcase, Eye, Save, Tag, Paintbrush, Zap, Aperture, PaletteIcon, Server, RefreshCw, Download, Library, Star, Lock, Sparkles as SparklesIcon, ChevronRight, Target, Users } from 'lucide-react';
import { handleGenerateImagesAction, handleGenerateSocialMediaCaptionAction, handleGenerateBlogContentAction, handleDescribeImageAction, handleGenerateBlogOutlineAction, handleSaveGeneratedImagesAction, handleCheckFreepikTaskStatusAction, handlePopulateImageFormAction, handlePopulateSocialFormAction, handlePopulateBlogFormAction, getPaymentMode, getPlansConfigAction, type FormState } from '@/lib/actions';
import { SubmitButton } from "@/components/SubmitButton";
import type { GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, SavedGeneratedImage, PlansConfig } from '@/types';
import type { DescribeImageOutput } from "@/ai/flows/describe-image-flow";
import type { GenerateBlogOutlineOutput } from "@/ai/flows/generate-blog-outline-flow";
import type { GenerateImagesInput } from '@/ai/flows/generate-images';
import type { PopulateImageFormOutput } from '@/ai/flows/populate-image-form-flow';
import type { PopulateSocialFormOutput } from '@/ai/flows/populate-social-form-flow';
import type { PopulateBlogFormOutput } from '@/ai/flows/populate-blog-form-flow';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; 
import { industries, imageStylePresets, freepikImagen3EffectColors, freepikImagen3EffectLightnings, freepikImagen3EffectFramings, freepikImagen3AspectRatios, generalAspectRatios, blogTones, freepikValidStyles, socialPostGoals, socialTones, blogArticleStyles, DEFAULT_PLANS_CONFIG } from '@/lib/constants';
import Link from 'next/link';

// --- START: Image Grid Fix Components ---
/**
 * ImprovedImageGrid Component
 * This component replaces the existing image grid in the Content Studio page.
 * It provides better responsive behavior and proper image sizing.
 */
const ImprovedImageGrid = ({ 
  imageUrls, 
  onDownload,
  className = "" 
}: { 
  imageUrls: string[]; 
  onDownload: (url: string, filename: string) => void;
  className?: string;
}) => {
  const gridClass = imageUrls.length > 1 
    ? (imageUrls.length > 2 
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
      : 'grid-cols-1 sm:grid-cols-2') 
    : 'grid-cols-1';

  return (
    <div className={cn('grid gap-4 w-full', gridClass, className)}>
      {imageUrls.map((url, index) => (
        <ImageGridItem 
          key={url || index} 
          url={url} 
          index={index}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};

/**
 * ImageGridItem Component
 * This component handles the display of individual images in the grid.
 * It properly maintains aspect ratio and handles different image types.
 */
const ImageGridItem = ({ 
  url, 
  index, 
  onDownload 
}: { 
  url: string; 
  index: number; 
  onDownload: (url: string, filename: string) => void;
}) => {
  const displayUrl = url && url.startsWith('image_url:') 
    ? url.substring(10) 
    : url;
  
  const isDisplayableImage = url && (url.startsWith('data:') || url.startsWith('image_url:'));
  const isTaskId = url && url.startsWith('task_id:');
  
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [freepikTaskStatusState, freepikTaskStatusAction] = useActionState(handleCheckFreepikTaskStatusAction, {error: undefined, data: undefined, message: undefined, taskId: "" });
  const { toast } = useToast();
  const { sessionLastImageGenerationResult, setSessionLastImageGenerationResult } = useBrand();


 useEffect(() => {
    if (freepikTaskStatusState.data && freepikTaskStatusState.data.taskId === url.substring(8)) {
      const { status, images: retrievedImageUrls, taskId } = freepikTaskStatusState.data;
       if (status === 'COMPLETED' && retrievedImageUrls && retrievedImageUrls.length > 0) {
        const newImageUrlsForTask = retrievedImageUrls.map(retrievedUrl => `image_url:${retrievedUrl}`);
        
        if (sessionLastImageGenerationResult) {
          const updatedGeneratedImages = sessionLastImageGenerationResult.generatedImages.map(
            existingUrl => (existingUrl === `task_id:${taskId}` ? newImageUrlsForTask : existingUrl) 
          ).flat(); 
          
          setSessionLastImageGenerationResult({
            ...sessionLastImageGenerationResult,
            generatedImages: updatedGeneratedImages,
          });
        }
        toast({ title: `Task ${taskId.substring(0,8)}... Completed`, description: `${retrievedImageUrls.length} image(s) retrieved.` });
      } else if (status === 'IN_PROGRESS') {
        toast({ title: `Task ${taskId.substring(0,8)}... Still In Progress`, description: "Please check again in a few moments." });
      } else if (status === 'FAILED') {
        toast({ title: `Task ${taskId.substring(0,8)}... Failed`, description: "Freepik failed to generate images for this task.", variant: "destructive" });
          if (sessionLastImageGenerationResult) {
            if (sessionLastImageGenerationResult) {
              setSessionLastImageGenerationResult({
                ...sessionLastImageGenerationResult,
                generatedImages: sessionLastImageGenerationResult.generatedImages.filter((existingUrl: string) => existingUrl !== `task_id:${taskId}`),
              });
            }
          }
      } else { 
          toast({ title: `Task ${taskId.substring(0,8)}... Status: ${status}`, description: "Could not retrieve images or task has an unexpected status." });
      }
      setIsCheckingStatus(false);
    }
    if (freepikTaskStatusState.error && freepikTaskStatusState.data?.taskId === url.substring(8)) {
      toast({ title: "Error Checking Task Status", description: freepikTaskStatusState.error, variant: "destructive" });
      setIsCheckingStatus(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freepikTaskStatusState, url, toast, setSessionLastImageGenerationResult, sessionLastImageGenerationResult?.generatedImages]);


  const handleCheckFreepikTask = () => {
    if (isTaskId) {
        setIsCheckingStatus(true);
        const taskId = url.substring(8);
        const formData = new FormData();
        formData.append("taskId", taskId);
        startTransition(() => {
          freepikTaskStatusAction(formData);
        });
    }
  };

  return (
    <div className="relative group w-full overflow-hidden rounded-md border bg-muted aspect-video">
      {isDisplayableImage ? (
        <>
          <NextImage
            src={displayUrl}
            alt={`Generated brand image ${index + 1}`}
            fill
            sizes="(max-width: 639px) 90vw, (max-width: 767px) 45vw, (max-width: 1023px) 30vw, 23vw"
            style={{objectFit: 'contain', objectPosition: 'center'}}
            data-ai-hint="brand marketing"
            className="transition-opacity duration-300 opacity-100 group-hover:opacity-80"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 z-10 bg-background/70 hover:bg-background"
            onClick={() => onDownload(displayUrl, `generated-image-${index + 1}.png`)}
            title="Download image"
          >
            <Download className="h-4 w-4"/>
          </Button>
        </>
      ) : isTaskId ? (
        <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground p-2 text-center">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          Freepik image task pending. <br/> Task ID: {url.substring(8).substring(0,8)}...
          <Button
            size="sm"
            variant="outline"
            onClick={handleCheckFreepikTask}
            disabled={isCheckingStatus}
            className="mt-2"
          >
            {isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Check Status
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          Image not available
        </div>
      )}
    </div>
  );
};
// --- END: Image Grid Fix Components ---


const initialImageFormState: FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string; }>= { error: undefined, data: undefined, message: undefined };
const initialSocialFormState: FormState<{ caption: string; hashtags: string; imageSrc: string | null }> = { error: undefined, data: undefined, message: undefined };
const initialBlogFormState: FormState<{ title: string; content: string; tags: string }> = { error: undefined, data: undefined, message: undefined };
const initialDescribeImageState: FormState<DescribeImageOutput> = { error: undefined, data: undefined, message: undefined };
const initialBlogOutlineState: FormState<GenerateBlogOutlineOutput> = { error: undefined, data: undefined, message: undefined };
const initialSaveImagesState: FormState<{savedCount: number}> = { error: undefined, data: undefined, message: undefined };
const initialPopulateImageFormState: FormState<PopulateImageFormOutput> = { error: undefined, data: undefined, message: undefined };
const initialPopulateSocialFormState: FormState<PopulateSocialFormOutput> = { error: undefined, data: undefined, message: undefined };
const initialPopulateBlogFormState: FormState<PopulateBlogFormOutput> = { error: undefined, data: undefined, message: undefined };
const initialFreepikTaskStatusState: FormState<{ status: string; images: string[] | null; taskId: string;}> = { error: undefined, data: undefined, message: undefined, taskId: "" };
const initialPlansState: FormState<PlansConfig> = { data: null, error: undefined };


type SocialImageChoice = 'generated' | 'profile' | 'library' | null;

const fetchSavedLibraryImages = async (userId: string | undefined): Promise<SavedGeneratedImage[]> => {
  if (!userId) {
    return []; 
  }
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


export default function ContentStudioPage() {
  const { currentUser } = useAuth(); 
  const { brandData, addGeneratedImage, addGeneratedSocialPost, addGeneratedBlogPost, userId, sessionLastImageGenerationResult, setSessionLastImageGenerationResult } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [imageTabKey, setImageTabKey] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<string>("image");
  
  const [isClearing, setIsClearing] = useState(false);

  const [imageState, imageAction] = useActionState(handleGenerateImagesAction, initialImageFormState);
  const prevImageStateRef = useRef(imageState);
  const [socialState, socialAction] = useActionState(handleGenerateSocialMediaCaptionAction, initialSocialFormState);
  const [blogState, blogAction] = useActionState(handleGenerateBlogContentAction, initialBlogFormState);
  const [describeImageState, describeImageAction] = useActionState(handleDescribeImageAction, initialDescribeImageState);
  const [blogOutlineState, blogOutlineAction] = useActionState(handleGenerateBlogOutlineAction, initialBlogOutlineState);
  
  const [saveImagesServerActionState, saveImagesAction] = useActionState(handleSaveGeneratedImagesAction, initialSaveImagesState);
  const [isSavingImages, setIsSavingImages] = useState(false);

  const [freepikTaskStatusState, freepikTaskStatusAction] = useActionState(handleCheckFreepikTaskStatusAction, initialFreepikTaskStatusState);
  const [plansState, getPlans] = useActionState(getPlansConfigAction, initialPlansState);


  const [lastSuccessfulGeneratedImageUrls, setLastSuccessfulGeneratedImageUrls] = useState<string[]>([]);
  const [lastUsedImageGenPrompt, setLastUsedImageGenPrompt] = useState<string | null>(null);
  const [lastUsedImageProvider, setLastUsedImageProvider] = useState<string | null>(null);
  
  const [generatedSocialPost, setGeneratedSocialPost] = useState<{caption: string, hashtags: string, imageSrc: string | null} | null>(null);
  const [generatedBlogPost, setGeneratedBlogPost] = useState<{title: string, content: string, tags: string} | null>(null);
  const [generatedBlogOutline, setGeneratedBlogOutline] = useState<string>("");

  const [useImageForSocialPost, setUseImageForSocialPost] = useState<boolean>(false);
  const [socialImageChoice, setSocialImageChoice] = useState<SocialImageChoice>(null);
  const [socialToneValue, setSocialToneValue] = useState<string>(socialTones[0].value);
  const [customSocialToneNuances, setCustomSocialToneNuances] = useState<string>("");

  const [blogPlatformValue, setBlogPlatformValue] = useState<"Medium" | "Other">("Medium");
  const [selectedBlogTone, setSelectedBlogTone] = useState<string>(blogTones[0].value);

  const [numberOfImagesToGenerate, setNumberOfImagesToGenerate] = useState<string>("1");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState<boolean>(false);

  const [selectedProfileImageIndexForGen, setSelectedProfileImageIndexForGen] = useState<number | null>(null);
  const [selectedProfileImageIndexForSocial, setSelectedProfileImageIndexForSocial] = useState<number | null>(null);
  const [selectedLibraryImageIndexForSocial, setSelectedLibraryImageIndexForSocial] = useState<number | null>(null);


  const [selectedImageProvider, setSelectedImageProvider] = useState<GenerateImagesInput['provider']>('GEMINI');
  const [imageGenBrandDescription, setImageGenBrandDescription] = useState<string>("");
  const [selectedImageStylePreset, setSelectedImageStylePreset] = useState<string>(imageStylePresets[0].value);
  const [customStyleNotesInput, setCustomStyleNotesInput] = useState<string>("");
  const [imageGenNegativePrompt, setImageGenNegativePrompt] = useState<string>("");
  const [imageGenSeed, setImageGenSeed] = useState<string>("");

  const [currentAspectRatioOptions, setCurrentAspectRatioOptions] = useState(generalAspectRatios);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(generalAspectRatios[0].value);

  const [freepikDominantColorsInput, setFreepikDominantColorsInput] = useState<string>("");
  const [freepikEffectColor, setFreepikEffectColor] = useState<string>("none");
  const [freepikEffectLightning, setFreepikEffectLightning] = useState<string>("none");
  const [freepikEffectFraming, setFreepikEffectFraming] = useState<string>("none");

  const [isPreviewingPrompt, setIsPreviewingPrompt] = useState<boolean>(false);
  const [currentTextPromptForEditing, setCurrentTextPromptForEditing] = useState<string>("");
  const [formSnapshot, setFormSnapshot] = useState<Partial<GenerateImagesInput> & { provider?: string } | null>(null);

  const [checkingTaskId, setCheckingTaskId] = useState<string | null>(null);
  const [selectedBlogIndustry, setSelectedBlogIndustry] = useState<string>("_none_"); 

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [useExampleImageForGen, setUseExampleImageForGen] = useState<boolean>(true); 

  // --- AI Quick Start State ---
  const [populateImageFormState, populateImageFormAction] = useActionState(handlePopulateImageFormAction, initialPopulateImageFormState);
  const [isPopulatingImageForm, setIsPopulatingImageForm] = useState(false);
  const [quickStartImageRequest, setQuickStartImageRequest] = useState("");

  const [populateSocialFormState, populateSocialFormAction] = useActionState(handlePopulateSocialFormAction, initialPopulateSocialFormState);
  const [isPopulatingSocialForm, setIsPopulatingSocialForm] = useState(false);
  const [quickStartSocialRequest, setQuickStartSocialRequest] = useState("");

  const [populateBlogFormState, populateBlogFormAction] = useActionState(handlePopulateBlogFormAction, initialPopulateBlogFormState);
  const [isPopulatingBlogForm, setIsPopulatingBlogForm] = useState(false);
  const [quickStartBlogRequest, setQuickStartBlogRequest] = useState("");

  // Social form fields state
  const [socialPostGoal, setSocialPostGoal] = useState<string>(socialPostGoals[0].value);
  const [socialTargetAudience, setSocialTargetAudience] = useState<string>("");
  const [socialCallToAction, setSocialCallToAction] = useState<string>("");
  const [socialImageDescription, setSocialImageDescription] = useState<string>("");

  // Blog form fields state
  const [blogArticleStyle, setBlogArticleStyle] = useState<string>(blogArticleStyles[0].value);
  const [blogTargetAudience, setBlogTargetAudience] = useState<string>("");
  
  // State for config fetched from server
  const [freepikEnabled, setFreepikEnabled] = useState(false);

  const isPremiumActive = useMemo(() => {
    if (!brandData) return false;
    const { plan, subscriptionEndDate } = brandData;
    if (plan !== 'premium' || !subscriptionEndDate) return false;
    const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
    return endDate > new Date();
  }, [brandData]);
  
  const currentPlansConfig = plansState.data || DEFAULT_PLANS_CONFIG;
  const blogGenerationQuotaForFreePlan = currentPlansConfig.USD.free.quotas.blogPosts;
  const isBlogFeatureEnabledForFreeUsers = blogGenerationQuotaForFreePlan > 0;
  
  useEffect(() => {
    getPlans(); // Fetch plans on component mount

    async function fetchConfig() {
      const result = await getPaymentMode(); // This action now fetches multiple config flags
      if (result.error) {
        toast({ title: "Config Error", description: result.error, variant: "destructive" });
      } else {
        setFreepikEnabled(result.freepikEnabled || false);
      }
    }
    fetchConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);
  
  const imageGenerationProviders = useMemo(() => [
    { value: "GEMINI", label: "Gemini (Google AI)", disabled: false, premium: false },
    { value: "FREEPIK", label: "Freepik API (imagen3)", premium: true, disabled: !freepikEnabled },
  ], [freepikEnabled]);

  const { 
    data: savedLibraryImages = [], 
    isLoading: isLoadingSavedLibraryImages, 
    error: errorSavedLibraryFetch 
  } = useQuery<SavedGeneratedImage[], Error>({
    queryKey: ['savedLibraryImagesForSocial', userId],
    queryFn: () => fetchSavedLibraryImages(userId || undefined),
    enabled: !!userId,
  });

  useEffect(() => {
    if (errorSavedLibraryFetch) {
      toast({
        title: "Error Loading Library Images",
        description: `Could not fetch your saved images: ${errorSavedLibraryFetch.message}. Please try again later.`,
        variant: "destructive",
      });
    }
  }, [errorSavedLibraryFetch, toast]);


  useEffect(() => {
    if (brandData) {
        setImageGenBrandDescription(brandData.brandDescription || "");
        const industryValue = brandData.industry && brandData.industry.trim() !== "" ? brandData.industry : "_none_";
        setSelectedBlogIndustry(industryValue); 
        setCustomStyleNotesInput(brandData.imageStyleNotes || "");

        if (brandData.exampleImages && brandData.exampleImages.length > 0) {
            if (selectedProfileImageIndexForGen === null) setSelectedProfileImageIndexForGen(0);
        } else {
            setSelectedProfileImageIndexForGen(null);
        }
        if (useImageForSocialPost && socialImageChoice === null) {
            if (sessionLastImageGenerationResult?.generatedImages?.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))) {
                setSocialImageChoice('generated');
                setSelectedProfileImageIndexForSocial(null);
                setSelectedLibraryImageIndexForSocial(null);
            } else if (brandData.exampleImages && brandData.exampleImages.length > 0) {
                setSocialImageChoice('profile');
                if(selectedProfileImageIndexForSocial === null) setSelectedProfileImageIndexForSocial(0);
                setSelectedLibraryImageIndexForSocial(null);
            } else if (savedLibraryImages.length > 0) {
                setSocialImageChoice('library');
                if(selectedLibraryImageIndexForSocial === null) setSelectedLibraryImageIndexForSocial(0);
                setSelectedProfileImageIndexForSocial(null);
            }
        } else if (useImageForSocialPost && socialImageChoice === 'profile' && selectedProfileImageIndexForSocial === null && brandData.exampleImages && brandData.exampleImages.length > 0) {
            setSelectedProfileImageIndexForSocial(0);
        } else if (useImageForSocialPost && socialImageChoice === 'library' && selectedLibraryImageIndexForSocial === null && savedLibraryImages.length > 0) {
            setSelectedLibraryImageIndexForSocial(0);
        }

        const currentNumImages = parseInt(numberOfImagesToGenerate, 10);
        if (!isPremiumActive && currentNumImages > 1 && !isAdmin) {
            setNumberOfImagesToGenerate("1");
        }

    } else {
        setImageGenBrandDescription("");
        setSelectedBlogIndustry("_none_");
        setCustomStyleNotesInput("");
        setSelectedProfileImageIndexForGen(null);
        setNumberOfImagesToGenerate("1"); 
        if (!isAdmin) setSelectedImageProvider('GEMINI'); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandData, useImageForSocialPost, socialImageChoice, sessionLastImageGenerationResult, savedLibraryImages, numberOfImagesToGenerate, isPremiumActive, isAdmin]);


  useEffect(() => {
    if (currentUser && currentUser.email === 'admin@brandforge.ai') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      setSelectedImageProvider("GEMINI"); // Ensure non-admins default to GEMINI
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedImageProvider === 'FREEPIK' && (isAdmin || isPremiumActive)) { 
      setCurrentAspectRatioOptions(freepikImagen3AspectRatios);
      if (!freepikImagen3AspectRatios.find(ar => ar.value === selectedAspectRatio)) {
        setSelectedAspectRatio(freepikImagen3AspectRatios[0].value);
      }
    } else { 
      setCurrentAspectRatioOptions(generalAspectRatios);
      if (!generalAspectRatios.find(ar => ar.value === selectedAspectRatio)) {
        setSelectedAspectRatio(generalAspectRatios[0].value);
      }
    }
  }, [selectedImageProvider, selectedAspectRatio, isAdmin, isPremiumActive]); 


  useEffect(() => {
    if (sessionLastImageGenerationResult) {
      setLastSuccessfulGeneratedImageUrls(sessionLastImageGenerationResult.generatedImages);
      setLastUsedImageGenPrompt(sessionLastImageGenerationResult.promptUsed);
      setLastUsedImageProvider(sessionLastImageGenerationResult.providerUsed);
    } else {
      setLastSuccessfulGeneratedImageUrls([]);
      setLastUsedImageGenPrompt(null);
      setLastUsedImageProvider(null);
    }
  }, [sessionLastImageGenerationResult]);


  useEffect(() => {
    // Only run the effect if the imageState object reference has actually changed.
    if (imageState !== prevImageStateRef.current) {
      if (imageState.data && imageState.data.generatedImages && imageState.data.generatedImages.length > 0) {
        setSessionLastImageGenerationResult(imageState.data); 

        const displayableImages = imageState.data.generatedImages.filter(url => url && (url.startsWith('data:') || url.startsWith('image_url:')));
        if (displayableImages.length > 0) {
          displayableImages.forEach(url => {
              const displayUrl = url.startsWith('image_url:') ? url.substring(10) : url;
              const newImage: GeneratedImage = {
                  id: `${new Date().toISOString()}-${Math.random().toString(36).substring(2, 9)}`,
                  src: displayUrl,
                  prompt: imageState.data?.promptUsed || "",
                  style: selectedImageStylePreset + (customStyleNotesInput ? ". " + customStyleNotesInput : "")
              };
              addGeneratedImage(newImage); 
          });
            toast({ title: "Success", description: `${displayableImages.length} image(s) processed.` });
        } else if (imageState.data.generatedImages.some(url => url.startsWith('task_id:'))) {
          toast({ title: "Freepik Task Started", description: "Freepik image generation task started. Use 'Check Status' to retrieve images." });
        } else if (!imageState.data.generatedImages || imageState.data.generatedImages.length === 0) {
          toast({ title: "No Images/Tasks Generated", description: `Received empty list.`, variant: "default" });
        }
        setIsPreviewingPrompt(false);
        setFormSnapshot(null);
      }
      if (imageState.error) {
        toast({ title: "Error generating images", description: imageState.error, variant: "destructive" });
        setIsPreviewingPrompt(false);
        setFormSnapshot(null);
      }
    }
    // Always update the ref to the current state for the next render's comparison.
    prevImageStateRef.current = imageState;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageState]);


  useEffect(() => {
    if (socialState.data) {
      const socialData = socialState.data;
      setGeneratedSocialPost({ caption: socialData.caption, hashtags: socialData.hashtags, imageSrc: socialData.imageSrc });
        const newPost: GeneratedSocialMediaPost = {
        id: new Date().toISOString(),
        platform: 'Instagram', 
        imageSrc: socialData.imageSrc || null,
        imageDescription: socialImageDescription || "",
        caption: socialData.caption,
        hashtags: socialData.hashtags,
        tone: socialToneValue + (customSocialToneNuances ? ` ${customSocialToneNuances}` : ''),
        postGoal: socialPostGoal,
        targetAudience: socialTargetAudience,
        callToAction: socialCallToAction,
      };
      addGeneratedSocialPost(newPost);
      toast({ title: "Success", description: socialState.message });
    }
    if (socialState.error) toast({ title: "Error generating social post", description: socialState.error, variant: "destructive" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socialState, toast, addGeneratedSocialPost, socialToneValue, customSocialToneNuances]);

  useEffect(() => {
    if (blogState.data) {
      const blogData = blogState.data;
      setGeneratedBlogPost(blogData);
      const newPost: GeneratedBlogPost = {
        id: new Date().toISOString(),
        title: blogData.title,
        content: blogData.content,
        tags: blogData.tags,
        platform: blogPlatformValue,
        articleStyle: blogArticleStyle,
        targetAudience: blogTargetAudience,
        blogTone: selectedBlogTone,
      };
      addGeneratedBlogPost(newPost);
      toast({ title: "Success", description: blogState.message });
    }
    if (blogState.error) toast({ title: "Error generating blog post", description: blogState.error, variant: "destructive" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogState, toast, addGeneratedBlogPost, blogPlatformValue]);

  useEffect(() => {
    setIsGeneratingDescription(false);
    if (describeImageState.data) {
      setSocialImageDescription(describeImageState.data.description);
      toast({ title: "Success", description: describeImageState.message || "Image description generated." });
    }
    if (describeImageState.error) {
      toast({ title: "Error generating image description", description: describeImageState.error, variant: "destructive" });
    }
  }, [describeImageState, toast]);

  useEffect(() => {
    setIsGeneratingOutline(false);
    if (blogOutlineState.data) {
        setGeneratedBlogOutline(blogOutlineState.data.outline);
        toast({ title: "Success", description: blogOutlineState.message || "Blog outline generated." });
    }
    if (blogOutlineState.error) {
        toast({ title: "Outline Error", description: blogOutlineState.error, variant: "destructive" });
    }
  }, [blogOutlineState, toast]);

  useEffect(() => {
    setIsSavingImages(false); 
    if (saveImagesServerActionState.message && !saveImagesServerActionState.error) {
      toast({ title: "Image Library", description: saveImagesServerActionState.message });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['savedLibraryImagesForSocial', userId] });
      }
    }
    if (saveImagesServerActionState.error) {
      toast({ title: "Error Saving Images", description: saveImagesServerActionState.error, variant: "destructive"});
    }
  }, [saveImagesServerActionState, toast, queryClient, userId]);


  useEffect(() => {
    if (freepikTaskStatusState.data && !checkingTaskId) { // Ensure we only process this if we are NOT currently checking
        const { status, images: retrievedImageUrls, taskId } = freepikTaskStatusState.data;
        // This block is now mostly handled by the ImageGridItem's local useEffect.
        // This global one can be simplified or removed if ImageGridItem's is robust enough.
        // For now, keep it for logging/broad updates if needed.
        if (taskId && sessionLastImageGenerationResult?.generatedImages.some(url => url === `task_id:${taskId}`)) {
            if (status === 'COMPLETED' && retrievedImageUrls && retrievedImageUrls.length > 0) {
                const newImageUrlsForTask = retrievedImageUrls.map(url => `image_url:${url}`);
                if (sessionLastImageGenerationResult) {
                    setSessionLastImageGenerationResult({
                        ...sessionLastImageGenerationResult,
                        generatedImages: sessionLastImageGenerationResult.generatedImages.map(
                            (url: string) => (url === `task_id:${taskId}` ? newImageUrlsForTask : url)
                        ).flat(),
                    });
                }
                toast({ title: `Task ${taskId.substring(0,8)}... Completed`, description: `${retrievedImageUrls.length} image(s) retrieved.` });
            } else if (status === 'FAILED') {
                if (sessionLastImageGenerationResult) {
                    setSessionLastImageGenerationResult({
                        ...sessionLastImageGenerationResult,
                        generatedImages: sessionLastImageGenerationResult.generatedImages.filter((url: string) => url !== `task_id:${taskId}`),
                    });
                }
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freepikTaskStatusState, checkingTaskId]); // Added checkingTaskId dependency

    useEffect(() => {
        setIsPopulatingImageForm(false);
        if (populateImageFormState.data) {
            const { data } = populateImageFormState;
            setImageGenBrandDescription(data.refinedBrandDescription);
            setSelectedImageStylePreset(data.imageStylePreset);
            setCustomStyleNotesInput(data.customStyleNotes || "");
            setImageGenNegativePrompt(data.negativePrompt || "");
            setSelectedAspectRatio(data.aspectRatio);
            toast({ title: "Form Populated!", description: "AI has filled out the fields for you. Feel free to adjust them." });
        }
        if (populateImageFormState.error) {
            toast({ title: "Population Error", description: populateImageFormState.error, variant: "destructive" });
        }
    }, [populateImageFormState, toast]);

    useEffect(() => {
        setIsPopulatingSocialForm(false);
        if (populateSocialFormState.data) {
            const { data } = populateSocialFormState;
            setSocialPostGoal(data.postGoal);
            setSocialTargetAudience(data.targetAudience || "");
            setSocialCallToAction(data.callToAction || "");
            setSocialToneValue(data.tone);
            setCustomSocialToneNuances(data.customToneNuances || "");
            if (data.imageDescription) {
              setUseImageForSocialPost(true);
              setSocialImageDescription(data.imageDescription);
            } else {
              setUseImageForSocialPost(false);
              setSocialImageDescription("");
            }
            toast({ title: "Form Populated!", description: "AI has filled out the social post fields for you." });
        }
        if (populateSocialFormState.error) {
            toast({ title: "Population Error", description: populateSocialFormState.error, variant: "destructive" });
        }
    }, [populateSocialFormState, toast]);

    useEffect(() => {
        setIsPopulatingBlogForm(false);
        if (populateBlogFormState.data) {
            const { data } = populateBlogFormState;
            setBlogTargetAudience(data.targetAudience || "");
            setBlogArticleStyle(data.articleStyle);
            setSelectedBlogTone(data.blogTone);
            setGeneratedBlogOutline(data.generatedOutline || "");
            toast({ title: "Form Populated!", description: "AI has filled out the blog post fields and generated an outline." });
        }
        if (populateBlogFormState.error) {
            toast({ title: "Population Error", description: populateBlogFormState.error, variant: "destructive" });
        }
    }, [populateBlogFormState, toast]);


  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${type} Copied!`, description: "Content copied to clipboard." });
  };

 const handleClearGeneratedImages = () => {
    setIsClearing(true);
    setSessionLastImageGenerationResult(null); 
    setFormSnapshot(null);
    setIsPreviewingPrompt(false);
    setCurrentTextPromptForEditing("");
    setImageTabKey(Date.now());
    setTimeout(() => setIsClearing(false), 100); 
  };

  const handleSaveAllGeneratedImages = async () => {
    setIsSavingImages(true);

    const saveableImages = lastSuccessfulGeneratedImageUrls
        .filter(url => url && (url.startsWith('data:') || url.startsWith('image_url:')))
        .map(url => ({
            dataUri: url,
            prompt: lastUsedImageGenPrompt || "N/A",
            style: (selectedImageStylePreset + (customStyleNotesInput ? ". " + customStyleNotesInput : "")),
        }));

    if (saveableImages.length === 0) {
        toast({ title: "No new images to save", description: "No valid generated images are available for saving.", variant: "default"});
        setIsSavingImages(false);
        return;
    }

    if (!userId) {
        toast({title: "Authentication Error", description: "User not logged in. Cannot save images.", variant: "destructive"});
        setIsSavingImages(false);
        return; 
    }
    
    try {
        const compressedImages = await Promise.all(saveableImages.map(async (image) => {
            if (image.dataUri.startsWith('data:image')) {
                try {
                    const compressedUri = await new Promise<string>((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const maxWidth = 1920;
                            const maxHeight = 1080;
                            let { width, height } = img;
                            if (width > height) {
                                if (width > maxWidth) {
                                    height *= maxWidth / width;
                                    width = maxWidth;
                                }
                            } else {
                                if (height > maxHeight) {
                                    width *= maxHeight / height;
                                    height = maxHeight;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            ctx?.drawImage(img, 0, 0, width, height);
                            resolve(canvas.toDataURL('image/jpeg', 0.8)); 
                        };
                        img.onerror = reject;
                        img.src = image.dataUri;
                    });
                    return { ...image, dataUri: compressedUri };
                } catch (compressionError) {
                    console.warn("Could not compress image, using original:", compressionError);
                    return image;
                }
            }
            return image;
        }));

        const imagesToSaveJson = JSON.stringify(compressedImages);
        const totalPayloadSize = new TextEncoder().encode(imagesToSaveJson).length;

        if (totalPayloadSize > 950 * 1024) { // Check against a safe limit (950KB)
             toast({
                title: "Payload Too Large",
                description: `Total data size is too large (${(totalPayloadSize / (1024*1024)).toFixed(2)} MB). Please clear these results and try generating fewer images at once to stay within the 1MB limit.`,
                variant: "destructive",
                duration: 8000,
            });
            setIsSavingImages(false);
            return;
        }

        startTransition(() => {
           const formData = new FormData();
           formData.append('imagesToSaveJson', imagesToSaveJson);
           formData.append('userId', userId); 
           formData.append('userEmail', currentUser?.email || '');
           saveImagesAction(formData);
        });

    } catch (error: any) {
        toast({ title: "Error during processing", description: `An error occurred before saving: ${error.message}`, variant: "destructive" });
        setIsSavingImages(false);
    }
  };

  const handleUseGeneratedImageForSocial = () => {
    const firstDisplayableImage = lastSuccessfulGeneratedImageUrls.find(url => url?.startsWith('data:') || url?.startsWith('image_url:'));
    if (firstDisplayableImage) {
      setUseImageForSocialPost(true);
      setSocialImageChoice('generated');
      setSelectedProfileImageIndexForSocial(null);
      setSelectedLibraryImageIndexForSocial(null);
      setActiveTab('social');
      toast({title: "Image Selected", description: "First available generated image selected for social post."});
    } else {
      toast({title: "No Image", description: "Please generate a displayable image first (e.g. Gemini, or completed Freepik task).", variant: "destructive"});
    }
  };

  const currentExampleImageForGen = (useExampleImageForGen && brandData?.exampleImages && selectedProfileImageIndexForGen !== null && brandData.exampleImages[selectedProfileImageIndexForGen]) || "";

  const currentSocialImagePreviewUrl = useImageForSocialPost
    ? (socialImageChoice === 'generated'
        ? (sessionLastImageGenerationResult?.generatedImages.find(url => url?.startsWith('data:') || url?.startsWith('image_url:'))?.replace(/^image_url:/, '') || null)
        : (socialImageChoice === 'profile'
            ? (brandData?.exampleImages && selectedProfileImageIndexForSocial !== null && brandData.exampleImages[selectedProfileImageIndexForSocial]) || null
            : (socialImageChoice === 'library'
                ? (!isLoadingSavedLibraryImages && savedLibraryImages && selectedLibraryImageIndexForSocial !== null && savedLibraryImages[selectedLibraryImageIndexForSocial]?.storageUrl) || null
                : null)))
    : null;


  const handleAIDescribeImage = () => {
    if (!currentSocialImagePreviewUrl) {
      toast({ title: "No Image Selected", description: "Please select an image to describe.", variant: "destructive" });
      return;
    }
    setIsGeneratingDescription(true);
    const formData = new FormData();
    formData.append("imageDataUri", currentSocialImagePreviewUrl); 
    startTransition(() => {
        describeImageAction(formData);
    });
  };

  const socialSubmitDisabled = socialState.data?.caption ? false : (useImageForSocialPost && !currentSocialImagePreviewUrl);

  const handlePreviewPromptClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const currentIndustryValue = selectedBlogIndustry; 
    const industryLabelForPreview = industries.find(i => i.value === currentIndustryValue)?.label || currentIndustryValue;

    const industryCtx = (industryLabelForPreview && industryLabelForPreview !== "None / Not Applicable" && industryLabelForPreview !== "_none_") ? ` The brand operates in the ${industryLabelForPreview} industry.` : "";
    const exampleImg = useExampleImageForGen ? currentExampleImageForGen : ""; 
    const combinedStyle = selectedImageStylePreset + (customStyleNotesInput ? ". " + customStyleNotesInput : "");
    const negPrompt = imageGenNegativePrompt;
    const aspect = selectedAspectRatio;
    const numImages = parseInt(numberOfImagesToGenerate, 10);
    const seedValueStr = imageGenSeed;
    const seedValue = seedValueStr && !isNaN(parseInt(seedValueStr)) ? parseInt(seedValueStr, 10) : undefined;
    const compositionGuidance = "IMPORTANT COMPOSITION RULE: When depicting human figures as the primary subject, the image *must* be well-composed. Avoid awkward or unintentional cropping of faces or key body parts. Ensure the figure is presented naturally and fully within the frame, unless the prompt *explicitly* requests a specific framing like 'close-up', 'headshot', 'upper body shot', or an artistic crop. Prioritize showing the entire subject if it's a person.";

    let textPromptContent = "";
    let coreInstructions = "";

    if (selectedImageProvider === 'FREEPIK') {
        if (exampleImg) {
            textPromptContent = `[An AI-generated description of your example image will be used here by the backend to guide content when Freepik/Imagen3 is selected.]\nUsing that description as primary inspiration for the subject and main visual elements, now generate an image based on the following concept: "${imageGenBrandDescription}".`;
        } else {
            textPromptContent = `Generate an image based on the concept: "${imageGenBrandDescription}".`;
        }
        textPromptContent += `${industryCtx}`;
        
        const firstPresetKeyword = selectedImageStylePreset.toLowerCase().trim().split(/[,.]|\s-\s/)[0].trim(); 
        const isPresetAStructuralFreepikStyle = freepikValidStyles.some(s => s.toLowerCase() === firstPresetKeyword);
        
        if (isPresetAStructuralFreepikStyle) {
            const presetLabel = imageStylePresets.find(p => p.value === selectedImageStylePreset)?.label || selectedImageStylePreset;
            textPromptContent += `\n(The base style '${presetLabel}' will be applied structurally by Freepik.)`;
            if (customStyleNotesInput) {
                textPromptContent += `\nIncorporate these additional custom stylistic details: "${customStyleNotesInput}".`;
            }
        } else {
            if (combinedStyle) { 
                textPromptContent += `\nIncorporate these stylistic details and elements: "${combinedStyle}".`;
            }
        }
        
        textPromptContent += `\n\n${compositionGuidance}`;

    } else { // This is Gemini and other non-Freepik providers
        if (exampleImg) {
            coreInstructions = `You are creating a strategic brand marketing image designed to drive engagement, build brand awareness, and convert viewers into customers on social media platforms.

**BRAND STRATEGY CONTEXT:**
The provided example image serves as a category reference only. Your mission is to create a completely new, brand-aligned visual asset that:
- Captures attention in crowded social media feeds
- Communicates brand values instantly
- Appeals to the target demographic
- Encourages social sharing and engagement
- Supports the brand's marketing objectives

**CORE CREATIVE BRIEF:**
1. **Brand Identity**: "${imageGenBrandDescription}"${industryCtx}
   - Extract the brand's personality, values, and unique selling proposition
   - Consider the target audience's lifestyle, aspirations, and pain points
   - Identify what makes this brand different from competitors
   - Think about the emotional connection the brand wants to create

2. **Visual Execution Style**: "${combinedStyle}"
   - This defines the aesthetic approach, mood, and technical execution
   - For realistic styles: Create professional, market-ready visuals
   - For artistic styles: Balance creativity with brand recognition
   - Consider platform-specific best practices (Instagram, TikTok, etc.)

**MARKETING OPTIMIZATION REQUIREMENTS:**
- **Scroll-stopping power**: The image must stand out in social feeds
- **Brand consistency**: Align with the brand's visual identity and messaging
- **Target audience appeal**: Resonate with the specific demographic
- **Conversion potential**: Include subtle elements that encourage action
- **Shareability factor**: Create content people want to share
- **Platform optimization**: Consider where this will be posted

**CREATIVE GUIDELINES:**
- Use the example image ONLY for category identification
- Create something completely new that embodies the brand essence
- Avoid generic or cliché visual approaches
- Include contextual elements that tell a brand story
- Consider seasonal trends and cultural relevance
- Ensure the image works both as standalone content and in campaigns

**QUALITY STANDARDS:**
- Professional marketing-grade quality
- Optimized for social media engagement
- Culturally sensitive and inclusive
- Technically excellent (lighting, composition, clarity)
- Brand-appropriate and on-message`;
        } else {
            coreInstructions = `You are creating a strategic brand marketing image designed to maximize social media engagement and brand recognition.

**BRAND MARKETING OBJECTIVE:**
Create a compelling visual that represents: "${imageGenBrandDescription}"${industryCtx}

**STRATEGIC REQUIREMENTS:**
- **Brand Storytelling**: The image should instantly communicate the brand's core value proposition
- **Target Audience Appeal**: Consider who this brand serves and what resonates with them
- **Social Media Optimization**: Design for maximum engagement on platforms like Instagram, TikTok, Facebook
- **Conversion Focus**: Include elements that encourage viewers to learn more or take action
- **Brand Differentiation**: Highlight what makes this brand unique in its market

**VISUAL EXECUTION STYLE**: "${combinedStyle}"
- For realistic styles: Create professional, market-ready content
- For artistic styles: Balance creativity with brand clarity
- Ensure the style enhances rather than overshadows the brand message

**MARKETING BEST PRACTICES:**
- Use colors and composition that align with brand personality
- Include contextual elements that tell a brand story
- Consider current social media trends and visual preferences
- Ensure the image works both standalone and in marketing campaigns
- Create content that encourages social sharing and engagement

**QUALITY STANDARDS:**
- Professional marketing-grade execution
- Culturally appropriate and inclusive
- Technically excellent (lighting, composition, clarity)
- Brand-consistent and strategically aligned`;
        }

        textPromptContent = `Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.\n\n${coreInstructions}`;
        
        if (negPrompt) {
            textPromptContent += `\n\nAvoid the following elements or characteristics in the image: ${negPrompt}.`;
        }
        if (aspect) {
            textPromptContent += `\n\n**CRITICAL REQUIREMENT**: The generated image *must* have an aspect ratio of exactly **${aspect}**. The entire image canvas must conform to this ratio without any letterboxing or pillarboxing. This is a primary constraint.`;
        }
        if (seedValue !== undefined) {
            textPromptContent += `\n\nUse seed: ${seedValue}.`;
        }
        textPromptContent +=`\n\n${compositionGuidance}`;
        if (numImages > 1 ) {
            textPromptContent += `\n\nImportant for batch generation: You are generating image 1 of a set of ${numImages}. All images in this set should feature the *same core subject or item* as described/derived from the inputs. For this specific image (1/${numImages}), try to vary the pose, angle, or minor background details slightly compared to other images in the set, while maintaining the identity of the primary subject.`;
        }
    }
    
    setCurrentTextPromptForEditing(textPromptContent);
    setFormSnapshot({
        provider: selectedImageProvider,
        brandDescription: imageGenBrandDescription,
        industry: currentIndustryValue === "_none_" ? "" : currentIndustryValue,
        imageStyle: combinedStyle, 
        exampleImage: (useExampleImageForGen && exampleImg && exampleImg.trim() !== "") ? exampleImg : undefined,
        aspectRatio: aspect,
        numberOfImages: numImages,
        negativePrompt: negPrompt === "" ? undefined : negPrompt, 
        seed: seedValue,
        freepikStylingColors: selectedImageProvider === 'FREEPIK' && freepikDominantColorsInput ? freepikDominantColorsInput.split(',').map(c => ({color: c.trim(), weight: 0.5})) : undefined,
        freepikEffectColor: selectedImageProvider === 'FREEPIK' && freepikEffectColor !== "none" ? freepikEffectColor : undefined,
        freepikEffectLightning: selectedImageProvider === 'FREEPIK' && freepikEffectLightning !== "none" ? freepikEffectLightning : undefined,
        freepikEffectFraming: selectedImageProvider === 'FREEPIK' && freepikEffectFraming !== "none" ? freepikEffectFraming : undefined,
    });
    setIsPreviewingPrompt(true);
  };

  const handleImageGenerationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const brandDesc = formSnapshot?.brandDescription || imageGenBrandDescription || brandData?.brandDescription || ""; 
    const imageStyle = formSnapshot?.imageStyle || (selectedImageStylePreset + (customStyleNotesInput ? ". " + customStyleNotesInput : "")); 
    
    if (!brandDesc.trim()) {
      toast({ title: "Missing Brand Description", description: "Please provide a brand description to generate images.", variant: "destructive" });
      return;
    }
    
    if (!imageStyle.trim()) {
      toast({ title: "Missing Image Style", description: "Please select an image style preset.", variant: "destructive" });
      return;
    }
    
    startTransition(() => {
        const formData = new FormData();

        formData.append("finalizedTextPrompt", currentTextPromptForEditing || ""); 

        const providerToUse = (isAdmin || isPremiumActive) ? (formSnapshot?.provider || selectedImageProvider) : 'GEMINI';
        formData.set("provider", providerToUse as string); 

        formData.set("brandDescription", String(brandDesc || "")); 
        
        const industryToSubmit = selectedBlogIndustry === "_none_" ? "" : (selectedBlogIndustry || "");
        formData.set("industry", industryToSubmit);
        
        formData.set("imageStyle", imageStyle);
        
        const exampleImgToUse = (isAdmin || isPremiumActive) ? formSnapshot?.exampleImage : (useExampleImageForGen && currentExampleImageForGen ? currentExampleImageForGen : undefined);
        if (typeof exampleImgToUse === 'string' && exampleImgToUse.trim() !== "") {
          formData.set("exampleImage", exampleImgToUse);
        } else {
            formData.delete("exampleImage");
        }

        formData.set("aspectRatio", formSnapshot?.aspectRatio || selectedAspectRatio); 
        formData.set("numberOfImages", String(formSnapshot?.numberOfImages || parseInt(numberOfImagesToGenerate,10))); 

        const negPromptValue = (isAdmin || isPremiumActive) ? formSnapshot?.negativePrompt : imageGenNegativePrompt; 
        if (negPromptValue && negPromptValue.toString().trim() !== "") { 
            formData.set("negativePrompt", negPromptValue.toString()); 
        } else {
            formData.delete("negativePrompt");
        }

        const seedValueNum = (isAdmin || isPremiumActive) ? formSnapshot?.seed : (imageGenSeed && !isNaN(parseInt(imageGenSeed)) ? parseInt(imageGenSeed) : undefined); 
        if (seedValueNum !== undefined) {
          formData.set("seed", String(seedValueNum));
        } else {
            formData.delete("seed");
        }

        if (providerToUse === 'FREEPIK') {
            const fColorsInputStrToUse = (isAdmin || isPremiumActive) ? (formSnapshot?.freepikStylingColors?.map(c => c.color).join(',') || "") : freepikDominantColorsInput;
            if (fColorsInputStrToUse) formData.set("freepikDominantColorsInput", fColorsInputStrToUse);
            else formData.delete("freepikDominantColorsInput");

            const fEffectColorToUse = (isAdmin || isPremiumActive) ? (formSnapshot?.freepikEffectColor || freepikEffectColor) : freepikEffectColor;
            if (fEffectColorToUse && fEffectColorToUse !== "none") formData.set("freepikEffectColor", fEffectColorToUse);
             else formData.delete("freepikEffectColor");

            const fEffectLightningToUse = (isAdmin || isPremiumActive) ? (formSnapshot?.freepikEffectLightning || freepikEffectLightning) : freepikEffectLightning;
            if (fEffectLightningToUse && fEffectLightningToUse !== "none") formData.set("freepikEffectLightning", fEffectLightningToUse);
            else formData.delete("freepikEffectLightning");

            const fEffectFramingToUse = (isAdmin || isPremiumActive) ? (formSnapshot?.freepikEffectFraming || freepikEffectFraming) : freepikEffectFraming;
            if (fEffectFramingToUse && fEffectFramingToUse !== "none") formData.set("freepikEffectFraming", fEffectFramingToUse);
            else formData.delete("freepikEffectFraming");
        }
                
        imageAction(formData);
    });
  };

  const handleGenerateBlogOutline = () => {
    setIsGeneratingOutline(true);
    const formData = new FormData();
    formData.append('brandName', (document.getElementById('blogBrandName') as HTMLInputElement)?.value || brandData?.brandName || "");
    formData.append('blogBrandDescription', (document.getElementById('blogBrandDescription') as HTMLTextAreaElement)?.value || brandData?.brandDescription || "");
    formData.append('industry', selectedBlogIndustry === "_none_" ? "" : selectedBlogIndustry || "" );
    formData.append('blogKeywords', (document.getElementById('blogKeywords') as HTMLInputElement)?.value || brandData?.targetKeywords || "");
    formData.append('blogWebsiteUrl', (document.getElementById('blogWebsiteUrl') as HTMLInputElement)?.value || brandData?.websiteUrl || "");
    formData.append('articleStyle', blogArticleStyle);
    formData.append('targetAudience', blogTargetAudience);

    if (!formData.get('brandName') && !formData.get('blogBrandDescription') && !formData.get('blogKeywords')) {
        toast({title: "Missing Info", description: "Please provide Brand Name, Description, and Keywords for outline generation.", variant: "destructive"});
        setIsGeneratingOutline(false);
        return;
    }
    startTransition(() => {
        blogOutlineAction(formData);
    });
  };

  const handleQuickStartImageSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!quickStartImageRequest.trim()) {
            toast({ title: "Empty Request", description: "Please describe what you want to create.", variant: "default" });
            return;
        }
        setIsPopulatingImageForm(true);
        const formData = new FormData(event.currentTarget);
        formData.append("currentBrandDescription", imageGenBrandDescription);
        startTransition(() => {
            populateImageFormAction(formData);
        });
    };
  
    const handleQuickStartSocialSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!quickStartSocialRequest.trim()) {
            toast({ title: "Empty Request", description: "Please describe your social post idea.", variant: "default" });
            return;
        }
        setIsPopulatingSocialForm(true);
        const formData = new FormData(event.currentTarget);
        formData.append("currentBrandDescription", brandData?.brandDescription || "");
        startTransition(() => {
            populateSocialFormAction(formData);
        });
    };
  
    const handleQuickStartBlogSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!quickStartBlogRequest.trim()) {
            toast({ title: "Empty Request", description: "Please describe your blog post idea.", variant: "default" });
            return;
        }
        setIsPopulatingBlogForm(true);
        const formData = new FormData(event.currentTarget);
        formData.append("currentBrandDescription", (document.getElementById('blogBrandDescription') as HTMLTextAreaElement)?.value || brandData?.brandDescription || "");
        formData.append("currentKeywords", (document.getElementById('blogKeywords') as HTMLInputElement)?.value || brandData?.targetKeywords || "");
        startTransition(() => {
            populateBlogFormAction(formData);
        });
    };

  const handleSocialSubmit = async (formData: FormData) => {
    let imageSrc = formData.get("selectedImageSrcForSocialPost") as string | null;

    if (imageSrc && imageSrc.startsWith('data:')) {
      try {
        const compressedImageUri = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const maxWidth = 1920; 
            const maxHeight = 1080; 
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          };
          img.onerror = reject;
          img.src = imageSrc as string;
        });

        const MAX_IMAGE_SIZE_BYTES = 950 * 1024;
        const compressedSizeInBytes = compressedImageUri.length * 0.75;
        if (compressedSizeInBytes > MAX_IMAGE_SIZE_BYTES) {
          toast({
              title: "Image Too Large",
              description: `Even after compression, this image is too large. Please use a smaller one.`,
              variant: "destructive",
              duration: 8000,
          });
          return; 
        }
        
        formData.set("selectedImageSrcForSocialPost", compressedImageUri);
        toast({
            title: "Image Processed",
            description: `Image optimized for upload.`,
            duration: 2000,
        });
      } catch (error) {
        console.error("Image compression error:", error);
        toast({
            title: "Image Processing Error",
            description: "Could not process the image. Please try a different one.",
            variant: "destructive",
            duration: 8000,
        });
        return; 
      }
    }
    
    startTransition(() => {
        socialAction(formData);
    });
  };


  const downloadImage = (imageUrl: string, filename = "generated-image.png") => {
    const link = document.createElement('a');
    link.href = imageUrl; 
    link.download = filename;
    
    if (!imageUrl.startsWith('data:')) {
        link.target = '_blank';
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSocialImageChoiceChange = (value: SocialImageChoice) => {
    setSocialImageChoice(value);
    if (value === 'generated') {
        setSelectedProfileImageIndexForSocial(null);
        setSelectedLibraryImageIndexForSocial(null);
    } else if (value === 'profile') {
        if (brandData?.exampleImages && brandData.exampleImages.length > 0 && selectedProfileImageIndexForSocial === null) {
            setSelectedProfileImageIndexForSocial(0);
        }
        setSelectedLibraryImageIndexForSocial(null);
    } else if (value === 'library') {
        if (savedLibraryImages.length > 0 && selectedLibraryImageIndexForSocial === null) {
            setSelectedLibraryImageIndexForSocial(0);
        }
        setSelectedProfileImageIndexForSocial(null);
    }
  };
  
  return (
    <div className="w-full">
      <div className="px-0 mb-6">
        <div className="flex items-center space-x-3">
            <Paintbrush className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Content Studio</h1>
              <p className="text-lg text-muted-foreground">
                Generate images, social media posts, and blog articles powered by AI.
              </p>
            </div>
          </div>
      </div>

      <Tabs defaultValue="image" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
          <TabsTrigger value="image" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Image Generation</span>
            <span className="sm:hidden">Image</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
            <MessageSquareText className="w-4 h-4" />
            <span className="hidden sm:inline">Social Media Post</span>
            <span className="sm:hidden">Social</span>
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
            <Newspaper className="w-4 h-4" />
            <span className="hidden sm:inline">Blog Post</span>
            <span className="sm:hidden">Blog</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" key={imageTabKey}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Generate Brand Images</CardTitle>
              <CardDescription>Create unique images. Uses brand description and style. Optionally use an example image from your Brand Profile.</CardDescription>
                {lastUsedImageProvider && <p className="text-xs text-primary mt-1">Image(s) last generated using: {lastUsedImageProvider}</p>}
            </CardHeader>
            <div className="px-6 mb-6">
                <Card className="bg-secondary/30 border-primary/20 shadow-inner">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <SparklesIcon className="w-6 h-6 text-primary" />
                            AI Quick Start
                        </CardTitle>
                        <CardDescription>
                            Don&apos;t know where to start? Just describe what you want, and AI will fill out the form for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleQuickStartImageSubmit} className="space-y-3">
                            <Textarea
                                id="quickStartImageRequest"
                                name="userRequest"
                                value={quickStartImageRequest}
                                onChange={(e) => setQuickStartImageRequest(e.target.value)}
                                placeholder="e.g., a professional photo of my new shoe for an instagram post"
                                rows={2}
                            />
                            <SubmitButton className="w-full sm:w-auto" loadingText="Populating..." disabled={isPopulatingImageForm || !quickStartImageRequest}>
                                Populate Form Fields
                            </SubmitButton>
                        </form>
                    </CardContent>
                </Card>
            </div>
            {isAdmin && isPreviewingPrompt ? (
              <form onSubmit={handleImageGenerationSubmit}>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="editablePromptTextarea" className="flex items-center mb-1"><Edit className="w-4 h-4 mr-2 text-primary" />Final Prompt (Editable)</Label>
                    <Textarea
                      id="editablePromptTextarea"
                      value={currentTextPromptForEditing}
                      onChange={(e) => setCurrentTextPromptForEditing(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                      placeholder="The constructed prompt will appear here. You can edit it before generation."
                    />
                      <p className="text-xs text-muted-foreground">
                      Note: For Freepik, structural parameters (aspect ratio, specific styles/effects) are set separately and won&apos;t be textually appended here by default if you edit this prompt. Editing this prompt gives most control to Gemini.
                      </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsPreviewingPrompt(false); setFormSnapshot(null);}} className="w-full sm:w-auto" disabled={isClearing}>
                      Back to Edit Fields
                  </Button>
                  <SubmitButton className="w-full sm:flex-1" loadingText={parseInt(formSnapshot?.numberOfImages?.toString() || "1") > 1 ? "Generating Images..." : "Generating Image..."} disabled={isClearing}>
                      Generate {parseInt(formSnapshot?.numberOfImages?.toString() || "1") > 1 ? `${formSnapshot?.numberOfImages} Images` : "Image"} with This Prompt
                  </SubmitButton>
                </CardFooter>
              </form>
            ) : (
              <form id="imageGenerationFormFields" onSubmit={(e) => {
                  e.preventDefault(); 
                  if (isAdmin) {
                    handlePreviewPromptClick(e as any);
                  } else {
                    handleImageGenerationSubmit(e);
                  }
              }}>
                <input type="hidden" name="industry" value={selectedBlogIndustry === "_none_" ? "" : selectedBlogIndustry || ""} />
                <CardContent className="space-y-6">
                  {isAdmin && (
                    <div>
                      <Label htmlFor="imageGenProviderSelect" className="flex items-center mb-1"><Server className="w-4 h-4 mr-2 text-primary" />Image Generation Provider</Label>
                      <Select name="provider" value={selectedImageProvider || 'GEMINI'} onValueChange={(value) => setSelectedImageProvider(value as GenerateImagesInput['provider'])}>
                          <SelectTrigger id="imageGenProviderSelect">
                              <SelectValue placeholder="Select image generation provider" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectGroup>
                                  <SelectLabel>Providers</SelectLabel>
                                  {imageGenerationProviders.map(provider => (
                                      <SelectItem 
                                        key={provider.value} 
                                        value={provider.value} 
                                        disabled={provider.disabled || (provider.premium && !isAdmin && !isPremiumActive)}
                                      >
                                          <div className="flex items-center gap-2">
                                            <span>{provider.label}</span>
                                            {provider.premium && (
                                              <span className={cn("text-xs flex items-center gap-1", (provider.premium && !isAdmin && !isPremiumActive) ? "text-muted-foreground" : "text-amber-500")}>
                                                  <Star className="h-3 w-3" />
                                                  Premium
                                                  {!isAdmin && !isPremiumActive && <Lock className="h-3 w-3 ml-1" />}
                                              </span>
                                            )}
                                          </div>
                                      </SelectItem>
                                  ))}
                              </SelectGroup>
                          </SelectContent>
                      </Select>
                      {!freepikEnabled && <p className="text-xs text-muted-foreground mt-1">Freepik provider is currently disabled by admin in settings.</p>}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="imageGenBrandDescription" className="flex items-center mb-1"><FileText className="w-4 h-4 mr-2 text-primary" />Brand Description (from Profile)</Label>
                    <Textarea
                      id="imageGenBrandDescription"
                      name="brandDescription"
                      value={imageGenBrandDescription}
                      onChange={(e) => setImageGenBrandDescription(e.target.value)}
                      placeholder="Detailed description of the brand and its values."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="imageGenImageStylePresetSelect" className="flex items-center mb-1"><Palette className="w-4 h-4 mr-2 text-primary" />Image Style Preset</Label>
                    <Select
                      name="imageStylePreset"
                      value={selectedImageStylePreset}
                      onValueChange={setSelectedImageStylePreset}
                    >
                        <SelectTrigger id="imageGenImageStylePresetSelect">
                            <SelectValue placeholder="Select image style preset" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Artistic Styles</SelectLabel>
                                {imageStylePresets.map(style => (
                                    <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                      <p className="text-xs text-muted-foreground mt-1">Some styles are more effective with specific providers. Notes below can add detail. Freepik styles are best with Freepik provider.</p>
                  </div>

                  <div>
                    <Label htmlFor="imageGenCustomStyleNotes" className="flex items-center mb-1"><Edit className="w-4 h-4 mr-2 text-primary" />Custom Style Notes (from Profile)</Label>
                    <Textarea
                      id="imageGenCustomStyleNotes"
                      name="customStyleNotes"
                      value={customStyleNotesInput}
                      onChange={(e) => setCustomStyleNotesInput(e.target.value)}
                      placeholder="E.g., 'add a touch of vintage', 'focus on metallic textures'. These notes are added to the main text prompt."
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useExampleImageForGen"
                      name="useExampleImage" 
                      checked={useExampleImageForGen}
                      onCheckedChange={(checked) => setUseExampleImageForGen(checked as boolean)}
                    />
                    <Label htmlFor="useExampleImageForGen" className="text-sm font-medium">
                      Use Example Image from Profile as Reference?
                    </Label>
                  </div>

                  {useExampleImageForGen && (
                    <div>
                        <Label className="flex items-center mb-1">
                            <ImageIcon className="w-4 h-4 mr-2 text-primary" />Example Image from Profile
                        </Label>
                          {brandData?.exampleImages && brandData.exampleImages.length > 0 ? (
                            <div className="mt-2 space-y-2">
                                {brandData.exampleImages.length > 1 ? (
                                    <>
                                    <p className="text-xs text-muted-foreground">Select Profile Image to Use as Reference:</p>
                                    <div className="flex space-x-2 overflow-x-auto pb-2">
                                        {brandData.exampleImages.map((imgSrc, index) => (
                                            <button
                                                type="button"
                                                key={`gen-profile-${index}`}
                                                onClick={() => setSelectedProfileImageIndexForGen(index)}
                                                className={cn(
                                                    "w-20 h-20 rounded border-2 p-0.5 flex-shrink-0 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring",
                                                    selectedProfileImageIndexForGen === index ? "border-primary ring-2 ring-primary" : "border-border"
                                                )}
                                            >
                                                <NextImage src={imgSrc} alt={`Example ${index + 1}`} width={76} height={76} className="object-contain w-full h-full rounded-sm" data-ai-hint="style example"/>
                                            </button>
                                        ))}
                                    </div>
                                    </>
                                  ) : ( 
                                      <div className="w-20 h-20 rounded border-2 p-0.5 border-primary ring-2 ring-primary flex-shrink-0">
                                          <NextImage src={brandData.exampleImages[0]} alt={`Example 1}`} width={76} height={76} className="object-contain w-full h-full rounded-sm" data-ai-hint="style example"/>
                                      </div>
                                  )}
                                { currentExampleImageForGen && ( 
                                    <p className="text-xs text-muted-foreground">
                                        Using image {selectedProfileImageIndexForGen !== null && brandData.exampleImages && brandData.exampleImages.length > 1 ? selectedProfileImageIndexForGen + 1 : "1"} as reference.
                                        {selectedImageProvider === 'FREEPIK' && (isAdmin || isPremiumActive) && " (Freepik/Imagen3 uses AI description of this image, not the image directly for text-to-image.)"}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-1">No example images in Brand Profile to select.</p>
                        )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="imageGenNegativePrompt" className="flex items-center mb-1"><CircleSlash className="w-4 h-4 mr-2 text-primary" />Negative Prompt (Optional)</Label>
                    <Textarea
                      id="imageGenNegativePrompt"
                      name="negativePrompt"
                      value={imageGenNegativePrompt}
                      onChange={(e) => setImageGenNegativePrompt(e.target.value)}
                      placeholder="E.g., avoid text, ugly, disfigured, low quality"
                      rows={2}
                    />
                  </div>
                  
                  {selectedImageProvider === 'FREEPIK' && (isPremiumActive || isAdmin) && ( 
                      <>
                          <div className="pt-4 mt-4 border-t">
                              <h4 className="text-md font-semibold mb-3 text-primary flex items-center"><Paintbrush className="w-5 h-5 mr-2"/>Freepik Specific Styling (imagen3 model)</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <Label htmlFor="freepikDominantColorsInput" className="flex items-center mb-1"><PaletteIcon className="w-4 h-4 mr-2 text-primary" />Dominant Colors</Label>
                                  <Input
                                      id="freepikDominantColorsInput"
                                      name="freepikDominantColorsInput"
                                      value={freepikDominantColorsInput}
                                      onChange={(e) => setFreepikDominantColorsInput(e.target.value)}
                                      placeholder="Up to 5 hex codes, e.g., #FF0000,#00FF00"
                                  />
                                  <p className="text-xs text-muted-foreground">Comma-separated hex codes. (Freepik imagen3 specific)</p>
                              </div>
                              <div>
                                  <Label htmlFor="freepikEffectColor" className="flex items-center mb-1"><Paintbrush className="w-4 h-4 mr-2 text-primary" />Effect - Color</Label>
                                  <Select name="freepikEffectColor" value={freepikEffectColor} onValueChange={setFreepikEffectColor}>
                                      <SelectTrigger id="freepikEffectColor"><SelectValue placeholder="Select Freepik color effect" /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="none">None</SelectItem>
                                          {freepikImagen3EffectColors.map(effect => <SelectItem key={effect.value} value={effect.value}>{effect.label}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                                    <p className="text-xs text-muted-foreground">(Freepik imagen3 specific)</p>
                              </div>
                              <div>
                                  <Label htmlFor="freepikEffectLightning" className="flex items-center mb-1"><Zap className="w-4 h-4 mr-2 text-primary" />Effect - Lightning</Label>
                                  <Select name="freepikEffectLightning" value={freepikEffectLightning} onValueChange={setFreepikEffectLightning}>
                                      <SelectTrigger id="freepikEffectLightning"><SelectValue placeholder="Select Freepik lightning effect" /></SelectTrigger>
                                      <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                          {freepikImagen3EffectLightnings.map(effect => <SelectItem key={effect.value} value={effect.value}>{effect.label}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                                    <p className="text-xs text-muted-foreground">(Freepik imagen3 specific)</p>
                              </div>
                              <div>
                                  <Label htmlFor="freepikEffectFraming" className="flex items-center mb-1"><Aperture className="w-4 h-4 mr-2 text-primary" />Effect - Framing</Label>
                                  <Select name="freepikEffectFraming" value={freepikEffectFraming} onValueChange={setFreepikEffectFraming}>
                                      <SelectTrigger id="freepikEffectFraming"><SelectValue placeholder="Select Freepik framing effect" /></SelectTrigger>
                                      <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                          {freepikImagen3EffectFramings.map(effect => <SelectItem key={effect.value} value={effect.value}>{effect.label}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                                    <p className="text-xs text-muted-foreground">(Freepik imagen3 specific)</p>
                              </div>
                          </div>
                      </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="imageGenAspectRatioSelect" className="flex items-center mb-1"><Ratio className="w-4 h-4 mr-2 text-primary" />Aspect Ratio</Label>
                        <Select
                          name="aspectRatio"
                          required
                          value={selectedAspectRatio}
                          onValueChange={setSelectedAspectRatio}
                        >
                        <SelectTrigger id="imageGenAspectRatioSelect">
                            <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                            {currentAspectRatioOptions.map(ar => (
                              <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="numberOfImagesSelect" className="flex items-center mb-1"><Images className="w-4 h-4 mr-2 text-primary" />Number of Images</Label>
                        <Select 
                            name="numberOfImages" 
                            value={numberOfImagesToGenerate} 
                            onValueChange={setNumberOfImagesToGenerate}
                        >
                            <SelectTrigger id="numberOfImagesSelect">
                                <SelectValue placeholder="Select number" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4].map(num => (
                                    <SelectItem 
                                        key={num} 
                                        value={String(num)}
                                        disabled={!isAdmin && !isPremiumActive && num > 1}
                                    >
                                        <div className="flex items-center gap-2">
                                        {num}
                                        {!isAdmin && !isPremiumActive && num > 1 &&
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">(<Lock className="h-3 w-3" /> Premium)</span>
                                        }
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!isAdmin && !isPremiumActive && (
                             <p className="text-xs text-muted-foreground mt-1">Free plan allows 1 image per generation.</p>
                        )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="imageGenSeed" className="flex items-center mb-1"><Pipette className="w-4 h-4 mr-2 text-primary" />Seed (Optional)</Label>
                    <Input
                      id="imageGenSeed"
                      name="seed"
                      type="number"
                      value={imageGenSeed || ""}
                      onChange={(e) => setImageGenSeed(e.target.value)}
                      placeholder="Enter a number for reproducible results"
                      min="0"
                      disabled={(selectedImageProvider === 'FREEPIK' && (isAdmin || isPremiumActive)) || isClearing}
                    />
                      <p className="text-xs text-muted-foreground">
                        {(selectedImageProvider === 'FREEPIK' && (isAdmin || isPremiumActive)) ? "Seed is ignored for Freepik/Imagen3 UI integration." : "Seed might not be strictly enforced by all models."}
                      </p>
                  </div>
                </CardContent>
                <CardFooter>
                  {isAdmin ? (
                    <Button type="submit" className="w-full" disabled={isClearing}>
                        <Eye className="mr-2 h-4 w-4" /> Preview Prompt
                    </Button>
                  ) : (
                    <SubmitButton 
                        className="w-full" 
                        loadingText={parseInt(numberOfImagesToGenerate,10) > 1 ? "Generating Images..." : "Generating Image..."}
                        type="submit"
                        disabled={isClearing}
                    >
                        Generate {parseInt(numberOfImagesToGenerate,10) > 1 ? `${numberOfImagesToGenerate} Images` : "Image"}
                    </SubmitButton>
                  )}
                </CardFooter>
              </form> 
            )} 

            {lastSuccessfulGeneratedImageUrls.length > 0 && (
              <Card className="mt-6 mb-4 shadow-sm">
                  <CardHeader>
                      <CardTitle className="text-xl flex items-center">
                          <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                          Generated Image{lastSuccessfulGeneratedImageUrls.length > 1 ? 's' : ''}
                          {lastUsedImageProvider && <span className="text-xs text-muted-foreground ml-2">(via {lastUsedImageProvider})</span>}
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {lastSuccessfulGeneratedImageUrls.some(url => url?.startsWith('data:') || url.startsWith('image_url:')) && (
                              <Button
                                type="button"
                                onClick={handleSaveAllGeneratedImages}
                                disabled={isSavingImages || !lastSuccessfulGeneratedImageUrls.some(url => url?.startsWith('data:') || url.startsWith('image_url:'))}
                                size="sm"
                            >
                                {isSavingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save All to Library
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleClearGeneratedImages} disabled={isClearing}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {`Clear Image${lastSuccessfulGeneratedImageUrls.length > 1 ? 's' : ''}`}
                        </Button>
                    </div>
                    <ImprovedImageGrid 
                        imageUrls={lastSuccessfulGeneratedImageUrls}
                        onDownload={downloadImage}
                        className="w-full"
                    />
                    {(isAdmin) && lastUsedImageGenPrompt && ( 
                      <div className="mt-4">
                          <div className="flex justify-between items-center mb-1">
                              <Label htmlFor="usedImagePromptDisplay" className="flex items-center text-sm font-medium"><FileText className="w-4 h-4 mr-2 text-primary" />Prompt Used:</Label>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(lastUsedImageGenPrompt || "", "Prompt")} className="text-muted-foreground hover:text-primary">
                                  <Copy className="w-3 h-3 mr-1" /> Copy Prompt
                              </Button>
                          </div>
                          <Textarea
                              id="usedImagePromptDisplay"
                              value={lastUsedImageGenPrompt || ""}
                              onChange={(e) => setLastUsedImageGenPrompt(e.target.value)}
                              rows={Math.min(10, (lastUsedImageGenPrompt?.match(/\n/g) || []).length + 2)}
                              className="text-xs bg-muted/50 font-mono"
                              placeholder="The prompt used for generation will appear here. You can edit it for your reference or to copy elsewhere."
                          />
                      </div>
                    )}
                      <Button
                      variant="outline"
                      className="mt-4"
                      onClick={handleUseGeneratedImageForSocial}
                      disabled={!lastSuccessfulGeneratedImageUrls.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))}
                    >
                      <ImageUp className="mr-2 h-4 w-4" /> Use First Image for Social Post
                    </Button>
                  </CardContent>
              </Card>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><MessageSquareText className="w-6 h-6 mr-2 text-primary"/>Create Social Media Post</CardTitle>
              <CardDescription>Generate engaging captions and hashtags. Uses brand description, image description (optional), and selected tone.</CardDescription>
            </CardHeader>
            <div className="px-6 mb-6">
                <Card className="bg-secondary/30 border-primary/20 shadow-inner">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <SparklesIcon className="w-6 h-6 text-primary" />
                            AI Quick Start
                        </CardTitle>
                        <CardDescription>
                            Describe your social post idea, and AI will fill out the form for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleQuickStartSocialSubmit} className="space-y-3">
                            <Textarea
                                id="quickStartSocialRequest"
                                name="userRequest"
                                value={quickStartSocialRequest}
                                onChange={(e) => setQuickStartSocialRequest(e.target.value)}
                                placeholder="e.g., a funny post about our new coffee flavor, with a picture of a cat."
                                rows={2}
                            />
                            <SubmitButton className="w-full sm:w-auto" loadingText="Populating..." disabled={isPopulatingSocialForm || !quickStartSocialRequest}>
                                Populate Social Form
                            </SubmitButton>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const currentFormData = new FormData(e.currentTarget);
                     currentFormData.append("industry", selectedBlogIndustry === "_none_" ? "" : selectedBlogIndustry || "");
                    if (userId) currentFormData.append("userId", userId); 
                    if (currentUser?.email) currentFormData.append("userEmail", currentUser.email); 
                    handleSocialSubmit(currentFormData);
                }}
            >
              
              <input type="hidden" name="selectedImageSrcForSocialPost" value={useImageForSocialPost && currentSocialImagePreviewUrl ? currentSocialImagePreviewUrl : ""} />
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                      <Checkbox
                          id="useImageForSocialPost"
                          checked={useImageForSocialPost}
                          onCheckedChange={(checked) => {
                              const isChecked = checked as boolean;
                              setUseImageForSocialPost(isChecked);
                              if (!isChecked) {
                                  setSocialImageChoice(null);
                              } else if (isChecked && socialImageChoice === null) { 
                                  if (sessionLastImageGenerationResult?.generatedImages?.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))) {
                                      handleSocialImageChoiceChange('generated');
                                  } else if (brandData?.exampleImages && brandData.exampleImages.length > 0) {
                                      handleSocialImageChoiceChange('profile');
                                  } else if (!isLoadingSavedLibraryImages && savedLibraryImages.length > 0) {
                                      handleSocialImageChoiceChange('library');
                                  } else {
                                      handleSocialImageChoiceChange(null); 
                                  }
                              }
                          }}
                      />
                      <Label htmlFor="useImageForSocialPost" className="text-base font-medium">
                          Use an image for this post?
                      </Label>
                  </div>

                  {useImageForSocialPost && (
                    <div className="pl-6 space-y-4">
                      <RadioGroup
                          value={socialImageChoice || ""}
                          onValueChange={(value) => handleSocialImageChoiceChange(value as SocialImageChoice)}
                          className="space-y-2"
                      >
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="generated" id="social-generated" disabled={!sessionLastImageGenerationResult?.generatedImages?.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))}/>
                              <Label htmlFor="social-generated" className={(!sessionLastImageGenerationResult?.generatedImages?.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))) ? "text-muted-foreground" : ""}>
                                  Use Last Generated Image {(!sessionLastImageGenerationResult?.generatedImages?.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))) ? "(None available/suitable)" : `(${(sessionLastImageGenerationResult)?.generatedImages?.filter(url => url?.startsWith('data:') || url?.startsWith('image_url:')).length} available)`}
                              </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="profile" id="social-profile" disabled={!brandData?.exampleImages || brandData.exampleImages.length === 0} />
                              <Label htmlFor="social-profile" className={(!brandData?.exampleImages || brandData.exampleImages.length === 0) ? "text-muted-foreground" : ""}>
                                  Use Brand Profile Example Image {!brandData?.exampleImages || brandData.exampleImages.length === 0 ? "(None available)" : `(${(brandData?.exampleImages?.length || 0)} available)`}
                              </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="library" id="social-library" disabled={isLoadingSavedLibraryImages || savedLibraryImages.length === 0} />
                              <Label htmlFor="social-library" className={(isLoadingSavedLibraryImages || savedLibraryImages.length === 0) ? "text-muted-foreground" : ""}>
                                  Select from AI-Generated Library {isLoadingSavedLibraryImages ? "(Loading...)" : savedLibraryImages.length === 0 ? "(None available)" : `(${savedLibraryImages.length} available)`}
                              </Label>
                          </div>
                      </RadioGroup>

                      {socialImageChoice === 'profile' && brandData?.exampleImages && brandData.exampleImages.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {brandData.exampleImages.length > 1 ? (
                                  <>
                                  <p className="text-xs text-muted-foreground mb-1">Select Profile Image for Social Post:</p>
                                  <div className="flex space-x-2 overflow-x-auto pb-2">
                                      {brandData.exampleImages.map((imgSrc, index) => (
                                          <button
                                              type="button"
                                              key={`social-profile-${index}`}
                                              onClick={() => setSelectedProfileImageIndexForSocial(index)}
                                              className={cn(
                                                  "w-16 h-16 rounded border-2 p-0.5 flex-shrink-0 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring",
                                                  selectedProfileImageIndexForSocial === index ? "border-primary ring-2 ring-primary" : "border-border"
                                              )}
                                          >
                                              <NextImage src={imgSrc} alt={`Profile Example ${index + 1}`} width={60} height={60} className="object-contain w-full h-full rounded-sm" data-ai-hint="social media reference"/>
                                          </button>
                                      ))}
                                  </div>
                                  </>
                                ) : brandData?.exampleImages?.[0] ? (
                                  <div className="w-16 h-16 rounded border-2 p-0.5 border-primary ring-2 ring-primary flex-shrink-0">
                                        <NextImage src={brandData.exampleImages[0]} alt={`Profile Example 1`} width={60} height={60} className="object-contain w-full h-full rounded-sm" data-ai-hint="social media reference"/>
                                    </div>
                                ) : null}
                              {selectedProfileImageIndexForSocial !== null && brandData?.exampleImages?.[selectedProfileImageIndexForSocial] && (
                                <p className="text-xs text-muted-foreground">Using image {brandData.exampleImages.length > 1 ? selectedProfileImageIndexForSocial + 1 : '1'} from profile.</p>
                              )}
                            </div>
                      )}

                      {socialImageChoice === 'library' && !isLoadingSavedLibraryImages && savedLibraryImages.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {savedLibraryImages.length > 1 ? (
                                  <>
                                  <p className="text-xs text-muted-foreground mb-1">Select Library Image for Social Post:</p>
                                  <div className="flex space-x-2 overflow-x-auto pb-2">
                                      {savedLibraryImages.map((img, index) => (
                                          <button
                                              type="button"
                                              key={`social-library-${index}`}
                                              onClick={() => setSelectedLibraryImageIndexForSocial(index)}
                                              className={cn(
                                                  "w-16 h-16 rounded border-2 p-0.5 flex-shrink-0 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring",
                                                  selectedLibraryImageIndexForSocial === index ? "border-primary ring-2 ring-primary" : "border-border"
                                              )}
                                          >
                                              <NextImage src={img.storageUrl} alt={`Library Image ${index + 1}`} width={60} height={60} className="object-contain w-full h-full rounded-sm" data-ai-hint="library content"/>
                                          </button>
                                      ))}
                                  </div>
                                  </>
                                ) : savedLibraryImages[0] ? (
                                  <div className="w-16 h-16 rounded border-2 p-0.5 border-primary ring-2 ring-primary flex-shrink-0">
                                        <NextImage src={savedLibraryImages[0].storageUrl} alt={`Library Image 1`} width={60} height={60} className="object-contain w-full h-full rounded-sm" data-ai-hint="library content"/>
                                    </div>
                                ) : null}
                              {selectedLibraryImageIndexForSocial !== null && savedLibraryImages[selectedLibraryImageIndexForSocial] && (
                                <p className="text-xs text-muted-foreground">Using image {savedLibraryImages.length > 1 ? selectedLibraryImageIndexForSocial + 1 : '1'} from library.</p>
                              )}
                            </div>
                      )}

                    </div>
                  )}

                  {currentSocialImagePreviewUrl && useImageForSocialPost && (
                      <div className="pl-6 mt-2 mb-3">
                          <p className="text-sm font-medium mb-1 text-muted-foreground">Selected image for post:</p>
                            <div className="relative w-32 h-32 border rounded-md overflow-hidden mb-2">
                              <NextImage
                                src={currentSocialImagePreviewUrl}
                                alt="Selected image for social post"
                                fill
                                sizes="128px"
                                style={{objectFit: 'cover', objectPosition: 'center'}} 
                                data-ai-hint="social content" />
                          </div>
                      </div>
                    )}
                    {useImageForSocialPost && !currentSocialImagePreviewUrl && (
                      <p className="pl-6 text-xs text-muted-foreground mb-3">No image selected or available for the social post. Please choose an available source.</p>
                    )}
                </div>

                <div>
                  <Label htmlFor="socialBrandDescription" className="flex items-center mb-1"><FileText className="w-4 h-4 mr-2 text-primary" />Brand Description (from Profile)</Label>
                  <Textarea
                    id="socialBrandDescription"
                    name="brandDescription"
                    defaultValue={brandData?.brandDescription || ""}
                    placeholder="Your brand's essence."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="socialImageDescription" className="flex items-center"><UserSquare className="w-4 h-4 mr-2 text-primary" />Image Description {useImageForSocialPost && currentSocialImagePreviewUrl ? '' : '(Optional)'}</Label>
                      {useImageForSocialPost && currentSocialImagePreviewUrl && (
                          <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAIDescribeImage}
                              disabled={isGeneratingDescription}
                          >
                              {isGeneratingDescription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                              AI Describe Image
                          </Button>
                      )}
                  </div>
                  <Textarea
                    id="socialImageDescription"
                    name="socialImageDescription"
                    value={socialImageDescription}
                    onChange={(e) => setSocialImageDescription(e.target.value)}
                    placeholder={useImageForSocialPost && !!currentSocialImagePreviewUrl ? "Describe the image you're posting or use AI. Required if image used." : "Optionally describe the theme if not using an image."}
                    rows={3}
                    required={useImageForSocialPost && !!currentSocialImagePreviewUrl}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="socialPostGoal" className="flex items-center mb-1"><Target className="w-4 h-4 mr-2 text-primary" />Post Goal</Label>
                        <Select name="postGoal" value={socialPostGoal} onValueChange={setSocialPostGoal}>
                            <SelectTrigger><SelectValue placeholder="Select a goal" /></SelectTrigger>
                            <SelectContent>
                                {socialPostGoals.map(goal => <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="socialTargetAudience" className="flex items-center mb-1"><Users className="w-4 h-4 mr-2 text-primary" />Target Audience</Label>
                        <Input
                            id="socialTargetAudience"
                            name="targetAudience"
                            value={socialTargetAudience}
                            onChange={(e) => setSocialTargetAudience(e.target.value)}
                            placeholder="e.g., Young professionals, parents"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="socialToneSelect" className="flex items-center mb-1"><ThumbsUp className="w-4 h-4 mr-2 text-primary" />Tone</Label>
                        <Select name="tone" required value={socialToneValue} onValueChange={setSocialToneValue}>
                          <SelectTrigger id="socialToneSelect">
                            <SelectValue placeholder="Select a tone" />
                          </SelectTrigger>
                          <SelectContent>
                            {socialTones.map(tone => <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    </div>
                    <div>
                      <Label htmlFor="customSocialToneNuances" className="flex items-center mb-1"><Edit className="w-4 h-4 mr-2 text-primary" />Custom Tone Nuances (Optional)</Label>
                      <Input
                        id="customSocialToneNuances"
                        name="customSocialToneNuances"
                        value={customSocialToneNuances}
                        onChange={(e) => setCustomSocialToneNuances(e.target.value)}
                        placeholder="e.g., 'but slightly urgent'"
                      />
                    </div>
                </div>

                <div>
                    <Label htmlFor="socialCallToAction" className="flex items-center mb-1"><ChevronRight className="w-4 h-4 mr-2 text-primary" />Call to Action (Optional)</Label>
                    <Input
                        id="socialCallToAction"
                        name="callToAction"
                        value={socialCallToAction}
                        onChange={(e) => setSocialCallToAction(e.target.value)}
                        placeholder="e.g., Click the link in our bio!"
                    />
                </div>
              </CardContent>
              <CardFooter>
                <SubmitButton className="w-full" loadingText="Generating Content..." disabled={socialSubmitDisabled}>Generate Social Post</SubmitButton>
              </CardFooter>
            </form>
              {generatedSocialPost && (
                <Card className="mt-6 shadow-sm"> 
                  <CardHeader>
                      <CardTitle className="text-xl flex items-center">
                          <MessageSquareText className="w-5 h-5 mr-2 text-primary" />
                          Generated Social Post
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Image and text ready! Download the image (if applicable) and copy the caption/hashtags to post on Instagram.
                      </p>
                      {generatedSocialPost.imageSrc && (
                            <div className="mb-4">
                              <p className="text-sm font-medium mb-1 text-muted-foreground">Associated Image:</p>
                              <div className="relative w-32 h-32 border rounded-md overflow-hidden mb-2">
                                  {generatedSocialPost?.imageSrc && <NextImage
                                    src={generatedSocialPost.imageSrc}
                                    alt="Social post image"
                                    fill
                                    sizes="128px"
                                    style={{objectFit: 'cover', objectPosition: 'center'}} 
                                    data-ai-hint="social content" />}
                              </div>
                              {generatedSocialPost?.imageSrc && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadImage(generatedSocialPost.imageSrc || "", `social-post-${new Date().getTime()}.png`)}
                                >
                                  <Download className="mr-2 h-4 w-4"/> Download Image
                                </Button>
                              )}
                          </div>
                      )}
                      <div>
                          <Label htmlFor="generatedCaption" className="text-sm font-medium mb-1 text-muted-foreground">Generated Caption:</Label>
                          <div className="p-3 border rounded-md bg-muted/50">
                              <p id="generatedCaption" className="text-sm whitespace-pre-wrap">{generatedSocialPost.caption}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedSocialPost.caption, "Caption")} className="mt-1 text-muted-foreground hover:text-primary">
                              <Copy className="w-3 h-3 mr-1" /> Copy Caption
                          </Button>
                      </div>
                      <div>
                          <Label htmlFor="generatedHashtags" className="text-sm font-medium mb-1 text-muted-foreground">Generated Hashtags:</Label>
                          <div className="p-3 border rounded-md bg-muted/50">
                              <p id="generatedHashtags" className="text-sm whitespace-pre-wrap break-words">{generatedSocialPost.hashtags}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedSocialPost.hashtags, "Hashtags")} className="mt-1 text-muted-foreground hover:text-primary">
                              <Copy className="w-3 h-3 mr-1" /> Copy Hashtags
                          </Button>
                      </div>
                  </CardContent>
                </Card>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="blog">
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><Newspaper className="w-6 h-6 mr-2 text-primary"/>Create Blog Content</CardTitle>
                    <CardDescription>Generate SEO-friendly blog posts. Define an outline, choose a tone, and let AI write the content.</CardDescription>
                </CardHeader>
                <div className="px-6 mb-6">
                    <Card className="bg-secondary/30 border-primary/20 shadow-inner">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <SparklesIcon className="w-6 h-6 text-primary" />
                                AI Quick Start
                            </CardTitle>
                            <CardDescription>
                                Describe your blog post idea, and AI will populate the fields and generate an outline for you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleQuickStartBlogSubmit} className="space-y-3">
                                <Textarea
                                    id="quickStartBlogRequest"
                                    name="userRequest"
                                    value={quickStartBlogRequest}
                                    onChange={(e) => setQuickStartBlogRequest(e.target.value)}
                                    placeholder="e.g., a how-to guide for beginners on using our new coffee machine"
                                    rows={2}
                                />
                                <SubmitButton className="w-full sm:w-auto" loadingText="Populating..." disabled={isPopulatingBlogForm || !quickStartBlogRequest}>
                                    Populate Blog Form & Outline
                                </SubmitButton>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <form 
                  action={(formData) => {
                    formData.append("industry", selectedBlogIndustry === "_none_" ? "" : selectedBlogIndustry || "");
                    if (userId) formData.append("userId", userId);
                    if (currentUser?.email) formData.append("userEmail", currentUser.email); 
                    blogAction(formData);
                  }} 
                  className="w-full"
                >
                  <CardContent className="space-y-6">
                      <div>
                          <Label htmlFor="blogBrandName" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Brand Name (from Profile)</Label>
                          <Input
                          id="blogBrandName"
                          name="brandName"
                          defaultValue={brandData?.brandName || ""}
                          placeholder="Your brand's name"
                          />
                      </div>
                      <div>
                          <Label htmlFor="blogBrandDescription" className="flex items-center mb-1"><FileText className="w-4 h-4 mr-2 text-primary" />Brand Description (from Profile)</Label>
                          <Textarea
                          id="blogBrandDescription"
                          name="blogBrandDescription"
                          defaultValue={brandData?.brandDescription || ""}
                          placeholder="Detailed brand description"
                          rows={3}
                          />
                      </div>
                                          
                      <div>
                          <Label htmlFor="blogKeywords" className="flex items-center mb-1"><Tag className="w-4 h-4 mr-2 text-primary" />Keywords (from Profile)</Label>
                          <Input
                          id="blogKeywords"
                          name="blogKeywords"
                          defaultValue={brandData?.targetKeywords || ""}
                          placeholder="Comma-separated keywords (e.g., AI, marketing, branding)"
                          />
                      </div>
                       <div>
                          <Label htmlFor="blogTargetAudience" className="flex items-center mb-1"><Users className="w-4 h-4 mr-2 text-primary" />Target Audience</Label>
                          <Input
                              id="blogTargetAudience"
                              name="targetAudience"
                              value={blogTargetAudience}
                              onChange={(e) => setBlogTargetAudience(e.target.value)}
                              placeholder="e.g., Beginners, marketing experts"
                          />
                      </div>
                      <div>
                          <Label htmlFor="blogWebsiteUrl" className="flex items-center mb-1"><Globe className="w-4 h-4 mr-2 text-primary" />Website URL (Optional, for SEO & Outline)</Label>
                          <Input
                              id="blogWebsiteUrl"
                              name="blogWebsiteUrl"
                              defaultValue={brandData?.websiteUrl || ""}
                              placeholder="https://www.example.com"
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <Label htmlFor="blogArticleStyle" className="flex items-center mb-1"><ListOrdered className="w-4 h-4 mr-2 text-primary" />Article Style/Format</Label>
                            <Select name="articleStyle" value={blogArticleStyle} onValueChange={setBlogArticleStyle}>
                                <SelectTrigger><SelectValue placeholder="Select an article style" /></SelectTrigger>
                                <SelectContent>
                                    {blogArticleStyles.map(style => <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="blogToneSelect" className="flex items-center mb-1"><Mic2 className="w-4 h-4 mr-2 text-primary" />Tone for Blog</Label>
                            <Select name="blogTone" value={selectedBlogTone} onValueChange={setSelectedBlogTone}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tone/style" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Blog Tones/Styles</SelectLabel>
                                        {blogTones.map(tone => (
                                            <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between items-center mb-1">
                              <Label htmlFor="blogOutline" className="flex items-center"><ListOrdered className="w-4 h-4 mr-2 text-primary" />Blog Outline</Label>
                              <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGenerateBlogOutline}
                                  disabled={isGeneratingOutline}
                              >
                                  {isGeneratingOutline ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                  Generate Outline with AI
                              </Button>
                          </div>
                          <Textarea
                          id="blogOutline"
                          name="blogOutline"
                          placeholder="Enter your blog outline here, or generate one with AI. Markdown is supported."
                          rows={8}
                          value={generatedBlogOutline}
                          onChange={(e) => setGeneratedBlogOutline(e.target.value)}
                          />
                            <p className="text-sm text-muted-foreground">AI will strictly follow this outline to generate the blog post.</p>
                      </div>

                      <div>
                          <Label htmlFor="blogTargetPlatformSelect" className="flex items-center mb-1"><Newspaper className="w-4 h-4 mr-2 text-primary" />Target Platform</Label>
                          <Select name="targetPlatform" value={blogPlatformValue} onValueChange={(value) => setBlogPlatformValue(value as "Medium" | "Other")}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Other">Other (Generic Blog)</SelectItem>
                          </SelectContent>
                          </Select>
                      </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start">
                    <SubmitButton 
                        className="w-full" 
                        loadingText="Generating Blog..." 
                        disabled={
                            isGeneratingOutline || 
                            !generatedBlogOutline.trim() ||
                            (!isAdmin && !isPremiumActive && !isBlogFeatureEnabledForFreeUsers)
                        }
                    >
                        {(!isAdmin && !isPremiumActive && !isBlogFeatureEnabledForFreeUsers) && <Lock className="mr-2 h-4 w-4" />}
                        Generate Blog Post {(!isAdmin && !isPremiumActive && !isBlogFeatureEnabledForFreeUsers) ? '(Premium Feature)' : ''}
                    </SubmitButton>
                    {(!isAdmin && !isPremiumActive && !isBlogFeatureEnabledForFreeUsers) && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Full blog post generation is a premium feature. 
                            <Button variant="link" className="p-0 h-auto ml-1 text-xs" asChild>
                                <Link href="/pricing">Upgrade your plan.</Link>
                            </Button>
                        </p>
                    )}
                  </CardFooter>
                  </form>
              </Card>
              {generatedBlogPost && (
                <Card className="mt-6 shadow-sm"> 
                  <CardHeader>
                      <CardTitle className="text-xl flex items-center">
                          <Newspaper className="w-5 h-5 mr-2 text-primary" />
                          Generated Blog Post
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div>
                          <Label htmlFor="generatedBlogTitle" className="text-sm font-medium mb-1 text-muted-foreground">Generated Title:</Label>
                          <div className="p-3 border rounded-md bg-muted/50">
                              <p id="generatedBlogTitle" className="text-lg font-medium">{generatedBlogPost.title}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedBlogPost.title, "Title")} className="mt-1 text-muted-foreground hover:text-primary">
                              <Copy className="w-3 h-3 mr-1" /> Copy Title
                          </Button>
                      </div>
                      <div>
                          <Label htmlFor="generatedBlogContent" className="text-sm font-medium mb-1 text-muted-foreground">Generated Content:</Label>
                          <div className="p-3 prose border rounded-md bg-muted/50 max-w-none max-h-96 overflow-y-auto">
                              <p id="generatedBlogContent" className="whitespace-pre-wrap">{generatedBlogPost.content}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedBlogPost.content, "Content")} className="mt-1 text-muted-foreground hover:text-primary">
                              <Copy className="w-3 h-3 mr-1" /> Copy Content
                          </Button>
                      </div>
                      <div>
                          <Label htmlFor="generatedBlogTags" className="text-sm font-medium mb-1 text-muted-foreground">Generated Tags:</Label>
                          <div className="p-3 border rounded-md bg-muted/50">
                              <p id="generatedBlogTags" className="text-sm">{generatedBlogPost.tags}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedBlogPost.tags, "Tags")} className="mt-1 text-muted-foreground hover:text-primary">
                              <Copy className="w-3 h-3 mr-1" /> Copy Tags
                          </Button>
                      </div>
                  </CardContent>
                </Card>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
