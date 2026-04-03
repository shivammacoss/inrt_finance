'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardDataProvider } from '@/lib/dashboard-data-context';

const HASH_ROUTES: Record<string, string> = {
  'user-section-overview': '/dashboard',
  'user-section-deposit': '/dashboard/deposit',
  'user-section-withdraw': '/dashboard/withdraw',
  'user-section-send': '/dashboard/send',
  'user-section-requests': '/dashboard/requests',
  'user-section-history': '/dashboard/history',
};

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw) return;
    const target = HASH_ROUTES[raw];
    if (target) {
      router.replace(target);
    }
  }, [router]);

  return <DashboardDataProvider>{children}</DashboardDataProvider>;
}
