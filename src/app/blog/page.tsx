
import { type Metadata } from 'next';
import Link from 'next/link';
import NextImage from 'next/image';
import { getBlogPosts, type BlogPost } from '@/lib/blog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, CreditCard, Newspaper } from 'lucide-react';
import { format } from 'date-fns';

export const metadata: Metadata = {
  title: 'Blog - BrandForge AI',
  description: 'Explore articles, insights, and tutorials on AI-powered branding, marketing, and content creation from the BrandForge AI team.',
  alternates: {
    canonical: '/blog',
  },
};

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

export default function BlogIndexPage() {
    const posts = getBlogPosts();

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
                            <Link href="/pricing">Pricing</Link>
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
        </div>
    );
}
