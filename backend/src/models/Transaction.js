const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    counterparty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: [
        'deposit',
        'withdraw',
        'internal_transfer_in',
        'internal_transfer_out',
        'admin_adjustment',
        'admin_mint',
        'admin_burn',
      ],
      required: true,
    },
    amount: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    txHash: { type: String, default: '' },
    note: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index(
  { txHash: 1 },
  {
    unique: true,
    partialFilterExpression: { txHash: { $exists: true, $type: 'string', $gt: '' } },
  }
);

transactionSchema.index(
  { 'metadata.razorpayPaymentId': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'metadata.razorpayPaymentId': { $exists: true, $type: 'string', $nin: ['', null] },
    },
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
