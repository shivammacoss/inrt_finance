'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProfitVisionUserShell } from '@/components/user/ProfitVisionUserShell';

type Props = {
  title: string;
  subtitle?: string;
  loginNext: string;
  children: React.ReactNode;
};

export function DashboardChrome({ title, subtitle, loginNext, children }: Props) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(loginNext)}`);
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
        <p style={{ color: 'var(--muted)' }}>Please sign in to continue.</p>
        <p style={{ marginTop: '1rem' }}>
          <Link href={`/login?next=${encodeURIComponent(loginNext)}`} className="btn btn-primary">
            Go to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <ProfitVisionUserShell
      title={title}
      subtitle={subtitle}
      userEmail={user.email}
      userDisplayName={user.fullName?.trim() || undefined}
      userPhone={user.phone?.trim() || undefined}
      userAvatarUrl={user.avatarUrl?.trim() || undefined}
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
