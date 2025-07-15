
import type { Metadata } from 'next';
import BlogPageClient from './BlogPageClient';
import { getBlogPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog - BrandForge AI',
  description: 'Explore articles, insights, and tutorials on AI-powered branding, marketing, and content creation from the BrandForge AI team.',
  alternates: {
    canonical: '/blog',
  },
};

// This is now a Server Component
export default function BlogIndexPage() {
  const posts = getBlogPosts();
  return <BlogPageClient posts={posts} />;
}
