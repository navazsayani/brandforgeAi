import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Sparkles, Layers, Image as ImageIcon, FileText, Zap } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'BrandForge AI vs Writesonic | AI Branding vs Writing Assistant Comparison 2025',
  description: 'Compare BrandForge AI and Writesonic for brand building and content creation. See which AI platform is better for your business - complete brand identity vs AI writing assistant.',
  keywords: [
    'BrandForge vs Writesonic',
    'Writesonic alternatives',
    'AI branding tools',
    'AI writing assistant',
    'brand identity AI',
    'AI content generation',
    'Writesonic comparison',
    'best AI writing tools 2025',
    'AI marketing tools',
    'brand building software'
  ],
  openGraph: {
    title: 'BrandForge AI vs Writesonic | AI Branding vs Writing Assistant',
    description: 'Compare BrandForge AI and Writesonic for brand building and content creation. See which AI platform is better for your business.',
    type: 'website',
  },
  alternates: {
    canonical: '/vs/writesonic',
  },
};

const ComparisonRow = ({
  feature,
  brandforge,
  writesonic,
  highlight = false
}: {
  feature: string;
  brandforge: boolean | string;
  writesonic: boolean | string;
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
      {typeof writesonic === 'boolean' ? (
        writesonic ? (
          <Check className="w-5 h-5 text-primary mx-auto" />
        ) : (
          <X className="w-5 h-5 text-muted-foreground mx-auto" />
        )
      ) : (
        <span className="text-sm text-muted-foreground">{writesonic}</span>
      )}
    </td>
  </tr>
);

export default function BrandForgeVsWritesonic() {
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
                <span className="text-gradient-brand">BrandForge AI</span> vs <span className="text-foreground/90">Writesonic</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-balance">
                Why a brand-first platform beats an SEO-focused writing tool for building your business identity.
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
                          <th className="py-4 px-4 text-center font-bold text-muted-foreground">Writesonic</th>
                        </tr>
                      </thead>
                      <tbody>
                        <ComparisonRow
                          feature="AI Logo Generation"
                          brandforge={true}
                          writesonic={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Brand Profile System"
                          brandforge={true}
                          writesonic={false}
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="AI Image Generation"
                          brandforge={true}
                          writesonic="Photosonic"
                        />
                        <ComparisonRow
                          feature="Social Media Content"
                          brandforge="Text + Images"
                          writesonic="Text Only"
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="AI Article Writing"
                          brandforge="Brand-Focused"
                          writesonic={true}
                        />
                        <ComparisonRow
                          feature="SEO Optimization"
                          brandforge="Basic"
                          writesonic="Advanced"
                        />
                        <ComparisonRow
                          feature="AI Chatbot"
                          brandforge={false}
                          writesonic="Chatsonic"
                        />
                        <ComparisonRow
                          feature="Brand Voice Memory"
                          brandforge="RAG System"
                          writesonic="Limited"
                          highlight={true}
                        />
                        <ComparisonRow
                          feature="Chrome Extension"
                          brandforge={false}
                          writesonic={true}
                        />
                        <ComparisonRow
                          feature="Multi-Language"
                          brandforge="7+ languages"
                          writesonic="25+ languages"
                        />
                        <ComparisonRow
                          feature="Plagiarism Checker"
                          brandforge={false}
                          writesonic={true}
                        />
                        <ComparisonRow
                          feature="Pricing"
                          brandforge="Free + $9.99/mo"
                          writesonic="$20/mo"
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
                Why BrandForge AI Wins for <span className="text-gradient-brand">Brand Building</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Logo Generation */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Logo Generation</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Writesonic:</p>
                        <p className="text-sm text-muted-foreground">No logo creation tools. Focus is on text and SEO content.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">AI-powered logo generation. Create professional logos in minutes.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Brand System */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Layers className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Brand System vs SEO Focus</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Writesonic:</p>
                        <p className="text-sm text-muted-foreground">SEO and content marketing focus. Limited brand identity tools.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Complete brand system: identity, voice, visuals, and content together.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content + Images */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Content + Images Together</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Writesonic:</p>
                        <p className="text-sm text-muted-foreground">Photosonic separate. Use different tools for text and visuals.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Generate branded images WITH content. Social posts ready to publish.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* All-in-One */}
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
                        <p className="text-sm font-semibold text-destructive mb-1">❌ Writesonic:</p>
                        <p className="text-sm text-muted-foreground">Writing suite. Need other tools for logo, branding, visual identity.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">✅ BrandForge AI:</p>
                        <p className="text-sm text-foreground">Complete branding platform. Logo → Content → Images → Deploy.</p>
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
                    <CardTitle className="text-xl">Use Writesonic For:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Long-form SEO content</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Blog and article writing</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>ChatGPT-like AI assistant</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Plagiarism checking</span>
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
                        <span><strong>Creating logos and brand assets</strong></span>
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
                        <span><strong>All-in-one branding solution</strong></span>
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
                Try BrandForge AI free today. No credit card required. Build your brand identity from the ground up.
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
