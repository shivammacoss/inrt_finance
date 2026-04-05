const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['deposit', 'withdraw'], required: true },
    /** Human-readable decimal string (matches ledger precision) */
    amount: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    /** Snapshot of user BSC wallet at request time (mint target / payout reference) */
    walletAddress: { type: String, default: '' },
    paymentMethod: { type: String, trim: true, default: '' },
    withdrawalMethod: { type: String, trim: true, default: '' },
    /** User note: payment reference, etc. */
    note: { type: String, default: '' },
    /** Structured payment reference (UPI ref, gateway id) — validated later via webhook */
    paymentReference: { type: String, trim: true, default: '' },
    /** Placeholder for Razorpay / gateway reconciliation */
    paymentVerificationStatus: {
      type: String,
      enum: ['none', 'pending_review', 'verified', 'failed'],
      default: 'none',
    },
    paymentVerificationNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectReason: { type: String, default: '' },
    /** Admin-only note on approve / reject */
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

requestSchema.index({ status: 1, createdAt: -1 });
/** Uniqueness only while request is open — avoids blocking the same UTR after approve/reject */
requestSchema.index(
  { paymentReference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      paymentReference: { $exists: true, $type: 'string', $nin: ['', null] },
      status: { $in: ['pending', 'processing'] },
    },
  }
);

module.exports = mongoose.model('Request', requestSchema);
