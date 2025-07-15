
import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/plans', '/privacy-policy', '/terms-of-service', '/features', '/blog', '/blog/*'],
      disallow: ['/admin/', '/settings/', '/dashboard/', '/brand-profile/', '/content-studio/', '/campaign-manager/', '/image-library/', '/deployment-hub/', '/pricing/'],
    },
    sitemap: 'https://brandforge.me/sitemap.xml',
  };
}
