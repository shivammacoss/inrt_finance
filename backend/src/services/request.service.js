const mongoose = require('mongoose');
const { ethers } = require('ethers');
const Request = require('../models/Request');
const User = require('../models/User');
const blockchain = require('./blockchain.service');
const walletService = require('./wallet.service');

function requireProfileWallet(user) {
  const w = user.walletAddress && String(user.walletAddress).trim();
  if (!w || !ethers.isAddress(w)) {
    const err = new Error('Please add your wallet address in profile first');
    err.status = 400;
    throw err;
  }
  return ethers.getAddress(w);
}

async function createDepositRequest(userId, { amount, paymentMethod, paymentReference }, env) {
  walletService.cmpPositive(amount);
  walletService.normalizeDecimal(amount);
  const amt = String(amount).trim();
  const method = String(paymentMethod || '').trim();
  const ref = paymentReference != null ? String(paymentReference).trim().slice(0, 500) : '';
  const noteParts = [`Method: ${method}`];
  if (ref) noteParts.push(`Ref: ${ref}`);
  const compositeNote = noteParts.join(' | ').slice(0, 500);

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const wallet = requireProfileWallet(user);

  const dup = await Request.findOne({
    user: userId,
    type: 'deposit',
    status: { $in: ['pending', 'processing'] },
  });
  if (dup) {
    const err = new Error('You already have a pending deposit request');
    err.status = 409;
    throw err;
  }

  const payStatus = ref ? 'pending_review' : 'none';

  return Request.create({
    user: userId,
    type: 'deposit',
    amount: amt,
    status: 'pending',
    walletAddress: wallet,
    paymentMethod: method,
    withdrawalMethod: '',
    note: compositeNote,
    paymentReference: ref,
    paymentVerificationStatus: payStatus,
  });
}

async function createWithdrawRequest(userId, { amount, withdrawalMethod, payoutDetails }, env) {
  walletService.cmpPositive(amount);
  walletService.normalizeDecimal(amount);
  const amt = String(amount).trim();
  const method = String(withdrawalMethod || '').trim();
  const payout = String(payoutDetails || '').trim().slice(0, 2000);
  const withdrawNote = `Payout (${method}): ${payout}`;

  const dec = await blockchain.getDecimals(env);

  const dup = await Request.findOne({
    user: userId,
    type: 'withdraw',
    status: { $in: ['pending', 'processing'] },
  });
  if (dup) {
    const err = new Error('You already have a pending withdrawal request');
    err.status = 409;
    throw err;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    const wallet = requireProfileWallet(user);

    const locked = user.ledgerLocked || '0';
    const avail = walletService.subDecimalStrings(user.balance, locked, dec);
    walletService.subDecimalStrings(avail, amt, dec);

    user.ledgerLocked = walletService.addDecimalStrings(locked, amt, dec);
    await user.save({ session });

    const [doc] = await Request.create(
      [
        {
          user: userId,
          type: 'withdraw',
          amount: amt,
          status: 'pending',
          walletAddress: wallet,
          paymentMethod: '',
          withdrawalMethod: method,
          note: withdrawNote,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return doc;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

async function listForUser(userId, { limit = 50 } = {}) {
  const lim = Math.min(100, Math.max(1, Number(limit) || 50));
  return Request.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(lim)
    .lean();
}

module.exports = {
  createDepositRequest,
  createWithdrawRequest,
  listForUser,
};
