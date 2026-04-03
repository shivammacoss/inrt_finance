'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Wallet,
  Landmark,
  Coins,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ProfitVisionAdminShell,
  type AdminNavId,
} from '@/components/admin/ProfitVisionAdminShell';

export default function AdminPage() {
  const { token, user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<AdminNavId>('overview');

  const [stats, setStats] = useState<{
    totalUsers: number;
    totalInternalLedger: string;
    platformWalletOnChain: string;
    totalOnChainSupply: string | null;
    trackedMintSum?: string;
    trackedBurnSum?: string;
  } | null>(null);
  const [users, setUsers] = useState<{ id?: string; email?: string; balance?: string; role?: string }[]>([]);
  const [txs, setTxs] = useState<Record<string, unknown>[]>([]);
  const [actions, setActions] = useState<Record<string, unknown>[]>([]);
  const [mintTo, setMintTo] = useState('');
  const [mintAmt, setMintAmt] = useState('');
  const [creditUserId, setCreditUserId] = useState('');
  const [burnAmt, setBurnAmt] = useState('');
  const [adjUser, setAdjUser] = useState('');
  const [adjDelta, setAdjDelta] = useState('');
  const [adjNote, setAdjNote] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const [s, u, t, a] = await Promise.all([
        api.adminStats(token),
        api.adminUsers(token, 1),
        api.adminTransactions(token, 1),
        api.adminActions(token),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setTxs(t.transactions || []);
      setActions(a.actions || []);
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.replace('/login?next=/admin');
      return;
    }
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [loading, token, user, router]);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      load().catch((e) => setError(e instanceof Error ? e.message : 'Load failed'));
    }
  }, [token, user, load]);

  useEffect(() => {
    const sections = NAV_IDS.map((id) => document.getElementById(`admin-section-${id}`)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id?.startsWith('admin-section-')) {
          const id = visible.target.id.replace('admin-section-', '') as AdminNavId;
          if (NAV_IDS.includes(id)) setActiveNav(id);
        }
      },
      { root: null, rootMargin: '-12% 0px -45% 0px', threshold: [0, 0.15, 0.35] }
    );
    sections.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [stats, users.length, txs.length]);

  async function onMint(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const body: { recipientAddress: string; amount: string; creditUserId?: string } = {
        recipientAddress: mintTo.trim(),
        amount: mintAmt.trim(),
      };
      if (creditUserId.trim()) body.creditUserId = creditUserId.trim();
      const r = await api.adminMint(token, body);
      setMsg(`Minted. Tx: ${r.txHash}`);
      setMintAmt('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint failed');
    } finally {
      setBusy(false);
    }
  }

  async function onBurn(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const r = await api.adminBurn(token, burnAmt.trim());
      setMsg(`Burned. Tx: ${r.txHash}`);
      setBurnAmt('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Burn failed');
    } finally {
      setBusy(false);
    }
  }

  async function onAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const r = await api.adminAdjust(token, {
        userId: adjUser.trim(),
        amountDelta: adjDelta.trim(),
        note: adjNote.trim() || undefined,
      });
      setMsg(`Adjusted. New balance: ${r.balance}`);
      setAdjDelta('');
      setAdjNote('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Adjust failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="shell">
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="shell" style={{ maxWidth: 480 }}>
        <p style={{ color: 'var(--muted)' }}>Sign in required for admin.</p>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/login?next=/admin" className="btn btn-primary">
            Go to login
          </Link>
        </p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="shell">
        <p style={{ color: 'var(--muted)' }}>Opening dashboard…</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total users',
      value: stats?.totalUsers ?? '—',
      icon: Users,
      tone: 'blue' as const,
    },
    {
      title: 'Internal ledger (INRT)',
      value: stats?.totalInternalLedger ?? '—',
      icon: Wallet,
      tone: 'green' as const,
    },
    {
      title: 'Platform wallet (on-chain)',
      value: stats?.platformWalletOnChain ?? '—',
      icon: Landmark,
      tone: 'purple' as const,
    },
    {
      title: 'Total supply (on-chain)',
      value: stats?.totalOnChainSupply ?? 'n/a',
      icon: Coins,
      tone: 'orange' as const,
    },
    {
      title: 'Tracked mints (admin)',
      value: stats?.trackedMintSum ?? '—',
      icon: TrendingUp,
      tone: 'green' as const,
    },
    {
      title: 'Tracked burns (admin)',
      value: stats?.trackedBurnSum ?? '—',
      icon: TrendingDown,
      tone: 'purple' as const,
    },
  ];

  return (
    <ProfitVisionAdminShell
      title="Overview Dashboard"
      subtitle="Welcome back — INRT admin"
      userEmail={user.email}
      activeNav={activeNav}
      onNavigate={setActiveNav}
      onLogout={() => logout()}
    >
      <div>
        {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
        {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}

        <section id="admin-section-overview" className="adminPvSection">
          <div className="flex items-center justify-end mb-3">
            <button
              type="button"
              className="adminPvBtn adminPvBtnGhost"
              onClick={() => load().catch((e) => setError(e instanceof Error ? e.message : 'Refresh failed'))}
              disabled={dataLoading}
            >
              <RefreshCw size={16} className={dataLoading ? 'adminPvSpin' : ''} />
              Refresh
            </button>
          </div>
          <div className="adminPvStatGrid">
            {statCards.map((s) => (
              <div key={s.title} className="adminPvStatCard">
                <div className="adminPvStatTop">
                  <div className={`adminPvIconBox ${s.tone}`}>
                    <s.icon size={20} />
                  </div>
                  <span className="flex items-center gap-0.5 text-sm" style={{ color: '#22c55e' }}>
                    <ArrowUpRight size={14} />
                  </span>
                </div>
                <p className="adminPvStatLabel">{s.title}</p>
                <p className="adminPvStatValue">{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="admin-section-mint-burn" className="adminPvSection">
          <div className="adminPvGrid2">
            <div className="adminPvCard">
              <h3>Mint (on-chain)</h3>
              <form onSubmit={onMint}>
                <div className="adminPvField">
                  <label>Recipient address</label>
                  <input value={mintTo} onChange={(e) => setMintTo(e.target.value)} required />
                </div>
                <div className="adminPvField">
                  <label>Amount</label>
                  <input value={mintAmt} onChange={(e) => setMintAmt(e.target.value)} required />
                </div>
                <div className="adminPvField">
                  <label>Credit user ID (optional)</label>
                  <input value={creditUserId} onChange={(e) => setCreditUserId(e.target.value)} />
                </div>
                <button type="submit" className="adminPvBtn adminPvBtnPrimary" disabled={busy}>
                  Mint on-chain
                </button>
              </form>
            </div>
            <div className="adminPvCard">
              <h3>Burn (on-chain)</h3>
              <form onSubmit={onBurn}>
                <div className="adminPvField">
                  <label>Amount (from signer wallet)</label>
                  <input value={burnAmt} onChange={(e) => setBurnAmt(e.target.value)} required />
                </div>
                <button type="submit" className="adminPvBtn adminPvBtnDanger" disabled={busy}>
                  Burn on-chain
                </button>
              </form>
            </div>
          </div>
        </section>

        <section id="admin-section-adjust" className="adminPvSection">
          <div className="adminPvCard max-w-2xl">
            <h3>Manual balance adjustment</h3>
            <form onSubmit={onAdjust}>
              <div className="adminPvField">
                <label>User ID</label>
                <input value={adjUser} onChange={(e) => setAdjUser(e.target.value)} required />
              </div>
              <div className="adminPvField">
                <label>Amount delta (+ or -)</label>
                <input
                  value={adjDelta}
                  onChange={(e) => setAdjDelta(e.target.value)}
                  placeholder="+10 or -5"
                  required
                />
              </div>
              <div className="adminPvField">
                <label>Note</label>
                <input value={adjNote} onChange={(e) => setAdjNote(e.target.value)} />
              </div>
              <button type="submit" className="adminPvBtn adminPvBtnGhost" disabled={busy}>
                Apply adjustment
              </button>
            </form>
          </div>
        </section>

        <section id="admin-section-users" className="adminPvSection">
          <div className="adminPvCard">
            <h3>Users</h3>
            <div className="adminPvTableWrap">
              <table className="adminPvTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Balance</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={String(u.id || u.email)}>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
                        {String(u.id || '').slice(0, 10)}…
                      </td>
                      <td>{u.email}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace' }}>{u.balance}</td>
                      <td>{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="admin-section-ledger" className="adminPvSection">
          <div className="adminPvGrid2">
            <div className="adminPvCard">
              <h3>Recent transactions</h3>
              <div className="adminPvTableWrap">
                <table className="adminPvTable">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.slice(0, 15).map((row) => (
                      <tr key={String(row._id)}>
                        <td>{String(row.type)}</td>
                        <td style={{ fontFamily: 'ui-monospace, monospace' }}>{String(row.amount)}</td>
                        <td>{String(row.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="adminPvCard">
              <h3>Admin actions</h3>
              <div className="adminPvTableWrap">
                <table className="adminPvTable">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Amount</th>
                      <th>Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.slice(0, 15).map((row) => (
                      <tr key={String(row._id)}>
                        <td>{String(row.action)}</td>
                        <td style={{ fontFamily: 'ui-monospace, monospace' }}>
                          {String(row.amount || '—')}
                        </td>
                        <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
                          {row.txHash ? String(row.txHash).slice(0, 12) + '…' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ProfitVisionAdminShell>
  );
}

const NAV_IDS: AdminNavId[] = ['overview', 'mint-burn', 'adjust', 'users', 'ledger'];
