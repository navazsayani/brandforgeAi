
"use client";

import React, { useState, useEffect, useActionState, startTransition } from 'react';
import NextImage from 'next/image';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormDescription } from "@/components/ui/form";
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, MessageSquareText, Newspaper, Palette, Type, ThumbsUp, Copy, Ratio, ImageUp, UserSquare, Wand2, Loader2, Trash2, Images, Globe, ExternalLink, CircleSlash, Pipette, FileText, ListOrdered, Mic2, Tag, Edit, Briefcase } from 'lucide-react';
import { handleGenerateImagesAction, handleGenerateSocialMediaCaptionAction, handleGenerateBlogContentAction, handleDescribeImageAction, handleGenerateBlogOutlineAction, type FormState } from '@/lib/actions';
import { SubmitButton } from "@/components/SubmitButton";
import type { GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost } from '@/types';
import type { DescribeImageOutput } from "@/ai/flows/describe-image-flow";
import type { GenerateBlogOutlineOutput } from "@/ai/flows/generate-blog-outline-flow";
import { cn } from '@/lib/utils';


const initialImageFormState: FormState<{ generatedImages: string[]; promptUsed: string; }> = { error: undefined, data: undefined, message: undefined };
const initialSocialFormState: FormState<{ caption: string; hashtags: string; imageSrc: string | null }> = { error: undefined, data: undefined, message: undefined };
const initialBlogFormState: FormState<{ title: string; content: string; tags: string }> = { error: undefined, data: undefined, message: undefined };
const initialDescribeImageState: FormState<DescribeImageOutput> = { error: undefined, data: undefined, message: undefined };
const initialBlogOutlineState: FormState<GenerateBlogOutlineOutput> = { error: undefined, data: undefined, message: undefined };


type SocialImageChoice = 'generated' | 'profile' | null;

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

const blogTones = [
    { value: "Informative", label: "Informative" },
    { value: "Conversational", label: "Conversational" },
    { value: "Professional", label: "Professional" },
    { value: "Witty/Humorous", label: "Witty/Humorous" },
    { value: "Persuasive", label: "Persuasive" },
    { value: "Storytelling", label: "Storytelling" },
    { value: "Technical", label: "Technical" },
];

