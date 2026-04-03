'use client';

import Link from 'next/link';
import QRCode from 'react-qr-code';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useDashboardData } from '@/lib/dashboard-data-context';
import { DashboardChrome } from '@/components/dashboard/DashboardChrome';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';
import { PaymentInstructions } from '@/components/dashboard/PaymentInstructions';
import type { DashboardPayMethod } from '@/components/dashboard/dashboard-types';

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  const w = window as Window & { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } };
  if (w.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Razorpay Checkout'));
    document.body.appendChild(s);
  });
}

export default function DashboardDepositPage() {
  const { user } = useAuth();
  const { depositAddr, contractAddr, paymentRails, load } = useDashboardData();
  const [depReqAmt, setDepReqAmt] = useState('');
  const [depPaymentMethod, setDepPaymentMethod] = useState<DashboardPayMethod>('upi');
  const [depRef, setDepRef] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rzAmount, setRzAmount] = useState('');
  const [rzError, setRzError] = useState('');
  const [rzMsg, setRzMsg] = useState('');
  const [rzPaying, setRzPaying] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submitting) return;
    setError('');
    setMsg('');
    setSubmitting(true);
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
      setSubmitting(false);
    }
  }

  async function onRazorpayPay() {
    if (!user || rzPaying) return;
    setRzError('');
    setRzMsg('');
    const trimmed = rzAmount.trim();
    if (!trimmed) {
      setRzError('Enter an amount in INR');
      return;
    }
    setRzPaying(true);
    try {
      const order = await api.createRazorpayOrder({ amount: trimmed });
      await loadRazorpayScript();
      const RZ = (window as Window & { Razorpay?: new (o: Record<string, unknown>) => { open: () => void } })
        .Razorpay;
      if (!RZ) throw new Error('Razorpay Checkout unavailable');

      await new Promise<void>((resolve, reject) => {
        const opts = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'INRT',
          description: `Deposit — ~${order.inrtAmount} INRT`,
          order_id: order.orderId,
          prefill: {
            email: user.email || undefined,
            name: user.fullName || undefined,
          },
          theme: { color: '#0d9488' },
          handler: async (response: RazorpayHandlerResponse) => {
            try {
              const v = await api.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: order.amountInr,
              });
              if (v.duplicate) {
                setRzMsg('Payment already recorded. Your balance is up to date.');
              } else if (v.mode === 'auto') {
                setRzMsg(
                  v.txHash
                    ? `Payment successful. Minted on-chain. Tx: ${v.txHash.slice(0, 18)}…`
                    : 'Payment successful.'
                );
              } else {
                setRzMsg(v.message || 'Payment verified. Awaiting admin approval to mint INRT.');
              }
              await load();
            } catch (e) {
              setRzError(e instanceof Error ? e.message : 'Verification failed');
            } finally {
              resolve();
            }
          },
          modal: {
            ondismiss: () => resolve(),
          },
        };
        const instance = new RZ(opts);
        instance.open();
      });
    } catch (err) {
      setRzError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setRzPaying(false);
    }
  }

  return (
    <DashboardChrome title="Deposit" subtitle="Request INRT after you pay" loginNext="/dashboard/deposit">
      {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
      {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}
      {rzError ? <div className="adminPvAlert adminPvAlertErr">{rzError}</div> : null}
      {rzMsg ? <div className="adminPvAlert adminPvAlertOk">{rzMsg}</div> : null}

      <section className="adminPvSection">
        <p className="inrtCbStepLabel">Cash in</p>
        <div className="adminPvCard max-w-xl inrtCardPro" style={{ marginBottom: '1.25rem' }}>
          <h3 className="inrtSectionTitle">Pay with Razorpay</h3>
          <p className="inrtSectionHint">
            UPI, cards, and netbanking in INR. The API verifies the payment signature before crediting INRT; save a BSC
            wallet in{' '}
            <Link href="/dashboard/profile" style={{ color: '#0d9488', fontWeight: 600 }}>
              Profile
            </Link>
            . Configure <code className="text-xs">RAZORPAY_KEY_ID</code> and{' '}
            <code className="text-xs">RAZORPAY_KEY_SECRET</code> on the server.
          </p>
          <div className="adminPvField">
            <label htmlFor="rzInr">Amount (INR)</label>
            <input
              id="rzInr"
              value={rzAmount}
              onChange={(e) => setRzAmount(e.target.value)}
              placeholder="e.g. 100"
              inputMode="decimal"
              disabled={rzPaying}
            />
          </div>
          <button
            type="button"
            className="adminPvBtn adminPvBtnPrimary"
            disabled={rzPaying}
            onClick={() => void onRazorpayPay()}
          >
            {rzPaying ? (
              <>
                <Loader2 size={16} className="adminPvSpin" /> Opening checkout…
              </>
            ) : (
              'Pay now'
            )}
          </button>
        </div>
        <div className="adminPvGrid2" style={{ alignItems: 'start' }}>
          <div className="adminPvCard max-w-xl inrtCardPro">
            <h3 className="inrtSectionTitle">Request deposit</h3>
            <p className="inrtSectionHint">
              After payment, submit this request. Admin credits INRT to the BSC wallet in your{' '}
              <Link href="/dashboard/profile" style={{ color: '#0d9488', fontWeight: 600 }}>
                Profile
              </Link>
              . On-chain address & QR:{' '}
              <Link href="/dashboard/profile" style={{ color: '#0d9488', fontWeight: 600 }}>
                Profile
              </Link>
              .
            </p>
            <form onSubmit={onSubmit}>
              <div className="adminPvField">
                <label htmlFor="dAmt">Amount (INRT)</label>
                <input
                  id="dAmt"
                  value={depReqAmt}
                  onChange={(e) => setDepReqAmt(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="adminPvField">
                <label htmlFor="dPay">Payment method</label>
                <select
                  id="dPay"
                  value={depPaymentMethod}
                  onChange={(e) => setDepPaymentMethod(e.target.value as DashboardPayMethod)}
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
              <button type="submit" className="adminPvBtn adminPvBtnPrimary" disabled={submitting}>
                {submitting ? (
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
            <h3 className="inrtSectionTitle">Custodian address (reference)</h3>
            <p className="inrtSectionHint">Same details as on the Wallet page — for convenience while you deposit.</p>
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
        <DashboardBackLink />
      </section>
    </DashboardChrome>
  );
}
