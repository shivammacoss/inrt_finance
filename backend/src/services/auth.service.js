const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const { parseExpiresToSeconds } = require('../utils/duration');

function signAccessToken(user, env) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      typ: 'access',
      jti: `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
    },
    env.jwtSecret,
    { expiresIn: env.jwtAccessExpiresIn || '15m' }
  );
}

function createRefreshRaw() {
  return crypto.randomBytes(48).toString('base64url');
}

function hashRefresh(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function persistRefreshToken(userId, raw, env) {
  const tokenHash = hashRefresh(raw);
  const sec = parseExpiresToSeconds(env.jwtRefreshExpiresIn || '7d');
  const expiresAt = new Date(Date.now() + sec * 1000);
  await RefreshToken.create({ user: userId, tokenHash, expiresAt });
  return { maxAgeMs: sec * 1000, expiresAt };
}

async function issueAuthSession(user, env) {
  const accessToken = signAccessToken(user, env);
  const refreshRaw = createRefreshRaw();
  const { maxAgeMs } = await persistRefreshToken(user._id, refreshRaw, env);
  const accessSec = parseExpiresToSeconds(env.jwtAccessExpiresIn || '15m');
  return {
    user: user.toSafeJSON(),
    accessToken,
    refreshRaw,
    accessMaxAgeMs: accessSec * 1000,
    refreshMaxAgeMs: maxAgeMs,
  };
}

async function rotateRefreshSession(rawRefresh, env) {
  if (!rawRefresh || typeof rawRefresh !== 'string') {
    const err = new Error('Missing refresh token');
    err.status = 401;
    throw err;
  }
  const tokenHash = hashRefresh(rawRefresh);
  const doc = await RefreshToken.findOne({ tokenHash });
  if (!doc || doc.expiresAt < new Date()) {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }
  await RefreshToken.deleteOne({ _id: doc._id });
  const user = await User.findById(doc.user);
  if (!user) {
    const err = new Error('User not found');
    err.status = 401;
    throw err;
  }
  return issueAuthSession(user, env);
}

async function revokeRefreshToken(rawRefresh) {
  if (!rawRefresh || typeof rawRefresh !== 'string') return;
  await RefreshToken.deleteOne({ tokenHash: hashRefresh(rawRefresh) });
}

async function revokeAllRefreshForUser(userId) {
  await RefreshToken.deleteMany({ user: userId });
}

async function registerUser({ email, password, walletAddress }, env) {
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  let role = 'user';
  if (env.adminEmails?.includes(email.toLowerCase())) {
    role = 'admin';
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    walletAddress: walletAddress || '',
    role,
  });

  const fresh = await User.findById(user._id);
  const session = await issueAuthSession(fresh, env);
  return session;
}

async function loginUser({ email, password }, env) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const safe = await User.findById(user._id);
  return issueAuthSession(safe, env);
}

module.exports = {
  registerUser,
  loginUser,
  signAccessToken,
  issueAuthSession,
  rotateRefreshSession,
  revokeRefreshToken,
  revokeAllRefreshForUser,
  hashRefresh,
};
