'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

const INRT_CONTRACT = process.env.NEXT_PUBLIC_INRT_CONTRACT || '0x0000000000000000000000000000000000000000';
const BSCSCAN_URL = `https://bscscan.com/token/${INRT_CONTRACT}`;
const PANCAKESWAP_URL = `https://pancakeswap.finance/swap?outputCurrency=${INRT_CONTRACT}`;

function CopyAddress() {
  const [done, setDone] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(INRT_CONTRACT);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch { /* noop */ }
  }, []);
  return (
    <div className="inrt-contract-row">
      <code>{INRT_CONTRACT}</code>
      <button type="button" className="inrt-btn inrt-btn-primary" onClick={copy}>
        {done ? 'Copied ✓' : 'Copy'}
      </button>
    </div>
  );
}

const tokenDetails = [
  { label: 'Token Name', value: 'INRT' },
  { label: 'Symbol', value: 'INRT' },
  { label: 'Network', value: 'BNB Smart Chain (BEP-20)' },
  { label: 'Decimals', value: '6' },
  { label: 'Standard', value: 'BEP-20' },
  { label: 'Chain ID', value: '56' },
];

const highlights = [
  { icon: '🔒', title: 'Immutable & Transparent', desc: 'All transactions are permanently recorded on-chain. Every transfer is publicly verifiable on BscScan.' },
  { icon: '⚡', title: 'Sub-Second Finality', desc: 'BNB Smart Chain delivers near-instant transaction finality at a fraction of traditional banking costs.' },
  { icon: '🌐', title: 'Globally Accessible', desc: 'Anyone with a BEP-20 compatible wallet can hold, send, or receive INRT across borders.' },
  { icon: '💸', title: 'Ultra-Low Fees', desc: 'Transactions cost fractions of a cent in BNB gas fees — far cheaper than SWIFT or card networks.' },
];

export default function TokenPage() {
  return (
    <>
      {/* Page Hero */}
      <section style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem 2.5rem', textAlign: 'center', borderBottom: '1px solid var(--inrt-border)', background: 'linear-gradient(180deg,rgba(255,122,0,.06),transparent)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p className="inrt-eyebrow">On-Chain · BEP-20</p>
          <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: '1rem' }}>
            INRT <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,var(--inrt-orange),var(--inrt-green))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Token Info</em>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--inrt-muted)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 2rem' }}>
            INRT is a BEP-20 digital asset on BNB Smart Chain. Verify the contract, check the explorer, and start trading on PancakeSwap.
          </p>
          <div className="inrt-hero-btns">
            <a href={BSCSCAN_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-primary">View on BscScan</a>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">Buy on PancakeSwap</a>
          </div>
        </div>
      </section>

      {/* Token Details */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner inrt-grid-2">
          <div>
            <p className="inrt-eyebrow">Token Details</p>
            <h2>Core specifications</h2>
            <table className="inrt-token-table">
              <tbody>
                {tokenDetails.map(({ label, value }) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="inrt-glass-card">
            <h3>Trust &amp; Transparency</h3>
            <p style={{ marginBottom: '0.85rem' }}>INRT is built on blockchain technology, ensuring that all transactions are transparent, immutable, and verifiable on the public ledger.</p>
            <p style={{ marginBottom: '1.5rem' }}>Every transfer is recorded permanently. This reduces the risk of manipulation and provides a secure environment for digital value transfer.</p>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <a href={BSCSCAN_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-ghost">Verify on BscScan</a>
            </div>
          </div>
        </div>
      </section>

      {/* Contract Address */}
      <section className="inrt-section">
        <div className="inrt-section-inner">
          <p className="inrt-eyebrow">BNB Smart Chain</p>
          <h2>Contract address</h2>
          <p className="lead" style={{ marginBottom: '1.25rem' }}>
            Always verify the contract address before trading. Never send funds to an unverified address.
          </p>
          <CopyAddress />
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href={BSCSCAN_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-ghost">
              🔍 Open on BscScan
            </a>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">
              Buy INRT on PancakeSwap
            </a>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner">
          <p className="inrt-eyebrow">Why BEP-20</p>
          <h2>Built on proven infrastructure</h2>
          <div className="inrt-grid-2" style={{ marginTop: '2rem', gap: '1.25rem' }}>
            {highlights.map((h) => (
              <div key={h.title} className="inrt-glass-card">
                <div className="inrt-feature-ico" aria-hidden>{h.icon}</div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Buy */}
      <section className="inrt-section">
        <div className="inrt-section-inner">
          <p className="inrt-eyebrow">How to Buy</p>
          <h2>Get INRT in 3 steps</h2>
          <div className="inrt-roadmap" style={{ maxWidth: 700, marginTop: '2rem' }}>
            <div className="inrt-phase">
              <div className="inrt-phase-num">1</div>
              <div>
                <h3>Set up a BEP-20 wallet</h3>
                <p>Install MetaMask or Trust Wallet and configure it for BNB Smart Chain (Chain ID: 56).</p>
              </div>
            </div>
            <div className="inrt-phase">
              <div className="inrt-phase-num">2</div>
              <div>
                <h3>Get BNB for gas fees</h3>
                <p>Purchase BNB from a supported exchange and transfer it to your wallet to cover network fees.</p>
              </div>
            </div>
            <div className="inrt-phase">
              <div className="inrt-phase-num">3</div>
              <div>
                <h3>Swap on PancakeSwap</h3>
                <p>Go to PancakeSwap, paste the INRT contract address, and swap BNB or USDT for INRT. Always verify the contract!</p>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">
              Buy INRT on PancakeSwap →
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="inrt-section inrt-split-bg">
        <div className="inrt-section-inner" style={{ textAlign: 'center' }}>
          <p className="inrt-eyebrow">Platform</p>
          <h2>Manage INRT on our platform</h2>
          <p className="lead" style={{ margin: '0 auto 1.5rem' }}>Deposit, transfer, and withdraw INRT through our secure ledger platform with full transaction history.</p>
          <div className="inrt-hero-btns" style={{ justifyContent: 'center' }}>
            <Link href="/register" className="inrt-btn inrt-btn-primary">Create Account</Link>
            <Link href="/login" className="inrt-btn inrt-btn-ghost">Sign In</Link>
          </div>
        </div>
      </section>
    </>
  );
}
