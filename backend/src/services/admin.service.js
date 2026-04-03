const { ethers } = require('ethers');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AdminAction = require('../models/AdminAction');
const PlatformSettings = require('../models/PlatformSettings');
const blockchain = require('./blockchain.service');
const walletService = require('./wallet.service');

async function getOrCreateSettings() {
  let s = await PlatformSettings.findOne({ key: 'default' });
  if (!s) {
    s = await PlatformSettings.create({ key: 'default' });
  }
  return s;
}

async function listUsers({ page = 1, limit = 20 } = {}) {
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const lim = Math.min(100, Math.max(1, limit));
  const [items, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    User.countDocuments(),
  ]);
  return {
    users: items.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      walletAddress: u.walletAddress,
      balance: u.balance,
      role: u.role,
      createdAt: u.createdAt,
    })),
    total,
    page: Math.max(1, page),
    limit: lim,
  };
}

async function listAllTransactions({ page = 1, limit = 50 } = {}) {
  const skip = (Math.max(1, page) - 1) * Math.min(200, Math.max(1, limit));
  const lim = Math.min(200, Math.max(1, limit));
  const [items, total] = await Promise.all([
    Transaction.find()
      .populate('user', 'email')
      .populate('counterparty', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .lean(),
    Transaction.countDocuments(),
  ]);
  return { transactions: items, total, page: Math.max(1, page), limit: lim };
}

async function listAdminActions({ limit = 100 } = {}) {
  const lim = Math.min(500, Math.max(1, limit));
  return AdminAction.find()
    .populate('admin', 'email')
    .populate('targetUser', 'email')
    .sort({ createdAt: -1 })
    .limit(lim)
    .lean();
}

async function mint(adminUser, { recipientAddress, amount, creditUserId }, env) {
  walletService.cmpPositive(amount);
  walletService.normalizeDecimal(amount);

  const recipient = String(recipientAddress).trim();
  if (!ethers.isAddress(recipient)) {
    const err = new Error('Invalid recipient wallet address');
    err.status = 400;
    throw err;
  }
  const checksummed = ethers.getAddress(recipient);

  let txHash;
  try {
    const out = await blockchain.mintTokens(env, checksummed, amount);
    txHash = out.txHash;
  } catch (e) {
    if (e.status) throw e;
    throw e;
  }

  let targetUser = null;
  if (creditUserId) {
    targetUser = await User.findById(creditUserId);
    if (!targetUser) {
      const err = new Error('creditUserId not found');
      err.status = 404;
      throw err;
    }
    const dec = await blockchain.getDecimals(env);
    targetUser.balance = walletService.addDecimalStrings(targetUser.balance, amount, dec);
    await targetUser.save();
  } else {
    const addr = checksummed.toLowerCase();
    targetUser = await User.findOne({
      walletAddress: new RegExp(`^${addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (targetUser) {
      const dec = await blockchain.getDecimals(env);
      targetUser.balance = walletService.addDecimalStrings(targetUser.balance, amount, dec);
      await targetUser.save();
    }
  }

  const dec = await blockchain.getDecimals(env);
  const settings = await getOrCreateSettings();
  settings.trackedMintSum = walletService.addDecimalStrings(settings.trackedMintSum, amount, dec);
  await settings.save();

  await AdminAction.create({
    admin: adminUser._id,
    action: 'mint',
    targetUser: targetUser?._id || null,
    amount,
    recipientAddress: checksummed,
    txHash,
    note: 'On-chain mint',
  });

  const ledgerUserId = targetUser?._id || adminUser._id;
  await Transaction.create({
    user: ledgerUserId,
    type: 'admin_mint',
    amount,
    status: 'completed',
    txHash,
    note: targetUser ? `Mint credited to user ledger` : 'On-chain mint (no ledger credit)',
    metadata: {
      recipientAddress: checksummed,
      creditedUserId: targetUser?._id?.toString() || null,
      performedBy: adminUser._id.toString(),
    },
  });

  return { txHash, creditedUserId: targetUser?._id || null };
}

async function burn(adminUser, { amount }, env) {
  walletService.cmpPositive(amount);
  walletService.normalizeDecimal(amount);

  let txHash;
  try {
    const out = await blockchain.burnTokens(env, amount);
    txHash = out.txHash;
  } catch (e) {
    if (e.status) throw e;
    throw e;
  }

  const dec = await blockchain.getDecimals(env);
  const settings = await getOrCreateSettings();
  settings.trackedBurnSum = walletService.addDecimalStrings(settings.trackedBurnSum, amount, dec);
  await settings.save();

  await AdminAction.create({
    admin: adminUser._id,
    action: 'burn',
    amount,
    txHash,
    note: 'On-chain burn',
  });

  await Transaction.create({
    user: adminUser._id,
    type: 'admin_burn',
    amount,
    status: 'completed',
    txHash,
    note: 'On-chain burn from platform wallet',
    metadata: { performedBy: adminUser._id.toString() },
  });

  return { txHash };
}

async function adjustBalance(adminUser, { userId, amountDelta, note }, env) {
  const delta = String(amountDelta).trim();
  if (!/^[-+]?\d+(\.\d+)?$/.test(delta)) {
    const err = new Error('Invalid amountDelta');
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const dec = await blockchain.getDecimals(env);
  const isNeg = delta.startsWith('-');
  const abs = delta.replace(/^[-+]/, '');
  walletService.normalizeDecimal(abs);

  let newBal;
  if (isNeg) {
    newBal = walletService.subDecimalStrings(user.balance, abs, dec);
  } else {
    newBal = walletService.addDecimalStrings(user.balance, abs, dec);
  }
  user.balance = newBal;
  await user.save();

  await AdminAction.create({
    admin: adminUser._id,
    action: 'balance_adjustment',
    targetUser: user._id,
    amount: delta,
    note: note || 'Manual adjustment',
  });

  await Transaction.create({
    user: user._id,
    type: 'admin_adjustment',
    amount: delta,
    status: 'completed',
    note: note || 'Admin adjustment',
    metadata: { adminId: adminUser._id.toString() },
  });

  return { userId: user._id, balance: user.balance };
}

async function getStats(env) {
  const totalUsers = await User.countDocuments();
  const users = await User.find().select('balance').lean();
  const dec = await blockchain.getDecimals(env);
  let totalInternal = '0';
  for (const u of users) {
    totalInternal = walletService.addDecimalStrings(totalInternal, u.balance || '0', dec);
  }

  let platformOnChain = '0';
  let totalOnChainSupply = null;
  try {
    if (env.privateKey) {
      const platform = env.depositAddress || blockchain.platformAddress(env.privateKey);
      platformOnChain = await blockchain.getOnChainBalance(env, platform);
    }
    const contract = env.contractAddress;
    const { Contract, JsonRpcProvider } = ethers;
    const p = new JsonRpcProvider(env.rpcUrl);
    const ERC20 = ['function totalSupply() view returns (uint256)', 'function decimals() view returns (uint8)'];
    const c = new Contract(contract, ERC20, p);
    const [raw, d] = await Promise.all([c.totalSupply(), c.decimals()]);
    totalOnChainSupply = ethers.formatUnits(raw, Number(d));
  } catch {
    totalOnChainSupply = null;
  }

  const settings = await PlatformSettings.findOne({ key: 'default' }).lean();

  return {
    totalUsers,
    totalInternalLedger: totalInternal,
    platformWalletOnChain: platformOnChain,
    totalOnChainSupply,
    trackedMintSum: settings?.trackedMintSum || '0',
    trackedBurnSum: settings?.trackedBurnSum || '0',
  };
}

module.exports = {
  listUsers,
  listAllTransactions,
  listAdminActions,
  mint,
  burn,
  adjustBalance,
  getStats,
};
