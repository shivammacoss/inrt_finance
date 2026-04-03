import type { PaymentRails } from '@/lib/api';
import type { DashboardPayMethod } from './dashboard-types';

export function PaymentInstructions({
  rails,
  method,
}: {
  rails: PaymentRails | null;
  method: DashboardPayMethod;
}) {
  if (!rails) {
    return (
      <div
        className="adminPvAlert"
        style={{ marginTop: '0.5rem', fontSize: '0.8125rem', borderColor: 'var(--pv-card-border)' }}
      >
        Set <code style={{ fontSize: '0.75rem' }}>PAYMENT_*</code> in the API <code style={{ fontSize: '0.75rem' }}>.env</code>{' '}
        to show UPI / bank details here. You can still submit a request and paste your transaction reference below.
      </div>
    );
  }

  if (method === 'upi') {
    const { payToId, payToName } = rails.upi;
    return (
      <div className="adminPvField" style={{ marginBottom: 0 }}>
        <span className="adminPvLabel">Pay with UPI</span>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem' }}>
          {payToId ? (
            <>
              Send to <strong style={{ fontFamily: 'ui-monospace, monospace' }}>{payToId}</strong>
              {payToName ? <> · beneficiary name: {payToName}</> : null}
            </>
          ) : (
            <>UPI ID is not configured on the server — describe your payment in the reference field.</>
          )}
        </p>
      </div>
    );
  }

  if (method === 'bank_transfer') {
    const b = rails.bank_transfer;
    const hasAny = Boolean(b.accountNumber || b.ifsc || b.accountName || b.bankName);
    return (
      <div className="adminPvField" style={{ marginBottom: 0 }}>
        <span className="adminPvLabel">Bank transfer</span>
        {hasAny ? (
          <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', fontSize: '0.875rem' }}>
            {b.accountName ? <li>Account name: {b.accountName}</li> : null}
            {b.bankName ? <li>Bank: {b.bankName}</li> : null}
            {b.accountNumber ? (
              <li>
                Account no.: <span style={{ fontFamily: 'ui-monospace, monospace' }}>{b.accountNumber}</span>
              </li>
            ) : null}
            {b.ifsc ? (
              <li>
                IFSC: <span style={{ fontFamily: 'ui-monospace, monospace' }}>{b.ifsc}</span>
              </li>
            ) : null}
          </ul>
        ) : (
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem' }}>
            Bank details are not configured — add <code style={{ fontSize: '0.75rem' }}>PAYMENT_BANK_*</code> on the
            server or put transfer details in the reference field.
          </p>
        )}
      </div>
    );
  }

  if (method === 'card') {
    return (
      <div className="adminPvField" style={{ marginBottom: 0 }}>
        <span className="adminPvLabel">Card payment</span>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', lineHeight: 1.5 }}>{rails.card.instructions}</p>
      </div>
    );
  }

  return (
    <div className="adminPvField" style={{ marginBottom: 0 }}>
      <span className="adminPvLabel">Other methods</span>
      <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', lineHeight: 1.5 }}>{rails.other.instructions}</p>
    </div>
  );
}
