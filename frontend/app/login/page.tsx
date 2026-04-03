'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DEMO_LOGIN } from '@/lib/demo-login';

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
      const { user, token } = await api.login({ email, password });
      setSession(token, user);
      if (next) {
        if (next === '/admin' && user.role !== 'admin') {
          router.push('/dashboard');
        } else {
          router.push(next);
        }
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
    <div className="shell" style={{ maxWidth: 440 }}>
      <nav className="nav">
        <Link href="/" className="logo">
          IN<span>RT</span>
        </Link>
        <Link href="/register" className="btn btn-secondary">
          Register
        </Link>
      </nav>

      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: '1.5rem' }}>Welcome back</h1>
        <p style={{ color: 'var(--muted)', marginTop: '-0.25rem' }}>Sign in to your account</p>
        {next === '/admin' ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--accent2)' }}>You will be redirected to Admin after login.</p>
        ) : null}
        {error ? <div className="error-banner">{error}</div> : null}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
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
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Demo logins (after seed:demo)</h2>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Run <code style={{ fontSize: '0.75rem' }}>cd backend && npm run seed:demo</code> once.
          </p>
          <div style={{ fontSize: '0.8rem', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 0.35rem' }}>
              <strong>Admin</strong> — {DEMO_LOGIN.admin.email} / {DEMO_LOGIN.admin.password}
            </p>
            {DEMO_LOGIN.users.map((u) => (
              <p key={u.email} style={{ margin: '0 0 0.35rem' }}>
                <strong>{u.label}</strong> — {u.email} / {u.password}
              </p>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
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
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
              onClick={() => {
                setEmail(DEMO_LOGIN.users[0].email);
                setPassword(DEMO_LOGIN.users[0].password);
              }}
            >
              Fill user 1
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
              onClick={() => {
                setEmail(DEMO_LOGIN.users[1].email);
                setPassword(DEMO_LOGIN.users[1].password);
              }}
            >
              Fill user 2
            </button>
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
        <div className="shell" style={{ maxWidth: 440 }}>
          <p style={{ color: 'var(--muted)' }}>Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
