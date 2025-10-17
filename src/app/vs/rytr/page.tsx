import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Sparkles, Image as ImageIcon, Palette, Layers, Gift } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'BrandForge AI vs Rytr | AI Branding vs AI Writing Assistant Comparison 2025',
  description: 'Compare BrandForge AI and Rytr for brand building and content creation. See which AI platform is better - complete brand identity vs affordable AI writing.',
  keywords: [
    'BrandForge vs Rytr',
    'Rytr alternatives',
    'AI branding tools',
    'AI writing assistant',
    'brand identity AI',
    'AI content generation',
    'Rytr comparison',
    'best AI writing tools 2025',
    'affordable AI writing',
    'brand building software'
  ],
  openGraph: {
    title: 'BrandForge AI vs Rytr | AI Branding vs Writing Assistant',
    description: 'Compare BrandForge AI and Rytr for brand building and content creation. See which AI platform is better for your business.',
    type: 'website',
  },
  alternates: {
    canonical: '/vs/rytr',
  },
};

const ComparisonRow = ({
  feature,
  brandforge,
  rytr,
  highlight = false
}: {
  feature: string;
  brandforge: boolean | string;
  rytr: boolean | string;
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
      {typeof rytr === 'boolean' ? (
        rytr ? (
          <Check className="w-5 h-5 text-primary mx-auto" />
        ) : (
          <X className="w-5 h-5 text-muted-foreground mx-auto" />
        )
      ) : (
        <span className="text-sm text-muted-foreground">{rytr}</span>
      )}
    </td>
  </tr>
);

export default function BrandForgeVsRytr() {
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
                <span className="text-gradient-brand">BrandForge AI</span> vs <span className="text-foreground/90">Rytr</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-balance">
                Why complete brand identity beats budget writing tools for building lasting business value.
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
                          <th className="py-4 px-4 text-center font-bold text-muted-foreground">Rytr</th>
                        </tr>
                      </thead>
                      <tbody>
                        <ComparisonRow
                          feature="AI Logo Generation"
                          brandforge={true}
                          rytr={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="AI Image Generation"
                          brandforge={true}
                          rytr={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Brand Profile System"
                          brandforge={true}
                          rytr={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="AI Text Generation"
                          brandforge={true}
                          rytr={true}
                        />
                        <ComparisonRow
                          feature="Social Media Content"
                          brandforge="Text + Images"
                          rytr="Text Only"
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Use Case Templates"
                          brandforge="Brand-Focused"
                          rytr="40+ Templates"
                        />
                        <ComparisonRow
                          feature="Brand Voice Memory"
                          brandforge="RAG System"
                          rytr="Tone Options"
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Built-in Editor"
                          brandforge={false}
                          rytr={true}
                        />
                        <ComparisonRow
                          feature="Plagiarism Checker"
                          brandforge={false}
                          rytr={true}
                        />
                        <ComparisonRow
                          feature="Chrome Extension"
                          brandforge={false}
                          rytr={true}
                        />
                        <ComparisonRow
                          feature="Multi-Language"
                          brandforge="7+ languages"
                          rytr="30+ languages"
                        />
                        <ComparisonRow
                          feature="Pricing"
                          brandforge="Free + $9.99/mo"
                          rytr="$9/mo"
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
                {/* Visuals Included */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Visuals Included</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Rytr:</p>
                        <p className="text-sm text-muted-foreground">Text only. No images, no logos, no visual branding at all.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">AI-generated images WITH text. Social posts ready with branded visuals.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Brand Identity */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Brand Identity System</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Rytr:</p>
                        <p className="text-sm text-muted-foreground">Writing assistant. No brand building, no identity creation.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Complete brand system: logo, colors, voice, visuals - all automated.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Logo Creation */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Layers className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Logo Creation</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Rytr:</p>
                        <p className="text-sm text-muted-foreground">No logo tools. You need other software for visual branding.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">AI generates professional logos. Start with nothing, get complete brand.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Complete Package */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Gift className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Complete Package vs Basic Writing</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Rytr:</p>
                        <p className="text-sm text-muted-foreground">Budget writing tool. Good for text, nothing else included.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Complete branding package. Logo + Images + Copy + Voice - all at free tier.</p>
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
                    <CardTitle className="text-xl">Use Rytr For:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Budget AI writing needs</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Text-only content creation</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Plagiarism checking</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Built-in document editor</span>
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
                        <span><strong>Building complete brand identity</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Creating logos and visuals</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Social posts with branded images</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Launching new business</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span><strong>Complete branding solution</strong></span>
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
                Try BrandForge AI free today. No credit card required. Get text AND visuals in one platform.
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
                  <span>Text + Visuals included</span>
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
