/** Local demo accounts — run: cd backend && npm run seed:demo */
export const DEMO_LOGIN = {
  admin: { email: 'admin@inrt.com', password: 'InrtAdmin@2026' },
  users: [
    { label: 'User 1', email: 'user1@inrt.demo', password: 'InrtUser@2024' },
    { label: 'User 2', email: 'user2@inrt.demo', password: 'InrtUser@2024' },
  ],
} as const;

/** Shared with admin shell — one theme for whole PV-style UI */
export const PV_THEME_STORAGE_KEY = 'inrt-pv-theme';
