import type { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function LegalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-4 border-b">
        <div className="container-responsive flex items-center justify-between">
           <Link
              href="/"
              className="flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-200"
            >
              <Sparkles className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold text-gradient-brand">BrandForge AI</span>
            </Link>
        </div>
      </header>
      <main className="container-responsive py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
             <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6"
             >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
            </Link>
            {children}
        </div>
      </main>
       <footer className="border-t bg-card/50">
        <div className="container-responsive py-8 text-center">
          <p className="text-xs text-muted-foreground text-break">
            &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
