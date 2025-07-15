
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, Paintbrush, Send, Rocket, Sparkles, ArrowRight, CheckCircle, CreditCard, Newspaper, LogIn, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';


const FeatureDetailCard = ({ id, icon: Icon, title, description, benefits }: { id: string; icon: React.ElementType; title: string; description: string; benefits: string[] }) => (
    <Card id={id} className="card-enhanced w-full scroll-mt-24">
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-xl w-fit">
                    <Icon className="h-10 w-10 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-3xl font-bold">{title}</CardTitle>
                    <CardDescription className="text-lg mt-1">{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <ul className="space-y-3 mt-4">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

const PublicHeader = () => {
  const pathname = usePathname();
  const navLinks = [
    { href: '/features', label: 'Features', icon: Layers },
    { href: '/blog', label: 'Blog', icon: Newspaper },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container-responsive flex items-center justify-between h-18">
            <Link href="/" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-200">
                <Sparkles className="h-7 w-7 text-primary" />
                <span className="text-xl font-bold text-gradient-brand">BrandForge AI</span>
            </Link>
            <div className="flex items-center gap-2">
                {navLinks.map((link) => (
                    <Button key={link.href} variant="ghost" className={cn("hidden sm:inline-flex touch-target focus-enhanced", pathname.startsWith(link.href) && "text-primary bg-primary/10")} asChild>
                        <Link href={link.href}>
                            <link.icon className="mr-2 h-5 w-5" />
                            <span>{link.label}</span>
                        </Link>
                    </Button>
                ))}
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
            </div>
        </div>
    </header>
  );
};


export default function FeaturesPage() {
  return (
    <div className="bg-background text-foreground">
        <PublicHeader />

      <main className="pt-24">
         {/* Hero Section */}
        <section className="py-20 text-center animate-fade-in">
          <div className="container-responsive">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-5xl md:text-6xl font-extrabold text-balance">
                    One Platform. <span className="text-gradient-brand">Limitless Creativity.</span>
                </h1>
                <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-muted-foreground text-balance">
                    Discover how BrandForge AI combines multiple tools into a single, seamless workflow to accelerate your brand building and marketing efforts from start to finish.
                </p>
                <div className="mt-12">
                    <Button size="lg" className="btn-gradient-primary btn-lg-enhanced touch-target focus-enhanced" asChild>
                        <Link href="/signup">
                            Start Forging Your Brand
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
          </div>
        </section>

        {/* Features Details */}
        <section className="section-spacing bg-secondary/30">
            <div className="container-responsive">
                <div className="grid grid-cols-1 gap-12">
                     <FeatureDetailCard 
                        id="brand-identity"
                        icon={UserCircle}
                        title="AI Brand Identity Suite"
                        description="Build a strong foundation for your brand in minutes."
                        benefits={[
                            "Auto-fill brand descriptions and keywords by simply providing your website URL.",
                            "Get AI-powered suggestions to enhance and refine your brand's core message.",
                            "Generate a unique, professional logo that matches your brand's style and industry.",
                            "Store all your core brand assets in one place to ensure consistency across all generated content."
                        ]}
                     />
                     <FeatureDetailCard 
                        id="content-studio"
                        icon={Paintbrush}
                        title="Unified Content Studio"
                        description="Your central hub for all AI-powered content creation."
                        benefits={[
                            "Generate stunning, commercially-licensed images for marketing, social media, and blogs.",
                            "Create engaging, platform-aware social media posts for Instagram, X, and more.",
                            "Produce long-form, SEO-optimized blog articles, from outline to finished draft.",
                            "Use AI to populate entire content forms from a single sentence, kickstarting your creative process."
                        ]}
                     />
                      <FeatureDetailCard 
                        id="campaign-manager"
                        icon={Send}
                        title="Ad Campaign Manager"
                        description="Craft high-performing ad creatives with AI precision."
                        benefits={[
                            "Turn existing content like blog snippets or social posts into compelling ad copy.",
                            "Generate multiple headline and body text variations for effective A/B testing.",
                            "Receive AI-driven guidance on how to best use your creatives on Google and Meta platforms.",
                            "Align ad campaigns with specific goals, from brand awareness to sales conversion."
                        ]}
                     />
                     <FeatureDetailCard 
                        id="deployment-hub"
                        icon={Rocket}
                        title="Deployment & Management Hub"
                        description="Organize, manage, and deploy your content pipeline."
                        benefits={[
                            "View all your generated social posts, blog articles, and ad campaigns in one place.",
                            "Manage the status of each piece of content: draft, scheduled, or deployed.",
                            "Simulate deployment to popular platforms to visualize your content calendar.",
                            "Edit and refine any generated content before it goes live."
                        ]}
                     />
                </div>
            </div>
        </section>
      </main>

       {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container-responsive py-8 text-center">
            <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap mb-4">
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