export default function ContentStudioPage() {
  const { brandData, addGeneratedImage, addGeneratedSocialPost, addGeneratedBlogPost } = useBrand();
  const { toast } = useToast();

  const [imageState, imageAction] = useActionState(handleGenerateImagesAction, initialImageFormState);
  const [socialState, socialAction] = useActionState(handleGenerateSocialMediaCaptionAction, initialSocialFormState);
  const [blogState, blogAction] = useActionState(handleGenerateBlogContentAction, initialBlogFormState);
  const [describeImageState, describeImageAction] = useActionState(handleDescribeImageAction, initialDescribeImageState);
  const [blogOutlineState, blogOutlineAction] = useActionState(handleGenerateBlogOutlineAction, initialBlogOutlineState);
  
  const [lastSuccessfulGeneratedImageUrls, setLastSuccessfulGeneratedImageUrls] = useState<string[]>([]);
  const [lastUsedImageGenPrompt, setLastUsedImageGenPrompt] = useState<string | null>(null);
  const [generatedSocialPost, setGeneratedSocialPost] = useState<{caption: string, hashtags: string, imageSrc: string | null} | null>(null);
  const [generatedBlogPost, setGeneratedBlogPost] = useState<{title: string, content: string, tags: string} | null>(null);
  const [generatedBlogOutline, setGeneratedBlogOutline] = useState<string>("");
  
  const [useImageForSocialPost, setUseImageForSocialPost] = useState<boolean>(false);
  const [socialImageChoice, setSocialImageChoice] = useState<SocialImageChoice>(null);
  const [socialToneValue, setSocialToneValue] = useState<string>("professional");
  const [blogPlatformValue, setBlogPlatformValue] = useState<"Medium" | "Other">("Medium");
  const [selectedBlogTone, setSelectedBlogTone] = useState<string>(blogTones[0].value);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("1:1");
  const [numberOfImagesToGenerate, setNumberOfImagesToGenerate] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<string>("image");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState<boolean>(false);
  
  const [selectedProfileImageIndexForGen, setSelectedProfileImageIndexForGen] = useState<number | null>(null);
  const [selectedProfileImageIndexForSocial, setSelectedProfileImageIndexForSocial] = useState<number | null>(null);

  const [selectedImageStylePreset, setSelectedImageStylePreset] = useState<string>(() => {
    return brandData?.imageStyle || (artisticStyles.length > 0 ? artisticStyles[0].value : "");
  });
  const [customStyleNotesInput, setCustomStyleNotesInput] = useState<string>(() => {
    return brandData?.imageStyleNotes || "";
  });

  useEffect(() => {
    if (brandData) {
        setSelectedImageStylePreset(brandData.imageStyle || (artisticStyles.length > 0 ? artisticStyles[0].value : ""));
        setCustomStyleNotesInput(brandData.imageStyleNotes || "");
        if (brandData.exampleImages && brandData.exampleImages.length > 0) {
            if (selectedProfileImageIndexForGen === null) setSelectedProfileImageIndexForGen(0);
            if (selectedProfileImageIndexForSocial === null) setSelectedProfileImageIndexForSocial(0);
        } else {
            setSelectedProfileImageIndexForGen(null);
            setSelectedProfileImageIndexForSocial(null);
        }
    }
  }, [brandData]);


  useEffect(() => {
    if (imageState.data) {
      const newImageUrls = imageState.data.generatedImages;
      setLastSuccessfulGeneratedImageUrls(newImageUrls);
      setLastUsedImageGenPrompt(imageState.data.promptUsed);
      
      newImageUrls.forEach(url => {
        const newImage: GeneratedImage = {
          id: `${new Date().toISOString()}-${Math.random().toString(36).substring(2, 9)}`, 
          src: url,
          prompt: imageState.data.promptUsed || (document.querySelector('#imageGenBrandDescription') as HTMLTextAreaElement)?.value || "", 
          style: selectedImageStylePreset + (customStyleNotesInput ? ". " + customStyleNotesInput : "")
        };
        addGeneratedImage(newImage);
      });
      toast({ title: "Success", description: imageState.message });
    }
    if (imageState.error) toast({ title: "Error", description: imageState.error, variant: "destructive" });
  }, [imageState, toast, addGeneratedImage, selectedImageStylePreset, customStyleNotesInput]);

  useEffect(() => {
    if (socialState.data) {
      const socialData = socialState.data;
      setGeneratedSocialPost({ caption: socialData.caption, hashtags: socialData.hashtags, imageSrc: socialData.imageSrc });
       const newPost: GeneratedSocialMediaPost = {
        id: new Date().toISOString(),
        platform: 'Instagram', 
        imageSrc: socialData.imageSrc || null, 
        imageDescription: (document.getElementById('socialImageDescription') as HTMLTextAreaElement)?.value || "",
        caption: socialData.caption,
        hashtags: socialData.hashtags,
        tone: socialToneValue,
      };
      addGeneratedSocialPost(newPost);
      toast({ title: "Success", description: socialState.message });
    }
    if (socialState.error) toast({ title: "Error", description: socialState.error, variant: "destructive" });
  }, [socialState, toast, addGeneratedSocialPost, socialToneValue]);

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
      };
      addGeneratedBlogPost(newPost);
      toast({ title: "Success", description: blogState.message });
    }
    if (blogState.error) toast({ title: "Error", description: blogState.error, variant: "destructive" });
  }, [blogState, toast, addGeneratedBlogPost, blogPlatformValue]);

  useEffect(() => {
    setIsGeneratingDescription(false);
    if (describeImageState.data) {
      const socialImageDescriptionTextarea = document.getElementById('socialImageDescription') as HTMLTextAreaElement | null;
      if (socialImageDescriptionTextarea) {
        socialImageDescriptionTextarea.value = describeImageState.data.description;
      }
      toast({ title: "Success", description: describeImageState.message || "Image description generated." });
    }
    if (describeImageState.error) {
      toast({ title: "Error", description: describeImageState.error, variant: "destructive" });
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


  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${type} Copied!`, description: "Content copied to clipboard." });
  };

  const handleClearGeneratedImages = () => {
    setLastSuccessfulGeneratedImageUrls([]);
    setLastUsedImageGenPrompt(null);
    toast({title: "Cleared", description: "Generated images and prompt cleared."});
  };

  const handleUseGeneratedImageForSocial = () => {
    if (lastSuccessfulGeneratedImageUrls.length > 0) {
      setUseImageForSocialPost(true);
      setSocialImageChoice('generated'); 
      setActiveTab('social'); 
      toast({title: "Image Selected", description: "First generated image selected for social post."});
    } else {
      toast({title: "No Image", description: "Please generate an image first.", variant: "destructive"});
    }
  };

  const currentExampleImageForGen = (brandData?.exampleImages && selectedProfileImageIndexForGen !== null && brandData.exampleImages[selectedProfileImageIndexForGen]) || "";

  const currentSocialImagePreviewUrl = useImageForSocialPost
    ? (socialImageChoice === 'generated'
        ? (lastSuccessfulGeneratedImageUrls[0] || null)
        : (socialImageChoice === 'profile'
            ? (brandData?.exampleImages && selectedProfileImageIndexForSocial !== null && brandData.exampleImages[selectedProfileImageIndexForSocial]) || null
            : null))
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

  const handleGenerateBlogOutline = (event: React.MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.closest('form');
    if (!form) return;

    const formData = new FormData(form);
    
    const outlineFormData = new FormData();
    outlineFormData.append("brandName", formData.get("brandName") || brandData?.brandName || "");
    outlineFormData.append("brandDescription", formData.get("blogBrandDescription") || brandData?.brandDescription || "");
    outlineFormData.append("industry", formData.get("industry") || brandData?.industry || "");
    outlineFormData.append("keywords", formData.get("blogKeywords") || brandData?.targetKeywords || "");
    const websiteUrl = formData.get("blogWebsiteUrl") as string;
    if (websiteUrl) {
        outlineFormData.append("websiteUrl", websiteUrl);
    }
    
    setIsGeneratingOutline(true);
    startTransition(() => {
        blogOutlineAction(outlineFormData);
    });
  };

  const handleImageGenerationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    let combinedStyle = selectedImageStylePreset;
    if (customStyleNotesInput.trim()) {
        combinedStyle += ". " + customStyleNotesInput.trim();
    }
    formData.set("imageStyle", combinedStyle); 
    formData.set("industry", brandData?.industry || "");
    formData.set("exampleImage", currentExampleImageForGen);


    startTransition(() => {
      imageAction(formData);
    });
  };


  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <CardHeader className="px-0 mb-6">
          <div className="flex items-center space-x-3">
              <Palette className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Content Studio</CardTitle>
                <CardDescription className="text-lg">
                  Generate images, social media posts, and blog articles powered by AI.
                </CardDescription>
              </div>
            </div>
        </CardHeader>

        <Tabs defaultValue="image" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="image"><ImageIcon className="w-4 h-4 mr-2" />Image Generation</TabsTrigger>
            <TabsTrigger value="social"><MessageSquareText className="w-4 h-4 mr-2" />Social Media Post</TabsTrigger>
            <TabsTrigger value="blog"><Newspaper className="w-4 h-4 mr-2" />Blog Post</TabsTrigger>
          </TabsList>

          {/* Image Generation Tab */}
          <TabsContent value="image">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Generate Brand Images</CardTitle>
                <CardDescription>Create unique images based on your brand's aesthetics. Uses brand description, industry, and style. Optionally use an example image from your Brand Profile.</CardDescription>
              </CardHeader>
              <form onSubmit={handleImageGenerationSubmit} id="imageGenerationForm">
                <input type="hidden" name="industry" value={brandData?.industry || ""} />
                <input type="hidden" name="exampleImage" value={currentExampleImageForGen} />
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="imageGenBrandDescription" className="flex items-center mb-1"><FileText className="w-4 h-4 mr-2 text-primary" />Brand Description (from Profile)</Label>
                    <Textarea
                      id="imageGenBrandDescription"
                      name="brandDescription"
                      defaultValue={brandData?.brandDescription || ""}
                      placeholder="Detailed description of the brand and its values."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="imageGenImageStylePresetSelect" className="flex items-center mb-1"><Palette className="w-4 h-4 mr-2 text-primary" />Image Style Preset</Label>
                     <Select value={selectedImageStylePreset} onValueChange={setSelectedImageStylePreset} >
                        <SelectTrigger id="imageGenImageStylePresetSelect">
                            <SelectValue placeholder="Select image style preset" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Artistic Styles</SelectLabel>
                                {artisticStyles.map(style => (
                                    <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current profile preset: {brandData?.imageStyle ? (artisticStyles.find(s => s.value === brandData.imageStyle)?.label || `Custom: ${brandData.imageStyle}`) : 'Not set'}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="imageGenCustomStyleNotes" className="flex items-center mb-1"><Edit className="w-4 h-4 mr-2 text-primary" />Custom Style Notes/Overrides (Optional)</Label>
                    <Textarea
                      id="imageGenCustomStyleNotes"
                      value={customStyleNotesInput}
                      onChange={(e) => setCustomStyleNotesInput(e.target.value)}
                      placeholder="E.g., 'add a touch of vintage', 'focus on metallic textures', 'use a desaturated color palette'."
                      rows={2}
                    />
                     <p className="text-xs text-muted-foreground mt-1">
                      Current profile notes: {brandData?.imageStyleNotes || 'None'}
                    </p>
                  </div>
                  <input type="hidden" name="imageStyle" />


                  <div>
                    <Label htmlFor="imageGenExampleImageSelector" className="flex items-center mb-1"><ImageIcon className="w-4 h-4 mr-2 text-primary" />Example Image from Profile (Optional)</Label>
                    {brandData?.exampleImages && brandData.exampleImages.length > 0 ? (
                        <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">
                                {brandData.exampleImages.length > 1 ? "Select Profile Image to Use as Reference:" : "Using Profile Image as Reference:"}
                            </p>
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                {brandData.exampleImages.map((imgSrc, index) => (
                                    <button
                                        type="button"
                                        key={`gen-profile-${index}`}
                                        onClick={() => setSelectedProfileImageIndexForGen(index)}
                                        disabled={brandData.exampleImages && brandData.exampleImages.length <=1 && selectedProfileImageIndexForGen === index}
                                        className={cn(
                                            "w-20 h-20 rounded border-2 p-0.5 flex-shrink-0 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring",
                                            selectedProfileImageIndexForGen === index ? "border-primary ring-2 ring-primary" : "border-border",
                                            brandData.exampleImages && brandData.exampleImages.length <=1 ? "cursor-default opacity-70" : ""
                                        )}
                                    >
                                        <NextImage src={imgSrc} alt={`Example ${index + 1}`} width={76} height={76} className="object-contain w-full h-full rounded-sm" data-ai-hint="style example"/>
                                    </button>
                                ))}
                            </div>
                            {currentExampleImageForGen ? (
                                <p className="text-xs text-muted-foreground mt-1">Using image {selectedProfileImageIndexForGen !== null ? selectedProfileImageIndexForGen + 1 : '1'} as reference.</p>
                            ): (
                                <p className="text-xs text-muted-foreground mt-1">Click an image above to select it as reference.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground mt-1">No example images in Brand Profile to select.</p>
                    )}
                  </div>

                   <div>
                    <Label htmlFor="imageGenNegativePrompt" className="flex items-center mb-1"><CircleSlash className="w-4 h-4 mr-2 text-primary" />Negative Prompt (Optional)</Label>
                    <Textarea
                      id="imageGenNegativePrompt"
                      name="negativePrompt"
                      placeholder="E.g., avoid text, ugly, disfigured, low quality"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="imageGenAspectRatioSelect" className="flex items-center mb-1"><Ratio className="w-4 h-4 mr-2 text-primary" />Aspect Ratio</Label>
                        <Select name="aspectRatio" required value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                        <SelectTrigger id="imageGenAspectRatioSelect">
                            <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1:1">Square (1:1)</SelectItem>
                            <SelectItem value="4:5">Portrait (4:5)</SelectItem>
                            <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                            <SelectItem value="9:16">Story/Reel (9:16)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="numberOfImagesSelect" className="flex items-center mb-1"><Images className="w-4 h-4 mr-2 text-primary" />Number of Images</Label>
                        <Select name="numberOfImages" value={numberOfImagesToGenerate} onValueChange={setNumberOfImagesToGenerate}>
                            <SelectTrigger id="numberOfImagesSelect">
                                <SelectValue placeholder="Select number" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4].map(num => (
                                    <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="imageGenSeed" className="flex items-center mb-1"><Pipette className="w-4 h-4 mr-2 text-primary" />Seed (Optional)</Label>
                    <Input
                      id="imageGenSeed"
                      name="seed"
                      type="number"
                      placeholder="Enter a number for reproducible results"
                      min="0"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <SubmitButton className="w-full" loadingText={parseInt(numberOfImagesToGenerate) > 1 ? "Generating Images..." : "Generating Image..."}>
                    Generate {parseInt(numberOfImagesToGenerate) > 1 ? `${numberOfImagesToGenerate} Images` : "Image"}
                  </SubmitButton>
                </CardFooter>
              </form>
              {lastSuccessfulGeneratedImageUrls.length > 0 && (
                <Card className="mt-6 mx-4 mb-4 shadow-sm">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                                Generated Image{lastSuccessfulGeneratedImageUrls.length > 1 ? 's' : ''}
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={handleClearGeneratedImages}>
                                <Trash2 className="mr-2 h-4 w-4" /> Clear Image{lastSuccessfulGeneratedImageUrls.length > 1 ? 's' : ''}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`grid gap-4 ${lastSuccessfulGeneratedImageUrls.length > 1 ? (lastSuccessfulGeneratedImageUrls.length > 2 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2') : 'grid-cols-1'}`}>
                        {lastSuccessfulGeneratedImageUrls.map((url, index) => (
                            <div key={index} className="relative w-full overflow-hidden border rounded-md bg-muted aspect-square">
                                <NextImage src={url} alt={`Generated brand image ${index + 1}`} fill style={{objectFit: 'contain'}} data-ai-hint="brand marketing"/>
                            </div>
                        ))}
                      </div>
                      {lastUsedImageGenPrompt && (
                        <div className="mt-4">
                            <Label htmlFor="usedImagePromptDisplay" className="flex items-center mb-1 text-sm font-medium"><FileText className="w-4 h-4 mr-2 text-primary" />Prompt Used:</Label>
                            <Textarea
                                id="usedImagePromptDisplay"
                                value={lastUsedImageGenPrompt}
                                readOnly
                                rows={Math.min(10, lastUsedImageGenPrompt.split('\n').length + 1)}
                                className="text-xs bg-muted/50"
                            />
                        </div>
                      )}
                      <Button variant="outline" className="mt-4" onClick={handleUseGeneratedImageForSocial} disabled={lastSuccessfulGeneratedImageUrls.length === 0}>
                        <ImageUp className="mr-2 h-4 w-4" /> Use First Image for Social Post
                      </Button>
                    </CardContent>
                </Card>
              )}
            </Card>
          </TabsContent>

          {/* Social Media Post Tab */}
          <TabsContent value="social">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Create Social Media Post</CardTitle>
                <CardDescription>Generate engaging captions and hashtags. Uses brand description, industry, image description (optional), and selected tone.</CardDescription>
              </CardHeader>
              <form action={socialAction}>
                <input type="hidden" name="industry" value={brandData?.industry || ""} />
                <input type="hidden" name="selectedImageSrcForSocialPost" value={currentSocialImagePreviewUrl || ""} />
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="useImageForSocialPost" 
                            checked={useImageForSocialPost}
                            onCheckedChange={(checked) => {
                                setUseImageForSocialPost(checked as boolean);
                                if (!(checked as boolean)) {
                                    setSocialImageChoice(null); 
                                } else if (!socialImageChoice && lastSuccessfulGeneratedImageUrls.length > 0) {
                                    setSocialImageChoice('generated'); 
                                } else if (!socialImageChoice && brandData?.exampleImages?.[selectedProfileImageIndexForSocial !== null ? selectedProfileImageIndexForSocial : 0]) {
                                    setSocialImageChoice('profile'); 
                                    if(selectedProfileImageIndexForSocial === null && brandData?.exampleImages?.length > 0) setSelectedProfileImageIndexForSocial(0);
                                } else if (!socialImageChoice) { 
                                     setSocialImageChoice(null); 
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
                            onValueChange={(value) => setSocialImageChoice(value as 'generated' | 'profile' | null)}
                            className="space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="generated" id="social-generated" disabled={lastSuccessfulGeneratedImageUrls.length === 0}/>
                                <Label htmlFor="social-generated" className={lastSuccessfulGeneratedImageUrls.length === 0 ? "text-muted-foreground" : ""}>
                                    Use Last Generated Image {lastSuccessfulGeneratedImageUrls.length === 0 ? "(None available)" : `(${lastSuccessfulGeneratedImageUrls.length} available - first will be used)`}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="profile" id="social-profile" disabled={!brandData?.exampleImages || brandData.exampleImages.length === 0} />
                                <Label htmlFor="social-profile" className={(!brandData?.exampleImages || brandData.exampleImages.length === 0) ? "text-muted-foreground" : ""}>
                                    Use Brand Profile Example Image {!brandData?.exampleImages || brandData.exampleImages.length === 0 ? "(None available)" : `(${(brandData?.exampleImages?.length || 0)} available)`}
                                </Label>
                            </div>
                        </RadioGroup>

                        {socialImageChoice === 'profile' && brandData?.exampleImages && brandData.exampleImages.length > 0 && (
                             <div className="mt-2">
                                 <p className="text-xs text-muted-foreground mb-1">
                                    {brandData.exampleImages.length > 1 ? "Select Profile Image for Social Post:" : "Using Profile Image for Social Post:"}
                                </p>
                                <div className="flex space-x-2 overflow-x-auto pb-2">
                                    {brandData.exampleImages.map((imgSrc, index) => (
                                        <button
                                            type="button"
                                            key={`social-profile-${index}`}
                                            onClick={() => setSelectedProfileImageIndexForSocial(index)}
                                            disabled={brandData.exampleImages && brandData.exampleImages.length <=1 && selectedProfileImageIndexForSocial === index}
                                            className={cn(
                                                "w-16 h-16 rounded border-2 p-0.5 flex-shrink-0 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring",
                                                selectedProfileImageIndexForSocial === index ? "border-primary ring-2 ring-primary" : "border-border",
                                                brandData.exampleImages && brandData.exampleImages.length <=1 ? "cursor-default opacity-70" : ""
                                            )}
                                        >
                                            <NextImage src={imgSrc} alt={`Profile Example ${index + 1}`} width={60} height={60} className="object-contain w-full h-full rounded-sm" data-ai-hint="social media reference"/>
                                        </button>
                                    ))}
                                </div>
                                {selectedProfileImageIndexForSocial !== null && (
                                  <p className="text-xs text-muted-foreground mt-1">Using image {selectedProfileImageIndexForSocial + 1} from profile.</p>
                                )}
                             </div>
                        )}
                      </div>
                    )}

                    {currentSocialImagePreviewUrl && (
                        <div className="pl-6 mt-2 mb-3">
                            <p className="text-xs text-muted-foreground">Selected image for post:</p>
                            <NextImage src={currentSocialImagePreviewUrl} alt="Selected image for social post" width={100} height={100} className="rounded border object-contain" data-ai-hint="social media content"/>
                        </div>
                     )}
                     {useImageForSocialPost && !currentSocialImagePreviewUrl && (
                        <p className="pl-6 text-xs text-muted-foreground mb-3">No image selected or available for the social post.</p>
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
                      placeholder={useImageForSocialPost && currentSocialImagePreviewUrl ? "Describe the image you're posting or use AI. Required if image used." : "Optionally describe the theme if not using an image."}
                      rows={3}
                      required={useImageForSocialPost && !!currentSocialImagePreviewUrl} 
                    />
                  </div>

                   <div>
                    <Label htmlFor="socialToneSelect" className="flex items-center mb-1"><ThumbsUp className="w-4 h-4 mr-2 text-primary" />Tone</Label>
                     <Select name="tone" required value={socialToneValue} onValueChange={setSocialToneValue}>
                        <SelectTrigger id="socialToneSelect">
                          <SelectValue placeholder="Select a tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="funny">Funny</SelectItem>
                          <SelectItem value="informative">Informative</SelectItem>
                          <SelectItem value="inspirational">Inspirational</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <SubmitButton className="w-full" loadingText="Generating Content..." disabled={socialSubmitDisabled}>Generate Social Post</SubmitButton>
                </CardFooter>
              </form>
               {generatedSocialPost && (
                 <Card className="mt-6 mx-4 mb-4 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center">
                            <MessageSquareText className="w-5 h-5 mr-2 text-primary" />
                            Generated Social Post
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {generatedSocialPost.imageSrc && (
                             <div className="mb-4">
                                <p className="text-sm font-medium mb-1 text-muted-foreground">Associated Image:</p>
                                <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                                    <NextImage src={generatedSocialPost.imageSrc} alt="Social post image" fill style={{objectFit: 'cover'}} data-ai-hint="social content" />
                                </div>
                            </div>
                        )}
                        <div>
                            <h4 className="text-sm font-medium mb-1 text-muted-foreground">Caption:</h4>
                            <div className="p-3 border rounded-md bg-muted/50">
                                <p className="text-sm whitespace-pre-wrap">{generatedSocialPost.caption}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedSocialPost.caption, "Caption")} className="mt-1 text-muted-foreground hover:text-primary">
                                <Copy className="w-3 h-3 mr-1" /> Copy Caption
                            </Button>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-1 text-muted-foreground">Hashtags:</h4>
                            <div className="p-3 border rounded-md bg-muted/50">
                                <p className="text-sm">{generatedSocialPost.hashtags}</p>
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

          {/* Blog Post Tab */}
          <TabsContent value="blog">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Create Blog Content</CardTitle>
                <CardDescription>Generate SEO-friendly blog posts. Define an outline, choose a tone, and let AI write the content. Uses brand description and industry.</CardDescription>
              </CardHeader>
              <form action={blogAction}>
                {/* Hidden inputs to pass brand data to the action */}
                <input type="hidden" name="industry" value={brandData?.industry || ""} />

                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="blogBrandName" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Brand Name (from Profile)</Label>
                    <Input
                      id="blogBrandName"
                      name="brandName"
                      defaultValue={brandData?.brandName || ""}
                      placeholder="Your brand's name"
                      required
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
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="blogKeywords" className="flex items-center mb-1"><Tag className="w-4 h-4 mr-2 text-primary" />Keywords (from Profile)</Label>
                    <Input
                      id="blogKeywords"
                      name="blogKeywords" 
                      defaultValue={brandData?.targetKeywords || ""}
                      placeholder="Comma-separated keywords (e.g., AI, marketing, branding)"
                      required
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

                  <div className="space-y-2">
                    <Label htmlFor="blogToneSelect" className="flex items-center mb-1"><Mic2 className="w-4 h-4 mr-2 text-primary" />Tone/Style for Blog</Label>
                    <Select name="blogTone" required value={selectedBlogTone} onValueChange={setSelectedBlogTone}  id="blogToneSelect">
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
                      required
                      value={generatedBlogOutline}
                      onChange={(e) => setGeneratedBlogOutline(e.target.value)}
                    />
                    <FormDescription>AI will strictly follow this outline to generate the blog post.</FormDescription>
                  </div>

                  <div>
                    <Label htmlFor="blogTargetPlatformSelect" className="flex items-center mb-1"><Newspaper className="w-4 h-4 mr-2 text-primary" />Target Platform</Label>
                    <Select name="targetPlatform" required value={blogPlatformValue} onValueChange={(value) => setBlogPlatformValue(value as "Medium" | "Other")} id="blogTargetPlatformSelect">
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
                <CardFooter>
                  <SubmitButton className="w-full" loadingText="Generating Blog..." disabled={isGeneratingOutline || !generatedBlogOutline.trim()}>Generate Blog Post</SubmitButton>
                </CardFooter>
              </form>
               {generatedBlogPost && (
                 <Card className="mt-6 mx-4 mb-4 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center">
                            <Newspaper className="w-5 h-5 mr-2 text-primary" />
                            Generated Blog Post
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium mb-1 text-muted-foreground">Title:</h4>
                            <div className="p-3 border rounded-md bg-muted/50">
                                <p className="text-lg font-medium">{generatedBlogPost.title}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedBlogPost.title, "Title")} className="mt-1 text-muted-foreground hover:text-primary">
                                <Copy className="w-3 h-3 mr-1" /> Copy Title
                            </Button>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-1 text-muted-foreground">Content:</h4>
                            <div className="p-3 prose border rounded-md bg-muted/50 max-w-none max-h-96 overflow-y-auto">
                                <p className="whitespace-pre-wrap">{generatedBlogPost.content}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedBlogPost.content, "Content")} className="mt-1 text-muted-foreground hover:text-primary">
                                <Copy className="w-3 h-3 mr-1" /> Copy Content
                            </Button>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-1 text-muted-foreground">Tags:</h4>
                            <div className="p-3 border rounded-md bg-muted/50">
                                <p className="text-sm">{generatedBlogPost.tags}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedBlogPost.tags, "Tags")} className="mt-1 text-muted-foreground hover:text-primary">
                                <Copy className="w-3 h-3 mr-1" /> Copy Tags
                            </Button>
                        </div>
                    </CardContent>
                 </Card>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

