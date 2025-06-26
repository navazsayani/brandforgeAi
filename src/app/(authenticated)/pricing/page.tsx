
"use client";

import React, { useState, useEffect, useActionState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Star, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { plans, type Plan } from '@/lib/pricing';
import type { FormState } from '@/lib/actions';
import { handleCreateSubscriptionAction } from '@/lib/actions';

declare global {
    interface Window {
      Razorpay: any;
    }
}

const initialSubscriptionState: FormState<{ orderId: string; amount: number; currency: string } | null> = { data: null, error: undefined, message: undefined };

export default function PricingPage() {
    const { currentUser } = useAuth();
    const { brandData, isLoading: isBrandLoading } = useBrand();
    const router = useRouter();
    const { toast } = useToast();
    const [geo, setGeo] = useState<{ country: string | null }>({ country: null });
    const [isLoadingGeo, setIsLoadingGeo] = useState(true);

    const [subscriptionState, createSubscriptionAction] = useActionState(handleCreateSubscriptionAction, initialSubscriptionState);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch user's country from a client-side API
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                setGeo({ country: data.country_code });
                setIsLoadingGeo(false);
            })
            .catch(() => {
                setGeo({ country: 'US' }); // Default to US on failure
                setIsLoadingGeo(false);
            });
    }, []);

    const currency = geo.country === 'IN' ? 'INR' : 'USD';
    const displayedPlans = plans[currency];
    const currentPlanId = brandData?.plan === 'premium' ? `pro_${currency.toLowerCase()}` : 'free';
    
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

        if (currency !== 'INR') {
            toast({ title: 'Coming Soon', description: 'International payments will be enabled shortly. Thank you for your patience!', variant: 'default' });
            return;
        }
        
        setIsProcessing(true);
        setSelectedPlanId(planId);
        
        const formData = new FormData();
        formData.append('planId', planId);
        formData.append('userId', currentUser.uid);
        formData.append('currency', currency);
        
        createSubscriptionAction(formData);
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

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: subscriptionState.data.amount,
                    currency: subscriptionState.data.currency,
                    name: 'BrandForge AI',
                    description: 'Pro Plan Subscription',
                    order_id: subscriptionState.data.orderId,
                    handler: function (response: any) {
                        toast({ title: 'Payment Successful!', description: 'Your plan has been upgraded.' });
                        // Here you would typically verify the payment signature on your backend
                        // and then update the user's plan in Firestore via a server action.
                        router.refresh();
                    },
                    prefill: {
                        name: currentUser.displayName || '',
                        email: currentUser.email,
                    },
                    theme: {
                        color: '#14706F' // Primary color
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response: any) {
                    toast({ title: 'Payment Failed', description: response.error.description, variant: 'destructive'});
                    setIsProcessing(false);
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
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subscriptionState, currentUser]);

    if (isLoadingGeo || isBrandLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="max-w-5xl mx-auto">
            <header className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Find the Perfect Plan</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Start for free and scale as you grow. Unlock powerful AI features to forge your brand identity.
                </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {displayedPlans.map((plan: Plan) => (
                    <Card
                        key={plan.id}
                        className={cn(
                            "flex flex-col shadow-lg transition-all duration-300",
                            plan.id.startsWith('pro') ? 'border-primary border-2 scale-105 shadow-xl' : 'hover:shadow-xl'
                        )}
                    >
                        <CardHeader className="pb-4">
                            {plan.id.startsWith('pro') && (
                                <div className="flex justify-center -mt-10 mb-4">
                                    <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <CardTitle className="text-3xl text-center font-bold">{plan.name}</CardTitle>
                            <CardDescription className="text-center text-lg">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="text-center my-6">
                                <span className="text-5xl font-bold">{plan.price.amount}</span>
                                <span className="text-muted-foreground text-lg ml-1">{plan.price.unit}</span>
                            </div>
                            <ul className="space-y-4">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        {feature.included ? <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /> : <X className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />}
                                        <span className="text-muted-foreground">{feature.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {plan.id === currentPlanId ? (
                                <Button size="lg" className="w-full" disabled>
                                    <Check className="mr-2 w-5 h-5" />
                                    Current Plan
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    className={cn("w-full", plan.id.startsWith('pro') && 'btn-gradient-primary')}
                                    variant={plan.id.startsWith('pro') ? 'default' : 'outline'}
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={isProcessing || plan.id === 'free'}
                                >
                                    {isProcessing && selectedPlanId === plan.id ? (
                                        <Loader2 className="mr-2 w-5 h-5 animate-spin"/>
                                    ) : plan.id.startsWith('pro') ? (
                                        <Star className="mr-2 w-5 h-5" />
                                    ) : (
                                        <ArrowRight className="mr-2 w-5 h-5" />
                                    )}
                                    {isProcessing && selectedPlanId === plan.id ? 'Processing...' : plan.cta}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
            
            <footer className="text-center mt-12">
                <p className="text-muted-foreground">All prices in {currency}. Need more? Contact us for custom solutions.</p>
            </footer>
        </div>
    );
}
