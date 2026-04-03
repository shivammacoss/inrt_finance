'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, type PaymentRails } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export type DashboardDataState = {
  balance: string;
  spendable: string;
  ledgerLocked: string;
  wallet: string;
  depositAddr: string;
  contractAddr: string;
  txs: Record<string, unknown>[];
  requests: Record<string, unknown>[];
  paymentRails: PaymentRails | null;
  dataLoading: boolean;
  load: () => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataState | null>(null);

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<string>('—');
  const [spendable, setSpendable] = useState<string>('—');
  const [ledgerLocked, setLedgerLocked] = useState<string>('0');
  const [wallet, setWallet] = useState('');
  const [depositAddr, setDepositAddr] = useState('');
  const [contractAddr, setContractAddr] = useState('');
  const [txs, setTxs] = useState<Record<string, unknown>[]>([]);
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [paymentRails, setPaymentRails] = useState<PaymentRails | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [b, info, t, r] = await Promise.all([
        api.balance(),
        api.depositInfo(),
        api.transactions(25),
        api.walletRequests(25),
      ]);
      setBalance(b.balance);
      setSpendable(b.spendable ?? b.balance);
      setLedgerLocked(b.ledgerLocked ?? '0');
      setWallet(b.walletAddress || '');
      setDepositAddr(info.depositAddress);
      setContractAddr(info.contractAddress);
      setPaymentRails(info.paymentRails ?? null);
      setTxs(t.transactions || []);
      setRequests(r.requests || []);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      load().catch(() => {});
    }
  }, [user, load]);

  const value = useMemo(
    () => ({
      balance,
      spendable,
      ledgerLocked,
      wallet,
      depositAddr,
      contractAddr,
      txs,
      requests,
      paymentRails,
      dataLoading,
      load,
    }),
    [balance, spendable, ledgerLocked, wallet, depositAddr, contractAddr, txs, requests, paymentRails, dataLoading, load]
  );

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData(): DashboardDataState {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error('useDashboardData must be used within DashboardDataProvider');
  }
  return ctx;
}
