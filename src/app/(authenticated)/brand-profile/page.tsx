
"use client";

import React, { useEffect, useState, useRef, useActionState, startTransition, useMemo } from 'react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { BrandProfileImage } from '@/components/SafeImage';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { UserCircle, LinkIcon, FileText, UploadCloud, Tag, Brain, Loader2, Trash2, Edit, Briefcase, Image as ImageIconLucide, Sparkles, Star, ShieldCheck, UserSearch, Users, Wand2, Type as TypeIcon, Palette, ImagePlay, Download, Rocket } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { brandTemplates, getAllCategories, getTemplatesByCategory, type BrandTemplate } from '@/lib/templates';
import { handleExtractBrandInfoFromUrlAction, handleGenerateBrandLogoAction, handleGetAllUserProfilesForAdminAction, handleEnhanceBrandDescriptionAction, type FormState as ExtractFormState, type FormState as GenerateLogoFormState, type FormState as AdminFetchProfilesState, type FormState as EnhanceDescriptionState } from '@/lib/actions';
import { storage, db } from '@/lib/firebaseConfig';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SubmitButton } from '@/components/SubmitButton';
import type { GenerateBrandLogoOutput } from '@/ai/flows/generate-brand-logo-flow';
import type { EnhanceBrandDescriptionOutput } from '@/ai/flows/enhance-brand-description-flow';
import { industries } from '@/lib/constants';
import type { BrandData, UserProfileSelectItem } from '@/types';
import { cn } from '@/lib/utils';
import { RefineImageDialog } from '@/components/RefineImageDialog';
import { checkFirebaseStorageUrl } from '@/lib/client-storage-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const MAX_IMAGES_PREMIUM = 5;
const MAX_IMAGES_FREE = 2;

const brandProfileSchema = z.object({
  brandName: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  websiteUrl: z.string()
    .transform((val) => {
      // If empty, return as-is
      if (!val || val.trim() === '') return '';
      // Add https:// if no protocol is present
      if (!/^https?:\/\//i.test(val)) {
        return 'https://' + val.trim();
      }
      return val.trim();
    })
    .pipe(z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal(''))),
  brandDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  industry: z.string().optional(),
  imageStyleNotes: z.string().optional(),
  exampleImages: z.array(z.string().url({ message: "Each image must be a valid URL." })).optional(),
  targetKeywords: z.string().optional(),
  logoType: z.enum(['logomark', 'logotype', 'monogram']).optional(),
  logoShape: z.enum(['circle', 'square', 'shield', 'hexagon', 'diamond', 'triangle', 'custom']).optional(),
  logoStyle: z.enum(['minimalist', 'modern', 'classic', 'playful', 'bold', 'elegant', 'vintage', 'organic']).optional(),
  logoColors: z.string().optional(),
  logoBackground: z.enum(['white', 'light', 'transparent', 'dark']).optional(),
  brandLogoUrl: z.union([
    z.string().url({ message: "Please enter a valid URL." }),
    z.string().startsWith('data:').optional(),
    z.literal('').optional()
  ]).optional(),
  plan: z.enum(['free', 'premium']).optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  subscriptionEndDate: z.any().optional(),
  welcomeGiftOffered: z.boolean().optional(),
  hasUsedPreviewMode: z.boolean().optional(),
});

type BrandProfileFormData = z.infer<typeof brandProfileSchema>;

const defaultFormValues: BrandProfileFormData = {
  brandName: "",
  websiteUrl: "",
  brandDescription: "",
  industry: "_none_",
  imageStyleNotes: "",
  exampleImages: [],
  targetKeywords: "",
  logoType: 'logomark',
  logoShape: "circle",
  logoStyle: "modern",
  logoColors: '',
  logoBackground: 'dark',
  brandLogoUrl: "",
  plan: 'free',
  userEmail: "",
  subscriptionEndDate: null,
  welcomeGiftOffered: false,
  hasUsedPreviewMode: false,
};

const initialExtractState: ExtractFormState<{ brandDescription: string; targetKeywords: string; }> = { error: undefined, data: undefined, message: undefined };
const initialGenerateLogoState: GenerateLogoFormState<GenerateBrandLogoOutput> = { error: undefined, data: undefined, message: undefined };
const initialAdminFetchProfilesState: AdminFetchProfilesState<UserProfileSelectItem[]> = { error: undefined, data: undefined, message: undefined };
const initialEnhanceState: EnhanceDescriptionState<EnhanceBrandDescriptionOutput> = { error: undefined, data: undefined, message: undefined };

