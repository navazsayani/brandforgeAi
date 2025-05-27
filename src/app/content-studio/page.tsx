
"use client";

import React, { useState, useEffect, useActionState as useActionStateReact } from 'react';
import NextImage from 'next/image';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, MessageSquareText, Newspaper, Palette, Type, ThumbsUp, Copy, Ratio, ImageUp, UserSquare, Wand2, Loader2, Trash2, Images } from 'lucide-react';
import { handleGenerateImagesAction, handleGenerateSocialMediaCaptionAction, handleGenerateBlogContentAction, handleDescribeImageAction, type FormState } from '@/lib/actions';
import { SubmitButton } from "@/components/SubmitButton";
import type { GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost } from '@/types';
import type { DescribeImageOutput } from "@/ai/flows/describe-image-flow";


const initialImageFormState: FormState<string[]> = { error: undefined, data: undefined, message: undefined };
const initialSocialFormState: FormState<{ caption: string; hashtags: string; imageSrc: string | null }> = { error: undefined, data: undefined, message: undefined };
const initialBlogFormState: FormState<{ title: string; content: string; tags: string }> = { error: undefined, data: undefined, message: undefined };
const initialDescribeImageState: FormState<DescribeImageOutput> = { error: undefined, data: undefined, message: undefined };


type SocialImageChoice = 'generated' | 'profile' | null;

