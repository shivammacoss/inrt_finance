'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProfitVisionAdminShell } from '@/components/admin/ProfitVisionAdminShell';

type Props = {
  title: string;
  subtitle?: string;
  loginNext?: string;
  children: React.ReactNode;
};

export function AdminChrome({ title, subtitle, loginNext = '/admin', children }: Props) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [loading, user, router, loginNext]);

  if (loading) {
    return (
      <div className="shell">
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="shell" style={{ maxWidth: 480 }}>
        <p style={{ color: 'var(--muted)' }}>Sign in required for admin.</p>
        <p style={{ marginTop: '1rem' }}>
          <Link href={`/login?next=${encodeURIComponent(loginNext)}`} className="btn btn-primary">
            Go to login
          </Link>
        </p>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="shell">
        <p style={{ color: 'var(--muted)' }}>Opening dashboard…</p>
      </div>
    );
  }

  return (
    <ProfitVisionAdminShell
      title={title}
      subtitle={subtitle}
      userEmail={user.email}
      onLogout={() => {
        void logout();
      }}
    >
      {children}
    </ProfitVisionAdminShell>
  );
}
