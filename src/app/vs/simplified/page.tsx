import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Sparkles, Target, Image as ImageIcon, Brush, Focus } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'BrandForge AI vs Simplified | AI Branding vs All-in-One Marketing Platform 2025',
  description: 'Compare BrandForge AI and Simplified for brand building and marketing. See which AI platform is better for your business - brand-first vs marketing-first approach.',
  keywords: [
    'BrandForge vs Simplified',
    'Simplified alternatives',
    'AI branding tools',
    'AI marketing platform',
    'brand identity AI',
    'AI design tools',
    'Simplified comparison',
    'best AI marketing tools 2025',
    'all-in-one marketing platform',
    'brand building software'
  ],
  openGraph: {
    title: 'BrandForge AI vs Simplified | AI Branding vs Marketing Platform',
    description: 'Compare BrandForge AI and Simplified for brand building and marketing. See which AI platform is better for your business.',
    type: 'website',
  },
  alternates: {
    canonical: '/vs/simplified',
  },
};

const ComparisonRow = ({
  feature,
  brandforge,
  simplified,
  highlight = false
}: {
  feature: string;
  brandforge: boolean | string;
  simplified: boolean | string;
  highlight?: boolean;
}) => (
  <tr className={`border-b border-border/50 ${highlight ? 'bg-primary/5' : ''}`}>
    <td className={`py-4 px-4 text-left font-medium ${highlight ? 'text-primary' : 'text-foreground'}`}>
      {feature}
      {highlight && <Badge className="ml-2 text-xs" variant="default">Unique</Badge>}
    </td>
    <td className="py-4 px-4 text-center">
      {typeof brandforge === 'boolean' ? (
        brandforge ? (
          <Check className="w-5 h-5 text-primary mx-auto" />
        ) : (
          <X className="w-5 h-5 text-muted-foreground mx-auto" />
        )
      ) : (
        <span className="text-sm text-foreground font-medium">{brandforge}</span>
      )}
    </td>
    <td className="py-4 px-4 text-center">
      {typeof simplified === 'boolean' ? (
        simplified ? (
          <Check className="w-5 h-5 text-primary mx-auto" />
        ) : (
          <X className="w-5 h-5 text-muted-foreground mx-auto" />
        )
      ) : (
        <span className="text-sm text-muted-foreground">{simplified}</span>
      )}
    </td>
  </tr>
);

export default function BrandForgeVsSimplified() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <PublicHeader />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 text-center animate-fade-in">
          <div className="container-responsive">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-6" variant="outline">Comparison Guide</Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold text-balance mb-6">
                <span className="text-gradient-brand">BrandForge AI</span> vs <span className="text-foreground/90">Simplified</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-balance">
                Why a brand-first AI platform beats a marketing-first tool for building your business identity.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Comparison */}
        <section className="pb-12">
          <div className="container-responsive">
            <div className="max-w-5xl mx-auto">
              <Card className="overflow-hidden">
                <CardHeader className="bg-secondary/30">
                  <CardTitle className="text-2xl text-center">Feature Comparison</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-border">
                          <th className="py-4 px-4 text-left font-bold text-foreground">Feature</th>
                          <th className="py-4 px-4 text-center font-bold text-primary">BrandForge AI</th>
                          <th className="py-4 px-4 text-center font-bold text-muted-foreground">Simplified</th>
                        </tr>
                      </thead>
                      <tbody>
                        <ComparisonRow
                          feature="AI Logo Generation"
                          brandforge={true}
                          simplified={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Brand Profile & Voice"
                          brandforge="Complete System"
                          simplified="Basic"
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="AI Image Generation"
                          brandforge={true}
                          simplified={true}
                        />
                        <ComparisonRow
                          feature="Social Media Content"
                          brandforge="Text + Images"
                          simplified="Text + Images"
                        />
                        <ComparisonRow
                          feature="Graphic Design Tool"
                          brandforge={false}
                          simplified="Full Editor"
                        />
                        <ComparisonRow
                          feature="Video Editing"
                          brandforge={false}
                          simplified={true}
                        />
                        <ComparisonRow
                          feature="Social Scheduling"
                          brandforge={false}
                          simplified={true}
                        />
                        <ComparisonRow
                          feature="Brand Voice Learning"
                          brandforge="RAG System"
                          simplified="Limited"
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Team Collaboration"
                          brandforge="Planned"
                          simplified="Unlimited"
                        />
                        <ComparisonRow
                          feature="Template Library"
                          brandforge="Brand Templates"
                          simplified="100k+ Templates"
                        />
                        <ComparisonRow
                          feature="Multi-Language"
                          brandforge="7+ languages"
                          simplified="30+ languages"
                        />
                        <ComparisonRow
                          feature="Pricing"
                          brandforge="Free + $9.99/mo"
                          simplified="Free + $12/mo"
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Key Differences */}
        <section className="py-12 bg-secondary/20">
          <div className="container-responsive">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Why BrandForge AI Wins for <span className="text-gradient-brand">Brand Identity</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Brand-First */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Brand-First vs Marketing-First</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Simplified:</p>
                        <p className="text-sm text-muted-foreground">Marketing workflow platform. Design and publish, but no brand foundation.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Build brand identity FIRST. Logo, voice, visuals - then content flows naturally.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Logo Creation */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Logo Creation</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Simplified:</p>
                        <p className="text-sm text-muted-foreground">Manual design with templates. No AI logo generation.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">AI creates professional logos automatically based on your brand.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Brand Voice */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Brush className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Brand Voice Learning</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Simplified:</p>
                        <p className="text-sm text-muted-foreground">Basic AI writing. Doesn't deeply learn or remember your brand voice.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">RAG system learns from your content. Maintains consistent voice automatically.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Focused Platform */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Focus className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Focused Platform</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Simplified:</p>
                        <p className="text-sm text-muted-foreground">Jack-of-all-trades. Video, design, scheduling - but no branding focus.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Laser-focused on brand identity. Does one thing exceptionally well.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-12">
          <div className="container-responsive">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                When to Use <span className="text-gradient-brand">Each Tool</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Use Simplified For:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Marketing workflow management</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Social media scheduling</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Video editing needs</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Team collaboration workflows</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Already have brand identity</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">Use BrandForge AI For:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-foreground">
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Creating brand identity from scratch</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>AI-generated logos automatically</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Consistent brand voice everywhere</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Launching new business</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Focused branding platform</strong></span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="container-responsive">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Build Your Brand with <span className="text-gradient-brand">AI-First Tools?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Try BrandForge AI free today. No credit card required. Build your brand identity the right way.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="btn-gradient-primary btn-lg-enhanced" asChild>
                  <Link href="/signup">
                    Try BrandForge AI Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="btn-lg-enhanced" asChild>
                  <Link href="/features">
                    See All Features
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>No credit card needed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Brand-first approach</span>
                </div>
              </div>
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
              <Link href="/plans">Pricing</Link>
            </Button>
            <Button variant="link" asChild className="text-muted-foreground">
              <Link href="/features">Features</Link>
            </Button>
            <Button variant="link" asChild className="text-muted-foreground">
              <Link href="/terms-of-service">Terms</Link>
            </Button>
            <Button variant="link" asChild className="text-muted-foreground">
              <Link href="/privacy-policy">Privacy</Link>
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
