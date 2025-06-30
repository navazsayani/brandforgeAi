
"use client";

import React, { useState, useEffect, useActionState, startTransition, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Type, DollarSign, Target, CheckSquare, Copy, Info, Edit3, AlignLeft, MessageSquare, ListChecks, Megaphone, FileText, SparklesIcon, Goal, Users, MousePointerClick, Loader2 } from 'lucide-react';
import { handleGenerateAdCampaignAction, handlePopulateAdCampaignFormAction, type FormState } from '@/lib/actions';
import { SubmitButton } from "@/components/SubmitButton";
import type { GeneratedAdCampaign, GeneratedSocialMediaPost, GeneratedBlogPost } from '@/types';
import type { GenerateAdCampaignOutput } from '@/ai/flows/generate-ad-campaign';
import type { PopulateAdCampaignFormOutput } from '@/ai/flows/populate-ad-campaign-form-flow';
import { adCampaignGoals } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// --- Data Fetching Functions ---
const fetchSocialPostsForInspiration = async (userId: string): Promise<GeneratedSocialMediaPost[]> => {
  if (!userId) return [];
  const path = `users/${userId}/brandProfiles/${userId}/socialMediaPosts`;
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedSocialMediaPost));
};

const fetchBlogPostsForInspiration = async (userId: string): Promise<GeneratedBlogPost[]> => {
  if (!userId) return [];
  const path = `users/${userId}/brandProfiles/${userId}/blogPosts`;
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedBlogPost));
};


const platforms = [
  { id: "google_ads", label: "Google Ads" },
  { id: "meta", label: "Meta (Facebook/Instagram)" },
] as const;

const adCampaignFormSchema = z.object({
  brandName: z.string().min(2, "Brand name is required."),
  brandDescription: z.string().min(10, "Brand description is required."),
  generatedContent: z.string().min(1, "Inspirational content source is required."),
  customGeneratedContent: z.string().optional(),
  targetKeywords: z.string().min(3, "Target keywords are required."),
  budget: z.coerce.number().min(1, "Budget must be at least 1."),
  platforms: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one platform.",
  }),
  // New strategic fields
  campaignGoal: z.string().optional(),
  targetAudience: z.string().optional(),
  callToAction: z.string().optional(),
}).refine((data) => {
    if (data.generatedContent === "Custom content for ad campaign") {
        return !!data.customGeneratedContent && data.customGeneratedContent.trim() !== "";
    }
    return true;
}, {
    message: "Custom content cannot be empty when selected as the source.",
    path: ["customGeneratedContent"],
});

type AdCampaignFormData = z.infer<typeof adCampaignFormSchema>;

const initialGenerationState: FormState<GenerateAdCampaignOutput> = { error: undefined, data: undefined, message: undefined };
const initialPopulationState: FormState<PopulateAdCampaignFormOutput> = { error: undefined, data: undefined, message: undefined };


