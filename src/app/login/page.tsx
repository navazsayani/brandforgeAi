import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your BrandForge AI account to access your brand dashboard, content studio, and campaign manager.',
};

export default function LoginPage() {
  return <LoginForm />;
}
