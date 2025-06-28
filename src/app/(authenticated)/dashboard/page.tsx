
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Edit3, TrendingUp, Send, Sparkles, Star, ShieldCheck, Paintbrush, FileText, Image as ImageIconLucide, Eye, AlertCircle, RefreshCcw, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandData, GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getPaymentMode } from '@/lib/actions';

export default function DashboardPage() {
    const { brandData, isLoading: isBrandLoading } = useBrand();
    const { currentUser, isLoading: isAuthLoading } = useAuth();
    const [paymentMode, setPaymentMode] = useState<'live' | 'test' | 'loading'>('loading');
    
    useEffect(() => {
        async function fetchMode() {
            const result = await getPaymentMode();
            if (result.error) {
                console.error("Failed to get payment mode:", result.error);
                setPaymentMode('live'); // Default to live on error for safety
            } else {
                setPaymentMode(result.paymentMode);
            }
        }
        fetchMode();
    }, []);

    const isLoading = isBrandLoading || isAuthLoading || paymentMode === 'loading';

    return (
        <div className="space-y-8 animate-fade-in">
            <GreetingCard isLoading={isLoading} brandData={brandData} paymentMode={paymentMode} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ActionCard
                    href="/brand-profile"
                    icon={<Edit3 className="w-8 h-8 text-primary" />}
                    title="Brand Profile"
                    description="Define your brand's core identity. This fuels all AI generation."
                    isLoading={isLoading}
                />
                <ActionCard
                    href="/content-studio"
                    icon={<Paintbrush className="w-8 h-8 text-primary" />}
                    title="Content Studio"
                    description="Generate images, social posts, and blog articles tailored to your brand."
                    isLoading={isLoading}
                />
                <ActionCard
                    href="/campaign-manager"
                    icon={<Send className="w-8 h-8 text-primary" />}
                    title="Campaign Manager"
                    description="Create and manage ad campaigns for Google and Meta."
                    isLoading={isLoading}
                />
            </div>
            
            <RecentCreations isLoading={isLoading} />
        </div>
    );
}

