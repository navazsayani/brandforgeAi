
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getBlogPosts } from '@/lib/blog';
import BlogPostPageClient from './BlogPostPageClient';

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

// Generate metadata on the server
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
          url: `https://brandforge.me${post.image}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [`https://brandforge.me${post.image}`],
    },
  };
}

// Generate static paths for all blog posts at build time
export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// This is now a Server Component
export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return <BlogPostPageClient post={post} />;
}
