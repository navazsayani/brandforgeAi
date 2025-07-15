
import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/pricing', '/privacy-policy', '/terms-of-service'],
      disallow: ['/admin/', '/settings/', '/dashboard/', '/brand-profile/', '/content-studio/', '/campaign-manager/', '/image-library/', '/deployment-hub/'],
    },
    sitemap: 'https://brandforge.me/sitemap.xml',
  };
}
