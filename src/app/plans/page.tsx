
import type { Metadata } from 'next';
import PricingPageClient from '@/app/pricing/PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the best plan for your needs. From a free starting point to our powerful Pro plan, BrandForge AI has a solution for you.',
  alternates: {
    canonical: '/plans',
  },
};

// This is the public-facing page for pricing
export default function PublicPricingPage() {
    return <PricingPageClient />;
}
