'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Wallet,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpCircle,
  Send,
  ChevronRight,
} from 'lucide-react';
import { useDashboardData } from '@/lib/dashboard-data-context';
import { DashboardChrome } from '@/components/dashboard/DashboardChrome';

export default function DashboardPage() {
  const { balance, spendable, ledgerLocked, wallet, txs, dataLoading, load } = useDashboardData();
  const [err, setErr] = useState('');

  return (
    <DashboardChrome title="Portfolio" subtitle="INRT · BNB Smart Chain" loginNext="/dashboard">
      {err ? <div className="adminPvAlert adminPvAlertErr">{err}</div> : null}

      <section className="adminPvSection inrtPortfolioGrid">
        <div className="inrtPortfolioMain">
          <div className="inrtCbTopBar">
            <button
              type="button"
              className="inrtCbIconBtn"
              onClick={() =>
                load().catch((e) => setErr(e instanceof Error ? e.message : 'Refresh failed'))
              }
              disabled={dataLoading}
            >
              <RefreshCw size={15} className={dataLoading ? 'adminPvSpin' : ''} />
              Refresh
            </button>
          </div>

          <p className="inrtCbKicker">Total balance</p>
          <h2 className="inrtCbHeroBal">
            {balance} <span className="inrtCbHeroUnit">INRT</span>
          </h2>
          {ledgerLocked && ledgerLocked !== '0' ? (
            <p className="inrtCbAddrLine" style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--pv-muted)' }}>Spendable · </span>
              {spendable} INRT
              <span style={{ color: 'var(--pv-muted)' }}> · Locked for pending withdraw · </span>
              {ledgerLocked} INRT
            </p>
          ) : null}
          <p className="inrtCbAddrLine">
            <span style={{ color: 'var(--pv-muted)' }}>Saved BSC wallet · </span>
            {wallet ? (
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{wallet}</span>
            ) : (
              <>
                Not set —{' '}
                <Link href="/dashboard/profile" style={{ color: '#0d9488', fontWeight: 600 }}>
                  add in Profile
                </Link>
              </>
            )}
          </p>

          <div className="inrtCbPills" role="group" aria-label="Quick actions">
            <Link href="/dashboard/deposit" className="inrtCbPill">
              <span className="inrtCbPillIcon">
                <ArrowDownToLine size={20} strokeWidth={2.25} />
              </span>
              Deposit
            </Link>
            <Link href="/dashboard/withdraw" className="inrtCbPill">
              <span className="inrtCbPillIcon">
                <ArrowUpCircle size={20} strokeWidth={2.25} />
              </span>
              Withdraw
            </Link>
            <Link href="/dashboard/send" className="inrtCbPill">
              <span className="inrtCbPillIcon">
                <Send size={20} strokeWidth={2.25} />
              </span>
              Send
            </Link>
          </div>

          <div className="inrtCbListBlock inrtPortfolioAssets">
            <div className="inrtCbListHead">
              <h3>Assets</h3>
            </div>
            <Link href="/dashboard/send" className="inrtCbRow">
              <div className="inrtCbRowIcon">IN</div>
              <div className="inrtCbRowMeta">
                <span className="inrtCbRowTitle">INRT</span>
                <span className="inrtCbRowHint">BEP-20 · BNB Smart Chain</span>
              </div>
              <div className="inrtCbRowRight">
                <span className="inrtCbRowAmt">{balance}</span>
                <ChevronRight size={18} style={{ color: 'var(--pv-muted)', opacity: 0.7 }} />
              </div>
            </Link>
          </div>
        </div>

        <aside className="inrtPortfolioSide">
          {txs.length > 0 ? (
            <div className="inrtCbListBlock inrtPortfolioActivity">
              <div className="inrtCbListHead">
                <h3>Recent activity</h3>
                <Link href="/dashboard/history" className="inrtCbLinkBtn">
                  View all
                </Link>
              </div>
              <div className="inrtCbActivityCard">
                {txs.slice(0, 5).map((row) => (
                  <Link key={String(row._id)} href="/dashboard/history" className="inrtCbActivityRow">
                    <div className="inrtCbActivityDot">
                      <Wallet size={14} />
                    </div>
                    <div className="inrtCbRowMeta" style={{ flex: 1 }}>
                      <span className="inrtCbRowTitle" style={{ fontSize: '0.875rem' }}>
                        {String(row.type)}
                      </span>
                      <span className="inrtCbRowHint">
                        {row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'}
                      </span>
                    </div>
                    <span className="inrtCbRowAmt" style={{ fontSize: '0.85rem' }}>
                      {String(row.amount)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="inrtPortfolioEmptySide">
              <p style={{ margin: 0, color: 'var(--pv-muted)', fontSize: '0.875rem' }}>
                No activity yet. Deposits and transfers will show here.
              </p>
              <Link href="/dashboard/deposit" className="inrtCbLinkBtn" style={{ marginTop: '0.75rem' }}>
                Make a deposit
              </Link>
            </div>
          )}
        </aside>
      </section>
    </DashboardChrome>
  );
}
