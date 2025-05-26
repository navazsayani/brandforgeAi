
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { UserCircle, LinkIcon, FileText, Palette, UploadCloud, Tag, Image as ImageIconLucide, Brain, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { storage } from '@/lib/firebaseConfig';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFormState } from "react-dom";
import { handleExtractBrandInfoFromUrlAction, type FormState as ExtractFormState } from '@/lib/actions';
import { Progress } from "@/components/ui/progress";


const brandProfileSchema = z.object({
  brandName: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  brandDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  imageStyle: z.string().min(5, { message: "Image style description must be at least 5 characters." }),
  exampleImage: z.string().url({ message: "Please enter a valid URL for the example image."}).optional().or(z.literal('')),
  targetKeywords: z.string().optional(),
});

type BrandProfileFormData = z.infer<typeof brandProfileSchema>;

const defaultFormValues: BrandProfileFormData = {
  brandName: "",
  websiteUrl: "",
  brandDescription: "",
  imageStyle: "",
  exampleImage: "",
  targetKeywords: "",
};

const initialExtractState: ExtractFormState<{ brandDescription: string; targetKeywords: string; }> = { error: undefined, data: undefined, message: undefined };

// Used a fixed ID for simplicity as per BrandContext
const BRAND_PROFILE_DOC_ID = "defaultBrandProfile"; 

