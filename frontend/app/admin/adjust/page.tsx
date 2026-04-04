'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAdminData } from '@/lib/admin-data-context';
import { AdminBackLink } from '@/components/admin/AdminBackLink';

export default function AdminAdjustPage() {
  const { user } = useAuth();
  const { load } = useAdminData();
  const [adjUser, setAdjUser] = useState('');
  const [adjDelta, setAdjDelta] = useState('');
  const [adjNote, setAdjNote] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function onAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const r = await api.adminAdjust({
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

  return (
    <>
      {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
      {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}

      <section className="adminPvSection">
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
        <AdminBackLink />
      </section>
    </>
  );
}
