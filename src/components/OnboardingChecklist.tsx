
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBrand } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2, Rocket, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fetch checkers
const hasSavedImages = async (userId: string): Promise<boolean> => {
    const q = query(collection(db, `users/${userId}/brandProfiles/${userId}/savedLibraryImages`), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

const hasSavedSocialPosts = async (userId: string): Promise<boolean> => {
    const q = query(collection(db, `users/${userId}/brandProfiles/${userId}/socialMediaPosts`), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

interface Step {
    id: string;
    title: string;
    description: string;
    href: string;
    isComplete: boolean;
    isLoading: boolean;
}

export function OnboardingChecklist() {
    const { userId } = useAuth();
    const { brandData, isLoading: isBrandLoading } = useBrand();
    const [isVisible, setIsVisible] = useState(false);

    // Fetching data to check completion status
    const { data: hasImages, isLoading: isLoadingImages } = useQuery({
        queryKey: ['onboarding_hasImages', userId],
        queryFn: () => hasSavedImages(userId!),
        enabled: !!userId,
    });
    
    const { data: hasSocial, isLoading: isLoadingSocial } = useQuery({
        queryKey: ['onboarding_hasSocial', userId],
        queryFn: () => hasSavedSocialPosts(userId!),
        enabled: !!userId,
    });
    
    const isLoading = isBrandLoading || isLoadingImages || isLoadingSocial;

    useEffect(() => {
        const dismissed = localStorage.getItem(`onboardingDismissed_${userId}`);
        if (dismissed !== 'true') {
            setIsVisible(true);
        }
    }, [userId]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(`onboardingDismissed_${userId}`, 'true');
    };
    
    const steps: Step[] = [
        {
            id: 'brand',
            title: 'Define Your Brand',
            description: 'Complete your brand profile to fuel the AI.',
            href: '/brand-profile',
            isComplete: !!brandData?.brandDescription,
            isLoading: isBrandLoading,
        },
        {
            id: 'image',
            title: 'Generate Your First Image',
            description: 'Create and save an image from the Content Studio.',
            href: '/content-studio',
            isComplete: !!hasImages,
            isLoading: isLoadingImages,
        },
        {
            id: 'social',
            title: 'Create a Social Post',
            description: 'Generate a caption and hashtags for your brand.',
            href: '/content-studio',
            isComplete: !!hasSocial,
            isLoading: isLoadingSocial,
        },
    ];

    const isAllComplete = steps.every(step => step.isComplete);

    if (!isVisible || isAllComplete) {
        return null;
    }

    const totalCompleted = steps.filter(step => step.isComplete).length;

    return (
        <Card className="mb-8 bg-secondary/30 border-primary/20 shadow-lg animate-fade-in">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Rocket className="w-7 h-7 text-primary" />
                        Welcome! Let's Get Started.
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Complete these steps to unlock the full power of BrandForge AI. ({totalCompleted}/{steps.length} complete)
                    </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
                    <X className="w-4 h-4" />
                    <span className="sr-only">Dismiss</span>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {steps.map((step) => (
                        <Link href={step.href} key={step.id} className="block group">
                            <div className="flex items-center space-x-4 p-4 border rounded-lg bg-background hover:bg-accent/10 hover:border-primary/50 transition-all">
                                <div className="flex-shrink-0">
                                    {step.isLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    ) : step.isComplete ? (
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className={cn("font-medium", step.isComplete && "line-through text-muted-foreground")}>
                                        {step.title}
                                    </p>
                                    <p className={cn("text-sm text-muted-foreground", step.isComplete && "line-through")}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
