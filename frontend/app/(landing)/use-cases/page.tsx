import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Use Cases — INRT Finance',
  description: 'Peer-to-peer transfers, cross-border payments, settlements, and digital payment ecosystem use cases for INRT.',
};

const PANCAKESWAP_URL =
  'https://pancakeswap.finance/swap?outputCurrency=0x0000000000000000000000000000000000000000';

const useCases = [
  {
    icon: '👤',
    title: 'Peer-to-Peer Transfers',
    tag: 'P2P',
    desc: 'Send INRT directly to any wallet address instantly. No banks, no intermediaries, no delays. Perfect for splitting bills, sending gifts, or paying individuals across the globe.',
    features: ['Instant settlement', 'No bank required', 'Any wallet worldwide', 'Minimal fees'],
  },
  {
    icon: '🌍',
    title: 'Cross-Border Payments',
    tag: 'International',
    desc: 'Bypass costly SWIFT transfers and multi-day waiting periods. INRT settles internationally in seconds, making it ideal for remittances and international business payments.',
    features: ['No SWIFT fees', 'Seconds vs. days', 'No currency conversion', 'Fully traceable'],
  },
  {
    icon: '🏢',
    title: 'Business Settlements',
    tag: 'B2B',
    desc: 'Streamline invoice settlements between businesses using a transparent, immutable ledger. Reduce reconciliation overhead and eliminate payment disputes with verifiable on-chain records.',
    features: ['Automated settlements', 'Immutable records', 'Dispute reduction', 'Audit trail'],
  },
  {
    icon: '🛒',
    title: 'Digital Payments Ecosystem',
    tag: 'Commerce',
    desc: 'Accept INRT as a payment method for digital goods and services. Integrate the INRT payment rail into any platform or marketplace for instant, low-cost transactions.',
    features: ['Merchant integration', 'Instant confirmation', 'Low processing fee', 'Global reach'],
  },
  {
    icon: '🏦',
    title: 'Lending & Internal Finance',
    tag: 'DeFi',
    desc: 'Use INRT within internal financial systems, lending protocols, and settlement layers. The programmable nature of BEP-20 tokens enables complex financial workflows.',
    features: ['Smart contract ready', 'Programmable logic', 'Internal ledger', 'DeFi compatible'],
  },
];

export default function UseCasesPage() {
  return (
    <>
      {/* Page Hero */}
      <section style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem 2.5rem', textAlign: 'center', borderBottom: '1px solid var(--inrt-border)', background: 'linear-gradient(180deg,rgba(255,122,0,.06),transparent)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p className="inrt-eyebrow">Applications</p>
          <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: '1rem' }}>
            Real-World <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,var(--inrt-orange),var(--inrt-green))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Use Cases</em>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--inrt-muted)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 2rem' }}>
            INRT is designed for real financial applications — not just trading. Discover how it powers everyday and enterprise value transfer.
          </p>
          <div className="inrt-hero-btns">
            <Link href="/register" className="inrt-btn inrt-btn-primary">Get Started</Link>
            <Link href="/token" className="inrt-btn inrt-btn-ghost">View Token Info</Link>
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="inrt-section">
        <div className="inrt-section-inner">
          <p className="inrt-eyebrow">Five Core Applications</p>
          <h2>What you can do with INRT</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2.5rem' }}>
            {useCases.map((uc, i) => (
              <div key={uc.title} className="inrt-glass-card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.75rem', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem' }}>
                  <div className="inrt-feature-ico" style={{ width: 56, height: 56, fontSize: '1.6rem', marginBottom: 0, flexShrink: 0 }}>{uc.icon}</div>
                  <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--inrt-orange)', background: 'rgba(255,122,0,.1)', padding: '.2rem .5rem', borderRadius: 999, whiteSpace: 'nowrap' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{uc.title}</h3>
                    <span style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--inrt-green)', background: 'rgba(0,200,83,.1)', border: '1px solid rgba(0,200,83,.2)', padding: '.18rem .55rem', borderRadius: 999 }}>{uc.tag}</span>
                  </div>
                  <p style={{ marginBottom: '1rem' }}>{uc.desc}</p>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    {uc.features.map((f) => (
                      <span key={f} style={{ fontSize: '.75rem', color: 'var(--inrt-muted)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--inrt-border)', padding: '.22rem .65rem', borderRadius: 8 }}>✓ {f}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary Grid */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner inrt-grid-2">
          <div>
            <p className="inrt-eyebrow">Philosophy</p>
            <h2>Built for use, not speculation</h2>
            <p className="lead">Unlike many crypto assets, INRT is engineered with real financial workflows in mind. Every design decision prioritises usability, reliability, and efficiency over speculation.</p>
            <p className="lead" style={{ marginTop: '1rem' }}>The result is a digital asset that behaves more like a financial instrument than a gambling chip.</p>
          </div>
          <div className="inrt-glass-card">
            <h3>Hold · Transfer · Utilize</h3>
            <p style={{ marginBottom: '1.5rem' }}>One asset, five core use cases, infinite potential. Start using INRT today through our secure platform.</p>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <Link href="/register" className="inrt-btn inrt-btn-primary">Open Account</Link>
              <Link href="/about" className="inrt-btn inrt-btn-ghost">About INRT</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="inrt-section">
        <div className="inrt-section-inner" style={{ textAlign: 'center' }}>
          <p className="inrt-eyebrow">Start Now</p>
          <h2>Ready to put INRT to work?</h2>
          <p className="lead" style={{ margin: '0 auto 1.5rem' }}>Register on our platform to send, receive, and manage INRT — or buy directly on PancakeSwap.</p>
          <div className="inrt-hero-btns" style={{ justifyContent: 'center' }}>
            <Link href="/register" className="inrt-btn inrt-btn-primary">Create Free Account</Link>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">Buy on PancakeSwap</a>
          </div>
        </div>
      </section>
    </>
  );
}
