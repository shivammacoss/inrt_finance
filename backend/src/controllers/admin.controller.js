const { validationResult, body, query } = require('express-validator');
const adminService = require('../services/admin.service');

const mintValidators = [
  body('recipientAddress')
    .trim()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage(
      'Invalid address: use a BSC wallet like 0x + 40 hex characters (example: 0x1234…abcd). Random text will not work.'
    ),
  body('amount').notEmpty(),
  body('creditUserId').optional().isMongoId(),
];

const burnValidators = [body('amount').notEmpty()];

const adjustValidators = [
  body('userId').isMongoId(),
  body('amountDelta').notEmpty(),
  body('note').optional().isString().isLength({ max: 500 }),
];

const requestIdValidators = [
  body('requestId').isMongoId().withMessage('Valid requestId required'),
  body('adminNote').optional().isString().isLength({ max: 500 }),
];

const rejectRequestValidators = [
  body('requestId').isMongoId(),
  body('reason').optional().isString().isLength({ max: 500 }),
  body('adminNote').optional().isString().isLength({ max: 500 }),
];

async function stats(req, res, next) {
  try {
    const data = await adminService.getStats(req.app.locals.env);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function users(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const data = await adminService.listUsers({ page, limit });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function transactions(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const data = await adminService.listAllTransactions({ page, limit });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function actions(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const items = await adminService.listAdminActions({ limit });
    res.json({ actions: items });
  } catch (e) {
    next(e);
  }
}

async function mint(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { recipientAddress, amount, creditUserId } = req.body;
    const result = await adminService.mint(
      req.user,
      { recipientAddress, amount, creditUserId },
      req.app.locals.env
    );
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

async function burn(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const result = await adminService.burn(req.user, { amount: req.body.amount }, req.app.locals.env);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

async function adjust(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const result = await adminService.adjustBalance(req.user, req.body, req.app.locals.env);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

async function listRequests(req, res, next) {
  try {
    const status = req.query.status ? String(req.query.status) : 'queue';
    const data = await adminService.listRequests({ status });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function approveRequest(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const result = await adminService.approveRequest(
      req.user,
      req.body.requestId,
      req.app.locals.env,
      req.body.adminNote
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function rejectRequest(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const result = await adminService.rejectRequest(
      req.user,
      req.body.requestId,
      req.body.reason,
      req.app.locals.env,
      req.body.adminNote
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  stats,
  users,
  transactions,
  actions,
  mint,
  burn,
  adjust,
  listRequests,
  approveRequest,
  rejectRequest,
  mintValidators,
  burnValidators,
  adjustValidators,
  requestIdValidators,
  rejectRequestValidators,
};
