
import type { Metadata } from 'next';
import PricingPageClient from '@/app/pricing/PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the best plan for your needs. From a free starting point to our powerful Pro plan, BrandForge AI has a solution for you.',
  // no canonical here, as this is the authenticated version
};

export default function AuthenticatedPricingPage() {
    return <PricingPageClient />;
}
