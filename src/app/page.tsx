
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, UserPlus, LayoutDashboard, Loader2 } from 'lucide-react'; 
import NextImage from 'next/image';

const brandForgeAppLogoDataUri = "data:image/svg+xml,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22hsl(180%2C%2050%25%2C%2040%25)%22%20rx%3D%2210%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2260%22%20fill%3D%22hsl(180%2C%2050%25%2C%2095%25)%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3EBF%3C%2Ftext%3E%3C%2Fsvg%3E";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Optional: Redirect to dashboard if already logged in,
    // but a landing page might still be desirable.
    // if (!isLoading && user) {
    //   router.replace('/dashboard');
    // }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-6 text-center">
      <div className="mb-12 flex flex-col items-center">
        <NextImage 
            src={brandForgeAppLogoDataUri} 
            alt="BrandForge AI Logo" 
            width={120} 
            height={120} 
            className="rounded-md mb-6 shadow-lg" 
            data-ai-hint="AI forge" 
        />
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Welcome to <span className="text-primary">BrandForge AI</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Elevate your brand with AI-powered content creation, image generation, and campaign management.
          Streamline your marketing workflow and achieve remarkable results.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4">
        {user ? (
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-5 w-5" /> Go to Dashboard
            </Link>
          </Button>
        ) : (
          <>
            <Button size="lg" variant="default" asChild className="w-full sm:w-auto">
              <Link href="/signup">
                <UserPlus className="mr-2 h-5 w-5" /> Get Started Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" /> Log In
              </Link>
            </Button>
          </>
        )}
      </div>

      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
      </footer>
    </div>
  );
}
