'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDataProvider } from '@/lib/admin-data-context';

const HASH_ROUTES: Record<string, string> = {
  'admin-section-overview': '/admin',
  'admin-section-requests': '/admin/requests',
  'admin-section-mint-burn': '/admin/mint-burn',
  'admin-section-adjust': '/admin/adjust',
  'admin-section-users': '/admin/users',
  'admin-section-ledger': '/admin/ledger',
};

export function AdminProviders({ children }: { children: React.ReactNode }) {
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

  return <AdminDataProvider>{children}</AdminDataProvider>;
}
