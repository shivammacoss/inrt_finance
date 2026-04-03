'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const { setSession } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { user } = await api.register({
        email,
        password,
        walletAddress: walletAddress.trim() || undefined,
      });
      setSession(null, user);
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
        <Link href="/login" className="btn btn-secondary">
          Log in
        </Link>
      </nav>

      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: '1.5rem' }}>Create account</h1>
        <p style={{ color: 'var(--muted)', marginTop: '-0.25rem' }}>
          Optional: add a BSC wallet for withdrawals later
        </p>
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
            <label htmlFor="password">Password (min 8)</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="wallet">Wallet address (optional)</label>
            <input
              id="wallet"
              placeholder="0x…"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
