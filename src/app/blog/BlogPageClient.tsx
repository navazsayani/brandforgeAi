
"use client";

import Link from 'next/link';
import NextImage from 'next/image';
import { type BlogPost } from '@/lib/blog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import PublicHeader from '@/components/PublicHeader';

const BlogCard = ({ post }: { post: BlogPost }) => (
    <Link href={`/blog/${post.slug}`} className="group">
        <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="relative w-full aspect-video overflow-hidden">
                <NextImage
                    src={post.image}
                    alt={post.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="blog image"
                />
            </div>
            <CardHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                    {post.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
                <CardTitle className="text-xl font-bold line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground pt-1">
                    {format(new Date(post.date), 'MMMM d, yyyy')} • by {post.author}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-3 text-balance">{post.excerpt}</p>
            </CardContent>
            <div className="p-6 pt-0">
                 <div className="text-sm font-semibold text-primary flex items-center transition-transform duration-300 group-hover:translate-x-1">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2" />
                </div>
            </div>
        </Card>
    </Link>
);

export default function BlogPageClient({ posts }: { posts: BlogPost[] }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        "name": "BrandForge AI Blog",
        "description": "Insights, tutorials, and articles on AI-powered branding, marketing, and content creation from the BrandForge AI team.",
        "publisher": {
            '@type': 'Organization',
            "name": "BrandForge AI",
            "logo": {
                "@type": "ImageObject",
                "url": "https://brandforge.me/brandforge-logo-schema.png"
            }
        },
        "blogPost": posts.map(post => ({
            "@type": "BlogPosting",
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://brandforge.me/blog/${post.slug}`
            },
            "headline": post.title,
            "image": `https://brandforge.me${post.image}`,
            "datePublished": post.date,
            "author": {
                "@type": "Person",
                "name": post.author
            }
        }))
    };
    
    return (
        <div className="bg-background text-foreground">
             <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
             <PublicHeader />
            
            <main className="pt-24">
                <section className="py-20 text-center animate-fade-in">
                    <div className="container-responsive">
                        <div className="max-w-3xl mx-auto">
                            <h1 className="text-5xl md:text-6xl font-extrabold text-balance">
                                The <span className="text-gradient-brand">BrandForge Blog</span>
                            </h1>
                            <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-muted-foreground text-balance">
                                Insights on AI, marketing, and brand building. Your guide to leveraging artificial intelligence for creative success.
                            </p>
                        </div>
                    </div>
                </section>
                
                <section className="section-spacing bg-secondary/30">
                    <div className="container-responsive">
                        {posts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map(post => (
                                    <BlogCard key={post.slug} post={post} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h2 className="mt-4 text-2xl font-semibold">No Posts Yet</h2>
                                <p className="mt-2 text-muted-foreground">Our blog is coming soon. Check back for updates!</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
             {/* Footer */}
            <footer className="border-t bg-card/50">
                <div className="container-responsive py-8 text-center">
                    <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap mb-4">
                        <Button variant="link" asChild className="text-muted-foreground">
                            <Link href="/features">Features</Link>
                        </Button>
                        <Button variant="link" asChild className="text-muted-foreground">
                            <Link href="/plans">Pricing</Link>
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
