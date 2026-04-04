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

export default function DashboardPage() {
  const { balance, spendable, ledgerLocked, wallet, txs, dataLoading, load } = useDashboardData();
  const [err, setErr] = useState('');

  return (
    <>
      {err ? <div className="adminPvAlert adminPvAlertErr">{err}</div> : null}

      <section className="adminPvSection inrtPortfolioGrid">
        <div className="inrtPortfolioMain">
          <div className="inrtFxHeroRow">
            <div className="inrtFxHeroCopy min-w-0 flex-1">
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
                    Not set — <Link href="/dashboard/profile">add in Profile</Link>
                  </>
                )}
              </p>
            </div>

            <div className="inrtFxSpark" aria-hidden>
              <svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="inrtSparkStroke" x1="0" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f0b90b" />
                    <stop offset="0.45" stopColor="#fcd535" />
                    <stop offset="1" stopColor="#2de1e1" />
                  </linearGradient>
                  <linearGradient id="inrtSparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#f0b90b" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#2de1e1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M4 58 C 36 52, 48 20, 72 28 S 108 8, 132 22 S 168 4, 196 18 L 216 12"
                  stroke="url(#inrtSparkStroke)"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 58 C 36 52, 48 20, 72 28 S 108 8, 132 22 S 168 4, 196 18 L 216 12 V 72 H 4 Z"
                  fill="url(#inrtSparkFill)"
                  opacity="0.5"
                />
                <circle cx="216" cy="12" r="4" fill="#fcd535" />
              </svg>
              <span className="inrtFxSparkCaption">Pulse</span>
            </div>
          </div>

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
    </>
  );
}
