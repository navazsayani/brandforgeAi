
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, UserPlus, LayoutDashboard, Loader2, Sparkles, UserCircle } from 'lucide-react';
// NextImage import removed as it's no longer used

// brandForgeAppLogoDataUri constant removed

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
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading BrandForge AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container-responsive flex min-h-screen flex-col items-center justify-center text-center py-12">
        <div className="animate-fade-in">
          {/* Logo and Icon */}
          <div className="mb-8 flex flex-col items-center">
            <div className="p-4 bg-primary/10 rounded-2xl mb-6 shadow-lg">
              <Sparkles className="h-16 w-16 sm:h-20 sm:w-20 text-primary" />
            </div>
            <h1 className="text-break">
              Welcome to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BrandForge AI</span>
            </h1>
            <p className="mt-6 max-w-3xl text-responsive text-muted-foreground leading-relaxed">
              Elevate your brand with AI-powered content creation, image generation, and campaign management.
              Streamline your marketing workflow and achieve remarkable results.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="mb-12 grid-responsive max-w-4xl mx-auto">
            <div className="card-enhanced p-6 text-center">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                <UserCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-break">Brand Identity</h3>
              <p className="text-responsive-sm text-muted-foreground text-break">
                Define and develop your unique brand identity with AI assistance
              </p>
            </div>
            <div className="card-enhanced p-6 text-center">
              <div className="p-3 bg-accent/10 rounded-lg w-fit mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold mb-2 text-break">Content Creation</h3>
              <p className="text-responsive-sm text-muted-foreground text-break">
                Generate stunning visuals and engaging content automatically
              </p>
            </div>
            <div className="card-enhanced p-6 text-center">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                <LayoutDashboard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-break">Campaign Management</h3>
              <p className="text-responsive-sm text-muted-foreground text-break">
                Automate and optimize your marketing campaigns across platforms
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            {user ? (
              <Button 
                size="lg" 
                className="w-full sm:w-auto btn-gradient-primary touch-target focus-enhanced" 
                asChild
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-5 w-5" /> 
                  <span>Go to Dashboard</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto btn-gradient-primary touch-target focus-enhanced" 
                  asChild
                >
                  <Link href="/signup">
                    <UserPlus className="mr-2 h-5 w-5" /> 
                    <span>Get Started Free</span>
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto touch-target focus-enhanced hover:bg-primary/5" 
                  asChild
                >
                  <Link href="/login">
                    <LogIn className="mr-2 h-5 w-5" /> 
                    <span>Log In</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container-responsive py-8 text-center">
          <p className="text-responsive-sm text-muted-foreground text-break">
            &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
