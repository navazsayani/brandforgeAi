
"use client";

import React from 'react';
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
import { UserCircle, LinkIcon, FileText, Palette, UploadCloud, Tag, Image as ImageIcon } from 'lucide-react';

const brandProfileSchema = z.object({
  brandName: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  brandDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  imageStyle: z.string().min(5, { message: "Image style description must be at least 5 characters." }),
  exampleImage: z.string().url({ message: "Please enter a valid URL for the example image."}).optional().or(z.literal('')),
  targetKeywords: z.string().optional(),
});

type BrandProfileFormData = z.infer<typeof brandProfileSchema>;

export default function BrandProfilePage() {
  const { brandData, setBrandData } = useBrand();
  const { toast } = useToast();

  const form = useForm<BrandProfileFormData>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      brandName: brandData?.brandName || "",
      websiteUrl: brandData?.websiteUrl || "",
      brandDescription: brandData?.brandDescription || "",
      imageStyle: brandData?.imageStyle || "",
      exampleImage: brandData?.exampleImage || "",
      targetKeywords: brandData?.targetKeywords || "",
    },
  });

  const onSubmit: SubmitHandler<BrandProfileFormData> = (data) => {
    setBrandData(data);
    toast({
      title: "Brand Profile Updated",
      description: "Your brand information has been saved successfully.",
    });
    // Here you would typically also make an API call to save to a backend
    console.log("Brand profile data:", data); 
  };

  // Placeholder for image upload handling
  const [fileName, setFileName] = React.useState<string | null>(null);
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setFileName(file.name);
      // In a real app, you'd upload this file and get a URL or convert to Data URI
      // For now, we'll rely on the exampleImage URL input
      toast({
        title: "Image Selected (Mock)",
        description: `${file.name} selected. Please use the 'Example Image URL' field for now.`,
      });
    }
  };


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
                        <Input placeholder="E.g., Acme Innovations" {...field} />
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
                        <Input placeholder="https://www.example.com" {...field} />
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
                        <Input placeholder="E.g., minimalist, vibrant, professional, retro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel className="flex items-center text-base"><UploadCloud className="w-5 h-5 mr-2 text-primary"/>Upload Brand Images (Mock)</FormLabel>
                   <FormControl>
                    <div className="flex items-center justify-center w-full">
                        <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border bg-card hover:bg-secondary">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                        </Label>
                    </div> 
                   </FormControl>
                  {fileName && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileName}</p>}
                  <p className="text-xs text-muted-foreground">
                    Image upload is illustrative. Please provide an example image URL below for AI generation.
                  </p>
                </FormItem>

                <FormField
                  control={form.control}
                  name="exampleImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base"><ImageIcon className="w-5 h-5 mr-2 text-primary"/>Example Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.png or data:image/png;base64,..." {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input placeholder="E.g., innovation, tech solutions, eco-friendly (comma-separated)" {...field} />
                      </FormControl>
                       <p className="text-xs text-muted-foreground">
                        Comma-separated keywords related to your brand and industry.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                  Save Brand Profile
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
