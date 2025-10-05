"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowRight, Zap } from 'lucide-react';

export function WelcomeCard() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-2xl text-center py-10 px-6 animate-fade-in shadow-xl bg-secondary/30 border-primary/20">
        <CardHeader>
          <div className="w-fit mx-auto p-4 bg-primary/10 rounded-full mb-4">
            <Rocket className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-balance">
            Welcome to BrandForge AI!
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2 text-balance">
            How would you like to get started?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <>
              <div className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-xl border-2 border-primary/30 shadow-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-2">🚀 Quick Start (Recommended)</h3>
                <p className="text-muted-foreground mb-4">
                  Generate your first AI content in <strong className="text-foreground">30 seconds</strong>. No setup required!
                </p>
                <Button asChild size="lg" className="w-full btn-gradient-primary btn-lg-enhanced text-base sm:text-lg">
                  <Link href="/quick-start">
                    <Zap className="w-4 w-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">Try Quick Start</span>
                    <span className="sm:hidden">Quick Start</span>
                  </Link>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground font-medium">OR</span>
                </div>
              </div>

              <div className="p-6 bg-background rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">📋 Complete Brand Setup</h3>
                <p className="text-muted-foreground mb-4">
                  Start from scratch or choose from <strong className="text-primary">20+ industry templates</strong>. Unlock your <strong className="text-primary">Brand Starter Kit</strong> of 3 free images!
                </p>
                <Button asChild size="lg" variant="outline" className="w-full text-base sm:text-lg">
                  <Link href="/brand-profile">
                    <span className="hidden sm:inline">Create Brand Profile</span>
                    <span className="sm:hidden">Create Profile</span>
                    <ArrowRight className="w-4 w-4 sm:w-5 sm:h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                ✨ Either way, you\'ll see the power of AI in action
              </p>
            </>
        </CardContent>
      </Card>
    </div>
  );
}
