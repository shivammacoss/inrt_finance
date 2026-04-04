'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const adminPortalLogin =
  (process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || '').replace(/\/$/, '') ||
  (process.env.NEXT_PUBLIC_ADMIN_HOST
    ? `https://${process.env.NEXT_PUBLIC_ADMIN_HOST.replace(/\/$/, '')}/admin/login`
    : '');

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="shell">
      <nav className="nav">
        <Link href="/" className="logo">
          IN<span>RT</span>
        </Link>
        <div className="nav-actions">
          {adminPortalLogin ? (
            <a href={adminPortalLogin} className="btn btn-secondary" style={{ marginRight: '0.25rem' }}>
              Admin
            </a>
          ) : null}
          <Link href="/login" className="btn btn-secondary">
            Log in
          </Link>
          <Link href="/register" className="btn btn-primary">
            Create account
          </Link>
        </div>
      </nav>

      <section style={{ paddingTop: '2rem' }}>
        <p className="badge">BNB Smart Chain · BEP-20</p>
        <h1 className="hero-title">Institutional-grade ledger for INRT</h1>
        <p className="hero-sub">
          On-chain deposits and withdrawals with instant internal transfers. Admin-controlled mint and burn
          with a clear audit trail.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary">
            Get started
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: '3rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Wallet</h3>
          <p style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
            Track balance, receive INRT to the platform deposit address, send internal transfers, and withdraw
            to your linked wallet.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Security</h3>
          <p style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
            JWT authentication, hashed passwords, validated inputs, and signer keys kept only on the server.
          </p>
        </div>
      </section>
    </div>
  );
}
