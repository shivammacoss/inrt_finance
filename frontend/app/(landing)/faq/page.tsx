'use client';

import { useState } from 'react';
import Link from 'next/link';

const PANCAKESWAP_URL =
  'https://pancakeswap.finance/swap?outputCurrency=0x0000000000000000000000000000000000000000';

const categories = [
  {
    label: 'General',
    items: [
      { q: 'What is INRT?', a: 'INRT is a BEP-20 digital asset on BNB Smart Chain designed for fast, secure, and borderless value transfer. It is built to function as a reliable digital representation of value for individuals, merchants, and organizations.' },
      { q: 'Is INRT a stablecoin?', a: 'INRT is designed for value stability and real-world financial usability, but it operates within a dynamic ecosystem. It is not pegged to any fiat currency — its value is determined by market participants.' },
      { q: 'Who is behind INRT Finance?', a: 'INRT Finance is a blockchain-focused company committed to transparency and building real financial infrastructure on BNB Smart Chain. Our team details and corporate information are available on request.' },
      { q: 'Where can I find the official INRT contract?', a: 'The official contract address is published on this website and verifiable on BscScan. Always confirm the contract address through our official website before trading. Never trust third-party sources without cross-referencing.' },
    ],
  },
  {
    label: 'Buying & Trading',
    items: [
      { q: 'How can I buy INRT?', a: 'INRT can be purchased on PancakeSwap using BNB or USDT. Visit PancakeSwap, connect a BEP-20 compatible wallet (e.g. MetaMask or Trust Wallet), paste the INRT contract address, and swap. Always verify the contract before trading.' },
      { q: 'Which wallet should I use?', a: 'Any BEP-20 compatible wallet works — MetaMask (configured for BSC), Trust Wallet, and Binance Web3 Wallet are the most popular options. Ensure your wallet is connected to BNB Smart Chain (Chain ID: 56).' },
      { q: 'Are there trading fees?', a: 'PancakeSwap charges a standard 0.25% swap fee. Additionally, BNB Smart Chain requires a small BNB gas fee for each transaction (typically fractions of a cent). There are no hidden INRT Finance fees on top of this.' },
      { q: 'Is there a minimum purchase amount?', a: 'There is no minimum INRT purchase amount. You can buy any amount that PancakeSwap supports, subject to available liquidity.' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { q: 'What is the INRT Finance platform?', a: 'The INRT Finance platform is a secure ledger interface that lets registered users deposit INRT, send internal transfers (by email or wallet address), withdraw to external wallets, and view full transaction history.' },
      { q: 'How do I register?', a: 'Click "Get Started" or "Create Account" anywhere on the site to register. You will need a valid email address and a password. After registration, you can access your INRT wallet dashboard immediately.' },
      { q: 'How do deposits work on the platform?', a: 'Each user account is assigned a unique INRT deposit address on BNB Smart Chain. Send INRT to this address from any external wallet or exchange, and the balance will appear in your dashboard after on-chain confirmation.' },
      { q: 'How long do withdrawals take?', a: 'Withdrawal requests are reviewed by our team. Approved withdrawals are sent to your specified wallet address via BNB Smart Chain. Processing time is typically within 24 hours on business days.' },
    ],
  },
  {
    label: 'Security',
    items: [
      { q: 'Is INRT Finance secure?', a: 'Yes. The platform uses JWT-based authentication, bcrypt password hashing, and server-side validation. Private keys and signer keys are never exposed to the frontend. All sensitive operations happen server-side.' },
      { q: 'Are my funds safe?', a: 'INRT on-chain is governed by the BNB Smart Chain network — immutable and transparent. Platform balances are managed through our secure ledger system. We maintain strict access controls and regular security audits.' },
      { q: 'What if I forget my password?', a: 'Use the "Forgot Password" link on the login page to initiate a password reset via your registered email address. If you have further issues, contact our support team.' },
      { q: 'How do I verify the INRT contract is legitimate?', a: 'Visit BscScan and search for the contract address published on our Token page. Look for the verified checkmark and ensure the contract name matches "INRT". Never trade based on contract addresses from unverified sources.' },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`inrt-faq-item${open ? ' open' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
      <div className="inrt-faq-q">
        <span>{q}</span>
        <span className="inrt-faq-icon">+</span>
      </div>
      {open && <p className="inrt-faq-a">{a}</p>}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('General');

  const active = categories.find((c) => c.label === activeCategory) ?? categories[0];

  return (
    <>
      {/* Page Hero */}
      <section style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem 2.5rem', textAlign: 'center', borderBottom: '1px solid var(--inrt-border)', background: 'linear-gradient(180deg,rgba(255,122,0,.06),transparent)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p className="inrt-eyebrow">Help & Support</p>
          <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: '1rem' }}>
            Frequently Asked <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,var(--inrt-orange),var(--inrt-green))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Questions</em>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--inrt-muted)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
            Straight answers about INRT, the network, our platform, and how to get started.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="inrt-section">
        <div className="inrt-section-inner">
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {categories.map((c) => (
              <button
                key={c.label}
                type="button"
                className={activeCategory === c.label ? 'inrt-btn inrt-btn-primary' : 'inrt-btn inrt-btn-ghost'}
                style={{ padding: '.42rem .9rem', fontSize: '.82rem' }}
                onClick={() => setActiveCategory(c.label)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="inrt-faq" style={{ margin: 0, maxWidth: '100%' }}>
            {active.items.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner inrt-grid-2">
          <div>
            <p className="inrt-eyebrow">Still need help?</p>
            <h2>Contact our support team</h2>
            <p className="lead">Can't find what you're looking for? Our team is available to help you with any questions about INRT, the platform, or your account.</p>
          </div>
          <div className="inrt-glass-card">
            <h3>Get in touch</h3>
            <p style={{ marginBottom: '1.25rem' }}>We typically respond within 24 hours on business days.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              <a href="mailto:support@inrt.finance" style={{ display: 'flex', alignItems: 'center', gap: '.55rem', fontSize: '.875rem', color: 'var(--inrt-muted)', textDecoration: 'none' }}>
                <span style={{ color: 'var(--inrt-orange)' }}>✉</span> support@inrt.finance
              </a>
              <a href="https://t.me/inrtfinance" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '.55rem', fontSize: '.875rem', color: 'var(--inrt-muted)', textDecoration: 'none' }}>
                <span style={{ color: 'var(--inrt-orange)' }}>✈️</span> Telegram Community
              </a>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <Link href="/contact" className="inrt-btn inrt-btn-primary">Contact Support</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="inrt-section">
        <div className="inrt-section-inner" style={{ textAlign: 'center' }}>
          <p className="inrt-eyebrow">Get Started</p>
          <h2>Ready to explore INRT?</h2>
          <p className="lead" style={{ margin: '0 auto 1.5rem' }}>Create your account and start managing INRT on our secure platform.</p>
          <div className="inrt-hero-btns" style={{ justifyContent: 'center' }}>
            <Link href="/register" className="inrt-btn inrt-btn-primary">Create Free Account</Link>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">Buy INRT</a>
          </div>
        </div>
      </section>
    </>
  );
}
