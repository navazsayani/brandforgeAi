
"use client";

import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { BrandProvider } from '@/contexts/BrandContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Added
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <TanstackQueryClientProvider client={queryClient}>
      <AuthProvider> {/* Added AuthProvider */}
        <BrandProvider>
          {children}
          <Toaster />
        </BrandProvider>
      </AuthProvider> {/* Closed AuthProvider */}
    </TanstackQueryClientProvider>
  );
}
