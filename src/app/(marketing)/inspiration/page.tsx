import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import GalleryGrid from '@/components/inspiration/GalleryGrid';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'AI-Generated Brand Visuals - Inspiration Gallery | BrandForge AI',
  description: 'Browse our gallery of AI-generated logos and images created with BrandForge AI. Get inspired by real examples from our templates across diverse industries.',
  keywords: 'AI logo examples, AI-generated images, brand inspiration, logo gallery, AI design examples, brand visuals',
  openGraph: {
    title: 'AI-Generated Brand Visuals - Inspiration Gallery',
    description: 'Browse beautiful AI-generated logos and images. Real examples created with BrandForge AI templates.',
    type: 'website',
  },
};

export default function InspirationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PublicHeader />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container-responsive">
            <div className="text-center max-w-3xl mx-auto">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Inspiration Gallery</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                AI-Generated <span className="text-gradient-brand">Brand Visuals</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Real examples created with BrandForge AI. Beautiful logos and images generated in seconds using our templates.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-gradient-primary">
                  <Link href="/signup">
                    Create Your Own
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/templates">
                    View Templates
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-12">
          <div className="container-responsive">
            <GalleryGrid />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container-responsive text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Create Your Own?
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Choose a template, customize it to your brand, and generate professional visuals in seconds.
            </p>
            <Button asChild size="lg" className="btn-gradient-primary">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
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
              <Link href="/templates">Templates</Link>
            </Button>
            <Button variant="link" asChild className="text-muted-foreground">
              <Link href="/plans">Pricing</Link>
            </Button>
            <Button variant="link" asChild className="text-muted-foreground">
              <Link href="/blog">Blog</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
