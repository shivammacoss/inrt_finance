require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { loadEnv } = require('../config/env');
const logger = require('../utils/logger');

async function run() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) {
    logger.error('Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in .env');
    process.exit(1);
  }

  const env = loadEnv();
  await mongoose.connect(env.mongoUri);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = 'admin';
    existing.password = password;
    await existing.save();
    logger.info('Updated existing user to admin and reset password');
  } else {
    await User.create({
      email: email.toLowerCase(),
      password,
      role: 'admin',
      walletAddress: '',
    });
    logger.info('Admin user created');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  logger.error(e.message);
  process.exit(1);
});
