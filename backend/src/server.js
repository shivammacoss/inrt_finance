const { createApp } = require('./app');
const { connectDb } = require('./config/db');
const { loadEnv } = require('./config/env');
const logger = require('./utils/logger');

async function main() {
  const env = loadEnv();
  const app = createApp();

  if (!env.mongoUri || !String(env.mongoUri).trim()) {
    logger.error('MONGO_URI is missing in .env. Add your MongoDB Atlas connection string.');
    process.exit(1);
  }

  try {
    await connectDb(env.mongoUri);
  } catch (e) {
    logger.error('MongoDB connection failed: ' + e.message);
    logger.error(
      'Fix: Atlas → Network Access → Add IP Address (use "Add Current IP" or 0.0.0.0/0 for dev). Verify username/password in MONGO_URI.'
    );
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`INRT API listening on port ${env.port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(
        `Port ${env.port} is already in use (EADDRINUSE). Stop the other process or pick a free PORT in backend/.env and set the same URL in frontend/.env.local as NEXT_PUBLIC_API_URL.`
      );
      process.exit(1);
    }
    throw err;
  });
}

main().catch((e) => {
  logger.error(e.message, { stack: e.stack });
  process.exit(1);
});
