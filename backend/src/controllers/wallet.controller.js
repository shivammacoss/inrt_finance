const { validationResult, body } = require('express-validator');
const User = require('../models/User');
const walletService = require('../services/wallet.service');
const blockchain = require('../services/blockchain.service');
const requestService = require('../services/request.service');

const transferValidators = [
  body('amount')
    .notEmpty()
    .custom((v) => {
      try {
        walletService.cmpPositive(v);
        walletService.normalizeDecimal(String(v).trim());
        return true;
      } catch (e) {
        throw new Error(e.message || 'Invalid amount');
      }
    }),
  body('toEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .custom(async (email, { req }) => {
      const w = req.body?.toWalletAddress;
      if (w && String(w).trim()) return true;
      if (!email || !String(email).trim()) return true;
      const u = await User.findOne({ email: String(email).toLowerCase().trim() });
      if (!u) throw new Error('No account found with this email address');
      return true;
    }),
  body('toWalletAddress')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Enter a valid BSC address: 0x plus 40 hexadecimal characters'),
  body().custom((_, { req }) => {
    const e = req.body?.toEmail;
    const w = req.body?.toWalletAddress;
    if ((e && String(e).trim()) && (w && String(w).trim())) {
      throw new Error('Send to either recipient email or wallet address, not both');
    }
    if (!(e && String(e).trim()) && !(w && String(w).trim())) {
      throw new Error('Provide toEmail or toWalletAddress');
    }
    return true;
  }),
];

const depositValidators = [body('txHash').trim().matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Invalid tx hash')];

const withdrawValidators = [
  body('amount').notEmpty(),
  body('payoutMethod').optional().isIn(['upi', 'bank', 'biznext']),
  body('payoutDetails').optional().isString().isLength({ max: 2000 }),
];

const depositRequestValidators = [
  body('amount')
    .notEmpty()
    .custom((v) => {
      try {
        walletService.cmpPositive(v);
        walletService.normalizeDecimal(String(v).trim());
        return true;
      } catch (e) {
        throw new Error(e.message || 'Invalid amount');
      }
    }),
  body('paymentMethod')
    .isIn(['upi', 'bank_transfer', 'card', 'other'])
    .withMessage('Invalid payment method'),
  body('paymentReference').optional().isString().trim().isLength({ max: 500 }),
];

const withdrawRequestValidators = [
  body('amount')
    .notEmpty()
    .custom((v) => {
      try {
        walletService.cmpPositive(v);
        walletService.normalizeDecimal(String(v).trim());
        return true;
      } catch (e) {
        throw new Error(e.message || 'Invalid amount');
      }
    }),
  body('withdrawalMethod')
    .isIn(['upi', 'bank_transfer', 'card', 'other'])
    .withMessage('Invalid withdrawal method'),
  body('payoutDetails')
    .trim()
    .notEmpty()
    .withMessage(
      'Enter payout details: UPI ID, bank account + IFSC, or how you want to receive card / other payouts'
    )
    .isLength({ max: 2000 }),
];

async function balance(req, res, next) {
  try {
    const dec = await blockchain.getDecimals(req.app.locals.env);
    const data = await walletService.getBalance(req.user._id, dec);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function depositInfo(req, res, next) {
  try {
    const env = req.app.locals.env;
    let depositAddress = env.depositAddress || '';
    if (!depositAddress && env.privateKey) {
      try {
        depositAddress = blockchain.platformAddress(env.privateKey);
      } catch {
        depositAddress = '';
      }
    }
    res.json({
      depositAddress,
      contractAddress: env.contractAddress,
      network: 'BNB Smart Chain',
      paymentRails: env.paymentRails || null,
    });
  } catch (e) {
    next(e);
  }
}

async function transfer(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const env = req.app.locals.env;
    const dec = await blockchain.getDecimals(env);
    const result = await walletService.internalTransfer(req.user._id, req.body, dec);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

async function deposit(req, res) {
  res.status(403).json({
    error:
      'Direct on-chain deposit confirmation is disabled. Submit a deposit request via POST /wallet/deposit-request and wait for admin approval.',
  });
}

async function withdraw(req, res) {
  res.status(403).json({
    error:
      'Direct withdrawal is disabled. Submit a request via POST /wallet/withdraw-request and wait for admin approval.',
  });
}

async function depositRequest(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { amount, paymentMethod, paymentReference } = req.body;
    const doc = await requestService.createDepositRequest(
      req.user._id,
      { amount, paymentMethod, paymentReference },
      req.app.locals.env
    );
    res.status(201).json({
      ok: true,
      message: 'Request submitted, waiting for admin approval',
      request: {
        id: doc._id.toString(),
        type: doc.type,
        amount: doc.amount,
        status: doc.status,
        createdAt: doc.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function withdrawRequest(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const doc = await requestService.createWithdrawRequest(
      req.user._id,
      {
        amount: req.body.amount,
        withdrawalMethod: req.body.withdrawalMethod,
        payoutDetails: req.body.payoutDetails,
      },
      req.app.locals.env
    );
    res.status(201).json({
      ok: true,
      message: 'Request submitted, waiting for admin approval',
      request: {
        id: doc._id.toString(),
        type: doc.type,
        amount: doc.amount,
        status: doc.status,
        createdAt: doc.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function listRequests(req, res, next) {
  try {
    const lim = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const items = await requestService.listForUser(req.user._id, { limit: lim });
    res.json({ requests: items });
  } catch (e) {
    next(e);
  }
}

async function transactions(req, res, next) {
  try {
    const lim = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const items = await walletService.listTransactions(req.user._id, lim);
    res.json({ transactions: items });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  balance,
  depositInfo,
  transfer,
  deposit,
  withdraw,
  depositRequest,
  withdrawRequest,
  listRequests,
  transactions,
  transferValidators,
  depositValidators,
  withdrawValidators,
  depositRequestValidators,
  withdrawRequestValidators,
};
