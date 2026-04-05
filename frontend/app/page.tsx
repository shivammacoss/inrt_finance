'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import './landing.css';

const INRT_CONTRACT = process.env.NEXT_PUBLIC_INRT_CONTRACT || '0x0000000000000000000000000000000000000000';
const BSCSCAN_URL = `https://bscscan.com/token/${INRT_CONTRACT}`;
const PANCAKESWAP_URL = `https://pancakeswap.finance/swap?outputCurrency=${INRT_CONTRACT}`;
const TELEGRAM = 'https://t.me/inrtfinance';
const TWITTER = 'https://twitter.com/inrtfinance';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/token', label: 'Token' },
  { href: '/use-cases', label: 'Use Cases' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

const FEATURES = [
  { icon: '⚡', title: 'Instant Transactions', desc: 'Move value quickly across the network when you need it.' },
  { icon: '🌐', title: 'Borderless Access', desc: 'Send and receive without traditional geographic limits.' },
  { icon: '🔒', title: 'Secure Blockchain', desc: 'Transparent, verifiable activity on-chain.' },
  { icon: '💸', title: 'Low Cost Transfers', desc: 'Efficient digital rails designed for everyday use.' },
  { icon: '📈', title: 'Scalable System', desc: 'Built to support growing payment and settlement needs.' },
];

const USE_CASES = [
  { title: 'Peer-to-peer transfers', desc: 'Designed for reliability and clarity in real payment workflows.' },
  { title: 'Cross-border payments', desc: 'Settle internationally without friction or intermediaries.' },
  { title: 'Business settlements', desc: 'Efficient settlement layer for modern business operations.' },
  { title: 'Digital payments ecosystem', desc: 'A unified rail for digital value movement at scale.' },
  { title: 'Lending & internal financial systems', desc: 'Flexible infrastructure for complex financial use cases.' },
];

const ROADMAP = [
  { phase: 'Phase 1', title: 'Token Launch & Liquidity', detail: 'Establish the asset and initial market depth.' },
  { phase: 'Phase 2', title: 'Website & Community Growth', detail: 'Education, transparency, and aligned community.' },
  { phase: 'Phase 3', title: 'Platform Development', detail: 'Tools and interfaces for real-world usability.' },
  { phase: 'Phase 4', title: 'Ecosystem Expansion', detail: 'Partnerships and broader digital payment reach.' },
];

const FAQS = [
  { q: 'What is INRT?', a: 'INRT is a digital asset designed for fast and secure value transfer on BNB Smart Chain.' },
  { q: 'Which network is INRT on?', a: 'INRT operates on BNB Smart Chain (BEP-20).' },
  { q: 'Is INRT a stablecoin?', a: 'INRT is designed for value stability but operates within a dynamic ecosystem.' },
  { q: 'How can I buy INRT?', a: 'INRT can be acquired through PancakeSwap or supported platforms. Always verify the contract address before trading.' },
  { q: 'Is INRT secure?', a: 'Yes. Built on blockchain technology ensuring transparency, immutability, and verifiable security.' },
  { q: 'How do I use the platform?', a: 'Register an account, complete KYC, then deposit INRT to your ledger wallet and manage transfers from your dashboard.' },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} className={`inrt-reveal${visible ? ' visible' : ''} ${className}`.trim()}>{children}</div>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`inrt-faq-item${open ? ' open' : ''}`}>
      <div className="inrt-faq-q" onClick={() => setOpen((o) => !o)}>
        <span>{q}</span>
        <span className="inrt-faq-icon">+</span>
      </div>
      {open && <p className="inrt-faq-a">{a}</p>}
    </div>
  );
}

