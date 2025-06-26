
export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface PlanPrice {
  amount: string;
  unit: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: PlanPrice;
  features: PlanFeature[];
  cta: string;
}

interface PricingStructure {
  [currency: string]: Plan[];
}

const commonFeatures = {
    free: [
        { name: '1 Brand Profile', included: true },
        { name: '10 Image Generations (Lifetime)', included: true },
        { name: '5 Social Media Posts / month', included: true },
        { name: 'Blog Outline Generation', included: true },
        { name: '2 Example Images in Profile', included: true },
        { name: 'Limited AI Image Library', included: true },
        { name: 'Full Blog Post Generation', included: false },
        { name: 'Access to Premium Image Models', included: false },
    ],
    pro: [
        { name: '1 Brand Profile', included: true },
        { name: '100 Image Generations / month', included: true },
        { name: '50 Social Media Posts / month', included: true },
        { name: 'Full Blog Post Generation (5/month)', included: true },
        { name: '5 Example Images in Profile', included: true },
        { name: 'Large AI Image Library', included: true },
        { name: 'Access to Premium Image Models', included: true },
        { name: 'Priority Support', included: true },
    ]
};

export const plans: PricingStructure = {
  USD: [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started and exploring core features.',
      price: { amount: '$0', unit: '/ month' },
      features: commonFeatures.free,
      cta: 'Get Started',
    },
    {
      id: 'pro_usd',
      name: 'Pro',
      description: 'For professionals and small businesses who need more power.',
      price: { amount: '$29', unit: '/ month' },
      features: commonFeatures.pro,
      cta: 'Upgrade to Pro',
    },
  ],
  INR: [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started and exploring core features.',
      price: { amount: '₹0', unit: '/ month' },
      features: commonFeatures.free,
      cta: 'Get Started',
    },
    {
      id: 'pro_inr',
      name: 'Pro',
      description: 'For professionals and small businesses who need more power.',
      price: { amount: '₹999', unit: '/ month' },
      features: commonFeatures.pro,
      cta: 'Upgrade to Pro',
    },
  ],
};
