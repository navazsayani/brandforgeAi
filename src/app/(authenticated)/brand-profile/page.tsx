
"use client";

import React, { useEffect, useState, useRef, useActionState, startTransition } from 'react';
import NextImage from 'next/image';
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
import { UserCircle, LinkIcon, FileText, UploadCloud, Tag, Brain, Loader2, Trash2, Edit, Briefcase, Image as ImageIconLucide, Sparkles, Star, ShieldCheck, UserSearch, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { handleExtractBrandInfoFromUrlAction, handleGenerateBrandLogoAction, handleGetAllUserProfilesForAdminAction, type FormState as ExtractFormState, type FormState as GenerateLogoFormState, type FormState as AdminFetchProfilesState } from '@/lib/actions';
import { storage, db } from '@/lib/firebaseConfig';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SubmitButton } from '@/components/SubmitButton';
import type { GenerateBrandLogoOutput } from '@/ai/flows/generate-brand-logo-flow';
import { industries } from '@/lib/constants';
import type { BrandData, UserProfileSelectItem } from '@/types';

const MAX_IMAGES_PREMIUM = 5;
const MAX_IMAGES_FREE = 2;

const brandProfileSchema = z.object({
  brandName: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  brandDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  industry: z.string().optional(),
  imageStyleNotes: z.string().optional(),
  exampleImages: z.array(z.string().url({ message: "Each image must be a valid URL." })).optional(),
  targetKeywords: z.string().optional(),
  brandLogoUrl: z.union([
    z.string().url({ message: "Please enter a valid URL." }),
    z.string().startsWith('data:').optional(),
    z.literal('').optional()
  ]).optional(),
  plan: z.enum(['free', 'premium']).optional(),
  userEmail: z.string().email().optional().or(z.literal('')), // Added userEmail
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
  brandLogoUrl: "",
  plan: 'free',
  userEmail: "",
};

const initialExtractState: ExtractFormState<{ brandDescription: string; targetKeywords: string; }> = { error: undefined, data: undefined, message: undefined };
const initialGenerateLogoState: GenerateLogoFormState<GenerateBrandLogoOutput> = { error: undefined, data: undefined, message: undefined };
const initialAdminFetchProfilesState: AdminFetchProfilesState<UserProfileSelectItem[]> = { error: undefined, data: undefined, message: undefined };

export default function BrandProfilePage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { brandData: contextBrandData, setBrandData: setContextBrandData, isLoading: isBrandContextLoading, error: brandContextError } = useBrand();
  const { toast } = useToast();

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

  const [generateLogoState, generateLogoAction] = useActionState(handleGenerateBrandLogoAction, initialGenerateLogoState);
  const [generatedLogoPreview, setGeneratedLogoPreview] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);
  
  const [adminFetchProfilesServerState, adminFetchProfilesAction] = useActionState(handleGetAllUserProfilesForAdminAction, initialAdminFetchProfilesState);
  const [isLoadingAdminProfiles, setIsLoadingAdminProfiles] = useState(false);


  const currentProfileBeingEdited = isAdmin && adminTargetUserId && adminLoadedProfileData ? adminLoadedProfileData : contextBrandData;
  const effectiveUserIdForStorage = isAdmin && adminTargetUserId ? adminTargetUserId : currentUser?.uid;

  const form = useForm<BrandProfileFormData>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: defaultFormValues,
  });

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
    const dataToDisplay = isAdmin && adminTargetUserId && adminLoadedProfileData ? adminLoadedProfileData : contextBrandData;
    if (dataToDisplay) {
      const industryValue = dataToDisplay.industry && dataToDisplay.industry.trim() !== "" ? dataToDisplay.industry : "_none_";
      const planValue = dataToDisplay.plan && ['free', 'premium'].includes(dataToDisplay.plan) ? dataToDisplay.plan : 'free';
      const emailValue = dataToDisplay.userEmail || (currentUser?.email && dataToDisplay === contextBrandData ? currentUser.email : "");
      
      const currentMaxImages = planValue === 'premium' ? MAX_IMAGES_PREMIUM : MAX_IMAGES_FREE;
      const exampleImagesArray = Array.isArray(dataToDisplay.exampleImages) ? dataToDisplay.exampleImages.slice(0, currentMaxImages) : [];

      const currentData = {
        ...defaultFormValues,
        ...dataToDisplay,
        industry: industryValue,
        exampleImages: exampleImagesArray,
        plan: planValue,
        userEmail: emailValue,
      };
      form.reset(currentData);
      setPreviewImages(currentData.exampleImages);
      setSelectedFileNames(currentData.exampleImages.map((_, i) => `Saved image ${i + 1}`));
      if (form.getValues("brandLogoUrl") !== generatedLogoPreview) {
        setGeneratedLogoPreview(null);
      }
    } else if (!isBrandContextLoading && !isAdminLoadingTargetProfile) {
      form.reset({...defaultFormValues, userEmail: currentUser?.email || ""});
      setPreviewImages([]);
      setSelectedFileNames([]);
      setGeneratedLogoPreview(null);
    }
  }, [adminTargetUserId, adminLoadedProfileData, contextBrandData, form, isBrandContextLoading, isAdminLoadingTargetProfile, currentUser]);


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
        setAdminLoadedProfileData(docSnap.data() as BrandData);
        setAdminTargetUserId(uidToLoad);
        toast({ title: "Profile Loaded", description: `Displaying profile for User: ${docSnap.data()?.userEmail || uidToLoad.substring(0,8)}...` });
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
      toast({ title: "My Profile", description: "Displaying your own brand profile." });
  };

  const handleAutoFill = () => {
    const websiteUrl = form.getValues("websiteUrl");
    if (!websiteUrl) {
      toast({ title: "Missing URL", description: "Please enter a website URL.", variant: "destructive" });
      return;
    }
    setIsExtracting(true);
    startTransition(() => {
      const formData = new FormData();
      formData.append("websiteUrl", websiteUrl);
      extractAction(formData);
    });
  };

  const handleGenerateLogo = () => {
    const brandName = form.getValues("brandName");
    const brandDescription = form.getValues("brandDescription");
    const industry = form.getValues("industry");
    const targetKeywords = form.getValues("targetKeywords");

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
    if (effectiveUserIdForStorage) formData.append("userId", effectiveUserIdForStorage);
    // Add userEmail if creating logo for own profile, or if admin is creating for user and email is known
    const profileBeingEdited = isAdmin && adminTargetUserId && adminLoadedProfileData ? adminLoadedProfileData : contextBrandData;
    const emailForLogoAction = profileBeingEdited?.userEmail || (currentUser?.uid === effectiveUserIdForStorage ? currentUser?.email : undefined);
    if (emailForLogoAction) formData.append("userEmail", emailForLogoAction);


    startTransition(() => generateLogoAction(formData));
  };

  const currentPlanForLimits = (isAdmin && adminTargetUserId && adminLoadedProfileData?.plan) ? adminLoadedProfileData.plan : (contextBrandData?.plan || 'free');
  const maxImagesAllowed = currentPlanForLimits === 'premium' ? MAX_IMAGES_PREMIUM : MAX_IMAGES_FREE;

  const uploadImageToStorage = async (file: File, index: number, totalFiles: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!effectiveUserIdForStorage) {
        toast({ title: "Upload Error", description: "User context unclear. Cannot upload images.", variant: "destructive" });
        reject(new Error("User context unclear"));
        return;
      }
      const filePath = `brand_example_images/${effectiveUserIdForStorage}/${Date.now()}_${file.name}`;
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
          description: `Plan (${currentPlanForLimits}) allows ${maxImagesAllowed} images. Have ${currentSavedImages.length}, tried to add ${files.length}.`,
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
    form.setValue("exampleImages", updatedFormImages, { shouldValidate: true });
    setPreviewImages(updatedFormImages);
    setSelectedFileNames(prev => prev.filter((_, index) => index !== indexToDelete));

    try {
      if (imageUrlToDelete.includes("firebasestorage.googleapis.com")) {
        const imageRef = storageRef(storage, imageUrlToDelete);
        await deleteObject(imageRef);
      }
      toast({ title: "Image Deleted", description: "Image removed. Save profile." });
    } catch (error: any) {
      toast({ title: "Deletion Error", description: `Failed to delete from storage: ${error.message}. Reverting.`, variant: "destructive" });
      form.setValue("exampleImages", currentImages, { shouldValidate: true }); 
      setPreviewImages(currentImages);
      setSelectedFileNames(currentImages.map((_,i) => `Saved image ${i+1}`));
    }
  };

  const onSubmit: SubmitHandler<BrandProfileFormData> = async (data) => {
    let finalData = { ...data };
    const userIdToSaveFor = isAdmin && adminTargetUserId ? adminTargetUserId : currentUser?.uid;

    if (!userIdToSaveFor) {
      toast({ title: "Save Error", description: "User context is unclear. Cannot save profile.", variant: "destructive" });
      return;
    }

    finalData.plan = form.getValues('plan'); 
    const currentImages = finalData.exampleImages || [];
    if (currentImages.length > maxImagesAllowed) {
        finalData.exampleImages = currentImages.slice(0, maxImagesAllowed);
        toast({ title: "Image Limit Adjusted", description: `Images adjusted to ${maxImagesAllowed} for plan.`, variant: "default" });
    }

    // Ensure userEmail is set correctly
    if (!isAdmin || (isAdmin && userIdToSaveFor === currentUser?.uid)) { // Saving own profile (as admin or regular user)
      finalData.userEmail = currentUser?.email || "";
    } else if (isAdmin && adminTargetUserId && adminLoadedProfileData) { // Admin saving another user's profile
      finalData.userEmail = adminLoadedProfileData.userEmail || ""; // Preserve loaded email
    }


    if (generatedLogoPreview) finalData.brandLogoUrl = ""; 

    setIsUploadingLogo(true);
    setLogoUploadProgress(0);
    let progressInterval: NodeJS.Timeout | undefined;

    if (generatedLogoPreview) {
      try {
        const logoFilePath = `brand_logos/${userIdToSaveFor}/logo_${Date.now()}.png`;
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
        await setContextBrandData(finalData, adminTargetUserId); // Using context function ensures consistency
        setAdminLoadedProfileData(finalData); 
      } else if (currentUser) { 
        await setContextBrandData(finalData, currentUser.uid);
      }
      toast({ title: "Brand Profile Saved", description: "Information saved successfully." });
    } catch (error: any) {
      toast({ title: "Save Error", description: error.message || "Failed to save profile.", variant: "destructive" });
    } finally {
      setIsUploadingLogo(false); setLogoUploadProgress(0);
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
  
  const isEditingOwnProfileAsAdmin = isAdmin && adminTargetUserId === currentUser?.uid;
  const displayTitleText = isAdmin && adminTargetUserId ? 
    (isEditingOwnProfileAsAdmin ? "Brand Profile (Editing My Profile as Admin)" : `Editing Profile for: ${currentProfileBeingEdited?.userEmail || adminTargetUserId.substring(0,8)}...`) : 
    "Brand Profile";

  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto py-6 px-4">
        {isAdmin && (
          <Card className="mb-6 bg-secondary/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ShieldCheck className="w-6 h-6 mr-2 text-primary" />Admin Controls</CardTitle>
              <CardDescription>Load and edit a specific user's brand profile.</CardDescription>
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
                  <SelectTrigger className="flex-grow min-w-0">
                    <SelectValue placeholder={isLoadingAdminProfiles ? "Loading users..." : "Select a user to load/edit"} />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectGroup>
                      <SelectLabel>Users</SelectLabel>
                      {isLoadingAdminProfiles && <SelectItem value="loading" disabled>Loading users...</SelectItem>}
                      {!isLoadingAdminProfiles && userProfilesForAdmin.length === 0 && <SelectItem value="nousers" disabled>No user profiles found.</SelectItem>}
                      {userProfilesForAdmin.map(profile => (
                        <SelectItem key={profile.userId} value={profile.userId}>
                          <div className="truncate">
                            {profile.brandName || "Unnamed Brand"} - ({profile.userEmail || profile.userId.substring(0,8)+"..."})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {adminTargetUserId && (
                <Button onClick={handleAdminLoadMyProfile} variant="outline" size="sm" className="w-full">
                  Switch to Editing My Own Profile
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <UserCircle className="w-10 h-10 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
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
                      <FormControl><Input placeholder="Acme Innovations" {...field} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo} /></FormControl>
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
                      <FormDescription>User's email address (read-only).</FormDescription>
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
                           <FormControl><Input placeholder="https://example.com" {...field} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo} /></FormControl>
                        </div>
                        <Button type="button" onClick={handleAutoFill} disabled={isExtracting || isBrandContextLoading || isAdminLoadingTargetProfile || !field.value || form.getFieldState("websiteUrl").invalid || isUploading || isGeneratingLogo || isUploadingLogo} variant="outline" size="sm" title="Auto-fill">
                          {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                        </Button>
                      </div>
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
                      <FormControl><Textarea placeholder="Describe brand, values, audience..." rows={5} {...field} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => {
                    const selectValue = field.value && field.value.trim() !== "" ? field.value : "_none_";
                    return (
                      <FormItem>
                        <FormLabel className="flex items-center text-base"><Briefcase className="w-5 h-5 mr-2 text-primary"/>Industry</FormLabel>
                        <Select onValueChange={field.onChange} value={selectValue} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl>
                          <SelectContent><SelectGroup><SelectLabel>Industries</SelectLabel>{industries.map(ind => (<SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>))}</SelectGroup></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="targetKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Tag className="w-5 h-5 mr-2 text-primary"/>Target Keywords</FormLabel>
                      <FormControl><Input placeholder="innovation, tech, eco (comma-separated)" {...field} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo} /></FormControl>
                      <p className="text-sm text-muted-foreground">Keywords for brand & industry.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Star className="w-5 h-5 mr-2 text-primary"/>Subscription Plan</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || 'free'}
                        disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || !isAdmin}
                      >
                        <FormControl><SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger></FormControl>
                        <SelectContent><SelectGroup><SelectLabel>Plans</SelectLabel><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectGroup></SelectContent>
                      </Select>
                      <FormDescription>{!isAdmin ? "Plan managed by subscription system." : "Admin can change user plan."}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel className="flex items-center text-base mb-2"><Sparkles className="w-5 h-5 mr-2 text-primary"/>Brand Logo</FormLabel>
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-32 h-32 border rounded-md flex items-center justify-center bg-muted overflow-hidden flex-shrink-0">
                        {isGeneratingLogo ? <Loader2 className="w-12 h-12 text-primary animate-spin"/> : currentLogoToDisplay ? <NextImage src={currentLogoToDisplay} alt="Brand Logo Preview" width={128} height={128} className="object-contain" data-ai-hint="brand logo"/> : <ImageIconLucide className="w-12 h-12 text-muted-foreground"/>}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <Button type="button" onClick={handleGenerateLogo} disabled={isGeneratingLogo || isUploadingLogo || !form.getValues("brandName") || !form.getValues("brandDescription")} className="w-full sm:w-auto">
                          {isGeneratingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate Logo
                        </Button>
                        {!currentLogoToDisplay && !isGeneratingLogo && <p className="text-xs text-muted-foreground mt-2">Fill Brand Name & Description for logo.</p>}
                        {generateLogoState.error && !isGeneratingLogo && <p className="text-xs text-destructive mt-1">{generateLogoState.error}</p>}
                      </div>
                    </div>
                    {isUploadingLogo && logoUploadProgress > 0 && logoUploadProgress < 100 && <Progress value={logoUploadProgress} className="w-full h-2 mt-2" />}
                    {generatedLogoPreview && <Alert variant="default" className="mt-2"><Sparkles className="h-4 w-4" /><AlertTitle>Logo Generated!</AlertTitle><AlertDescription>New logo generated. Click "Save Brand Profile" to upload and save.</AlertDescription></Alert>}
                  </div>
                  <FormField control={form.control} name="brandLogoUrl" render={() => <FormMessage />} />
                </FormItem>
                <FormField
                  control={form.control}
                  name="imageStyleNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Edit className="w-5 h-5 mr-2 text-primary"/>Image Style Notes</FormLabel>
                      <FormControl><Textarea placeholder="General aesthetic notes for brand images." rows={3} {...field} disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo} /></FormControl>
                      <FormDescription>General guidance for AI. Specific styles in Content Studio.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel className="flex items-center text-base"><UploadCloud className="w-5 h-5 mr-2 text-primary"/>Example Images</FormLabel>
                  <FormDescription>Plan ({currentPlanForLimits}) allows {maxImagesAllowed} images. Current: {(form.getValues("exampleImages")?.length || 0)}/{maxImagesAllowed}.</FormDescription>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                      <Label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border bg-card hover:bg-secondary ${isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || !canUploadMoreImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {isUploading ? <Loader2 className="w-8 h-8 mb-2 text-muted-foreground animate-spin" /> : <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />}
                          <p className="mb-1 text-sm text-muted-foreground">
                            {isUploading ? `Uploading ${selectedFileNames.join(', ').substring(0,30)}...` : (selectedFileNames.length > 0 && previewImages.length === selectedFileNames.length ? selectedFileNames.map((name, idx) => name === `Saved image ${idx+1}` ? `Image ${idx+1}` : name).join(', ').substring(0,50) + (selectedFileNames.join(', ').length > 50 ? '...' : '') : (canUploadMoreImages ? <><span className="font-semibold">Click to upload</span> or drag & drop</> : `Max ${maxImagesAllowed} reached.`))}
                          </p>
                          {selectedFileNames.length === 0 && !isUploading && canUploadMoreImages && <p className="text-xs text-muted-foreground">Max 5MB per file.</p>}
                        </div>
                        <Input id="dropzone-file" type="file" multiple className="hidden" onChange={handleImageFileChange} accept="image/*" disabled={isBrandContextLoading || isAdminLoadingTargetProfile || isUploading || isExtracting || !canUploadMoreImages || isGeneratingLogo || isUploadingLogo} ref={fileInputRef} />
                      </Label>
                    </div>
                  </FormControl>
                  {isUploading && <Progress value={uploadProgress} className="w-full h-2 mt-2" />}
                  <FormField control={form.control} name="exampleImages" render={() => <FormMessage />} />
                  {!canUploadMoreImages && !isUploading && <p className="text-xs text-destructive mt-1">Max {maxImagesAllowed} images for {currentPlanForLimits} plan.</p>}
                </FormItem>
                {previewImages.length > 0 && (
                  <div className="mt-2 space-y-3">
                    <p className="text-sm text-muted-foreground mb-1">Previews ({previewImages.length}/{maxImagesAllowed}):</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {previewImages.map((src, index) => (
                        <div key={src || index} className="relative group aspect-square">
                          <NextImage src={src} alt={`Preview ${index + 1}`} fill style={{objectFit: 'contain'}} className="rounded border" data-ai-hint="brand example"/>
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteImage(src, index)} disabled={isUploading || isExtracting || isBrandContextLoading || isAdminLoadingTargetProfile || isGeneratingLogo || isUploadingLogo} title="Delete">
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
              disabled={isAuthLoading || isBrandContextLoading || isAdminLoadingTargetProfile || form.formState.isSubmitting || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || isLoadingAdminProfiles}
            >
              {(isUploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null)}
              {isUploadingLogo ? 'Uploading & Saving...' : (isUploading ? 'Uploading Image(s)...' : (isAuthLoading || isBrandContextLoading || isAdminLoadingTargetProfile ? 'Loading...' : (form.formState.isSubmitting ? 'Saving...' : (isExtracting ? 'Extracting...' : 'Save Brand Profile'))))}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ScrollArea>
  );
}
