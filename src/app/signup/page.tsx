
import type { Metadata } from 'next';
import SignupForm from './SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up for BrandForge AI',
  description: 'Create a new account with BrandForge AI to start building your brand identity with the power of AI. Get started for free.',
  alternates: {
    canonical: '/signup',
  },
};

export default function SignupPage() {
  return <SignupForm />;
}
