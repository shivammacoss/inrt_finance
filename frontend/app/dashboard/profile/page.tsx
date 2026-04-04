'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';

const WALLET_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setWalletAddress(user.walletAddress || '');
    }
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setMsg('');
    const w = walletAddress.trim();
    if (w && !WALLET_PATTERN.test(w)) {
      setError('Wallet must start with 0x and be exactly 42 characters (0x + 40 hex digits).');
      return;
    }
    const payload: { fullName: string; phone: string; walletAddress?: string } = {
      fullName: fullName.trim(),
      phone: phone.trim(),
    };
    if (w) payload.walletAddress = w;
    setSaving(true);
    try {
      const r = await api.putProfile(payload);
      setMsg(r.message || 'Saved');
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
      {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}

      <div className="inrtProfilePage">
        <div className="inrtProfileCard adminPvCard inrtCardPro">
          <div className="inrtProfileFormCol">
            <div className="inrtProfileFormHead">
              <h2 className="inrtSectionTitle" style={{ margin: 0 }}>
                Account details
              </h2>
              <p className="inrtSectionHint" style={{ margin: '0.25rem 0 0' }}>
                Name and phone are shown in your header when set. BSC wallet powers deposits and withdrawals.
              </p>
            </div>

            <form onSubmit={onSubmit} className="inrtProfileForm">
              <div className="adminPvField">
                <label htmlFor="fn">Full name</label>
                <input
                  id="fn"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  maxLength={120}
                  disabled={saving}
                  autoComplete="name"
                />
              </div>
              <div className="adminPvField">
                <label htmlFor="ph">Phone number</label>
                <input
                  id="ph"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  maxLength={20}
                  disabled={saving}
                  autoComplete="tel"
                />
              </div>
              <div className="adminPvField">
                <label htmlFor="em">Email</label>
                <input id="em" type="email" value={user?.email || ''} readOnly disabled className="opacity-80" />
              </div>
              <div className="adminPvField">
                <label htmlFor="wa">Wallet address (BSC)</label>
                <input
                  id="wa"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x… (42 characters)"
                  disabled={saving}
                  title="Optional until you need on-chain deposit / withdraw"
                  style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}
                />
              </div>
              <button type="submit" className="adminPvBtn adminPvBtnPrimary inrtProfileSaveBtn" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="adminPvSpin" /> Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </form>
          </div>

          <DashboardBackLink href="/dashboard" label="← Back to portfolio" />
        </div>
      </div>
    </>
  );
}
