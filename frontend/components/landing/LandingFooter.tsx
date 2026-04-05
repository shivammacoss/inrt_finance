import Link from 'next/link';
import Image from 'next/image';

const TELEGRAM = 'https://t.me/inrtfinance';
const TWITTER = 'https://twitter.com/inrtfinance';

export default function LandingFooter() {
  return (
    <footer className="inrt-footer">
      <div className="inrt-footer-grid">
        <div className="inrt-footer-brand">
          <Link href="/" className="inrt-logo-link">
            <Image src="/inrt-logo-full.png" alt="INRT Finance" width={40} height={40} className="inrt-logo-img" />
            <div className="inrt-logo-text">
              <span className="inrt-logo-name">INRT Finance</span>
              <span className="inrt-logo-tag">Digital Value System</span>
            </div>
          </Link>
          <p>
            Blockchain-powered digital value designed for trust, simplicity, and real-world
            usability—not just a token.
          </p>
          <div className="inrt-footer-social">
            <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M21.95 3.48a1.5 1.5 0 0 0-1.54-1.28L2.4 10.5c-1.05.44-1.04 1.97.02 2.38l4.7 1.84 1.84 4.7c.41 1.06 1.94 1.07 2.38.02l8.3-18.01c.2-.45.02-.98-.69-1.15zM8.66 15.4l-.98-2.52 6.16-5.6-4.18 8.12z" />
              </svg>
            </a>
            <a href={TWITTER} target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4>Product</h4>
          <ul>
            <li><Link href="/token">Token info</Link></li>
            <li><Link href="/use-cases">Use cases</Link></li>
            <li><Link href="/roadmap">Roadmap</Link></li>
          </ul>
        </div>

        <div>
          <h4>Company</h4>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/login">Sign in</Link></li>
            <li><Link href="/register">Register</Link></li>
          </ul>
        </div>

        <div>
          <h4>Resources</h4>
          <ul>
            <li><Link href="/legal">Terms &amp; Privacy</Link></li>
            <li>
              <a
                href="https://bscscan.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                BscScan
              </a>
            </li>
            <li>
              <a
                href="https://pancakeswap.finance"
                target="_blank"
                rel="noopener noreferrer"
              >
                PancakeSwap
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="inrt-footer-bot">
        © {new Date().getFullYear()} INRT Finance. All rights reserved.
      </div>
    </footer>
  );
}
