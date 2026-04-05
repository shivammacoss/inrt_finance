import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — INRT Finance',
  description: 'Why INRT exists: from fragmented finance to a blockchain digital value system.',
};

const PANCAKESWAP_URL =
  'https://pancakeswap.finance/swap?outputCurrency=0x0000000000000000000000000000000000000000';

const pillars = [
  {
    icon: '⚡',
    title: 'Speed',
    desc: 'Transactions settle in seconds on BNB Smart Chain — no waiting, no delays.',
  },
  {
    icon: '🌐',
    title: 'Borderless',
    desc: 'Send and receive value anywhere in the world without geographic restrictions.',
  },
  {
    icon: '🔒',
    title: 'Security',
    desc: 'Every transaction is immutably recorded on-chain and openly verifiable.',
  },
  {
    icon: '💸',
    title: 'Low Cost',
    desc: 'Minimal fees designed for everyday transfers and business settlements.',
  },
  {
    icon: '🤝',
    title: 'Transparency',
    desc: 'Open-source infrastructure with a publicly verifiable contract address.',
  },
  {
    icon: '📈',
    title: 'Scalability',
    desc: 'Built on BEP-20 infrastructure that supports millions of transactions.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Page Hero */}
      <section style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem 2.5rem', textAlign: 'center', borderBottom: '1px solid var(--inrt-border)', background: 'linear-gradient(180deg,rgba(255,122,0,.06),transparent)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p className="inrt-eyebrow">About INRT Finance</p>
          <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: '1rem' }}>
            Digital Money, <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,var(--inrt-orange),var(--inrt-green))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Reimagined</em>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--inrt-muted)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 2rem' }}>
            INRT is a blockchain-powered digital asset designed to eliminate the limitations of physical money and fragmented financial systems.
          </p>
          <div className="inrt-hero-btns">
            <Link href="/register" className="inrt-btn inrt-btn-primary">Get Started</Link>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">Buy INRT</a>
          </div>
        </div>
      </section>

      {/* Why INRT Exists */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner inrt-grid-2">
          <div className="inrt-prose-stack">
            <p className="inrt-eyebrow">Context</p>
            <h2>Why the world needs a new value layer</h2>
            <p className="lead">The world still depends heavily on physical cash and fragmented financial systems that were not built for a connected, always-on economy.</p>
            <p className="lead">Transactions are slow, limited by geography, and often rely on intermediaries that increase cost and reduce efficiency.</p>
            <p className="lead">INRT is designed as a single, unified digital standard for moving value — instantly, globally, and without friction.</p>
          </div>
          <div className="inrt-glass-card">
            <div className="inrt-feature-ico" aria-hidden>₹</div>
            <h3>Fragmentation &amp; friction</h3>
            <p>Legacy rails were not built for a connected, always-on economy. INRT is designed as a single, digital standard for moving value — without replacing trust with opacity.</p>
            <p style={{ marginTop: '1rem' }}>Every transaction is transparent, immutable, and verifiable on BNB Smart Chain.</p>
          </div>
        </div>
      </section>

      {/* What is INRT */}
      <section className="inrt-section">
        <div className="inrt-section-inner inrt-grid-2">
          <div className="inrt-glass-card" style={{ minHeight: 220 }}>
            <h3>Digital Value System</h3>
            <p>INRT is positioned as more than a token: a transparent layer for verifiable value movement — suited to individuals, merchants, and organizations that need dependable digital rails.</p>
            <p style={{ marginTop: '1rem' }}>Unlike traditional cryptocurrencies that rely purely on market speculation, INRT is designed with usability and real-world application in mind.</p>
          </div>
          <div className="inrt-prose-stack">
            <p className="inrt-eyebrow">What is INRT?</p>
            <h2>A reliable digital representation of value</h2>
            <p className="lead">INRT introduces a blockchain-based digital value system designed to eliminate the limitations of physical money.</p>
            <p className="lead">By combining digital infrastructure with decentralized technology, INRT enables instant, secure, and borderless value transfer.</p>
            <p className="lead">It is built to function as a reliable digital representation of value in an increasingly connected world.</p>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner">
          <p className="inrt-eyebrow">Core Pillars</p>
          <h2>What makes INRT different</h2>
          <p className="lead">Six principles that guide every decision we make.</p>
          <div className="inrt-grid-3" style={{ marginTop: '2rem' }}>
            {pillars.map((p) => (
              <div key={p.title} className="inrt-glass-card">
                <div className="inrt-feature-ico" aria-hidden>{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="inrt-section">
        <div className="inrt-section-inner inrt-grid-2">
          <div>
            <p className="inrt-eyebrow">Philosophy</p>
            <h2>Built for use — not pure speculation</h2>
            <p className="lead">INRT focuses on controlled value systems, efficient transfers, and scalable financial interactions rather than volatility-driven trading.</p>
            <p className="lead" style={{ marginTop: '1rem' }}>The goal is a system people and businesses can actually use: clear rules of movement, predictable infrastructure, and room to grow as adoption expands.</p>
          </div>
          <div className="inrt-glass-card">
            <h3>Hold · Transfer · Utilize</h3>
            <p style={{ marginBottom: '1rem' }}>One asset, multiple use cases — from P2P to settlements — without reinventing how you think about money.</p>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <Link href="/use-cases" className="inrt-btn inrt-btn-ghost">Explore Use Cases</Link>
              <Link href="/token" className="inrt-btn inrt-btn-primary">Token Info</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner" style={{ textAlign: 'center' }}>
          <p className="inrt-eyebrow">Get Started</p>
          <h2>Ready to explore INRT?</h2>
          <p className="lead" style={{ margin: '0 auto 1.5rem' }}>Join thousands of users moving value faster with INRT Finance.</p>
          <div className="inrt-hero-btns" style={{ justifyContent: 'center' }}>
            <Link href="/register" className="inrt-btn inrt-btn-primary">Create Account</Link>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">Buy on PancakeSwap</a>
          </div>
        </div>
      </section>
    </>
  );
}
