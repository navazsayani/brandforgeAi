
import { type Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, CreditCard, Newspaper } from 'lucide-react';
import PricingPageClient from './PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the best plan for your needs. From a free starting point to our powerful Pro plan, BrandForge AI has a solution for you.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
    return (
        <div className="bg-background text-foreground">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
                <div className="container-responsive flex items-center justify-between h-18">
                    <Link
                    href="/"
                    className="flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-200"
                    >
                    <Sparkles className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold text-gradient-brand">BrandForge AI</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" className="hidden sm:inline-flex touch-target focus-enhanced" asChild>
                            <Link href="/features">Features</Link>
                        </Button>
                        <Button variant="ghost" className="hidden sm:inline-flex touch-target focus-enhanced" asChild>
                            <Link href="/blog">Blog</Link>
                        </Button>
                        <Button variant="ghost" className="touch-target focus-enhanced" asChild>
                            <Link href="/login">Log In</Link>
                        </Button>
                        <Button className="btn-gradient-primary touch-target focus-enhanced" asChild>
                            <Link href="/signup">
                                <span>Get Started</span>
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>
            
            <main className="pt-24 pb-12">
                 <div className="container-responsive">
                    <PricingPageClient />
                 </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-card/50">
                <div className="container-responsive py-8 text-center">
                    <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap mb-4">
                        <Button variant="link" asChild className="text-muted-foreground">
                            <Link href="/features">Features</Link>
                        </Button>
                         <Button variant="link" asChild className="text-muted-foreground">
                            <Link href="/blog">Blog</Link>
                        </Button>
                        <Button variant="link" asChild className="text-muted-foreground">
                            <Link href="/terms-of-service">Terms of Service</Link>
                        </Button>
                        <Button variant="link" asChild className="text-muted-foreground">
                            <Link href="/privacy-policy">Privacy Policy</Link>
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground text-break">
                        &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
