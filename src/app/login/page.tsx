
import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Log In to BrandForge AI',
  description: 'Log in to your BrandForge AI account to access your brand dashboard, AI content studio, and marketing campaign manager.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
