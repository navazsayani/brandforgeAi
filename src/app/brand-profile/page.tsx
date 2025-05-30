
"use client";

import React, { useEffect, useState, useRef } from 'react';
import NextImage from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { UserCircle, LinkIcon, FileText, Palette, UploadCloud, Tag, Brain, Loader2, Trash2, Edit, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { handleExtractBrandInfoFromUrlAction, type FormState as ExtractFormState } from '@/lib/actions';
import { storage } from '@/lib/firebaseConfig';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useActionState, startTransition } from 'react';
import { Alert, AlertTitle } from '@/components/ui/alert';

const imageStylePresets = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "digital-art", label: "Digital Art" },
  { value: "3d", label: "3D Render" },
  { value: "painting", label: "Painting" },
  { value: "vector", label: "Vector Art" },
  { value: "minimalist", label: "Minimalist" },
  { value: "abstract", label: "Abstract" },
  { value: "cartoon", label: "Cartoon / Comic" },
  { value: "anime", label: "Anime / Manga" },
  { value: "vintage", label: "Vintage / Retro" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "fantasy", label: "Fantasy Art" },
  { value: "surreal", label: "Surreal" },
  { value: "watercolor", label: "Watercolor" },
  { value: "sketch", label: "Sketch / Drawing" },
  { value: "photo", label: "Photo (Generic - Freepik)" }, // Added Freepik specific as example
  { value: "studio-shot", label: "Studio Shot (Freepik)"},
];


const industries = [
  { value: "fashion_apparel", label: "Fashion & Apparel" },
  { value: "beauty_cosmetics", label: "Beauty & Cosmetics" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "health_wellness", label: "Health & Wellness" },
  { value: "technology_saas", label: "Technology & SaaS" },
  { value: "travel_hospitality", label: "Travel & Hospitality" },
  { value: "ecommerce_retail", label: "E-commerce & Retail" },
  { value: "education", label: "Education" },
  { value: "finance_fintech", label: "Finance & Fintech" },
  { value: "real_estate", label: "Real Estate" },
  { value: "arts_entertainment", label: "Arts & Entertainment" },
  { value: "automotive", label: "Automotive" },
  { value: "non_profit", label: "Non-profit" },
  { value: "other", label: "Other" },
];

const brandProfileSchema = z.object({
  brandName: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  brandDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  industry: z.string().optional(),
  imageStyle: z.string().optional(),
  imageStyleNotes: z.string().optional(),
  exampleImages: z.array(z.string().url({ message: "Each image must be a valid URL." })).max(5, {message: "You can upload a maximum of 5 example images."}).optional(),
  targetKeywords: z.string().optional(),
});

type BrandProfileFormData = z.infer<typeof brandProfileSchema>;

const defaultFormValues: BrandProfileFormData = {
  brandName: "",
  websiteUrl: "",
  brandDescription: "",
  industry: "",
  imageStyle: imageStylePresets.length > 0 ? imageStylePresets[0].value : "",
  imageStyleNotes: "",
  exampleImages: [],
  targetKeywords: "",
};

const initialExtractState: ExtractFormState<{ brandDescription: string; targetKeywords: string; }> = { error: undefined, data: undefined, message: undefined };
const BRAND_PROFILE_DOC_ID = "defaultBrandProfile";

