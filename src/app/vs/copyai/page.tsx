import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Sparkles, FileText, Image, Palette, Gift } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'BrandForge AI vs Copy.ai | AI Branding vs Copywriting Tool Comparison 2025',
  description: 'Compare BrandForge AI and Copy.ai for brand building and content creation. See which AI tool is better for your business - complete brand identity vs copywriting focus.',
  keywords: [
    'BrandForge vs Copy.ai',
    'Copy.ai alternatives',
    'AI branding tools',
    'AI copywriting tools',
    'brand identity AI',
    'AI content generation',
    'Copy.ai comparison',
    'best AI writing tools 2025',
    'AI marketing tools',
    'brand building software'
  ],
  openGraph: {
    title: 'BrandForge AI vs Copy.ai | AI Branding vs Copywriting Comparison',
    description: 'Compare BrandForge AI and Copy.ai for brand building and content creation. See which AI tool is better for your business.',
    type: 'website',
  },
  alternates: {
    canonical: '/vs/copyai',
  },
};

const ComparisonRow = ({
  feature,
  brandforge,
  copyai,
  highlight = false
}: {
  feature: string;
  brandforge: boolean | string;
  copyai: boolean | string;
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
      {typeof copyai === 'boolean' ? (
        copyai ? (
          <Check className="w-5 h-5 text-primary mx-auto" />
        ) : (
          <X className="w-5 h-5 text-muted-foreground mx-auto" />
        )
      ) : (
        <span className="text-sm text-muted-foreground">{copyai}</span>
      )}
    </td>
  </tr>
);

export default function BrandForgeVsCopyAI() {
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
                BrandForge AI vs <span className="text-gradient-brand">Copy.ai</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-balance">
                Why a complete brand identity platform beats a copywriting-focused tool for building your business.
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
                          <th className="py-4 px-4 text-center font-bold text-muted-foreground">Copy.ai</th>
                        </tr>
                      </thead>
                      <tbody>
                        <ComparisonRow
                          feature="Brand Profile Storage"
                          brandforge={true}
                          copyai={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="AI Logo Generation"
                          brandforge={true}
                          copyai={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="AI Image Generation"
                          brandforge={true}
                          copyai={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="AI Copywriting"
                          brandforge={true}
                          copyai={true}
                        />
                        <ComparisonRow
                          feature="Social Media Content"
                          brandforge="Text + Images"
                          copyai="Text Only"
                        />
                        <ComparisonRow
                          feature="Brand Voice Memory"
                          brandforge="RAG System"
                          copyai="Limited"
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Copywriting Templates"
                          brandforge="Brand-Focused"
                          copyai="90+ Templates"
                        />
                        <ComparisonRow
                          feature="Visual Branding"
                          brandforge={true}
                          copyai={false}
                        />
                        <ComparisonRow
                          feature="Multi-Language Support"
                          brandforge="7+ languages"
                          copyai="29+ Languages"
                        />
                        <ComparisonRow
                          feature="Team Collaboration"
                          brandforge="Planned"
                          copyai={true}
                        />
                        <ComparisonRow
                          feature="Chrome Extension"
                          brandforge={false}
                          copyai={true}
                        />
                        <ComparisonRow
                          feature="Pricing"
                          brandforge="Free + $9.99/mo"
                          copyai="$49/mo"
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
                {/* Brand Identity */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Brand Identity vs Copy Only</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Copy.ai:</p>
                        <p className="text-sm text-muted-foreground">Text generation only. No logos, no visuals, just words.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Complete brand identity: logos, images, copy, and voice - all in one place.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Visual Content */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Image className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Visual Content Included</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Copy.ai:</p>
                        <p className="text-sm text-muted-foreground">Create text, then find images elsewhere. Two separate workflows.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">AI-generated images WITH your copy. Social posts ready to publish.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Complete Platform */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Complete Platform</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Copy.ai:</p>
                        <p className="text-sm text-muted-foreground">Copywriting tool. Need other platforms for design, branding, images.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Everything in one platform: branding, copywriting, images, and deployment.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Free Forever */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Gift className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Free Forever</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Copy.ai:</p>
                        <p className="text-sm text-muted-foreground">7-day trial only. Then $49/month for basic features.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">True free forever plan. Build your brand at $0, upgrade when ready.</p>
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
                    <CardTitle className="text-xl">Use Copy.ai For:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Dedicated copywriting teams</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>High-volume text generation</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Team collaboration on copy</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Already have visual branding</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Only need AI writing assistance</span>
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
                        <span><strong>Creating logos and visual assets</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Social posts with branded images</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Starting new business or rebrand</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>All-in-one branding platform</strong></span>
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
                Ready to Build Your Brand with <span className="text-gradient-brand">Complete Tools?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Try BrandForge AI free today. No credit card required. Get logos, images, and copy in one platform.
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
                  <span>Complete branding toolkit</span>
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
