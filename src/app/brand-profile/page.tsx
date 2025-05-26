
"use client";

import React, { useEffect } from 'react';
import Image from 'next/image'; // Added Next.js Image import
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
import { UserCircle, LinkIcon, FileText, Palette, UploadCloud, Tag, Image as ImageIconLucide } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function BrandProfilePage() {
  const { brandData, setBrandData, isLoading: isBrandContextLoading, error: brandContextError } = useBrand();
  const { toast } = useToast();

  const form = useForm<BrandProfileFormData>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: brandData || defaultFormValues,
  });

  useEffect(() => {
    if (brandData) {
      form.reset(brandData);
    } else if (!isBrandContextLoading) { // Only reset to defaults if not loading and no data
      form.reset(defaultFormValues);
    }
  }, [brandData, form, isBrandContextLoading]);
  
  useEffect(() => {
    if (brandContextError) {
      toast({
        title: "Error",
        description: brandContextError,
        variant: "destructive",
      });
    }
  }, [brandContextError, toast]);

  const onSubmit: SubmitHandler<BrandProfileFormData> = async (data) => {
    try {
      await setBrandData(data);
      toast({
        title: "Brand Profile Saved",
        description: "Your brand information has been saved successfully to the cloud.",
      });
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to save brand profile. Please try again.",
        variant: "destructive",
      });
      console.error("Brand profile save error:", error); 
    }
  };

  const [fileName, setFileName] = React.useState<string | null>(null);
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setFileName(file.name);
      // For now, we'll rely on the exampleImage URL input for data URI or external URL
      // Actual file upload to Firebase Storage would be a separate step.
       const reader = new FileReader();
        reader.onloadend = () => {
            const dataUri = reader.result as string;
            form.setValue('exampleImage', dataUri, { shouldValidate: true });
             toast({
                title: "Image Ready for Profile",
                description: `${file.name} converted to Data URI and set in 'Example Image URL' field. Save profile to persist.`,
            });
        };
        reader.onerror = () => {
            toast({
                title: "Image Error",
                description: "Could not read image file.",
                variant: "destructive",
            });
        }
        reader.readAsDataURL(file);
    }
  };

  if (isBrandContextLoading && !form.formState.isDirty && !brandData) { // Show skeleton only on initial load
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
                        <Input placeholder="E.g., Acme Innovations" {...field} disabled={isBrandContextLoading} />
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
                      <FormControl>
                        <Input placeholder="https://www.example.com" {...field} disabled={isBrandContextLoading} />
                      </FormControl>
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
                          disabled={isBrandContextLoading}
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
                        <Input placeholder="E.g., minimalist, vibrant, professional, retro" {...field} disabled={isBrandContextLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel className="flex items-center text-base"><UploadCloud className="w-5 h-5 mr-2 text-primary"/>Upload Example Image (Optional)</FormLabel>
                   <FormControl>
                    <div className="flex items-center justify-center w-full">
                        <Label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border bg-card hover:bg-secondary ${isBrandContextLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG, GIF. Will be converted to Data URI.</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={isBrandContextLoading} />
                        </Label>
                    </div> 
                   </FormControl>
                  {fileName && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileName}</p>}
                </FormItem>

                <FormField
                  control={form.control}
                  name="exampleImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><ImageIconLucide className="w-5 h-5 mr-2 text-primary"/>Example Image (URL or Data URI)</FormLabel>
                      <FormControl>
                        <Textarea 
                            placeholder="https://example.com/image.png or data:image/png;base64,..." 
                            {...field} 
                            disabled={isBrandContextLoading}
                            rows={3} 
                        />
                      </FormControl>
                       <FormMessage />
                       {field.value && field.value.startsWith('data:image') && (
                        <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                            <Image src={field.value} alt="Example image preview" width={100} height={100} className="rounded border object-contain" data-ai-hint="brand image"/>
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
                        <Input placeholder="E.g., innovation, tech solutions, eco-friendly (comma-separated)" {...field} disabled={isBrandContextLoading} />
                      </FormControl>
                       <p className="text-xs text-muted-foreground">
                        Comma-separated keywords related to your brand and industry.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" disabled={isBrandContextLoading || form.formState.isSubmitting}>
                  {isBrandContextLoading || form.formState.isSubmitting ? 'Saving...' : 'Save Brand Profile'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

