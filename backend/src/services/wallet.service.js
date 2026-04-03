const { ethers } = require('ethers');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const blockchain = require('./blockchain.service');

const DEFAULT_DEC = 18;

function addDecimalStrings(a, b, decimals = DEFAULT_DEC) {
  const x = ethers.parseUnits(normalizeDecimal(a), decimals);
  const y = ethers.parseUnits(normalizeDecimal(b), decimals);
  return ethers.formatUnits(x + y, decimals);
}

function subDecimalStrings(a, b, decimals = DEFAULT_DEC) {
  const x = ethers.parseUnits(normalizeDecimal(a), decimals);
  const y = ethers.parseUnits(normalizeDecimal(b), decimals);
  if (x < y) {
    const err = new Error('Insufficient balance');
    err.status = 400;
    throw err;
  }
  return ethers.formatUnits(x - y, decimals);
}

function normalizeDecimal(s) {
  const t = String(s).trim();
  if (!/^\d+(\.\d+)?$/.test(t)) {
    const err = new Error('Invalid amount format');
    err.status = 400;
    throw err;
  }
  return t;
}

function cmpPositive(amount) {
  const n = parseFloat(amount);
  if (!(n > 0)) {
    const err = new Error('Amount must be positive');
    err.status = 400;
    throw err;
  }
}

async function getBalance(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return { balance: user.balance, walletAddress: user.walletAddress };
}

async function internalTransfer(fromUserId, { toEmail, toWalletAddress, amount }, decimals) {
  cmpPositive(amount);
  normalizeDecimal(amount);

  const hasEmail = toEmail && String(toEmail).trim();
  const hasWallet = toWalletAddress && String(toWalletAddress).trim();
  if ((hasEmail && hasWallet) || (!hasEmail && !hasWallet)) {
    const err = new Error('Provide exactly one of toEmail or toWalletAddress');
    err.status = 400;
    throw err;
  }
  if (hasWallet) {
    const w = String(toWalletAddress).trim();
    if (!ethers.isAddress(w)) {
      const err = new Error('Invalid recipient wallet address');
      err.status = 400;
      throw err;
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const from = await User.findById(fromUserId).session(session);
    let to;
    if (hasEmail) {
      to = await User.findOne({ email: String(toEmail).toLowerCase().trim() }).session(session);
    } else {
      const addr = ethers.getAddress(String(toWalletAddress).trim()).toLowerCase();
      const esc = addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      to = await User.findOne({ walletAddress: new RegExp(`^${esc}$`, 'i') }).session(session);
    }

    if (!from || !to) {
      const err = new Error(!to ? 'Recipient not found' : 'Sender not found');
      err.status = 404;
      throw err;
    }
    if (from._id.equals(to._id)) {
      const err = new Error('Cannot transfer to yourself');
      err.status = 400;
      throw err;
    }

    const newFromBal = subDecimalStrings(from.balance, amount, decimals);
    const newToBal = addDecimalStrings(to.balance, amount, decimals);

    from.balance = newFromBal;
    to.balance = newToBal;
    await from.save({ session });
    await to.save({ session });

    await Transaction.create(
      [
        {
          user: from._id,
          counterparty: to._id,
          type: 'internal_transfer_out',
          amount,
          status: 'completed',
          note: `To ${to.email}`,
        },
        {
          user: to._id,
          counterparty: from._id,
          type: 'internal_transfer_in',
          amount,
          status: 'completed',
          note: `From ${from.email}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return { fromBalance: newFromBal, toBalance: newToBal };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

async function recordDeposit(userId, txHash, env) {
  const existing = await Transaction.findOne({ txHash, type: 'deposit' });
  if (existing) {
    const err = new Error('This transaction was already credited');
    err.status = 409;
    throw err;
  }

  const depositTo =
    env.depositAddress ||
    (env.privateKey ? blockchain.platformAddress(env.privateKey) : null);
  if (!depositTo) {
    const err = new Error('Deposit address not configured (set DEPOSIT_ADDRESS or valid PRIVATE_KEY)');
    err.status = 503;
    throw err;
  }
  const { amountHuman, from } = await blockchain.verifyDepositTx(env, txHash, depositTo);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const dup = await Transaction.findOne({ txHash }).session(session);
    if (dup) {
      const err = new Error('This transaction was already processed');
      err.status = 409;
      throw err;
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const dec = await blockchain.getDecimals(env);
    user.balance = addDecimalStrings(user.balance, amountHuman, dec);

    await user.save({ session });
    await Transaction.create(
      [
        {
          user: user._id,
          type: 'deposit',
          amount: amountHuman,
          status: 'completed',
          txHash,
          metadata: { from },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return { balance: user.balance, amountCredited: amountHuman, txHash };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

/**
 * @param {string} userId
 * @param {string} amount
 * @param {object} env
 * @param {{ payoutMethod: 'biznext'|'upi'|'bank', payoutDetails?: string }} opts
 */
async function withdraw(userId, amount, env, opts = {}) {
  cmpPositive(amount);
  normalizeDecimal(amount);

  const payoutMethod = opts.payoutMethod || 'biznext';
  const payoutDetails = opts.payoutDetails != null ? String(opts.payoutDetails).trim() : '';

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const dec = await blockchain.getDecimals(env);
  const newBal = subDecimalStrings(user.balance, amount, dec);

  if (payoutMethod === 'biznext') {
    if (!user.walletAddress) {
      const err = new Error('Set your withdrawal wallet address in profile first');
      err.status = 400;
      throw err;
    }
    if (!ethers.isAddress(user.walletAddress)) {
      const err = new Error('Invalid withdrawal wallet address on profile');
      err.status = 400;
      throw err;
    }
  }

  const pending = await Transaction.create({
    user: user._id,
    type: 'withdraw',
    amount,
    status: 'pending',
    note:
      payoutMethod === 'biznext'
        ? `To ${user.walletAddress} (BizNext / on-chain)`
        : `Payout: ${payoutMethod} | Awaiting manual settlement`,
    metadata: {
      payoutMethod,
      payoutDetails: payoutDetails || undefined,
    },
  });

  user.balance = newBal;
  await user.save();

  if (payoutMethod === 'upi' || payoutMethod === 'bank') {
    return {
      balance: user.balance,
      status: 'pending',
      txHash: '',
      message: 'Withdrawal queued for manual processing',
    };
  }

  try {
    const toAddr = ethers.getAddress(user.walletAddress.trim());
    const { txHash } = await blockchain.transferTokens(env, toAddr, amount);
    pending.status = 'completed';
    pending.txHash = txHash;
    if (payoutDetails) {
      pending.metadata = { ...pending.metadata, payoutDetails };
    }
    await pending.save();
    return { balance: user.balance, txHash, status: 'completed' };
  } catch (e) {
    user.balance = addDecimalStrings(user.balance, amount, dec);
    await user.save();
    pending.status = 'failed';
    pending.note = `${pending.note} | ${e.message || 'chain error'}`;
    await pending.save();
    const err = new Error('Withdrawal failed on chain; balance restored');
    err.status = 502;
    err.details = e.message;
    throw err;
  }
}

async function listTransactions(userId, limit = 50) {
  return Transaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 200))
    .lean();
}

module.exports = {
  getBalance,
  internalTransfer,
  recordDeposit,
  withdraw,
  listTransactions,
  addDecimalStrings,
  subDecimalStrings,
  normalizeDecimal,
  cmpPositive,
};
