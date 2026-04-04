'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useDashboardData } from '@/lib/dashboard-data-context';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';

const BSC_ADDR_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export default function DashboardSendPage() {
  const { user } = useAuth();
  const { load } = useDashboardData();
  const [sendMode, setSendMode] = useState<'email' | 'wallet'>('email');
  const [toEmail, setToEmail] = useState('');
  const [toWallet, setToWallet] = useState('');
  const [sendAmt, setSendAmt] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
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

  return (
    <>
      {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
      {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}

      <section className="adminPvSection">
        <p className="inrtCbStepLabel">Transfer</p>
        <div className="adminPvCard max-w-3xl inrtCardPro">
          <h3 className="inrtSectionTitle">Send INRT (instant)</h3>
          <p className="inrtSectionHint">To another platform user — no admin approval.</p>
          <form onSubmit={onSubmit}>
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
        <DashboardBackLink />
      </section>
    </>
  );
}
