'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { trackPageView } from '@/lib/analytics';

/**
 * AnalyticsPageViews Component
 *
 * Automatically tracks page views when user navigates in the SPA.
 * This captures route changes that don't trigger full page reloads.
 *
 * Tracks:
 * - Page path (URL)
 * - Page title
 * - Search params (for campaign tracking)
 */
function AnalyticsPageViewsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view when pathname changes
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      trackPageView(url, document.title);
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsPageViews() {
  return (
    <Suspense fallback={null}>
      <AnalyticsPageViewsInner />
    </Suspense>
  );
}
