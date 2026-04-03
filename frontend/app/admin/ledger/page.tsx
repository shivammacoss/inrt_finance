'use client';

import { useAdminData } from '@/lib/admin-data-context';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { AdminBackLink } from '@/components/admin/AdminBackLink';

export default function AdminLedgerPage() {
  const { txs, actions } = useAdminData();

  return (
    <AdminChrome title="Transactions" subtitle="Ledger & admin actions" loginNext="/admin/ledger">
      <section className="adminPvSection">
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
        <AdminBackLink />
      </section>
    </AdminChrome>
  );
}
