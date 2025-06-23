
"use client"; 

import React, { useEffect, useState } from 'react'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Edit3, Send, TrendingUp, Sparkles, Image as ImageIconLucide, Loader2, Star, ShieldCheck } from 'lucide-react'; 
import NextImage from 'next/image'; 
import { useBrand } from '@/contexts/BrandContext'; 
import { useAuth } from '@/contexts/AuthContext'; // Added useAuth
import { Skeleton } from '@/components/ui/skeleton'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { brandData, isLoading: isBrandLoading } = useBrand();
  const { currentUser, isLoading: isAuthLoading } = useAuth(); // Get currentUser
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [displayPlan, setDisplayPlan] = useState<string | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser && currentUser.email === 'admin@brandforge.ai') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAdmin) {
      setDisplayPlan('Admin');
    } else if (brandData) {
      setDisplayPlan(brandData.plan || 'free');
    } else {
      setDisplayPlan(undefined);
    }

    if (brandData) {
      setLogoUrl(brandData.brandLogoUrl);
    } else {
      setLogoUrl(undefined);
    }
  }, [brandData, isAdmin]);

  const isLoading = isBrandLoading || isAuthLoading;

  return (
    <div className="content-spacing animate-fade-in">
      <Card className="card-enhanced">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="p-4 bg-primary/10 rounded-2xl w-fit">
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div>
                  <CardTitle className="text-break text-2xl sm:text-3xl mb-3">Welcome to BrandForge AI</CardTitle>
                  <CardDescription className="text-responsive text-break">
                    Your intelligent partner for brand building, content creation, and campaign management.
                  </CardDescription>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-28 mt-3 sm:mt-0 rounded-lg bg-muted" />
                ) : displayPlan && (
                  <Badge
                    variant={isAdmin ? 'destructive' : (displayPlan === 'premium' ? 'default' : 'secondary')}
                    className="mt-3 sm:mt-0 py-2 px-4 text-sm font-medium self-start sm:self-center"
                  >
                    {isAdmin ? <ShieldCheck className="w-4 h-4 mr-2" /> : <Star className="w-4 h-4 mr-2" />}
                    {isAdmin ? 'Admin Access' : `Plan: ${displayPlan.charAt(0).toUpperCase() + displayPlan.slice(1)}`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <p className="text-responsive text-muted-foreground text-break leading-relaxed">
            Leverage the power of AI to analyze your brand, generate compelling content,
            and automate your marketing efforts. Get started by defining your brand profile,
            then explore our content creation and campaign management tools.
          </p>
          <div className="grid-responsive-2 gap-8">
            
            <div className="relative w-full max-w-md mx-auto aspect-square rounded-2xl card-enhanced overflow-hidden bg-muted/50 flex items-center justify-center">
              {isLoading ? (
                <Skeleton className="w-full h-full rounded-2xl" />
              ) : logoUrl ? (
                <NextImage
                  src={logoUrl}
                  alt={brandData?.brandName ? `${brandData.brandName} Logo` : "Brand Logo"}
                  fill
                  style={{objectFit: "contain"}}
                  priority
                  data-ai-hint="brand logo main"
                  className="rounded-2xl"
                />
              ) : (
                <div className="text-center p-6 sm:p-8">
                  <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-6">
                      <div className="p-5 bg-primary/10 rounded-3xl">
                        <Sparkles className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-lg sm:text-xl font-semibold text-foreground text-break">Your Brand Logo Here</p>
                        <p className="text-sm sm:text-base text-muted-foreground text-break">
                          Generate your brand logo in the Brand Profile page.
                        </p>
                      </div>
                      <Link href="/brand-profile" passHref>
                          <Button variant="default" size="lg" className="btn-gradient-primary btn-lg-enhanced touch-target">
                              Go to Brand Profile <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                      </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center space-y-6 sm:space-y-8">
              <FeatureHighlight
                icon={<Edit3 className="w-6 h-6 text-accent" />}
                title="Define Your Brand"
                description="Start by setting up your brand's core identity. Upload assets, describe your vision, and let our AI understand your unique style."
                cta={{ href: "/brand-profile", label: "Go to Brand Profile" }}
              />
              <FeatureHighlight
                icon={<TrendingUp className="w-6 h-6 text-accent" />}
                title="Create & Conquer"
                description="Generate stunning visuals, engaging social media posts, and insightful blog articles, all tailored to your brand."
                cta={{ href: "/content-studio", label: "Explore Content Studio" }}
              />
                <FeatureHighlight
                icon={<Send className="w-6 h-6 text-accent" />}
                title="Launch Campaigns"
                description="Automate ad campaigns on Google and Meta. Reach your target audience effectively and efficiently."
                cta={{ href: "/campaign-manager", label: "Manage Campaigns" }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-3">
        <InfoCard
          title="Brand Profile"
          description="Lay the foundation for AI-driven success by detailing your brand's essence."
          icon={<Edit3 className="w-8 h-8 text-primary" />}
          link="/brand-profile"
        />
        <InfoCard
          title="Content Studio"
          description="Access AI tools for image, social media, and blog content generation."
          icon={<TrendingUp className="w-8 h-8 text-primary" />}
          link="/content-studio"
        />
        <InfoCard
          title="Campaign Manager"
          description="Automate and optimize your advertising campaigns across major platforms."
          icon={<Send className="w-8 h-8 text-primary" />}
          link="/campaign-manager"
        />
      </div>
    </div>
  );
}

interface FeatureHighlightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: { href: string; label: string };
}

function FeatureHighlight({ icon, title, description, cta }: FeatureHighlightProps) {
  return (
    <div className="flex items-start space-x-4 sm:space-x-5 p-5 rounded-xl hover:bg-muted/30 transition-colors duration-200">
      <div className="flex-shrink-0 p-3 sm:p-4 bg-accent/10 rounded-xl">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg sm:text-xl font-semibold text-break mb-2">{title}</h3>
        <p className="text-responsive-sm text-muted-foreground text-break leading-relaxed mb-3">{description}</p>
        <Link href={cta.href} passHref>
          <Button variant="link" className="p-0 text-primary h-auto text-base font-medium hover:text-primary/80 focus-enhanced">
            {cta.label} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

function InfoCard({ title, description, icon, link }: InfoCardProps) {
  return (
    <Card className="card-feature group">
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <CardTitle className="text-xl sm:text-2xl font-semibold text-break flex-1 pr-3">{title}</CardTitle>
        <div className="flex-shrink-0 p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-200">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-responsive-sm text-muted-foreground text-break leading-relaxed">{description}</p>
        <Link href={link} passHref>
          <Button
            variant="outline"
            className="w-full btn-lg-enhanced touch-target focus-enhanced hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 border-2"
          >
            <span>Go to {title}</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
