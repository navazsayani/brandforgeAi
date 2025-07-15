
import type { Metadata } from 'next';
import BlogPageClient from './BlogPageClient';

export const metadata: Metadata = {
  title: 'Blog - BrandForge AI',
  description: 'Explore articles, insights, and tutorials on AI-powered branding, marketing, and content creation from the BrandForge AI team.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogIndexPage() {
  return <BlogPageClient />;
}
