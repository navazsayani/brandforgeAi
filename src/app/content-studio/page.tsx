
"use client";

import React, { useState, useEffect, useActionState, startTransition, useRef } from 'react';
import NextImage from 'next/image';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, MessageSquareText, Newspaper, Palette, Type, ThumbsUp, Copy, Ratio, ImageUp, UserSquare, Wand2, Loader2, Trash2, Images, Globe, ExternalLink, CircleSlash, Pipette, FileText, ListOrdered, Mic2, Edit, Briefcase, Eye, Save, Tag, Paintbrush, Zap, Aperture, PaletteIcon, Server, RefreshCw } from 'lucide-react';
import { handleGenerateImagesAction, handleGenerateSocialMediaCaptionAction, handleGenerateBlogContentAction, handleDescribeImageAction, handleGenerateBlogOutlineAction, handleSaveGeneratedImagesAction, handleCheckFreepikTaskStatusAction, type FormState } from '@/lib/actions';
import { SubmitButton } from "@/components/SubmitButton";
import type { GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, SavedGeneratedImage } from '@/types';
import type { DescribeImageOutput } from "@/ai/flows/describe-image-flow";
import type { GenerateBlogOutlineOutput } from "@/ai/flows/generate-blog-outline-flow";
import type { GenerateImagesInput } from '@/ai/flows/generate-images';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialImageFormState: FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string; }> = { error: undefined, data: undefined, message: undefined };
const initialSocialFormState: FormState<{ caption: string; hashtags: string; imageSrc: string | null }> = { error: undefined, data: undefined, message: undefined };
const initialBlogFormState: FormState<{ title: string; content: string; tags: string }> = { error: undefined, data: undefined, message: undefined };
const initialDescribeImageState: FormState<DescribeImageOutput> = { error: undefined, data: undefined, message: undefined };
const initialBlogOutlineState: FormState<GenerateBlogOutlineOutput> = { error: undefined, data: undefined, message: undefined };
const initialSaveImagesState: FormState<{savedCount: number}> = { error: undefined, data: undefined, message: undefined };
const initialFreepikTaskStatusState: FormState<{ status: string; images: string[] | null; taskId: string;}> = { error: undefined, data: undefined, message: undefined };


type SocialImageChoice = 'generated' | 'profile' | null;

const imageStylePresets = [
  { value: "photorealistic", label: "Photorealistic (General)" },
  { value: "digital-art", label: "Digital Art (General/Freepik)" },
  { value: "3d", label: "3D (General/Freepik)" },
  { value: "painting", label: "Painting (General/Freepik)" },
  { value: "minimalist", label: "Minimalist (General)" },
  { value: "abstract", label: "Abstract (General)" },
  { value: "vintage", label: "Vintage / Retro (General/Freepik)" },
  { value: "surreal", label: "Surreal (General/Freepik)" },
  { value: "fantasy", label: "Fantasy Art (General/Freepik)" },
  { value: "photo", label: "Photo (Freepik Specific)" },
  { value: "low-poly", label: "Low Poly (Freepik Specific)" },
  { value: "pixel-art", label: "Pixel Art (Freepik Specific)" },
  { value: "anime", label: "Anime / Manga (Freepik Specific)" },
  { value: "cyberpunk", label: "Cyberpunk (Freepik Specific)" },
  { value: "comic", label: "Comic (Freepik Specific)" },
  { value: "cartoon", label: "Cartoon (General/Freepik)" },
  { value: "vector", label: "Vector (Freepik Specific)" },
  { value: "studio-shot", label: "Studio Shot (Freepik Specific)"},
  { value: "dark", label: "Dark (Freepik Specific)"},
  { value: "sketch", label: "Sketch (Freepik Specific)"},
  { value: "mockup", label: "Mockup (Freepik Specific)"},
  { value: "2000s-pone", label: "2000s Pone (Freepik Specific)"},
  { value: "70s-vibe", label: "70s Vibe (Freepik Specific)"},
  { value: "watercolor", label: "Watercolor (Freepik Specific)"},
  { value: "art-nouveau", label: "Art Nouveau (Freepik Specific)"},
  { value: "origami", label: "Origami (Freepik Specific)"},
  { value: "traditional-japan", label: "Traditional Japan (Freepik Specific)"},
];

const freepikImagen3EffectColors = ["none", "b&w", "pastel", "sepia", "dramatic", "vibrant", "orange&teal", "film-filter", "split", "electric", "pastel-pink", "gold-glow", "autumn", "muted-green", "deep-teal", "duotone", "terracotta&teal", "red&blue", "cold-neon", "burgundy&blue"];
const freepikImagen3EffectLightnings = ["none", "studio", "warm", "cinematic", "volumetric", "golden-hour", "long-exposure", "cold", "iridescent", "dramatic", "hardlight", "redscale", "indoor-light"];
const freepikImagen3EffectFramings = ["none", "portrait", "macro", "panoramic", "aerial-view", "close-up", "cinematic", "high-angle", "low-angle", "symmetry", "fish-eye", "first-person"];
const freepikImagen3AspectRatios = [
    { value: "square_1_1", label: "Square (1:1)" },
    { value: "social_story_9_16", label: "Social Story (9:16)" },
    { value: "widescreen_16_9", label: "Widescreen (16:9)" },
    { value: "traditional_3_4", label: "Traditional (3:4)" },
    { value: "classic_4_3", label: "Classic (4:3)" },
];

const generalAspectRatios = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "4:5", label: "Portrait (4:5)" },
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Story/Reel (9:16)" },
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

const imageGenerationProviders = [
    { value: "GEMINI", label: "Gemini (Google AI)" },
    { value: "FREEPIK", label: "Freepik API (imagen3)" },
    { value: "LEONARDO_AI", label: "Leonardo.ai (Not Implemented)", disabled: true },
    { value: "IMAGEN", label: "Imagen (via Vertex - Not Implemented)", disabled: true },
];


