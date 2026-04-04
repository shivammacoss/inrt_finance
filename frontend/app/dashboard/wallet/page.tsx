'use client';

import Link from 'next/link';
import QRCode from 'react-qr-code';
import { Wallet } from 'lucide-react';
import { useDashboardData } from '@/lib/dashboard-data-context';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';

export default function DashboardWalletPage() {
  const { wallet, depositAddr, contractAddr, balance, dataLoading, load } = useDashboardData();

  return (
    <>
      <section className="adminPvSection">
        <div className="adminPvGrid2" style={{ alignItems: 'start' }}>
          <div className="adminPvCard inrtCardPro max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="adminPvIconBox green">
                <Wallet size={24} />
              </div>
              <div>
                <h2 className="inrtSectionTitle" style={{ margin: 0 }}>
                  Your BSC wallet
                </h2>
                <p className="inrtSectionHint" style={{ margin: 0 }}>
                  Used for INRT credits and withdrawal records. Edit in Profile.
                </p>
              </div>
            </div>
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
              {wallet || '—'}
            </p>
            <p className="inrtSectionHint" style={{ marginTop: '0.75rem' }}>
              Ledger balance: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{balance} INRT</strong>
            </p>
            <Link href="/dashboard/profile" className="adminPvBtn adminPvBtnGhost" style={{ marginTop: '0.75rem', display: 'inline-flex' }}>
              Edit in Profile
            </Link>
          </div>

          <div className="adminPvCard inrtCardPro max-w-xl">
            <h3 className="inrtSectionTitle">Platform deposit address</h3>
            <p className="inrtSectionHint">
              Send assets here only when your flow requires the custodian address. You still need an approved deposit
              request — start from{' '}
              <Link href="/dashboard/deposit" className="inrtCbLinkBtn">
                Deposit
              </Link>
              .
            </p>
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
            <p style={{ fontSize: '0.75rem', color: 'var(--pv-muted)', marginTop: '0.5rem' }}>
              Token contract:{' '}
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{contractAddr || '—'}</span>
            </p>
            {depositAddr ? (
              <div className="inrtQrWrap">
                <QRCode value={depositAddr} size={168} />
              </div>
            ) : null}
            <button
              type="button"
              className="adminPvBtn adminPvBtnGhost"
              style={{ marginTop: '0.75rem' }}
              onClick={() => load()}
              disabled={dataLoading}
            >
              Refresh addresses
            </button>
          </div>
        </div>
        <DashboardBackLink />
      </section>
    </>
  );
}
