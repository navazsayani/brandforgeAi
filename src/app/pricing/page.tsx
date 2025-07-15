
import { type Metadata } from 'next';
import PricingPageClient from './PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the best plan for your needs. From a free starting point to our powerful Pro plan, BrandForge AI has a solution for you.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
    return <PricingPageClient />;
}
