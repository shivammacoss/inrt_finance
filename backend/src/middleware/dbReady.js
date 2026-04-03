const mongoose = require('mongoose');

/**
 * Reject API calls if MongoDB is not connected (avoids 10s Mongoose buffer timeouts).
 */
function requireDb(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  return res.status(503).json({
    error:
      'Database is not connected. Set MONGO_URI in backend/.env and in MongoDB Atlas → Network Access allow your current IP (or 0.0.0.0/0 for dev only).',
    code: 'DB_UNAVAILABLE',
  });
}

module.exports = { requireDb };
