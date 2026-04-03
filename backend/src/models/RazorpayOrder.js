const mongoose = require('mongoose');

/**
 * Server-created Razorpay order bound to a user for idempotent verify + amount checks.
 */
const razorpayOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    /** Amount charged in paise (Razorpay integer) */
    amountPaise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    /** INR human string at order time e.g. "100.00" */
    amountInr: { type: String, required: true },
    /** INRT credited (human decimal string) after rate conversion */
    inrtAmount: { type: String, required: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'fulfilling', 'fulfilled', 'failed'],
      default: 'created',
      index: true,
    },
    razorpayPaymentId: { type: String, default: '', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RazorpayOrder', razorpayOrderSchema);
