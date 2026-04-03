const jwt = require('jsonwebtoken');
const { loadEnv } = require('../config/env');
const User = require('../models/User');
const logger = require('../utils/logger');

const env = loadEnv();

function authMiddleware(required = true) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      if (!required) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret);
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

module.exports = { authMiddleware };
