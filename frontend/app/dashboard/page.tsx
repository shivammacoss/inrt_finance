'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Wallet, RefreshCw, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ProfitVisionUserShell,
  USER_NAV_IDS,
  type UserNavId,
} from '@/components/user/ProfitVisionUserShell';

export default function DashboardPage() {
  const { token, user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<UserNavId>('overview');
  const [balance, setBalance] = useState<string>('—');
  const [wallet, setWallet] = useState('');
  const [depositAddr, setDepositAddr] = useState('');
  const [contractAddr, setContractAddr] = useState('');
  const [txs, setTxs] = useState<Record<string, unknown>[]>([]);
  const [sendMode, setSendMode] = useState<'email' | 'wallet'>('email');
  const [toEmail, setToEmail] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [sendAmt, setSendAmt] = useState('');
  const [depHash, setDepHash] = useState('');
  const [wdAmt, setWdAmt] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'biznext' | 'upi' | 'bank'>('biznext');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [profileWallet, setProfileWallet] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const [b, info, t] = await Promise.all([
        api.balance(token),
        api.depositInfo(token),
        api.transactions(token, 40),
      ]);
      setBalance(b.balance);
      setWallet(b.walletAddress || '');
      setProfileWallet(b.walletAddress || '');
      setDepositAddr(info.depositAddress);
      setContractAddr(info.contractAddress);
      setTxs(t.transactions || []);
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/login?next=/dashboard');
    }
  }, [loading, token, router]);

  useEffect(() => {
    if (token) {
      load().catch((e) => setError(e instanceof Error ? e.message : 'Load failed'));
    }
  }, [token, load]);

  useEffect(() => {
    const sections = USER_NAV_IDS.map((id) => document.getElementById(`user-section-${id}`)).filter(
      Boolean
    ) as HTMLElement[];
    if (sections.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id?.startsWith('user-section-')) {
          const id = visible.target.id.replace('user-section-', '') as UserNavId;
          if (USER_NAV_IDS.includes(id)) setActiveNav(id);
        }
      },
      { root: null, rootMargin: '-12% 0px -45% 0px', threshold: [0, 0.15, 0.35] }
    );
    sections.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [balance, txs.length]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setBusy(true);
    try {
      await api.updateProfile(token, profileWallet.trim());
      setMsg('Wallet address saved');
      await refreshUser();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function internalSend(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const body =
        sendMode === 'email'
          ? { toEmail: toEmail.trim(), amount: sendAmt.trim() }
          : { toWalletAddress: toWallet.trim(), amount: sendAmt.trim() };
      await api.transfer(token, body);
      setMsg('Transfer completed');
      setToEmail('');
      setToWallet('');
      setSendAmt('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setBusy(false);
    }
  }

  async function submitDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const r = await api.deposit(token, depHash.trim());
      setMsg(`Credited. New balance: ${r.balance}`);
      setDepHash('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setBusy(false);
    }
  }

  async function submitWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const r = await api.withdraw(token, {
        amount: wdAmt.trim(),
        payoutMethod,
        payoutDetails: payoutDetails.trim() || undefined,
      });
      if (r.status === 'pending') {
        setMsg(r.message || 'Withdrawal queued for manual processing');
      } else {
        setMsg(r.txHash ? `Sent on-chain. Tx: ${r.txHash}` : 'Withdrawal completed');
      }
      setWdAmt('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdraw failed');
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
        <p style={{ color: 'var(--muted)' }}>Please sign in to continue.</p>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/login?next=/dashboard" className="btn btn-primary">
            Go to login
          </Link>
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="shell">
        <p style={{ color: 'var(--muted)' }}>Loading account…</p>
      </div>
    );
  }

  return (
    <ProfitVisionUserShell
      title="Wallet dashboard"
      subtitle="Balance, send, receive & history"
      userEmail={user.email}
      isAdmin={user.role === 'admin'}
      activeNav={activeNav}
      onNavigate={setActiveNav}
      onLogout={() => logout()}
    >
      {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
      {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}

      <section id="user-section-overview" className="adminPvSection">
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
        <div className="adminPvStatGrid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <div className="adminPvStatCard" style={{ maxWidth: '28rem' }}>
            <div className="adminPvStatTop">
              <div className="adminPvIconBox green">
                <Wallet size={22} />
              </div>
              <span className="flex items-center gap-0.5 text-sm" style={{ color: '#22c55e' }}>
                <ArrowUpRight size={14} />
                INRT
              </span>
            </div>
            <p className="adminPvStatLabel">Available balance</p>
            <p className="adminPvStatValue">
              {balance} <span style={{ fontSize: '0.55em', fontWeight: 600 }}>INRT</span>
            </p>
            <p className="adminPvStatLabel" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              Linked withdrawal wallet
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
              {wallet || '— Not set — use Wallet & withdraw'}
            </p>
          </div>
        </div>
      </section>

      <section id="user-section-receive" className="adminPvSection">
        <div className="adminPvCard max-w-3xl">
          <h3>Receive INRT (deposit)</h3>
          <p style={{ color: 'var(--pv-muted)', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
            Send BEP-20 INRT to the deposit address, then submit the transaction hash to credit your ledger.
          </p>
          <p
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.8rem',
              wordBreak: 'break-all',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: 'var(--pv-row-bg)',
              border: '1px solid var(--pv-card-border)',
            }}
          >
            {depositAddr || '—'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--pv-muted)' }}>
            Token contract:{' '}
            <span style={{ fontFamily: 'ui-monospace, monospace' }}>{contractAddr}</span>
          </p>
          {depositAddr ? (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                display: 'inline-block',
                background: '#fff',
                borderRadius: '0.5rem',
              }}
            >
              <QRCode value={depositAddr} size={168} />
            </div>
          ) : null}
          <p style={{ fontSize: '0.75rem', color: 'var(--pv-muted)', marginTop: '0.75rem' }}>
            Your profile wallet (for withdrawals):{' '}
            <span style={{ fontFamily: 'ui-monospace, monospace' }}>{wallet || '—'}</span>
          </p>
          <form onSubmit={submitDeposit}>
            <div className="adminPvField">
              <label htmlFor="txh">Deposit tx hash</label>
              <input
                id="txh"
                value={depHash}
                onChange={(e) => setDepHash(e.target.value)}
                placeholder="0x…"
                required
              />
            </div>
            <button type="submit" className="adminPvBtn adminPvBtnPrimary" disabled={busy}>
              Confirm deposit
            </button>
          </form>
        </div>
      </section>

      <section id="user-section-wallet" className="adminPvSection">
        <div className="adminPvGrid2">
          <div className="adminPvCard">
            <h3>Withdrawal wallet (BSC)</h3>
            <form onSubmit={saveProfile}>
              <div className="adminPvField">
                <label htmlFor="pw">Address</label>
                <input
                  id="pw"
                  value={profileWallet}
                  onChange={(e) => setProfileWallet(e.target.value)}
                  placeholder="0x…"
                  required
                />
              </div>
              <button type="submit" className="adminPvBtn adminPvBtnGhost" disabled={busy}>
                Save address
              </button>
            </form>
          </div>
          <div className="adminPvCard">
            <h3>Withdraw</h3>
            <p style={{ color: 'var(--pv-muted)', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
              BizNext sends BEP-20 to your saved wallet. UPI / bank requests are queued for manual settlement.
            </p>
            <form onSubmit={submitWithdraw}>
              <div className="adminPvField">
                <label htmlFor="payout">Payout method</label>
                <select
                  id="payout"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as typeof payoutMethod)}
                >
                  <option value="biznext">BizNext / on-chain (BSC wallet)</option>
                  <option value="upi">UPI (manual)</option>
                  <option value="bank">Bank transfer (manual)</option>
                </select>
              </div>
              <div className="adminPvField">
                <label htmlFor="wd">Amount (INRT)</label>
                <input id="wd" value={wdAmt} onChange={(e) => setWdAmt(e.target.value)} required />
              </div>
              {(payoutMethod === 'upi' || payoutMethod === 'bank') && (
                <div className="adminPvField">
                  <label htmlFor="pd">Payout details (UPI ID, account, reference)</label>
                  <textarea
                    id="pd"
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--pv-card-border)',
                      background: 'var(--pv-row-bg)',
                      color: 'inherit',
                    }}
                  />
                </div>
              )}
              <button type="submit" className="adminPvBtn adminPvBtnPrimary" disabled={busy}>
                Withdraw
              </button>
            </form>
          </div>
        </div>
      </section>

      <section id="user-section-send" className="adminPvSection">
        <div className="adminPvCard max-w-3xl">
          <h3>Send INRT (internal)</h3>
          <p style={{ color: 'var(--pv-muted)', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
            Instant ledger transfer to another platform user (not on-chain).
          </p>
          <form onSubmit={internalSend}>
            <div className="adminPvField">
              <span className="adminPvLabel">Recipient</span>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === 'email'}
                    onChange={() => setSendMode('email')}
                  />
                  Email
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === 'wallet'}
                    onChange={() => setSendMode('wallet')}
                  />
                  Wallet address
                </label>
              </div>
            </div>
            <div className="adminPvGrid2">
              {sendMode === 'email' ? (
                <div className="adminPvField" style={{ marginBottom: 0 }}>
                  <label htmlFor="em">Recipient email</label>
                  <input
                    id="em"
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    required={sendMode === 'email'}
                  />
                </div>
              ) : (
                <div className="adminPvField" style={{ marginBottom: 0 }}>
                  <label htmlFor="tw">Recipient wallet (0x…)</label>
                  <input
                    id="tw"
                    value={toWallet}
                    onChange={(e) => setToWallet(e.target.value)}
                    placeholder="0x…"
                    required={sendMode === 'wallet'}
                  />
                </div>
              )}
              <div className="adminPvField" style={{ marginBottom: 0 }}>
                <label htmlFor="am">Amount</label>
                <input id="am" value={sendAmt} onChange={(e) => setSendAmt(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="adminPvBtn adminPvBtnPrimary" style={{ marginTop: '1rem' }} disabled={busy}>
              Send
            </button>
          </form>
        </div>
      </section>

      <section id="user-section-history" className="adminPvSection">
        <div className="adminPvCard">
          <h3>Transaction history</h3>
          <div className="adminPvTableWrap">
            <table className="adminPvTable">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Tx</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {txs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ color: 'var(--pv-muted)', textAlign: 'center' }}>
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  txs.map((row) => (
                    <tr key={String(row._id)}>
                      <td>{String(row.type)}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace' }}>{String(row.amount)}</td>
                      <td>{String(row.status)}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
                        {row.txHash ? String(row.txHash).slice(0, 14) + '…' : '—'}
                      </td>
                      <td style={{ color: 'var(--pv-muted)', fontSize: '0.8rem' }}>
                        {row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </ProfitVisionUserShell>
  );
}