export default function BrandProfilePage() {
  const { brandData, setBrandData, isLoading: isBrandContextLoading, error: brandContextError } = useBrand();
  const { toast } = useToast();
  
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);


  const [extractState, extractAction] = useActionState(handleExtractBrandInfoFromUrlAction, initialExtractState);
  const [isExtracting, setIsExtracting] = useState(false);

  const form = useForm<BrandProfileFormData>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: brandData || defaultFormValues,
  });

  useEffect(() => {
    if (brandData) {
      const currentData = { ...defaultFormValues, ...brandData, exampleImages: brandData.exampleImages || [] };
      form.reset(currentData);
      setPreviewImages(currentData.exampleImages);
      if (currentData.exampleImages.length > 0) {
        setSelectedFileNames(currentData.exampleImages.map((_,i) => `Saved image ${i+1}`));
      } else {
        setSelectedFileNames([]);
      }
    } else if (!isBrandContextLoading) {
      form.reset(defaultFormValues);
      setPreviewImages([]);
      setSelectedFileNames([]);
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

  const uploadImageToStorage = async (file: File, index: number, totalFiles: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const filePath = `brand_example_images/${BRAND_PROFILE_DOC_ID}/${Date.now()}_${file.name}`;
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
      setSelectedFileNames(prev => [...prev.slice(0, currentSavedImages.length), ...currentSelectedFileNames]); // More robust name update
      setIsUploading(true);
      setUploadProgress(0);

      // For local previews before upload completes, create object URLs.
      // These will be replaced by Firebase URLs upon successful upload.
      const newLocalPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newLocalPreviews]);


      const uploadPromises = files.map((file, index) => uploadImageToStorage(file, index, files.length));
      
      try {
        const successfullyUploadedURLs = await Promise.all(uploadPromises);
        
        // Filter out old local previews and add new Firebase URLs
        const updatedImages = [
            ...currentSavedImages, 
            ...successfullyUploadedURLs
        ];
        
        form.setValue('exampleImages', updatedImages, { shouldValidate: true });
        setPreviewImages(updatedImages); 
        
        toast({ title: "Images Uploaded", description: `${successfullyUploadedURLs.length} image(s) uploaded successfully. Save profile to persist changes.` });
      } catch (error) {
        // Error already toasted in uploadImageToStorage
        toast({ title: "Some Uploads Failed", description: "Not all images were uploaded successfully. Check individual error messages.", variant: "destructive" });
        // Revert previews to only successfully uploaded and saved images
        setPreviewImages(form.getValues("exampleImages") || []); 
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
        }
        // Revoke temporary object URLs
        newLocalPreviews.forEach(url => URL.revokeObjectURL(url));
      }
    }
  };

  const handleDeleteImage = async (imageUrlToDelete: string, indexToDelete: number) => {
    const currentImages = form.getValues("exampleImages") || [];
    
    // Optimistically update UI
    const updatedFormImages = currentImages.filter((_, index) => index !== indexToDelete);
    form.setValue("exampleImages", updatedFormImages, { shouldValidate: true });
    setPreviewImages(updatedFormImages);
    setSelectedFileNames(prev => prev.filter((_,index) => index !== indexToDelete));


    try {
      // Attempt to delete from Firebase Storage only if it's a Firebase URL
      if (imageUrlToDelete.includes("firebasestorage.googleapis.com")) {
        const imageRef = storageRef(storage, imageUrlToDelete);
        await deleteObject(imageRef);
      }
      toast({ title: "Image Deleted", description: "Image removed. Save profile to persist this change." });
    } catch (error: any) {
      console.error("Error deleting image from Firebase Storage:", error);
      toast({ title: "Deletion Error", description: `Failed to delete image from storage: ${error.message}. Reverting UI.`, variant: "destructive" });
      // Revert UI if deletion failed
      form.setValue("exampleImages", currentImages, { shouldValidate: true });
      setPreviewImages(currentImages);
      // Re-evaluate selectedFileNames based on currentImages (might be complex if names are dynamic)
      // For simplicity, let's just clear it or re-map from currentImages if names were stable
      setSelectedFileNames(currentImages.map((_,i) => `Saved image ${i+1}`));
    }
  };


  const onSubmit: SubmitHandler<BrandProfileFormData> = async (data) => {
    try {
      await setBrandData({...data, exampleImages: data.exampleImages || []});
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
    }
  };
  
  if (isBrandContextLoading && !form.formState.isDirty && !brandData) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-10 w-1/2 mb-2" />
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-8">
              {[...Array(7)].map((_, i) => ( 
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className={i === 2 || i === 5 ? "h-24 w-full" : "h-10 w-full"} />
                </div>
              ))}
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <UserCircle className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Brand Profile</CardTitle>
                <CardDescription className="text-lg">
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
                      <FormLabel className="flex items-center text-base"><UserCircle className="w-5 h-5 mr-2 text-primary"/>Brand Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Acme Innovations" {...field} disabled={isBrandContextLoading || isUploading || isExtracting} />
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
                            <Input placeholder="https://www.example.com" {...field} disabled={isBrandContextLoading || isUploading || isExtracting} />
                           </FormControl>
                            <Button 
                                type="button" 
                                onClick={handleAutoFill} 
                                disabled={isExtracting || isBrandContextLoading || !field.value || form.getFieldState("websiteUrl").invalid || isUploading}
                                variant="outline"
                                size="icon"
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
                      <FormLabel className="flex items-center text-base"><FileText className="w-5 h-5 mr-2 text-primary"/>Brand Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your brand, its values, target audience, and unique selling propositions."
                          rows={5}
                          {...field}
                          disabled={isBrandContextLoading || isUploading || isExtracting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Briefcase className="w-5 h-5 mr-2 text-primary"/>Industry / Brand Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isBrandContextLoading || isUploading || isExtracting}>
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Palette className="w-5 h-5 mr-2 text-primary"/>Image Style Preset</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || (imageStylePresets.length > 0 ? imageStylePresets[0].value : "")} 
                        disabled={isBrandContextLoading || isUploading || isExtracting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an artistic style preset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Artistic Styles</SelectLabel>
                            {imageStylePresets.map(style => (
                              <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a base style for image generation. 
                        Some styles might be provider-specific (e.g., certain Freepik styles).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="imageStyleNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Edit className="w-5 h-5 mr-2 text-primary"/>Custom Image Style Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add custom details to the text prompt, e.g., 'moody lighting, focus on texture'."
                          rows={3}
                          {...field}
                          disabled={isBrandContextLoading || isUploading || isExtracting}
                        />
                      </FormControl>
                      <FormDescription>
                        These notes will be added to the main text prompt for AI image generation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel className="flex items-center text-base"><UploadCloud className="w-5 h-5 mr-2 text-primary"/>Upload Example Images (Optional, up to 5)</FormLabel>
                   <FormControl>
                    <div className="flex items-center justify-center w-full">
                        <Label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border bg-card hover:bg-secondary ${isBrandContextLoading || isUploading || isExtracting ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                                disabled={isBrandContextLoading || isUploading || isExtracting || (form.getValues("exampleImages")?.length || 0) >= 5}
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
                          <div key={src || index} className="relative group aspect-square"> {/* Ensure key is unique */}
                            <NextImage src={src} alt={`Example image preview ${index + 1}`} fill style={{objectFit: 'contain'}} className="rounded border" data-ai-hint="brand example"/>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteImage(src, index)}
                                disabled={isUploading || isExtracting || isBrandContextLoading}
                                title="Delete this image"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="targetKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Tag className="w-5 h-5 mr-2 text-primary"/>Target Keywords</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., innovation, tech solutions, eco-friendly (comma-separated)" {...field} disabled={isBrandContextLoading || isUploading || isExtracting}/>
                      </FormControl>
                       <p className="text-sm text-muted-foreground">
                        Comma-separated keywords related to your brand and industry.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                  size="lg" 
                  disabled={isBrandContextLoading || form.formState.isSubmitting || isUploading || isExtracting}
                >
                  {isUploading ? 'Uploading Image(s)...' : (isBrandContextLoading ? 'Loading Profile...' : (form.formState.isSubmitting ? 'Saving...' : (isExtracting ? 'Extracting Info...' : 'Save Brand Profile')))}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
    

    