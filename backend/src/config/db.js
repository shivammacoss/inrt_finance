const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDb(mongoUri) {
  const uri = mongoUri && String(mongoUri).trim();
  if (!uri) {
    throw new Error('MONGO_URI is missing or empty');
  }

  mongoose.set('strictQuery', true);
  // Fail fast instead of buffering commands for 10s when disconnected
  mongoose.set('bufferCommands', false);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 12_000,
    socketTimeoutMS: 45_000,
    maxPoolSize: 10,
  });

  logger.info('MongoDB connected');
  return mongoose.connection;
}

module.exports = { connectDb };
