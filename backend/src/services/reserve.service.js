const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');
const walletService = require('./wallet.service');

async function getOrCreateSettings() {
  let s = await PlatformSettings.findOne({ key: 'default' });
  if (!s) {
    s = await PlatformSettings.create({ key: 'default' });
  }
  return s;
}

async function getCirculatingLedgerTotal(env) {
  const dec = typeof env.getDecimals === 'function' ? await env.getDecimals() : null;
  try {
    const agg = await User.aggregate([
      {
        $project: {
          amt: {
            $convert: {
              input: { $ifNull: ['$balance', '0'] },
              to: 'decimal',
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$amt' } } },
    ]).exec();
    const t = agg[0]?.total;
    if (t == null) return '0';
    return typeof t === 'object' && t !== null && typeof t.toString === 'function' ? t.toString() : String(t);
  } catch {
    if (!dec) return '0';
    const users = await User.find().select('balance').lean();
    let total = '0';
    for (const u of users) {
      total = walletService.addDecimalStrings(total, u.balance || '0', dec);
    }
    return total;
  }
}

/**
 * If reserveTokenCap is set, ensure circulating + delta does not exceed cap.
 * @param {string} deltaHuman positive amount to add to circulation (mint paths)
 */
async function assertCirculatingWithinCap(deltaHuman, env) {
  const settings = await getOrCreateSettings();
  const cap = settings.reserveTokenCap && String(settings.reserveTokenCap).trim();
  if (!cap || cap === '0') return;

  const dec = await env.getDecimals();
  const circulating = await getCirculatingLedgerTotal({ getDecimals: () => Promise.resolve(dec) });
  const after = walletService.addDecimalStrings(circulating, deltaHuman, dec);
  try {
    walletService.subDecimalStrings(after, cap, dec);
  } catch {
    const err = new Error('Reserve token cap would be exceeded');
    err.status = 400;
    throw err;
  }
}

/**
 * After crediting `deltaHuman`, ledger total must stay <= reserveINR (1:1 token/INR assumption).
 */
async function assertBackingAllowsIncrease(deltaHuman, env) {
  const settings = await getOrCreateSettings();
  const inr = settings.reserveINR && String(settings.reserveINR).trim();
  if (!inr || inr === '0') return;

  const dec = await env.getDecimals();
  const circulating = await getCirculatingLedgerTotal({ getDecimals: () => Promise.resolve(dec) });
  const after = walletService.addDecimalStrings(circulating, deltaHuman, dec);
  try {
    walletService.subDecimalStrings(inr, after, dec);
  } catch {
    const err = new Error('Operation would exceed configured INR reserve backing');
    err.status = 400;
    throw err;
  }
}

async function getReserveSnapshot(env) {
  const settings = await PlatformSettings.findOne({ key: 'default' }).lean();
  const circulating = await getCirculatingLedgerTotal(env);
  return {
    circulatingSupply: circulating,
    totalMinted: settings?.trackedMintSum || '0',
    totalBurned: settings?.trackedBurnSum || '0',
    reserveTokenCap: settings?.reserveTokenCap || '',
    reserveINR: settings?.reserveINR || '',
  };
}

module.exports = {
  getOrCreateSettings,
  getCirculatingLedgerTotal,
  assertCirculatingWithinCap,
  assertBackingAllowsIncrease,
  getReserveSnapshot,
};
