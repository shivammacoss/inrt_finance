const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    /** Cumulative amount minted on-chain (admin ops), human-readable token units */
    trackedMintSum: { type: String, default: '0' },
    /** Cumulative amount burned on-chain (admin ops), human-readable token units */
    trackedBurnSum: { type: String, default: '0' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
