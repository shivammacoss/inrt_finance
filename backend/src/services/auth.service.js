const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user, jwtSecret, expiresIn) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    jwtSecret,
    { expiresIn }
  );
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

  const token = signToken(user, env.jwtSecret, env.jwtExpiresIn);
  return { user: user.toSafeJSON(), token };
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
  const token = signToken(safe, env.jwtSecret, env.jwtExpiresIn);
  return { user: safe.toSafeJSON(), token };
}

module.exports = { registerUser, loginUser, signToken };
