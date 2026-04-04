'use client';

import { useDashboardData } from '@/lib/dashboard-data-context';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';

export default function DashboardHistoryPage() {
  const { txs } = useDashboardData();

  return (
    <>
      <section className="adminPvSection">
        <p className="inrtCbStepLabel">History</p>
        <div className="adminPvCard inrtCardPro">
          <h3 className="inrtSectionTitle">Transaction history</h3>
          <p className="inrtSectionHint">Movements from admin actions and internal transfers.</p>
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
        <DashboardBackLink />
      </section>
    </>
  );
}
