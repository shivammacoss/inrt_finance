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
const paymentRoutes = require('./routes/payment.routes');
const paymentController = require('./controllers/payment.controller');

function buildCorsOrigin(env) {
  const urls = env.frontendUrls?.length ? env.frontendUrls : env.frontendUrl ? [env.frontendUrl] : [];
  if (env.nodeEnv === 'production') {
    if (!urls.length) {
      throw new Error(
        'FRONTEND_URL is required in production for CORS (comma-separated for user + admin origins)'
      );
    }
    return urls;
  }
  const dev = [...urls, 'http://localhost:3033', 'http://127.0.0.1:3033'];
  return dev.length ? dev : true;
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
  /* Razorpay webhook HMAC is computed over raw body — must run before express.json() */
  app.post(
    '/payment/webhook',
    express.raw({ type: 'application/json' }),
    requireDb,
    paymentController.webhook
  );
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
  app.use('/payment', requireDb, walletLimiter, paymentRoutes);
  app.use('/admin', requireDb, adminLimiter, adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
