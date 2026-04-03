const { validationResult, body } = require('express-validator');
const authService = require('../services/auth.service');
const User = require('../models/User');
const {
  accessCookieOptions,
  refreshCookieOptions,
  ACCESS_NAME,
  REFRESH_NAME,
} = require('../config/cookies');

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

function setSessionCookies(res, env, session) {
  res.cookie(ACCESS_NAME, session.accessToken, accessCookieOptions(env, session.accessMaxAgeMs));
  res.cookie(REFRESH_NAME, session.refreshRaw, refreshCookieOptions(env, session.refreshMaxAgeMs));
}

function clearSessionCookies(res, env) {
  const prod = env.nodeEnv === 'production';
  const base = { httpOnly: true, secure: prod, sameSite: prod ? 'strict' : 'lax' };
  res.clearCookie(ACCESS_NAME, { path: '/', ...base });
  res.clearCookie(REFRESH_NAME, { path: '/auth', ...base });
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { email, password, walletAddress } = req.body;
    const session = await authService.registerUser(
      { email, password, walletAddress },
      req.app.locals.env
    );
    setSessionCookies(res, req.app.locals.env, session);
    res.status(201).json({ user: session.user });
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
    const session = await authService.loginUser({ email, password }, req.app.locals.env);
    setSessionCookies(res, req.app.locals.env, session);
    res.json({ user: session.user });
  } catch (e) {
    next(e);
  }
}

async function refresh(req, res, next) {
  try {
    const raw = req.cookies?.[REFRESH_NAME];
    const session = await authService.rotateRefreshSession(raw, req.app.locals.env);
    setSessionCookies(res, req.app.locals.env, session);
    res.json({ user: session.user });
  } catch (e) {
    next(e);
  }
}

async function logout(req, res, next) {
  try {
    const raw = req.cookies?.[REFRESH_NAME];
    await authService.revokeRefreshToken(raw);
    clearSessionCookies(res, req.app.locals.env);
    res.json({ ok: true });
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
  refresh,
  logout,
  me,
  updateProfile,
  registerValidators,
  loginValidators,
  profileValidators,
  setSessionCookies,
  clearSessionCookies,
};
