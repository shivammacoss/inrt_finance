'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  LayoutDashboard,
  ArrowDownToLine,
  Wallet,
  Send,
  History,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Shield,
} from 'lucide-react';
import { PV_THEME_STORAGE_KEY } from '@/lib/demo-login';

export type UserNavId = 'overview' | 'receive' | 'wallet' | 'send' | 'history';

const NAV: { id: UserNavId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'receive', label: 'Receive / Deposit', icon: ArrowDownToLine },
  { id: 'wallet', label: 'Wallet & withdraw', icon: Wallet },
  { id: 'send', label: 'Send INRT', icon: Send },
  { id: 'history', label: 'History', icon: History },
];

type Props = {
  title?: string;
  subtitle?: string;
  userEmail?: string;
  isAdmin?: boolean;
  activeNav: UserNavId;
  onNavigate: (id: UserNavId) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export function ProfitVisionUserShell({
  title = 'Wallet',
  subtitle = 'INRT dashboard',
  userEmail,
  isAdmin,
  activeNav,
  onNavigate,
  onLogout,
  children,
}: Props) {
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(PV_THEME_STORAGE_KEY);
      if (t === 'dark') setDark(true);
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
    document.body.style.background = dark ? '#0a0a0a' : '#f9fafb';
    document.body.style.color = dark ? '#f9fafb' : '#111827';
    return () => {
      document.body.style.background = prevBg;
      document.body.style.color = prevColor;
    };
  }, [dark]);

  const scrollTo = (id: UserNavId) => {
    onNavigate(id);
    setMobileOpen(false);
    document.getElementById(`user-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`adminPvRoot ${dark ? 'dark' : 'light'}`}>
      {mobileOpen && (
        <div
          className="adminPvOverlay lg:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`adminPvSidebar ${mobileOpen ? 'mobileOpen' : ''} ${collapsed ? 'collapsed' : ''}`}
      >
        <div className="adminPvLogoRow">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="adminPvLogoMark"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #0d9488)' }}
            >
              IN
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--pv-text)' }}>
                  INRT
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--pv-muted)' }}>
                  Wallet
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="adminPvCollapseToggle p-1 rounded-md hover:opacity-80"
              style={{ color: 'var(--pv-muted)' }}
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button
              type="button"
              className="lg:hidden p-1 rounded-md"
              style={{ color: 'var(--pv-muted)' }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="adminPvNav" aria-label="Wallet sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`adminPvNavBtn ${activeNav === item.id ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => scrollTo(item.id)}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
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
              {!collapsed && <span>Admin panel</span>}
            </Link>
          ) : null}
          <button
            type="button"
            className="adminPvNavBtn w-full"
            onClick={toggleTheme}
            title={collapsed ? (dark ? 'Light' : 'Dark') : undefined}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span>{dark ? 'Light mode' : 'Dark mode'}</span>}
          </button>
          <button
            type="button"
            className="adminPvNavBtn w-full"
            onClick={onLogout}
            title={collapsed ? 'Log out' : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Log out</span>}
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
              <span
                className="hidden sm:inline text-sm truncate max-w-[220px]"
                style={{ color: 'var(--pv-muted)' }}
              >
                {userEmail}
              </span>
            ) : null}
          </div>
        </header>

        <div className="adminPvContent">{children}</div>
      </main>
    </div>
  );
}

export const USER_NAV_IDS: UserNavId[] = ['overview', 'receive', 'wallet', 'send', 'history'];
