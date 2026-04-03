# INRT Platform

**MERN-style stack** (no Docker required):

- **M**ongoDB — cloud (**MongoDB Atlas**) *or* **MongoDB Community** installed on your machine (connection via `MONGO_URI` only)
- **E**xpress — REST API in `backend/`
- **R**eact — UI via **Next.js** in `frontend/`
- **N**ode.js — runtime for API and build tools

Blockchain: BEP-20 on BNB Smart Chain (`ethers.js`). Docker / docker-compose इस प्रोजेक्ट का हिस्सा नहीं है।

## Structure

- `backend/` — Node.js (Express), MVC-style layout (`models`, `controllers`, `services`, `routes`, `middleware`)
- `frontend/` — Next.js 14 (App Router), user dashboard + admin dashboard
- `deploy/` — Sample Nginx config for EC2

## Quick start (both servers)

From the repo root (after `backend/.env` has a working `MONGO_URI`):

```bash
npm install
npm run dev
```

This starts the API on **:5001** and the Next.js UI on **:3033** (defaults chosen to avoid clashes with apps using 5000/3030). If you only run the frontend, login will fail with “connection refused” until the backend is up.

### Login links (local dev — UI port **3033**)

| Who | URL | After login |
|-----|-----|-------------|
| **Normal user** | [http://localhost:3033/login](http://localhost:3033/login) | Redirects to `/dashboard` |
| **Admin** | [http://localhost:3033/login?next=/admin](http://localhost:3033/login?next=/admin) | Redirects to `/admin` |

Same email/password form for both; only the account’s `role` (`user` vs `admin`) differs. Demo credentials: `backend/DEMO_ACCOUNTS.txt`.

If **ports still clash**, change `PORT` in `backend/.env` and the same host/port in `frontend/.env.local` as `NEXT_PUBLIC_API_URL`.

In production, replace `http://localhost:3033` with your deployed site URL (e.g. `https://app.yourdomain.com/login`).

## Prerequisites

- **Node.js** 18+
- **MongoDB** (pick one — no Docker):
  - **Atlas:** free cluster → copy `mongodb+srv://...` into `backend/.env` as `MONGO_URI` → Network Access में अपना IP allow करें
  - **Local install:** [MongoDB Community Server](https://www.mongodb.com/try/download/community) → फिर `MONGO_URI=mongodb://127.0.0.1:27017/inrt`
- **BSC token** (optional for full on-chain flows): contract with `mint` / `burn` / `transfer` / `balanceOf` / `decimals` (और stats के लिए `totalSupply` अगर हो)

## Backend setup

1. Copy `backend/.env.example` to `backend/.env` and fill values:

   - `MONGO_URI`, `JWT_SECRET`, `RPC_URL`, `CONTRACT_ADDRESS`, `PRIVATE_KEY`
   - Optional: `DEPOSIT_ADDRESS` if deposits should go to an address other than the signer wallet
   - Optional: `ADMIN_EMAILS` — comma-separated emails that receive `admin` role on **register**

2. Install and run:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   API defaults to `http://localhost:5001`.

3. Create the first admin (promotes user or creates one):

   ```bash
   # Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in .env, then:
   npm run seed:admin
   ```

4. Optional — fixed demo users (admin + 2 users). See `backend/DEMO_ACCOUNTS.txt` for emails/passwords:

   ```bash
   cd backend
   npm run seed:demo
   ```

## Frontend setup

1. Copy `frontend/.env.local.example` to `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001
   ```

2. Run:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## API summary

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | — |
| POST | `/auth/login` | — |
| GET | `/auth/me` | User |
| PATCH | `/auth/profile` | User (wallet address) |
| GET | `/wallet/balance` | User |
| GET | `/wallet/deposit-info` | User |
| POST | `/wallet/transfer` | User (internal, by email) |
| POST | `/wallet/deposit` | User (`txHash` verified on-chain) |
| POST | `/wallet/withdraw` | User |
| GET | `/wallet/transactions` | User |
| GET | `/admin/stats` | Admin |
| GET | `/admin/users` | Admin |
| GET | `/admin/transactions` | Admin |
| GET | `/admin/actions` | Admin |
| POST | `/admin/mint` | Admin |
| POST | `/admin/burn` | Admin |
| POST | `/admin/adjust` | Admin (manual ledger adjustment) |

Set `CORS_ORIGIN` on the API to your frontend origin in production (e.g. `https://app.yourdomain.com`).

## Deployment notes

### Backend (AWS EC2)

- Install Node 18+, clone repo, configure `backend/.env`
- `cd backend && npm ci && npm run start` or use PM2: `npm i -g pm2 && pm2 start ecosystem.config.cjs`
- Put Nginx in front (see `deploy/nginx-inrt-api.sample.conf`), obtain TLS certificates (e.g. Let’s Encrypt)
- Restrict security groups; never commit `.env`

### Frontend (Vercel)

- Import the `frontend` directory as a project
- Set `NEXT_PUBLIC_API_URL` to your public API URL (HTTPS)

### Frontend (S3 + CloudFront)

- `cd frontend && npm run build` — upload `.next` static export is not default; for SPA-style you can use `output: 'export'` if you accept static-only constraints, or run `next start` on a small Node host. Vercel or a Node server is simpler for this app.

### Security checklist

- Strong `JWT_SECRET`, rotate periodically
- Hot wallet `PRIVATE_KEY` only on the server; minimal balance; consider HSM / KMS for high value
- Rate limiting and WAF in front of the API in production
- Audit logs: Winston logs to console; file logs in production under `backend/logs/`

## Troubleshooting

| Symptom | What to do |
|--------|------------|
| Next.js **Cannot find module './301.js'** (or similar under `.next`) | Corrupted build cache. Run: `cd frontend && npm run clean` then `npm run dev` (or `npm run dev:fresh`). Stop all `next dev` processes first. |
| **Failed to fetch** / **ERR_CONNECTION_REFUSED** on login | Backend not running or wrong port. Run `npm run dev` from repo root. UI: **http://localhost:3033**. Health: `http://localhost:5001/health` (match `backend/.env` `PORT`). |
| **MongoDB connection failed** at API startup | Set `MONGO_URI` in `backend/.env`. **Atlas:** Network Access → allow your IP. **Local Mongo (no Docker):** `mongodb://127.0.0.1:27017/inrt` और MongoDB Windows service चालू रखें। |
| Next.js “outdated” notice in dev overlay | Optional: later upgrade `next` in `frontend/package.json`; it does not block development. |

## License

Proprietary — your deployment.
