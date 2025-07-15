
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, UserPlus, LayoutDashboard, Loader2, UserCircle, Rocket, Paintbrush, Send, CheckCircle, ArrowRight, Sparkles, CreditCard, Newspaper, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';


const FeatureCard = ({ icon: Icon, title, description, href }: { icon: React.ElementType, title: string, description: string, href: string }) => (
    <Link href={href} className="group">
        <div className="card-compact text-center p-6 md:p-8 h-full flex flex-col">
            <div className="p-4 bg-primary/10 rounded-xl w-fit mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Icon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-break">{title}</h3>
            <p className="text-base text-muted-foreground text-balance flex-grow">
                {description}
            </p>
        </div>
    </Link>
);

const HowItWorksStep = ({ number, title, description }: { number: string, title: string, description: string }) => (
    <div className="relative flex flex-col items-center text-center group">
         <div className="absolute top-6 left-1/2 w-full border-t-2 border-dashed border-border/70 -translate-x-full group-first:hidden hidden md:block"></div>
        <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold border-4 border-background shadow-lg">
            {number}
        </div>
        <h3 className="mt-6 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-muted-foreground text-balance max-w-xs">
            {description}
        </p>
    </div>
);

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const heroImages = [
    {
      src: "/hero-brandforge-ai.svg",
      alt: "BrandForge AI dashboard interface showing brand profile creation, content studio with AI-generated images, campaign manager, and deployment hub",
      title: "Complete AI Branding Suite"
    },
    {
      src: "/hero-brandforge-ai-2.svg",
      alt: "BrandForge AI content creation studio with AI blog writer and social media generator",
      title: "AI-Powered Content Creation"
    },
    {
      src: "/hero-brandforge-ai-3.svg",
      alt: "BrandForge AI content studio with AI image generator, blog writer, and social media post creator",
      title: "AI Content Creation Studio"
    },
    {
      src: "/hero-brandforge-ai-4.svg",
      alt: "BrandForge AI brand builder with logo generation and brand profile customization",
      title: "AI Brand Identity Builder"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className="relative mt-10 w-full max-w-4xl mx-auto group">
      <div className="relative overflow-hidden rounded-xl">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`transition-all duration-1000 ease-in-out ${
              index === currentSlide
                ? 'opacity-100 translate-x-0'
                : index < currentSlide
                  ? 'opacity-0 -translate-x-full absolute inset-0'
                  : 'opacity-0 translate-x-full absolute inset-0'
            }`}
          >
            <NextImage
              src={image.src}
              alt={image.alt}
              width={1200}
              height={675}
              className="rounded-xl shadow-2xl border border-primary/10 transform group-hover:scale-[1.02] transition-transform duration-500 ease-out"
              priority={index === 0}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent rounded-xl"></div>
      </div>
      
      {/* Slide Indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-primary scale-110'
                : 'bg-primary/30 hover:bg-primary/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Slide Title */}
      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground font-medium">
          {heroImages[currentSlide].title}
        </p>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
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
  
  if (user) {
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/features', label: 'Features', icon: Layers },
    { href: '/blog', label: 'Blog', icon: Newspaper },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
          <div className="container-responsive flex items-center justify-between h-18">
             <Link
              href="/"
              className="flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-200"
            >
              <Sparkles className="h-7 w-7 text-primary" />
              <span className="sr-only">BrandForge AI Home</span>
            </Link>
            <div className="flex items-center gap-2">
                {navLinks.map((link) => (
                     <Button key={link.href} variant="ghost" className={cn("hidden sm:inline-flex touch-target focus-enhanced", pathname === link.href && "text-primary bg-primary/10")} asChild>
                        <Link href={link.href}>
                            <link.icon className="mr-2 h-5 w-5" />
                            <span>{link.label}</span>
                        </Link>
                    </Button>
                ))}
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
                <h1 className="text-5xl md:text-6xl font-extrabold text-gradient-brand mb-4 text-balance">
                    BrandForge AI
                </h1>
                 <p className="text-lg md:text-xl text-primary font-semibold mb-6">
                    Your Complete AI Branding & Marketing Suite
                 </p>
                <h2 className="text-4xl md:text-5xl font-bold text-balance">
                    Forge a Stronger Brand, Faster Than Ever
                </h2>
                <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-muted-foreground text-balance">
                    Stop juggling tools. From logo ideas to deployed ad campaigns, BrandForge AI is your all-in-one platform to build, create, and grow your brand with the power of AI.
                </p>
                
                <HeroCarousel />

                <div className="mt-12 flex justify-center gap-4">
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
                href="/features#brand-identity"
                icon={UserCircle}
                title="AI Brand Identity"
                description="Input your website URL and let our AI extract key brand information, descriptions, and keywords. Generate a unique logo and build your foundational profile in minutes."
              />
              <FeatureCard 
                href="/features#content-studio"
                icon={Paintbrush}
                title="Content Studio"
                description="Instantly generate SEO-optimized blog articles, create viral social media posts for Instagram and X, and design unique marketing images from a simple text prompt."
              />
              <FeatureCard 
                href="/features#campaign-manager"
                icon={Send}
                title="Campaign Manager"
                description="Turn your generated content into high-performing ads. Our AI crafts compelling ad copy and creative variations for Google and Meta campaigns, all guided by your unique brand data."
              />
               <FeatureCard 
                href="/features#deployment-hub"
                icon={Rocket}
                title="Deployment Hub"
                description="Organize your content workflow. Review, manage status, and (soon) deploy all your generated social posts, blog articles, and ad campaigns directly to your connected platforms."
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
                    <Link href="/features">Features</Link>
                </Button>
                <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/blog">Blog</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/pricing">Pricing</Link>
                </Button>
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
