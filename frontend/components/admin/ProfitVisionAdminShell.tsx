'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  LayoutDashboard,
  Coins,
  SlidersHorizontal,
  Users,
  ListOrdered,
  Inbox,
  Menu,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { PV_THEME_STORAGE_KEY } from '@/lib/demo-login';

export type AdminNavId = 'overview' | 'requests' | 'mint-burn' | 'adjust' | 'users' | 'ledger';

type NavItem = {
  id: AdminNavId;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
};

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { id: 'requests', label: 'Requests', icon: Inbox, href: '/admin/requests' },
  { id: 'mint-burn', label: 'Mint / Burn', icon: Coins, href: '/admin/mint-burn' },
  { id: 'adjust', label: 'Balance adjust', icon: SlidersHorizontal, href: '/admin/adjust' },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
  { id: 'ledger', label: 'Transactions', icon: ListOrdered, href: '/admin/ledger' },
];

function isAdminNavActive(pathname: string, item: NavItem): boolean {
  if (item.id === 'overview') {
    return pathname === '/admin' || pathname === '/admin/';
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type Props = {
  title?: string;
  subtitle?: string;
  userEmail?: string;
  onLogout: () => void;
  children: React.ReactNode;
};

export function ProfitVisionAdminShell({
  title = 'Admin Dashboard',
  subtitle = 'INRT operations',
  userEmail,
  onLogout,
  children,
}: Props) {
  const pathname = usePathname();
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(PV_THEME_STORAGE_KEY);
      if (t === 'light') setDark(false);
      else if (t === 'dark') setDark(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setDark((d) => {
      const next = !d;
      try {
        localStorage.setItem(PV_THEME_STORAGE_KEY, next ? 'dark' : 'light');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    const prevBg = document.body.style.background;
    const prevColor = document.body.style.color;
    document.body.style.background = dark ? '#0b0e11' : '#f3f4f6';
    document.body.style.color = dark ? '#eaecef' : '#0b0e11';
    return () => {
      document.body.style.background = prevBg;
      document.body.style.color = prevColor;
    };
  }, [dark]);

  return (
    <div className={`adminPvRoot ${dark ? 'dark' : 'light'}`}>
      {mobileOpen && (
        <div
          className="adminPvOverlay lg:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`adminPvSidebar ${mobileOpen ? 'mobileOpen' : ''}`}>
        <div className="adminPvLogoRow">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/admin" className="adminPvLogoImgLink" title="INRT Admin" aria-label="INRT — Admin overview">
              <Image
                src="/inrt-logo.png"
                alt="INRT"
                width={40}
                height={40}
                className="adminPvLogoImg"
                priority
              />
            </Link>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: 'var(--pv-text)' }}>
                INRT
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--pv-muted)' }}>
                Admin
              </div>
            </div>
          </div>
        </div>

        <nav className="adminPvNav" aria-label="Admin sections">
          {NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`adminPvNavBtn adminPvNavLink ${isAdminNavActive(pathname, item) ? 'active' : ''}`.trim()}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="adminPvSidebarFoot">
          <button
            type="button"
            className="adminPvNavBtn w-full"
            onClick={toggleTheme}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            type="button"
            className="adminPvNavBtn w-full"
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="adminPvMain flex-1">
        <header className="adminPvHeader">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="adminPvMobileToggle lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {userEmail ? (
              <span className="hidden sm:inline text-sm truncate max-w-[200px]" style={{ color: 'var(--pv-muted)' }}>
                {userEmail}
              </span>
            ) : null}
            <Link href="/dashboard" className="adminPvLinkDash">
              User view
            </Link>
          </div>
        </header>

        <div className="adminPvContent adminInrtPage">{children}</div>
      </main>
    </div>
  );
}
