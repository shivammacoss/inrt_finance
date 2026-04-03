import axios, { AxiosError } from 'axios';

const base = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export type SafeUser = {
  id: string;
  email: string;
  walletAddress: string;
  balance: string;
  role: string;
};

function apiUnreachableMessage(): string {
  const url = base();
  return (
    `Server not reachable at ${url} (connection refused). Open a terminal, run: cd backend && npm run dev — ` +
    `MongoDB must connect (MONGO_URI in backend/.env + Atlas IP allowlist). API default port is 5001 (see backend/.env PORT).`
  );
}

async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string | null;
    params?: Record<string, string | number>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, token, params } = options;
  try {
    const res = await axios({
      url: `${base()}${path}`,
      method,
      data: body !== undefined ? body : undefined,
      params,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      validateStatus: () => true,
    });

    const data = res.data as T & { error?: string };
    if (res.status >= 200 && res.status < 300) {
      return data as T;
    }
    const msg = data?.error || res.statusText || 'Request failed';
    throw new Error(msg);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const ax = e as AxiosError<{ error?: string }>;
      if (!ax.response) {
        throw new Error(apiUnreachableMessage());
      }
      const msg = ax.response.data?.error || ax.message;
      throw new Error(msg);
    }
    throw e;
  }
}

export const api = {
  register: (body: { email: string; password: string; walletAddress?: string }) =>
    request<{ user: SafeUser; token: string }>('/auth/register', {
      method: 'POST',
      body,
    }),
  login: (body: { email: string; password: string }) =>
    request<{ user: SafeUser; token: string }>('/auth/login', {
      method: 'POST',
      body,
    }),
  me: (token: string) => request<{ user: SafeUser }>('/auth/me', { token }),
  updateProfile: (token: string, walletAddress: string) =>
    request<{ user: SafeUser }>('/auth/profile', {
      method: 'PATCH',
      token,
      body: { walletAddress },
    }),
  balance: (token: string) =>
    request<{ balance: string; walletAddress: string }>('/wallet/balance', { token }),
  depositInfo: (token: string) =>
    request<{ depositAddress: string; contractAddress: string; network: string }>(
      '/wallet/deposit-info',
      { token }
    ),
  transfer: (
    token: string,
    body: { amount: string; toEmail?: string; toWalletAddress?: string }
  ) =>
    request<{ ok: boolean }>('/wallet/transfer', {
      method: 'POST',
      token,
      body,
    }),
  deposit: (token: string, txHash: string) =>
    request<{ ok: boolean; balance: string }>('/wallet/deposit', {
      method: 'POST',
      token,
      body: { txHash },
    }),
  withdraw: (
    token: string,
    body: {
      amount: string;
      payoutMethod?: 'upi' | 'bank' | 'biznext';
      payoutDetails?: string;
    }
  ) =>
    request<{
      ok: boolean;
      balance: string;
      txHash?: string;
      status?: string;
      message?: string;
    }>('/wallet/withdraw', {
      method: 'POST',
      token,
      body,
    }),
  transactions: (token: string, limit?: number) =>
    request<{ transactions: Record<string, unknown>[] }>('/wallet/transactions', {
      token,
      params: { limit: limit ?? 50 },
    }),
  adminStats: (token: string) =>
    request<{
      totalUsers: number;
      totalInternalLedger: string;
      platformWalletOnChain: string;
      totalOnChainSupply: string | null;
      trackedMintSum?: string;
      trackedBurnSum?: string;
    }>('/admin/stats', { token }),
  adminUsers: (token: string, page = 1) =>
    request<{ users: SafeUser[]; total: number }>('/admin/users', {
      token,
      params: { page },
    }),
  adminTransactions: (token: string, page = 1) =>
    request<{ transactions: Record<string, unknown>[]; total: number }>('/admin/transactions', {
      token,
      params: { page },
    }),
  adminActions: (token: string) =>
    request<{ actions: Record<string, unknown>[] }>('/admin/actions', { token }),
  adminMint: (
    token: string,
    body: { recipientAddress: string; amount: string; creditUserId?: string }
  ) =>
    request<{ ok: boolean; txHash: string }>('/admin/mint', {
      method: 'POST',
      token,
      body,
    }),
  adminBurn: (token: string, amount: string) =>
    request<{ ok: boolean; txHash: string }>('/admin/burn', {
      method: 'POST',
      token,
      body: { amount },
    }),
  adminAdjust: (token: string, body: { userId: string; amountDelta: string; note?: string }) =>
    request<{ ok: boolean; userId?: string; balance: string }>('/admin/adjust', {
      method: 'POST',
      token,
      body,
    }),
  /** Alias of POST /admin/adjust (same validators and handler). */
  adminAdjustBalance: (token: string, body: { userId: string; amountDelta: string; note?: string }) =>
    request<{ ok: boolean; userId?: string; balance: string }>('/admin/adjust-balance', {
      method: 'POST',
      token,
      body,
    }),
};