export default function BrandProfilePage() {
  const { brandData, setBrandData, isLoading: isBrandContextLoading, error: brandContextError } = useBrand();
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const originalExampleImageUrlRef = useRef<string | undefined>(undefined);


  // For AI extraction
  const [extractState, extractAction] = useFormState(handleExtractBrandInfoFromUrlAction, initialExtractState);
  const [isExtracting, setIsExtracting] = useState(false);


  const form = useForm<BrandProfileFormData>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: brandData || defaultFormValues,
  });

  useEffect(() => {
    if (brandData) {
      form.reset(brandData);
      originalExampleImageUrlRef.current = brandData.exampleImage;
      if (brandData.exampleImage) {
        setPreviewImage(brandData.exampleImage);
      } else {
        setPreviewImage(null);
      }
    } else if (!isBrandContextLoading) {
      form.reset(defaultFormValues);
      originalExampleImageUrlRef.current = undefined;
      setPreviewImage(null);
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
      toast({ title: "Success", description: "Brand information extracted from website." });
    }
    if (extractState.error) {
      toast({ title: "Extraction Error", description: extractState.error, variant: "destructive" });
    }
    setIsExtracting(false);
  }, [extractState, form, toast]);

  const handleAutoFill = async () => {
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
    const formData = new FormData();
    formData.append("websiteUrl", websiteUrl);
    extractAction(formData);
  };

  const onSubmit: SubmitHandler<BrandProfileFormData> = async (data) => {
    try {
      await setBrandData(data);
      originalExampleImageUrlRef.current = data.exampleImage; // Update ref after successful save
      toast({
        title: "Brand Profile Saved",
        description: "Your brand information has been saved successfully to the cloud.",
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setFileName(file.name);
      setIsUploading(true);
      setUploadProgress(0);
      
      originalExampleImageUrlRef.current = form.getValues('exampleImage'); 

      const tempPreviewUrl = URL.createObjectURL(file);
      setPreviewImage(tempPreviewUrl);
      form.setValue('exampleImage', '', { shouldValidate: false }); 

      const imageFileName = `brand_example_images/${BRAND_PROFILE_DOC_ID}/${Date.now()}_${file.name}`;
      const imageRef = storageRef(storage, imageFileName);
      const uploadTask = uploadBytesResumable(imageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Firebase Storage Upload Error:", error);
          setIsUploading(false);
          setUploadProgress(null);
          // Don't setFileName(null) here, so user sees which file failed.
          form.setValue('exampleImage', originalExampleImageUrlRef.current || '', { shouldValidate: true });
          setPreviewImage(originalExampleImageUrlRef.current || null);
          
          toast({
            title: "Upload Error",
            description: `Failed to upload '${file.name}': ${error.message}. Check console, Firebase Storage rules, and ensure your storage bucket is correctly configured in .env.`,
            variant: "destructive",
          });
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            form.setValue('exampleImage', downloadURL, { shouldValidate: true });
            setPreviewImage(downloadURL); 
            originalExampleImageUrlRef.current = downloadURL; 
            setIsUploading(false);
            setUploadProgress(null);
            toast({
              title: "Image Uploaded",
              description: `${file.name} uploaded. Save profile to persist the new image URL.`,
            });
          }).catch( (error) => {
            console.error("Firebase Storage Get URL Error:", error);
            setIsUploading(false);
            setUploadProgress(null);
            // Don't setFileName(null) here.
            form.setValue('exampleImage', originalExampleImageUrlRef.current || '', { shouldValidate: true });
            setPreviewImage(originalExampleImageUrlRef.current || null);
            toast({
              title: "Upload Finalization Error",
              description: `Failed to get URL for '${file.name}': ${error.message}`,
              variant: "destructive",
            });
          });
        }
      );
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
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className={i === 2 || i === 4 ? "h-24 w-full" : "h-10 w-full"} />
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
                        <Input placeholder="E.g., Acme Innovations" {...field} disabled={isBrandContextLoading || isUploading} />
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
                                disabled={isExtracting || isBrandContextLoading || !field.value || isUploading}
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
                  name="imageStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Palette className="w-5 h-5 mr-2 text-primary"/>Desired Image Style</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., minimalist, vibrant, professional, retro" {...field} disabled={isBrandContextLoading || isUploading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel className="flex items-center text-base"><UploadCloud className="w-5 h-5 mr-2 text-primary"/>Upload Example Image (Optional)</FormLabel>
                   <FormControl>
                    <div className="flex items-center justify-center w-full">
                        <Label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border bg-card hover:bg-secondary ${isBrandContextLoading || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG, GIF (Max 5MB). Will be uploaded to secure storage.</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={isBrandContextLoading || isUploading} />
                        </Label>
                    </div> 
                   </FormControl>
                  {fileName && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileName}{isUploading ? "" : " (upload failed, try again or choose a different file)"}</p>}
                  {isUploading && uploadProgress !== null && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Uploading: {fileName} ({Math.round(uploadProgress)}%)...</p>
                      <Progress value={uploadProgress} className="w-full h-2 mt-1" />
                    </div>
                  )}
                </FormItem>

                <FormField
                  control={form.control}
                  name="exampleImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><ImageIconLucide className="w-5 h-5 mr-2 text-primary"/>Example Image URL</FormLabel>
                      <FormControl>
                        <Textarea 
                            placeholder="Upload an image above, or paste an existing public URL here." 
                            {...field} 
                            disabled={isBrandContextLoading || isUploading}
                            rows={2} 
                        />
                      </FormControl>
                       <FormMessage />
                       {previewImage && (
                        <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                            <NextImage src={previewImage} alt="Example image preview" width={100} height={100} className="rounded border object-contain" data-ai-hint="brand example"/>
                        </div>
                       )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Tag className="w-5 h-5 mr-2 text-primary"/>Target Keywords</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., innovation, tech solutions, eco-friendly (comma-separated)" {...field} disabled={isBrandContextLoading || isUploading || isExtracting}/>
                      </FormControl>
                       <p className="text-xs text-muted-foreground">
                        Comma-separated keywords related to your brand and industry.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" disabled={isBrandContextLoading || form.formState.isSubmitting || isUploading || isExtracting}>
                  {isBrandContextLoading ? 'Loading Profile...' : (form.formState.isSubmitting ? 'Saving...' : (isUploading ? 'Uploading...' : (isExtracting ? 'Extracting Info...' : 'Save Brand Profile')))}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

    

    