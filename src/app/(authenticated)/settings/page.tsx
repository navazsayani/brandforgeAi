
"use client";

import React, { useEffect, useState, useActionState, startTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { handleGetSettingsAction, handleUpdateSettingsAction, handleGetPlansConfigAction, handleUpdatePlansConfigAction, handleInitiateOAuthAction, handleGetConnectedAccountsStatusAction, handleDisconnectAccountAction, handleTestInstagramPermissionsAction, type FormState } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';
import { DEFAULT_MODEL_CONFIG } from '@/lib/model-config';
import { DEFAULT_PLANS_CONFIG } from '@/lib/constants';
import type { ModelConfig, PlansConfig, ConnectedAccountsStatus } from '@/types';
import { Settings, Loader2, ExternalLink, TestTube, ShoppingCart, Power, CreditCard, BarChart, Facebook, Network, CheckCircle, Link2, Unlink, Palette, AlertTriangle, Clock, RefreshCw, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSearchParams } from 'next/navigation';

const modelSettingsSchema = z.object({
  imageGenerationModel: z.string().min(1, "Image generation model name cannot be empty."),
  textToImageModel: z.string().min(1, "Text-to-Image model name cannot be empty."),
  fastModel: z.string().min(1, "Fast text model name cannot be empty."),
  visionModel: z.string().min(1, "Vision model name cannot be empty."),
  powerfulModel: z.string().min(1, "Powerful text model name cannot be empty."),
  paymentMode: z.enum(['live', 'test']).optional(),
  freepikEnabled: z.boolean().optional(),
  socialMediaConnectionsEnabled: z.boolean().optional(),
});

const plansSettingsSchema = z.object({
  usd_pro_price: z.string().min(1, "Price is required"),
  usd_pro_original_price: z.string().optional(),
  inr_pro_price: z.string().min(1, "Price is required"),
  inr_pro_original_price: z.string().optional(),
  free_images_quota: z.coerce.number().min(0, "Quota must be 0 or more"),
  free_social_quota: z.coerce.number().min(0, "Quota must be 0 or more"),
  free_blogs_quota: z.coerce.number().min(0, "Quota must be 0 or more"),
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
const initialOAuthState: FormState<{ redirectUrl: string }> = { error: undefined, data: undefined, message: undefined };
const initialConnectionStatusState: FormState<ConnectedAccountsStatus> = { error: undefined, data: undefined, message: undefined };
const initialDisconnectState: FormState<{ success: boolean }> = { error: undefined, data: undefined, message: undefined };
const initialTestPermissionsState: FormState<{ success: boolean; testResults: any }> = { error: undefined, data: undefined, message: undefined };

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-1.148 13.5h1.22l-6.5-8.875H6.05l6.4 8.875Z" />
    </svg>
);

function SettingsPageContent() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const isAdmin = currentUser?.email === 'admin@brandforge.ai';
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const [oAuthActionState, oAuthAction] = useActionState(handleInitiateOAuthAction, initialOAuthState);

  const [connectionStatusState, connectionStatusAction] = useActionState(handleGetConnectedAccountsStatusAction, initialConnectionStatusState);
  const [disconnectState, disconnectAction] = useActionState(handleDisconnectAccountAction, initialDisconnectState);
  const [testPermissionsState, testPermissionsAction] = useActionState(handleTestInstagramPermissionsAction, initialTestPermissionsState);

  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isTestingPermissions, setIsTestingPermissions] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      setIsLoadingConnections(true);
      const formData = new FormData();
      formData.append('userId', currentUser.uid);
      startTransition(() => {
        connectionStatusAction(formData);
      });
    }
  }, [currentUser?.uid, connectionStatusAction]);

  useEffect(() => {
    if (connectionStatusState.data || connectionStatusState.error) {
      setIsLoadingConnections(false);
    }
    if (connectionStatusState.error) {
        toast({ title: "Error Loading Connections", description: connectionStatusState.error, variant: "destructive"});
    }
  }, [connectionStatusState, toast]);

  // Handle OAuth callback parameters
  useEffect(() => {
    const connectedPlatform = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connectedPlatform) {
      toast({ title: 'Connection Successful', description: `Your account has been connected to ${connectedPlatform}.` });
      if (currentUser?.uid) {
        setIsLoadingConnections(true);
        const formData = new FormData();
        formData.append('userId', currentUser.uid);
        startTransition(() => connectionStatusAction(formData));
      }
    } else if (error) {
      toast({ title: 'Connection Failed', description: error, variant: 'destructive' });
    }
  // This effect should only run once when the page loads with search params.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  
  useEffect(() => {
    if(oAuthActionState.data?.redirectUrl) {
        window.location.href = oAuthActionState.data.redirectUrl;
    }
    if (oAuthActionState.error) {
        toast({ title: "Connection Error", description: oAuthActionState.error, variant: "destructive" });
    }
  }, [oAuthActionState, toast]);

  // Handle disconnect action results
  useEffect(() => {
    if (disconnectState.data?.success) {
      toast({ title: "Account Disconnected", description: disconnectState.message });
      // Refresh connection status
      if (currentUser?.uid) {
        setIsLoadingConnections(true);
        const formData = new FormData();
        formData.append('userId', currentUser.uid);
        startTransition(() => connectionStatusAction(formData));
      }
    }
    if (disconnectState.error) {
      toast({ title: "Disconnect Failed", description: disconnectState.error, variant: "destructive" });
    }
  }, [disconnectState, toast, currentUser, connectionStatusAction]);

  // Handle test permissions results
  useEffect(() => {
    if (testPermissionsState.data?.success) {
      toast({
        title: "Permission Test Completed",
        description: testPermissionsState.message,
        duration: 8000 // Longer duration for important message
      });
      setIsTestingPermissions(false);
    }
    if (testPermissionsState.error) {
      toast({ title: "Permission Test Failed", description: testPermissionsState.error, variant: "destructive" });
      setIsTestingPermissions(false);
    }
  }, [testPermissionsState, toast]);

  const handleConnect = (platform: 'meta' | 'x') => {
    if (!currentUser?.uid) return;
    const formData = new FormData();
    formData.append('platform', platform);
    formData.append('userId', currentUser.uid);
    formData.append('origin', window.location.origin);
    startTransition(() => {
        oAuthAction(formData);
    });
  };

  const handleDisconnect = (platform: 'meta' | 'x') => {
    if (!currentUser?.uid) return;
    const formData = new FormData();
    formData.append('platform', platform);
    formData.append('userId', currentUser.uid);
    startTransition(() => {
      disconnectAction(formData);
    });
  };

  const handleTestPermissions = () => {
    if (!currentUser?.uid) return;
    
    setIsTestingPermissions(true);
    const formData = new FormData();
    formData.append('userId', currentUser.uid);
    
    startTransition(() => testPermissionsAction(formData));
  };

  const [getModelState, getModelAction] = useActionState(handleGetSettingsAction, initialGetModelState);
  const [updateModelState, updateModelAction] = useActionState(handleUpdateSettingsAction, initialUpdateModelState);
  const [getPlansState, getPlansAction] = useActionState(handleGetPlansConfigAction, initialGetPlansState);
  const [updatePlansState, updatePlansAction] = useActionState(handleUpdatePlansConfigAction, initialUpdatePlansState);

  const [isSavingModels, setIsSavingModels] = useState(false);
  const [isSavingPlans, setIsSavingPlans] = useState(false);

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

  useEffect(() => {
    if (isAdmin && currentUser?.email) {
      const formData = new FormData();
      formData.append('adminRequesterEmail', currentUser.email);
      startTransition(() => {
        getModelAction(formData);
        getPlansAction();
      });
    } else {
        setIsPageLoading(false);
    }
  }, [isAdmin, currentUser, getModelAction, getPlansAction]);

  useEffect(() => {
    if (isAdmin) {
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
        if (getModelState.error) {
            toast({ title: "Error Loading Model Settings", description: getModelState.error, variant: "destructive" });
        }
        if (getPlansState.error) {
            toast({ title: "Error Loading Plan Settings", description: getPlansState.error, variant: "destructive" });
        }
    }
  }, [getModelState, getPlansState, isAdmin, modelForm, plansForm, toast]);
  
  useEffect(() => {
    if (updateModelState.message && !updateModelState.error) {
        toast({ title: "Success", description: updateModelState.message });
        if (currentUser?.email) {
            const formData = new FormData();
            formData.append('adminRequesterEmail', currentUser.email);
            startTransition(() => getModelAction(formData));
        }
    }
    if (updateModelState.error) {
        toast({ title: "Model Update Error", description: updateModelState.error, variant: "destructive" });
    }
    if (updateModelState.data || updateModelState.error) {
        setIsSavingModels(false);
    }
  }, [updateModelState, toast, currentUser, getModelAction]);

  useEffect(() => {
    if (updatePlansState.message && !updatePlansState.error) {
        toast({ title: "Success", description: updatePlansState.message });
        if (currentUser?.email) {
            const formData = new FormData();
            formData.append('adminRequesterEmail', currentUser.email);
            startTransition(() => getPlansAction());
        }
    }
    if (updatePlansState.error) {
        toast({ title: "Plans Update Error", description: updatePlansState.error, variant: "destructive" });
    }
    if (updatePlansState.data || updatePlansState.error) {
        setIsSavingPlans(false);
    }
  }, [updatePlansState, toast, currentUser, getPlansAction]);

  const onModelSubmit: SubmitHandler<ModelSettingsFormData> = (data) => {
    if (currentUser?.email) {
      setIsSavingModels(true);
      const formData = new FormData();
      formData.append('adminRequesterEmail', currentUser.email);
      Object.entries(data).forEach(([key, value]) => {
         if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
              formData.append(key, String(value));
            } else {
              formData.append(key, value);
            }
         }
      });
      startTransition(() => updateModelAction(formData));
    }
  };
  
  const onPlansSubmit: SubmitHandler<PlansSettingsFormData> = (data) => {
    if (currentUser?.email) {
      setIsSavingPlans(true);
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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center space-x-3">
          <Settings className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-lg text-muted-foreground">
              Manage connections and application configurations.
            </p>
          </div>
        </div>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl"><Network className="w-6 h-6 text-primary"/>Connected Accounts</CardTitle>
                <CardDescription>Connect your social media accounts to enable direct deployment from the Deployment Hub.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoadingConnections ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="ml-3">Loading connection status...</p>
                    </div>
                ) : (
                <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-secondary/30 gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                        <Facebook className="w-6 h-6 text-[#1877F2] shrink-0 mt-1 sm:mt-0" />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">Meta (Facebook & Instagram)</p>
                                {connectionStatusState.data?.meta && getModelState.data?.socialMediaConnectionsEnabled !== false && (
                                    <>
                                        {connectionStatusState.data.metaHealth === 'healthy' && (
                                            <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Healthy
                                            </Badge>
                                        )}
                                        {connectionStatusState.data.metaHealth === 'expired' && (
                                            <Badge variant="destructive" className="text-red-600 bg-red-50 border-red-200">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Expired
                                            </Badge>
                                        )}
                                        {connectionStatusState.data.metaHealth === 'invalid' && (
                                            <Badge variant="destructive" className="text-red-600 bg-red-50 border-red-200">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Invalid
                                            </Badge>
                                        )}
                                        {connectionStatusState.data.metaHealth === 'unknown' && (
                                            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Unknown
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    {getModelState.data?.socialMediaConnectionsEnabled === false ? (
                                        "Social media connections are currently disabled by admin."
                                    ) : connectionStatusState.data?.meta ? (
                                        connectionStatusState.data.metaHealth === 'healthy' ?
                                            "Account connected and working properly." :
                                        connectionStatusState.data.metaHealth === 'expired' ?
                                            "Token has expired. Please reconnect your account." :
                                        connectionStatusState.data.metaHealth === 'invalid' ?
                                            "Token is invalid. Please reconnect your account." :
                                            "Connection status could not be verified."
                                    ) : "Directly deploy posts to your accounts."}
                                </p>
                                {connectionStatusState.data?.meta && connectionStatusState.data.metaExpiresAt && getModelState.data?.socialMediaConnectionsEnabled !== false && (
                                    <p className="text-xs text-muted-foreground">
                                        Expires: {new Date(connectionStatusState.data.metaExpiresAt).toLocaleDateString()} at {new Date(connectionStatusState.data.metaExpiresAt).toLocaleTimeString()}
                                    </p>
                                )}
                                {connectionStatusState.data?.meta && connectionStatusState.data.metaLastValidated && getModelState.data?.socialMediaConnectionsEnabled !== false && (
                                    <p className="text-xs text-muted-foreground">
                                        Last validated: {new Date(connectionStatusState.data.metaLastValidated).toLocaleDateString()} at {new Date(connectionStatusState.data.metaLastValidated).toLocaleTimeString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {getModelState.data?.socialMediaConnectionsEnabled === false ? (
                            <Button variant="outline" disabled>
                                Coming Soon
                            </Button>
                        ) : connectionStatusState.data?.meta ? (
                            <>
                                {(connectionStatusState.data.metaHealth === 'expired' || connectionStatusState.data.metaHealth === 'invalid') ? (
                                    <Button variant="outline" onClick={() => handleConnect('meta')} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Reconnect
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Button variant="secondary" disabled>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Connected
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDisconnect('meta')}
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <Unlink className="w-3 h-3 mr-1" />
                                            Disconnect
                                        </Button>
                                    </div>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (currentUser?.uid) {
                                            setIsLoadingConnections(true);
                                            const formData = new FormData();
                                            formData.append('userId', currentUser.uid);
                                            startTransition(() => connectionStatusAction(formData));
                                        }
                                    }}
                                    className="text-xs"
                                >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Check Status
                                </Button>
                                {isAdmin && connectionStatusState.data?.metaHealth === 'healthy' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleTestPermissions}
                                        disabled={isTestingPermissions}
                                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        {isTestingPermissions ? (
                                            <>
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <TestTube className="w-3 h-3 mr-1" />
                                                Test Permissions
                                            </>
                                        )}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => handleConnect('meta')}>
                                <Link2 className="w-4 h-4 mr-2" />
                                Connect
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-secondary/30 gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                        <XIcon className="w-5 h-5 shrink-0 mt-1 sm:mt-0" />
                        <div className="space-y-1">
                            <p className="font-semibold">X (Twitter)</p>
                             <p className="text-sm text-muted-foreground">
                                {getModelState.data?.socialMediaConnectionsEnabled === false ?
                                    "Social media connections are currently disabled by admin." :
                                    connectionStatusState.data?.x ? "Account connected." : "Deployment to X is coming soon."
                                }
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" disabled>
                        Coming Soon
                    </Button>
                </div>
                </>
                )}
                
                {/* Instagram Permissions Information - Admin Only */}
                {isAdmin && connectionStatusState.data?.meta && connectionStatusState.data.metaHealth === 'healthy' && (
                    <Alert className="bg-blue-50 border-blue-200">
                        <TestTube className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Admin: Instagram App Permission Setup</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            If users are seeing "Instagram account not found" during deployment, the Meta app needs permission activation at the app level.
                            Click "Test Permissions" above to make the required API calls that will activate the instagram_content_publish permission request button in your Meta Developer Console.
                            <br /><br />
                            <strong>This is a one-time app-level setup:</strong> Visit your <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline font-medium">Meta Developer Console</a>,
                            go to App Review → Permissions and Features, and request advanced access for "instagram_content_publish". Once approved, all users will be able to access their Instagram Business accounts.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    This will redirect you to the platform to authorize BrandForge AI. We only request permissions needed for deployment.
                </p>
            </CardFooter>
        </Card>

        <ThemeToggle />

        {isAdmin && (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl">Admin Configuration</CardTitle>
                    <CardDescription>
                        Manage AI models, payment gateways, and plan configurations.
                    </CardDescription>
                </CardHeader>
                 <Form {...modelForm}>
                    <form onSubmit={modelForm.handleSubmit(onModelSubmit)}>
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
                            <FormField
                            control={modelForm.control}
                            name="socialMediaConnectionsEnabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                <div className="space-y-0.5"><FormLabel>Enable Social Media Connections</FormLabel><FormDescription>Allow users to connect and use social media accounts. When disabled, shows "Coming Soon" for all platforms.</FormDescription></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                            />
                        </div>

                        <Alert>
                            <AlertTitle>Important: AI Model Configuration</AlertTitle>
                            <AlertDescription>
                            Changing these values will directly affect the AI&apos;s performance. Ensure model names are valid and compatible.
                            <a href="https://ai.google.dev/models/gemini" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center font-medium text-primary underline-offset-4 hover:underline">
                                View available Google AI models
                                <ExternalLink className="ml-1.5 h-4 w-4" />
                            </a>
                            </AlertDescription>
                        </Alert>
                        
                        <FormField control={modelForm.control} name="textToImageModel" render={({ field }) => (<FormItem><FormLabel>Text-to-Image Generation Model</FormLabel><FormControl><Input placeholder="e.g., googleai/gemini-2.0-flash-preview-image-generation or imagen-3.0-generate-001" {...field} /></FormControl><FormDescription>Model for text-only image generation (no example image). Use <strong>googleai/</strong> prefix for Gemini models, but <strong>NO prefix</strong> for Imagen models (e.g., "imagen-3.0-generate-001"). For latest Imagen model names: <a href="https://ai.google.dev/gemini-api/docs/imagen" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline inline-flex items-center">View Imagen models <ExternalLink className="ml-1 h-3 w-3" /></a></FormDescription><FormMessage /></FormItem>)} />
                        <FormField control={modelForm.control} name="imageGenerationModel" render={({ field }) => (<FormItem><FormLabel>Multimodal Image Generation Model</FormLabel><FormControl><Input placeholder="e.g., googleai/gemini-1.5-flash-latest" {...field} /></FormControl><FormDescription>Model for creating images when an example image is provided (must support image+text input).</FormDescription><FormMessage /></FormItem>)} />
                        <FormField control={modelForm.control} name="visionModel" render={({ field }) => (<FormItem><FormLabel>Vision Model</FormLabel><FormControl><Input placeholder="e.g., googleai/gemini-1.5-flash-latest" {...field} /></FormControl><FormDescription>Model for analyzing and describing images.</FormDescription><FormMessage /></FormItem>)} />
                        <FormField control={modelForm.control} name="fastModel" render={({ field }) => (<FormItem><FormLabel>Fast Text Model</FormLabel><FormControl><Input placeholder="e.g., googleai/gemini-1.5-flash-latest" {...field} /></FormControl><FormDescription>For quick tasks like social captions and blog outlines.</FormDescription><FormMessage /></FormItem>)} />
                        <FormField control={modelForm.control} name="powerfulModel" render={({ field }) => (<FormItem><FormLabel>Powerful Text Model</FormLabel><FormControl><Input placeholder="e.g., googleai/gemini-1.5-pro-latest" {...field} /></FormControl><FormDescription>For complex tasks like full blog generation and ad campaigns.</FormDescription><FormMessage /></FormItem>)} />
                        </CardContent>
                        <CardFooter><SubmitButton className="w-full" size="sm" loading={isSavingModels} loadingText="Saving Model Settings...">Save Model & Gateway Config</SubmitButton></CardFooter>
                    </form>
                </Form>
                
                <div className="px-6"><hr/></div>
                
                <Form {...plansForm}>
                <form onSubmit={plansForm.handleSubmit(onPlansSubmit)}>
                    <CardContent className="space-y-8 pt-6">
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
                    <CardFooter><SubmitButton className="w-full" size="sm" loading={isSavingPlans} loadingText="Saving Plan Settings...">Save Plan & Quota Config</SubmitButton></CardFooter>
                </form>
                </Form>
            </Card>
        )}
    </div>
  );
}

// Wrap the main content in a Suspense boundary to handle search params
export default function SettingsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <SettingsPageContent />
        </React.Suspense>
    );
}
