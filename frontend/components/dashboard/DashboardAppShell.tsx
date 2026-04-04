'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProfitVisionUserShell } from '@/components/user/ProfitVisionUserShell';

function normalizePath(pathname: string) {
  const base = (pathname.split('?')[0] || '').trim();
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1);
  return base || '/dashboard';
}

const DASH_ROUTE_META: Record<string, { title: string; subtitle: string; loginNext: string }> = {
  '/dashboard': { title: 'Portfolio', subtitle: 'INRT · BNB Smart Chain', loginNext: '/dashboard' },
  '/dashboard/wallet': { title: 'Wallet', subtitle: 'Addresses & on-chain deposit', loginNext: '/dashboard/wallet' },
  '/dashboard/deposit': { title: 'Deposit', subtitle: 'Request INRT after you pay', loginNext: '/dashboard/deposit' },
  '/dashboard/withdraw': { title: 'Withdraw', subtitle: 'Request payout off-platform', loginNext: '/dashboard/withdraw' },
  '/dashboard/send': { title: 'Send', subtitle: 'Instant internal transfer', loginNext: '/dashboard/send' },
  '/dashboard/requests': { title: 'My requests', subtitle: 'Deposit & withdrawal queue', loginNext: '/dashboard/requests' },
  '/dashboard/history': { title: 'History', subtitle: 'Ledger transactions', loginNext: '/dashboard/history' },
  '/dashboard/profile': { title: 'Profile', subtitle: 'Your identity & wallet', loginNext: '/dashboard/profile' },
};

const DEFAULT_META = DASH_ROUTE_META['/dashboard'];

export function DashboardAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const meta = useMemo(() => {
    const key = normalizePath(pathname);
    return DASH_ROUTE_META[key] ?? DEFAULT_META;
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(meta.loginNext)}`);
    }
  }, [loading, user, router, meta.loginNext]);

  if (loading) {
    return (
      <ProfitVisionUserShell
        title="Wallet"
        subtitle="INRT"
        userEmail={undefined}
        isAdmin={false}
        onLogout={() => void logout()}
        shellClassName="inrtCbShell"
      >
        <p style={{ color: 'var(--pv-muted)' }}>Loading…</p>
      </ProfitVisionUserShell>
    );
  }

  if (!user) {
    return (
      <ProfitVisionUserShell
        title="Wallet"
        subtitle="INRT"
        userEmail={undefined}
        isAdmin={false}
        onLogout={() => void logout()}
        shellClassName="inrtCbShell"
      >
        <div style={{ maxWidth: 480 }}>
          <p style={{ color: 'var(--pv-muted)' }}>Please sign in to continue.</p>
          <p style={{ marginTop: '1rem' }}>
            <Link href={`/login?next=${encodeURIComponent(meta.loginNext)}`} className="adminPvBtn adminPvBtnPrimary">
              Go to login
            </Link>
          </p>
        </div>
      </ProfitVisionUserShell>
    );
  }

  return (
    <ProfitVisionUserShell
      title={meta.title}
      subtitle={meta.subtitle}
      userEmail={user.email}
      userDisplayName={user.fullName?.trim() || undefined}
      userPhone={user.phone?.trim() || undefined}
      isAdmin={user.role === 'admin'}
      onLogout={() => {
        void logout();
      }}
      shellClassName="inrtCbShell"
    >
      {children}
    </ProfitVisionUserShell>
  );
}
