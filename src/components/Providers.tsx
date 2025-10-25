
"use client";

import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { BrandProvider } from '@/contexts/BrandContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsPageViews } from '@/components/AnalyticsPageViews';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <TanstackQueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrandProvider>
            <AnalyticsPageViews />
            {children}
            <Toaster />
          </BrandProvider>
        </AuthProvider>
      </ThemeProvider>
    </TanstackQueryClientProvider>
  );
}
