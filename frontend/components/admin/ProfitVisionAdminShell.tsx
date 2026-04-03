'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  LayoutDashboard,
  Coins,
  SlidersHorizontal,
  Users,
  ListOrdered,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { PV_THEME_STORAGE_KEY } from '@/lib/demo-login';

export type AdminNavId = 'overview' | 'mint-burn' | 'adjust' | 'users' | 'ledger';

const NAV: { id: AdminNavId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'mint-burn', label: 'Mint / Burn', icon: Coins },
  { id: 'adjust', label: 'Balance adjust', icon: SlidersHorizontal },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'ledger', label: 'Transactions', icon: ListOrdered },
];

type Props = {
  title?: string;
  subtitle?: string;
  userEmail?: string;
  activeNav: AdminNavId;
  onNavigate: (id: AdminNavId) => void;
  onLogout: () => void;
  children: React.ReactNode;
};


export function ProfitVisionAdminShell({
  title = 'Admin Dashboard',
  subtitle = 'INRT operations',
  userEmail,
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

  const scrollTo = (id: AdminNavId) => {
    onNavigate(id);
    setMobileOpen(false);
    const el = document.getElementById(`admin-section-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <div className="adminPvLogoMark">IN</div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--pv-text)' }}>
                  INRT
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--pv-muted)' }}>
                  Admin
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

        <nav className="adminPvNav" aria-label="Admin sections">
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
              <span className="hidden sm:inline text-sm truncate max-w-[200px]" style={{ color: 'var(--pv-muted)' }}>
                {userEmail}
              </span>
            ) : null}
            <Link href="/dashboard" className="adminPvLinkDash">
              User view
            </Link>
          </div>
        </header>

        <div className="adminPvContent">{children}</div>
      </main>
    </div>
  );
}
