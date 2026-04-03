const { validationResult, body } = require('express-validator');
const authService = require('../services/auth.service');
const User = require('../models/User');

const registerValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 characters'),
  body('walletAddress').optional().trim().matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid wallet'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const profileValidators = [
  body('walletAddress').trim().matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid wallet'),
];

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { email, password, walletAddress } = req.body;
    const result = await authService.registerUser(
      { email, password, walletAddress },
      req.app.locals.env
    );
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password }, req.app.locals.env);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function me(req, res) {
  const user = await User.findById(req.user._id);
  res.json({ user: user.toSafeJSON() });
}

async function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { walletAddress } = req.body;
    req.user.walletAddress = walletAddress;
    await req.user.save();
    const fresh = await User.findById(req.user._id);
    res.json({ user: fresh.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
  registerValidators,
  loginValidators,
  profileValidators,
};
