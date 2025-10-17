import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Sparkles, DollarSign, Image as ImageIcon, Palette, Zap } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'BrandForge AI vs Jasper AI | Best AI Writing Tool Comparison 2025',
  description: 'Compare BrandForge AI and Jasper AI for content creation. See which AI writing tool offers better brand consistency, pricing, and features for your marketing needs.',
  keywords: ['BrandForge vs Jasper', 'Jasper alternatives', 'AI writing tools comparison', 'Jasper AI vs BrandForge', 'best AI content tools', 'affordable AI writing'],
  alternates: {
    canonical: '/vs/jasper',
  },
};

const ComparisonRow = ({
  feature,
  brandforge,
  jasper,
  highlight = false
}: {
  feature: string;
  brandforge: boolean | string;
  jasper: boolean | string;
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
      {typeof jasper === 'boolean' ? (
        jasper ? (
          <Check className="w-5 h-5 text-primary mx-auto" />
        ) : (
          <X className="w-5 h-5 text-muted-foreground mx-auto" />
        )
      ) : (
        <span className="text-sm text-muted-foreground">{jasper}</span>
      )}
    </td>
  </tr>
);

export default function BrandForgeVsJasperPage() {
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
                <span className="text-gradient-brand">BrandForge AI</span> vs <span className="text-foreground/90">Jasper AI</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-balance">
                Comprehensive brand building platform vs focused AI writing tool: Which delivers better ROI for your marketing?
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
                          <th className="py-4 px-4 text-center font-bold text-muted-foreground">Jasper AI</th>
                        </tr>
                      </thead>
                      <tbody>
                        <ComparisonRow
                          feature="AI Image Generation"
                          brandforge={true}
                          jasper="Jasper Art add-on"
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Logo Generation"
                          brandforge={true}
                          jasper={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Brand Profile Storage"
                          brandforge={true}
                          jasper="Brand Voice"
                        />
                        <ComparisonRow
                          feature="Social Media Captions"
                          brandforge={true}
                          jasper={true}
                        />
                        <ComparisonRow
                          feature="Blog Post Generation"
                          brandforge={true}
                          jasper={true}
                        />
                        <ComparisonRow
                          feature="Ad Copy Writing"
                          brandforge={true}
                          jasper={true}
                        />
                        <ComparisonRow
                          feature="Multi-language Support"
                          brandforge="14 languages (free)"
                          jasper="30+ languages"
                        />
                        <ComparisonRow
                          feature="Platform Previews"
                          brandforge="6 platforms"
                          jasper={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="SEO Features"
                          brandforge="Basic"
                          jasper="Advanced (Surfer SEO)"
                        />
                        <ComparisonRow
                          feature="Plagiarism Checker"
                          brandforge={false}
                          jasper={true}
                        />
                        <ComparisonRow
                          feature="Chrome Extension"
                          brandforge={false}
                          jasper={true}
                        />
                        <ComparisonRow
                          feature="API Access"
                          brandforge={false}
                          jasper={true}
                        />
                        <ComparisonRow
                          feature="Free Plan"
                          brandforge={true}
                          jasper={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Starting Price"
                          brandforge="$0/month"
                          jasper="$49/month"
                          highlight={true}
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
                Why BrandForge AI Wins for <span className="text-gradient-brand">Complete Branding</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Visual + Text */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Visuals + Text Together</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Jasper AI:</p>
                        <p className="text-sm text-muted-foreground">Text generation only. Need separate tool (Jasper Art add-on $20+/mo) for images.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Images, captions, blogs all included. Generate complete social posts instantly.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Free vs $49/Month</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Jasper AI:</p>
                        <p className="text-sm text-muted-foreground">$49/month minimum. No free plan. 7-day trial requires credit card.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Free forever plan. Full brand building tools. No credit card needed.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Logo Creation */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Logo Generation</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Jasper AI:</p>
                        <p className="text-sm text-muted-foreground">No logo generation. Focus is on text content only.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">AI-powered logo generation included. Build complete brand identity.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Use Case Focus */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>All-in-One Platform</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Jasper AI:</p>
                        <p className="text-sm text-muted-foreground">Writing tool. Need Canva/Figma for visuals, separate logo designer.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Everything in one place: logos, images, captions, blogs, brand voice.</p>
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
                    <CardTitle className="text-xl">Use Jasper AI For:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Content teams with high-volume writing needs</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Long-form blog articles and SEO content</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Enterprise teams with budget for premium tools</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Advanced SEO optimization features</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>API integrations for custom workflows</span>
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
                        <span><strong>Building brand identity from scratch</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Startups and small businesses on budget</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Visual + written content together</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Logo generation and brand assets</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Complete solution without add-ons</strong></span>
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
                Why Pay $49/Month When You Can Start <span className="text-gradient-brand">Free?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                BrandForge AI gives you brand building, image generation, and content creation — all for $0. No credit card, no trial, just results.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="btn-gradient-primary btn-lg-enhanced" asChild>
                  <Link href="/signup">
                    Get Started Free
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
                  <span>Complete brand solution</span>
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
