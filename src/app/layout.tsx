
import type { Metadata } from 'next';
import { Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const siteUrl = "https://brandforge.me";
const ogImageUrl = "https://placehold.co/1200x630.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BrandForge AI | AI-Powered Brand Building & Marketing',
    template: `%s | BrandForge AI`,
  },
  description: 'Elevate your brand with AI-powered content creation, image generation, and campaign management. BrandForge AI streamlines your marketing workflow to achieve remarkable results.',
  keywords: ['AI marketing', 'brand building', 'content generation', 'social media AI', 'logo generation', 'SaaS', 'marketing automation'],
  openGraph: {
    title: 'BrandForge AI | AI-Powered Brand Building & Marketing',
    description: 'Forge a powerful brand identity with AI. Generate content, images, and campaigns effortlessly.',
    url: siteUrl,
    siteName: 'BrandForge AI',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'BrandForge AI Promotional Banner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrandForge AI | AI-Powered Brand Building & Marketing',
    description: 'Supercharge your brand with AI. From logos to ad campaigns, BrandForge AI is your creative partner.',
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'BrandForge AI',
        url: siteUrl,
        logo: 'https://placehold.co/250x250.png',
      },
      {
        '@type': 'WebSite',
        name: 'BrandForge AI',
        url: siteUrl,
      },
    ],
  };

  return (
    <html lang="en">
      <body className={`${sora.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
