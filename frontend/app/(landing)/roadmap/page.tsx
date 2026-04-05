import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Roadmap — INRT Finance',
  description: 'INRT Finance roadmap: launch, community, platform development, and ecosystem expansion.',
};

const PANCAKESWAP_URL =
  'https://pancakeswap.finance/swap?outputCurrency=0x0000000000000000000000000000000000000000';

const phases = [
  {
    phase: 'Phase 1',
    title: 'Token Launch & Liquidity',
    status: 'completed',
    statusLabel: 'Completed',
    detail: 'Establish the asset and initial market depth.',
    milestones: [
      'BEP-20 smart contract deployment on BNB Smart Chain',
      'Initial liquidity provision on PancakeSwap',
      'Contract verification on BscScan',
      'Token distribution and initial community formation',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Website & Community Growth',
    status: 'active',
    statusLabel: 'In Progress',
    detail: 'Education, transparency, and aligned community.',
    milestones: [
      'Official INRT Finance website launch',
      'Community channels on Telegram and X (Twitter)',
      'Whitepaper and documentation release',
      'Social media presence and community engagement',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Platform Development',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    detail: 'Tools and interfaces for real-world usability.',
    milestones: [
      'Ledger platform with deposit, transfer, and withdrawal',
      'User dashboard with full transaction history',
      'Admin panel for institutional management',
      'API integrations for business settlement workflows',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Ecosystem Expansion',
    status: 'future',
    statusLabel: 'Future',
    detail: 'Partnerships and broader digital payment reach.',
    milestones: [
      'Strategic partnerships with merchants and platforms',
      'Multi-chain bridge exploration',
      'DeFi integrations (lending, staking)',
      'Institutional adoption and enterprise solutions',
    ],
  },
];

const statusColors: Record<string, { bg: string; color: string; dot: string }> = {
  completed: { bg: 'rgba(0,200,83,.12)', color: '#4ade80', dot: '#00c853' },
  active:    { bg: 'rgba(255,122,0,.12)', color: '#fb923c', dot: '#ff7a00' },
  upcoming:  { bg: 'rgba(59,130,246,.12)', color: '#60a5fa', dot: '#3b82f6' },
  future:    { bg: 'rgba(148,163,184,.1)', color: '#94a3b8', dot: '#64748b' },
};

export default function RoadmapPage() {
  return (
    <>
      {/* Page Hero */}
      <section style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem 2.5rem', textAlign: 'center', borderBottom: '1px solid var(--inrt-border)', background: 'linear-gradient(180deg,rgba(255,122,0,.06),transparent)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p className="inrt-eyebrow">Development Plan</p>
          <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: '1rem' }}>
            INRT Finance <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,var(--inrt-orange),var(--inrt-green))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Roadmap</em>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--inrt-muted)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 2rem' }}>
            A transparent, phased plan to build, grow, and expand the INRT ecosystem for real-world digital value transfer.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(statusColors).map(([key, val]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem', color: val.color }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: val.dot, display: 'inline-block' }} />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Phases */}
      <section className="inrt-section">
        <div className="inrt-section-inner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {phases.map((ph, i) => {
              const sc = statusColors[ph.status];
              return (
                <div key={ph.phase} className="inrt-glass-card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.75rem', alignItems: 'start', borderColor: ph.status === 'active' ? 'rgba(255,122,0,.3)' : undefined, boxShadow: ph.status === 'active' ? '0 0 30px rgba(255,122,0,.08)' : undefined }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem' }}>
                    <div className="inrt-phase-num">{i + 1}</div>
                    <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: sc.color, background: sc.bg, padding: '.22rem .55rem', borderRadius: 999, whiteSpace: 'nowrap', border: `1px solid ${sc.dot}40` }}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: sc.dot, marginRight: '.3rem', verticalAlign: 'middle' }} />
                      {ph.statusLabel}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--inrt-orange)', marginBottom: '.3rem' }}>{ph.phase}</p>
                    <h3 style={{ marginBottom: '.35rem' }}>{ph.title}</h3>
                    <p style={{ color: 'var(--inrt-muted)', fontSize: '.9rem', marginBottom: '1.25rem' }}>{ph.detail}</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {ph.milestones.map((m) => (
                        <li key={m} style={{ display: 'flex', alignItems: 'flex-start', gap: '.55rem', fontSize: '.875rem', color: ph.status === 'completed' ? 'var(--inrt-text)' : 'var(--inrt-muted)' }}>
                          <span style={{ color: ph.status === 'completed' ? '#4ade80' : 'var(--inrt-muted)', flexShrink: 0, marginTop: '.1rem' }}>
                            {ph.status === 'completed' ? '✓' : '○'}
                          </span>
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner inrt-grid-2">
          <div>
            <p className="inrt-eyebrow">Vision</p>
            <h2>Where we are headed</h2>
            <p className="lead">To create a globally accessible digital value system that removes the limitations of physical money and enables financial freedom for everyone, everywhere.</p>
            <p className="lead" style={{ marginTop: '1rem' }}>Every phase builds on the last — from establishing the asset, to building the community, to delivering real-world tools, to expanding globally.</p>
          </div>
          <div className="inrt-glass-card">
            <h3>Transparency first</h3>
            <p style={{ marginBottom: '1rem' }}>Our roadmap is public and progress is tracked openly. We believe accountability and clarity are the foundation of community trust.</p>
            <p style={{ marginBottom: '1.5rem', color: 'var(--inrt-muted)', fontSize: '.875rem' }}>Follow our progress on Telegram and X (Twitter) for real-time updates.</p>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <a href="https://t.me/inrtfinance" target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-ghost">Telegram</a>
              <a href="https://twitter.com/inrtfinance" target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-ghost">X / Twitter</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="inrt-section">
        <div className="inrt-section-inner" style={{ textAlign: 'center' }}>
          <p className="inrt-eyebrow">Join Us</p>
          <h2>Be part of the journey</h2>
          <p className="lead" style={{ margin: '0 auto 1.5rem' }}>Create your INRT account today and be part of the ecosystem as it grows through each phase.</p>
          <div className="inrt-hero-btns" style={{ justifyContent: 'center' }}>
            <Link href="/register" className="inrt-btn inrt-btn-primary">Create Account</Link>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">Buy INRT</a>
          </div>
        </div>
      </section>
    </>
  );
}
