
'use client'

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { type BlogPost } from '@/lib/blog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, CreditCard, Newspaper, LogIn, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

const PublicHeader = () => {
  const pathname = usePathname();
  const navLinks = [
    { href: '/features', label: 'Features', icon: Sparkles },
    { href: '/blog', label: 'Blog', icon: Newspaper },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container-responsive flex items-center justify-between h-18">
            <Link href="/" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-200">
                <Sparkles className="h-7 w-7 text-primary" />
                <span className="text-xl font-bold text-gradient-brand">BrandForge AI</span>
            </Link>
            <div className="flex items-center gap-2">
                {navLinks.map((link) => (
                    <Button key={link.href} variant="ghost" className={cn("hidden sm:inline-flex touch-target focus-enhanced", pathname.startsWith(link.href) && "text-primary bg-primary/10")} asChild>
                        <Link href={link.href}>
                            <link.icon className="mr-2 h-5 w-5" />
                            <span>{link.label}</span>
                        </Link>
                    </Button>
                ))}
                <Button variant="ghost" className="touch-target focus-enhanced" asChild>
                    <Link href="/login">
                         <LogIn className="mr-2 h-5 w-5" />
                         <span>Log In</span>
                    </Link>
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
  );
};


export default function BlogPostPageClient({ post }: { post: BlogPost }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date,
    dateModified: post.date,
    description: post.excerpt,
    image: `https://brandforge.me${post.image}`,
    author: {
        '@type': 'Person',
        name: post.author
    },
    publisher: {
        '@type': 'Organization',
        name: 'BrandForge AI',
        logo: {
            '@type': 'ImageObject',
            url: 'https://brandforge.me/brandforge-logo-schema.png'
        }
    }
  };

  return (
    <>
      <div className="bg-background text-foreground">
         <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        <PublicHeader />

        <main className="pt-24 pb-12">
            <div className="container-responsive max-w-4xl mx-auto">
                <article>
                    <header className="mb-12">
                         <Button variant="ghost" className="-ml-4 mb-6" asChild>
                            <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Blog
                            </Link>
                        </Button>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map(tag => (
                                <Badge key={tag} variant="default">{tag}</Badge>
                            ))}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-balance mb-4">
                            {post.title}
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {format(new Date(post.date), 'MMMM d, yyyy')} by {post.author}
                        </p>
                    </header>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-12 shadow-lg border">
                        <NextImage
                            src={post.image}
                            alt={post.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority
                            data-ai-hint="blog image"
                        />
                    </div>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none mx-auto prose-headings:font-bold prose-headings:text-balance prose-a:text-primary hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                    </div>
                </article>
            </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t bg-card/50 mt-12">
            <div className="container-responsive py-8 text-center">
                 <p className="text-sm text-muted-foreground text-break">
                    &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
                </p>
            </div>
        </footer>
    </div>
    </>
  );
}
