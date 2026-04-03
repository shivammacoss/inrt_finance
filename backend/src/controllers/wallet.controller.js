const { validationResult, body } = require('express-validator');
const walletService = require('../services/wallet.service');
const blockchain = require('../services/blockchain.service');

const transferValidators = [
  body('amount').notEmpty(),
  body('toEmail').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('toWalletAddress').optional({ checkFalsy: true }).trim(),
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

async function balance(req, res, next) {
  try {
    const data = await walletService.getBalance(req.user._id);
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

async function deposit(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const result = await walletService.recordDeposit(req.user._id, req.body.txHash, req.app.locals.env);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

async function withdraw(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const payoutMethod = req.body.payoutMethod || 'biznext';
    const payoutDetails = req.body.payoutDetails;
    const result = await walletService.withdraw(req.user._id, req.body.amount, req.app.locals.env, {
      payoutMethod,
      payoutDetails,
    });
    res.json({ ok: true, ...result });
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
  transactions,
  transferValidators,
  depositValidators,
  withdrawValidators,
};