export default function ContentStudioPage() {
  const { brandData, addGeneratedImage, addGeneratedSocialPost, addGeneratedBlogPost } = useBrand();
  const { toast } = useToast();

  const [imageState, imageAction] = useActionState(handleGenerateImagesAction, initialImageFormState);
  const [socialState, socialAction] = useActionState(handleGenerateSocialMediaCaptionAction, initialSocialFormState);
  const [blogState, blogAction] = useActionState(handleGenerateBlogContentAction, initialBlogFormState);
  const [describeImageState, describeImageAction] = useActionState(handleDescribeImageAction, initialDescribeImageState);
  const [blogOutlineState, blogOutlineAction] = useActionState(handleGenerateBlogOutlineAction, initialBlogOutlineState);
  const [saveImagesState, saveImagesAction] = useActionState(handleSaveGeneratedImagesAction, initialSaveImagesState);
  const [freepikTaskStatusState, freepikTaskStatusAction] = useActionState(handleCheckFreepikTaskStatusAction, initialFreepikTaskStatusState);
  
  const [lastSuccessfulGeneratedImageUrls, setLastSuccessfulGeneratedImageUrls] = useState<string[]>([]);
  const [lastUsedImageGenPrompt, setLastUsedImageGenPrompt] = useState<string | null>(null);
  const [lastUsedImageProvider, setLastUsedImageProvider] = useState<string | null>(null);

  const [generatedSocialPost, setGeneratedSocialPost] = useState<{caption: string, hashtags: string, imageSrc: string | null} | null>(null);
  const [generatedBlogPost, setGeneratedBlogPost] = useState<{title: string, content: string, tags: string} | null>(null);
  const [generatedBlogOutline, setGeneratedBlogOutline] = useState<string>("");
  
  const [useImageForSocialPost, setUseImageForSocialPost] = useState<boolean>(false);
  const [socialImageChoice, setSocialImageChoice] = useState<SocialImageChoice>(null);
  const [socialToneValue, setSocialToneValue] = useState<string>("professional");
  const [customSocialToneNuances, setCustomSocialToneNuances] = useState<string>("");
  const [blogPlatformValue, setBlogPlatformValue] = useState<"Medium" | "Other">("Medium");
  const [selectedBlogTone, setSelectedBlogTone] = useState<string>(blogTones[0].value);
  
  const [numberOfImagesToGenerate, setNumberOfImagesToGenerate] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<string>("image");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState<boolean>(false);
  
  const [selectedProfileImageIndexForGen, setSelectedProfileImageIndexForGen] = useState<number | null>(null);
  const [selectedProfileImageIndexForSocial, setSelectedProfileImageIndexForSocial] = useState<number | null>(null);

  // States for controlled inputs in Image Generation
  const [selectedImageProvider, setSelectedImageProvider] = useState<string>(imageGenerationProviders[0].value);
  const [imageGenBrandDescription, setImageGenBrandDescription] = useState<string>("");
  const [imageGenIndustry, setImageGenIndustry] = useState<string>("");
  const [selectedImageStylePreset, setSelectedImageStylePreset] = useState<string>(imageStylePresets[0].value);
  const [customStyleNotesInput, setCustomStyleNotesInput] = useState<string>("");
  const [imageGenNegativePrompt, setImageGenNegativePrompt] = useState<string>("");
  const [imageGenSeed, setImageGenSeed] = useState<string>("");
  
  const [currentAspectRatioOptions, setCurrentAspectRatioOptions] = useState(generalAspectRatios);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(generalAspectRatios[0].value);
  
  const [freepikDominantColorsInput, setFreepikDominantColorsInput] = useState<string>("");
  const [freepikEffectColor, setFreepikEffectColor] = useState<string>("none");
  const [freepikEffectLightning, setFreepikEffectLightning] = useState<string>("none");
  const [freepikEffectFraming, setFreepikEffectFraming] = useState<string>("none");

  const [isPreviewingPrompt, setIsPreviewingPrompt] = useState<boolean>(false);
  const [currentTextPromptForEditing, setCurrentTextPromptForEditing] = useState<string>("");
  const [formSnapshot, setFormSnapshot] = useState<Partial<GenerateImagesInput> & { provider?: string } | null>(null);

  const [selectedGeneratedImageIndices, setSelectedGeneratedImageIndices] = useState<number[]>([]);
  const [checkingTaskId, setCheckingTaskId] = useState<string | null>(null);
  
  useEffect(() => {
    if (brandData) {
        setImageGenBrandDescription(brandData.brandDescription || "");
        setImageGenIndustry(brandData.industry || "");
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
    if (selectedImageProvider === 'FREEPIK') {
      setCurrentAspectRatioOptions(freepikImagen3AspectRatios);
      setSelectedAspectRatio(freepikImagen3AspectRatios[0].value);
    } else {
      setCurrentAspectRatioOptions(generalAspectRatios);
      setSelectedAspectRatio(generalAspectRatios[0].value);
    }
  }, [selectedImageProvider]);

  useEffect(() => {
    if (imageState.data) {
      const newImageUrls = imageState.data.generatedImages;
      setLastSuccessfulGeneratedImageUrls(newImageUrls);
      setLastUsedImageGenPrompt(imageState.data.promptUsed);
      setLastUsedImageProvider(imageState.data.providerUsed);
      setSelectedGeneratedImageIndices([]); 
      
      const displayableImages = newImageUrls.filter(url => url && (url.startsWith('data:') || url.startsWith('image_url:')));
      if (displayableImages.length > 0) {
        displayableImages.forEach(url => { 
            const displayUrl = url.startsWith('image_url:') ? url.substring(10) : url;
            const newImage: GeneratedImage = {
                id: `${new Date().toISOString()}-${Math.random().toString(36).substring(2, 9)}`, 
                src: displayUrl, 
                prompt: imageState.data.promptUsed || "", 
                style: selectedImageStylePreset + (customStyleNotesInput ? ". " + customStyleNotesInput : "")
            };
            addGeneratedImage(newImage); 
        });
         toast({ title: "Success", description: `${displayableImages.length} image(s) processed using ${imageState.data.providerUsed || 'default provider'}.` });
      } else if (newImageUrls.some(url => url.startsWith('task_id:'))) {
        toast({ title: "Freepik Task Started", description: "Freepik image generation task started. Use 'Check Status' to retrieve images." });
      } else if (imageState.error) {
        toast({ title: "Error generating images", description: imageState.error, variant: "destructive" });
      } else if (!newImageUrls || newImageUrls.length === 0) {
        toast({ title: "No Images/Tasks Generated", description: `Received empty list from ${imageState.data.providerUsed || 'default provider'}. Check logs.`, variant: "default" });
      }
      setIsPreviewingPrompt(false); 
    }
    if (imageState.error && !imageState.data) {
      toast({ title: "Error generating images", description: imageState.error, variant: "destructive" });
      setIsPreviewingPrompt(false); 
    }
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
        tone: socialToneValue + (customSocialToneNuances ? ` ${customSocialToneNuances}` : ''),
      };
      addGeneratedSocialPost(newPost);
      toast({ title: "Success", description: socialState.message });
    }
    if (socialState.error) toast({ title: "Error generating social post", description: socialState.error, variant: "destructive" });
  }, [socialState, toast, addGeneratedSocialPost, socialToneValue, customSocialToneNuances]);

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
    if (blogState.error) toast({ title: "Error generating blog post", description: blogState.error, variant: "destructive" });
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
      toast({ title: "Error generating image description", description: describeImageState.error, variant: "destructive" });
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

  useEffect(() => {
    if (saveImagesState.message && !saveImagesState.error) {
      toast({ title: "Image Library", description: saveImagesState.message });
    }
    if (saveImagesState.error) {
      toast({ title: "Error Saving Images", description: saveImagesState.error, variant: "destructive"});
    }
  }, [saveImagesState, toast]);

  useEffect(() => {
    if (freepikTaskStatusState.data) {
      const { status, images, taskId } = freepikTaskStatusState.data;
      if (status === 'COMPLETED' && images && images.length > 0) {
        setLastSuccessfulGeneratedImageUrls(prevUrls =>
          prevUrls.map(url => (url === `task_id:${taskId}` ? images.map(imgUrl => `image_url:${imgUrl}`) : url)).flat()
        );
        toast({ title: `Task ${taskId.substring(0,8)}... Completed`, description: `${images.length} image(s) retrieved.` });
      } else if (status === 'IN_PROGRESS') {
        toast({ title: `Task ${taskId.substring(0,8)}... Still In Progress`, description: "Please check again in a few moments." });
      } else if (status === 'FAILED') {
        toast({ title: `Task ${taskId.substring(0,8)}... Failed`, description: "Freepik failed to generate images for this task.", variant: "destructive" });
      } else {
         toast({ title: `Task ${taskId.substring(0,8)}... Status: ${status}`, description: "Could not retrieve images or task has an unexpected status." });
      }
      setCheckingTaskId(null);
    }
    if (freepikTaskStatusState.error) {
      toast({ title: "Error Checking Task Status", description: freepikTaskStatusState.error, variant: "destructive" });
      setCheckingTaskId(null);
    }
  }, [freepikTaskStatusState, toast]);


  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${type} Copied!`, description: "Content copied to clipboard." });
  };

  const handleClearGeneratedImages = () => {
    setLastSuccessfulGeneratedImageUrls([]);
    setLastUsedImageGenPrompt(null);
    setLastUsedImageProvider(null);
    setSelectedGeneratedImageIndices([]);
    setFormSnapshot(null); 
    setIsPreviewingPrompt(false); 
    toast({title: "Cleared", description: "Generated images and prompt cleared."});
  };

  const handleToggleGeneratedImageSelection = (index: number) => {
    setSelectedGeneratedImageIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSaveSelectedGeneratedImages = () => {
    if (selectedGeneratedImageIndices.length === 0 || lastSuccessfulGeneratedImageUrls.length === 0) {
      toast({ title: "No Images Selected", description: "Please select images to save.", variant: "destructive" });
      return;
    }
    const imagesToSave = selectedGeneratedImageIndices
        .map(index => lastSuccessfulGeneratedImageUrls[index])
        .filter(url => url && (url.startsWith('data:') || url.startsWith('image_url:'))) 
        .map(url => ({
            dataUri: url, 
            prompt: lastUsedImageGenPrompt || "N/A",
            style: (formSnapshot?.imageStyle || selectedImageStylePreset + (customStyleNotesInput ? ". " + customStyleNotesInput : "")),
        }));

    if (imagesToSave.length === 0) {
        toast({ title: "No new images to save", description: "Selected images might be task IDs or invalid for saving.", variant: "default"});
        return;
    }
    
    const formData = new FormData();
    formData.append('imagesToSaveJson', JSON.stringify(imagesToSave));
    formData.append('brandProfileDocId', 'defaultBrandProfile');

    startTransition(() => {
      saveImagesAction(formData);
    });
  };

  const handleUseGeneratedImageForSocial = () => {
    const firstDisplayableImage = lastSuccessfulGeneratedImageUrls.find(url => url?.startsWith('data:') || url?.startsWith('image_url:'));
    if (firstDisplayableImage) {
      setUseImageForSocialPost(true);
      setSocialImageChoice('generated'); 
      setSelectedProfileImageIndexForSocial(null); 
      setActiveTab('social'); 
      toast({title: "Image Selected", description: "First available generated image selected for social post."});
    } else {
      toast({title: "No Image", description: "Please generate a displayable image first (Gemini or completed Freepik task).", variant: "destructive"});
    }
  };

  const currentExampleImageForGen = (brandData?.exampleImages && selectedProfileImageIndexForGen !== null && brandData.exampleImages[selectedProfileImageIndexForGen]) || "";

  const currentSocialImagePreviewUrl = useImageForSocialPost
    ? (socialImageChoice === 'generated'
        ? (lastSuccessfulGeneratedImageUrls.find(url => url?.startsWith('data:') || url?.startsWith('image_url:')) || null) 
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
    formData.append("imageDataUri", currentSocialImagePreviewUrl.startsWith('image_url:') ? currentSocialImagePreviewUrl.substring(10) : currentSocialImagePreviewUrl); 
    startTransition(() => {
        describeImageAction(formData);
    });
  };
  
  const socialSubmitDisabled = socialState.data?.caption ? false : (useImageForSocialPost && !currentSocialImagePreviewUrl);

 const handlePreviewPromptClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const combinedStyle = selectedImageStylePreset + (customStyleNotesInput ? `. ${customStyleNotesInput}` : "");
    const exampleImg = currentExampleImageForGen;
    const aspect = selectedAspectRatio;
    const numImages = parseInt(numberOfImagesToGenerate, 10);
    const seedValueStr = imageGenSeed;
    const seedValue = seedValueStr && !isNaN(parseInt(seedValueStr)) ? parseInt(seedValueStr, 10) : undefined;
    const negPrompt = imageGenNegativePrompt;
    const industryContext = imageGenIndustry ? ` The brand operates in the ${imageGenIndustry} industry.` : "";
    const compositionGuidance = "IMPORTANT COMPOSITION RULE: When depicting human figures as the primary subject, the image *must* be well-composed. Avoid awkward or unintentional cropping of faces or key body parts. Ensure the figure is presented naturally and fully within the frame, unless the prompt *explicitly* requests a specific framing like 'close-up', 'headshot', 'upper body shot', or an artistic crop. Prioritize showing the entire subject if it's a person.";
    
    let textPromptContent = "";
        
    if (exampleImg) {
        textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.

The provided example image (sent first for Gemini) serves ONE primary purpose: to identify the *category* of the item depicted (e.g., 'a handbag', 'a t-shirt', 'a piece of furniture', 'a pair of shoes').

Your task is to generate a *completely new item* belonging to this *same category*.

The *design, appearance, theme, specific characteristics, and unique elements* of this NEW item must be **primarily and heavily derived** from the following inputs:
1.  **Brand Description**: "${imageGenBrandDescription}"${industryContext}. This description informs the *theme, conceptual elements, and unique characteristics* of the new item.
2.  **Desired Artistic Style**: "${combinedStyle}". This dictates the overall visual execution, including aspects like color palette (unless the brand description very strongly and specifically dictates a color scheme), lighting, and rendering style. If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic and look like a real product photo.

**Important Note on Color and Style**: While the brand description provides thematic guidance, strive for visual variety and avoid over-relying on a narrow color palette (like exclusively black and gold) unless the brand description *and* desired artistic style overwhelmingly and explicitly demand it. The goal is a fresh interpretation that fits the brand's *overall essence* and the *chosen artistic style*.

**Crucially, do NOT replicate or closely imitate the visual design details (color, pattern, specific shape elements beyond the basic category identification, embellishments) of the provided example image.** The example image is *only* for determining the item category. The new image should look like a distinct product that fits the brand description and desired artistic style.

**Example of Interaction:**
If the example image is a 'simple blue cotton t-shirt' (category: t-shirt), the Brand Description is 'luxury brand, minimalist ethos, inspired by serene nature, prefers organic materials', and the Desired Artistic Style is 'high-fashion product shot, muted earthy tones'.
You should generate an image of a *luxury t-shirt made from organic-looking material, in muted earthy tones (e.g., moss green, stone grey, soft beige), shot in a high-fashion product style*. It should evoke serenity and minimalism. It should NOT be the original blue cotton t-shirt, nor should it default to a generic "luxury" color scheme like black and gold unless those colors are specifically requested or strongly implied by the *combination* of inputs.
`.trim();
    } else { 
        textPromptContent = `
Generate a new, high-quality, visually appealing image suitable for social media platforms like Instagram.
The image should be based on the following concept: "${imageGenBrandDescription}".${industryContext}
The desired artistic style for this new image is: "${combinedStyle}". If this style suggests realism (e.g., "photorealistic", "realistic photo"), the output *must* be highly realistic.
**Important Note on Color and Style**: Strive for visual variety that aligns with the brand description and artistic style. Avoid defaulting to a narrow or stereotypical color palette unless the inputs strongly and explicitly demand it.
`.trim();
    }
    
    if (selectedImageProvider !== 'FREEPIK') { 
      if (negPrompt) {
        textPromptContent += `\n\nAvoid the following elements or characteristics in the image: ${negPrompt}.`;
      }
      if (aspect) {
        textPromptContent += `\n\nThe final image should have an aspect ratio of ${aspect} (e.g., square for 1:1, portrait for 4:5, landscape for 16:9). Ensure the composition fits this ratio naturally.`;
      }
      if (seedValue !== undefined) {
        textPromptContent += `\n\nUse seed: ${seedValue}.`;
      }
    }
    
    if (
        !textPromptContent.toLowerCase().includes("human figure") &&
        !textPromptContent.toLowerCase().includes("crop") &&
        !textPromptContent.toLowerCase().includes("close-up") &&
        !textPromptContent.toLowerCase().includes("headshot") &&
        !textPromptContent.toLowerCase().includes("portrait") &&
        !textPromptContent.toLowerCase().includes("figure framing") &&
        !textPromptContent.toLowerCase().includes("composition")
    ) {
        textPromptContent += `\n\n${compositionGuidance}`;
    }
    
    if (numImages > 1 && selectedImageProvider !== 'FREEPIK' ) { 
        textPromptContent += `\n\nImportant for batch generation: You are generating image 1 of a set of ${numImages}. All images in this set should feature the *same core subject or item* as described/derived from the inputs. For this specific image (1/${numImages}), try to vary the pose, angle, or minor background details slightly compared to other images in the set, while maintaining the identity of the primary subject. The goal is a cohesive set of images showcasing the same item from different perspectives or with subtle variations.`;
    }
    
    setCurrentTextPromptForEditing(textPromptContent);
    setFormSnapshot({
        provider: selectedImageProvider,
        brandDescription: imageGenBrandDescription,
        industry: imageGenIndustry,
        imageStyle: combinedStyle, 
        exampleImage: exampleImg === "" ? undefined : exampleImg,
        aspectRatio: aspect,
        numberOfImages: numImages,
        negativePrompt: negPrompt === "" ? undefined : negPrompt,
        seed: seedValue,
        freepikStylingColors: freepikDominantColorsInput ? freepikDominantColorsInput.split(',').map(c => ({color: c.trim(), weight: 0.5})) : undefined,
        freepikEffectColor: freepikEffectColor === "none" ? undefined : freepikEffectColor,
        freepikEffectLightning: freepikEffectLightning === "none" ? undefined : freepikEffectLightning,
        freepikEffectFraming: freepikEffectFraming === "none" ? undefined : freepikEffectFraming,
    });
    setIsPreviewingPrompt(true);
  };

 const handleImageGenerationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 
    startTransition(() => {
        const formData = new FormData();
        
        formData.append("finalizedTextPrompt", currentTextPromptForEditing || "");
        formData.append("provider", formSnapshot?.provider || selectedImageProvider);
        formData.append("brandDescription", formSnapshot?.brandDescription || imageGenBrandDescription || brandData?.brandDescription || "");
        formData.append("industry", formSnapshot?.industry || imageGenIndustry || brandData?.industry || "");
        formData.append("imageStyle", formSnapshot?.imageStyle || (selectedImageStylePreset + (customStyleNotesInput ? ". " + customStyleNotesInput : "")));
        
        const exampleImg = (formSnapshot?.exampleImage) || currentExampleImageForGen;
        if (exampleImg) formData.append("exampleImage", exampleImg);

        formData.append("aspectRatio", formSnapshot?.aspectRatio || selectedAspectRatio);
        formData.append("numberOfImages", String(formSnapshot?.numberOfImages || parseInt(numberOfImagesToGenerate,10)));
        
        const negPromptValue = formSnapshot?.negativePrompt || imageGenNegativePrompt;
        if (negPromptValue) formData.append("negativePrompt", negPromptValue);

        const seedValueNum = formSnapshot?.seed !== undefined ? formSnapshot.seed : (imageGenSeed && !isNaN(parseInt(imageGenSeed)) ? parseInt(imageGenSeed) : undefined);
        if (seedValueNum !== undefined && selectedImageProvider !== 'FREEPIK') { // Seed not sent for Freepik
          formData.append("seed", String(seedValueNum));
        }

        const fColorsInput = formSnapshot?.freepikStylingColors?.map(c=>c.color).join(',') || freepikDominantColorsInput;
        if (fColorsInput && selectedImageProvider === 'FREEPIK') formData.append("freepikDominantColorsInput", fColorsInput);
        
        const fEffectColorValue = formSnapshot?.freepikEffectColor || freepikEffectColor;
        if (fEffectColorValue && fEffectColorValue !== "none" && selectedImageProvider === 'FREEPIK') formData.append("freepikEffectColor", fEffectColorValue);
        
        const fEffectLightningValue = formSnapshot?.freepikEffectLightning || freepikEffectLightning;
        if (fEffectLightningValue && fEffectLightningValue !== "none" && selectedImageProvider === 'FREEPIK') formData.append("freepikEffectLightning", fEffectLightningValue);

        const fEffectFramingValue = formSnapshot?.freepikEffectFraming || freepikEffectFraming;
        if (fEffectFramingValue && fEffectFramingValue !== "none" && selectedImageProvider === 'FREEPIK') formData.append("freepikEffectFraming", fEffectFramingValue);
        
        imageAction(formData);
    });
  };
  
  const handleGenerateBlogOutline = () => {
    const formData = new FormData();
    formData.append('brandName', (document.getElementById('blogBrandName') as HTMLInputElement)?.value || brandData?.brandName || "");
    formData.append('blogBrandDescription', (document.getElementById('blogBrandDescription') as HTMLTextAreaElement)?.value || brandData?.brandDescription || "");
    formData.append('industry', (document.getElementById('blogIndustry') as HTMLInputElement)?.value || brandData?.industry || "");
    formData.append('blogKeywords', (document.getElementById('blogKeywords') as HTMLInputElement)?.value || brandData?.targetKeywords || "");
    formData.append('blogWebsiteUrl', (document.getElementById('blogWebsiteUrl') as HTMLInputElement)?.value || brandData?.websiteUrl || "");
    
    if (!formData.get('brandName') && !formData.get('blogBrandDescription') && !formData.get('blogKeywords')) {
        toast({title: "Missing Info", description: "Please provide Brand Name, Description, and Keywords for outline generation.", variant: "destructive"});
        return;
    }

    setIsGeneratingOutline(true);
    startTransition(() => {
        blogOutlineAction(formData);
    });
  };

  const handleFetchFreepikResult = (taskId: string) => {
    setCheckingTaskId(taskId);
    const formData = new FormData();
    formData.append("taskId", taskId);
    startTransition(() => {
      freepikTaskStatusAction(formData);
    });
  };


  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <CardHeader className="px-0 mb-6">
          <div className="flex items-center space-x-3">
              <Paintbrush className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Content Studio</CardTitle>
                <p className="text-lg text-muted-foreground">
                  Generate images, social media posts, and blog articles powered by AI.
                </p>
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
                <p className="text-sm text-muted-foreground">Create unique images. Uses brand description, industry, and style. Optionally use an example image from your Brand Profile.</p>
                 {lastUsedImageProvider && <p className="text-xs text-primary mt-1">Image(s) last generated using: {lastUsedImageProvider}</p>}
              </CardHeader>
              {!isPreviewingPrompt ? (
                <div id="imageGenerationFormFields"> 
                  <CardContent className="space-y-6">
                     <div>
                        <Label htmlFor="imageGenProviderSelect" className="flex items-center mb-1"><Server className="w-4 h-4 mr-2 text-primary" />Image Generation Provider</Label>
                        <Select value={selectedImageProvider} onValueChange={setSelectedImageProvider}>
                            <SelectTrigger id="imageGenProviderSelect">
                                <SelectValue placeholder="Select image generation provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Providers</SelectLabel>
                                    {imageGenerationProviders.map(provider => (
                                        <SelectItem key={provider.value} value={provider.value} disabled={provider.disabled}>
                                            {provider.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                      <Label htmlFor="imageGenBrandDescription" className="flex items-center mb-1"><FileText className="w-4 h-4 mr-2 text-primary" />Brand Description (from Profile)</Label>
                      <Textarea
                        id="imageGenBrandDescription"
                        value={imageGenBrandDescription}
                        onChange={(e) => setImageGenBrandDescription(e.target.value)}
                        placeholder="Detailed description of the brand and its values."
                        rows={3}
                      />
                    </div>
                     <div>
                        <Label htmlFor="imageGenIndustry" className="flex items-center mb-1"><Briefcase className="w-4 h-4 mr-2 text-primary" />Industry (from Profile)</Label>
                        <Input
                            id="imageGenIndustry"
                            value={imageGenIndustry}
                            onChange={(e) => setImageGenIndustry(e.target.value)}
                            placeholder="e.g., Fashion, Technology"
                        />
                    </div>
                    
                    <div>
                      <Label htmlFor="imageGenImageStylePresetSelect" className="flex items-center mb-1"><Palette className="w-4 h-4 mr-2 text-primary" />Image Style Preset</Label>
                      <Select 
                        value={selectedImageStylePreset} 
                        onValueChange={setSelectedImageStylePreset}
                      >
                          <SelectTrigger id="imageGenImageStylePresetSelect">
                              <SelectValue placeholder="Select image style preset" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectGroup>
                                  <SelectLabel>Artistic Styles</SelectLabel>
                                  {imageStylePresets.map(style => (
                                      <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                                  ))}
                              </SelectGroup>
                          </SelectContent>
                      </Select>
                       <p className="text-xs text-muted-foreground">
                         General styles. Some may be more effective with specific providers.
                       </p>
                    </div>

                    <div>
                      <Label htmlFor="imageGenCustomStyleNotes" className="flex items-center mb-1"><Edit className="w-4 h-4 mr-2 text-primary" />Custom Style Notes (from Profile)</Label>
                      <Textarea
                        id="imageGenCustomStyleNotes"
                        value={customStyleNotesInput}
                        onChange={(e) => setCustomStyleNotesInput(e.target.value)}
                        placeholder="E.g., 'add a touch of vintage', 'focus on metallic textures'. These notes are added to the main text prompt."
                        rows={2}
                      />
                    </div>
                    
                    <div>
                        <Label className="flex items-center mb-1">
                            <ImageIcon className="w-4 h-4 mr-2 text-primary" />Example Image from Profile (Optional)
                        </Label>
                         {brandData?.exampleImages && brandData.exampleImages.length > 0 ? (
                            <div className="mt-2 space-y-2">
                                {brandData.exampleImages.length > 1 ? (
                                    <>
                                    <p className="text-xs text-muted-foreground">Select Profile Image to Use as Reference:</p>
                                    <div className="flex space-x-2 overflow-x-auto pb-2">
                                        {brandData.exampleImages.map((imgSrc, index) => (
                                            <button
                                                type="button"
                                                key={`gen-profile-${index}`}
                                                onClick={() => setSelectedProfileImageIndexForGen(index)}
                                                className={cn(
                                                    "w-20 h-20 rounded border-2 p-0.5 flex-shrink-0 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring",
                                                    selectedProfileImageIndexForGen === index ? "border-primary ring-2 ring-primary" : "border-border"
                                                )}
                                            >
                                                <NextImage src={imgSrc} alt={`Example ${index + 1}`} width={76} height={76} className="object-contain w-full h-full rounded-sm" data-ai-hint="style example"/>
                                            </button>
                                        ))}
                                    </div>
                                    </>
                                ) : ( 
                                     <div className="w-20 h-20 rounded border-2 p-0.5 border-primary ring-2 ring-primary flex-shrink-0">
                                         <NextImage src={brandData.exampleImages[0]} alt={`Example 1`} width={76} height={76} className="object-contain w-full h-full rounded-sm" data-ai-hint="style example"/>
                                     </div>
                                )}
                                { (brandData?.exampleImages && selectedProfileImageIndexForGen !== null && brandData.exampleImages[selectedProfileImageIndexForGen]) && (
                                    <p className="text-xs text-muted-foreground">
                                        Using image {selectedProfileImageIndexForGen !== null && brandData.exampleImages && brandData.exampleImages.length > 1 ? selectedProfileImageIndexForGen + 1 : '1'} as reference.
                                    </p>
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
                        value={imageGenNegativePrompt}
                        onChange={(e) => setImageGenNegativePrompt(e.target.value)}
                        placeholder="E.g., avoid text, ugly, disfigured, low quality"
                        rows={2}
                      />
                    </div>
                    
                    {selectedImageProvider === 'FREEPIK' && (
                        <>
                            <div className="pt-4 mt-4 border-t">
                                <h4 className="text-md font-semibold mb-3 text-primary flex items-center"><Paintbrush className="w-5 h-5 mr-2"/>Freepik Specific Styling (imagen3 model)</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="freepikDominantColorsInput" className="flex items-center mb-1"><PaletteIcon className="w-4 h-4 mr-2 text-primary" />Dominant Colors</Label>
                                    <Input
                                        id="freepikDominantColorsInput"
                                        value={freepikDominantColorsInput}
                                        onChange={(e) => setFreepikDominantColorsInput(e.target.value)}
                                        placeholder="Up to 5 hex codes, e.g., #FF0000,#00FF00"
                                    />
                                    <p className="text-xs text-muted-foreground">Comma-separated hex codes. (Freepik specific)</p>
                                </div>
                                <div>
                                    <Label htmlFor="freepikEffectColor" className="flex items-center mb-1"><Paintbrush className="w-4 h-4 mr-2 text-primary" />Effect - Color</Label>
                                    <Select value={freepikEffectColor} onValueChange={setFreepikEffectColor}>
                                        <SelectTrigger id="freepikEffectColor"><SelectValue placeholder="Select Freepik color effect" /></SelectTrigger>
                                        <SelectContent>
                                            {freepikImagen3EffectColors.map(effect => <SelectItem key={effect} value={effect || "none"}>{effect || "None"}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                     <p className="text-xs text-muted-foreground">(Freepik specific)</p>
                                </div>
                                <div>
                                    <Label htmlFor="freepikEffectLightning" className="flex items-center mb-1"><Zap className="w-4 h-4 mr-2 text-primary" />Effect - Lightning</Label>
                                    <Select value={freepikEffectLightning} onValueChange={setFreepikEffectLightning}>
                                        <SelectTrigger id="freepikEffectLightning"><SelectValue placeholder="Select Freepik lightning effect" /></SelectTrigger>
                                        <SelectContent>
                                            {freepikImagen3EffectLightnings.map(effect => <SelectItem key={effect} value={effect || "none"}>{effect || "None"}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                     <p className="text-xs text-muted-foreground">(Freepik specific)</p>
                                </div>
                                <div>
                                    <Label htmlFor="freepikEffectFraming" className="flex items-center mb-1"><Aperture className="w-4 h-4 mr-2 text-primary" />Effect - Framing</Label>
                                    <Select value={freepikEffectFraming} onValueChange={setFreepikEffectFraming}>
                                        <SelectTrigger id="freepikEffectFraming"><SelectValue placeholder="Select Freepik framing effect" /></SelectTrigger>
                                        <SelectContent>
                                            {freepikImagen3EffectFramings.map(effect => <SelectItem key={effect} value={effect || "none"}>{effect || "None"}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                     <p className="text-xs text-muted-foreground">(Freepik specific)</p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <Label htmlFor="imageGenAspectRatioSelect" className="flex items-center mb-1"><Ratio className="w-4 h-4 mr-2 text-primary" />Aspect Ratio</Label>
                          <Select 
                            required 
                            value={selectedAspectRatio} 
                            onValueChange={setSelectedAspectRatio}
                          >
                          <SelectTrigger id="imageGenAspectRatioSelect">
                              <SelectValue placeholder="Select aspect ratio" />
                          </SelectTrigger>
                          <SelectContent>
                             {currentAspectRatioOptions.map(ar => (
                                <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                             ))}
                          </SelectContent>
                          </Select>
                      </div>
                      <div>
                          <Label htmlFor="numberOfImagesSelect" className="flex items-center mb-1"><Images className="w-4 h-4 mr-2 text-primary" />Number of Images</Label>
                          <Select value={numberOfImagesToGenerate} onValueChange={setNumberOfImagesToGenerate}>
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
                        type="number"
                        value={imageGenSeed}
                        onChange={(e) => setImageGenSeed(e.target.value)}
                        placeholder="Enter a number for reproducible results"
                        min="0"
                        disabled={selectedImageProvider === 'FREEPIK'}
                      />
                       <p className="text-xs text-muted-foreground">
                         {selectedImageProvider === 'FREEPIK' ? "Seed is ignored for Freepik/Imagen3 integration." : "Seed might not be strictly enforced by all models."}
                       </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="button" onClick={handlePreviewPromptClick} className="w-full">
                        <Eye className="mr-2 h-4 w-4" /> Preview Prompt
                    </Button>
                  </CardFooter>
                </div>
              ) : (
                <form onSubmit={handleImageGenerationSubmit}>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="editablePromptTextarea" className="flex items-center mb-1"><Edit className="w-4 h-4 mr-2 text-primary" />Final Prompt (Editable)</Label>
                      <Textarea
                        id="editablePromptTextarea"
                        value={currentTextPromptForEditing}
                        onChange={(e) => setCurrentTextPromptForEditing(e.target.value)}
                        rows={10}
                        className="font-mono text-sm"
                        placeholder="The constructed prompt will appear here. You can edit it before generation."
                      />
                       <p className="text-xs text-muted-foreground">
                        Note: For Freepik, structural parameters (aspect ratio, Freepik-specific styles/effects) are set separately if chosen. Editing this prompt gives most control to Gemini.
                       </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsPreviewingPrompt(false)} className="w-full sm:w-auto">
                        Back to Edit Fields
                    </Button>
                    <SubmitButton className="w-full sm:flex-1" loadingText={parseInt(formSnapshot?.numberOfImages?.toString() || "1") > 1 ? "Generating Images..." : "Generating Image..."}>
                        Generate {parseInt(formSnapshot?.numberOfImages?.toString() || "1") > 1 ? `${formSnapshot?.numberOfImages} Images` : "Image"} with This Prompt
                    </SubmitButton>
                  </CardFooter>
                </form>
              )}

              {lastSuccessfulGeneratedImageUrls.length > 0 && (
                <Card className="mt-6 mx-4 mb-4 shadow-sm">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                                Generated Image{lastSuccessfulGeneratedImageUrls.length > 1 ? 's' : ''}
                                {lastUsedImageProvider && <span className="text-xs text-muted-foreground ml-2">(via {lastUsedImageProvider})</span>}
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={handleClearGeneratedImages}>
                                <Trash2 className="mr-2 h-4 w-4" /> Clear Image{lastSuccessfulGeneratedImageUrls.length > 1 ? 's' : ''}
                            </Button>
                        </div>
                         {lastSuccessfulGeneratedImageUrls.filter(url => url?.startsWith('data:') || url?.startsWith('image_url:')).length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                                <form> 
                                    <input type="hidden" name="imagesToSaveJson" value={JSON.stringify(selectedGeneratedImageIndices.map(index => ({
                                        dataUri: lastSuccessfulGeneratedImageUrls[index],
                                        prompt: lastUsedImageGenPrompt || "N/A", 
                                        style: (formSnapshot?.imageStyle || selectedImageStylePreset + (customStyleNotesInput ? ". " + customStyleNotesInput : "")),
                                    })))} />
                                    <input type="hidden" name="brandProfileDocId" value="defaultBrandProfile" />
                                    <SubmitButton 
                                        onClick={handleSaveSelectedGeneratedImages} 
                                        formAction={saveImagesAction}
                                        disabled={selectedGeneratedImageIndices.length === 0 || !!(saveImagesState.message?.startsWith('Saving...')) || lastSuccessfulGeneratedImageUrls.every(url => url.startsWith('task_id:')) } 
                                        size="sm"
                                        loadingText="Saving..."
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Selected to Library ({selectedGeneratedImageIndices.length})
                                    </SubmitButton>
                                </form>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                      <div className={`grid gap-4 ${lastSuccessfulGeneratedImageUrls.length > 1 ? (lastSuccessfulGeneratedImageUrls.length > 2 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2') : 'grid-cols-1'}`}>
                        {lastSuccessfulGeneratedImageUrls.map((url, index) => (
                            <div key={url || index} className="relative group w-full overflow-hidden border rounded-md bg-muted aspect-square">
                                {url && (url.startsWith('data:') || url.startsWith('image_url:')) ? (
                                    <>
                                    <NextImage 
                                        src={url.startsWith('image_url:') ? url.substring(10) : url} 
                                        alt={`Generated brand image ${index + 1}`} 
                                        fill 
                                        style={{objectFit: 'contain'}} 
                                        data-ai-hint="brand marketing"
                                        className="transition-opacity duration-300 opacity-100 group-hover:opacity-80"
                                    />
                                    <Checkbox
                                        id={`select-gen-img-${index}`}
                                        checked={selectedGeneratedImageIndices.includes(index)}
                                        onCheckedChange={() => handleToggleGeneratedImageSelection(index)}
                                        className="absolute top-2 left-2 z-10 bg-background/80 data-[state=checked]:bg-primary"
                                        aria-label={`Select image ${index + 1}`}
                                    />
                                    </>
                                ) : url && url.startsWith('task_id:') ? (
                                     <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground p-2 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                        Freepik image task started. <br/> Task ID: {url.substring(8)}
                                        <form className="mt-2">
                                          <input type="hidden" name="taskId" value={url.substring(8)} />
                                          <SubmitButton
                                            size="sm"
                                            variant="outline"
                                            loadingText="Checking..."
                                            formAction={(formData) => {
                                                setCheckingTaskId(url.substring(8));
                                                startTransition(() => freepikTaskStatusAction(formData));
                                            }}
                                            disabled={checkingTaskId === url.substring(8)}
                                          >
                                            {checkingTaskId === url.substring(8) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                                            Check Status
                                          </SubmitButton>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Image not available</div>
                                )}
                            </div>
                        ))}
                      </div>
                      {lastUsedImageGenPrompt && (
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                                <Label htmlFor="usedImagePromptDisplay" className="flex items-center text-sm font-medium"><FileText className="w-4 h-4 mr-2 text-primary" />Prompt Used:</Label>
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(lastUsedImageGenPrompt, "Prompt")} className="text-muted-foreground hover:text-primary">
                                    <Copy className="w-3 h-3 mr-1" /> Copy Prompt
                                </Button>
                            </div>
                            <Textarea
                                id="usedImagePromptDisplay"
                                value={lastUsedImageGenPrompt}
                                onChange={(e) => setLastUsedImageGenPrompt(e.target.value)}
                                rows={Math.min(10, (lastUsedImageGenPrompt?.match(/\n/g) || []).length + 2)}
                                className="text-xs bg-muted/50 font-mono"
                                placeholder="The prompt used for generation will appear here. You can edit it for your reference or to copy elsewhere."
                            />
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={handleUseGeneratedImageForSocial} 
                        disabled={!lastSuccessfulGeneratedImageUrls.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))}
                      >
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
                <p className="text-sm text-muted-foreground">Generate engaging captions and hashtags. Uses brand description, industry, image description (optional), and selected tone.</p>
              </CardHeader>
              <form action={socialAction}>
                <input type="hidden" name="industry" value={brandData?.industry || ""} />
                <input type="hidden" name="selectedImageSrcForSocialPost" value={useImageForSocialPost && currentSocialImagePreviewUrl ? (currentSocialImagePreviewUrl.startsWith('image_url:') ? currentSocialImagePreviewUrl.substring(10) : currentSocialImagePreviewUrl) : ""} />
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="useImageForSocialPost" 
                            checked={useImageForSocialPost}
                            onCheckedChange={(checked) => {
                                const isChecked = checked as boolean;
                                setUseImageForSocialPost(isChecked);
                                if (!isChecked) {
                                    setSocialImageChoice(null); 
                                } else if (!socialImageChoice && lastSuccessfulGeneratedImageUrls.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))) {
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
                                <RadioGroupItem value="generated" id="social-generated" disabled={!lastSuccessfulGeneratedImageUrls.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))}/>
                                <Label htmlFor="social-generated" className={(!lastSuccessfulGeneratedImageUrls.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))) ? "text-muted-foreground" : ""}>
                                    Use Last Generated Image {(!lastSuccessfulGeneratedImageUrls.some(url => url?.startsWith('data:') || url?.startsWith('image_url:'))) ? "(None available/suitable)" : `(First of ${lastSuccessfulGeneratedImageUrls.filter(url => url?.startsWith('data:') || url?.startsWith('image_url:')).length} available will be used)`}
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
                             <div className="mt-2 space-y-2">
                                 {brandData.exampleImages.length > 1 ? (
                                    <>
                                    <p className="text-xs text-muted-foreground mb-1">Select Profile Image for Social Post:</p>
                                    <div className="flex space-x-2 overflow-x-auto pb-2">
                                        {brandData.exampleImages.map((imgSrc, index) => (
                                            <button
                                                type="button"
                                                key={`social-profile-${index}`}
                                                onClick={() => setSelectedProfileImageIndexForSocial(index)}
                                                className={cn(
                                                    "w-16 h-16 rounded border-2 p-0.5 flex-shrink-0 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring",
                                                    selectedProfileImageIndexForSocial === index ? "border-primary ring-2 ring-primary" : "border-border"
                                                )}
                                            >
                                                <NextImage src={imgSrc} alt={`Profile Example ${index + 1}`} width={60} height={60} className="object-contain w-full h-full rounded-sm" data-ai-hint="social media reference"/>
                                            </button>
                                        ))}
                                    </div>
                                    </>
                                 ) : (
                                    <div className="w-16 h-16 rounded border-2 p-0.5 border-primary ring-2 ring-primary flex-shrink-0">
                                         <NextImage src={brandData.exampleImages[0]} alt={`Profile Example 1`} width={60} height={60} className="object-contain w-full h-full rounded-sm" data-ai-hint="social media reference"/>
                                     </div>
                                 )}
                                {selectedProfileImageIndexForSocial !== null && brandData.exampleImages[selectedProfileImageIndexForSocial] && (
                                  <p className="text-xs text-muted-foreground">Using image {brandData.exampleImages.length > 1 ? selectedProfileImageIndexForSocial + 1 : '1'} from profile.</p>
                                )}
                             </div>
                        )}
                      </div>
                    )}

                    {currentSocialImagePreviewUrl && useImageForSocialPost && (
                        <div className="pl-6 mt-2 mb-3">
                            <p className="text-xs text-muted-foreground">Selected image for post:</p>
                            <NextImage 
                              src={currentSocialImagePreviewUrl.startsWith('image_url:') ? currentSocialImagePreviewUrl.substring(10) : currentSocialImagePreviewUrl} 
                              alt="Selected image for social post" 
                              width={100} height={100} 
                              className="rounded border object-contain" 
                              data-ai-hint="social media content"
                            />
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
                      placeholder={useImageForSocialPost && !!currentSocialImagePreviewUrl ? "Describe the image you're posting or use AI. Required if image used." : "Optionally describe the theme if not using an image."}
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
                   <div>
                    <Label htmlFor="customSocialToneNuances" className="flex items-center mb-1"><Edit className="w-4 h-4 mr-2 text-primary" />Custom Tone Nuances (Optional)</Label>
                    <Input
                      id="customSocialToneNuances"
                      name="customSocialToneNuances"
                      value={customSocialToneNuances}
                      onChange={(e) => setCustomSocialToneNuances(e.target.value)}
                      placeholder="e.g., 'but slightly urgent', 'with a touch of humor'"
                    />
                    <p className="text-xs text-muted-foreground">This will be appended to the selected tone.</p>
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
                                    <NextImage 
                                      src={generatedSocialPost.imageSrc.startsWith('image_url:') ? generatedSocialPost.imageSrc.substring(10) : generatedSocialPost.imageSrc} 
                                      alt="Social post image" 
                                      fill 
                                      style={{objectFit: 'cover'}} data-ai-hint="social content" />
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
                <p className="text-sm text-muted-foreground">Generate SEO-friendly blog posts. Define an outline, choose a tone, and let AI write the content. Uses brand description and industry.</p>
              </CardHeader>
              <form action={blogAction} className="w-full">
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="blogBrandName" className="flex items-center mb-1"><Type className="w-4 h-4 mr-2 text-primary" />Brand Name</Label>
                    <Input
                      id="blogBrandName"
                      name="brandName" 
                      defaultValue={brandData?.brandName || ""}
                      placeholder="Your brand's name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blogBrandDescription" className="flex items-center mb-1"><FileText className="w-4 h-4 mr-2 text-primary" />Brand Description</Label>
                    <Textarea
                      id="blogBrandDescription"
                      name="blogBrandDescription" 
                      defaultValue={brandData?.brandDescription || ""}
                      placeholder="Detailed brand description"
                      rows={3}
                    />
                  </div>
                   <div>
                        <Label htmlFor="blogIndustry" className="flex items-center mb-1"><Briefcase className="w-4 h-4 mr-2 text-primary" />Industry</Label>
                        <Input
                            id="blogIndustry"
                            name="industry" 
                            defaultValue={brandData?.industry || ""}
                            placeholder="e.g., Fashion, Technology"
                        />
                    </div>
                  <div>
                    <Label htmlFor="blogKeywords" className="flex items-center mb-1"><Tag className="w-4 h-4 mr-2 text-primary" />Keywords</Label>
                    <Input
                      id="blogKeywords"
                      name="blogKeywords" 
                      defaultValue={brandData?.targetKeywords || ""}
                      placeholder="Comma-separated keywords (e.g., AI, marketing, branding)"
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
                    <Select name="blogTone" value={selectedBlogTone} onValueChange={setSelectedBlogTone}  id="blogToneSelect">
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
                      value={generatedBlogOutline}
                      onChange={(e) => setGeneratedBlogOutline(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">AI will strictly follow this outline to generate the blog post.</p>
                  </div>

                  <div>
                    <Label htmlFor="blogTargetPlatformSelect" className="flex items-center mb-1"><Newspaper className="w-4 h-4 mr-2 text-primary" />Target Platform</Label>
                    <Select name="targetPlatform" value={blogPlatformValue} onValueChange={(value) => setBlogPlatformValue(value as "Medium" | "Other")} id="blogTargetPlatformSelect">
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

    