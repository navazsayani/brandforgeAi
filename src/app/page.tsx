
"use client"; // Make this a client component to use useBrand hook

import React, { useEffect, useState } from 'react'; // Import React and hooks
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BarChart2, Edit3, Send, TrendingUp, Sparkles } from 'lucide-react';
import NextImage from 'next/image'; // Use NextImage to avoid conflicts
import { useBrand } from '@/contexts/BrandContext'; // Import useBrand
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function DashboardPage() {
  const { brandData, isLoading: isBrandLoading } = useBrand();
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (brandData?.brandLogoUrl) {
      setLogoUrl(brandData.brandLogoUrl);
    } else {
      setLogoUrl(undefined);
    }
  }, [brandData]);

  return (
    <AppShell>
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <BarChart2 className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Welcome to BrandForge AI</CardTitle>
                <CardDescription className="text-lg">
                  Your intelligent partner for brand building, content creation, and campaign management.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Leverage the power of AI to analyze your brand, generate compelling content,
              and automate your marketing efforts. Get started by defining your brand profile,
              then explore our content creation and campaign management tools.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Adjusted logo container to be square and control its max size */}
              <div className="relative w-full max-w-md mx-auto aspect-square rounded-lg shadow-md overflow-hidden bg-muted flex items-center justify-center">
                {isBrandLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : logoUrl ? (
                  <NextImage
                    src={logoUrl}
                    alt={brandData?.brandName ? `${brandData.brandName} Logo` : "Brand Logo"}
                    fill
                    style={{objectFit: "contain"}}
                    priority
                    data-ai-hint="brand logo main"
                  />
                ) : (
                  <div className="text-center p-4">
                    {/* The placeholder image can remain non-square as it's just a generic background */}
                    <NextImage
                        src="https://placehold.co/400x400.png"
                        alt="Placeholder for brand logo"
                        width={400}
                        height={400}
                        className="object-cover w-full h-full absolute inset-0 opacity-30"
                        data-ai-hint="generic placeholder"
                    />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        <Sparkles className="w-16 h-16 text-primary mb-4" />
                        <p className="text-lg font-semibold text-foreground">Your Brand Logo Here</p>
                        <p className="text-sm text-muted-foreground mb-3">
                         Generate your brand logo in the Brand Profile page.
                        </p>
                        <Link href="/brand-profile" passHref>
                            <Button variant="default" size="sm">
                                Go to Brand Profile <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center space-y-4">
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

        <div className="grid gap-6 md:grid-cols-3">
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
    </AppShell>
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
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 p-3 bg-accent/10 rounded-full">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Link href={cta.href} passHref>
          <Button variant="link" className="p-0 mt-1 text-primary h-auto">
            {cta.label} <ArrowRight className="w-4 h-4 ml-1" />
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
    <Card className="transition-all shadow-md hover:shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Link href={link} passHref>
          <Button variant="outline" className="mt-4 w-full">
            Go to {title} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
