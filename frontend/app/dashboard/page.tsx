'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Wallet, RefreshCw, ArrowDownToLine, ArrowUpCircle, Send, Loader2 } from 'lucide-react';
import { api, type PaymentRails } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  USER_SCROLL_SECTION_IDS,
  type UserNavId,
} from '@/components/user/ProfitVisionUserShell';

const BSC_ADDR_PATTERN = /^0x[a-fA-F0-9]{40}$/;

type DashboardPayMethod = 'upi' | 'bank_transfer' | 'card' | 'other';

function PaymentInstructions({ rails, method }: { rails: PaymentRails | null; method: DashboardPayMethod }) {
  if (!rails) {
    return (
      <div
        className="adminPvAlert"
        style={{ marginTop: '0.5rem', fontSize: '0.8125rem', borderColor: 'var(--pv-card-border)' }}
      >
        Set <code style={{ fontSize: '0.75rem' }}>PAYMENT_*</code> in the API <code style={{ fontSize: '0.75rem' }}>.env</code>{' '}
        to show UPI / bank details here. You can still submit a request and paste your transaction reference below.
      </div>
    );
  }

  if (method === 'upi') {
    const { payToId, payToName } = rails.upi;
    return (
      <div className="adminPvField" style={{ marginBottom: 0 }}>
        <span className="adminPvLabel">Pay with UPI</span>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem' }}>
          {payToId ? (
            <>
              Send to <strong style={{ fontFamily: 'ui-monospace, monospace' }}>{payToId}</strong>
              {payToName ? <> · beneficiary name: {payToName}</> : null}
            </>
          ) : (
            <>UPI ID is not configured on the server — describe your payment in the reference field.</>
          )}
        </p>
      </div>
    );
  }

  if (method === 'bank_transfer') {
    const b = rails.bank_transfer;
    const hasAny = Boolean(b.accountNumber || b.ifsc || b.accountName || b.bankName);
    return (
      <div className="adminPvField" style={{ marginBottom: 0 }}>
        <span className="adminPvLabel">Bank transfer</span>
        {hasAny ? (
          <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', fontSize: '0.875rem' }}>
            {b.accountName ? <li>Account name: {b.accountName}</li> : null}
            {b.bankName ? <li>Bank: {b.bankName}</li> : null}
            {b.accountNumber ? (
              <li>
                Account no.: <span style={{ fontFamily: 'ui-monospace, monospace' }}>{b.accountNumber}</span>
              </li>
            ) : null}
            {b.ifsc ? (
              <li>
                IFSC: <span style={{ fontFamily: 'ui-monospace, monospace' }}>{b.ifsc}</span>
              </li>
            ) : null}
          </ul>
        ) : (
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem' }}>
            Bank details are not configured — add <code style={{ fontSize: '0.75rem' }}>PAYMENT_BANK_*</code> on the
            server or put transfer details in the reference field.
          </p>
        )}
      </div>
    );
  }

  if (method === 'card') {
    return (
      <div className="adminPvField" style={{ marginBottom: 0 }}>
        <span className="adminPvLabel">Card payment</span>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', lineHeight: 1.5 }}>{rails.card.instructions}</p>
      </div>
    );
  }

  return (
    <div className="adminPvField" style={{ marginBottom: 0 }}>
      <span className="adminPvLabel">Other methods</span>
      <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', lineHeight: 1.5 }}>{rails.other.instructions}</p>
    </div>
  );
}

function requestStatusClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'inrtStatusPill inrtStatusApproved';
    case 'rejected':
      return 'inrtStatusPill inrtStatusRejected';
    case 'processing':
      return 'inrtStatusPill inrtStatusProcessing';
    default:
      return 'inrtStatusPill inrtStatusPending';
  }
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<UserNavId>('overview');
  const [balance, setBalance] = useState<string>('—');
  const [wallet, setWallet] = useState('');
  const [depositAddr, setDepositAddr] = useState('');
  const [contractAddr, setContractAddr] = useState('');
  const [txs, setTxs] = useState<Record<string, unknown>[]>([]);
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [sendMode, setSendMode] = useState<'email' | 'wallet'>('email');
  const [toEmail, setToEmail] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [sendAmt, setSendAmt] = useState('');
  const [depReqAmt, setDepReqAmt] = useState('');
  const [depPaymentMethod, setDepPaymentMethod] = useState<DashboardPayMethod>('upi');
  const [depRef, setDepRef] = useState('');
  const [wdReqAmt, setWdReqAmt] = useState('');
  const [wdMethod, setWdMethod] = useState<DashboardPayMethod>('upi');
  const [wdPayoutDetails, setWdPayoutDetails] = useState('');
  const [paymentRails, setPaymentRails] = useState<PaymentRails | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [b, info, t, r] = await Promise.all([
        api.balance(),
        api.depositInfo(),
        api.transactions(40),
        api.walletRequests(40),
      ]);
      setBalance(b.balance);
      setWallet(b.walletAddress || '');
      setDepositAddr(info.depositAddress);
      setContractAddr(info.contractAddress);
      setPaymentRails(info.paymentRails ?? null);
      setTxs(t.transactions || []);
      setRequests(r.requests || []);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=/dashboard');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      load().catch((e) => setError(e instanceof Error ? e.message : 'Load failed'));
    }
  }, [user, load]);

  /** Sidebar links from /dashboard/profile use /dashboard#user-section-* — scroll after mount */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.location.hash.replace(/^#/, '');
    if (!id || !id.startsWith('user-section-')) return;
    const m = id.match(/^user-section-(.+)$/);
    const navFromHash = m?.[1] as UserNavId | undefined;
    if (navFromHash && USER_SCROLL_SECTION_IDS.includes(navFromHash)) {
      setActiveNav(navFromHash);
    }
    const run = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    run();
    const t = window.setTimeout(run, 120);
    const t2 = window.setTimeout(run, 380);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const sections = USER_SCROLL_SECTION_IDS.map((id) => document.getElementById(`user-section-${id}`)).filter(
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
          if (USER_SCROLL_SECTION_IDS.includes(id)) setActiveNav(id);
        }
      },
      { root: null, rootMargin: '-12% 0px -45% 0px', threshold: [0, 0.15, 0.35] }
    );
    sections.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [balance, txs.length, requests.length]);

  const goTo = (id: UserNavId) => {
    setActiveNav(id);
    document.getElementById(`user-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  async function internalSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setMsg('');
    if (sendMode === 'wallet') {
      const w = toWallet.trim();
      if (!BSC_ADDR_PATTERN.test(w)) {
        setError('Enter a valid BSC address: 0x plus 40 hex characters.');
        return;
      }
    }
    setBusy(true);
    try {
      const body =
        sendMode === 'email'
          ? { toEmail: toEmail.trim(), amount: sendAmt.trim() }
          : { toWalletAddress: toWallet.trim(), amount: sendAmt.trim() };
      await api.transfer(body);
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

  async function submitDepositRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submittingDeposit) return;
    setError('');
    setMsg('');
    setSubmittingDeposit(true);
    try {
      const r = await api.depositRequest({
        amount: depReqAmt.trim(),
        paymentMethod: depPaymentMethod,
        paymentReference: depRef.trim() || undefined,
      });
      setMsg(r.message || 'Request submitted, waiting for admin approval');
      setDepReqAmt('');
      setDepRef('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmittingDeposit(false);
    }
  }

  async function submitWithdrawRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submittingWithdraw) return;
    const amt = wdReqAmt.trim();
    const bal = parseFloat(balance);
    const a = parseFloat(amt);
    if (!(a > 0)) {
      setError('Enter a valid amount');
      return;
    }
    if (!Number.isNaN(bal) && a > bal) {
      setError('Amount cannot exceed your available balance');
      return;
    }
    const payout = wdPayoutDetails.trim();
    if (!payout) {
      setError('Enter payout details: your UPI ID, bank account + IFSC, or how you want to receive funds');
      return;
    }
    setError('');
    setMsg('');
    setSubmittingWithdraw(true);
    try {
      const r = await api.withdrawRequest({
        amount: amt,
        withdrawalMethod: wdMethod,
        payoutDetails: payout,
      });
      setMsg(r.message || 'Request submitted, waiting for admin approval');
      setWdReqAmt('');
      setWdPayoutDetails('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmittingWithdraw(false);
    }
  }

  if (loading || !user) return null;

  return (
    <>
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

        <div className="inrtWalletHero max-w-2xl">
          <div className="inrtWalletHeroTop">
            <div>
              <p className="inrtWalletHeroLabel">Available balance</p>
              <p className="inrtWalletHeroBalance">
                {balance} <span className="inrtWalletHeroUnit">INRT</span>
              </p>
            </div>
            <div className="adminPvIconBox green" style={{ flexShrink: 0 }}>
              <Wallet size={26} />
            </div>
          </div>
          <p className="inrtWalletHeroAddr">
            <span style={{ color: 'var(--pv-muted)' }}>Saved BSC wallet · </span>
            {wallet ? (
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{wallet}</span>
            ) : (
              <>
                Not set —{' '}
                <Link href="/dashboard/profile" style={{ color: '#0d9488', fontWeight: 600 }}>
                  add in Profile
                </Link>
              </>
            )}
          </p>

          <div className="inrtQuickRow">
            <button
              type="button"
              className="inrtQuickBtn inrtQuickBtnPrimary"
              onClick={() => goTo('deposit')}
              disabled={dataLoading}
            >
              <ArrowDownToLine size={18} />
              Deposit
            </button>
            <button type="button" className="inrtQuickBtn inrtQuickBtnPrimary" onClick={() => goTo('withdraw')} disabled={dataLoading}>
              <ArrowUpCircle size={18} />
              Withdraw
            </button>
            <button type="button" className="inrtQuickBtn inrtQuickBtnPrimary" onClick={() => goTo('send')} disabled={dataLoading}>
              <Send size={18} />
              Send
            </button>
          </div>
        </div>
      </section>

      <section id="user-section-deposit" className="adminPvSection">
        <div className="adminPvGrid2" style={{ alignItems: 'start' }}>
          <div className="adminPvCard max-w-xl inrtCardPro">
            <h3 className="inrtSectionTitle">Request deposit</h3>
            <p className="inrtSectionHint">
              After payment, submit this request. Admin will verify and credit INRT to the BSC wallet saved in your{' '}
              <Link href="/dashboard/profile" style={{ color: '#0d9488', fontWeight: 600 }}>
                Profile
              </Link>
              .
            </p>
            <form onSubmit={submitDepositRequest}>
              <div className="adminPvField">
                <label htmlFor="dAmt">Amount (INRT)</label>
                <input
                  id="dAmt"
                  value={depReqAmt}
                  onChange={(e) => setDepReqAmt(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={submittingDeposit}
                />
              </div>
              <div className="adminPvField">
                <label htmlFor="dPay">Payment method</label>
                <select
                  id="dPay"
                  value={depPaymentMethod}
                  onChange={(e) => setDepPaymentMethod(e.target.value as DashboardPayMethod)}
                  disabled={submittingDeposit}
                >
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <PaymentInstructions rails={paymentRails} method={depPaymentMethod} />
              <div className="adminPvField">
                <label htmlFor="dRef">
                  {depPaymentMethod === 'upi'
                    ? 'Payment reference (UPI ref / transaction ID)'
                    : depPaymentMethod === 'bank_transfer'
                      ? 'Payment reference (UTR / transaction ID)'
                      : depPaymentMethod === 'card'
                        ? 'Payment reference (gateway or approval ID)'
                        : 'Describe your payment (reference, receipt, or notes)'}
                </label>
                <input
                  id="dRef"
                  value={depRef}
                  onChange={(e) => setDepRef(e.target.value)}
                  placeholder="e.g. UPI ref, bank txn id…"
                  disabled={submittingDeposit}
                />
              </div>
              <button type="submit" className="adminPvBtn adminPvBtnPrimary" disabled={submittingDeposit}>
                {submittingDeposit ? (
                  <>
                    <Loader2 size={16} className="adminPvSpin" /> Submitting…
                  </>
                ) : (
                  'Submit deposit request'
                )}
              </button>
            </form>
          </div>

          <div className="adminPvCard max-w-xl inrtCardPro">
            <h3 className="inrtSectionTitle">Platform deposit address</h3>
            <p className="inrtSectionHint">
              Use this address only if your flow requires sending assets to the platform custodian. Your credited INRT
              still requires an approved deposit request.
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
              Contract: <span style={{ fontFamily: 'ui-monospace, monospace' }}>{contractAddr}</span>
            </p>
            {depositAddr ? (
              <div className="inrtQrWrap">
                <QRCode value={depositAddr} size={160} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="user-section-withdraw" className="adminPvSection">
        <div className="adminPvGrid2" style={{ alignItems: 'start' }}>
          <div className="adminPvCard inrtCardPro max-w-xl">
            <h3 className="inrtSectionTitle">Request withdrawal</h3>
            <p className="inrtSectionHint">
              Payout method is how you want to receive funds off-platform. Your saved BSC wallet is kept on file for
              verification and mint/burn reference.
            </p>
            <div
              className="adminPvAlert"
              style={{
                marginBottom: '1rem',
                borderColor: 'rgba(234, 179, 8, 0.45)',
                background: 'rgba(234, 179, 8, 0.1)',
                color: 'var(--pv-text)',
                fontSize: '0.8125rem',
              }}
            >
              <strong>Important:</strong> On approval, your INRT ledger balance is reduced and matching tokens are
              burned on-chain. Payout (UPI / bank) is then processed by operations.
            </div>
            <form onSubmit={submitWithdrawRequest}>
              <div className="adminPvField">
                <label htmlFor="wPay">Withdrawal method</label>
                <select
                  id="wPay"
                  value={wdMethod}
                  onChange={(e) => setWdMethod(e.target.value as DashboardPayMethod)}
                  disabled={submittingWithdraw}
                >
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="card">Card / gateway refund</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="adminPvField">
                <label htmlFor="wPayout">Payout details (required)</label>
                <textarea
                  id="wPayout"
                  value={wdPayoutDetails}
                  onChange={(e) => setWdPayoutDetails(e.target.value)}
                  placeholder="e.g. UPI ID you want paid to, or bank account number + IFSC + account name, or instructions for card/other"
                  rows={3}
                  maxLength={2000}
                  disabled={submittingWithdraw}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    minHeight: '4.5rem',
                    borderRadius: '0.5rem',
                    padding: '0.65rem 0.75rem',
                    border: '1px solid var(--pv-card-border)',
                    background: 'var(--pv-row-bg)',
                    color: 'var(--pv-text)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div className="adminPvField">
                <label htmlFor="wAmt">Amount (INRT)</label>
                <input
                  id="wAmt"
                  value={wdReqAmt}
                  onChange={(e) => setWdReqAmt(e.target.value)}
                  required
                  disabled={submittingWithdraw}
                />
              </div>
              <button type="submit" className="adminPvBtn adminPvBtnPrimary" disabled={submittingWithdraw}>
                {submittingWithdraw ? (
                  <>
                    <Loader2 size={16} className="adminPvSpin" /> Submitting…
                  </>
                ) : (
                  'Submit withdraw request'
                )}
              </button>
            </form>
          </div>
          <div className="adminPvCard inrtCardPro max-w-xl">
            <h3 className="inrtSectionTitle">BSC wallet</h3>
            <p className="inrtSectionHint">
              Manage your on-chain address once — it is used automatically for deposits and stored on every withdrawal
              request.
            </p>
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
              {wallet || '—'}
            </p>
            <Link href="/dashboard/profile" className="adminPvBtn adminPvBtnGhost" style={{ marginTop: '0.75rem', display: 'inline-flex' }}>
              Edit in Profile
            </Link>
          </div>
        </div>
      </section>

      <section id="user-section-send" className="adminPvSection">
        <div className="adminPvCard max-w-3xl inrtCardPro">
          <h3 className="inrtSectionTitle">Send INRT (instant)</h3>
          <p className="inrtSectionHint">Internal transfer to another platform user — no admin approval.</p>
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
                    placeholder="0x… (42 characters)"
                    required={sendMode === 'wallet'}
                    pattern="^0x[a-fA-F0-9]{40}$"
                    title="Valid BSC address: 0x + 40 hex"
                    style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}
                  />
                </div>
              )}
              <div className="adminPvField" style={{ marginBottom: 0 }}>
                <label htmlFor="am">Amount</label>
                <input id="am" value={sendAmt} onChange={(e) => setSendAmt(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="adminPvBtn adminPvBtnPrimary" style={{ marginTop: '1rem' }} disabled={busy}>
              {busy ? <Loader2 size={16} className="adminPvSpin" /> : null}
              Send
            </button>
          </form>
        </div>
      </section>

      <section id="user-section-requests" className="adminPvSection">
        <div className="adminPvCard inrtCardPro">
          <h3 className="inrtSectionTitle">My requests</h3>
          <p className="inrtSectionHint">Deposit and withdrawal requests and their approval status.</p>
          <div className="adminPvTableWrap">
            <table className="adminPvTable">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--pv-muted)', textAlign: 'center' }}>
                      No requests yet
                    </td>
                  </tr>
                ) : (
                  requests.map((row) => (
                    <tr key={String(row._id)}>
                      <td style={{ textTransform: 'capitalize' }}>{String(row.type)}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace' }}>{String(row.amount)}</td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {row.type === 'deposit'
                          ? String(row.paymentMethod || '—').replace(/_/g, ' ')
                          : String(row.withdrawalMethod || '—').replace(/_/g, ' ')}
                      </td>
                      <td>
                        <span className={requestStatusClass(String(row.status))}>{String(row.status)}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: '12rem', wordBreak: 'break-word' }}>
                        {row.note ? String(row.note) : '—'}
                        {row.rejectReason ? (
                          <span style={{ color: 'var(--pv-muted)', display: 'block' }}>
                            {String(row.rejectReason)}
                          </span>
                        ) : null}
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

      <section id="user-section-history" className="adminPvSection">
        <div className="adminPvCard inrtCardPro">
          <h3 className="inrtSectionTitle">Transaction history</h3>
          <p className="inrtSectionHint">Ledger movements after admin actions and internal transfers.</p>
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
    </>
  );
}
