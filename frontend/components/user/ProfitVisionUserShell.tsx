'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpCircle,
  Send,
  History,
  ClipboardList,
  Menu,
  Sun,
  Moon,
  LogOut,
  Shield,
  UserCircle,
  Wallet,
} from 'lucide-react';
import { PV_THEME_STORAGE_KEY } from '@/lib/demo-login';

export type UserNavId =
  | 'overview'
  | 'wallet'
  | 'profile'
  | 'deposit'
  | 'withdraw'
  | 'send'
  | 'requests'
  | 'history';

export const USER_SCROLL_SECTION_IDS: UserNavId[] = [
  'overview',
  'wallet',
  'deposit',
  'withdraw',
  'send',
  'requests',
  'history',
  'profile',
];

type NavItem = {
  id: UserNavId;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
};

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/dashboard/wallet' },
  { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine, href: '/dashboard/deposit' },
  { id: 'withdraw', label: 'Withdraw', icon: ArrowUpCircle, href: '/dashboard/withdraw' },
  { id: 'send', label: 'Send', icon: Send, href: '/dashboard/send' },
  { id: 'requests', label: 'My requests', icon: ClipboardList, href: '/dashboard/requests' },
  { id: 'history', label: 'History', icon: History, href: '/dashboard/history' },
  { id: 'profile', label: 'Profile', icon: UserCircle, href: '/dashboard/profile' },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.id === 'overview') {
    return pathname === '/dashboard' || pathname === '/dashboard/';
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type Props = {
  title?: string;
  subtitle?: string;
  userEmail?: string;
  userDisplayName?: string;
  userPhone?: string;
  isAdmin?: boolean;
  onLogout: () => void;
  children: React.ReactNode;
  /** e.g. `inrtCbShell` — Coinbase-like nav + spacing while keeping INRT tokens */
  shellClassName?: string;
};

export function ProfitVisionUserShell({
  title = 'Wallet',
  subtitle = 'INRT dashboard',
  userEmail,
  userDisplayName,
  userPhone,
  isAdmin,
  onLogout,
  children,
  shellClassName,
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

  const navBtnClass = (item: NavItem) =>
    `adminPvNavBtn adminPvNavLink ${isNavActive(pathname, item) ? 'active' : ''}`.trim();

  return (
    <div className={['adminPvRoot', dark ? 'dark' : 'light', shellClassName || ''].filter(Boolean).join(' ')}>
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
            <Link href="/dashboard" className="adminPvLogoImgLink" title="INRT" aria-label="INRT — Overview">
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
                Wallet
              </div>
            </div>
          </div>
        </div>

        <nav className="adminPvNav" aria-label="Wallet sections">
          {NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={navBtnClass(item)}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="adminPvSidebarFoot">
          {isAdmin ? (
            <Link
              href="/admin"
              className="adminPvNavBtn adminPvNavLink"
              onClick={() => setMobileOpen(false)}
            >
              <Shield size={18} />
              <span>Admin panel</span>
            </Link>
          ) : null}
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
          <div className="flex items-center gap-2 flex-shrink-0 inrtHeaderUserRow">
            <div className="inrtHeaderAvatar inrtHeaderAvatarPlaceholder" aria-hidden>
              {(userDisplayName || userEmail || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col min-w-0 items-end text-right">
              {userDisplayName ? (
                <span className="inrtHeaderDisplayName truncate max-w-[200px]">{userDisplayName}</span>
              ) : null}
              {userPhone ? (
                <span className="inrtHeaderPhone truncate max-w-[200px]">{userPhone}</span>
              ) : null}
              {userEmail ? (
                <span className="inrtHeaderEmail truncate max-w-[220px]">{userEmail}</span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="adminPvContent inrtDashPage">{children}</div>
      </main>
    </div>
  );
}
