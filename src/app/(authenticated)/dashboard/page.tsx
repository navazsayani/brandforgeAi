
"use client";

import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Edit3, TrendingUp, Send, Sparkles, Star, ShieldCheck, Paintbrush, FileText, Image as ImageIconLucide, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost } from '@/types';


export default function DashboardPage() {
    const { brandData, isLoading: isBrandLoading } = useBrand();
    const { currentUser, isLoading: isAuthLoading } = useAuth();
    const isLoading = isBrandLoading || isAuthLoading;

    return (
        <div className="space-y-8 animate-fade-in">
            <GreetingCard isLoading={isLoading} brandData={brandData} />

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

function GreetingCard({ isLoading, brandData }: { isLoading: boolean; brandData: any }) {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.email === 'admin@brandforge.ai';
    const plan = isAdmin ? 'Admin' : brandData?.plan || 'free';
    const brandName = brandData?.brandName;
    const isProfileComplete = brandData?.brandDescription && brandData?.brandName;
    
    const primaryAction = isProfileComplete
      ? { href: "/content-studio", label: "Create New Content" }
      : { href: "/brand-profile", label: "Complete Your Brand Profile" };

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

    return (
        <Card className="card-enhanced w-full overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
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
                            <Badge variant={isAdmin ? 'destructive' : (plan === 'premium' ? 'default' : 'secondary')} className="mb-2">
                               {isAdmin ? <ShieldCheck className="w-4 h-4 mr-1.5" /> : <Star className="w-4 h-4 mr-1.5" />}
                               {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </Badge>
                            <h1 className="text-2xl md:text-3xl font-bold text-balance">
                                Welcome back, {brandName || 'to BrandForge AI'}!
                            </h1>
                            <p className="text-muted-foreground mt-1 text-balance">
                                Ready to create something amazing for your brand today?
                            </p>
                        </div>
                        <Link href={primaryAction.href} passHref className="w-full md:w-auto">
                             <Button size="lg" className="w-full md:w-auto btn-gradient-primary touch-target">
                               {primaryAction.label}
                                <ArrowRight className="w-5 h-5 ml-2" />
                             </Button>
                        </Link>
                    </div>
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
