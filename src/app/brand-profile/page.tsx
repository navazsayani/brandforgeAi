
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { UserCircle, LinkIcon, FileText, Palette, UploadCloud, Tag, Brain, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { handleExtractBrandInfoFromUrlAction, type FormState as ExtractFormState } from '@/lib/actions';
import { Alert, AlertTitle as AlertTitleShadcn, AlertDescription as AlertDescriptionShadcn } from "@/components/ui/alert";


const MAX_FILE_SIZE_MB = 0.5; // Max file size in MB for base64 to avoid Firestore limits
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const artisticStyles = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "minimalist", label: "Minimalist" },
  { value: "vibrant", label: "Vibrant & Colorful" },
  { value: "professional", label: "Professional & Clean" },
  { value: "impressionistic", label: "Impressionistic" },
  { value: "watercolor", label: "Watercolor" },
  { value: "abstract", label: "Abstract" },
  { value: "retro", label: "Retro / Vintage" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "fantasy art", label: "Fantasy Art" },
  { value: "isometric", label: "Isometric" },
  { value: "line art", label: "Line Art" },
  { value: "3d render", label: "3D Render" },
  { value: "pixel art", label: "Pixel Art" },
  { value: "cel shaded", label: "Cel Shaded" },
];

const brandProfileSchema = z.object({
  brandName: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  brandDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  imageStyle: z.string().min(3, { message: "Please select or enter an image style." }),
  exampleImage: z.string().optional().refine(value => {
    if (!value) return true; 
    if (!value.startsWith('data:image')) return true; 
    return value.length < MAX_FILE_SIZE_BYTES; 
  }, {message: `Image data is too large. Please use a smaller image (under ${MAX_FILE_SIZE_MB}MB). Base64 encoded images are inefficient.`}),
  targetKeywords: z.string().optional(),
});

type BrandProfileFormData = z.infer<typeof brandProfileSchema>;

const defaultFormValues: BrandProfileFormData = {
  brandName: "",
  websiteUrl: "",
  brandDescription: "",
  imageStyle: artisticStyles.length > 0 ? artisticStyles[0].value : "",
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
        setSelectedFileName("Previously saved image");
      } else {
        setPreviewImage(null);
        setSelectedFileName(null);
      }
    } else if (!isBrandContextLoading) {
      form.reset(defaultFormValues);
      setPreviewImage(null);
      setSelectedFileName(null);
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
          title: "File Too Large for Base64",
          description: `Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB to store as base64 in Firestore. Consider using a storage service for larger images.`,
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = ""; 
        form.setValue('exampleImage', brandData?.exampleImage || '', { shouldValidate: true });
        setPreviewImage(brandData?.exampleImage || null);
        setSelectedFileName(brandData?.exampleImage ? "Previous image" : null);
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
        if (fileInputRef.current) fileInputRef.current.value = ""; 
        form.setValue('exampleImage', brandData?.exampleImage || '', { shouldValidate: true });
        setPreviewImage(brandData?.exampleImage || null);
        setSelectedFileName(brandData?.exampleImage ? "Previous image" : null);
      };
      reader.readAsDataURL(file);
    } else {
        form.setValue('exampleImage', brandData?.exampleImage || '', { shouldValidate: true });
        setPreviewImage(brandData?.exampleImage || null);
        setSelectedFileName(brandData?.exampleImage ? "Previous image" : null);
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
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isBrandContextLoading || isProcessingImage}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an artistic style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Artistic Styles</SelectLabel>
                            {artisticStyles.map(style => (
                              <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This style will be used for AI image generation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel className="flex items-center text-base"><UploadCloud className="w-5 h-5 mr-2 text-primary"/>Upload Example Image (Optional)</FormLabel>
                  <Alert variant="destructive" className="mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitleShadcn>Image Size Limit for Base64</AlertTitleShadcn>
                    <AlertDescriptionShadcn>
                      To store images directly in the profile (as base64), please use very small images (under {MAX_FILE_SIZE_MB}MB).
                      Larger images will cause errors when saving to Firestore due to document size limits.
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
                                {!selectedFileName && !isProcessingImage && <p className="text-xs text-muted-foreground">SVG, PNG, JPG, GIF (Max {MAX_FILE_SIZE_MB}MB for Base64)</p>}
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
                {!previewImage && form.getValues("exampleImage") && !form.getFieldState("exampleImage").error && (
                    <p className="text-xs text-destructive mt-1">Could not load preview for current image data. It might be an invalid data URI or URL.</p>
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
                       <FormDescription>
                        Comma-separated keywords related to your brand and industry.
                      </FormDescription>
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

    