function CopyAddress() {
  const [done, setDone] = useState(false);
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(INRT_CONTRACT); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* noop */ }
  }, []);
  return (
    <div className="inrt-contract-row">
      <code>{INRT_CONTRACT}</code>
      <button type="button" className="inrt-btn inrt-btn-primary" onClick={copy}>{done ? 'Copied ✓' : 'Copy'}</button>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [menuOpen]);

  return (
    <>
      <header className={`inrt-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="inrt-nav-inner">
          <a href="#hero" className="inrt-logo-link" onClick={() => setMenuOpen(false)}>
            <Image src="/inrt-logo-full.png" alt="INRT Finance" width={42} height={42} className="inrt-logo-img" priority />
            <div className="inrt-logo-text">
              <span className="inrt-logo-name">INRT Finance</span>
              <span className="inrt-logo-tag">Digital Value System</span>
            </div>
          </a>

          <nav aria-label="Main">
            <ul className="inrt-nav-links">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}><a href={href}>{label}</a></li>
              ))}
            </ul>
          </nav>

          <div className="inrt-nav-actions">
            <Link href="/login" className="inrt-btn inrt-btn-ghost">Sign In</Link>
            <Link href="/register" className="inrt-btn inrt-btn-primary">Get Started</Link>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">
              Buy INRT
            </a>
            <button type="button" className={`inrt-hamburger${menuOpen ? ' open' : ''}`} aria-expanded={menuOpen} aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`inrt-mob-menu${menuOpen ? ' open' : ''}`} role="dialog" aria-label="Mobile menu">
        {NAV_LINKS.map(({ href, label }) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
        ))}
        <Link href="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
        <Link href="/register" className="inrt-btn inrt-btn-primary" onClick={() => setMenuOpen(false)} style={{ justifyContent: 'center', marginTop: '0.5rem' }}>Get Started</Link>
        <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green" onClick={() => setMenuOpen(false)} style={{ justifyContent: 'center', marginTop: '0.25rem' }}>Buy on PancakeSwap</a>
      </div>
    </>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="lp-root">
      <div className="lp-mesh" aria-hidden />
      <Navbar />

      <main className="lp-main">
        {/* ── Hero ── */}
        <section className="inrt-hero" id="hero">
          <div className="inrt-hero-media" aria-hidden>
            <video className="inrt-hero-video" autoPlay muted loop playsInline preload="metadata">
              <source src="/video/inrt_video_1.mp4" type="video/mp4" />
            </video>
            <div className="inrt-hero-media-ov" />
          </div>

          <a href="#hero" className="inrt-hero-logo-corner" aria-label="INRT Finance">
            <Image src="/inrt-logo-full.png" alt="INRT Finance" width={88} height={88} priority />
          </a>

          <div className="inrt-hero-inner">
            <div className="inrt-badge">
              <span className="inrt-badge-dot" aria-hidden />
              Digital Value System · BNB Smart Chain
            </div>
            <h1>
              <span>INRT — </span>
              <em>Digital Money, Reimagined</em>
            </h1>
            <p className="inrt-hero-sub">
              A blockchain-powered digital asset designed for fast, secure, and borderless value transfer.
              Access your money anytime, anywhere.
            </p>
            <div className="inrt-hero-btns">
              <Link href="/register" className="inrt-btn inrt-btn-primary">Get Started</Link>
              <a href={BSCSCAN_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-ghost">View Contract</a>
              <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">Buy INRT</a>
            </div>
          </div>
        </section>

        {/* ── Context ── */}
        <Reveal>
          <section className="inrt-section inrt-split-bg" id="context">
            <div className="inrt-section-inner inrt-grid-2">
              <div className="inrt-prose-stack">
                <p className="inrt-eyebrow">Context</p>
                <h2>Why the world needs a new value layer</h2>
                <p className="lead">The world still depends heavily on physical cash and fragmented financial systems.</p>
                <p className="lead">Transactions are slow, limited by geography, and often rely on intermediaries that increase cost and reduce efficiency.</p>
                <p className="lead">There is a need for a unified, digital value system that works instantly, globally, and without friction.</p>
              </div>
              <div className="inrt-glass-card">
                <h3>Fragmentation &amp; friction</h3>
                <p>Legacy rails were not built for a connected, always-on economy. INRT is designed as a single, digital standard for moving value—without replacing trust with opacity.</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── About ── */}
        <Reveal>
          <section className="inrt-section" id="about">
            <div className="inrt-section-inner inrt-grid-2">
              <div className="inrt-prose-stack">
                <p className="inrt-eyebrow">About</p>
                <h2>What is INRT?</h2>
                <p className="lead">INRT introduces a blockchain-based digital value system designed to eliminate the limitations of physical money.</p>
                <p className="lead">By combining digital infrastructure with decentralized technology, INRT enables instant, secure, and borderless value transfer.</p>
                <p className="lead">It is built to function as a reliable digital representation of value in an increasingly connected world.</p>
              </div>
              <div className="inrt-glass-card" style={{ minHeight: 200 }}>
                <div className="inrt-feature-ico" aria-hidden>₹</div>
                <h3>Digital Value System</h3>
                <p>INRT is positioned as more than a token: a transparent layer for verifiable value movement—suited to individuals, merchants, and organizations that need dependable digital rails.</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── Features ── */}
        <Reveal>
          <section className="inrt-section inrt-split-bg">
            <div className="inrt-section-inner">
              <p className="inrt-eyebrow">Capabilities</p>
              <h2>Core features</h2>
              <p className="lead">Everything you expect from a modern digital value layer.</p>
              <div className="inrt-grid-5">
                {FEATURES.map((f) => (
                  <div key={f.title} className="inrt-glass-card">
                    <div className="inrt-feature-ico" aria-hidden>{f.icon}</div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── Philosophy ── */}
        <Reveal>
          <section className="inrt-section">
            <div className="inrt-section-inner inrt-grid-2">
              <div>
                <p className="inrt-eyebrow">Philosophy</p>
                <h2>Built for use — not pure speculation</h2>
                <p className="lead">Unlike traditional cryptocurrencies that rely purely on market speculation, INRT is designed with usability and real-world application in mind.</p>
                <p className="lead" style={{ marginTop: '1rem' }}>It focuses on controlled value systems, efficient transfers, and scalable financial interactions rather than volatility-driven trading.</p>
              </div>
              <div className="inrt-glass-card">
                <h3>Efficiency first</h3>
                <p>The goal is a system people and businesses can actually use: clear rules of movement, predictable infrastructure, and room to grow as adoption expands.</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── How it works ── */}
        <Reveal>
          <section className="inrt-section inrt-split-bg">
            <div className="inrt-section-inner inrt-grid-2">
              <div>
                <p className="inrt-eyebrow">Mechanics</p>
                <h2>How it works</h2>
                <p className="lead">INRT operates on a simple model where users can hold, transfer, and utilize digital value seamlessly. The system combines blockchain transparency with efficient digital infrastructure to enable real-world usability.</p>
              </div>
              <div className="inrt-glass-card">
                <h3>Hold · Transfer · Utilize</h3>
                <p style={{ marginBottom: '1rem' }}>One asset, multiple use cases—from P2P to settlements—without reinventing how you think about money.</p>
                <Link href="/dashboard" className="inrt-btn inrt-btn-ghost">Open Your Wallet</Link>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── Use Cases ── */}
        <Reveal>
          <section className="inrt-section" id="use-cases">
            <div className="inrt-section-inner">
              <p className="inrt-eyebrow">Applications</p>
              <h2>Use cases</h2>
              <div className="inrt-grid-3" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                {USE_CASES.map((u) => (
                  <div key={u.title} className="inrt-glass-card">
                    <h3>{u.title}</h3>
                    <p>{u.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── Token info ── */}
        <Reveal>
          <section className="inrt-section inrt-split-bg" id="token">
            <div className="inrt-section-inner inrt-grid-2">
              <div>
                <p className="inrt-eyebrow">On-chain</p>
                <h2>Token info</h2>
                <table className="inrt-token-table">
                  <tbody>
                    <tr><th>Token name</th><td>INRT</td></tr>
                    <tr><th>Symbol</th><td>INRT</td></tr>
                    <tr><th>Network</th><td>BNB Smart Chain (BEP-20)</td></tr>
                    <tr><th>Decimals</th><td>6</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="inrt-glass-card">
                <h3>Trust &amp; transparency</h3>
                <p style={{ marginBottom: '0.85rem' }}>INRT is built on blockchain technology, ensuring that all transactions are transparent, immutable, and verifiable.</p>
                <p>This reduces the risk of manipulation and provides a secure environment for digital value transfer. Every transaction is verifiable, creating a system built on trust.</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── Contract ── */}
        <Reveal>
          <section className="inrt-section">
            <div className="inrt-section-inner">
              <p className="inrt-eyebrow">BNB Smart Chain</p>
              <h2>Contract address</h2>
              <p className="lead">Verify the token on BscScan before you trade. Always double-check the contract address.</p>
              <CopyAddress />
            </div>
          </section>
        </Reveal>

        {/* ── Roadmap ── */}
        <Reveal>
          <section className="inrt-section inrt-split-bg" id="roadmap">
            <div className="inrt-section-inner">
              <p className="inrt-eyebrow">Plan</p>
              <h2>Roadmap</h2>
              <div className="inrt-roadmap">
                {ROADMAP.map((r, i) => (
                  <div key={r.phase} className="inrt-phase">
                    <div className="inrt-phase-num">{i + 1}</div>
                    <div>
                      <h3>{r.phase}: {r.title}</h3>
                      <p>{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── FAQ ── */}
        <Reveal>
          <section className="inrt-section" id="faq" aria-labelledby="faq-heading">
            <div className="inrt-section-inner" style={{ textAlign: 'center' }}>
              <p className="inrt-eyebrow">FAQ</p>
              <h2 id="faq-heading">Common questions</h2>
              <p className="lead" style={{ margin: '0 auto 0.5rem', maxWidth: 520 }}>Straight answers about INRT, the network, and how to participate.</p>
            </div>
            <div className="inrt-faq">
              {FAQS.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── Contact / CTA ── */}
        <Reveal>
          <section className="inrt-section inrt-split-bg" id="contact">
            <div className="inrt-section-inner" style={{ textAlign: 'center' }}>
              <p className="inrt-eyebrow">Get involved</p>
              <h2>Ready to explore INRT?</h2>
              <p className="lead" style={{ margin: '0 auto 1.5rem' }}>Connect your wallet, review the contract, or reach out — we are building for clarity and trust.</p>
              <div className="inrt-hero-btns" style={{ justifyContent: 'center' }}>
                <Link href="/register" className="inrt-btn inrt-btn-primary">Create Account</Link>
                <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">Buy on PancakeSwap</a>
                <a href={BSCSCAN_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-ghost">View on BscScan</a>
              </div>
            </div>
          </section>
        </Reveal>
      </main>

      {/* ── Footer ── */}
      <footer className="inrt-footer">
        <div className="inrt-footer-grid">
          <div className="inrt-footer-brand">
            <a href="#hero" className="inrt-logo-link">
              <Image src="/inrt-logo-full.png" alt="INRT Finance" width={40} height={40} className="inrt-logo-img" />
              <div className="inrt-logo-text">
                <span className="inrt-logo-name">INRT Finance</span>
                <span className="inrt-logo-tag">Digital Value System</span>
              </div>
            </a>
            <p>Blockchain-powered digital value designed for trust, simplicity, and real-world usability — not just a token.</p>
            <div className="inrt-footer-social">
              <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.95 3.48a1.5 1.5 0 0 0-1.54-1.28L2.4 10.5c-1.05.44-1.04 1.97.02 2.38l4.7 1.84 1.84 4.7c.41 1.06 1.94 1.07 2.38.02l8.3-18.01c.2-.45.02-.98-.69-1.15zM8.66 15.4l-.98-2.52 6.16-5.6-4.18 8.12z" /></svg>
              </a>
              <a href={TWITTER} target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="#token">Token info</a></li>
              <li><a href="#use-cases">Use cases</a></li>
              <li><a href="#roadmap">Roadmap</a></li>
            </ul>
          </div>

          <div>
            <h4>Platform</h4>
            <ul>
              <li><Link href="/login">Sign in</Link></li>
              <li><Link href="/register">Register</Link></li>
              <li><Link href="/dashboard">My Wallet</Link></li>
            </ul>
          </div>

          <div>
            <h4>Resources</h4>
            <ul>
              <li><a href={BSCSCAN_URL} target="_blank" rel="noopener noreferrer">BscScan</a></li>
              <li><a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer">PancakeSwap</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="inrt-footer-bot">© {new Date().getFullYear()} INRT Finance. All rights reserved.</div>
      </footer>
    </div>
  );
}
