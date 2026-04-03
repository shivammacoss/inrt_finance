const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    /** Cumulative amount minted on-chain (admin ops), human-readable token units */
    trackedMintSum: { type: String, default: '0' },
    /** Cumulative amount burned on-chain (admin ops), human-readable token units */
    trackedBurnSum: { type: String, default: '0' },
    /** Optional cap: sum of user ledger balances must not exceed this (token units) */
    reserveTokenCap: { type: String, default: '' },
    /** Optional INR reserve backing (display / compliance; same numeric compare as token if 1:1) */
    reserveINR: { type: String, default: '' },
    /** UTC date YYYY-MM-DD for global daily withdraw total */
    withdrawGlobalDayKey: { type: String, default: '' },
    /** Token amount withdrawn (approved) globally on withdrawGlobalDayKey */
    withdrawGlobalDayAmount: { type: String, default: '0' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
