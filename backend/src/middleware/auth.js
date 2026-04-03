const jwt = require('jsonwebtoken');
const { loadEnv } = require('../config/env');
const User = require('../models/User');
const logger = require('../utils/logger');
const { ACCESS_NAME } = require('../config/cookies');

const env = loadEnv();

function extractAccessToken(req) {
  const c = req.cookies?.[ACCESS_NAME];
  if (c && typeof c === 'string') return c;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

function authMiddleware(required = true) {
  return async (req, res, next) => {
    const token = extractAccessToken(req);

    if (!token) {
      if (!required) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret);
      if (payload.typ != null && payload.typ !== 'access') {
        return res.status(401).json({ error: 'Invalid token type' });
      }
      const user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = user;
      req.tokenPayload = payload;
      next();
    } catch (err) {
      logger.warn('JWT verify failed', { message: err.message });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

module.exports = { authMiddleware, extractAccessToken };
