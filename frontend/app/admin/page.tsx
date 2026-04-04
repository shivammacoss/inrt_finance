'use client';

import Link from 'next/link';
import {
  Users,
  Wallet,
  Landmark,
  Coins,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Inbox,
  SlidersHorizontal,
  ListOrdered,
} from 'lucide-react';
import { useState } from 'react';
import { useAdminData } from '@/lib/admin-data-context';

export default function AdminOverviewPage() {
  const { stats, dataLoading, load } = useAdminData();
  const [err, setErr] = useState('');

  const statCards = [
    { title: 'Total users', value: stats?.totalUsers ?? '—', icon: Users, tone: 'blue' as const },
    { title: 'Internal ledger (INRT)', value: stats?.totalInternalLedger ?? '—', icon: Wallet, tone: 'green' as const },
    { title: 'Circulating (ledger sum)', value: stats?.circulatingSupply ?? stats?.totalInternalLedger ?? '—', icon: Wallet, tone: 'green' as const },
    { title: 'Reserve cap (token)', value: stats?.reserveTokenCap || '—', icon: Landmark, tone: 'purple' as const },
    { title: 'Reserve INR (backing)', value: stats?.reserveINR || '—', icon: Landmark, tone: 'orange' as const },
    { title: 'Platform wallet (on-chain)', value: stats?.platformWalletOnChain ?? '—', icon: Landmark, tone: 'purple' as const },
    { title: 'Total supply (on-chain)', value: stats?.totalOnChainSupply ?? 'n/a', icon: Coins, tone: 'orange' as const },
    { title: 'Tracked mints (admin)', value: stats?.trackedMintSum ?? '—', icon: TrendingUp, tone: 'green' as const },
    { title: 'Tracked burns (admin)', value: stats?.trackedBurnSum ?? '—', icon: TrendingDown, tone: 'purple' as const },
  ];

  const quick = [
    { href: '/admin/requests', label: 'Requests queue', icon: Inbox },
    { href: '/admin/mint-burn', label: 'Mint / Burn', icon: Coins },
    { href: '/admin/adjust', label: 'Adjust balance', icon: SlidersHorizontal },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/ledger', label: 'Transactions', icon: ListOrdered },
  ];

  return (
    <>
      {err ? <div className="adminPvAlert adminPvAlertErr">{err}</div> : null}

      <section className="adminPvSection">
        <div className="flex items-center justify-end mb-3">
          <button
            type="button"
            className="adminPvBtn adminPvBtnGhost"
            onClick={() => load().catch((e) => setErr(e instanceof Error ? e.message : 'Refresh failed'))}
            disabled={dataLoading}
          >
            <RefreshCw size={16} className={dataLoading ? 'adminPvSpin' : ''} />
            Refresh
          </button>
        </div>

        <div className="adminPvStatGrid">
          {statCards.map((s) => (
            <div key={s.title} className="adminPvStatCard">
              <div className="adminPvStatTop">
                <div className={`adminPvIconBox ${s.tone}`}>
                  <s.icon size={20} />
                </div>
                <span className="flex items-center gap-0.5 text-sm" style={{ color: '#22c55e' }}>
                  <ArrowUpRight size={14} />
                </span>
              </div>
              <p className="adminPvStatLabel">{s.title}</p>
              <p className="adminPvStatValue">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="adminPvCard" style={{ marginTop: '1.25rem' }}>
          <h3 style={{ marginTop: 0 }}>Go to section</h3>
          <p style={{ color: 'var(--pv-muted)', fontSize: '0.875rem', marginTop: '-0.25rem' }}>
            Each area opens on its own page — no long scroll.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
              gap: '0.5rem',
              marginTop: '0.75rem',
            }}
          >
            {quick.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="adminPvBtn adminPvBtnGhost"
                style={{ justifyContent: 'flex-start', textDecoration: 'none' }}
              >
                <q.icon size={16} />
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
