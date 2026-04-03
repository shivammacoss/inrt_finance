const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['mint', 'burn', 'balance_adjustment'],
      required: true,
    },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    amount: { type: String, default: '' },
    recipientAddress: { type: String, default: '' },
    txHash: { type: String, default: '' },
    note: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

adminActionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminAction', adminActionSchema);
