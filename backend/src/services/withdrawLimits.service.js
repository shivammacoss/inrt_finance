const { ethers } = require('ethers');
const PlatformSettings = require('../models/PlatformSettings');
const User = require('../models/User');
const walletService = require('./wallet.service');

function utcDayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getSettings() {
  let s = await PlatformSettings.findOne({ key: 'default' });
  if (!s) {
    s = await PlatformSettings.create({ key: 'default' });
  }
  return s;
}

/**
 * Per-user daily withdraw limit (new requests). Env USER_DAILY_WITHDRAW_LIMIT or unlimited if unset.
 */
function userDailyCapFromEnv(env) {
  const v = env.userDailyWithdrawLimit && String(env.userDailyWithdrawLimit).trim();
  return v || '';
}

/**
 * Global daily cap: fraction of reserveINR or reserveTokenCap per day (default 20%).
 */
function globalCapFraction(env) {
  const n = parseFloat(env.globalWithdrawDailyFraction || '0.2');
  if (!Number.isFinite(n) || n <= 0 || n > 1) return 0.2;
  return n;
}

async function assertUserDailyWithdraw(user, amountHuman, dec, env) {
  const cap = userDailyCapFromEnv(env);
  if (!cap) return;

  const day = utcDayKey();
  let key = user.withdrawDailyKey || '';
  let used = user.withdrawDailyAmount || '0';
  if (key !== day) {
    key = day;
    used = '0';
  }
  const nextUsed = walletService.addDecimalStrings(used, amountHuman, dec);
  try {
    walletService.subDecimalStrings(cap, nextUsed, dec);
  } catch {
    const err = new Error('Per-user daily withdrawal limit exceeded');
    err.status = 400;
    throw err;
  }
}

async function recordUserDailyWithdraw(userId, amountHuman, dec) {
  const day = utcDayKey();
  const user = await User.findById(userId);
  if (!user) return;
  let key = user.withdrawDailyKey || '';
  let used = user.withdrawDailyAmount || '0';
  if (key !== day) {
    key = day;
    used = '0';
  }
  user.withdrawDailyKey = key;
  user.withdrawDailyAmount = walletService.addDecimalStrings(used, amountHuman, dec);
  await user.save();
}

async function assertGlobalDailyWithdraw(amountHuman, dec, env) {
  const settings = await getSettings();
  const base =
    (settings.reserveTokenCap && String(settings.reserveTokenCap).trim()) ||
    (settings.reserveINR && String(settings.reserveINR).trim()) ||
    '';
  if (!base || base === '0') return;

  const fracNum = globalCapFraction(env);
  const pct = Math.min(100, Math.max(1, Math.round(fracNum * 100)));
  let capStr;
  try {
    walletService.normalizeDecimal(base);
    const whole = ethers.parseUnits(base, dec);
    const portion = (whole * BigInt(pct)) / 100n;
    capStr = ethers.formatUnits(portion, dec);
  } catch {
    return;
  }

  const day = utcDayKey();
  let gKey = settings.withdrawGlobalDayKey || '';
  let gUsed = settings.withdrawGlobalDayAmount || '0';
  if (gKey !== day) {
    gKey = day;
    gUsed = '0';
  }
  const nextGlobal = walletService.addDecimalStrings(gUsed, amountHuman, dec);
  try {
    walletService.subDecimalStrings(capStr, nextGlobal, dec);
  } catch {
    const err = new Error('Global daily withdrawal limit exceeded (fraction of reserve)');
    err.status = 400;
    throw err;
  }
}

async function recordGlobalDailyWithdraw(amountHuman, dec) {
  const settings = await getSettings();
  const day = utcDayKey();
  let gKey = settings.withdrawGlobalDayKey || '';
  let gUsed = settings.withdrawGlobalDayAmount || '0';
  if (gKey !== day) {
    gKey = day;
    gUsed = '0';
  }
  settings.withdrawGlobalDayKey = gKey;
  settings.withdrawGlobalDayAmount = walletService.addDecimalStrings(gUsed, amountHuman, dec);
  await settings.save();
}

module.exports = {
  assertUserDailyWithdraw,
  assertGlobalDailyWithdraw,
  recordUserDailyWithdraw,
  recordGlobalDailyWithdraw,
  utcDayKey,
};
