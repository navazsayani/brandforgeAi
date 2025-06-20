
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
import { UserCircle, LinkIcon, FileText, UploadCloud, Tag, Brain, Loader2, Trash2, Edit, Briefcase, Image as ImageIconLucide, Sparkles, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { handleExtractBrandInfoFromUrlAction, handleGenerateBrandLogoAction, type FormState as ExtractFormState, type FormState as GenerateLogoFormState } from '@/lib/actions';
import { storage } from '@/lib/firebaseConfig';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SubmitButton } from '@/components/SubmitButton';
import type { GenerateBrandLogoOutput } from '@/ai/flows/generate-brand-logo-flow';
import { industries } from '@/lib/constants';

const brandProfileSchema = z.object({
  brandName: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  brandDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  industry: z.string().optional(),
  imageStyleNotes: z.string().optional(),
  exampleImages: z.array(z.string().url({ message: "Each image must be a valid URL." })).max(5, {message: "You can upload a maximum of 5 example images."}).optional(),
  targetKeywords: z.string().optional(),
  brandLogoUrl: z.union([
    z.string().url({ message: "Please enter a valid URL." }), 
    z.string().startsWith('data:').optional(), 
    z.literal('').optional() 
  ]).optional(),
  plan: z.enum(['free', 'premium']).optional(), // Added plan to schema
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
  plan: 'free', // Default plan in form
};

const initialExtractState: ExtractFormState<{ brandDescription: string; targetKeywords: string; }> = { error: undefined, data: undefined, message: undefined };
const initialGenerateLogoState: GenerateLogoFormState<GenerateBrandLogoOutput> = { error: undefined, data: undefined, message: undefined };

export default function BrandProfilePage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { brandData, setBrandData, isLoading: isBrandContextLoading, error: brandContextError } = useBrand();

  const userId = currentUser?.uid;
  const { toast } = useToast();

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


  const form = useForm<BrandProfileFormData>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: brandData || defaultFormValues,
  });

  useEffect(() => {
    if (brandData) {
      const industryValue = brandData.industry && brandData.industry.trim() !== "" ? brandData.industry : "_none_";
      const planValue = brandData.plan && ['free', 'premium'].includes(brandData.plan) ? brandData.plan : 'free'; // Ensure plan is valid or default
      const currentData = {
        ...defaultFormValues,
        ...brandData,
        industry: industryValue,
        exampleImages: brandData.exampleImages || [],
        plan: planValue, // Set plan from context
      };
      form.reset(currentData);
      setPreviewImages(currentData.exampleImages);
      setGeneratedLogoPreview(null);
      if (currentData.exampleImages.length > 0) {
        setSelectedFileNames(currentData.exampleImages.map((_,i) => `Saved image ${i+1}`));
      } else {
        setSelectedFileNames([]);
      }
    } else if (!isBrandContextLoading) {
      form.reset(defaultFormValues);
      setPreviewImages([]);
      setSelectedFileNames([]);
      setGeneratedLogoPreview(null);
    }
  }, [brandData, form, isBrandContextLoading]);

  useEffect(() => {
    if (brandContextError) {
      toast({
        title: "Error loading brand data",
        description: brandContextError,
        variant: "destructive",
      });
    }
  }, [brandContextError, toast]);

  useEffect(() => {
    if (extractState.data) {
      form.setValue('brandDescription', extractState.data.brandDescription, { shouldValidate: true });
      form.setValue('targetKeywords', extractState.data.targetKeywords, { shouldValidate: true });
      toast({ title: "Success", description: extractState.message || "Brand information extracted from website." });
    }
    if (extractState.error) {
      toast({ title: "Extraction Error", description: extractState.error, variant: "destructive" });
    }
    setIsExtracting(false);
  }, [extractState, form, toast]);

  useEffect(() => {
    setIsGeneratingLogo(false);
    if (generateLogoState.data?.logoDataUri) {
      setGeneratedLogoPreview(generateLogoState.data.logoDataUri);
      toast({ title: "Logo Generated!", description: "Preview your new logo below. Save the profile to keep it." });
    }
    if (generateLogoState.error) {
      toast({ title: "Logo Generation Error", description: generateLogoState.error, variant: "destructive" });
    }
  }, [generateLogoState, toast]);


  const handleAutoFill = () => {
    const websiteUrl = form.getValues("websiteUrl");
    if (!websiteUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a website URL first.",
        variant: "destructive",
      });
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
  toast({
    title: "Missing Information",
        description: "Brand Name and Brand Description are required to generate a logo.",
        variant: "default"
      });
      return;
    }
    setIsGeneratingLogo(true);
    const formData = new FormData();
    formData.append("brandName", brandName);
    formData.append("brandDescription", brandDescription);
    if (industry) formData.append("industry", industry);
    if (targetKeywords) formData.append("targetKeywords", targetKeywords);

    startTransition(() => {
      generateLogoAction(formData);
    });
  };

  const uploadImageToStorage = async (file: File, index: number, totalFiles: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!currentUser) {
        toast({ title: "Upload Error", description: "User not authenticated. Cannot upload images.", variant: "destructive" });
        reject(new Error("User not authenticated"));
        return;
      }
      const filePath = `brand_example_images/${currentUser?.uid}/${Date.now()}_${file.name}`;
      const imageStorageRef = storageRef(storage, filePath);
      const uploadTask = uploadBytesResumable(imageStorageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress( (index / totalFiles) * 100 + (progress / totalFiles) );
        },
        (error) => {
          console.error("Firebase Storage Upload Error Object:", error);
          let errorMessage = "Image upload failed. Please try again.";
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = "Permission denied. Please check Firebase Storage rules.";
              break;
            case 'storage/canceled':
              errorMessage = "Upload canceled.";
              break;
            case 'storage/unknown':
              errorMessage = "An unknown error occurred during upload.";
              break;
          }
          toast({ title: `Upload Error: ${file.name}`, description: errorMessage, variant: "destructive" });
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error("Error getting download URL:", error);
            toast({ title: "Upload Error", description: "Failed to get image URL after upload.", variant: "destructive" });
            reject(error);
          }
        }
      );
    });
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const currentSavedImages = form.getValues("exampleImages") || [];

      if (currentSavedImages.length + files.length > 5) {
        toast({
          title: "Upload Limit Exceeded",
          description: "You can upload a maximum of 5 example images.",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const currentSelectedFileNames = files.map(file => file.name);
      setSelectedFileNames(prev => {
          const oldNames = prev.filter((_,i) => i < currentSavedImages.length);
          return [...oldNames, ...currentSelectedFileNames];
      });
      setIsUploading(true);
      setUploadProgress(0);

      const newLocalPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newLocalPreviews]);


      const uploadPromises = files.map((file, index) => uploadImageToStorage(file, index, files.length));

      try {
        const successfullyUploadedURLs = await Promise.all(uploadPromises);

        const updatedImages = [
            ...currentSavedImages,
            ...successfullyUploadedURLs
        ];

        form.setValue('exampleImages', updatedImages, { shouldValidate: true });
        setPreviewImages(updatedImages);
        setSelectedFileNames(updatedImages.map((_,i) => `Saved image ${i+1}`));

        toast({ title: "Images Uploaded", description: `${successfullyUploadedURLs.length} image(s) uploaded successfully. Save profile to persist changes.` });
      } catch (error) {
        toast({ title: "Some Uploads Failed", description: "Not all images were uploaded successfully. Check individual error messages.", variant: "destructive" });
        const stillValidImages = form.getValues("exampleImages") || [];
        setPreviewImages(stillValidImages);
        setSelectedFileNames(stillValidImages.map((_,i) => `Saved image ${i+1}`));
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        newLocalPreviews.forEach(url => URL.revokeObjectURL(url));
      }
    }
  };

  const handleDeleteImage = async (imageUrlToDelete: string, indexToDelete: number) => {
    const currentImages = form.getValues("exampleImages") || [];

    const updatedFormImages = currentImages.filter((_, index) => index !== indexToDelete);
    form.setValue("exampleImages", updatedFormImages, { shouldValidate: true });
    setPreviewImages(updatedFormImages);
    setSelectedFileNames(prev => prev.filter((_,index) => index !== indexToDelete));


    try {
      if (imageUrlToDelete.includes("firebasestorage.googleapis.com")) {
        const imageRef = storageRef(storage, imageUrlToDelete);
        await deleteObject(imageRef);
      }
      toast({ title: "Image Deleted", description: "Image removed. Save profile to persist this change." });
    } catch (error: any) {
      console.error("Error deleting image from Firebase Storage:", error);
      toast({ title: "Deletion Error", description: `Failed to delete image from storage: ${error.message}. Reverting UI.`, variant: "destructive" });
      form.setValue("exampleImages", currentImages, { shouldValidate: true });
      setPreviewImages(currentImages);
      setSelectedFileNames(currentImages.map((_,i) => `Saved image ${i+1}`));
    }
  };


  const onSubmit: SubmitHandler<BrandProfileFormData> = async (data) => {
    console.log("🔍 BrandProfile: Form submission data:", data);
    let finalData = { ...data };

    // Ensure industry field is properly handled
    console.log("🔍 BrandProfile: Final data to save (before logo processing):", finalData);

    if (generatedLogoPreview) {
        finalData.brandLogoUrl = "";
    }

    setIsUploadingLogo(true);
    setLogoUploadProgress(0);

    let progressInterval: NodeJS.Timeout | undefined; 

    if (generatedLogoPreview) {
      try {
        if (!userId) {
            toast({ title: "Save Error", description: "User not authenticated. Cannot save profile with new logo.", variant: "destructive" });
            delete finalData.brandLogoUrl;
            throw new Error("User not authenticated");
        }
        const logoFilePath = `brand_logos/${userId}/logo_${Date.now()}.png`;
        const logoStorageRef = storageRef(storage, logoFilePath);

        const uploadTask = uploadString(logoStorageRef, generatedLogoPreview, 'data_url');

        progressInterval = setInterval(() => { 
          setLogoUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        const snapshot = await uploadTask;
        if (progressInterval) { 
          clearInterval(progressInterval);
        }
        setLogoUploadProgress(100);
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        finalData.brandLogoUrl = downloadURL; 
          toast({ title: "Logo Uploaded", description: "New logo uploaded and will be saved with profile." });
      } catch (error: any) {
        clearInterval(progressInterval);
        setIsUploadingLogo(false);
        setLogoUploadProgress(0);
        toast({
          title: "Logo Upload Error",
          description: `Failed to upload generated logo: ${error.message}. Profile saved without new logo.`,
          variant: "destructive",
        });
        console.error("Logo upload error:", error);
        delete finalData.brandLogoUrl;
      }
    }

    try {
      if (!currentUser) {
        toast({ title: "Save Error", description: "User not authenticated. Cannot save profile.", variant: "destructive" });
        return;
      }

      // Ensure plan is either 'free' or 'premium', default to 'free' if somehow undefined in form data
      const planToSave = finalData.plan && ['free', 'premium'].includes(finalData.plan) ? finalData.plan : 'free';

      await setBrandData({...finalData, exampleImages: finalData.exampleImages || [], plan: planToSave}, currentUser.uid);
      toast({
        title: "Brand Profile Saved",
        description: "Your brand information has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Save Error",
        description: error.message || "Failed to save brand profile. Please try again.",
        variant: "destructive",
      });
      console.error("Brand profile save error:", error);
    } finally {
        setIsUploadingLogo(false);
        setLogoUploadProgress(0);
    }
  };

  if (isAuthLoading || (isBrandContextLoading && !form.formState.isDirty && !brandData)) {
    return (
      <div data-testid="loading-state">Loading... Please wait.</div>
    );
  }

  const currentLogoToDisplay = generatedLogoPreview || brandData?.brandLogoUrl;

  return (
    <ScrollArea className="h-[calc(100vh-56px)]"> 
      <div className="max-w-3xl mx-auto py-6"> 
      
        <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <UserCircle className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold break-words">Brand Profile</CardTitle>
              <CardDescription className="text-lg break-words">
                Define your brand's identity. This information will fuel the AI for content and campaign generation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><UserCircle className="w-5 h-5 mr-2 text-primary"/>Brand Name <span className="text-destructive ml-1">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Acme Innovations" {...field} disabled={isBrandContextLoading || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo} />
                    </FormControl>
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
                          <FormControl>
                          <Input placeholder="https://www.example.com" {...field} disabled={isBrandContextLoading || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo} />
                          </FormControl>
                          <Button
                              type="button"
                              onClick={handleAutoFill}
                              disabled={isExtracting || isBrandContextLoading || !field.value || form.getFieldState("websiteUrl").invalid || isUploading || isGeneratingLogo || isUploadingLogo}
                              variant="outline"
                              size="sm"
                              title="Auto-fill from Website"
                          >
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
                    <FormControl>
                      <Textarea
                        placeholder="Describe your brand, its values, target audience, and unique selling propositions."
                        rows={5}
                        {...field}
                        disabled={isBrandContextLoading || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo}
                      />
                    </FormControl>
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
                      <FormLabel className="flex items-center text-base"><Briefcase className="w-5 h-5 mr-2 text-primary"/>Industry / Brand Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={selectValue}
                        disabled={isBrandContextLoading || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Industries</SelectLabel>
                            {industries.map(industry => (
                              <SelectItem key={industry.value} value={industry.value}>{industry.label}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
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
                    <FormControl>
                      <Input placeholder="E.g., innovation, tech solutions, eco-friendly (comma-separated)" {...field} disabled={isBrandContextLoading || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo}/>
                    </FormControl>
                      <p className="text-sm text-muted-foreground">
                      Comma-separated keywords related to your brand and industry.
                    </p>
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
                      disabled={isBrandContextLoading || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Plans</SelectLabel>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      (For testing purposes. In a real app, this would be managed by a subscription system.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                  <FormLabel className="flex items-center text-base mb-2"><Sparkles className="w-5 h-5 mr-2 text-primary"/>Brand Logo</FormLabel>
                  <div className="p-4 border rounded-lg space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="w-32 h-32 border rounded-md flex items-center justify-center bg-muted overflow-hidden">
                              {isGeneratingLogo ? (
                                  <Loader2 className="w-12 h-12 text-primary animate-spin"/>
                              ) : currentLogoToDisplay ? (
                                  <NextImage src={currentLogoToDisplay} alt="Brand Logo Preview" width={128} height={128} className="object-contain" data-ai-hint="brand logo"/>
                              ) : (
                                  <ImageIconLucide className="w-12 h-12 text-muted-foreground"/>
                              )}
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                              <Button
                                  type="button"
                                  onClick={handleGenerateLogo}
                                  disabled={isGeneratingLogo || isUploadingLogo || !form.getValues("brandName") || !form.getValues("brandDescription")}
                                  className="w-full sm:w-auto"
                              >
                                  {isGeneratingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                  Generate Logo with AI
                              </Button>
                              {!currentLogoToDisplay && !isGeneratingLogo && (
                                  <p className="text-xs text-muted-foreground mt-2">Fill in Brand Name and Description to enable logo generation.</p>
                              )}
                              {generateLogoState.error && !isGeneratingLogo && (
                                <p className="text-xs text-destructive mt-1">{generateLogoState.error}</p>
                              )}
                          </div>
                      </div>
                      {isUploadingLogo && logoUploadProgress > 0 && logoUploadProgress < 100 && (
                          <Progress value={logoUploadProgress} className="w-full h-2 mt-2" />
                      )}
                        {generatedLogoPreview && (
                          <Alert variant="default" className="mt-2">
                              <Sparkles className="h-4 w-4" />
                              <AlertTitle>Logo Generated!</AlertTitle>
                              <AlertDescription>
                                A new logo has been generated. Click "Save Brand Profile" below to upload and save it.
                              </AlertDescription>
                          </Alert>
                      )}
                  </div>
                  
              <FormField
                  control={form.control}
                  name="brandLogoUrl"
                  render={() => ( <FormMessage /> )}
              />
          </FormItem>
              <FormField
                control={form.control}
                name="imageStyleNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base"><Edit className="w-5 h-5 mr-2 text-primary"/>General Image Style Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the general aesthetic for your brand's images, e.g., 'minimalist and clean', 'vibrant and energetic', 'moody lighting'."
                        rows={3}
                        {...field}
                        disabled={isBrandContextLoading || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes provide general guidance for AI image generation. Specific style presets can be chosen in the Content Studio.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel className="flex items-center text-base"><UploadCloud className="w-5 h-5 mr-2 text-primary"/>Upload Example Images (Optional, up to 5)</FormLabel>
                  <FormControl>
                  <div className="flex items-center justify-center w-full">
                      <Label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border bg-card hover:bg-secondary ${isBrandContextLoading || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo || (form.getValues("exampleImages")?.length || 0) >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {isUploading ? <Loader2 className="w-8 h-8 mb-2 text-muted-foreground animate-spin" /> : <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />}
                              <p className="mb-1 text-sm text-muted-foreground">
                                {isUploading ? `Uploading ${selectedFileNames.join(', ').substring(0,30)}...` : (selectedFileNames.length > 0 && previewImages.length === selectedFileNames.length ? selectedFileNames.map((name, idx) => name === `Saved image ${idx+1}` ? `Image ${idx+1}` : name).join(', ').substring(0,50) + (selectedFileNames.join(', ').length > 50 ? '...' : '') : <><span className="font-semibold">Click to upload</span> or drag and drop</>)}
                              </p>
                              {selectedFileNames.length === 0 && !isUploading && <p className="text-xs text-muted-foreground">SVG, PNG, JPG, GIF (Max 5MB per file recommended)</p>}
                          </div>
                          <Input
                              id="dropzone-file"
                              type="file"
                              multiple
                              className="hidden"
                              onChange={handleImageFileChange}
                              accept="image/*"
                              disabled={isBrandContextLoading || isUploading || isExtracting || (form.getValues("exampleImages")?.length || 0) >= 5 || isGeneratingLogo || isUploadingLogo}
                              ref={fileInputRef}
                          />
                      </Label>
                  </div>
                  </FormControl>
                {isUploading && (
                  <Progress value={uploadProgress} className="w-full h-2 mt-2" />
                )}
                <FormField
                  control={form.control}
                  name="exampleImages"
                  render={() => ( <FormMessage /> )}
                  />
                  { (form.getValues("exampleImages")?.length || 0) >= 5 && !isUploading &&
                  <p className="text-xs text-destructive mt-1">Maximum 5 images allowed.</p>
                  }
              </FormItem>

              {previewImages.length > 0 && (
                <div className="mt-2 space-y-3">
                    <p className="text-sm text-muted-foreground mb-1">Current Example Image Previews ({previewImages.length}/5):</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {previewImages.map((src, index) => (
                        <div key={src || index} className="relative group aspect-square">
                          <NextImage src={src} alt={`Example image preview ${index + 1}`} fill style={{objectFit: 'contain'}} className="rounded border" data-ai-hint="brand example"/>
                          <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteImage(src, index)}
                              disabled={isUploading || isExtracting || isBrandContextLoading || isGeneratingLogo || isUploadingLogo}
                              title="Delete this image"
                          >
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
              form="brandProfileForm" 
              onClick={() => form.handleSubmit(onSubmit)()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
 disabled={isAuthLoading || isBrandContextLoading || form.formState.isSubmitting || isUploading || isExtracting || isGeneratingLogo || isUploadingLogo}
            >
                {(isUploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null)}
                {isUploadingLogo ? 'Uploading Logo & Saving...' : (isUploading ? 'Uploading Image(s)...' : (isAuthLoading || isBrandContextLoading ? 'Loading Profile...' : (form.formState.isSubmitting ? 'Saving...' : (isExtracting ? 'Extracting Info...' : 'Save Brand Profile'))))}
            </Button>
          </CardFooter>
      </Card>
    </div>
    </ScrollArea>
  );
}

