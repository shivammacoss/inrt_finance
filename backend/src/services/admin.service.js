const { ethers } = require('ethers');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AdminAction = require('../models/AdminAction');
const PlatformSettings = require('../models/PlatformSettings');
const Request = require('../models/Request');
const blockchain = require('./blockchain.service');
const walletService = require('./wallet.service');
const reserveService = require('./reserve.service');
const withdrawLimits = require('./withdrawLimits.service');

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

  const dec = await blockchain.getDecimals(env);
  let targetUser = null;
  if (creditUserId) {
    targetUser = await User.findById(creditUserId);
    if (!targetUser) {
      const err = new Error('creditUserId not found');
      err.status = 404;
      throw err;
    }
    await reserveService.assertCirculatingWithinCap(amount, { getDecimals: () => Promise.resolve(dec) });
    targetUser.balance = walletService.addDecimalStrings(targetUser.balance, amount, dec);
    await targetUser.save();
  } else {
    const addr = checksummed.toLowerCase();
    targetUser = await User.findOne({
      walletAddress: new RegExp(`^${addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (targetUser) {
      await reserveService.assertCirculatingWithinCap(amount, { getDecimals: () => Promise.resolve(dec) });
      targetUser.balance = walletService.addDecimalStrings(targetUser.balance, amount, dec);
      await targetUser.save();
    }
  }

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
    await reserveService.assertCirculatingWithinCap(abs, { getDecimals: () => Promise.resolve(dec) });
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
  const sumInternalLedger = async () => {
    try {
      const agg = await User.aggregate([
        {
          $project: {
            amt: {
              $convert: {
                input: { $ifNull: ['$balance', '0'] },
                to: 'decimal',
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amt' } } },
      ]).exec();
      const t = agg[0]?.total;
      if (t == null) return '0';
      return typeof t === 'object' && t !== null && typeof t.toString === 'function' ? t.toString() : String(t);
    } catch {
      const dec = await blockchain.getDecimals(env);
      const users = await User.find().select('balance').lean();
      let totalInternal = '0';
      for (const u of users) {
        totalInternal = walletService.addDecimalStrings(totalInternal, u.balance || '0', dec);
      }
      return totalInternal;
    }
  };

  const chainMetrics = async () => {
    let platformOnChain = '0';
    let totalOnChainSupply = null;
    try {
      let platform = env.depositAddress || null;
      if (!platform && env.privateKey) {
        try {
          platform = blockchain.platformAddress(env.privateKey);
        } catch {
          platform = null;
        }
      }
      const [bal, supply] = await Promise.all([
        platform && ethers.isAddress(platform)
          ? blockchain.getOnChainBalance(env, ethers.getAddress(platform)).catch(() => '0')
          : Promise.resolve('0'),
        blockchain.getTotalSupplyHuman(env).catch(() => null),
      ]);
      platformOnChain = typeof bal === 'string' ? bal : '0';
      totalOnChainSupply = supply;
    } catch {
      totalOnChainSupply = null;
    }
    return { platformOnChain, totalOnChainSupply };
  };

  const [totalUsers, totalInternal, settings, chain] = await Promise.all([
    User.countDocuments(),
    sumInternalLedger(),
    PlatformSettings.findOne({ key: 'default' }).lean(),
    chainMetrics(),
  ]);

  const reserve = await reserveService.getReserveSnapshot({ getDecimals: () => blockchain.getDecimals(env) });

  return {
    totalUsers,
    totalInternalLedger: totalInternal,
    platformWalletOnChain: chain.platformOnChain,
    totalOnChainSupply: chain.totalOnChainSupply,
    trackedMintSum: settings?.trackedMintSum || '0',
    trackedBurnSum: settings?.trackedBurnSum || '0',
    circulatingSupply: reserve.circulatingSupply,
    reserveTokenCap: reserve.reserveTokenCap,
    reserveINR: reserve.reserveINR,
  };
}

/**
 * Admin queue: pending + in-flight processing unless filtered.
 */
async function listRequests({ status = 'queue' } = {}) {
  const filter = {};
  if (status === 'queue' || status === 'pending') {
    filter.status = { $in: ['pending', 'processing'] };
  } else if (status === 'all') {
    /* no filter */
  } else if (['processing', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }
  const lim = status === 'all' ? 250 : 150;
  const items = await Request.find(filter)
    .populate('user', 'email walletAddress balance')
    .populate('reviewedBy', 'email')
    .sort({ createdAt: 1 })
    .limit(lim)
    .lean();
  return { requests: items };
}

async function approveRequest(adminUser, requestId, env, adminNote = '') {
  const reqDoc = await Request.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: true }
  );
  if (!reqDoc) {
    const existing = await Request.findById(requestId);
    if (!existing) {
      const err = new Error('Request not found');
      err.status = 404;
      throw err;
    }
    const err = new Error(
      existing.status === 'approved'
        ? 'Request already approved'
        : existing.status === 'rejected'
          ? 'Request was rejected'
          : 'Request is being processed or not pending'
    );
    err.status = 409;
    throw err;
  }

  const user = await User.findById(reqDoc.user);
  if (!user) {
    await Request.findByIdAndUpdate(requestId, { $set: { status: 'pending' } });
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const dec = await blockchain.getDecimals(env);
  const noteTrim = String(adminNote || '').trim().slice(0, 500);

  const releasePending = async () => {
    await Request.findByIdAndUpdate(requestId, { $set: { status: 'pending' } });
  };

  try {
    if (reqDoc.type === 'deposit') {
      let target = null;
      if (reqDoc.walletAddress && ethers.isAddress(reqDoc.walletAddress)) {
        target = ethers.getAddress(reqDoc.walletAddress.trim());
      } else if (user.walletAddress && ethers.isAddress(user.walletAddress)) {
        target = ethers.getAddress(user.walletAddress.trim());
      }
      if (!target) {
        await releasePending();
        const err = new Error(
          'No valid BSC wallet: user must save a wallet on profile or provide walletAddress on the request'
        );
        err.status = 400;
        throw err;
      }

      await reserveService.assertCirculatingWithinCap(reqDoc.amount, { getDecimals: () => Promise.resolve(dec) });
      await reserveService.assertBackingAllowsIncrease(reqDoc.amount, { getDecimals: () => Promise.resolve(dec) });

      const { txHash } = await blockchain.mintTokens(env, target, reqDoc.amount);
      user.balance = walletService.addDecimalStrings(user.balance, reqDoc.amount, dec);
      await user.save();

      const settings = await getOrCreateSettings();
      settings.trackedMintSum = walletService.addDecimalStrings(settings.trackedMintSum, reqDoc.amount, dec);
      await settings.save();

      reqDoc.status = 'approved';
      reqDoc.reviewedBy = adminUser._id;
      reqDoc.adminNote = noteTrim;
      await reqDoc.save();

      const depositMeta = { requestId: reqDoc._id.toString(), mintedTo: target };
      if (reqDoc.paymentMethod === 'razorpay' && reqDoc.paymentReference) {
        depositMeta.razorpayPaymentId = reqDoc.paymentReference;
      }
      await Transaction.create({
        user: user._id,
        type: 'deposit',
        amount: reqDoc.amount,
        status: 'completed',
        txHash,
        note: 'Deposit request approved',
        metadata: depositMeta,
      });

      await AdminAction.create({
        admin: adminUser._id,
        action: 'request_approve',
        targetUser: user._id,
        amount: reqDoc.amount,
        txHash,
        note: noteTrim || 'Deposit approved',
        metadata: { requestId: reqDoc._id.toString(), type: 'deposit' },
      });

      return { ok: true, type: 'deposit', txHash, balance: user.balance };
    }

    if (reqDoc.type === 'withdraw') {
      await withdrawLimits.assertUserDailyWithdraw(user, reqDoc.amount, dec, env);
      await withdrawLimits.assertGlobalDailyWithdraw(reqDoc.amount, dec, env);

      const oldBal = user.balance;
      const oldLocked = user.ledgerLocked || '0';
      let newLocked;
      try {
        newLocked = walletService.subDecimalStrings(oldLocked, reqDoc.amount, dec);
      } catch {
        await releasePending();
        const err = new Error('Locked amount does not cover this withdrawal');
        err.status = 409;
        throw err;
      }
      let newBal;
      try {
        newBal = walletService.subDecimalStrings(user.balance, reqDoc.amount, dec);
      } catch (e) {
        await releasePending();
        throw e;
      }
      user.ledgerLocked = newLocked;
      user.balance = newBal;
      await user.save();

      let txHash = '';
      try {
        const out = await blockchain.burnTokens(env, reqDoc.amount);
        txHash = out.txHash;
      } catch (e) {
        user.balance = oldBal;
        user.ledgerLocked = oldLocked;
        await user.save();
        await releasePending();
        throw e;
      }

      const settings = await getOrCreateSettings();
      settings.trackedBurnSum = walletService.addDecimalStrings(settings.trackedBurnSum, reqDoc.amount, dec);
      await settings.save();

      await withdrawLimits.recordUserDailyWithdraw(user._id, reqDoc.amount, dec);
      await withdrawLimits.recordGlobalDailyWithdraw(reqDoc.amount, dec);

      reqDoc.status = 'approved';
      reqDoc.reviewedBy = adminUser._id;
      reqDoc.adminNote = noteTrim;
      await reqDoc.save();

      await Transaction.create({
        user: user._id,
        type: 'withdraw',
        amount: reqDoc.amount,
        status: 'completed',
        txHash,
        note: 'Withdraw request approved (ledger + on-chain burn)',
        metadata: { requestId: reqDoc._id.toString() },
      });

      await AdminAction.create({
        admin: adminUser._id,
        action: 'request_approve',
        targetUser: user._id,
        amount: reqDoc.amount,
        txHash,
        note: noteTrim || 'Withdraw approved',
        metadata: { requestId: reqDoc._id.toString(), type: 'withdraw' },
      });

      return { ok: true, type: 'withdraw', txHash, balance: user.balance };
    }

    await releasePending();
    const err = new Error('Unknown request type');
    err.status = 400;
    throw err;
  } catch (e) {
    if (!e.status || e.status >= 500) {
      await releasePending().catch(() => {});
    }
    throw e;
  }
}

async function rejectRequest(adminUser, requestId, reason = '', env, adminNote = '') {
  const session = await mongoose.startSession();
  let doc;
  try {
    doc = await session.withTransaction(async () => {
      const updated = await Request.findOneAndUpdate(
        { _id: requestId, status: { $in: ['pending', 'processing'] } },
        {
          $set: {
            status: 'rejected',
            reviewedBy: adminUser._id,
            rejectReason: String(reason || '').trim().slice(0, 500),
            adminNote: String(adminNote || '').trim().slice(0, 500),
          },
        },
        { new: true, session }
      );
      if (!updated) {
        const existing = await Request.findById(requestId).session(session);
        if (!existing) {
          const err = new Error('Request not found');
          err.status = 404;
          throw err;
        }
        const err = new Error(
          existing.status === 'approved'
            ? 'Cannot reject an approved request'
            : 'Request cannot be rejected'
        );
        err.status = 409;
        throw err;
      }
      if (updated.type === 'withdraw') {
        const dec = await blockchain.getDecimals(env);
        const u = await User.findById(updated.user).session(session);
        if (u) {
          const locked = u.ledgerLocked || '0';
          u.ledgerLocked = walletService.subDecimalStrings(locked, updated.amount, dec);
          await u.save({ session });
        }
      }
      return updated;
    });
  } finally {
    await session.endSession();
  }

  await AdminAction.create({
    admin: adminUser._id,
    action: 'request_reject',
    targetUser: doc.user,
    amount: doc.amount,
    note: String(reason || '').trim().slice(0, 500) || 'Rejected',
    metadata: { requestId: doc._id.toString(), adminNote: doc.adminNote },
  });

  return { ok: true, status: 'rejected' };
}

module.exports = {
  listUsers,
  listAllTransactions,
  listAdminActions,
  mint,
  burn,
  adjustBalance,
  getStats,
  listRequests,
  approveRequest,
  rejectRequest,
};
