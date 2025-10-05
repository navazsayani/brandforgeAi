import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Sparkles, Zap, Check } from 'lucide-react';
import { brandTemplates, getAllCategories, getTemplatesByCategory } from '@/lib/templates';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: '20+ Free Brand Templates | BrandForge AI',
  description: 'Start your brand in 60 seconds with our free industry templates. Pre-filled brand profiles for coffee shops, tech startups, fitness coaches, beauty salons, and more.',
  keywords: [
    'brand templates',
    'branding templates',
    'business branding',
    'logo templates',
    'brand identity templates',
    'small business templates',
    'startup branding',
    'free brand templates',
    'industry templates',
    'brand profile templates'
  ],
  openGraph: {
    title: '20+ Free Brand Templates | Start Your Brand in 60 Seconds',
    description: 'Choose from 20+ professional brand templates tailored to your industry. Free forever.',
    type: 'website',
  },
  alternates: {
    canonical: '/templates',
  },
};

export default function TemplatesPage() {
  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <section className="pt-24 pb-16 sm:pt-28 sm:pb-20 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Free Industry Templates</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            Start Your Brand in <span className="text-gradient-brand font-extrabold">60 Seconds</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-balance">
            <strong className="text-foreground">No blank canvas anxiety.</strong> Choose from <strong className="text-foreground">20+ professionally crafted templates</strong> tailored to your industry and customize them to match your unique brand.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="btn-gradient-primary text-base sm:text-lg">
              <Link href="/signup">
                <Zap className="w-5 h-5 mr-2" />
                Get Started Free
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base sm:text-lg">
              <Link href="/features">
                See All Features
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Quick Benefits */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Fully Customizable</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 px-4 border-y bg-muted/20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-1">20+</div>
            <div className="text-sm text-muted-foreground">Industry Templates</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-1">12</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-1">100%</div>
            <div className="text-sm text-muted-foreground">Free Forever</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-1">60s</div>
            <div className="text-sm text-muted-foreground">To Get Started</div>
          </div>
        </div>
      </section>

      {/* Templates by Category */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Browse Templates by <span className="text-gradient-brand">Industry</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each template includes <strong className="text-foreground">pre-filled brand description</strong>, image style guides, keywords, and logo recommendations.
            </p>
          </div>

          <div className="space-y-16">
            {categories.map((category) => {
              const templates = getTemplatesByCategory(category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-2xl font-bold text-primary">{category}</h3>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                      {templates.length} {templates.length === 1 ? 'Template' : 'Templates'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className="hover:border-primary/50 transition-all hover:shadow-xl group relative overflow-hidden"
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <CardHeader className="relative">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl text-4xl group-hover:scale-110 transition-transform">
                              {template.icon}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">{template.name}</CardTitle>
                              <CardDescription className="text-sm flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium">
                                  {template.industry}
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 relative">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.brandDescription}
                          </p>

                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What's Included</div>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                Brand Description
                              </span>
                              <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                Image Styles
                              </span>
                              <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                Keywords
                              </span>
                              <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                Logo Guide
                              </span>
                            </div>
                          </div>

                          <Button asChild className="w-full group-hover:btn-gradient-primary transition-all" variant="outline" size="lg">
                            <Link href="/signup">
                              Use This Template
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How Templates Work */}
      <section className="py-12 sm:py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How Templates <span className="text-gradient-brand">Work</span></h2>
            <p className="text-lg text-muted-foreground">
              Get started in <strong className="text-foreground">3 simple steps</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="font-bold text-xl mb-2">Choose Your Template</h3>
              <p className="text-muted-foreground">
                Select a template that matches your industry from our collection of 20+ professional templates.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="font-bold text-xl mb-2">Customize Your Brand</h3>
              <p className="text-muted-foreground">
                Edit the pre-filled content to match your unique brand voice, style, and personality.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                3
              </div>
              <h3 className="font-bold text-xl mb-2">Generate Content</h3>
              <p className="text-muted-foreground">
                Start creating logos, images, social posts, and more—all powered by AI that knows your brand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to <span className="text-gradient-brand">Build Your Brand?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-balance">
            Join <strong className="text-foreground">thousands of businesses</strong> using BrandForge AI to create <strong className="text-foreground">professional brand identities</strong> in minutes, not weeks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-gradient-primary text-base sm:text-lg">
              <Link href="/signup">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Building Free
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base sm:text-lg">
              <Link href="/plans">
                View Pricing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free forever plan • 20+ templates included
          </p>
        </div>
      </section>
    </div>
  );
}
