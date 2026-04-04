'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

function LoginForm() {
  const { setSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get('next');
  const next = safeNextPath(nextRaw);

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
      setSession(null, user);
      if (next) {
        if (next.startsWith('/admin') && user.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        router.push(next);
        return;
      }
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
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
          <Link href="/" className="logo">
            IN<span>RT</span>
          </Link>
          <Link href="/register" className="btn btn-secondary">
            Create account
          </Link>
        </div>

        <div className="login-auth-card login-auth-card--user">
          <p className="login-auth-eyebrow">User portal</p>
          <h1 className="login-auth-title-user">Sign in</h1>
          <p className="login-auth-desc">Access your portfolio, deposits, and transfers on INRT.</p>

          {error ? <div className="error-banner">{error}</div> : null}

          <form className="login-auth-form-user" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-login-user" disabled={busy}>
              {busy ? 'Signing in…' : 'Continue'}
            </button>
          </form>

          <div className="login-auth-footer">
            New here?{' '}
            <Link href="/register" className="login-auth-link">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
