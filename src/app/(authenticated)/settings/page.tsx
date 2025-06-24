
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
import { handleGetSettingsAction, handleUpdateSettingsAction, type FormState } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';
import { DEFAULT_MODEL_CONFIG } from '@/lib/model-config';
import type { ModelConfig } from '@/types';
import { Settings, Loader2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const settingsSchema = z.object({
  imageGenerationModel: z.string().min(1, "Image generation model name cannot be empty."),
  fastModel: z.string().min(1, "Fast text model name cannot be empty."),
  visionModel: z.string().min(1, "Vision model name cannot be empty."),
  powerfulModel: z.string().min(1, "Powerful text model name cannot be empty."),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const initialGetState: FormState<ModelConfig> = { error: undefined, data: undefined, message: undefined };
const initialUpdateState: FormState<ModelConfig> = { error: undefined, data: undefined, message: undefined };

export default function SettingsPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isPageLoading, setIsPageLoading] = useState(true);

  const [getState, getAction] = useActionState(handleGetSettingsAction, initialGetState);
  const [updateState, updateAction] = useActionState(handleUpdateSettingsAction, initialUpdateState);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_MODEL_CONFIG,
  });

  // Security check: redirect if not admin
  useEffect(() => {
    if (!isAuthLoading && currentUser?.email !== 'admin@brandforge.ai') {
      router.replace('/dashboard');
    }
  }, [currentUser, isAuthLoading, router]);

  // Fetch settings on load
  useEffect(() => {
    if (currentUser?.email === 'admin@brandforge.ai') {
      const formData = new FormData();
      formData.append('adminRequesterEmail', currentUser.email);
      startTransition(() => {
        getAction(formData);
      });
    }
  }, [currentUser, getAction]);

  // Handle settings fetch result
  useEffect(() => {
    if (getState.data) {
      form.reset(getState.data);
      setIsPageLoading(false);
    }
    if (getState.error) {
      toast({ title: "Error Loading Settings", description: getState.error, variant: "destructive" });
      form.reset(DEFAULT_MODEL_CONFIG); // Fallback to defaults
      setIsPageLoading(false);
    }
  }, [getState, form, toast]);
  
  // Handle settings update result
  useEffect(() => {
    if (updateState.message && !updateState.error) {
      toast({ title: "Success", description: updateState.message });
    }
    if (updateState.error) {
      toast({ title: "Update Error", description: updateState.error, variant: "destructive" });
    }
  }, [updateState, toast]);

  const onSubmit: SubmitHandler<SettingsFormData> = (data) => {
    if (currentUser?.email) {
      const formData = new FormData();
      formData.append('adminRequesterEmail', currentUser.email);
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      startTransition(() => {
        updateAction(formData);
      });
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

  // Final check in case effect hasn't redirected yet
  if (currentUser?.email !== 'admin@brandforge.ai') {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Settings className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">Admin Model Settings</CardTitle>
              <CardDescription className="text-lg">
                Manage the AI models used across the application.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="space-y-6">
               <Alert>
                  <AlertTitle>Important Note</AlertTitle>
                  <AlertDescription>
                    <p>
                    Changing these values will directly affect the AI's performance and capabilities. Ensure model names are valid and compatible with their intended use (e.g., image models for image generation). Incorrect names will cause AI features to fail.
                    </p>
                    <a href="https://ai.google.dev/models/gemini" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center font-medium text-primary underline-offset-4 hover:underline">
                      View available Google AI models
                      <ExternalLink className="ml-1.5 h-4 w-4" />
                    </a>
                  </AlertDescription>
                </Alert>
              <FormField
                control={form.control}
                name="imageGenerationModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Generation Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., googleai/gemini-2.0-flash-preview-image-generation" {...field} />
                    </FormControl>
                    <FormDescription>Model for creating images.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visionModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vision Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., googleai/gemini-1.5-flash-latest" {...field} />
                    </FormControl>
                    <FormDescription>Model for analyzing and describing images.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fastModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fast Text Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., googleai/gemini-1.5-flash-latest" {...field} />
                    </FormControl>
                    <FormDescription>For quick tasks like social captions and blog outlines.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="powerfulModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Powerful Text Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., googleai/gemini-1.5-pro-latest" {...field} />
                    </FormControl>
                    <FormDescription>For complex tasks like full blog generation and ad campaigns.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <SubmitButton className="w-full" size="lg" loadingText="Saving Settings...">
                Save Model Configuration
              </SubmitButton>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