export default function CampaignManagerPage() {
  const { brandData, addGeneratedAdCampaign } = useBrand();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [generationState, generationAction] = useActionState(handleGenerateAdCampaignAction, initialGenerationState);
  const [populationState, populationAction] = useActionState(handlePopulateAdCampaignFormAction, initialPopulationState);
  
  const [generatedCampaign, setGeneratedCampaign] = useState<GenerateAdCampaignOutput | null>(null);
  const [isPopulating, setIsPopulating] = useState(false);
  const [quickStartRequest, setQuickStartRequest] = useState("");

  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  
  const form = useForm<AdCampaignFormData>({
      resolver: zodResolver(adCampaignFormSchema),
      defaultValues: {
          brandName: brandData?.brandName || "",
          brandDescription: brandData?.brandDescription || "",
          generatedContent: "",
          customGeneratedContent: "",
          targetKeywords: brandData?.targetKeywords || "",
          budget: 500,
          platforms: [],
          campaignGoal: adCampaignGoals[0].value,
          targetAudience: "",
          callToAction: "",
      }
  });

  useEffect(() => {
    setIsLoadingGeo(true);
    fetch('https://www.cloudflare.com/cdn-cgi/trace')
        .then(res => res.text())
        .then(data => {
            const lines = data.split('\n');
            const locLine = lines.find(line => line.startsWith('loc='));
            const country = locLine ? locLine.split('=')[1] : 'US'; // Default to US
            setCurrencySymbol(country === 'IN' ? '₹' : '$');
        })
        .catch(() => {
            setCurrencySymbol('$'); // Fallback to $ on any error
        })
        .finally(() => {
            setIsLoadingGeo(false);
        });
  }, []);

  // --- Start: Fetch persisted content for inspiration dropdown ---
  const { data: socialPosts, isLoading: isLoadingSocial } = useQuery({
    queryKey: ['socialPostsForInspiration', currentUser?.uid],
    queryFn: () => fetchSocialPostsForInspiration(currentUser!.uid),
    enabled: !!currentUser,
  });
  
  const { data: blogPosts, isLoading: isLoadingBlog } = useQuery({
    queryKey: ['blogPostsForInspiration', currentUser?.uid],
    queryFn: () => fetchBlogPostsForInspiration(currentUser!.uid),
    enabled: !!currentUser,
  });
  
  const availableContent = useMemo(() => {
    const socialContent = socialPosts || [];
    const blogContent = blogPosts || [];
    return [
      ...socialContent.map(p => ({ id: `social-${p.id}`, label: `Social: ${p.caption.substring(0, 30)}...`, content: p.caption })),
      ...blogContent.map(p => ({ id: `blog-${p.id}`, label: `Blog: ${p.title}`, content: `${p.title}\n\n${p.content}` })),
    ].filter(item => item.content && item.content.trim() !== "");
  }, [socialPosts, blogPosts]);
  // --- End: Fetch persisted content ---
  
  // Effect to sync brand data from context to form
  useEffect(() => {
      if (brandData) {
          form.setValue("brandName", brandData.brandName || "");
          form.setValue("brandDescription", brandData.brandDescription || "");
          form.setValue("targetKeywords", brandData.targetKeywords || "");
      }
  }, [brandData, form]);

  // Effect to handle generation result
  useEffect(() => {
    if (generationState.data) {
      setGeneratedCampaign(generationState.data);
      const formData = form.getValues();

      const newCampaignData: GeneratedAdCampaign = {
        id: new Date().toISOString(),
        campaignConcept: generationState.data.campaignConcept,
        headlines: generationState.data.headlines,
        bodyTexts: generationState.data.bodyTexts,
        platformGuidance: generationState.data.platformGuidance,
        targetPlatforms: formData.platforms as ('google_ads' | 'meta')[],
        brandName: formData.brandName,
        brandDescription: formData.brandDescription,
        industry: brandData?.industry, 
        inspirationalContent: formData.generatedContent === 'Custom content for ad campaign' 
                               ? formData.customGeneratedContent || ""
                               : formData.generatedContent,
        targetKeywords: formData.targetKeywords,
        budget: formData.budget,
        campaignGoal: formData.campaignGoal,
        targetAudience: formData.targetAudience,
        callToAction: formData.callToAction,
      };
      addGeneratedAdCampaign(newCampaignData);
      toast({ title: "Success", description: generationState.message });
    }
    if (generationState.error) {
        toast({ title: "Error", description: generationState.error, variant: "destructive" });
    }
  }, [generationState, toast, addGeneratedAdCampaign, brandData?.industry, form]);

  // Effect to handle AI population result
  useEffect(() => {
      setIsPopulating(false);
      if (populationState.data) {
          const { data } = populationState;
          if (data.budget) form.setValue("budget", data.budget);
          if (data.platforms) form.setValue("platforms", data.platforms);
          if (data.targetKeywords) form.setValue("targetKeywords", data.targetKeywords);
          if (data.inspirationalContent) {
            form.setValue("generatedContent", "Custom content for ad campaign");
            form.setValue("customGeneratedContent", data.inspirationalContent);
          }
          if (data.campaignGoal) form.setValue("campaignGoal", data.campaignGoal);
          if (data.targetAudience) form.setValue("targetAudience", data.targetAudience);
          if (data.callToAction) form.setValue("callToAction", data.callToAction);
          toast({ title: "Form Populated!", description: populationState.message });
      }
      if (populationState.error) {
          toast({ title: "Population Error", description: populationState.error, variant: "destructive" });
      }
  }, [populationState, toast, form]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${type} Copied!`, description: "Content copied to clipboard." });
  };

  const handleQuickStartSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!quickStartRequest.trim()) {
          toast({ title: "Empty Request", description: "Please describe your ad campaign idea.", variant: "default" });
          return;
      }
      setIsPopulating(true);
      const formData = new FormData(event.currentTarget);
      formData.append("currentBrandDescription", form.getValues("brandDescription"));
      formData.append("currentKeywords", form.getValues("targetKeywords"));
      startTransition(() => {
          populationAction(formData);
      });
  };

  const watchedGeneratedContent = form.watch("generatedContent");

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
              <Briefcase className="w-10 h-10 text-primary" />
              <div>
                  <CardTitle className="text-3xl font-bold">Ad Campaign Manager</CardTitle>
                  <CardDescription className="text-lg">
                  Generate ad creative variations for Google Ads and Meta.
                  </CardDescription>
              </div>
          </div>
        </CardHeader>

        <div className="px-6 mb-6">
            <Card className="bg-secondary/30 border-primary/20 shadow-inner">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <SparklesIcon className="w-6 h-6 text-primary" />
                        AI Quick Start
                    </CardTitle>
                    <CardDescription>
                        Describe your campaign goal, and AI will fill out the form for you.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleQuickStartSubmit} className="space-y-3">
                        <Textarea
                            id="quickStartRequest"
                            name="userRequest"
                            value={quickStartRequest}
                            onChange={(e) => setQuickStartRequest(e.target.value)}
                            placeholder="e.g., 'a sales campaign for our new shoe release targeting young adults on Instagram, with a 'Shop Now' button'"
                            rows={2}
                        />
                        <SubmitButton className="w-full sm:w-auto" loadingText="Populating..." disabled={isPopulating || !quickStartRequest}>
                            Populate Form Fields
                        </SubmitButton>
                    </form>
                </CardContent>
            </Card>
        </div>

        <Form {...form}>
          <form action={(formData) => {
              if (currentUser?.uid) formData.append('userId', currentUser.uid);
              generationAction(formData);
            }}>
            <input type="hidden" name="industry" value={brandData?.industry || ""} />
            <CardContent className="space-y-8">
              <FormField control={form.control} name="brandName" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center mb-2 text-base"><Edit3 className="w-5 h-5 mr-2 text-primary" />Brand Name</FormLabel><FormControl><Input {...field} placeholder="Your brand's name" /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="brandDescription" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center mb-2 text-base"><FileText className="w-5 h-5 mr-2 text-primary" />Brand Description</FormLabel><FormControl><Textarea {...field} placeholder="Detailed brand description, values, and target audience" rows={4} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="campaignGoal" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center mb-2 text-base"><Goal className="w-5 h-5 mr-2 text-primary" />Campaign Goal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select the main goal of the ad" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {adCampaignGoals.map(goal => (<SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>))}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="targetAudience" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center mb-2 text-base"><Users className="w-5 h-5 mr-2 text-primary" />Target Audience (Optional)</FormLabel><FormControl><Input {...field} placeholder="e.g., Tech-savvy early adopters, budget-conscious students" /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="callToAction" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center mb-2 text-base"><MousePointerClick className="w-5 h-5 mr-2 text-primary" />Call to Action (Optional)</FormLabel><FormControl><Input {...field} placeholder="e.g., Shop Now, Learn More, Sign Up" /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="generatedContent" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center mb-2 text-base"><MessageSquare className="w-5 h-5 mr-2 text-primary" />Inspirational Content Source</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger>
                        <SelectValue placeholder={isLoadingSocial || isLoadingBlog ? "Loading content..." : "Select generated content or choose 'Custom'" } />
                    </SelectTrigger></FormControl>
                    <SelectContent>
                      {(isLoadingSocial || isLoadingBlog) && <div className="flex items-center justify-center p-2"><Loader2 className="w-4 h-4 animate-spin" /></div>}
                      {availableContent.length > 0 && availableContent.map(item => (<SelectItem key={item.id} value={item.content}>{item.label}</SelectItem>))}
                      {availableContent.length > 0 && <SelectSeparator />}
                      <SelectItem value="Custom content for ad campaign">Custom (type below)</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              {watchedGeneratedContent === "Custom content for ad campaign" && (
                <FormField control={form.control} name="customGeneratedContent" render={({ field }) => (
                  <FormItem className="-mt-4"><FormControl><Textarea {...field} placeholder="Paste or write your inspirational ad copy/concept here." rows={4} className="mt-3" /></FormControl><FormMessage /></FormItem>
                )}/>
              )}
              <FormField control={form.control} name="targetKeywords" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center mb-2 text-base"><Target className="w-5 h-5 mr-2 text-primary" />Target Keywords</FormLabel><FormControl><Input {...field} placeholder="Comma-separated keywords (e.g., digital marketing, AI tools)" /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="budget" render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center mb-2 text-base">
                        <DollarSign className="w-5 h-5 mr-2 text-primary" />
                        Budget Context ({isLoadingGeo ? <Loader2 className="h-4 w-4 animate-spin" /> : currencySymbol})
                    </FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            {...field} 
                            placeholder={`E.g., ${currencySymbol === '₹' ? '40000' : '500'} (used for AI context)`} 
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="platforms" render={() => (
                <FormItem><FormLabel className="flex items-center mb-3 text-base"><CheckSquare className="w-5 h-5 mr-2 text-primary" />Platforms</FormLabel>
                  {platforms.map((item) => (
                    <FormField key={item.id} control={form.control} name="platforms" render={({ field }) => (
                      <FormItem key={item.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                        <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                          return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                        }} className="h-5 w-5"/></FormControl>
                        <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">{item.label}</FormLabel>
                      </FormItem>
                    )}/>
                  ))}
                  <FormMessage />
                </FormItem>
              )}/>
            </CardContent>
            <CardFooter className="pt-4"> 
              <SubmitButton className="w-full" size="lg" loadingText="Generating Campaign Variations...">Generate Ad Variations</SubmitButton>
            </CardFooter>
          </form>
        </Form>
        {generatedCampaign && (
           <CardContent className="mt-8 space-y-6 border-t pt-6">
            <div>
              <h3 className="mb-2 text-xl font-semibold flex items-center"><Info className="w-5 h-5 mr-2 text-primary"/>Campaign Concept</h3>
                <div className="p-4 prose border rounded-md bg-muted/50 max-w-none text-sm">
                  <p className="whitespace-pre-wrap">{generatedCampaign.campaignConcept}</p>
                </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedCampaign.campaignConcept, "Campaign Concept")} className="mt-2 text-muted-foreground hover:text-primary">
                <Copy className="w-4 h-4 mr-2" /> Copy Concept
              </Button>
            </div>
            <div>
              <h3 className="mb-3 text-xl font-semibold flex items-center"><Megaphone className="w-5 h-5 mr-2 text-primary"/>Headline Variations ({generatedCampaign.headlines.length})</h3>
              <div className="space-y-3">
                {generatedCampaign.headlines.map((headline, index) => (
                  <div key={`headline-${index}`} className="p-3 border rounded-md bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{headline}</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(headline, `Headline ${index+1}`)} className="mt-1 text-xs text-muted-foreground hover:text-primary">
                      <Copy className="w-3 h-3 mr-1" /> Copy Headline
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-xl font-semibold flex items-center"><ListChecks className="w-5 h-5 mr-2 text-primary"/>Body Text Variations ({generatedCampaign.bodyTexts.length})</h3>
              <div className="space-y-3">
                {generatedCampaign.bodyTexts.map((body, index) => (
                  <div key={`body-${index}`} className="p-3 border rounded-md bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{body}</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(body, `Body Text ${index+1}`)} className="mt-1 text-xs text-muted-foreground hover:text-primary">
                      <Copy className="w-3 h-3 mr-1" /> Copy Body Text
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold flex items-center"><Briefcase className="w-5 h-5 mr-2 text-primary"/>Platform Guidance</h3>
                <div className="p-4 prose border rounded-md bg-muted/50 max-w-none max-h-60 overflow-y-auto text-sm">
                  <p className="whitespace-pre-wrap">{generatedCampaign.platformGuidance}</p>
                </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedCampaign.platformGuidance, "Platform Guidance")} className="mt-2 text-muted-foreground hover:text-primary">
                <Copy className="w-4 h-4 mr-2" /> Copy Guidance
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
