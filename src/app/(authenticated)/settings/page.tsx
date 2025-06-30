
"use client";

import React, { useEffect, useState, useActionState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { handleGetSettingsAction, handleUpdateSettingsAction, handleGetPlansConfigAction, handleUpdatePlansConfigAction, type FormState } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';
import { DEFAULT_MODEL_CONFIG } from '@/lib/model-config';
import { DEFAULT_PLANS_CONFIG } from '@/lib/constants';
import type { ModelConfig, PlansConfig } from '@/types';
import { Settings, Loader2, ExternalLink, TestTube, ShoppingCart, Power, CreditCard, BarChart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const modelSettingsSchema = z.object({
  imageGenerationModel: z.string().min(1, "Image generation model name cannot be empty."),
  fastModel: z.string().min(1, "Fast text model name cannot be empty."),
  visionModel: z.string().min(1, "Vision model name cannot be empty."),
  powerfulModel: z.string().min(1, "Powerful text model name cannot be empty."),
  paymentMode: z.enum(['live', 'test']).optional(),
  freepikEnabled: z.boolean().optional(),
});

const plansSettingsSchema = z.object({
  // USD Prices
  usd_pro_price: z.string().min(1, "Price is required"),
  usd_pro_original_price: z.string().optional(),
  // INR Prices
  inr_pro_price: z.string().min(1, "Price is required"),
  inr_pro_original_price: z.string().optional(),
  // Free Quotas
  free_images_quota: z.coerce.number().min(0, "Quota must be 0 or more"),
  free_social_quota: z.coerce.number().min(0, "Quota must be 0 or more"),
  free_blogs_quota: z.coerce.number().min(0, "Quota must be 0 or more"),
  // Pro Quotas
  pro_images_quota: z.coerce.number().min(0, "Quota must be 0 or more"),
  pro_social_quota: z.coerce.number().min(0, "Quota must be 0 or more"),
  pro_blogs_quota: z.coerce.number().min(0, "Quota must be 0 or more"),
});

type ModelSettingsFormData = z.infer<typeof modelSettingsSchema>;
type PlansSettingsFormData = z.infer<typeof plansSettingsSchema>;

const initialGetModelState: FormState<ModelConfig> = { error: undefined, data: undefined, message: undefined };
const initialUpdateModelState: FormState<ModelConfig> = { error: undefined, data: undefined, message: undefined };
const initialGetPlansState: FormState<PlansConfig> = { error: undefined, data: undefined, message: undefined };
const initialUpdatePlansState: FormState<PlansConfig> = { error: undefined, data: undefined, message: undefined };

export default function SettingsPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isPageLoading, setIsPageLoading] = useState(true);

  const [getModelState, getModelAction] = useActionState(handleGetSettingsAction, initialGetModelState);
  const [updateModelState, updateModelAction] = useActionState(handleUpdateSettingsAction, initialUpdateModelState);
  const [getPlansState, getPlansAction] = useActionState(handleGetPlansConfigAction, initialGetPlansState);
  const [updatePlansState, updatePlansAction] = useActionState(handleUpdatePlansConfigAction, initialUpdatePlansState);

  const modelForm = useForm<ModelSettingsFormData>({
    resolver: zodResolver(modelSettingsSchema),
    defaultValues: DEFAULT_MODEL_CONFIG,
  });

  const plansForm = useForm<PlansSettingsFormData>({
    resolver: zodResolver(plansSettingsSchema),
    defaultValues: {
      usd_pro_price: DEFAULT_PLANS_CONFIG.USD.pro.price.amount,
      usd_pro_original_price: DEFAULT_PLANS_CONFIG.USD.pro.price.originalAmount,
      inr_pro_price: DEFAULT_PLANS_CONFIG.INR.pro.price.amount,
      inr_pro_original_price: DEFAULT_PLANS_CONFIG.INR.pro.price.originalAmount,
      free_images_quota: DEFAULT_PLANS_CONFIG.USD.free.quotas.imageGenerations,
      free_social_quota: DEFAULT_PLANS_CONFIG.USD.free.quotas.socialPosts,
      free_blogs_quota: DEFAULT_PLANS_CONFIG.USD.free.quotas.blogPosts,
      pro_images_quota: DEFAULT_PLANS_CONFIG.USD.pro.quotas.imageGenerations,
      pro_social_quota: DEFAULT_PLANS_CONFIG.USD.pro.quotas.socialPosts,
      pro_blogs_quota: DEFAULT_PLANS_CONFIG.USD.pro.quotas.blogPosts,
    },
  });


  // Security check: redirect if not admin
  useEffect(() => {
    if (!isAuthLoading && currentUser?.email !== 'admin@brandforge.ai') {
      router.replace('/dashboard');
    }
  }, [currentUser, isAuthLoading, router]);

  // Fetch all settings on load
  useEffect(() => {
    if (currentUser?.email === 'admin@brandforge.ai') {
      const formData = new FormData();
      formData.append('adminRequesterEmail', currentUser.email);
      startTransition(() => {
        getModelAction(formData);
        getPlansAction();
      });
    }
  }, [currentUser, getModelAction, getPlansAction]);

  // Handle settings fetch result
  useEffect(() => {
    if (getModelState.data) {
      modelForm.reset(getModelState.data);
    }
    if (getPlansState.data) {
        const config = getPlansState.data;
        plansForm.reset({
            usd_pro_price: config.USD.pro.price.amount,
            usd_pro_original_price: config.USD.pro.price.originalAmount,
            inr_pro_price: config.INR.pro.price.amount,
            inr_pro_original_price: config.INR.pro.price.originalAmount,
            free_images_quota: config.USD.free.quotas.imageGenerations,
            free_social_quota: config.USD.free.quotas.socialPosts,
            free_blogs_quota: config.USD.free.quotas.blogPosts,
            pro_images_quota: config.USD.pro.quotas.imageGenerations,
            pro_social_quota: config.USD.pro.quotas.socialPosts,
            pro_blogs_quota: config.USD.pro.quotas.blogPosts,
        });
    }
    if ((getModelState.data || getModelState.error) && (getPlansState.data || getPlansState.error)) {
        setIsPageLoading(false);
    }
    if (getModelState.error) toast({ title: "Error Loading Model Settings", description: getModelState.error, variant: "destructive" });
    if (getPlansState.error) toast({ title: "Error Loading Plan Settings", description: getPlansState.error, variant: "destructive" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getModelState, getPlansState, modelForm, plansForm, toast]);
  
  // Handle settings update result
  useEffect(() => {
    if (updateModelState.message && !updateModelState.error) toast({ title: "Success", description: updateModelState.message });
    if (updateModelState.error) toast({ title: "Model Update Error", description: updateModelState.error, variant: "destructive" });
    if (updatePlansState.message && !updatePlansState.error) toast({ title: "Success", description: updatePlansState.message });
    if (updatePlansState.error) toast({ title: "Plans Update Error", description: updatePlansState.error, variant: "destructive" });
  }, [updateModelState, updatePlansState, toast]);

  const onModelSubmit: SubmitHandler<ModelSettingsFormData> = (data) => {
    if (currentUser?.email) {
      const formData = new FormData();
      formData.append('adminRequesterEmail', currentUser.email);
      Object.entries(data).forEach(([key, value]) => {
         if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') formData.append(key, String(value));
            else formData.append(key, value);
         }
      });
      startTransition(() => updateModelAction(formData));
    }
  };
  
  const onPlansSubmit: SubmitHandler<PlansSettingsFormData> = (data) => {
    if (currentUser?.email) {
      const formData = new FormData();
      formData.append('adminRequesterEmail', currentUser.email);
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      startTransition(() => updatePlansAction(formData));
    }
  };
  
  if (isAuthLoading || isPageLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="ml-4 text-lg">Loading Settings...</p>
      </div>
    );
  }

  if (currentUser?.email !== 'admin@brandforge.ai') return null;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Settings className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">Admin Settings</CardTitle>
              <CardDescription className="text-lg">
                Manage AI models, payment gateways, and plan configurations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Form {...modelForm}>
          <form onSubmit={modelForm.handleSubmit(onModelSubmit)} className="space-y-8">
            <CardContent className="space-y-8">
              <div className="space-y-4 p-4 border rounded-lg bg-secondary/30">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Power className="w-5 h-5 text-primary"/>Feature Flags & Gateways</h3>
                <FormField
                  control={modelForm.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm">Payment Gateway Mode</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value || 'test'} className="flex flex-col space-y-2 pt-2">
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="test" id="mode-test" /></FormControl>
                            <FormLabel htmlFor="mode-test" className="font-normal flex items-center gap-2"><TestTube className="w-4 h-4 text-amber-500"/> Test Mode (Uses Test API Keys)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="live" id="mode-live" /></FormControl>
                            <FormLabel htmlFor="mode-live" className="font-normal flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-green-500"/> Live Mode (Uses Production API Keys)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={modelForm.control}
                  name="freepikEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                      <div className="space-y-0.5"><FormLabel>Enable Freepik API</FormLabel><FormDescription>Allow users to select Freepik as a premium image provider.</FormDescription></div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Alert>
                <AlertTitle>Important: AI Model Configuration</AlertTitle>
                <AlertDescription>
                  Changing these values will directly affect the AI's performance. Ensure model names are valid and compatible.
                  <a href="https://ai.google.dev/models/gemini" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center font-medium text-primary underline-offset-4 hover:underline">
                    View available Google AI models
                    <ExternalLink className="ml-1.5 h-4 w-4" />
                  </a>
                </AlertDescription>
              </Alert>

              <FormField control={modelForm.control} name="imageGenerationModel" render={({ field }) => (<FormItem><FormLabel>Image Generation Model</FormLabel><FormControl><Input placeholder="e.g., googleai/gemini-2.0-flash-preview-image-generation" {...field} /></FormControl><FormDescription>Model for creating images (Gemini).</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={modelForm.control} name="visionModel" render={({ field }) => (<FormItem><FormLabel>Vision Model</FormLabel><FormControl><Input placeholder="e.g., googleai/gemini-1.5-flash-latest" {...field} /></FormControl><FormDescription>Model for analyzing and describing images.</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={modelForm.control} name="fastModel" render={({ field }) => (<FormItem><FormLabel>Fast Text Model</FormLabel><FormControl><Input placeholder="e.g., googleai/gemini-1.5-flash-latest" {...field} /></FormControl><FormDescription>For quick tasks like social captions and blog outlines.</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={modelForm.control} name="powerfulModel" render={({ field }) => (<FormItem><FormLabel>Powerful Text Model</FormLabel><FormControl><Input placeholder="e.g., googleai/gemini-1.5-pro-latest" {...field} /></FormControl><FormDescription>For complex tasks like full blog generation and ad campaigns.</FormDescription><FormMessage /></FormItem>)} />
            </CardContent>
            <CardFooter><SubmitButton className="w-full" size="lg" loadingText="Saving Model Settings...">Save Model & Gateway Configuration</SubmitButton></CardFooter>
          </form>
        </Form>
        
        <div className="p-6"><hr/></div>
        
        <Form {...plansForm}>
          <form onSubmit={plansForm.handleSubmit(onPlansSubmit)} className="space-y-8">
            <CardContent className="space-y-8">
              <div className="space-y-4 p-4 border rounded-lg bg-secondary/30">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary"/>Plan & Quota Management</h3>
                  <p className="text-sm text-muted-foreground">Control pricing and monthly generation quotas for each plan.</p>
                  
                  <Tabs defaultValue="pro-plan">
                      <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="pro-plan">Pro Plan</TabsTrigger>
                          <TabsTrigger value="free-plan">Free Plan</TabsTrigger>
                      </TabsList>
                      <TabsContent value="pro-plan" className="pt-4 space-y-6">
                          <h4 className="font-semibold text-md">Pro Plan Pricing</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField control={plansForm.control} name="usd_pro_price" render={({ field }) => (<FormItem><FormLabel>Price (USD)</FormLabel><FormControl><Input placeholder="$12" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={plansForm.control} name="usd_pro_original_price" render={({ field }) => (<FormItem><FormLabel>Original Price (USD, optional)</FormLabel><FormControl><Input placeholder="$29" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={plansForm.control} name="inr_pro_price" render={({ field }) => (<FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input placeholder="₹399" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={plansForm.control} name="inr_pro_original_price" render={({ field }) => (<FormItem><FormLabel>Original Price (INR, optional)</FormLabel><FormControl><Input placeholder="₹999" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                           <h4 className="font-semibold text-md pt-4 border-t">Pro Plan Monthly Quotas</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField control={plansForm.control} name="pro_images_quota" render={({ field }) => (<FormItem><FormLabel>Image Generations</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={plansForm.control} name="pro_social_quota" render={({ field }) => (<FormItem><FormLabel>Social Posts</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={plansForm.control} name="pro_blogs_quota" render={({ field }) => (<FormItem><FormLabel>Blog Posts</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                      </TabsContent>
                       <TabsContent value="free-plan" className="pt-4 space-y-6">
                           <h4 className="font-semibold text-md">Free Plan Monthly Quotas</h4>
                           <p className="text-xs text-muted-foreground -mt-4">Note: A blog post quota of 0 disables the feature for free users.</p>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField control={plansForm.control} name="free_images_quota" render={({ field }) => (<FormItem><FormLabel>Image Generations</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={plansForm.control} name="free_social_quota" render={({ field }) => (<FormItem><FormLabel>Social Posts</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={plansForm.control} name="free_blogs_quota" render={({ field }) => (<FormItem><FormLabel>Blog Posts</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                      </TabsContent>
                  </Tabs>
              </div>
            </CardContent>
            <CardFooter><SubmitButton className="w-full" size="lg" loadingText="Saving Plan Settings...">Save Plan & Quota Configuration</SubmitButton></CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
