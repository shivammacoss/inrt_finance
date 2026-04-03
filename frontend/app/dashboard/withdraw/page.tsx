'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useDashboardData } from '@/lib/dashboard-data-context';
import { DashboardChrome } from '@/components/dashboard/DashboardChrome';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';
import type { DashboardPayMethod } from '@/components/dashboard/dashboard-types';

export default function DashboardWithdrawPage() {
  const { user } = useAuth();
  const { spendable, wallet, load } = useDashboardData();
  const [wdReqAmt, setWdReqAmt] = useState('');
  const [wdMethod, setWdMethod] = useState<DashboardPayMethod>('upi');
  const [wdPayoutDetails, setWdPayoutDetails] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submitting) return;
    const amt = wdReqAmt.trim();
    const bal = parseFloat(spendable);
    const a = parseFloat(amt);
    if (!(a > 0)) {
      setError('Enter a valid amount');
      return;
    }
    if (!Number.isNaN(bal) && a > bal) {
      setError('Amount cannot exceed your spendable balance (total minus pending withdraw lock)');
      return;
    }
    if (
      !window.confirm(
        'Submit this withdrawal request? Your spendable balance will be locked until admin approves or rejects.'
      )
    ) {
      return;
    }
    const payout = wdPayoutDetails.trim();
    if (!payout) {
      setError('Enter payout details: UPI ID, bank account + IFSC, or instructions for card/other');
      return;
    }
    setError('');
    setMsg('');
    setSubmitting(true);
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
      setSubmitting(false);
    }
  }

  return (
    <DashboardChrome title="Withdraw" subtitle="Request payout off-platform" loginNext="/dashboard/withdraw">
      {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
      {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}

      <section className="adminPvSection">
        <p className="inrtCbStepLabel">Cash out</p>
        <div className="adminPvGrid2" style={{ alignItems: 'start' }}>
          <div className="adminPvCard inrtCardPro max-w-xl">
            <h3 className="inrtSectionTitle">Request withdrawal</h3>
            <p className="inrtSectionHint">
              Payout method is how you receive funds. Your BSC wallet on file is used for verification — see{' '}
              <Link href="/dashboard/profile" style={{ color: '#0d9488', fontWeight: 600 }}>
                Profile
              </Link>
              .
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
              <strong>Important:</strong> On approval, ledger balance is reduced and tokens are burned on-chain.
              UPI/bank payout is completed by operations.
            </div>
            <form onSubmit={onSubmit}>
              <div className="adminPvField">
                <label htmlFor="wPay">Withdrawal method</label>
                <select
                  id="wPay"
                  value={wdMethod}
                  onChange={(e) => setWdMethod(e.target.value as DashboardPayMethod)}
                  disabled={submitting}
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
                  placeholder="e.g. UPI ID, or bank account + IFSC + name"
                  rows={3}
                  maxLength={2000}
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
              <button type="submit" className="adminPvBtn adminPvBtnPrimary" disabled={submitting}>
                {submitting ? (
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
            <h3 className="inrtSectionTitle">On file</h3>
            <p className="inrtSectionHint">BSC address linked to your account.</p>
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
              {wallet || '—'}
            </p>
            <Link href="/dashboard/profile" className="adminPvBtn adminPvBtnGhost" style={{ marginTop: '0.75rem', display: 'inline-flex' }}>
              Edit in Profile
            </Link>
          </div>
        </div>
        <DashboardBackLink />
      </section>
    </DashboardChrome>
  );
}
