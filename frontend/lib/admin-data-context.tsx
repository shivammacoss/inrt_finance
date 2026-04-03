'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export type AdminStats = {
  totalUsers: number;
  totalInternalLedger: string;
  platformWalletOnChain: string;
  totalOnChainSupply: string | null;
  trackedMintSum?: string;
  trackedBurnSum?: string;
  circulatingSupply?: string;
  reserveTokenCap?: string;
  reserveINR?: string;
};

export type AdminDataState = {
  stats: AdminStats | null;
  users: { id?: string; email?: string; balance?: string; role?: string }[];
  txs: Record<string, unknown>[];
  actions: Record<string, unknown>[];
  reqList: Record<string, unknown>[];
  dataLoading: boolean;
  load: () => Promise<void>;
};

const AdminDataContext = createContext<AdminDataState | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<{ id?: string; email?: string; balance?: string; role?: string }[]>([]);
  const [txs, setTxs] = useState<Record<string, unknown>[]>([]);
  const [actions, setActions] = useState<Record<string, unknown>[]>([]);
  const [reqList, setReqList] = useState<Record<string, unknown>[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setDataLoading(true);
    try {
      const [s, u, t, a, rq] = await Promise.all([
        api.adminStats(),
        api.adminUsers(1),
        api.adminTransactions(1),
        api.adminActions(40),
        api.adminListRequests('queue'),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setTxs(t.transactions || []);
      setActions(a.actions || []);
      setReqList(rq.requests || []);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      load().catch(() => {});
    }
  }, [user, load]);

  const value = useMemo(
    () => ({
      stats,
      users,
      txs,
      actions,
      reqList,
      dataLoading,
      load,
    }),
    [stats, users, txs, actions, reqList, dataLoading, load]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataState {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return ctx;
}
