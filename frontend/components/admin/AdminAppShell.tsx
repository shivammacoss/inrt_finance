'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProfitVisionAdminShell } from '@/components/admin/ProfitVisionAdminShell';

function normalizePath(pathname: string) {
  const base = (pathname.split('?')[0] || '').trim();
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1);
  return base || '/admin';
}

const ADMIN_ROUTE_META: Record<string, { title: string; subtitle: string; loginNext: string }> = {
  '/admin': { title: 'Overview', subtitle: 'INRT admin — key metrics', loginNext: '/admin' },
  '/admin/requests': { title: 'Requests', subtitle: 'Deposit & withdraw queue', loginNext: '/admin/requests' },
  '/admin/mint-burn': { title: 'Mint / Burn', subtitle: 'On-chain token operations', loginNext: '/admin/mint-burn' },
  '/admin/adjust': { title: 'Balance adjust', subtitle: 'Manual ledger correction', loginNext: '/admin/adjust' },
  '/admin/ledger': { title: 'Transactions', subtitle: 'Ledger & admin actions', loginNext: '/admin/ledger' },
  '/admin/users': { title: 'Users', subtitle: 'Accounts & balances', loginNext: '/admin/users' },
};

const DEFAULT_META = ADMIN_ROUTE_META['/admin'];

export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const isLoginRoute = pathname === '/admin/login' || pathname.startsWith('/admin/login/');

  const meta = useMemo(() => {
    const key = normalizePath(pathname);
    return ADMIN_ROUTE_META[key] ?? DEFAULT_META;
  }, [pathname]);

  useEffect(() => {
    if (isLoginRoute || loading) return;
    if (!user) {
      router.replace(`/admin/login?next=${encodeURIComponent(meta.loginNext)}`);
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [loading, user, router, meta.loginNext, isLoginRoute]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <ProfitVisionAdminShell title="Admin" subtitle="" userEmail={undefined} onLogout={() => void logout()}>
        <p style={{ color: 'var(--pv-muted)' }}>Loading…</p>
      </ProfitVisionAdminShell>
    );
  }

  if (!user) {
    return (
      <ProfitVisionAdminShell title="Admin" subtitle="" userEmail={undefined} onLogout={() => void logout()}>
        <div style={{ maxWidth: 480 }}>
          <p style={{ color: 'var(--pv-muted)' }}>Sign in required for admin.</p>
          <p style={{ marginTop: '1rem' }}>
            <Link href={`/admin/login?next=${encodeURIComponent(meta.loginNext)}`} className="adminPvBtn adminPvBtnPrimary">
              Admin sign in
            </Link>
          </p>
        </div>
      </ProfitVisionAdminShell>
    );
  }

  if (user.role !== 'admin') {
    return (
      <ProfitVisionAdminShell title="Admin" subtitle="" userEmail={user.email} onLogout={() => void logout()}>
        <p style={{ color: 'var(--pv-muted)' }}>Opening dashboard…</p>
      </ProfitVisionAdminShell>
    );
  }

  return (
    <ProfitVisionAdminShell
      title={meta.title}
      subtitle={meta.subtitle}
      userEmail={user.email}
      onLogout={() => {
        void logout();
      }}
    >
      {children}
    </ProfitVisionAdminShell>
  );
}
