'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAdminData } from '@/lib/admin-data-context';
import { AdminBackLink } from '@/components/admin/AdminBackLink';

type FilterKey = 'queue' | 'pending' | 'all';

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const { load } = useAdminData();
  const [filter, setFilter] = useState<FilterKey>('queue');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [actionReqId, setActionReqId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setListLoading(true);
    try {
      const status = filter === 'queue' ? 'queue' : filter;
      const { requests } = await api.adminListRequests(status);
      setRows(requests);
    } catch {
      setRows([]);
    } finally {
      setListLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  async function approveReq(id: string) {
    if (!user || actionReqId) return;
    setError('');
    setMsg('');
    setActionReqId(id);
    try {
      const r = await api.adminApproveRequest(id);
      setMsg(`Approved. ${r.txHash ? `Tx: ${r.txHash}` : ''}`);
      await load();
      await fetchRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setActionReqId(null);
    }
  }

  async function rejectReq(id: string) {
    if (!user || actionReqId) return;
    const reason = typeof window !== 'undefined' ? window.prompt('Reject reason (optional)') : '';
    setError('');
    setMsg('');
    setActionReqId(id);
    try {
      await api.adminRejectRequest({ requestId: id, reason: reason || undefined });
      setMsg('Request rejected');
      await load();
      await fetchRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    } finally {
      setActionReqId(null);
    }
  }

  return (
    <>
      {error ? <div className="adminPvAlert adminPvAlertErr">{error}</div> : null}
      {msg ? <div className="adminPvAlert adminPvAlertOk">{msg}</div> : null}

      <section className="adminPvSection">
        <div className="adminPvCard">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Deposit & withdraw requests</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(['queue', 'pending', 'all'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={filter === f ? 'adminPvBtn adminPvBtnPrimary' : 'adminPvBtn adminPvBtnGhost'}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
                  onClick={() => setFilter(f)}
                  disabled={!!actionReqId}
                >
                  {f === 'queue' ? 'Queue' : f}
                </button>
              ))}
            </div>
          </div>
          <p style={{ color: 'var(--pv-muted)', fontSize: '0.875rem', marginTop: '-0.25rem' }}>
            Approve runs on-chain mint (deposit) or ledger debit + burn (withdraw). Reject unlocks a pending withdraw
            lock.
          </p>
          {listLoading ? (
            <p style={{ color: 'var(--pv-muted)' }}>Loading…</p>
          ) : (
            <div className="adminPvTableWrap">
              <table className="adminPvTable">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Wallet</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Pay ref</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ color: 'var(--pv-muted)', textAlign: 'center' }}>
                        No requests
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const id = String(row._id);
                      const u = row.user as { email?: string; walletAddress?: string } | undefined;
                      const busyThis = actionReqId === id;
                      const pendingOnly = row.status === 'pending';
                      return (
                        <tr key={id}>
                          <td style={{ fontSize: '0.8rem' }}>{u?.email ?? '—'}</td>
                          <td style={{ fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace', maxWidth: '7rem', wordBreak: 'break-all' }}>
                            {String(row.walletAddress || u?.walletAddress || '—')}
                          </td>
                          <td>{String(row.type)}</td>
                          <td style={{ fontSize: '0.75rem' }}>
                            {row.type === 'deposit'
                              ? String(row.paymentMethod || '—')
                              : String(row.withdrawalMethod || '—')}
                          </td>
                          <td style={{ fontFamily: 'ui-monospace, monospace' }}>{String(row.amount)}</td>
                          <td>{String(row.status)}</td>
                          <td style={{ fontSize: '0.7rem', maxWidth: '6rem', wordBreak: 'break-word' }}>
                            {row.paymentReference ? String(row.paymentReference) : '—'}
                          </td>
                          <td style={{ fontSize: '0.75rem', maxWidth: '8rem', wordBreak: 'break-word' }}>
                            {row.note ? String(row.note) : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="adminPvBtn adminPvBtnPrimary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                disabled={!!actionReqId || !pendingOnly}
                                onClick={() => approveReq(id)}
                              >
                                {busyThis ? '…' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                className="adminPvBtn adminPvBtnDanger"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                disabled={!!actionReqId}
                                onClick={() => rejectReq(id)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <AdminBackLink />
      </section>
    </>
  );
}
