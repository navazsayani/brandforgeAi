
"use client";

import React, { useEffect, useState, useRef, useActionState, startTransition } from 'react';
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
import { UserCircle, LinkIcon, FileText, Palette, UploadCloud, Tag, Brain, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { handleExtractBrandInfoFromUrlAction, type FormState as ExtractFormState } from '@/lib/actions';
import { Alert, AlertTitle as AlertTitleShadcn, AlertDescription as AlertDescriptionShadcn } from "@/components/ui/alert";


const MAX_FILE_SIZE_MB = 0.5; // Max file size in MB for base64 to avoid Firestore limits
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const brandProfileSchema = z.object({
  brandName: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  brandDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  imageStyle: z.string().min(5, { message: "Image style description must be at least 5 characters." }),
  exampleImage: z.string().optional().refine(value => {
    if (!value) return true;
    // Basic check for base64 string length. 1MB base64 string is ~1.37MB in length.
    // So, 0.5MB file is roughly 0.5 * 1.37 * 1024 * 1024 = ~718,848 characters.
    // We'll set a limit slightly above that to be safe, but still well under Firestore's 1MB field limit.
    return value.length < 750000;
  }, {message: `Image data is too large. Please use a smaller image (under ${MAX_FILE_SIZE_MB}MB).`}),
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

export default function BrandProfilePage() {
  const { brandData, setBrandData, isLoading: isBrandContextLoading, error: brandContextError } = useBrand();
  const { toast } = useToast();
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);


  // For AI extraction
  const [extractState, extractAction] = useActionState(handleExtractBrandInfoFromUrlAction, initialExtractState);
  const [isExtracting, setIsExtracting] = useState(false);


  const form = useForm<BrandProfileFormData>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: brandData || defaultFormValues,
  });

  useEffect(() => {
    if (brandData) {
      form.reset(brandData);
      if (brandData.exampleImage) {
        setPreviewImage(brandData.exampleImage);
      } else {
        setPreviewImage(null);
      }
    } else if (!isBrandContextLoading) {
      form.reset(defaultFormValues);
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
      toast({ title: "Success", description: extractState.message || "Brand information extracted from website." });
    }
    if (extractState.error) {
      toast({ title: "Extraction Error", description: extractState.error, variant: "destructive" });
    }
    setIsExtracting(false); // Reset loading state regardless of outcome
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
    
    startTransition(() => {
      const formData = new FormData();
      formData.append("websiteUrl", websiteUrl);
      extractAction(formData);
    });
  };

  const onSubmit: SubmitHandler<BrandProfileFormData> = async (data) => {
    try {
      await setBrandData(data);
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

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFileName(file.name); 

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "File Too Large",
          description: `Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB. This is a temporary limit for storing directly in the profile.`,
          variant: "destructive",
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; 
        }
        form.setValue('exampleImage', brandData?.exampleImage || '', { shouldValidate: true });
        setPreviewImage(brandData?.exampleImage || null);
        setSelectedFileName(null); // Clear selected file name if too large
        return;
      }

      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue('exampleImage', dataUri, { shouldValidate: true });
        setPreviewImage(dataUri);
        setIsProcessingImage(false);
        toast({
          title: "Image Ready",
          description: "Image prepared for profile. Save profile to persist.",
        });
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({
          title: "File Read Error",
          description: "Could not read the selected file.",
          variant: "destructive",
        });
        setIsProcessingImage(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; 
        }
        form.setValue('exampleImage', brandData?.exampleImage || '', { shouldValidate: true });
        setPreviewImage(brandData?.exampleImage || null);
        setSelectedFileName(null); // Clear selected file name on error
      };
      reader.readAsDataURL(file);
    } else {
        form.setValue('exampleImage', brandData?.exampleImage || '', { shouldValidate: true });
        setPreviewImage(brandData?.exampleImage || null);
        setSelectedFileName(null); // Clear selected file name if no file selected
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
                        <Input placeholder="E.g., Acme Innovations" {...field} disabled={isBrandContextLoading || isProcessingImage} />
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
                            <Input placeholder="https://www.example.com" {...field} disabled={isBrandContextLoading || isProcessingImage || isExtracting} />
                           </FormControl>
                            <Button 
                                type="button" 
                                onClick={handleAutoFill} 
                                disabled={isExtracting || isBrandContextLoading || !field.value || form.getFieldState("websiteUrl").invalid || isProcessingImage}
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
                          disabled={isBrandContextLoading || isProcessingImage || isExtracting}
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
                        <Input placeholder="E.g., minimalist, vibrant, professional, retro" {...field} disabled={isBrandContextLoading || isProcessingImage} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel className="flex items-center text-base"><UploadCloud className="w-5 h-5 mr-2 text-primary"/>Upload Example Image (Optional)</FormLabel>
                  <Alert variant="destructive" className="mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitleShadcn>Image Size Limit</AlertTitleShadcn>
                    <AlertDescriptionShadcn>
                      Due to Firestore document size limits, please use very small images (under {MAX_FILE_SIZE_MB}MB).
                      Larger images will cause errors when saving. This is a temporary workaround.
                    </AlertDescriptionShadcn>
                  </Alert>
                   <FormControl>
                    <div className="flex items-center justify-center w-full">
                        <Label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border bg-card hover:bg-secondary ${isBrandContextLoading || isProcessingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {isProcessingImage ? <Loader2 className="w-8 h-8 mb-2 text-muted-foreground animate-spin" /> : <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />}
                                <p className="mb-1 text-sm text-muted-foreground">
                                  {isProcessingImage ? "Processing..." : (selectedFileName ? selectedFileName : <><span className="font-semibold">Click to upload</span> or drag and drop</>)}
                                </p>
                                {!selectedFileName && !isProcessingImage && <p className="text-xs text-muted-foreground">SVG, PNG, JPG, GIF (Max {MAX_FILE_SIZE_MB}MB)</p>}
                            </div>
                            <Input 
                                id="dropzone-file" 
                                type="file" 
                                className="hidden" 
                                onChange={handleImageFileChange} 
                                accept="image/*" 
                                disabled={isBrandContextLoading || isProcessingImage}
                                ref={fileInputRef} 
                            />
                        </Label>
                    </div> 
                   </FormControl>
                </FormItem>

                <FormField
                  control={form.control}
                  name="exampleImage"
                  render={({ field }) => ( 
                    <FormItem className="hidden"> 
                       <FormControl>
                         <Input type="text" {...field} />
                       </FormControl>
                       <FormMessage /> 
                    </FormItem>
                  )}
                />
                {previewImage && (
                  <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <NextImage src={previewImage} alt="Example image preview" width={100} height={100} className="rounded border object-contain" data-ai-hint="brand example"/>
                  </div>
                )}
                {!previewImage && form.getValues("exampleImage") && (
                    <p className="text-xs text-destructive mt-1">Could not load preview for current image data.</p>
                )}


                <FormField
                  control={form.control}
                  name="targetKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><Tag className="w-5 h-5 mr-2 text-primary"/>Target Keywords</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., innovation, tech solutions, eco-friendly (comma-separated)" {...field} disabled={isBrandContextLoading || isProcessingImage || isExtracting}/>
                      </FormControl>
                       <p className="text-xs text-muted-foreground">
                        Comma-separated keywords related to your brand and industry.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" disabled={isBrandContextLoading || form.formState.isSubmitting || isProcessingImage || isExtracting}>
                  {isBrandContextLoading ? 'Loading Profile...' : (form.formState.isSubmitting ? 'Saving...' : (isProcessingImage ? 'Processing Image...' : (isExtracting ? 'Extracting Info...' : 'Save Brand Profile')))}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
