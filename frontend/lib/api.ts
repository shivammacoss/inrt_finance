import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const base = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export type SafeUser = {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  walletAddress: string;
  balance: string;
  ledgerLocked?: string;
  role: string;
  createdAt?: string;
};

export type PaymentRails = {
  upi: { payToId: string | null; payToName: string };
  bank_transfer: {
    accountName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    bankName: string | null;
  };
  card: { instructions: string };
  other: { instructions: string };
};

const client = axios.create({
  baseURL: base(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!cfg || cfg._retry) return Promise.reject(error);
    const url = cfg.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      cfg._retry = true;
      try {
        await client.post('/auth/refresh');
        return client(cfg);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

function apiUnreachableMessage(): string {
  const url = base();
  return (
    `Server not reachable at ${url} (connection refused). Run the API (cd backend && npm run dev). ` +
    `Set NEXT_PUBLIC_API_URL to match the API origin; cookies require correct CORS (FRONTEND_URL on the server).`
  );
}

function formatApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as {
    error?: string;
    details?: { msg?: string; path?: string }[];
  };
  if (d.error === 'Validation failed' && Array.isArray(d.details) && d.details.length > 0) {
    const parts = d.details.map((x) => x.msg || `${x.path}: invalid`).filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  if (d.error) return d.error;
  return fallback;
}

async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    params?: Record<string, string | number>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;
  try {
    const res = await client({
      url: path,
      method,
      data: body !== undefined ? body : undefined,
      params,
      validateStatus: () => true,
    });
    const data = res.data as T & { error?: string };
    if (res.status >= 200 && res.status < 300) {
      return data as T;
    }
    const msg = formatApiError(data, res.statusText || 'Request failed');
    throw new Error(msg);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const ax = e as AxiosError<{ error?: string; details?: { msg?: string }[] }>;
      if (!ax.response) {
        throw new Error(apiUnreachableMessage());
      }
      const msg = formatApiError(ax.response.data, ax.message);
      throw new Error(msg);
    }
    throw e;
  }
}

export const api = {
  register: (body: { email: string; password: string; walletAddress?: string }) =>
    request<{ user: SafeUser }>('/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    request<{ user: SafeUser }>('/auth/login', { method: 'POST', body }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  refresh: () => request<{ user: SafeUser }>('/auth/refresh', { method: 'POST' }),
  me: () => request<{ user: SafeUser }>('/auth/me'),
  putProfile: (
    body: { fullName?: string; walletAddress?: string; phone?: string; avatarUrl?: string }
  ) => request<{ user: SafeUser; message: string }>('/user/profile', { method: 'PUT', body }),
  updateProfile: (walletAddress: string) =>
    request<{ user: SafeUser }>('/auth/profile', {
      method: 'PATCH',
      body: { walletAddress },
    }),
  balance: () =>
    request<{ balance: string; walletAddress: string; ledgerLocked?: string; spendable?: string }>(
      '/wallet/balance'
    ),
  depositInfo: () =>
    request<{
      depositAddress: string;
      contractAddress: string;
      network: string;
      paymentRails?: PaymentRails | null;
    }>('/wallet/deposit-info'),
  transfer: (body: { amount: string; toEmail?: string; toWalletAddress?: string }) =>
    request<{ ok: boolean }>('/wallet/transfer', { method: 'POST', body }),
  depositRequest: (body: {
    amount: string;
    paymentMethod: 'upi' | 'bank_transfer' | 'card' | 'other';
    paymentReference?: string;
  }) =>
    request<{
      ok: boolean;
      message: string;
      request: { id: string; type: string; amount: string; status: string; createdAt: string };
    }>('/wallet/deposit-request', { method: 'POST', body }),
  withdrawRequest: (body: {
    amount: string;
    withdrawalMethod: 'upi' | 'bank_transfer' | 'card' | 'other';
    payoutDetails: string;
  }) =>
    request<{
      ok: boolean;
      message: string;
      request: { id: string; type: string; amount: string; status: string; createdAt: string };
    }>('/wallet/withdraw-request', { method: 'POST', body }),
  walletRequests: (limit?: number) =>
    request<{ requests: Record<string, unknown>[] }>('/wallet/requests', {
      params: { limit: limit ?? 50 },
    }),
  transactions: (limit?: number) =>
    request<{ transactions: Record<string, unknown>[] }>('/wallet/transactions', {
      params: { limit: limit ?? 50 },
    }),
  adminStats: () =>
    request<{
      totalUsers: number;
      totalInternalLedger: string;
      platformWalletOnChain: string;
      totalOnChainSupply: string | null;
      trackedMintSum?: string;
      trackedBurnSum?: string;
      circulatingSupply?: string;
      reserveTokenCap?: string;
      reserveINR?: string;
    }>('/admin/stats'),
  adminUsers: (page = 1) =>
    request<{ users: SafeUser[]; total: number }>('/admin/users', { params: { page } }),
  adminTransactions: (page = 1) =>
    request<{ transactions: Record<string, unknown>[]; total: number }>('/admin/transactions', {
      params: { page },
    }),
  adminActions: (limit = 50) =>
    request<{ actions: Record<string, unknown>[] }>('/admin/actions', { params: { limit } }),
  adminMint: (body: { recipientAddress: string; amount: string; creditUserId?: string }) =>
    request<{ ok: boolean; txHash: string }>('/admin/mint', { method: 'POST', body }),
  adminBurn: (amount: string) =>
    request<{ ok: boolean; txHash: string }>('/admin/burn', { method: 'POST', body: { amount } }),
  adminAdjust: (body: { userId: string; amountDelta: string; note?: string }) =>
    request<{ ok: boolean; userId?: string; balance: string }>('/admin/adjust', {
      method: 'POST',
      body,
    }),
  adminAdjustBalance: (body: { userId: string; amountDelta: string; note?: string }) =>
    request<{ ok: boolean; userId?: string; balance: string }>('/admin/adjust-balance', {
      method: 'POST',
      body,
    }),
  adminListRequests: (status: 'queue' | 'all' | 'pending' | 'processing' | 'approved' | 'rejected' | string = 'queue') =>
    request<{ requests: Record<string, unknown>[] }>('/admin/requests', { params: { status } }),
  adminApproveRequest: (requestId: string, adminNote?: string) =>
    request<{ ok: boolean; type?: string; txHash?: string; balance?: string }>('/admin/request/approve', {
      method: 'POST',
      body: { requestId, adminNote },
    }),
  adminRejectRequest: (body: { requestId: string; reason?: string; adminNote?: string }) =>
    request<{ ok: boolean; status: string }>('/admin/request/reject', { method: 'POST', body }),
};
