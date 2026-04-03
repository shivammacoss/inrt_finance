require('dotenv').config();
const { normalizePrivateKey } = require('../utils/privateKey');

const required = ['MONGO_URI', 'JWT_SECRET', 'RPC_URL', 'CONTRACT_ADDRESS', 'PRIVATE_KEY'];

function parseTokenDecimals() {
  const v = process.env.TOKEN_DECIMALS;
  if (v == null || String(v).trim() === '') return null;
  const n = parseInt(String(v).trim(), 10);
  if (!Number.isFinite(n) || n < 0 || n > 36) {
    throw new Error('TOKEN_DECIMALS must be an integer between 0 and 36');
  }
  return n;
}

function loadEnv() {
  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  let privateKey = '';
  const rawPk = process.env.PRIVATE_KEY;
  if (rawPk && String(rawPk).trim()) {
    try {
      privateKey = normalizePrivateKey(rawPk);
    } catch (e) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `Invalid PRIVATE_KEY: ${e.message}. Use 0x + 64 hex chars (or 64 hex without prefix). No spaces or quotes inside the value.`
        );
      }
      // eslint-disable-next-line no-console
      console.warn('[env] PRIVATE_KEY invalid — blockchain routes will fail until fixed:', e.message);
    }
  }

  let tokenDecimals = null;
  try {
    tokenDecimals = parseTokenDecimals();
  } catch (e) {
    if (process.env.NODE_ENV === 'production') throw e;
    // eslint-disable-next-line no-console
    console.warn('[env] TOKEN_DECIMALS invalid:', e.message);
  }

  return {
    port: parseInt(process.env.PORT || '5001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    rpcUrl: process.env.RPC_URL,
    contractAddress: process.env.CONTRACT_ADDRESS,
    privateKey,
    tokenDecimals,
    depositAddress: process.env.DEPOSIT_ADDRESS || null,
    adminEmails: (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  };
}

module.exports = { loadEnv, required };