function GreetingCard({ isLoading, brandData, paymentMode }: { isLoading: boolean; brandData: BrandData | null, paymentMode: 'live' | 'test' | 'loading' }) {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.email === 'admin@brandforge.ai';

    if (isLoading) {
        return (
            <Card className="card-enhanced">
                <CardContent className="flex flex-col md:flex-row items-center gap-6 p-6">
                    <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
                    <div className="w-full space-y-3 text-center md:text-left">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-10 w-48 mt-4" />
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const { plan, subscriptionEndDate } = brandData || {};
    const brandName = brandData?.brandName;
    const isProfileComplete = brandData?.brandDescription && brandData?.brandName;
    const endDate = subscriptionEndDate?.toDate ? subscriptionEndDate.toDate() : (subscriptionEndDate ? new Date(subscriptionEndDate) : null);
    const now = new Date();
    const isPremiumActive = plan === 'premium' && endDate && endDate > now;
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    let planLabel = isPremiumActive ? 'Premium' : 'Free';
    const isFreeUser = !isPremiumActive && !isAdmin;
    
    const primaryAction = isProfileComplete
      ? { href: "/content-studio", label: "Create New Content" }
      : { href: "/brand-profile", label: "Complete Your Brand Profile" };

    return (
        <Card className="card-enhanced w-full overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                        <div className="relative w-32 h-32 rounded-full flex-shrink-0 bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                            {brandData?.brandLogoUrl ? (
                                <NextImage
                                    src={brandData.brandLogoUrl}
                                    alt={`${brandName || 'Brand'} Logo`}
                                    fill
                                    style={{ objectFit: "contain" }}
                                    className="p-3 rounded-full"
                                    data-ai-hint="brand logo"
                                />
                            ) : (
                                <Sparkles className="w-16 h-16 text-primary" />
                            )}
                        </div>
                        <div className="flex-1 flex flex-col items-center md:items-start gap-4">
                            <div className="w-full text-center md:text-left min-w-0">
                                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                    <Badge variant={isPremiumActive ? 'default' : 'secondary'} className="capitalize">
                                        <Star className="w-4 h-4 mr-1.5" />
                                        {planLabel} Plan
                                    </Badge>
                                    {isAdmin && (
                                        <Badge variant="destructive">
                                            <ShieldCheck className="w-4 h-4 mr-1.5" />
                                            Admin
                                        </Badge>
                                    )}
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-balance">
                                    Welcome back, {brandName || 'to BrandForge AI'}!
                                </h1>
                                <p className="text-muted-foreground mt-1 text-balance">
                                    Ready to create something amazing for your brand today?
                                </p>
                            </div>

                            {isPremiumActive && daysRemaining <= 7 && (
                            <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-300 w-full">
                                    <AlertCircle className="h-4 w-4 !text-amber-500" />
                                    <AlertTitle className="font-semibold">Subscription Expiring Soon</AlertTitle>
                                    <AlertDescription>
                                        Your Pro plan will expire in {daysRemaining} day{daysRemaining > 1 ? 's' : ''}. 
                                        <Link href="/pricing" className="font-bold underline ml-1 hover:text-amber-600 dark:hover:text-amber-200">Renew now</Link> to maintain access.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {!isPremiumActive && plan === 'premium' && (
                                <Alert variant="destructive" className="w-full">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Your Pro Plan Has Expired</AlertTitle>
                                    <AlertDescription>
                                        Your access to premium features has ended. 
                                        <Link href="/pricing" className="font-bold underline ml-1">Renew your subscription</Link> to continue.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Link href={primaryAction.href} passHref className="w-full md:w-auto">
                                <Button size="lg" className="w-full md:w-auto btn-gradient-primary touch-target">
                                {!isPremiumActive && plan === 'premium' ? (<><RefreshCcw className="w-5 h-5 mr-2" /> Renew and Create</>) : (<>{primaryAction.label} <ArrowRight className="w-5 h-5 ml-2" /></>)}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {paymentMode === 'test' && (
                        <Alert className="mt-4 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-md w-full">
                            <TestTube className="h-4 w-4 !text-amber-500" />
                            <AlertTitle className="font-bold text-amber-600 dark:text-amber-400">Developer Test Mode is Active</AlertTitle>
                            <AlertDescription>
                                You can test the Pro plan features. No real money will be charged during the upgrade process.
                                <Button variant="link" asChild className="p-0 h-auto ml-1 font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-200">
                                    <Link href="/pricing">
                                        Test the Upgrade Flow <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    
                     {isFreeUser && paymentMode !== 'test' && (
                        <Alert className="mt-4 border-accent/50 bg-accent/5 text-accent-foreground shadow-md w-full">
                            <Star className="h-4 w-4 text-accent" />
                            <AlertTitle className="font-bold text-accent">Unlock Your Brand's Full Potential</AlertTitle>
                            <AlertDescription>
                                You're on the Free plan. Upgrade to Pro to unlock powerful features like full blog generation, premium image models, and more generation credits.
                                <Button variant="link" asChild className="p-0 h-auto ml-1 font-bold text-accent hover:text-accent/80">
                                    <Link href="/pricing">
                                        Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


function ActionCard({ href, icon, title, description, isLoading }: { href: string; icon: React.ReactNode; title: string; description: string, isLoading: boolean }) {
     if (isLoading) {
        return (
            <Card className="card-feature flex flex-col justify-between">
                <CardHeader>
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <Skeleton className="h-6 w-3/4 mt-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mt-2" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
        );
    }
    
    return (
        <Link href={href} passHref className="group">
            <Card className="card-feature flex flex-col justify-between h-full">
                <div>
                    <CardHeader>
                        <div className="p-3 bg-primary/10 rounded-lg w-fit transition-colors duration-300 group-hover:bg-primary/20">
                            {icon}
                        </div>
                        <CardTitle className="pt-4 text-xl">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>{description}</CardDescription>
                    </CardContent>
                </div>
                <CardFooter>
                     <div className="text-sm font-semibold text-primary flex items-center transition-transform duration-300 group-hover:translate-x-1">
                        Go to {title}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}

function RecentCreations() {
    const { generatedImages, generatedSocialPosts, generatedBlogPosts, isLoading } = useBrand();

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                </CardContent>
            </Card>
        )
    }

    const latestImage = generatedImages.length > 0 ? generatedImages[0] : null;
    const latestSocial = generatedSocialPosts.length > 0 ? generatedSocialPosts[0] : null;
    const latestBlog = generatedBlogPosts.length > 0 ? generatedBlogPosts[0] : null;
    const hasRecentItems = latestImage || latestSocial || latestBlog;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                    <Eye className="w-6 h-6 mr-3 text-primary" />
                    Recent Creations
                </CardTitle>
                <CardDescription>
                    A quick look at the latest content you've generated.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {hasRecentItems ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {latestImage && <RecentItemCard type="Image" content={latestImage.style} imageUrl={latestImage.src} />}
                        {latestSocial && <RecentItemCard type="Social Post" content={latestSocial.caption} imageUrl={latestSocial.imageSrc} />}
                        {latestBlog && <RecentItemCard type="Blog Post" content={latestBlog.title} />}
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-muted rounded-lg">
                        <h3 className="text-lg font-semibold text-foreground">No creations yet!</h3>
                        <p className="text-muted-foreground mt-1">
                            Head over to the <Link href="/content-studio" className="text-primary font-medium hover:underline">Content Studio</Link> to generate your first asset.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RecentItemCard({ type, content, imageUrl }: { type: 'Image' | 'Social Post' | 'Blog Post', content: string, imageUrl?: string | null }) {
    const iconMap = {
        'Image': <ImageIconLucide className="w-5 h-5 text-muted-foreground" />,
        'Social Post': <FileText className="w-5 h-5 text-muted-foreground" />,
        'Blog Post': <FileText className="w-5 h-5 text-muted-foreground" />,
    };

    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
            {imageUrl && (
                 <div className="relative w-full bg-muted aspect-video overflow-hidden">
                    <NextImage src={imageUrl} alt={`Recent ${type}`} fill style={{objectFit: 'cover'}} className="transition-transform duration-300 group-hover:scale-105" data-ai-hint="recent creation" />
                 </div>
            )}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    {iconMap[type]}
                    <h4 className="font-semibold text-foreground">{type}</h4>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 text-balance">
                    {content}
                </p>
            </div>
        </Card>
    );
}

    

    
