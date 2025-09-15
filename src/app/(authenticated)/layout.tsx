
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { WelcomeGiftDialog } from '@/components/WelcomeGiftDialog';
import { Loader2 } from 'lucide-react';

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { brandData, isLoading: isBrandLoading } = useBrand();
  const router = useRouter();
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  // Trigger for the Welcome Gift Dialog
  useEffect(() => {
    if (brandData && brandData.brandDescription && brandData.welcomeGiftOffered === false) {
      setShowWelcomeGift(true);
    }
  }, [brandData]);

  const isLoading = isAuthLoading || isBrandLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This will briefly show before redirect, or if redirect fails.
    // Or, can return null or a minimal loading state if redirect is quick.
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppShell>
      <WelcomeGiftDialog isOpen={showWelcomeGift} onOpenChange={setShowWelcomeGift} />
      {children}
    </AppShell>
  );
}
