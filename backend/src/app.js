const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const { loadEnv } = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { walletLimiter, adminLimiter } = require('./middleware/rateLimit');

const { requireDb } = require('./middleware/dbReady');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const walletRoutes = require('./routes/wallet.routes');
const adminRoutes = require('./routes/admin.routes');

function buildCorsOrigin(env) {
  if (env.nodeEnv === 'production') {
    if (!env.frontendUrl) {
      throw new Error('FRONTEND_URL is required in production for CORS');
    }
    return env.frontendUrl;
  }
  if (env.frontendUrl) {
    return [env.frontendUrl, 'http://localhost:3033', 'http://127.0.0.1:3033'];
  }
  return true;
}

function createApp() {
  const env = loadEnv();
  const app = express();

  app.locals.env = env;
  if (env.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: buildCorsOrigin(env),
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '512kb' }));
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );

  app.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    const dbOk = mongoose.connection.readyState === 1;
    res.json({ status: 'ok', service: 'inrt-api', database: dbOk ? 'connected' : 'disconnected' });
  });

  app.use('/auth', requireDb, authRoutes);
  app.use('/user', requireDb, walletLimiter, userRoutes);
  app.use('/wallet', requireDb, walletLimiter, walletRoutes);
  app.use('/admin', requireDb, adminLimiter, adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
