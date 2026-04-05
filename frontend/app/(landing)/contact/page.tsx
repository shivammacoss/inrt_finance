'use client';

import { useState } from 'react';
import Link from 'next/link';

const channels = [
  { icon: '✉️', title: 'Email Support', sub: 'support@inrt.finance — reply within 24 hours', href: 'mailto:support@inrt.finance', badge: '24h', badgeColor: 'rgba(255,122,0,.8)' },
  { icon: '✈️', title: 'Telegram Community', sub: '@INRTFinance — updates, support & announcements', href: 'https://t.me/inrtfinance', badge: '● Active', badgeColor: '#00c853' },
  { icon: '𝕏', title: 'X / Twitter', sub: '@inrtfinance — news, milestones & market updates', href: 'https://twitter.com/inrtfinance', badge: 'Follow', badgeColor: 'rgba(255,255,255,.5)' },
  { icon: '📄', title: 'BscScan', sub: 'Verify the contract and track on-chain activity', href: 'https://bscscan.com', badge: 'Blockchain', badgeColor: 'rgba(59,130,246,.8)' },
  { icon: '🔁', title: 'PancakeSwap', sub: 'Trade INRT directly — always verify the contract', href: 'https://pancakeswap.finance', badge: 'DEX', badgeColor: 'rgba(0,200,83,.7)' },
  { icon: '❓', title: 'FAQ', sub: 'Browse common questions and instant answers', href: '/faq', badge: 'Instant', badgeColor: 'rgba(148,163,184,.6)' },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => { setBusy(false); setSent(true); }, 1200);
  }

  return (
    <>
      {/* Page Hero */}
      <section style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem 2.5rem', textAlign: 'center', borderBottom: '1px solid var(--inrt-border)', background: 'linear-gradient(180deg,rgba(255,122,0,.06),transparent)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p className="inrt-eyebrow">Get in Touch</p>
          <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: '1rem' }}>
            Contact <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,var(--inrt-orange),var(--inrt-green))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>INRT Finance</em>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--inrt-muted)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
            Have a question, partnership inquiry, or need support? Reach out through any of our channels below.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="inrt-section">
        <div className="inrt-section-inner">
          <div className="inrt-grid-2" style={{ gap: '2.5rem', alignItems: 'start' }}>

            {/* Channels */}
            <div>
              <p className="inrt-eyebrow">Contact Channels</p>
              <h2 style={{ marginBottom: '1.5rem' }}>How to reach us</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {channels.map((c) => (
                  <a
                    key={c.title}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem 1.25rem', borderRadius: 14,
                      background: 'var(--inrt-surface)',
                      border: '1px solid var(--inrt-border)',
                      textDecoration: 'none', color: 'inherit',
                      transition: 'border-color .2s, transform .2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,122,0,.3)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--inrt-border)'; e.currentTarget.style.transform = ''; }}
                  >
                    <span style={{ fontSize: '1.4rem', width: 40, textAlign: 'center', flexShrink: 0 }}>{c.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.18rem' }}>{c.title}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--inrt-muted)' }}>{c.sub}</div>
                    </div>
                    <span style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.06em', color: c.badgeColor, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: '.22rem .6rem', borderRadius: 999, flexShrink: 0 }}>
                      {c.badge}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <p className="inrt-eyebrow">Send a Message</p>
              <h2 style={{ marginBottom: '1.5rem' }}>Write to us directly</h2>

              {sent ? (
                <div className="inrt-glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                  <h3 style={{ marginBottom: '.5rem' }}>Message sent!</h3>
                  <p>Our team will get back to you within 24 hours.</p>
                  <button type="button" className="inrt-btn inrt-btn-ghost" style={{ marginTop: '1.5rem' }} onClick={() => setSent(false)}>
                    Send another
                  </button>
                </div>
              ) : (
                <div className="inrt-glass-card">
                  <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--inrt-muted)', marginBottom: '.35rem' }}>Full Name</label>
                      <input type="text" required placeholder="Your full name" style={{ width: '100%', padding: '.72rem .9rem', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--inrt-muted)', marginBottom: '.35rem' }}>Email Address</label>
                      <input type="email" required placeholder="your@email.com" style={{ width: '100%', padding: '.72rem .9rem', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--inrt-muted)', marginBottom: '.35rem' }}>Subject</label>
                      <select defaultValue="" style={{ width: '100%', padding: '.72rem .9rem', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}>
                        <option value="" disabled>Select a topic</option>
                        <option>General Inquiry</option>
                        <option>Partnership / Business</option>
                        <option>Platform Support</option>
                        <option>Token / Trading</option>
                        <option>Security Issue</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--inrt-muted)', marginBottom: '.35rem' }}>Message</label>
                      <textarea required rows={5} placeholder="Describe your question or message..." style={{ width: '100%', padding: '.72rem .9rem', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', minHeight: 120 }} />
                    </div>
                    <button
                      type="submit"
                      disabled={busy}
                      style={{ width: '100%', padding: '.9rem', background: 'linear-gradient(135deg,var(--inrt-orange),#ff9a3d)', border: 'none', borderRadius: 9, color: '#0a0a0a', fontSize: '.95rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .7 : 1, fontFamily: 'inherit', transition: 'all .2s' }}
                    >
                      {busy ? 'Sending…' : 'Send Message →'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ shortcut */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner" style={{ textAlign: 'center' }}>
          <p className="inrt-eyebrow">Self-service</p>
          <h2>Looking for quick answers?</h2>
          <p className="lead" style={{ margin: '0 auto 1.5rem' }}>Browse our comprehensive FAQ for instant answers to common questions about INRT, the platform, and trading.</p>
          <div className="inrt-hero-btns" style={{ justifyContent: 'center' }}>
            <Link href="/faq" className="inrt-btn inrt-btn-primary">Browse FAQ</Link>
            <Link href="/register" className="inrt-btn inrt-btn-ghost">Create Account</Link>
          </div>
        </div>
      </section>
    </>
  );
}
