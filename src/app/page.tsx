
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
      <div className="container-responsive flex min-h-screen flex-col items-center justify-center text-center section-spacing">
        <div className="animate-fade-in content-spacing">
          {/* Logo and Icon */}
          <div className="flex flex-col items-center">
            <div className="p-6 bg-primary/10 rounded-3xl mb-8 shadow-xl">
              <Sparkles className="h-20 w-20 sm:h-24 sm:w-24 text-primary" />
            </div>
            <h1 className="text-break mb-6">
              Welcome to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BrandForge AI</span>
            </h1>
            <p className="max-w-4xl text-responsive text-muted-foreground leading-relaxed">
              Elevate your brand with AI-powered content creation, image generation, and campaign management.
              Streamline your marketing workflow and achieve remarkable results.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid-responsive max-w-6xl mx-auto">
            <div className="card-feature text-center">
              <div className="p-4 bg-primary/10 rounded-xl w-fit mx-auto mb-6">
                <UserCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold mb-4 text-break">Brand Identity</h3>
              <p className="text-responsive-sm text-muted-foreground text-break">
                Define and develop your unique brand identity with AI assistance
              </p>
            </div>
            <div className="card-feature text-center">
              <div className="p-4 bg-accent/10 rounded-xl w-fit mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-accent" />
              </div>
              <h3 className="font-semibold mb-4 text-break">Content Creation</h3>
              <p className="text-responsive-sm text-muted-foreground text-break">
                Generate stunning visuals and engaging content automatically
              </p>
            </div>
            <div className="card-feature text-center">
              <div className="p-4 bg-primary/10 rounded-xl w-fit mx-auto mb-6">
                <LayoutDashboard className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold mb-4 text-break">Campaign Management</h3>
              <p className="text-responsive-sm text-muted-foreground text-break">
                Automate and optimize your marketing campaigns across platforms
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-lg mx-auto">
            {user ? (
              <Button
                size="lg"
                className="w-full sm:w-auto btn-gradient-primary btn-lg-enhanced touch-target focus-enhanced"
                asChild
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-3 h-6 w-6" />
                  <span>Go to Dashboard</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full sm:w-auto btn-gradient-primary btn-lg-enhanced touch-target focus-enhanced"
                  asChild
                >
                  <Link href="/signup">
                    <UserPlus className="mr-3 h-6 w-6" />
                    <span>Get Started Free</span>
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto btn-lg-enhanced touch-target focus-enhanced hover:bg-primary/5 border-2"
                  asChild
                >
                  <Link href="/login">
                    <LogIn className="mr-3 h-6 w-6" />
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
        <div className="container-responsive py-12 text-center">
            <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap mb-4">
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/terms-of-service">Terms of Service</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/privacy-policy">Privacy Policy</Link>
                </Button>
            </div>
          <p className="text-responsive-sm text-muted-foreground text-break">
            &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
