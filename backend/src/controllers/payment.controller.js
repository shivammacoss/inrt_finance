const { validationResult, body } = require('express-validator');
const paymentService = require('../services/payment.service');

const createOrderValidators = [
  body('amount')
    .notEmpty()
    .custom((v) => {
      const n = parseFloat(String(v).trim());
      if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid amount');
      return true;
    }),
];

const verifyValidators = [
  body('razorpay_order_id').notEmpty().isString(),
  body('razorpay_payment_id').notEmpty().isString(),
  body('razorpay_signature').notEmpty().isString(),
  body('amount')
    .optional()
    .custom((v) => {
      if (v === undefined || v === null || v === '') return true;
      const n = parseFloat(String(v).trim());
      if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid amount');
      return true;
    }),
];

async function createOrder(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const out = await paymentService.createOrder(req.user._id, req.body.amount, req.app.locals.env);
    res.json(out);
  } catch (e) {
    next(e);
  }
}

async function verify(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const result = await paymentService.verifyPayment(
      req.user._id,
      {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amountInr: amount,
      },
      req.app.locals.env
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function webhook(req, res, next) {
  try {
    const sig = req.get('X-Razorpay-Signature') || req.get('x-razorpay-signature');
    const raw = req.body;
    if (!Buffer.isBuffer(raw)) {
      return res.status(400).json({ error: 'Expected raw body' });
    }
    const result = await paymentService.handleWebhook(raw, sig, req.app.locals.env);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createOrder,
  verify,
  webhook,
  createOrderValidators,
  verifyValidators,
};
