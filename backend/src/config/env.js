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

  const paymentRails = {
    upi: {
      payToId: (process.env.PAYMENT_UPI_ID || '').trim() || null,
      payToName: (process.env.PAYMENT_UPI_NAME || '').trim() || 'INRT',
    },
    bank_transfer: {
      accountName: (process.env.PAYMENT_BANK_HOLDER || '').trim() || null,
      accountNumber: (process.env.PAYMENT_BANK_ACCOUNT || '').trim() || null,
      ifsc: (process.env.PAYMENT_BANK_IFSC || '').trim() || null,
      bankName: (process.env.PAYMENT_BANK_NAME || '').trim() || null,
    },
    card: {
      instructions:
        (process.env.PAYMENT_CARD_INSTRUCTIONS || '').trim() ||
        'Complete card payment through your bank app or gateway, then paste the transaction / approval reference below. Admin will match it to your request.',
    },
    other: {
      instructions:
        (process.env.PAYMENT_OTHER_INSTRUCTIONS || '').trim() ||
        'Pay using the method shared by support (QR, link, etc.) and describe the payment in the reference field.',
    },
  };

  const razorpayDepositModeRaw = (process.env.RAZORPAY_DEPOSIT_MODE || 'safe').trim().toLowerCase();
  const razorpayDepositMode = razorpayDepositModeRaw === 'auto' ? 'auto' : 'safe';
  const razMin = parseFloat(process.env.RAZORPAY_MIN_INR || '1');
  const razMax = parseFloat(process.env.RAZORPAY_MAX_INR || '500000');
  const razorpayMinInr = Number.isFinite(razMin) && razMin > 0 ? razMin : 1;
  let razorpayMaxInr = Number.isFinite(razMax) && razMax > 0 ? razMax : 500000;
  if (razorpayMaxInr < razorpayMinInr) razorpayMaxInr = razorpayMinInr;

  return {
    port: parseInt(process.env.PORT || '5001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    /** @deprecated use jwtAccessExpiresIn */
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    frontendUrl: (process.env.FRONTEND_URL || '').trim(),
    userDailyWithdrawLimit: (process.env.USER_DAILY_WITHDRAW_LIMIT || '').trim(),
    globalWithdrawDailyFraction: process.env.GLOBAL_WITHDRAW_DAILY_FRACTION || '0.2',
    rpcUrl: process.env.RPC_URL,
    contractAddress: process.env.CONTRACT_ADDRESS,
    privateKey,
    tokenDecimals,
    depositAddress: process.env.DEPOSIT_ADDRESS || null,
    adminEmails: (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    paymentRails,
    razorpayKeyId: (process.env.RAZORPAY_KEY_ID || '').trim(),
    razorpayKeySecret: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
    razorpayWebhookSecret: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
    razorpayDepositMode,
    razorpayMinInr,
    razorpayMaxInr,
    inrtPerInrRate: (process.env.INRT_PER_INR_RATE || '1').trim(),
  };
}

module.exports = { loadEnv, required };
