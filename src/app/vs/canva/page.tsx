import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Sparkles, RefreshCcw, Brain, Palette, Layers } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'BrandForge AI vs Canva | AI Branding vs Design Tool Comparison 2025',
  description: 'Compare BrandForge AI and Canva for brand building. Discover how AI-powered branding differs from template-based design tools. See features, pricing, and which is best for your business.',
  keywords: ['BrandForge vs Canva', 'Canva alternatives', 'AI branding tools', 'Canva vs AI', 'brand building tools', 'AI marketing tools'],
  alternates: {
    canonical: '/vs/canva',
  },
};

const ComparisonRow = ({
  feature,
  brandforge,
  canva,
  highlight = false
}: {
  feature: string;
  brandforge: boolean | string;
  canva: boolean | string;
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
      {typeof canva === 'boolean' ? (
        canva ? (
          <Check className="w-5 h-5 text-primary mx-auto" />
        ) : (
          <X className="w-5 h-5 text-muted-foreground mx-auto" />
        )
      ) : (
        <span className="text-sm text-muted-foreground">{canva}</span>
      )}
    </td>
  </tr>
);

export default function BrandForgeVsCanvaPage() {
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
                BrandForge AI vs <span className="text-gradient-brand">Canva</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-balance">
                AI-powered brand building vs template-based design: Which approach creates stronger, more consistent brands?
              </p>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
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
                          <th className="py-4 px-4 text-center font-bold text-muted-foreground">Canva</th>
                        </tr>
                      </thead>
                      <tbody>
                        <ComparisonRow
                          feature="AI Content Generation"
                          brandforge={true}
                          canva="Limited"
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Brand Voice Memory"
                          brandforge={true}
                          canva={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Auto Caption Generation"
                          brandforge={true}
                          canva={false}
                        />
                        <ComparisonRow
                          feature="Blog Post Writing"
                          brandforge={true}
                          canva={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="AI Image Generation"
                          brandforge={true}
                          canva="Text to Image only"
                        />
                        <ComparisonRow
                          feature="Logo Generation"
                          brandforge={true}
                          canva="Template-based"
                        />
                        <ComparisonRow
                          feature="Multi-language Support"
                          brandforge="14 languages"
                          canva="100+ languages (templates)"
                        />
                        <ComparisonRow
                          feature="Social Media Previews"
                          brandforge={true}
                          canva={true}
                        />
                        <ComparisonRow
                          feature="Design Templates"
                          brandforge="AI-generated"
                          canva="600,000+"
                        />
                        <ComparisonRow
                          feature="Manual Design Tools"
                          brandforge={false}
                          canva={true}
                        />
                        <ComparisonRow
                          feature="Video Editing"
                          brandforge={false}
                          canva={true}
                        />
                        <ComparisonRow
                          feature="Print Design"
                          brandforge={false}
                          canva={true}
                        />
                        <ComparisonRow
                          feature="Brand Consistency AI"
                          brandforge={true}
                          canva={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Free Plan"
                          brandforge={true}
                          canva={true}
                        />
                        <ComparisonRow
                          feature="Starting Price"
                          brandforge="$0/month"
                          canva="$12.99/month"
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
                Why BrandForge AI Wins for <span className="text-gradient-brand">Brand Consistency</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* AI-First Approach */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Brain className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>AI-First Branding</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Canva:</p>
                        <p className="text-sm text-muted-foreground">Pick templates → Customize manually → Repeat for each piece → No brand memory</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Create brand profile once → AI generates everything on-brand automatically</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content + Design */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Layers className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Content + Design</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Canva:</p>
                        <p className="text-sm text-muted-foreground">Design-only tool. Write captions yourself or copy from AI tools separately.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Generates images + captions + blogs together. All matching your brand voice.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Automated Refinement */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <RefreshCcw className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Iterative AI Refinement</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Canva:</p>
                        <p className="text-sm text-muted-foreground">Manual editing with drag-and-drop. Fine if you have design skills.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Tell AI "make sky darker" or "add mountains" - unlimited refinements.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Purpose-Built */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Built for Branding</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Canva:</p>
                        <p className="text-sm text-muted-foreground">General design tool. Great for posters, presentations, but not brand-focused.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Built specifically for brand identity: logos, voice, consistent messaging.</p>
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
                    <CardTitle className="text-xl">Use Canva For:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>One-off design projects</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Presentations and slideshows</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Print materials (business cards, flyers)</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Video editing and animation</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>When you enjoy manual design control</span>
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
                        <span><strong>Building complete brand identity</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Consistent content at scale</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>AI-generated images + captions together</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Multi-language brand content</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Automated brand voice consistency</strong></span>
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
                Ready to Build Your Brand with <span className="text-gradient-brand">AI-Powered Tools?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Try BrandForge AI free today. No credit card required. See how AI transforms brand building.
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
                  <span>14 languages supported</span>
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
