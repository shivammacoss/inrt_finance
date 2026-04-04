'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

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
        setError('This account is not an administrator. Use the user portal to sign in.');
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
    <div className="login-auth-root">
      <div className="login-auth-inner">
        <div className="login-auth-top">
          <Link href="/admin" className="logo">
            IN<span>RT</span>
          </Link>
          <span className="login-auth-pill-admin">Admin</span>
        </div>

        <div className="login-auth-card login-auth-card--admin">
          <p className="login-auth-eyebrow">Operator access</p>
          <h1 className="login-auth-title-admin">Admin sign in</h1>
          <p className="login-auth-desc">
            Restricted area for mint, burn, requests, and ledger operations. User accounts sign in on the main app.
          </p>

          {error ? <div className="error-banner">{error}</div> : null}

          <form className="login-auth-form-admin" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="admin-email">Work email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@yourdomain.com"
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
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-login-admin" disabled={busy}>
              {busy ? 'Signing in…' : 'Enter console'}
            </button>
          </form>

          {userAppOrigin ? (
            <div className="login-auth-footer">
              User app:{' '}
              <a href={`${userAppOrigin}/login`} className="login-auth-link">
                {userAppOrigin.replace(/^https?:\/\//, '')}/login
              </a>
            </div>
          ) : (
            <div className="login-auth-footer">
              <Link href="/" className="login-auth-link">
                ← Back to home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-auth-root">
          <div className="login-auth-inner">
            <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading…</p>
          </div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
