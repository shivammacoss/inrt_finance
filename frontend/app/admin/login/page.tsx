'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DEMO_LOGIN } from '@/lib/demo-login';

const userAppOrigin = (process.env.NEXT_PUBLIC_USER_APP_ORIGIN || '').replace(/\/$/, '');

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  if (!raw.startsWith('/admin')) return null;
  return raw;
}

function AdminLoginForm() {
  const { setSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get('next');
  const next = safeNextPath(nextRaw) || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { user } = await api.login({ email, password });
      if (user.role !== 'admin') {
        try {
          await api.logout();
        } catch {
          /* ignore */
        }
        setError('This account is not an administrator. Use the user site to sign in.');
        return;
      }
      setSession(null, user);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell" style={{ maxWidth: 440 }}>
      <nav className="nav">
        <Link href="/admin" className="logo">
          IN<span>RT</span>
        </Link>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent2)',
          }}
        >
          Admin
        </span>
      </nav>

      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: '1.5rem' }}>Admin sign in</h1>
        <p style={{ color: 'var(--muted)', marginTop: '-0.25rem' }}>
          Operator access only. User accounts use the main app.
        </p>
        {error ? <div className="error-banner">{error}</div> : null}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to admin'}
          </button>
        </form>

        <div
          className="card"
          style={{
            marginTop: '1.25rem',
            borderColor: 'rgba(0, 212, 170, 0.25)',
            background: 'rgba(0, 212, 170, 0.06)',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Bootstrap admin (after seed)</h2>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            On the API server run <code style={{ fontSize: '0.75rem' }}>npm run seed:admin</code> or{' '}
            <code style={{ fontSize: '0.75rem' }}>npm run seed:demo</code> once.
          </p>
          <p style={{ fontSize: '0.8rem', margin: '0 0 0.75rem' }}>
            <strong>Admin</strong> — {DEMO_LOGIN.admin.email} / {DEMO_LOGIN.admin.password}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
            onClick={() => {
              setEmail(DEMO_LOGIN.admin.email);
              setPassword(DEMO_LOGIN.admin.password);
            }}
          >
            Fill admin
          </button>
        </div>

        {userAppOrigin ? (
          <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
            User app:{' '}
            <a href={`${userAppOrigin}/login`} style={{ color: 'var(--accent2)', fontWeight: 600 }}>
              {userAppOrigin}/login
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="shell" style={{ maxWidth: 440 }}>
          <p style={{ color: 'var(--muted)' }}>Loading…</p>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
