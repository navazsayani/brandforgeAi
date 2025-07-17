
"use client";

import React, { useState, useEffect, useActionState, useMemo, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Star, X, Loader2, Info, RefreshCcw, TestTube, Copy, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanDetails } from '@/types';
import type { FormState } from '@/lib/actions';
import { handleCreateSubscriptionAction, handleVerifyPaymentAction, getPaymentMode, handleGetPlansConfigAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PublicHeader from '@/components/PublicHeader';

declare global {
    interface Window {
      Razorpay: any;
    }
}

const initialSubscriptionState: FormState<{ orderId: string; amount: number; currency: string } | null> = { data: null, error: undefined, message: undefined };
const initialVerifyState: FormState<{ success: boolean }> = { data: undefined, error: undefined, message: undefined };
const initialPlansState: FormState<any> = { data: null, error: undefined };


export default function PricingPageClient() {
    const { currentUser, isLoading: isAuthLoading } = useAuth();
    const { brandData, isLoading: isBrandLoading, refetchBrandData } = useBrand();
    const router = useRouter();
    const { toast } = useToast();
    const [geo, setGeo] = useState<{ country: string | null }>({ country: null });
    const [isLoadingGeo, setIsLoadingGeo] = useState(true);

    const [subscriptionState, createSubscriptionAction] = useActionState(handleCreateSubscriptionAction, initialSubscriptionState);
    const [verifyState, verifyAction] = useActionState(handleVerifyPaymentAction, initialVerifyState);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [paymentMode, setPaymentMode] = useState<'live' | 'test' | 'loading'>('loading');
    
    const [plansState, getPlansAction] = useActionState(handleGetPlansConfigAction, initialPlansState);
    
    // Admin-specific state for testing
    const isAdmin = currentUser?.email === 'admin@brandforge.ai';
    const [adminGeoOverride, setAdminGeoOverride] = useState<string | null>(null);


    useEffect(() => {
        startTransition(() => {
            getPlansAction();
        });

        fetch('https://www.cloudflare.com/cdn-cgi/trace')
            .then(res => res.text())
            .then(data => {
                const lines = data.split('\n');
                const locLine = lines.find(line => line.startsWith('loc='));
                const country = locLine ? locLine.split('=')[1] : 'US';
                setGeo({ country });
            })
            .catch(() => {
                setGeo({ country: 'US' });
            })
            .finally(() => {
                setIsLoadingGeo(false);
            });
        
        async function fetchMode() {
            const result = await getPaymentMode();
            if (result.error) {
                toast({ title: "Config Error", description: result.error, variant: "destructive" });
                setPaymentMode('live');
            } else {
                setPaymentMode(result.paymentMode);
            }
        }
        fetchMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { planStatus, isPremiumActive, expiryDate, needsRenewal } = useMemo(() => {
        if (!brandData) {
            return { planStatus: 'free', isPremiumActive: false, expiryDate: null, needsRenewal: false };
        }
        const isActive = brandData.plan === 'premium' && brandData.subscriptionEndDate && (brandData.subscriptionEndDate.toDate ? brandData.subscriptionEndDate.toDate() : new Date(brandData.subscriptionEndDate)) > new Date();
        const endDate = brandData.subscriptionEndDate ? (brandData.subscriptionEndDate.toDate ? brandData.subscriptionEndDate.toDate() : new Date(brandData.subscriptionEndDate)) : null;

        return {
            planStatus: brandData.plan || 'free',
            isPremiumActive: isActive,
            expiryDate: endDate,
            needsRenewal: brandData.plan === 'premium' && !isActive
        };
    }, [brandData]);

    const detectedCountry = adminGeoOverride || geo.country;
    const currency = detectedCountry === 'IN' ? 'INR' : 'USD';
    
    const displayedPlans = (plansState.data && !isLoadingGeo) ? (plansState.data[currency] || plansState.data['USD']) : null;


    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubscribe = (planId: string) => {
        if (!currentUser) {
            toast({ title: 'Not Authenticated', description: 'Please log in to subscribe.', variant: 'destructive'});
            router.push('/login');
            return;
        }
        
        setIsProcessing(true);
        setSelectedPlanId(planId);
        
        const formData = new FormData();
        formData.append('planId', planId);
        formData.append('userId', currentUser.uid);
        formData.append('currency', currency);
        
        startTransition(() => {
            createSubscriptionAction(formData);
        });
    };

    useEffect(() => {
        const processPayment = async () => {
            if (subscriptionState?.data && currentUser?.email) {
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) {
                    toast({ title: 'Payment Error', description: 'Could not load payment gateway. Please try again.', variant: 'destructive' });
                    setIsProcessing(false);
                    return;
                }
                
                const keyIdToUse = paymentMode === 'test' 
                    ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID_TEST 
                    : process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
                
                if (!keyIdToUse) {
                    toast({ title: 'Configuration Error', description: 'Payment gateway key is not set up for the current mode.', variant: 'destructive' });
                    setIsProcessing(false);
                    return;
                }

                const options = {
                    key: keyIdToUse,
                    amount: subscriptionState.data.amount,
                    currency: subscriptionState.data.currency,
                    name: 'BrandForge AI',
                    description: 'Pro Plan Subscription',
                    order_id: subscriptionState.data.orderId,
                    handler: function (response: any) {
                        const formData = new FormData();
                        formData.append('razorpay_payment_id', response.razorpay_payment_id);
                        formData.append('razorpay_order_id', response.razorpay_order_id);
                        formData.append('razorpay_signature', response.razorpay_signature);
                        formData.append('userId', currentUser.uid);
                        startTransition(() => {
                            verifyAction(formData);
                        });
                    },
                    prefill: {
                        name: currentUser.displayName || '',
                        email: currentUser.email,
                    },
                    theme: {
                        color: '#14706F'
                    },
                    modal: {
                        ondismiss: function() {
                            setIsProcessing(false);
                            setSelectedPlanId(null);
                            toast({ title: 'Payment Cancelled', description: 'The subscription process was cancelled.', variant: 'default'});
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response: any) {
                    toast({ title: 'Payment Failed', description: response.error.description, variant: 'destructive'});
                    setIsProcessing(false);
                    setSelectedPlanId(null);
                });
                
                rzp.open();
            }
        };

        if (subscriptionState?.data) {
            processPayment();
        }

        if (subscriptionState?.error) {
            toast({ title: 'Subscription Error', description: subscriptionState.error, variant: 'destructive'});
            setIsProcessing(false);
            setSelectedPlanId(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subscriptionState, currentUser, paymentMode]);

    useEffect(() => {
        const handleSuccess = async () => {
            toast({ title: 'Payment Verified!', description: 'Your plan has been upgraded to Premium.' });
            await refetchBrandData();
            router.push('/dashboard');
        };

        if (verifyState.data?.success) {
            handleSuccess();
        } else if (verifyState.error) {
            toast({ title: 'Payment Verification Failed', description: verifyState.error, variant: 'destructive'});
            setIsProcessing(false);
            setSelectedPlanId(null);
        } else if (verifyState.data) {
            setIsProcessing(false);
            setSelectedPlanId(null);
        }
    }, [verifyState, router, toast, refetchBrandData]);

    const handleCopyTestCardNumber = () => {
        const testCardNumber = '5267 3181 8797 5449';
        navigator.clipboard.writeText(testCardNumber.replace(/\s/g, ''));
        toast({ title: "Copied!", description: "Test card number copied to clipboard." });
    };
    
    const renderPlanFeatures = (plan: PlanDetails) => {
        const quotaFeatures = [
            { name: `${plan.quotas.imageGenerations} Image Generations / mo`, included: plan.quotas.imageGenerations > 0 },
            { name: `${plan.quotas.socialPosts} Social Posts / mo`, included: plan.quotas.socialPosts > 0 },
            { name: `${plan.quotas.blogPosts} Blog Posts / mo`, included: plan.quotas.blogPosts > 0 }
        ];

        return [...quotaFeatures, ...plan.features].map((feature, idx) => (
             <li key={idx} className="flex items-start">
                {feature.included ? <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /> : <X className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />}
                <span className="text-muted-foreground">{feature.name}</span>
            </li>
        ));
    };

    const plansLoadingSkeleton = (
        <div className="max-w-5xl mx-auto">
             <header className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Find the Perfect Plan</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Start for free and scale as you grow. Unlock powerful AI features to forge your brand identity.
                </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                <Card className="flex flex-col shadow-lg transition-all duration-300"><CardHeader className="pb-4"><Skeleton className="h-8 w-2/4 mx-auto" /><Skeleton className="h-5 w-3/4 mx-auto mt-2" /></CardHeader><CardContent className="flex-grow"><div className="text-center my-6"><Skeleton className="h-12 w-1/2 mx-auto" /></div><div className="space-y-4"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div></CardContent><CardFooter><Skeleton className="h-12 w-full" /></CardFooter></Card>
                <Card className="flex flex-col shadow-lg transition-all duration-300 border-primary border-2 scale-105"><CardHeader className="pb-4"><Skeleton className="h-8 w-2/4 mx-auto" /><Skeleton className="h-5 w-3/4 mx-auto mt-2" /></CardHeader><CardContent className="flex-grow"><div className="text-center my-6"><Skeleton className="h-12 w-1/2 mx-auto" /></div><div className="space-y-4"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div></CardContent><CardFooter><Skeleton className="h-12 w-full" /></CardFooter></Card>
            </div>
        </div>
    );
    
    if (isLoadingGeo || isAuthLoading || isBrandLoading || paymentMode === 'loading' || !plansState.data) {
        return (
            <div className="bg-background text-foreground">
                {!isAuthLoading && !currentUser && <PublicHeader />}
                <main className={cn("pb-12 section-spacing", !currentUser && "pt-24")}>
                    <div className="container-responsive">
                        {plansLoadingSkeleton}
                    </div>
                </main>
            </div>
        );
    }
    
    const plansToRender = displayedPlans ? Object.values(displayedPlans) as PlanDetails[] : [];

    return (
        <div className="bg-background text-foreground">
            {!currentUser && <PublicHeader />}
             <main className={cn("pb-12 section-spacing", !currentUser && "pt-24")}>
                <div className="container-responsive max-w-5xl mx-auto">
                    <header className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Find the Perfect Plan</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Start for free and scale as you grow. Unlock powerful AI features to forge your brand identity.
                        </p>
                    </header>
                    
                    {isAdmin && (
                        <Card className="mb-8 bg-secondary/30 shadow-md border-primary/20">
                            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary"/>Admin: Geolocation Tester</CardTitle><CardDescription>Override your detected location to test the pricing display for different regions.</CardDescription></CardHeader>
                            <CardContent>
                                <RadioGroup value={adminGeoOverride || 'auto'} onValueChange={(value) => {setAdminGeoOverride(value === 'auto' ? null : value);}} className="space-y-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="auto" id="geo-auto" /><Label htmlFor="geo-auto">Auto-detect my location ({isLoadingGeo ? 'loading...' : geo.country})</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="IN" id="geo-in" /><Label htmlFor="geo-in">Simulate India (IN) - Show INR Pricing</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="US" id="geo-us" /><Label htmlFor="geo-us">Simulate USA (US) - Show USD Pricing</Label></div>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    )}

                    {paymentMode === 'test' && (
                        <Alert className="mb-8 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-md"><TestTube className="h-4 w-4 !text-amber-500" /><AlertTitle className="font-bold text-amber-600 dark:text-amber-400">Developer Test Mode is Active</AlertTitle><AlertDescription><p>This is a test environment, and **no real money will be charged**.</p><p className="mt-2">Use the following details for testing:</p><ul className="list-disc pl-5 mt-1 text-xs space-y-1"><li><div className="flex items-center gap-2"><strong>Card Number:</strong> <span>5267 3181 8797 5449</span><Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-current hover:bg-amber-500/20" onClick={handleCopyTestCardNumber}><Copy className="h-3 w-3" /><span className="sr-only">Copy card number</span></Button></div></li><li><strong>Expiry Date:</strong> Any future date</li><li><strong>CVV:</strong> Any random 3 digits</li></ul></AlertDescription></Alert>
                    )}

                    {planStatus === 'premium' && (
                        <Alert className="mb-8 border-primary/50 bg-primary/5 text-primary-foreground shadow-md"><Info className="h-4 w-4 text-primary" /><AlertTitle className="text-primary font-bold">You are on the Pro Plan!</AlertTitle><AlertDescription className="text-primary/90">{isPremiumActive && expiryDate ? `Your premium access is active until ${expiryDate.toLocaleDateString()}.` : 'Welcome to the club!'} {!isPremiumActive && expiryDate && `Your premium access expired on ${expiryDate.toLocaleDateString()}. Renew below to continue using pro features.`}</AlertDescription></Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mt-8">
                        {plansToRender.map((plan) => {
                            const isCurrentActivePlan = plan.id.startsWith('pro') && isPremiumActive;
                            const isExpiredProPlan = plan.id.startsWith('pro') && needsRenewal;
                            const isCurrentUserOnFree = plan.id === 'free' && !isPremiumActive;

                            let ctaButton: React.ReactNode;
                            if (isCurrentUserOnFree) {
                                ctaButton = <Button className="w-full text-base py-3 px-8" disabled={true}><Check className="mr-2 w-5 h-5" />Your Current Plan</Button>;
                            } else if (isCurrentActivePlan) {
                                ctaButton = <Button className="w-full text-base py-3 px-8" disabled><Check className="mr-2 w-5 h-5" />Current Plan</Button>;
                            } else if (isExpiredProPlan) {
                                ctaButton = <Button className={cn("w-full text-base py-3 px-8", "btn-gradient-secondary")} onClick={() => handleSubscribe(plan.id)} disabled={isProcessing}>{isProcessing && selectedPlanId === plan.id ? <Loader2 className="mr-2 w-5 h-5 animate-spin"/> : <RefreshCcw className="mr-2 w-5 h-5" />}{isProcessing && selectedPlanId === plan.id ? 'Processing...' : 'Renew Subscription'}</Button>;
                            }
                            else {
                                ctaButton = <Button className={cn("w-full text-base py-3 px-8", plan.id.startsWith('pro') && 'btn-gradient-primary')} variant={plan.id.startsWith('pro') ? 'default' : 'outline'} onClick={() => handleSubscribe(plan.id)} disabled={isProcessing || plan.id === 'free'}>{isProcessing && selectedPlanId === plan.id ? <Loader2 className="mr-2 w-5 h-5 animate-spin"/> : plan.id.startsWith('pro') ? <Star className="mr-2 w-5 h-5" /> : <ArrowRight className="mr-2 w-5 h-5" />}{isProcessing && selectedPlanId === plan.id ? 'Processing...' : plan.cta}</Button>;
                            }

                            return (
                                <div key={plan.id} className="relative pt-6">
                                    {plan.id.startsWith('pro') && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-full flex justify-center">
                                            <Badge variant="default" className="text-sm shadow-lg px-4 py-1">Most Popular</Badge>
                                        </div>
                                    )}
                                    <Card className={cn("flex flex-col shadow-lg transition-all duration-300 h-full", plan.id.startsWith('pro') ? 'border-primary border-2 shadow-xl' : 'hover:shadow-xl')}>
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-3xl text-center font-bold">{plan.name}</CardTitle>
                                            {plan.price.originalAmount && <div className="text-center mt-2"><Badge variant="destructive" className="animate-pulse text-base">Introductory Offer</Badge></div>}
                                            <CardDescription className="text-center text-lg">{plan.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <div className="text-center my-6">
                                                {plan.price.originalAmount ? <div className="flex items-baseline justify-center gap-2"><s className="text-3xl font-normal text-muted-foreground">{plan.price.originalAmount}</s><span className="text-5xl font-bold">{plan.price.amount}</span></div> : <span className="text-5xl font-bold">{plan.price.amount}</span>}
                                                <span className="text-muted-foreground text-lg ml-1">{plan.price.unit}</span>
                                            </div>
                                            <ul className="space-y-4">
                                                {renderPlanFeatures(plan)}
                                            </ul>
                                        </CardContent>
                                        <CardFooter className="mt-auto">{ctaButton}</CardFooter>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                    
                    <footer className="text-center mt-12">
                        <p className="text-muted-foreground">All prices in {currency}. Need more? Contact us for custom solutions.</p>
                        <div className="mt-4 text-xs text-muted-foreground"><p>Payments are securely processed by Razorpay. We do not store your card details.</p><p>For questions about billing, please see our{' '}<Link href="/terms-of-service" className="underline hover:text-primary">Terms of Service</Link>.</p></div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
