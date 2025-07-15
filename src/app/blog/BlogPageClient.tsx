
"use client";

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { type BlogPost } from '@/lib/blog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, CreditCard, Newspaper, LogIn, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

const PublicHeader = () => {
  const pathname = usePathname();
  const navLinks = [
    { href: '/features', label: 'Features', icon: Layers },
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

export default function BlogPageClient({ posts }: { posts: BlogPost[] }) {
    return (
        <div className="bg-background text-foreground">
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
                            <Link href="/pricing">Pricing</Link>
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
