'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const PANCAKESWAP_URL =
  'https://pancakeswap.finance/swap?outputCurrency=0x0000000000000000000000000000000000000000';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/token', label: 'Token' },
  { href: '/use-cases', label: 'Use Cases' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header className={`inrt-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="inrt-nav-inner">
          <Link href="/" className="inrt-logo-link">
            <Image
              src="/inrt-logo-full.png"
              alt="INRT Finance"
              width={42}
              height={42}
              className="inrt-logo-img"
              priority
            />
            <div className="inrt-logo-text">
              <span className="inrt-logo-name">INRT Finance</span>
              <span className="inrt-logo-tag">Digital Value System</span>
            </div>
          </Link>

          <nav aria-label="Main">
            <ul className="inrt-nav-links">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={pathname === href ? 'active' : ''}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="inrt-nav-actions">
            <Link href="/login" className="inrt-btn inrt-btn-ghost">Sign In</Link>
            <Link href="/register" className="inrt-btn inrt-btn-primary">Get Started</Link>
            <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green">
              Buy INRT
            </a>
            <button
              type="button"
              className={`inrt-hamburger${menuOpen ? ' open' : ''}`}
              aria-expanded={menuOpen}
              aria-label="Menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`inrt-mob-menu${menuOpen ? ' open' : ''}`} role="dialog" aria-label="Mobile menu">
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
            {label}
          </Link>
        ))}
        <Link href="/login" style={{ marginTop: '0.5rem' }}>Sign In</Link>
        <Link href="/register" className="inrt-btn inrt-btn-primary" style={{ marginTop: '0.25rem', justifyContent: 'center' }}>
          Get Started
        </Link>
        <a href={PANCAKESWAP_URL} target="_blank" rel="noopener noreferrer" className="inrt-btn inrt-btn-green" style={{ marginTop: '0.25rem', justifyContent: 'center' }}>
          Buy on PancakeSwap
        </a>
      </div>
    </>
  );
}
