'use client';

import { useDashboardData } from '@/lib/dashboard-data-context';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';
import { requestStatusClass } from '@/components/dashboard/request-status';

export default function DashboardRequestsPage() {
  const { requests } = useDashboardData();

  return (
    <>
      <section className="adminPvSection">
        <p className="inrtCbStepLabel">Pending</p>
        <div className="adminPvCard inrtCardPro">
          <h3 className="inrtSectionTitle">All requests</h3>
          <p className="inrtSectionHint">Status updates when an admin approves or rejects.</p>
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
        <DashboardBackLink />
      </section>
    </>
  );
}