export default function ContentStudioPage() {
  const { brandData, addGeneratedImage, addGeneratedSocialPost, addGeneratedBlogPost } = useBrand();
  const { toast } = useToast();

  const [imageState, imageAction] = useActionStateReact(handleGenerateImagesAction, initialImageFormState);
  const [socialState, socialAction] = useActionStateReact(handleGenerateSocialMediaCaptionAction, initialSocialFormState);
  const [blogState, blogAction] = useActionStateReact(handleGenerateBlogContentAction, initialBlogFormState);
  const [describeImageState, describeImageAction] = useActionStateReact(handleDescribeImageAction, initialDescribeImageState);
  
  const [lastSuccessfulGeneratedImageUrls, setLastSuccessfulGeneratedImageUrls] = useState<string[]>([]);
  const [generatedSocialPost, setGeneratedSocialPost] = useState<{caption: string, hashtags: string} | null>(null);
  const [generatedBlogPost, setGeneratedBlogPost] = useState<{title: string, content: string, tags: string} | null>(null);
  
  const [useImageForSocialPost, setUseImageForSocialPost] = useState<boolean>(false);
  const [socialImageChoice, setSocialImageChoice] = useState<SocialImageChoice>(null);
  const [socialToneValue, setSocialToneValue] = useState<string>("professional");
  const [blogPlatformValue, setBlogPlatformValue] = useState<"Medium" | "Other">("Medium");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("1:1");
  const [numberOfImagesToGenerate, setNumberOfImagesToGenerate] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<string>("image");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);


  useEffect(() => {
    if (imageState.data) {
      const newImageUrls = imageState.data;
      setLastSuccessfulGeneratedImageUrls(newImageUrls);
      
      const imageGenBrandDescription = (document.querySelector('form[action^="/content-studio"] textarea[name="brandDescription"]') as HTMLTextAreaElement)?.value || "";
      const imageGenImageStyle = (document.querySelector('form[action^="/content-studio"] input[name="imageStyle"]') as HTMLInputElement)?.value || "";

      newImageUrls.forEach(url => {
        const newImage: GeneratedImage = {
          id: `${new Date().toISOString()}-${Math.random().toString(36).substring(2, 9)}`, // Ensure unique ID
          src: url,
          prompt: imageGenBrandDescription,
          style: imageGenImageStyle
        };
        addGeneratedImage(newImage);
      });
      toast({ title: "Success", description: imageState.message });
    }
    if (imageState.error) toast({ title: "Error", description: imageState.error, variant: "destructive" });
  }, [imageState, toast, addGeneratedImage]);

  useEffect(() => {
    if (socialState.data) {
      const socialData = socialState.data;
      setGeneratedSocialPost({ caption: socialData.caption, hashtags: socialData.hashtags });
       const newPost: GeneratedSocialMediaPost = {
        id: new Date().toISOString(),
        platform: 'Instagram', 
        imageSrc: socialData.imageSrc || "", 
        imageDescription: (document.querySelector('form[action^="/content-studio"] textarea[name="imageDescription"]') as HTMLTextAreaElement)?.value || "",
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
        websiteUrl: (document.querySelector('form[action^="/content-studio"] input[name="blogWebsiteUrl"]') as HTMLInputElement)?.value || undefined,
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


  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${type} Copied!`, description: "Content copied to clipboard." });
  };

  const handleClearGeneratedImages = () => {
    setLastSuccessfulGeneratedImageUrls([]);
    toast({title: "Cleared", description: "Generated images cleared."});
  };

  const handleUseGeneratedImageForSocial = () => {
    if (lastSuccessfulGeneratedImageUrls.length > 0) {
      setUseImageForSocialPost(true);
      setSocialImageChoice('generated'); // Default to using the (first) generated image
      setActiveTab('social'); 
      toast({title: "Image Selected", description: "First generated image selected for social post."});
    } else {
      toast({title: "No Image", description: "Please generate an image first.", variant: "destructive"});
    }
  };

  const currentSocialImagePreviewUrl = useImageForSocialPost 
    ? (socialImageChoice === 'generated' 
        ? (lastSuccessfulGeneratedImageUrls[0] || null) // Use first generated image, or null if array empty
        : (socialImageChoice === 'profile' ? brandData?.exampleImage : null)) 
    : null;

  const handleAIDescribeImage = () => {
    if (!currentSocialImagePreviewUrl) {
      toast({ title: "No Image Selected", description: "Please select an image to describe.", variant: "destructive" });
      return;
    }
    setIsGeneratingDescription(true);
    const formData = new FormData();
    formData.append("imageDataUri", currentSocialImagePreviewUrl);
    React.startTransition(() => {
        describeImageAction(formData);
    });
  };
  
  const socialSubmitDisabled = socialState.data?.caption ? false : (useImageForSocialPost && !currentSocialImagePreviewUrl);


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
                <CardDescription>Create unique images based on your brand's aesthetics. Uses brand description and style. Optionally provide an example image Data URI from your Brand Profile.</CardDescription>
              </CardHeader>
              <form action={imageAction}>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="imageGenBrandDescription" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Brand Description (from Profile)</Label>
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
                    <Label htmlFor="imageGenImageStyle" className="flex items-center mb-1"><Palette className="w-4 h-4 mr-2 text-primary" />Image Style (from Profile)</Label>
                    <Input
                      id="imageGenImageStyle"
                      name="imageStyle"
                      defaultValue={brandData?.imageStyle || ""}
                      placeholder="E.g., minimalist, vibrant, professional"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="imageGenExampleImage" className="flex items-center mb-1"><ImageIcon className="w-4 h-4 mr-2 text-primary" />Example Image Data URI (from Profile, Optional)</Label>
                    <Input
                      id="imageGenExampleImage"
                      name="exampleImage"
                      defaultValue={brandData?.exampleImage || ""}
                      placeholder="Paste a Data URI of an image to inform the style"
                    />
                    {brandData?.exampleImage && (
                        <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Preview of example image from profile:</p>
                            <NextImage src={brandData.exampleImage} alt="Example image from profile" width={80} height={80} className="rounded border object-contain" data-ai-hint="style example"/>
                        </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="imageGenAspectRatio" className="flex items-center mb-1"><Ratio className="w-4 h-4 mr-2 text-primary" />Aspect Ratio</Label>
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
                        <Label htmlFor="numberOfImages" className="flex items-center mb-1"><Images className="w-4 h-4 mr-2 text-primary" />Number of Images</Label>
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
                </CardContent>
                <CardFooter>
                  <SubmitButton className="w-full" loadingText={parseInt(numberOfImagesToGenerate) > 1 ? "Generating Images..." : "Generating Image..."}>
                    Generate {parseInt(numberOfImagesToGenerate) > 1 ? `${numberOfImagesToGenerate} Images` : "Image"}
                  </SubmitButton>
                </CardFooter>
              </form>
              {lastSuccessfulGeneratedImageUrls.length > 0 && (
                <CardContent className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Generated Image{lastSuccessfulGeneratedImageUrls.length > 1 ? 's' : ''}:</h3>
                    <Button variant="outline" size="sm" onClick={handleClearGeneratedImages}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear Image{lastSuccessfulGeneratedImageUrls.length > 1 ? 's' : ''}
                    </Button>
                  </div>
                  <div className={`grid gap-4 ${lastSuccessfulGeneratedImageUrls.length > 1 ? (lastSuccessfulGeneratedImageUrls.length > 2 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2') : 'grid-cols-1'}`}>
                    {lastSuccessfulGeneratedImageUrls.map((url, index) => (
                        <div key={index} className="relative w-full overflow-hidden border rounded-md bg-muted aspect-square">
                            <NextImage src={url} alt={`Generated brand image ${index + 1}`} fill style={{objectFit: 'contain'}} data-ai-hint="brand marketing"/>
                        </div>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-4" onClick={handleUseGeneratedImageForSocial} disabled={lastSuccessfulGeneratedImageUrls.length === 0}>
                    <ImageUp className="mr-2 h-4 w-4" /> Use First Image for Social Post
                  </Button>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Social Media Post Tab */}
          <TabsContent value="social">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Create Social Media Post</CardTitle>
                <CardDescription>Generate engaging captions and hashtags. Uses brand description, image description (optional), and selected tone.</CardDescription>
              </CardHeader>
              <form action={socialAction}>
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
                                } else if (!socialImageChoice && brandData?.exampleImage) {
                                    setSocialImageChoice('profile'); 
                                }
                            }}
                        />
                        <Label htmlFor="useImageForSocialPost" className="text-base font-medium">
                            Use an image for this post?
                        </Label>
                    </div>

                    {useImageForSocialPost && (
                        <RadioGroup 
                            value={socialImageChoice || ""} 
                            onValueChange={(value) => setSocialImageChoice(value as 'generated' | 'profile' | null)}
                            className="pl-6 space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="generated" id="social-generated" disabled={lastSuccessfulGeneratedImageUrls.length === 0}/>
                                <Label htmlFor="social-generated" className={lastSuccessfulGeneratedImageUrls.length === 0 ? "text-muted-foreground" : ""}>
                                    Use Last Generated Image {lastSuccessfulGeneratedImageUrls.length === 0 ? "(None available)" : `(${lastSuccessfulGeneratedImageUrls.length} available - first will be used)`}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="profile" id="social-profile" disabled={!brandData?.exampleImage} />
                                <Label htmlFor="social-profile" className={!brandData?.exampleImage ? "text-muted-foreground" : ""}>
                                    Use Brand Profile Example Image {brandData?.exampleImage ? "" : "(None available)"}
                                </Label>
                            </div>
                        </RadioGroup>
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
                    <input type="hidden" name="selectedImageSrcForSocialPost" value={currentSocialImagePreviewUrl || ""} />
                  </div>

                  <div>
                    <Label htmlFor="socialBrandDescription" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Brand Description (from Profile)</Label>
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
                        <Label htmlFor="socialImageDescription" className="flex items-center"><UserSquare className="w-4 h-4 mr-2 text-primary" />Image Description {useImageForSocialPost ? '(Required if using image)' : '(Optional)'}</Label>
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
                      name="imageDescription"
                      placeholder={useImageForSocialPost ? "Describe the image you're posting (e.g., 'A vibrant photo of our new product'). Required if using an image." : "Optionally describe the theme or topic if not using an image."}
                      rows={3}
                      required={useImageForSocialPost && !!currentSocialImagePreviewUrl} 
                    />
                  </div>

                   <div>
                    <Label htmlFor="socialTone" className="flex items-center mb-1"><ThumbsUp className="w-4 h-4 mr-2 text-primary" />Tone</Label>
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
                <CardContent className="mt-6 space-y-4">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">Generated Caption:</h3>
                    <div className="p-3 border rounded-md bg-secondary">
                      <p className="text-sm whitespace-pre-wrap">{generatedSocialPost.caption}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedSocialPost.caption, "Caption")} className="mt-1">
                      <Copy className="w-3 h-3 mr-1" /> Copy Caption
                    </Button>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">Generated Hashtags:</h3>
                    <div className="p-3 border rounded-md bg-secondary">
                      <p className="text-sm">{generatedSocialPost.hashtags}</p>
                    </div>
                     <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedSocialPost.hashtags, "Hashtags")} className="mt-1">
                      <Copy className="w-3 h-3 mr-1" /> Copy Hashtags
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Blog Post Tab */}
          <TabsContent value="blog">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Create Blog Content</CardTitle>
                <CardDescription>Generate SEO-friendly blog posts. Uses brand name, description, keywords, and target platform. Optionally add website for SEO insights.</CardDescription>
              </CardHeader>
              <form action={blogAction}>
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
                    <Label htmlFor="blogBrandDescription" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Brand Description (from Profile)</Label>
                    <Textarea
                      id="blogBrandDescription"
                      name="brandDescription"
                      defaultValue={brandData?.brandDescription || ""}
                      placeholder="Detailed brand description"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="blogKeywords" className="flex items-center mb-1"><Palette className="w-4 h-4 mr-2 text-primary" />Keywords (from Profile)</Label>
                    <Input
                      id="blogKeywords"
                      name="keywords"
                      defaultValue={brandData?.targetKeywords || ""}
                      placeholder="Comma-separated keywords (e.g., AI, marketing, branding)"
                      required
                    />
                  </div>
                  <div>
                      <Label htmlFor="blogWebsiteUrl" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Website URL (Optional, for SEO insights)</Label>
                      <Input
                        id="blogWebsiteUrl"
                        name="blogWebsiteUrl" // Unique name for this form
                        defaultValue={brandData?.websiteUrl || ""}
                        placeholder="https://www.example.com"
                      />
                  </div>
                  <div>
                    <Label htmlFor="blogTargetPlatform" className="flex items-center mb-1"><Newspaper className="w-4 h-4 mr-2 text-primary" />Target Platform</Label>
                    <Select name="targetPlatform" required value={blogPlatformValue} onValueChange={(value) => setBlogPlatformValue(value as "Medium" | "Other")}>
                      <SelectTrigger id="blogTargetPlatformSelect">
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
                  <SubmitButton className="w-full" loadingText="Generating Blog...">Generate Blog Post</SubmitButton>
                </CardFooter>
              </form>
              {generatedBlogPost && (
                <CardContent className="mt-6 space-y-4">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">Generated Title:</h3>
                    <div className="p-3 border rounded-md bg-secondary">
                      <p className="text-xl font-medium">{generatedBlogPost.title}</p>
                    </div>
                     <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedBlogPost.title, "Title")} className="mt-1">
                      <Copy className="w-3 h-3 mr-1" /> Copy Title
                    </Button>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">Generated Content:</h3>
                    <div className="p-3 prose border rounded-md bg-secondary max-w-none max-h-96 overflow-y-auto">
                      <p className="whitespace-pre-wrap">{generatedBlogPost.content}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedBlogPost.content, "Content")} className="mt-1">
                      <Copy className="w-3 h-3 mr-1" /> Copy Content
                    </Button>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">Generated Tags:</h3>
                     <div className="p-3 border rounded-md bg-secondary">
                      <p className="text-sm">{generatedBlogPost.tags}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedBlogPost.tags, "Tags")} className="mt-1">
                      <Copy className="w-3 h-3 mr-1" /> Copy Tags
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