export default function BrandProfilePage() {
  const { currentUser, userId, isLoading: isAuthLoading } = useAuth();
  const { brandData: contextBrandData, setBrandData: setContextBrandData, isLoading: isBrandContextLoading, error: brandContextError, setSessionLastImageGenerationResult } = useBrand();
  const { toast } = useToast();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminTargetUserId, setAdminTargetUserId] = useState<string>("");
  const [adminSelectedUserIdFromDropdown, setAdminSelectedUserIdFromDropdown] = useState<string>("");
  const [adminLoadedProfileData, setAdminLoadedProfileData] = useState<BrandData | null>(null);
  const [isAdminLoadingTargetProfile, setIsAdminLoadingTargetProfile] = useState<boolean>(false);
  const [userProfilesForAdmin, setUserProfilesForAdmin] = useState<UserProfileSelectItem[]>([]);

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  const [extractState, extractAction] = useActionState(handleExtractBrandInfoFromUrlAction, initialExtractState);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const [enhanceState, enhanceAction] = useActionState(handleEnhanceBrandDescriptionAction, initialEnhanceState);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const [generateLogoState, generateLogoAction] = useActionState(handleGenerateBrandLogoAction, initialGenerateLogoState);
  const [generatedLogoPreview, setGeneratedLogoPreview] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);
  
  const [adminFetchProfilesServerState, adminFetchProfilesAction] = useActionState(handleGetAllUserProfilesForAdminAction, initialAdminFetchProfilesState);
  const [isLoadingAdminProfiles, setIsLoadingAdminProfiles] = useState(false);

  const [refineModalOpen, setRefineModalOpen] = useState(false);
  const [imageToRefine, setImageToRefine] = useState<string | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [acceptedRefinement, setAcceptedRefinement] = useState<{ originalUrl: string, newUrl: string } | null>(null);

  // Template selection state
  const [showTemplates, setShowTemplates] = useState(false);

  const currentProfileBeingEdited = isAdmin && adminTargetUserId && adminLoadedProfileData ? adminLoadedProfileData : contextBrandData;
  const effectiveUserIdForStorage = isAdmin && adminTargetUserId ? adminTargetUserId : userId;

  const isPremiumActive = useMemo(() => {
    if (!currentProfileBeingEdited) return false;
    const { plan, subscriptionEndDate } = currentProfileBeingEdited;
    if (plan !== 'premium' || !subscriptionEndDate) return false;
    const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
    return endDate > new Date();
  }, [currentProfileBeingEdited]);

  const formValues = useMemo(() => {
    const dataToUse = currentProfileBeingEdited || defaultFormValues;
    const currentData = {
        ...defaultFormValues,
        ...dataToUse,
        industry: (dataToUse.industry && dataToUse.industry.trim() !== "" && dataToUse.industry !== "undefined") ? dataToUse.industry : "_none_",
        plan: (dataToUse.plan && ['free', 'premium'].includes(dataToUse.plan)) ? dataToUse.plan : 'free',
        userEmail: dataToUse.userEmail || (currentUser?.email && dataToUse === contextBrandData ? currentUser.email : ""),
    };
    const currentMaxImages = isPremiumActive ? MAX_IMAGES_PREMIUM : MAX_IMAGES_FREE;
    currentData.exampleImages = Array.isArray(currentData.exampleImages) ? currentData.exampleImages.slice(0, currentMaxImages) : [];
    
    return currentData;
  }, [currentProfileBeingEdited, currentUser, contextBrandData, isPremiumActive]);
  

  const form = useForm<BrandProfileFormData>({
    resolver: zodResolver(brandProfileSchema),
    values: formValues, // Use `values` to keep form in sync with data
  });
  
  const watchedPlan = form.watch('plan');
  const maxImagesAllowed = isPremiumActive ? MAX_IMAGES_PREMIUM : MAX_IMAGES_FREE;

  // This useEffect handles UI side-effects when the form data changes
  useEffect(() => {
    setPreviewImages(formValues.exampleImages || []);
    setSelectedFileNames((formValues.exampleImages || []).map((_, i) => `Saved image ${i + 1}`));
    if (form.getValues("brandLogoUrl") !== generatedLogoPreview) {
        setGeneratedLogoPreview(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues.exampleImages, formValues.brandLogoUrl]);


  useEffect(() => {
    if (currentUser && currentUser.email === 'admin@brandforge.ai') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      setAdminTargetUserId(""); 
      setAdminLoadedProfileData(null);
      setUserProfilesForAdmin([]);
    }
  }, [currentUser]);
  
  useEffect(() => {
    if (isAdmin && currentUser?.email) {
      const fetchAdminProfiles = async () => {
        setIsLoadingAdminProfiles(true);
        try {
          const formData = new FormData();
          formData.append('adminRequesterEmail', currentUser.email || '');
          startTransition(() => {
            adminFetchProfilesAction(formData);
          });
        } catch (error) {
          console.error('Failed to fetch admin profiles:', error);
          setIsLoadingAdminProfiles(false);
        }
      };
      
      fetchAdminProfiles();
    }
  }, [isAdmin, currentUser, adminFetchProfilesAction]);

  useEffect(() => {
    setIsLoadingAdminProfiles(false);
    if (adminFetchProfilesServerState.data) {
      setUserProfilesForAdmin(adminFetchProfilesServerState.data);
    }
    if (adminFetchProfilesServerState.error) {
      toast({ title: "Error Fetching User Profiles", description: adminFetchProfilesServerState.error, variant: "destructive"});
    }
  }, [adminFetchProfilesServerState, toast]);


  useEffect(() => {
    if (brandContextError) {
      toast({ title: "Error loading your brand data", description: brandContextError, variant: "destructive" });
    }
  }, [brandContextError, toast]);

  useEffect(() => {
    if (extractState.data) {
      form.setValue('brandDescription', extractState.data.brandDescription, { shouldValidate: true });
      form.setValue('targetKeywords', extractState.data.targetKeywords, { shouldValidate: true });
      toast({ title: "Success", description: extractState.message || "Brand information extracted." });
    }
    if (extractState.error) toast({ title: "Extraction Error", description: extractState.error, variant: "destructive" });
    setIsExtracting(false);
  }, [extractState, form, toast]);
  
  useEffect(() => {
    setIsEnhancing(false);
    if (enhanceState.data?.enhancedDescription) {
        form.setValue('brandDescription', enhanceState.data.enhancedDescription, { shouldValidate: true });
        if (enhanceState.data.targetKeywords) {
          form.setValue('targetKeywords', enhanceState.data.targetKeywords, { shouldValidate: true });
        }
        toast({ title: "Content Enhanced", description: enhanceState.message || "Description and keywords have been updated by AI." });
    }
    if (enhanceState.error) {
        toast({ title: "Enhancement Error", description: enhanceState.error, variant: "destructive" });
    }
  }, [enhanceState, form, toast]);

  useEffect(() => {
    setIsGeneratingLogo(false);
    if (generateLogoState.data?.logoDataUri) {
      setGeneratedLogoPreview(generateLogoState.data.logoDataUri);
      toast({ title: "Logo Generated!", description: "Preview new logo. Save profile to keep it." });
    }
    if (generateLogoState.error) toast({ title: "Logo Gen Error", description: generateLogoState.error, variant: "destructive" });
  }, [generateLogoState, toast]);

  const handleAdminLoadTargetUserProfile = async (targetUid?: string) => {
    const uidToLoad = targetUid || adminSelectedUserIdFromDropdown;
    if (!uidToLoad.trim()) {
      toast({ title: "Missing User ID", description: "Please select a user to load.", variant: "destructive" });
      return;
    }
    
    setIsAdminLoadingTargetProfile(true);
    setAdminLoadedProfileData(null);
    
    try {
      const targetUserDocRef = doc(db, "users", uidToLoad, "brandProfiles", uidToLoad);
      const docSnap = await getDoc(targetUserDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as BrandData;
        setAdminLoadedProfileData(data);
        setAdminTargetUserId(uidToLoad);
        form.reset(data); // reset form with loaded data
        toast({ title: "Profile Loaded", description: `Displaying profile for User: ${data?.userEmail || uidToLoad.substring(0,8)}...` });
      } else {
        toast({ title: "Not Found", description: `No profile found for User ID: ${uidToLoad}`, variant: "destructive" });
        setAdminTargetUserId("");
      }
    } catch (error: any) {
      console.error("Admin profile load error:", error);
      let errorMessage = `Failed to load profile: ${error.message}`;
      if (error.message?.includes('Missing or insufficient permissions')) {
        errorMessage = "Permission denied. Admin authentication may not be properly configured.";
      }
      toast({ title: "Load Error", description: errorMessage, variant: "destructive" });
      setAdminTargetUserId("");
    } finally {
      setIsAdminLoadingTargetProfile(false);
    }
  };
  
  useEffect(() => {
    if (adminSelectedUserIdFromDropdown && adminSelectedUserIdFromDropdown !== adminTargetUserId) {
        handleAdminLoadTargetUserProfile(adminSelectedUserIdFromDropdown);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSelectedUserIdFromDropdown]);


  const handleAdminLoadMyProfile = () => {
      setAdminTargetUserId("");
      setAdminLoadedProfileData(null);
      setAdminSelectedUserIdFromDropdown("");
      form.reset(contextBrandData || defaultFormValues);
      toast({ title: "My Profile", description: "Displaying your own brand profile." });
  };

  // Apply brand template to form
  const applyTemplate = (template: BrandTemplate) => {
    form.setValue('brandDescription', template.brandDescription, { shouldValidate: true });
    form.setValue('industry', template.industry, { shouldValidate: true });
    form.setValue('imageStyleNotes', template.imageStyleNotes || '', { shouldValidate: true });
    form.setValue('targetKeywords', template.targetKeywords || '', { shouldValidate: true });
    if (template.logoType) form.setValue('logoType', template.logoType, { shouldValidate: true });
    if (template.logoShape) form.setValue('logoShape', template.logoShape, { shouldValidate: true });
    if (template.logoStyle) form.setValue('logoStyle', template.logoStyle, { shouldValidate: true });
    if (template.logoColors) form.setValue('logoColors', template.logoColors, { shouldValidate: true });

    setShowTemplates(false);
    toast({
      title: "Template Applied",
      description: `${template.name} template loaded! Customize it to match your brand.`,
    });
  };

  const handleAutoFill = () => {
    let websiteUrl = form.getValues("websiteUrl");
    if (!websiteUrl) {
      toast({ title: "Missing URL", description: "Please enter a website URL.", variant: "destructive" });
      return;
    }
    // Prepend https:// if no protocol is present
    if (!/^https?:\/\//i.test(websiteUrl)) {
      websiteUrl = 'https://' + websiteUrl;
    }

    setIsExtracting(true);
    startTransition(() => {
      const formData = new FormData();
      formData.append("websiteUrl", websiteUrl);
      extractAction(formData);
    });
  };
  
  const handleEnhanceDescription = () => {
    const brandName = form.getValues("brandName");
    const brandDescription = form.getValues("brandDescription");
    if (!brandDescription || brandDescription.length < 10) {
        toast({ title: "Not Enough Text", description: "Please provide at least 10 characters in the description to enhance.", variant: "default" });
        return;
    }
    setIsEnhancing(true);
    const formData = new FormData();
    formData.append("brandName", brandName);
    formData.append("brandDescription", brandDescription);
    startTransition(() => {
        enhanceAction(formData);
    });
  };

  const handleGenerateLogo = () => {
    const brandName = form.getValues("brandName");
    const brandDescription = form.getValues("brandDescription");
    const industry = form.getValues("industry");
    const targetKeywords = form.getValues("targetKeywords");
    const logoShape = form.getValues("logoShape");
    const logoStyle = form.getValues("logoStyle");
    const logoType = form.getValues("logoType");
    const logoColors = form.getValues("logoColors");
    const logoBackground = form.getValues("logoBackground");

    if (!brandName || !brandDescription) {
      toast({ title: "Missing Info", description: "Brand Name & Description required for logo.", variant: "default" });
      return;
    }
    setIsGeneratingLogo(true);
    const formData = new FormData();
    formData.append("brandName", brandName);
    formData.append("brandDescription", brandDescription);
    if (industry) formData.append("industry", industry);
    if (targetKeywords) formData.append("targetKeywords", targetKeywords);
    if (logoShape) formData.append("logoShape", logoShape);
    if (logoStyle) formData.append("logoStyle", logoStyle);
    if (logoType) formData.append("logoType", logoType);
    if (logoColors) formData.append("logoColors", logoColors);
    if (logoBackground) formData.append("logoBackground", logoBackground);
    if (effectiveUserIdForStorage) formData.append("userId", effectiveUserIdForStorage);
    
    const emailForLogoAction = currentProfileBeingEdited?.userEmail || (userId === effectiveUserIdForStorage ? currentUser?.email : undefined);
    if (emailForLogoAction) formData.append("userEmail", emailForLogoAction);


    startTransition(() => generateLogoAction(formData));
  };

  const uploadImageToStorage = async (file: File, index: number, totalFiles: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!effectiveUserIdForStorage) {
        toast({ title: "Upload Error", description: "User context unclear. Cannot upload images.", variant: "destructive" });
        reject(new Error("User context unclear"));
        return;
      }
      const filePath = `users/${effectiveUserIdForStorage}/brand_example_images/${Date.now()}_${file.name}`;
      const imageStorageRef = storageRef(storage, filePath);
      const uploadTask = uploadBytesResumable(imageStorageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((index / totalFiles) * 100 + (progress / totalFiles));
        },
        (error) => reject(error),
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) { reject(error); }
        }
      );
    });
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const currentSavedImages = form.getValues("exampleImages") || [];

      if (currentSavedImages.length + files.length > maxImagesAllowed) {
        toast({
          title: "Limit Exceeded",
          description: `Plan allows ${maxImagesAllowed} images. Have ${currentSavedImages.length}, tried to add ${files.length}.`,
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setSelectedFileNames(prev => [...prev.filter((_, i) => i < currentSavedImages.length), ...files.map(f => f.name)]);
      setIsUploading(true);
      setUploadProgress(0);
      const newLocalPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newLocalPreviews]);

      try {
        const successfullyUploadedURLs = await Promise.all(files.map((file, index) => uploadImageToStorage(file, index, files.length)));
        const updatedImages = [...currentSavedImages, ...successfullyUploadedURLs];
        form.setValue('exampleImages', updatedImages, { shouldValidate: true });
        setPreviewImages(updatedImages);
        setSelectedFileNames(updatedImages.map((_, i) => `Saved image ${i + 1}`));
        toast({ title: "Images Uploaded", description: `${successfullyUploadedURLs.length} image(s) ready. Save profile.` });
      } catch (error: any) {
        toast({ title: "Uploads Failed", description: `Not all images uploaded: ${error.message}`, variant: "destructive" });
        const stillValidImages = form.getValues("exampleImages") || []; 
        setPreviewImages(stillValidImages); 
        setSelectedFileNames(stillValidImages.map((_,i) => `Saved image ${i+1}`));
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        newLocalPreviews.forEach(url => URL.revokeObjectURL(url));
      }
    }
  };
  
  const handleDeleteImage = async (imageUrlToDelete: string, indexToDelete: number) => {
    const currentImages = form.getValues("exampleImages") || [];
    const updatedFormImages = currentImages.filter((_, index) => index !== indexToDelete);
    
    // First check if the image actually exists in storage
    if (imageUrlToDelete.includes("firebasestorage.googleapis.com")) {
      const imageExists = await checkFirebaseStorageUrl(imageUrlToDelete);
      
      if (!imageExists) {
        // Image is orphaned - just remove from Firestore
        form.setValue("exampleImages", updatedFormImages, { shouldValidate: true });
        setPreviewImages(updatedFormImages);
        setSelectedFileNames(prev => prev.filter((_, index) => index !== indexToDelete));
        toast({
          title: "Orphaned Image Removed",
          description: "Image reference was outdated and has been cleaned up. Save profile to finalize.",
          variant: "default"
        });
        return;
      }
    }
    
    // Update UI optimistically
    form.setValue("exampleImages", updatedFormImages, { shouldValidate: true });
    setPreviewImages(updatedFormImages);
    setSelectedFileNames(prev => prev.filter((_, index) => index !== indexToDelete));

    try {
      if (imageUrlToDelete.includes("firebasestorage.googleapis.com")) {
        const imageRef = storageRef(storage, imageUrlToDelete);
        await deleteObject(imageRef);
      }
      toast({ title: "Image Deleted", description: "Image removed from storage. Save profile to finalize." });
    } catch (error: any) {
      // If deletion fails, revert the UI changes
      toast({ title: "Deletion Error", description: `Failed to delete from storage: ${error.message}. Reverting.`, variant: "destructive" });
      form.setValue("exampleImages", currentImages, { shouldValidate: true });
      setPreviewImages(currentImages);
      setSelectedFileNames(currentImages.map((_,i) => `Saved image ${i+1}`));
    }
  };

  const onSubmit: SubmitHandler<BrandProfileFormData> = async (data) => {
    const wasProfileIncomplete = !currentProfileBeingEdited?.brandDescription;
    let finalData = { ...data };
    const userIdToSaveFor = isAdmin && adminTargetUserId ? adminTargetUserId : userId;

    if (!userIdToSaveFor) {
      toast({ title: "Save Error", description: "User context is unclear. Cannot save profile.", variant: "destructive" });
      return;
    }

    // Auto-enhance description if brand name is not mentioned in it
    if (finalData.brandName && finalData.brandDescription) {
      const brandNameLower = finalData.brandName.toLowerCase();
      const descriptionLower = finalData.brandDescription.toLowerCase();

      // Check if brand name is NOT in the description
      if (!descriptionLower.includes(brandNameLower)) {
        try {
          setIsEnhancing(true);
          toast({
            title: "Personalizing Description",
            description: "Adding your brand name to the description...",
            duration: 3000
          });

          const formDataForEnhance = new FormData();
          formDataForEnhance.append("brandName", finalData.brandName);
          formDataForEnhance.append("brandDescription", finalData.brandDescription);

          // Call enhance action directly
          const enhanceResult = await handleEnhanceBrandDescriptionAction(initialEnhanceState, formDataForEnhance);

          if (enhanceResult.data?.enhancedDescription) {
            finalData.brandDescription = enhanceResult.data.enhancedDescription;
            if (enhanceResult.data.targetKeywords) {
              finalData.targetKeywords = enhanceResult.data.targetKeywords;
            }
            // Update form to show the enhanced description
            form.setValue('brandDescription', enhanceResult.data.enhancedDescription, { shouldValidate: true });
            if (enhanceResult.data.targetKeywords) {
              form.setValue('targetKeywords', enhanceResult.data.targetKeywords, { shouldValidate: true });
            }
            toast({
              title: "Description Enhanced",
              description: "Your brand name has been added to the description.",
              duration: 3000
            });
          }
        } catch (error: any) {
          console.error("Auto-enhance failed:", error);
          // Continue with save even if enhancement fails
          toast({
            title: "Note",
            description: "Could not personalize description, saving as-is.",
            variant: "default",
            duration: 3000
          });
        } finally {
          setIsEnhancing(false);
        }
      }
    }

    if (!isAdmin) {
      finalData.plan = currentProfileBeingEdited?.plan || 'free';
      finalData.subscriptionEndDate = currentProfileBeingEdited?.subscriptionEndDate || null;
      finalData.welcomeGiftOffered = currentProfileBeingEdited?.welcomeGiftOffered || false;
      finalData.hasUsedPreviewMode = currentProfileBeingEdited?.hasUsedPreviewMode || false;
    } else {
        if (finalData.plan === 'free') {
            finalData.subscriptionEndDate = null;
        } else if (finalData.plan === 'premium') {
            const currentEndDate = finalData.subscriptionEndDate?.toDate
                ? finalData.subscriptionEndDate.toDate()
                : finalData.subscriptionEndDate ? new Date(finalData.subscriptionEndDate) : null;
            
            if (!currentEndDate || currentEndDate <= new Date()) {
                const newEndDate = new Date();
                newEndDate.setDate(newEndDate.getDate() + 30);
                finalData.subscriptionEndDate = newEndDate;
            }
        }
    }
    
    const currentImages = finalData.exampleImages || [];
    if (currentImages.length > maxImagesAllowed) {
        finalData.exampleImages = currentImages.slice(0, maxImagesAllowed);
        toast({ title: "Image Limit Adjusted", description: `Images adjusted to ${maxImagesAllowed} for plan.`, variant: "default" });
    }

    if (!isAdmin || (isAdmin && userIdToSaveFor === userId)) {
      finalData.userEmail = currentUser?.email || "";
    } else if (isAdmin && adminTargetUserId && adminLoadedProfileData) {
      finalData.userEmail = adminLoadedProfileData.userEmail || "";
    }


    if (generatedLogoPreview) finalData.brandLogoUrl = ""; 

    setIsUploadingLogo(true);
    setLogoUploadProgress(0);
    let progressInterval: NodeJS.Timeout | undefined;

    if (generatedLogoPreview) {
      try {
        const logoFilePath = `users/${userIdToSaveFor}/brand_logos/logo_${Date.now()}.png`;
        const logoStorageRef = storageRef(storage, logoFilePath);
        progressInterval = setInterval(() => setLogoUploadProgress(prev => Math.min(prev + 10, 90)), 100);
        const snapshot = await uploadString(logoStorageRef, generatedLogoPreview, 'data_url');
        if (progressInterval) clearInterval(progressInterval);
        setLogoUploadProgress(100);
        finalData.brandLogoUrl = await getDownloadURL(snapshot.ref);
        toast({ title: "Logo Uploaded", description: "New logo will be saved." });
      } catch (error: any) {
        if (progressInterval) clearInterval(progressInterval);
        setIsUploadingLogo(false); setLogoUploadProgress(0);
        toast({ title: "Logo Upload Error", description: `Failed to upload logo: ${error.message}. Profile saved without new logo.`, variant: "destructive" });
        delete finalData.brandLogoUrl; 
      }
    }

    try {
      if (isAdmin && adminTargetUserId) { 
        await setContextBrandData(finalData, adminTargetUserId);
        setAdminLoadedProfileData(finalData); 
      } else if (userId) { 
        await setContextBrandData(finalData, userId);
      }
      toast({ title: "Brand Profile Saved", description: "Information saved successfully." });

      // Redirect if it was the first time completing the profile
      if (wasProfileIncomplete && finalData.brandDescription) {
        router.push('/content-studio');
      }
    } catch (error: any) {
      toast({ title: "Save Error", description: error.message || "Failed to save profile.", variant: "destructive" });
    } finally {
      setIsUploadingLogo(false); setLogoUploadProgress(0);
    }
  };

  const handleOpenRefineModal = (url: string) => {
    setImageToRefine(url);
    setRefineModalOpen(true);
  };

  const handleAcceptRefinement = (originalUrl: string, newUrl: string) => {
    // Check if this is a logo refinement (original URL matches current logo)
    const currentLogo = generatedLogoPreview || currentProfileBeingEdited?.brandLogoUrl;
    if (originalUrl === currentLogo) {
      // Logo refinement - directly update the logo preview
      setGeneratedLogoPreview(newUrl);
      toast({
        title: "Logo Refined",
        description: "Logo has been updated. Click 'Save Brand Profile' to finalize.",
      });
      return;
    }

    // This is for Brand Profile example images
    setAcceptedRefinement({ originalUrl, newUrl });
    setShowAcceptDialog(true);
  };
  
  // New helper function to upload a data URI and return the storage URL
  const uploadDataUriAsImage = async (dataUri: string): Promise<string> => {
    if (!effectiveUserIdForStorage) {
      throw new Error("User context unclear. Cannot upload refined image.");
    }
    const filePath = `users/${effectiveUserIdForStorage}/brand_example_images/refined_${Date.now()}.png`;
    const imageStorageRef = storageRef(storage, filePath);
    const snapshot = await uploadString(imageStorageRef, dataUri, 'data_url');
    return getDownloadURL(snapshot.ref);
  };
  
  const handleOverwriteImage = async () => {
    if (!acceptedRefinement) return;
    setIsUploading(true);
    try {
      const newStorageUrl = await uploadDataUriAsImage(acceptedRefinement.newUrl);
      const currentImages = form.getValues("exampleImages") || [];
      const updatedImages = currentImages.map(img => (img === acceptedRefinement.originalUrl ? newStorageUrl : img));
      form.setValue('exampleImages', updatedImages, { shouldValidate: true, shouldDirty: true });

      // Delete the old image from storage if it was a storage URL
      if (acceptedRefinement.originalUrl.includes("firebasestorage.googleapis.com")) {
        try {
          await deleteObject(storageRef(storage, acceptedRefinement.originalUrl));
        } catch (deleteError) {
          console.warn("Failed to delete old image, it may be orphaned:", deleteError);
        }
      }
      
      toast({
        title: "Image Updated",
        description: "The original image has been replaced. Click 'Save Brand Profile' to finalize.",
      });
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload the new image. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setShowAcceptDialog(false);
      setAcceptedRefinement(null);
    }
  };
  
  const handleSaveAsNewImage = async () => {
    if (!acceptedRefinement) return;
    const currentImages = form.getValues("exampleImages") || [];

    if (currentImages.length >= maxImagesAllowed) {
        toast({
          title: "Image Limit Reached",
          description: `Cannot save as new. Your plan allows a maximum of ${maxImagesAllowed} example images.`,
          variant: "destructive",
        });
        setShowAcceptDialog(false);
        setAcceptedRefinement(null);
        return;
    }
    
    setIsUploading(true);
    try {
      const newStorageUrl = await uploadDataUriAsImage(acceptedRefinement.newUrl);
      const updatedImages = [...currentImages, newStorageUrl];
      form.setValue('exampleImages', updatedImages, { shouldValidate: true, shouldDirty: true });

      toast({
          title: "Saved as New Image",
          description: "The refined image has been added. Click 'Save Brand Profile' to finalize.",
      });
    } catch (error) {
       toast({ title: "Upload Failed", description: "Could not upload the new image. Please try again.", variant: "destructive" });
    } finally {
       setIsUploading(false);
       setShowAcceptDialog(false);
       setAcceptedRefinement(null);
    }
  };
  
  const handleDownloadLogo = () => {
    const logoUrl = generatedLogoPreview || currentProfileBeingEdited?.brandLogoUrl;
    if (!logoUrl) {
      toast({ title: "No Logo", description: "No logo available to download.", variant: "destructive" });
      return;
    }

    try {
      // Create a temporary link element
      const link = document.createElement('a');
      const brandName = form.getValues("brandName") || "brand";
      const fileName = `${brandName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_logo.png`;
      
      if (logoUrl.startsWith('data:')) {
        // For data URIs (generated logos)
        link.href = logoUrl;
        link.download = fileName;
      } else {
        // For Firebase Storage URLs, we need to handle CORS
        link.href = logoUrl;
        link.download = fileName;
        link.target = '_blank';
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Download Started", description: "Logo download initiated." });
    } catch (error: any) {
      toast({ title: "Download Error", description: `Failed to download logo: ${error.message}`, variant: "destructive" });
    }
  };


  if (isAuthLoading || (isBrandContextLoading && !currentProfileBeingEdited && !(isAdmin && adminTargetUserId))) {
    return (
      <div data-testid="loading-state" className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="ml-4 text-lg">Loading Brand Profile...</p>
      </div>
    );
  }
  
  const currentLogoToDisplay = generatedLogoPreview || currentProfileBeingEdited?.brandLogoUrl;
  const canUploadMoreImages = (form.getValues("exampleImages")?.length || 0) < maxImagesAllowed;
  
  const isEditingOwnProfileAsAdmin = isAdmin && adminTargetUserId === userId;
  const displayTitleText = isAdmin && adminTargetUserId ? 
    (isEditingOwnProfileAsAdmin ? "Brand Profile (Editing My Profile as Admin)" : `Editing Profile for: ${currentProfileBeingEdited?.userEmail || adminTargetUserId.substring(0,8)}...`) : 
    "Brand Profile";

  return (
    <>
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>How would you like to save the refined image?</AlertDialogTitle>
            <AlertDialogDescription>
              You can either overwrite the original image or save your new creation as an additional example image for your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => { setShowAcceptDialog(false); setAcceptedRefinement(null); }} disabled={isUploading}>Cancel</Button>
            <Button onClick={handleSaveAsNewImage} disabled={(form.getValues("exampleImages")?.length || 0) >= maxImagesAllowed || isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Save as New Image
            </Button>
            <Button onClick={handleOverwriteImage} className="btn-gradient-primary" disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Overwrite Original
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RefineImageDialog
        isOpen={refineModalOpen}
        onOpenChange={setRefineModalOpen}
        imageToRefine={imageToRefine}
        onRefinementAccepted={handleAcceptRefinement}
      />
      <ScrollArea className="h-full">
        <div className="max-w-3xl mx-auto py-6 px-4">
          {isAdmin && (
            <Card className="mb-6 bg-secondary/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><ShieldCheck className="w-6 h-6 mr-2 text-primary" />Admin Controls</CardTitle>
                <CardDescription>Load and edit a specific user&apos;s brand profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 w-full">
                  <Select
                    value={adminSelectedUserIdFromDropdown}
                    onValueChange={(value) => {
                      setAdminSelectedUserIdFromDropdown(value);
                    }}
                    disabled={isLoadingAdminProfiles || isAdminLoadingTargetProfile}
                  >
                    <SelectTrigger className="flex-grow min-w-0 h-auto min-h-10 [&>span]:whitespace-normal [&>span]:line-clamp-none">
                      <SelectValue placeholder={isLoadingAdminProfiles ? "Loading users..." : "Select a user to load/edit"} />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                      <SelectGroup>
                        <SelectLabel>Users</SelectLabel>
                        {isLoadingAdminProfiles && <SelectItem value="loading" disabled>Loading users...</SelectItem>}
                        {!isLoadingAdminProfiles && userProfilesForAdmin.length === 0 && <SelectItem value="nousers" disabled>No user profiles found.</SelectItem>}
                        {userProfilesForAdmin.map(profile => (
                          <SelectItem key={profile.userId} value={profile.userId}>
                            <div className="whitespace-normal break-words">
                              {profile.brandName || "Unnamed Brand"} - ({profile.userEmail || profile.userId.substring(0,8)+"..."})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                {adminTargetUserId && (
                  <Button onClick={handleAdminLoadMyProfile} variant="outline" size="sm" className="w-full h-auto whitespace-normal">
                    Switch to Editing My Own Profile
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Template Selection - Only show if no existing brand description */}
          {!currentProfileBeingEdited?.brandDescription && !isAdmin && (
            <Card className="mb-6 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                      <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base sm:text-xl break-words">Quick Start with Templates</CardTitle>
                      <CardDescription className="text-xs sm:text-sm line-clamp-2">Choose a template to get started in seconds</CardDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={showTemplates ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex-shrink-0 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">{showTemplates ? 'Hide Templates' : 'Browse Templates'}</span>
                    <span className="inline sm:hidden">{showTemplates ? 'Hide' : 'Browse'}</span>
                  </Button>
                </div>
              </CardHeader>
              {showTemplates && (
                <CardContent>
                  <div className="space-y-6">
                    {getAllCategories().map((category) => {
                      const templates = getTemplatesByCategory(category);
                      return (
                        <div key={category}>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                            {templates.map((template) => (
                              <Button
                                key={template.id}
                                type="button"
                                variant="outline"
                                className="h-auto flex flex-col items-center justify-start p-2 sm:p-3 md:p-4 gap-1.5 sm:gap-2 hover:border-primary hover:bg-primary/5 transition-all min-h-[80px] sm:min-h-[100px] overflow-hidden"
                                onClick={() => applyTemplate(template)}
                              >
                                <span className="text-2xl sm:text-3xl flex-shrink-0">{template.icon}</span>
                                <span className="text-xs sm:text-sm font-medium text-center break-words overflow-wrap-anywhere w-full leading-tight px-1">{template.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center break-words">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      Templates pre-fill your brand profile. You can customize everything before saving!
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <UserCircle className="w-10 h-10 text-primary flex-shrink-0" />
                <div className="overflow-hidden">
                  <CardTitle className="text-2xl md:text-3xl font-bold break-words">{displayTitleText}</CardTitle>
                  <CardDescription className="text-md md:text-lg break-words">
                    Define the identity. Fuels AI for content and campaigns.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="brandProfileFormReal">
                  <FormField
                    control={form.control}
                    name="brandName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-base"><UserCircle className="w-5 h-5 mr-2 text-primary"/>Brand Name <span className="text-destructive ml-1">*</span></FormLabel>
                        <FormControl><Input placeholder="Acme Innovations" {...field} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || isEnhancing} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="userEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-base"><Users className="w-5 h-5 mr-2 text-primary"/>User Email</FormLabel>
                        <FormControl><Input type="email" placeholder="user@example.com" {...field} disabled={true} /></FormControl>
                        <FormDescription>User&apos;s email address (read-only).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-base"><LinkIcon className="w-5 h-5 mr-2 text-primary"/>Website URL</FormLabel>
                        <div className="flex items-center space-x-2">
                          <div className="flex-grow min-w-0">
                             <FormControl><Input placeholder="https://example.com" {...field} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || isEnhancing} /></FormControl>
                          </div>
                          <Button type="button" onClick={handleAutoFill} disabled={isExtracting || isBrandContextLoading || isAdminLoadingTargetProfile || !field.value || form.getFieldState("websiteUrl").invalid || isUploading || isGeneratingLogo || isUploadingLogo || isEnhancing} variant="outline" size="sm" title="Auto-fill">
                            {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                          </Button>
                        </div>
                        <FormDescription>
                          Optional. If you don&apos;t have a website, just describe your brand below. The AI works great with just a description and you can use the ✨ Enhance with AI button!
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brandDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-base"><FileText className="w-5 h-5 mr-2 text-primary"/>Brand Description <span className="text-destructive ml-1">*</span></FormLabel>
                        <FormDescription>This is the most important field! The AI uses this to understand your brand's voice and style.</FormDescription>
                        <FormControl>
                            <Textarea 
                              placeholder="Describe brand, values, audience..." 
                              rows={5} 
                              {...field} 
                              disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || isEnhancing} 
                            />
                        </FormControl>
                        <div className="mt-2">
                          <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button 
                                          type="button" 
                                          variant="outline"
                                          className="w-full sm:w-auto"
                                          onClick={handleEnhanceDescription}
                                          disabled={isEnhancing || isExtracting || !field.value || field.value.length < 10}
                                        >
                                          {isEnhancing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                          Enhance with AI
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="hidden sm:block">
                                      <p>Let AI refine your description for clarity and impact.</p>
                                  </TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                          <p className="text-xs text-muted-foreground mt-2 sm:hidden">
                            ✨ Let AI refine your description for clarity and impact.
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-base"><Briefcase className="w-5 h-5 mr-2 text-primary"/>Industry</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? '_none_'}
                          disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || isEnhancing}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl>
                          <SelectContent><SelectGroup><SelectLabel>Industries</SelectLabel>{industries.map(ind => (<SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>))}</SelectGroup></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-base"><Tag className="w-5 h-5 mr-2 text-primary"/>Target Keywords</FormLabel>
                        <FormControl><Input placeholder="innovation, tech, eco (comma-separated)" {...field} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || isEnhancing} /></FormControl>
                        <p className="text-sm text-muted-foreground">Keywords for brand & industry.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {isAdmin ? (
                    <FormField
                      control={form.control}
                      name="plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-base"><Star className="w-5 h-5 mr-2 text-primary"/>Subscription Plan</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger></FormControl>
                            <SelectContent><SelectGroup><SelectLabel>Plans</SelectLabel><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectGroup></SelectContent>
                          </Select>
                          <FormDescription>Admin can change user plan.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Star className="w-5 h-5 mr-2 text-primary"/>Subscription Plan</FormLabel>
                      <Input
                        value={`${isPremiumActive ? 'Premium' : 'Free'} ${currentProfileBeingEdited?.subscriptionEndDate ? `(Expires: ${currentProfileBeingEdited.subscriptionEndDate.toDate().toLocaleDateString()})` : ''}`}
                        disabled
                        className="capitalize"
                      />
                      <FormDescription>Your plan is managed from the Pricing page.</FormDescription>
                    </FormItem>
                  )}
                  
                  {/* --- Enhanced Logo Generation Section --- */}
                  <FormItem>
                    <FormLabel className="flex items-center text-base mb-2"><Sparkles className="w-5 h-5 mr-2 text-primary"/>Brand Logo</FormLabel>
                    <div className="p-4 border rounded-lg space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Logo Preview */}
                        <div className="relative w-32 h-32 sm:w-36 sm:h-36 border rounded-md flex items-center justify-center bg-muted overflow-hidden flex-shrink-0">
                          {isGeneratingLogo ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-transparent rounded-full animate-spin-gradient" />
                              <p className="text-xs text-muted-foreground animate-pulse">Generating...</p>
                            </div>
                          ) : currentLogoToDisplay ? (
                            <div className="relative w-full h-full">
                                <BrandProfileImage src={currentLogoToDisplay} alt="Brand Logo Preview" fill className="object-contain p-2 sm:p-2.5" data-ai-hint="brand logo"/>
                            </div>
                          ) : (
                            <ImageIconLucide className="w-12 h-12 sm:w-14 sm:h-14 text-muted-foreground" />
                          )}
                        </div>
                        {/* Generation, Refine, and Download Buttons */}
                        <div className="flex-1 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="button" onClick={handleGenerateLogo} disabled={isGeneratingLogo || isUploadingLogo || !form.getValues("brandName") || !form.getValues("brandDescription")} className="w-full sm:w-auto">
                              {isGeneratingLogo ? (
                                <>
                                  <div className="mr-2 w-4 h-4 border-2 border-transparent rounded-full animate-spin-gradient" />
                                  <span className="animate-pulse">Generating Logo...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" /> Generate Logo
                                </>
                              )}
                            </Button>
                            {currentLogoToDisplay && (
                              <>
                                <Button type="button" onClick={() => handleOpenRefineModal(currentLogoToDisplay)} variant="outline" disabled={isGeneratingLogo || isUploadingLogo} className="w-full sm:w-auto btn-gradient-primary">
                                  <Wand2 className="mr-2 h-4 w-4" /> Refine with AI
                                </Button>
                                <Button type="button" onClick={handleDownloadLogo} variant="outline" disabled={isGeneratingLogo || isUploadingLogo} className="w-full sm:w-auto">
                                  <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                              </>
                            )}
                          </div>
                          {!currentLogoToDisplay && !isGeneratingLogo && <p className="text-xs text-muted-foreground mt-2">Fill Brand Name & Description for logo.</p>}
                          {generateLogoState.error && !isGeneratingLogo && <p className="text-xs text-destructive mt-1">{generateLogoState.error}</p>}
                          {generatedLogoPreview && <Alert variant="default" className="mt-2 text-xs"><Sparkles className="h-4 w-4" /><AlertDescription>New logo generated! Click &quot;Save Brand Profile&quot; to upload and keep it.</AlertDescription></Alert>}
                        </div>
                      </div>

                      {/* New Logo Design Controls */}
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground">Logo Design Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <FormField control={form.control} name="logoType" render={({ field }) => (
                              <FormItem><FormLabel className="flex items-center text-sm"><TypeIcon className="w-4 h-4 mr-2"/>Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? 'logomark'}>
                                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent><SelectGroup><SelectLabel>Logo Types</SelectLabel><SelectItem value="logomark">Logomark (Symbol/Icon)</SelectItem><SelectItem value="logotype">Logotype (Wordmark)</SelectItem><SelectItem value="monogram">Monogram (Initials)</SelectItem></SelectGroup></SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                           <FormField control={form.control} name="logoShape" render={({ field }) => (
                              <FormItem><FormLabel className="flex items-center text-sm"><ImagePlay className="w-4 h-4 mr-2"/>Shape</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? 'circle'}>
                                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent><SelectGroup><SelectLabel>Shapes</SelectLabel><SelectItem value="circle">Circle</SelectItem><SelectItem value="square">Square</SelectItem><SelectItem value="shield">Shield</SelectItem><SelectItem value="hexagon">Hexagon</SelectItem><SelectItem value="diamond">Diamond</SelectItem><SelectItem value="triangle">Triangle</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectGroup></SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                           <FormField control={form.control} name="logoColors" render={({ field }) => (
                              <FormItem><FormLabel className="flex items-center text-sm"><Palette className="w-4 h-4 mr-2"/>Color Palette</FormLabel><FormControl><Input placeholder="e.g., deep teal, soft gold" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="logoStyle" render={({ field }) => (
                              <FormItem><FormLabel className="flex items-center text-sm"><Wand2 className="w-4 h-4 mr-2"/>Style</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? 'modern'}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent><SelectGroup><SelectLabel>Styles</SelectLabel><SelectItem value="minimalist">Minimalist</SelectItem><SelectItem value="modern">Modern</SelectItem><SelectItem value="classic">Classic</SelectItem><SelectItem value="playful">Playful</SelectItem><SelectItem value="bold">Bold</SelectItem><SelectItem value="elegant">Elegant</SelectItem><SelectItem value="vintage">Vintage</SelectItem><SelectItem value="organic">Organic</SelectItem></SelectGroup></SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                           <FormField control={form.control} name="logoBackground" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center text-sm"><ImagePlay className="w-4 h-4 mr-2"/>Background</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? 'dark'}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent><SelectGroup><SelectLabel>Backgrounds</SelectLabel><SelectItem value="white">White</SelectItem><SelectItem value="light">Light</SelectItem><SelectItem value="transparent">Transparent</SelectItem><SelectItem value="dark">Dark</SelectItem></SelectGroup></SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    </div>
                    <FormField control={form.control} name="brandLogoUrl" render={() => <FormMessage />} />
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="imageStyleNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-base"><Edit className="w-5 h-5 mr-2 text-primary"/>Image Style Notes</FormLabel>
                        <FormControl><Textarea placeholder="General aesthetic notes for brand images." rows={3} {...field} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || isEnhancing} /></FormControl>
                        <FormDescription>General guidance for AI. Specific styles in Content Studio.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><UploadCloud className="w-5 h-5 mr-2 text-primary"/>Visual Style & Content Reference</FormLabel>
                    <FormDescription>Upload images that represent your brand's aesthetic. The AI will use these as inspiration in the Content Studio to generate new images in your style and to write relevant social media captions about them. Plan allows {maxImagesAllowed} images. Current: {form.getValues("exampleImages")?.length || 0}/{maxImagesAllowed}.</FormDescription>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <Label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border bg-card hover:bg-secondary ${isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || isEnhancing || !canUploadMoreImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? <Loader2 className="w-8 h-8 mb-2 text-muted-foreground animate-spin" /> : <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />}
                            <p className="mb-1 text-sm text-muted-foreground">
                              {isUploading ? `Uploading ${selectedFileNames.join(', ').substring(0,30)}...` : (selectedFileNames.length > 0 && previewImages.length === selectedFileNames.length ? selectedFileNames.map((name, idx) => name === `Saved image ${idx+1}` ? `Image ${idx+1}` : name).join(', ').substring(0,50) + (selectedFileNames.join(', ').length > 50 ? '...' : '') : (canUploadMoreImages ? <><span className="font-semibold">Click to upload</span> or drag & drop</> : `Max ${maxImagesAllowed} reached.`))}
                            </p>
                            {selectedFileNames.length === 0 && !isUploading && canUploadMoreImages && <p className="text-xs text-muted-foreground">Max 5MB per file.</p>}
                          </div>
                          <Input id="dropzone-file" type="file" multiple className="hidden" onChange={handleImageFileChange} accept="image/*" disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || !canUploadMoreImages || isGeneratingLogo || isUploadingLogo || isEnhancing} ref={fileInputRef} />
                        </Label>
                      </div>
                    </FormControl>
                    {isUploading && <Progress value={uploadProgress} className="w-full h-2 mt-2" />}
                    <FormField control={form.control} name="exampleImages" render={() => <FormMessage />} />
                    {!canUploadMoreImages && !isUploading && <p className="text-xs text-destructive mt-1">Max {maxImagesAllowed} images for your current plan.</p>}
                  </FormItem>
                  {previewImages.length > 0 && (
                    <div className="mt-2 space-y-3">
                      <p className="text-sm text-muted-foreground mb-1">Previews ({previewImages.length}/{maxImagesAllowed}):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {previewImages.map((src, index) => (
                          <div key={src || index} className="relative group aspect-square">
                            <div className="relative w-full h-full">
                                <BrandProfileImage src={src} alt={`Preview ${index + 1}`} fill style={{objectFit: 'contain'}} className="rounded border" data-ai-hint="brand example"/>
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                <Button
                                  type="button"
                                  className="btn-gradient-primary h-auto text-xs p-2 w-full"
                                  onClick={() => handleOpenRefineModal(src)}
                                >
                                    <Wand2 className="w-3 h-3 mr-1"/> Refine
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={() => handleDeleteImage(src, index)}
                                    disabled={isUploading || isExtracting || isBrandContextLoading || isAdminLoadingTargetProfile || isGeneratingLogo || isUploadingLogo || isEnhancing}
                                    title="Delete"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                form="brandProfileFormReal"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                disabled={isAuthLoading || isBrandContextLoading || isAdminLoadingTargetProfile || form.formState.isSubmitting || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || isEnhancing || isLoadingAdminProfiles}
              >
                {(isUploadingLogo || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null)}
                {isUploadingLogo ? 'Uploading & Saving...' : (isUploading ? 'Uploading Image(s)...' : (isAuthLoading || isBrandContextLoading || isAdminLoadingTargetProfile ? 'Loading...' : (form.formState.isSubmitting ? 'Saving...' : 'Save Brand Profile')))}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}

    

    



    

    