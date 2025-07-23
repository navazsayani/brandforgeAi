
'use client'

import Link from 'next/link';
import NextImage from 'next/image';
import { type BlogPost } from '@/lib/blog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PublicHeader from '@/components/PublicHeader';

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
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none mx-auto prose-p:my-4 prose-li:my-2 prose-headings:font-bold prose-headings:text-balance prose-a:text-primary hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md">
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
