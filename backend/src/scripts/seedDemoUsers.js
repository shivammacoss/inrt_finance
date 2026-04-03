/**
 * Creates fixed demo users for local/testing.
 * Requires MONGO_URI in .env
 *
 * Run: npm run seed:demo
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { loadEnv } = require('../config/env');
const logger = require('../utils/logger');

const DEMO_USERS = [
  {
    email: 'admin@inrt.demo',
    password: 'InrtAdmin@2024',
    role: 'admin',
    walletAddress: '',
  },
  {
    email: 'user1@inrt.demo',
    password: 'InrtUser@2024',
    role: 'user',
    walletAddress: '',
  },
  {
    email: 'user2@inrt.demo',
    password: 'InrtUser@2024',
    role: 'user',
    walletAddress: '',
  },
];

async function run() {
  const env = loadEnv();
  if (!env.mongoUri) {
    logger.error('Set MONGO_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);

  for (const row of DEMO_USERS) {
    const email = row.email.toLowerCase();
    let u = await User.findOne({ email });
    if (u) {
      u.password = row.password;
      u.role = row.role;
      u.walletAddress = row.walletAddress;
      await u.save();
      logger.info(`Updated user: ${email}`);
    } else {
      await User.create({
        email,
        password: row.password,
        role: row.role,
        walletAddress: row.walletAddress,
      });
      logger.info(`Created user: ${email}`);
    }
  }

  await mongoose.disconnect();

  console.log('\n========== INRT demo logins (local only) ==========');
  console.log('Admin:  admin@inrt.demo  /  InrtAdmin@2024');
  console.log('User 1: user1@inrt.demo /  InrtUser@2024');
  console.log('User 2: user2@inrt.demo /  InrtUser@2024');
  console.log('Frontend: http://localhost:3033/login');
  console.log('Admin UI: http://localhost:3033/admin');
  console.log('====================================================\n');

  process.exit(0);
}

run().catch((e) => {
  logger.error(e.message);
  process.exit(1);
});
