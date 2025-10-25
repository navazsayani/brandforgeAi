"use client";

import React, { useState, useActionState, startTransition, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Rocket, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { handleGenerateSocialMediaCaptionAction, handleGenerateImagesAction, type FormState } from '@/lib/actions';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import Link from 'next/link';
import NextImage from 'next/image';
import ShowcaseCarousel from '@/components/ShowcaseCarousel';
import { trackQuickStartComplete, trackContentGeneration, trackImageGeneration } from '@/lib/analytics';

const initialSocialState: FormState<{ caption: string; hashtags: string; imageSrc: string | null; docId?: string }> = {
  error: undefined,
  data: undefined,
};

const initialImageFormState: FormState<{ generatedImages: string[]; promptUsed: string; providerUsed: string; ragMetadata?: any }> = {
  error: undefined,
  data: undefined,
  message: undefined
};

export default function QuickStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';
  const { userId, currentUser } = useAuth();
  const { brandData, setBrandData } = useBrand();
  const [businessIdea, setBusinessIdea] = useState('');
  const [industry, setIndustry] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    caption: string;
    hashtags: string;
    image: string | null;
  } | null>(null);

  const hasCheckedRedirect = useRef(false);

  const [socialState, generateSocialAction] = useActionState(handleGenerateSocialMediaCaptionAction, initialSocialState);
  const [imageState, generateImageAction] = useActionState(handleGenerateImagesAction, initialImageFormState);

  // Check redirect only ONCE - users with completed profile shouldn't be here
  useEffect(() => {
    if (!hasCheckedRedirect.current && brandData?.brandDescription) {
      hasCheckedRedirect.current = true;
      router.push('/dashboard');
    }
  }, [brandData?.brandDescription, router]);

  // Handle social media generation completion
  useEffect(() => {
    if (socialState.data && isGenerating) {
      // Store the document ID for later update
      if (socialState.data.docId) {
        setSavedDocId(socialState.data.docId);
      }

      // Social post generated, now generate image
      const imageFormData = new FormData();
      imageFormData.append('userId', userId!);
      imageFormData.append('userEmail', currentUser?.email || '');
      imageFormData.append('brandDescription', businessIdea);
      imageFormData.append('industry', industry || 'General');
      imageFormData.append('imageStyle', 'modern, professional');
      imageFormData.append('prompt', `Professional ${industry || 'business'} brand image for social media, modern and engaging`);
      imageFormData.append('numberOfImages', '1');
      imageFormData.append('aspectRatio', '1:1');

      startTransition(() => {
        generateImageAction(imageFormData);
      });
    }
  }, [socialState.data, isGenerating, userId, currentUser, businessIdea, industry, generateImageAction]);

  // Handle image generation completion
  useEffect(() => {
    if (imageState.data && socialState.data && !generatedContent) {
      const generatedImageUrl = imageState.data.generatedImages?.[0] || null;

      // Set content first - this prevents redirect
      setGeneratedContent({
        caption: socialState.data.caption,
        hashtags: socialState.data.hashtags,
        image: generatedImageUrl,
      });

      // Track Quick Start completion and content generation
      trackQuickStartComplete(industry);
      trackContentGeneration('social_post', imageState.data.providerUsed || 'google');
      trackImageGeneration(1, imageState.data.providerUsed || 'google', '1:1');

      // Update the Firestore document with the generated image
      if (generatedImageUrl && savedDocId && userId) {
        const docPath = `users/${userId}/brandProfiles/${userId}/socialMediaPosts/${savedDocId}`;
        const docRef = doc(db, docPath);
        setDoc(docRef, { imageSrc: generatedImageUrl }, { merge: true })
          .then(() => {
            console.log('[Quick Start] Successfully updated social post with image');
          })
          .catch((error) => {
            console.error('[Quick Start] Failed to update social post with image:', error);
          });

        // Track Quick Start completion in user activity
        const userDocRef = doc(db, `users/${userId}/brandProfiles/${userId}`);
        setDoc(userDocRef, {
          userActivity: {
            hasCompletedQuickStart: true,
            firstGenerationAt: serverTimestamp(),
            lastActiveAt: serverTimestamp(),
            totalGenerations: increment(1),
          },
        }, { merge: true })
          .then(() => {
            console.log('[Quick Start] User activity updated - Quick Start completed');
          })
          .catch((error) => {
            console.error('[Quick Start] Failed to update user activity:', error);
          });
      }

      setIsGenerating(false);
    }
  }, [imageState.data, socialState.data, generatedContent, savedDocId, userId]);

  // No tracking needed - Quick Start is truly independent
  // Users can use it multiple times if they want

  // Handle errors
  useEffect(() => {
    if (socialState.error || imageState.error) {
      setIsGenerating(false);
    }
  }, [socialState.error, imageState.error]);

  const handleQuickGenerate = async () => {
    if (!businessIdea.trim() || !userId || isGenerating) return;

    setIsGenerating(true);

    // Create minimal brand profile ONLY if it doesn't exist
    // This is required by the generation actions but we keep brandDescription empty
    if (!brandData) {
      try {
        await setBrandData({
          brandName: '',
          websiteUrl: '',
          brandDescription: '', // Keep empty - user will fill this in Brand Profile
          industry: industry || 'General',
          imageStyleNotes: '',
          exampleImages: [],
          targetKeywords: '',
          brandLogoUrl: '',
          plan: 'free',
          userEmail: currentUser?.email || '',
          subscriptionEndDate: null,
          welcomeGiftOffered: false,
          hasUsedPreviewMode: false,
        }, userId);
      } catch (error) {
        console.error('Error creating minimal brand profile:', error);
      }
    }

    // Pass businessIdea only to generation, not to brand profile
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('userEmail', currentUser?.email || '');
    formData.append('brandDescription', businessIdea); // Use businessIdea only for this generation
    formData.append('industry', industry || 'General');
    formData.append('platform', 'instagram');
    formData.append('tone', 'professional and engaging');
    formData.append('postGoal', 'Brand Awareness');
    formData.append('selectedImageSrcForSocialPost', '');
    formData.append('socialImageDescription', '');

    startTransition(() => {
      generateSocialAction(formData);
    });
  };

  return (
    <div className="container-responsive py-8 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="w-fit mx-auto p-4 bg-primary/10 rounded-full">
          <Rocket className="h-10 w-10 text-primary" />
        </div>
        {isWelcome ? (
          <>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-balance mb-2">
                Welcome to BrandForge AI! 🎉
              </h1>
              <p className="text-lg text-muted-foreground text-balance">
                Let's create your first AI-generated Instagram post in 30 seconds
              </p>
            </div>
            <Alert className="max-w-2xl mx-auto border-primary/30 bg-primary/5">
              <Sparkles className="h-5 w-5 text-primary" />
              <AlertTitle className="text-base font-semibold">No setup needed!</AlertTitle>
              <AlertDescription>
                Just describe your business below and watch AI create a complete post with image and caption.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-balance">
              Quick Start: Your First Instagram Post
            </h1>
            <p className="text-lg text-muted-foreground text-balance">
              Generate a complete Instagram post with AI in 30 seconds
            </p>
          </>
        )}
      </div>

      {/* Main Card */}
      <div className="max-w-3xl mx-auto">
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="text-2xl">Describe Your Business</CardTitle>
            <CardDescription>
              Tell us about your business and we'll generate a complete Instagram post with image and caption.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!generatedContent ? (
              <>
                {/* Input Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessIdea" className="text-base font-semibold">
                      What's your business about? *
                    </Label>
                    <Textarea
                      id="businessIdea"
                      placeholder="e.g., Organic coffee shop for remote workers, Handmade jewelry for modern women, Digital marketing agency for small businesses..."
                      value={businessIdea}
                      onChange={(e) => setBusinessIdea(e.target.value)}
                      rows={4}
                      className="text-base"
                      disabled={isGenerating}
                    />
                    <p className="text-sm text-muted-foreground">
                      Be specific! Better description = better AI results
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-base font-semibold">
                      Industry (Optional)
                    </Label>
                    <Select value={industry} onValueChange={setIndustry} disabled={isGenerating}>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Fashion & Apparel">Fashion & Apparel</SelectItem>
                        <SelectItem value="Beauty & Cosmetics">Beauty & Cosmetics</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                        <SelectItem value="E-commerce">E-commerce</SelectItem>
                        <SelectItem value="Professional Services">Professional Services</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Loading State */}
                {isGenerating && (
                  <Alert className="border-primary/30 bg-primary/5">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <AlertTitle className="text-base font-bold">
                      Creating your first post...
                    </AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                        <p className="text-sm">
                          {socialState.data ? 'Generating professional image...' : 'Writing engaging caption...'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">This takes 20-40 seconds. Worth the wait!</p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Errors */}
                {(socialState.error || imageState.error) && (
                  <Alert variant="destructive">
                    <AlertTitle>Generation Failed</AlertTitle>
                    <AlertDescription>
                      {socialState.error || imageState.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleQuickGenerate}
                    disabled={!businessIdea.trim() || isGenerating}
                    className="w-full btn-gradient-primary text-base sm:text-lg h-12 whitespace-normal"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span className="hidden sm:inline">Generating...</span>
                        <span className="sm:hidden">Generating</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Generate My First Post</span>
                        <span className="sm:hidden">Generate Post</span>
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">or</p>
                    <Button
                      variant="outline"
                      asChild
                      size="lg"
                      className="w-full text-base sm:text-lg whitespace-normal"
                      disabled={isGenerating}
                    >
                      <Link href="/brand-profile">
                        <span className="hidden sm:inline">Complete Full Brand Setup First</span>
                        <span className="sm:hidden">Complete Setup</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Showcase Carousel - Inspiration below the form */}
                {!isGenerating && (
                  <div className="mt-8 pt-8 border-t">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-muted-foreground flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Need inspiration? See what others created
                      </h3>
                    </div>
                    <ShowcaseCarousel
                      showcaseIds={['daily-grind-coffee', 'zen-flow-yoga', 'bloom-beauty', 'chic-boutique', 'glow-skincare', 'fitlife-performance']}
                      defaultTab="instagram"
                      showTabs={false}
                      autoRotate={false}
                      interval={6000}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Success Result */}
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-full mb-4 animate-bounce">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      🎉 Your First AI-Generated Instagram Post!
                    </h3>
                    <p className="text-muted-foreground">
                      This is just the beginning. Imagine creating hundreds of these!
                    </p>
                  </div>

                  {/* Instagram-Style Preview */}
                  <div className="max-w-md mx-auto">
                    <div className="border border-border rounded-lg overflow-hidden shadow-xl bg-background">
                      {/* Instagram Header */}
                      <div className="p-3 border-b border-border flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent"></div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">Your Brand</p>
                          <p className="text-xs text-muted-foreground">Just now</p>
                        </div>
                      </div>

                      {/* Image */}
                      {generatedContent.image && (
                        <div className="relative aspect-square bg-muted">
                          <NextImage
                            src={generatedContent.image}
                            alt="Generated Instagram post"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Caption */}
                      <div className="p-4 space-y-2">
                        <p className="text-sm leading-relaxed">{generatedContent.caption}</p>
                        <p className="text-sm text-primary font-medium">{generatedContent.hashtags}</p>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <Alert className="border-primary/30 bg-primary/5">
                    <Rocket className="h-5 w-5 text-primary" />
                    <AlertTitle className="text-base font-bold">
                      Want even better results?
                    </AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                      <p>Complete your brand profile to unlock:</p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>🎁 3 FREE welcome gift images</li>
                        <li>🎨 AI that learns your brand voice</li>
                        <li>📸 Professional logo generation</li>
                        <li>🚀 Images, blogs, ad campaigns & more</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Button
                      asChild
                      className="w-full btn-gradient-primary text-base sm:text-lg h-12 whitespace-normal"
                    >
                      <Link href="/brand-profile">
                        <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Complete Brand Profile (2 min)</span>
                        <span className="sm:hidden">Complete Profile</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      size="lg"
                      className="w-full text-base sm:text-lg whitespace-normal"
                    >
                      <Link href="/content-studio">
                        <span className="hidden sm:inline">Skip for Now - Go to Content Studio</span>
                        <span className="sm:hidden">Go to Studio</span>
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        {!generatedContent && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ✨ No credit card required • 🔒 100% free to start • ⚡ Takes 30 seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
