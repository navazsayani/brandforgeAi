
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, UserPlus, LayoutDashboard, Loader2, UserCircle, Rocket, Paintbrush, Send, CheckCircle, ArrowRight } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="card-compact text-center p-6 md:p-8">
        <div className="p-4 bg-primary/10 rounded-xl w-fit mx-auto mb-6 shadow-sm">
            <Icon className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-break">{title}</h3>
        <p className="text-base text-muted-foreground text-balance">
            {description}
        </p>
    </div>
);

const HowItWorksStep = ({ number, title, description }: { number: string, title: string, description: string }) => (
    <div className="relative flex flex-col items-center text-center group">
         <div className="absolute top-6 left-1/2 w-full border-t-2 border-dashed border-border/70 -translate-x-full group-first:hidden md:block"></div>
        <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold border-4 border-background shadow-lg">
            {number}
        </div>
        <h3 className="mt-6 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-muted-foreground text-balance max-w-xs">
            {description}
        </p>
    </div>
);

export default function LandingPage() {
  const { user, isLoading } = useAuth();

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
          <div className="container-responsive flex items-center justify-between h-18">
             <Link
              href="/"
              className="flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-200"
            >
              <h1 className="text-xl font-bold text-gradient-brand">BrandForge AI</h1>
            </Link>
            <div className="flex items-center gap-2">
                 {user ? (
                    <Button asChild className="touch-target focus-enhanced">
                        <Link href="/dashboard">
                            <LayoutDashboard className="mr-2 h-5 w-5" />
                            <span>Go to Dashboard</span>
                        </Link>
                    </Button>
                 ) : (
                    <>
                        <Button variant="ghost" className="touch-target focus-enhanced" asChild>
                            <Link href="/login">
                                <LogIn className="mr-2 h-5 w-5" />
                                <span>Log In</span>
                            </Link>
                        </Button>
                        <Button className="btn-gradient-primary touch-target focus-enhanced" asChild>
                            <Link href="/signup">
                                <span>Get Started</span>
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </>
                 )}
            </div>
        </div>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 text-center animate-fade-in">
          <div className="container-responsive">
            <div className="max-w-4xl mx-auto">
                 <div className="inline-block bg-primary/10 text-primary font-semibold px-4 py-1.5 rounded-full text-sm mb-6">
                    Your Complete AI Branding & Marketing Suite
                 </div>
                <h1 className="text-4xl md:text-5xl font-bold text-balance">
                    Forge a Stronger Brand, Faster Than Ever
                </h1>
                <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-muted-foreground text-balance">
                    Stop juggling tools. From logo ideas to deployed ad campaigns, BrandForge AI is your all-in-one platform to build, create, and grow your brand with the power of AI.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                    <Button size="lg" className="btn-gradient-primary btn-lg-enhanced touch-target focus-enhanced" asChild>
                        <Link href={user ? "/dashboard" : "/signup"}>
                            {user ? "Go to Dashboard" : "Get Started for Free"}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-spacing bg-secondary/50">
          <div className="container-responsive">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">One Platform, Infinite Possibilities</h2>
              <p className="mt-4 text-lg text-muted-foreground text-balance">
                Everything you need to streamline your brand's content and marketing workflow.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 mt-12 max-w-5xl mx-auto">
              <FeatureCard 
                icon={UserCircle}
                title="AI Brand Identity"
                description="Input your website URL and let our AI extract key brand information, descriptions, and keywords to build your foundational profile."
              />
              <FeatureCard 
                icon={Paintbrush}
                title="Content Studio"
                description="Generate stunning images, engaging social media posts, and complete SEO-friendly blog articles from a single creative hub."
              />
              <FeatureCard 
                icon={Send}
                title="Campaign Manager"
                description="Craft compelling ad copy and creative variations for Google and Meta campaigns, all guided by your unique brand data."
              />
               <FeatureCard 
                icon={Rocket}
                title="Deployment Hub"
                description="Review, manage, and (soon) deploy all your generated content directly to your connected social platforms."
              />
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="section-spacing">
            <div className="container-responsive">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-balance">Get Results in 3 Simple Steps</h2>
                    <p className="mt-4 text-lg text-muted-foreground text-balance">
                        Our intuitive workflow makes powerful AI accessible to everyone.
                    </p>
                </div>
                <div className="relative grid md:grid-cols-3 gap-12 md:gap-8 mt-16">
                    <HowItWorksStep number="1" title="Define" description="Create your brand profile by providing your URL, description, and keywords. AI helps fill in the gaps." />
                    <HowItWorksStep number="2" title="Generate" description="Use the Content Studio to instantly create images, social posts, and blog articles based on your brand." />
                    <HowItWorksStep number="3" title="Deploy" description="Review all your creations in the Deployment Hub and get them ready for launch." />
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="section-spacing bg-gradient-to-tr from-primary/90 to-accent/90 text-primary-foreground">
             <div className="container-responsive text-center">
                 <h2 className="text-3xl md:text-4xl font-bold text-balance">Ready to Forge Your Brand's Future?</h2>
                 <p className="max-w-2xl mx-auto mt-4 text-lg text-primary-foreground/80 text-balance">
                     Join hundreds of creators and businesses building stronger brands with less effort.
                 </p>
                 <div className="mt-8">
                     <Button 
                        size="lg" 
                        variant="secondary"
                        className="btn-lg-enhanced touch-target focus-enhanced bg-background/90 text-foreground hover:bg-background"
                        asChild
                     >
                        <Link href="/signup">Start Your Free Trial Today <ArrowRight className="ml-2 h-5 w-5" /></Link>
                     </Button>
                 </div>
             </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container-responsive py-8 text-center">
            <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap mb-4">
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/terms-of-service">Terms of Service</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/privacy-policy">Privacy Policy</Link>
                </Button>
            </div>
          <p className="text-sm text-muted-foreground text-break">
            &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
