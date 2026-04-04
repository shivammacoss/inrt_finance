'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAdminData } from '@/lib/admin-data-context';
import { AdminBackLink } from '@/components/admin/AdminBackLink';

export default function AdminMintBurnPage() {
  const { user } = useAuth();
  const { load } = useAdminData();
  const [mintTo, setMintTo] = useState('');
  const [mintAmt, setMintAmt] = useState('');
  const [creditUserId, setCreditUserId] = useState('');
  const [burnAmt, setBurnAmt] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function onMint(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const body: { recipientAddress: string; amount: string; creditUserId?: string } = {
        recipientAddress: mintTo.trim(),
        amount: mintAmt.trim(),
      };
      if (creditUserId.trim()) body.creditUserId = creditUserId.trim();
      const r = await api.adminMint(body);
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
    if (!user) return;
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const r = await api.adminBurn(burnAmt.trim());
      setMsg(`Burned. Tx: ${r.txHash}`);
      setBurnAmt('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Burn failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
      {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}

      <section className="adminPvSection">
        <div className="adminPvGrid2">
          <div className="adminPvCard">
            <h3>Mint (on-chain)</h3>
            <p style={{ color: 'var(--pv-muted)', fontSize: '0.8125rem', marginTop: '-0.35rem' }}>
              Recipient must be a real BSC address: <strong>0x</strong> plus exactly <strong>40</strong> hex characters.
              On-chain mint needs a valid <strong>PRIVATE_KEY</strong> in backend <code style={{ fontSize: '0.85em' }}>.env</code>.
            </p>
            <form onSubmit={onMint}>
              <div className="adminPvField">
                <label>Recipient address</label>
                <input
                  value={mintTo}
                  onChange={(e) => setMintTo(e.target.value)}
                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                  pattern="^0x[a-fA-F0-9]{40}$"
                  title="0x followed by 40 hexadecimal characters"
                  required
                />
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
        <AdminBackLink />
      </section>
    </>
  );
}
