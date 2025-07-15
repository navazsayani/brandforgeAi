
import { type Metadata } from 'next';
import Link from 'next/link';
import NextImage from 'next/image';
import { notFound } from 'next/navigation';
import { getBlogPosts, getPostBySlug } from '@/lib/blog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, CreditCard, Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for each blog post
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} - BrandForge AI Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.date,
        authors: [post.author],
        images: [
            {
                url: `https://brandforge.me${post.image}`, // Assumes images are in /public
                width: 1200,
                height: 630,
                alt: post.title,
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: [`https://brandforge.me${post.image}`],
    }
  };
}

// Generate static paths for all blog posts at build time
export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }
  
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
    <div className="bg-background text-foreground">
         <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
                        <Link href="/pricing">Pricing</Link>
                    </Button>
                </div>
            </div>
        </header>

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
                        />
                    </div>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none mx-auto prose-headings:font-bold prose-headings:text-balance prose-a:text-primary hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                    </div>
                </article>
            </div>
        </section>
        
        {/* Footer */}
        <footer className="border-t bg-card/50 mt-12">
            <div className="container-responsive py-8 text-center">
                 <p className="text-sm text-muted-foreground text-break">
                    &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
                </p>
            </div>
        </footer>
    </div>
  );
}
