
"use client";

import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { BrandProvider } from '@/contexts/BrandContext';
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <TanstackQueryClientProvider client={queryClient}>
      <BrandProvider>
        {children}
        <Toaster />
      </BrandProvider>
    </TanstackQueryClientProvider>
  );
}
