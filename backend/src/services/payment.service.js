const crypto = require('crypto');
const Razorpay = require('razorpay');
const { ethers } = require('ethers');
const User = require('../models/User');
const RazorpayOrder = require('../models/RazorpayOrder');
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const PlatformSettings = require('../models/PlatformSettings');
const blockchain = require('./blockchain.service');
const walletService = require('./wallet.service');
const reserveService = require('./reserve.service');

function getClient(env) {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) return null;
  return new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
}

function verifyPaymentSignature(orderId, paymentId, signature, secret) {
  if (!secret || !signature || !orderId || !paymentId) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(String(signature), 'utf8'));
  } catch {
    return expected === signature;
  }
}

function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader || !rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(String(signatureHeader), 'utf8'));
  } catch {
    return expected === signatureHeader;
  }
}

async function getOrCreateSettings() {
  let s = await PlatformSettings.findOne({ key: 'default' });
  if (!s) {
    s = await PlatformSettings.create({ key: 'default' });
  }
  return s;
}

async function createOrder(userId, amountInrInput, env) {
  const client = getClient(env);
  if (!client) {
    const err = new Error('Razorpay is not configured');
    err.status = 503;
    throw err;
  }
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  walletService.cmpPositive(amountInrInput);
  const inrStr = walletService.normalizeDecimal(String(amountInrInput).trim());
  const inrNum = parseFloat(inrStr);
  if (inrNum < env.razorpayMinInr || inrNum > env.razorpayMaxInr) {
    const err = new Error(`Amount must be between ${env.razorpayMinInr} and ${env.razorpayMaxInr} INR`);
    err.status = 400;
    throw err;
  }
  const amountPaise = Math.round(inrNum * 100);
  if (amountPaise < 100) {
    const err = new Error('Minimum amount is 1 INR');
    err.status = 400;
    throw err;
  }

  const dec = await blockchain.getDecimals(env);
  const rate = env.inrtPerInrRate || '1';
  walletService.normalizeDecimal(rate);
  const inrtAmount = walletService.multiplyDecimalStrings(inrStr, rate, dec);

  const receipt = `u${String(userId).replace(/[^a-zA-Z0-9]/g, '').slice(-10)}${Date.now()}`.slice(0, 40);
  const order = await client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: {
      userId: String(userId),
      inrtAmount,
      amountInr: inrStr,
    },
  });

  await RazorpayOrder.create({
    user: userId,
    orderId: order.id,
    amountPaise,
    amountInr: inrStr,
    inrtAmount,
    status: 'created',
  });

  return {
    orderId: order.id,
    amount: amountPaise,
    currency: 'INR',
    keyId: env.razorpayKeyId,
    inrtAmount,
    amountInr: inrStr,
  };
}

/**
 * Core fulfillment after Razorpay confirms payment (API fetch or webhook).
 * Idempotent on razorpayPaymentId.
 */
async function fulfillOrderAfterCapture(orderDoc, paymentId, paymentAmountPaise, env) {
  if (orderDoc.status === 'fulfilled') {
    const u = await User.findById(orderDoc.user);
    return { ok: true, duplicate: true, balance: u?.balance, mode: env.razorpayDepositMode };
  }

  const paise = Number(paymentAmountPaise);
  if (!Number.isFinite(paise) || paise !== orderDoc.amountPaise) {
    const err = new Error('Payment amount does not match order');
    err.status = 400;
    throw err;
  }

  const existingTxn = await Transaction.findOne({ 'metadata.razorpayPaymentId': paymentId });
  if (existingTxn) {
    orderDoc.status = 'fulfilled';
    if (!orderDoc.razorpayPaymentId) orderDoc.razorpayPaymentId = paymentId;
    await orderDoc.save();
    const u = await User.findById(orderDoc.user);
    return { ok: true, duplicate: true, balance: u?.balance, mode: env.razorpayDepositMode };
  }

  const existingReq = await Request.findOne({ paymentReference: paymentId });
  if (existingReq) {
    orderDoc.status = 'fulfilled';
    orderDoc.razorpayPaymentId = paymentId;
    await orderDoc.save();
    const u = await User.findById(orderDoc.user);
    return {
      ok: true,
      duplicate: true,
      balance: u?.balance,
      requestId: existingReq._id.toString(),
      mode: 'safe',
    };
  }

  const claimPaid = await RazorpayOrder.findOneAndUpdate(
    { _id: orderDoc._id, status: 'created' },
    { $set: { status: 'paid', razorpayPaymentId: paymentId } },
    { new: true }
  );

  if (!claimPaid) {
    const fresh = await RazorpayOrder.findById(orderDoc._id);
    if (!fresh) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }
    if (fresh.status === 'fulfilled') {
      const u = await User.findById(fresh.user);
      return { ok: true, duplicate: true, balance: u?.balance, mode: env.razorpayDepositMode };
    }
    if (fresh.status === 'fulfilling') {
      const u = await User.findById(fresh.user);
      return { ok: true, duplicate: true, balance: u?.balance, mode: env.razorpayDepositMode };
    }
    if (fresh.status === 'paid' && fresh.razorpayPaymentId === paymentId) {
      /* another path already marked paid; take fulfillment lock below */
    } else if (fresh.razorpayPaymentId && fresh.razorpayPaymentId !== paymentId) {
      const err = new Error('Order already linked to a different payment');
      err.status = 409;
      throw err;
    } else {
      const err = new Error('Order is not in a payable state');
      err.status = 409;
      throw err;
    }
  }

  const locked = await RazorpayOrder.findOneAndUpdate(
    { _id: orderDoc._id, status: 'paid', razorpayPaymentId: paymentId },
    { $set: { status: 'fulfilling' } },
    { new: true }
  );

  if (!locked) {
    const fresh = await RazorpayOrder.findById(orderDoc._id);
    if (fresh.status === 'fulfilled') {
      const u = await User.findById(fresh.user);
      return { ok: true, duplicate: true, balance: u?.balance, mode: env.razorpayDepositMode };
    }
    if (fresh.status === 'fulfilling') {
      const u = await User.findById(fresh.user);
      return { ok: true, duplicate: true, balance: u?.balance, mode: env.razorpayDepositMode };
    }
    const err = new Error('Unable to start fulfillment');
    err.status = 409;
    throw err;
  }

  const user = await User.findById(locked.user);
  if (!user) {
    await RazorpayOrder.updateOne({ _id: locked._id }, { $set: { status: 'failed' } });
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const dec = await blockchain.getDecimals(env);
  const inrtAmount = locked.inrtAmount;

  if (env.razorpayDepositMode === 'auto') {
    const w = user.walletAddress && String(user.walletAddress).trim();
    if (!w || !ethers.isAddress(w)) {
      await RazorpayOrder.updateOne({ _id: locked._id }, { $set: { status: 'failed' } });
      const err = new Error('Add a valid BSC wallet in Profile before deposit');
      err.status = 400;
      throw err;
    }
    const target = ethers.getAddress(w.trim());

    try {
      await reserveService.assertCirculatingWithinCap(inrtAmount, { getDecimals: () => Promise.resolve(dec) });
      await reserveService.assertBackingAllowsIncrease(inrtAmount, { getDecimals: () => Promise.resolve(dec) });

      const { txHash } = await blockchain.mintTokens(env, target, inrtAmount);
      user.balance = walletService.addDecimalStrings(user.balance, inrtAmount, dec);
      await user.save();

      const settings = await getOrCreateSettings();
      settings.trackedMintSum = walletService.addDecimalStrings(settings.trackedMintSum || '0', inrtAmount, dec);
      await settings.save();

      await Transaction.create({
        user: user._id,
        type: 'deposit',
        amount: inrtAmount,
        status: 'completed',
        txHash,
        note: 'Razorpay deposit (auto mint)',
        metadata: {
          razorpayPaymentId: paymentId,
          razorpayOrderId: locked.orderId,
          amountPaise: locked.amountPaise,
          source: 'razorpay',
        },
      });

      await RazorpayOrder.updateOne({ _id: locked._id }, { $set: { status: 'fulfilled' } });

      return { ok: true, mode: 'auto', txHash, balance: user.balance, inrtAmount };
    } catch (e) {
      await RazorpayOrder.updateOne({ _id: locked._id }, { $set: { status: 'paid' } });
      throw e;
    }
  }

  /* SAFE: admin mints via existing request approval */
  if (!user.walletAddress || !ethers.isAddress(String(user.walletAddress).trim())) {
    await RazorpayOrder.updateOne({ _id: locked._id }, { $set: { status: 'failed' } });
    const err = new Error('Add a valid BSC wallet in Profile before deposit');
    err.status = 400;
    throw err;
  }
  const wallet = ethers.getAddress(String(user.walletAddress).trim());

  try {
    await Request.create({
      user: user._id,
      type: 'deposit',
      amount: inrtAmount,
      status: 'pending',
      walletAddress: wallet,
      paymentMethod: 'razorpay',
      withdrawalMethod: '',
      paymentReference: paymentId,
      paymentVerificationStatus: 'verified',
      note: `Razorpay verified | order ${locked.orderId} | ${locked.amountPaise} paise | ${locked.amountInr} INR`,
    });
  } catch (e) {
    if (e && e.code === 11000) {
      await RazorpayOrder.updateOne({ _id: locked._id }, { $set: { status: 'fulfilled' } });
      const r = await Request.findOne({ paymentReference: paymentId });
      return {
        ok: true,
        duplicate: true,
        requestId: r?._id.toString(),
        mode: 'safe',
      };
    }
    await RazorpayOrder.updateOne({ _id: locked._id }, { $set: { status: 'paid' } });
    throw e;
  }

  await RazorpayOrder.updateOne({ _id: locked._id }, { $set: { status: 'fulfilled' } });

  return {
    ok: true,
    mode: 'safe',
    requestSubmitted: true,
    inrtAmount,
    message: 'Payment verified. INRT will be minted after admin approval.',
  };
}

async function verifyPayment(userId, { orderId, paymentId, signature, amountInr }, env) {
  const client = getClient(env);
  if (!client) {
    const err = new Error('Razorpay is not configured');
    err.status = 503;
    throw err;
  }
  if (!verifyPaymentSignature(orderId, paymentId, signature, env.razorpayKeySecret)) {
    const err = new Error('Invalid payment signature');
    err.status = 400;
    throw err;
  }

  const orderDoc = await RazorpayOrder.findOne({ orderId, user: userId });
  if (!orderDoc) {
    const err = new Error('Order not found for this account');
    err.status = 404;
    throw err;
  }

  if (amountInr != null && String(amountInr).trim() !== '') {
    const normalized = walletService.normalizeDecimal(String(amountInr).trim());
    if (normalized !== orderDoc.amountInr) {
      const err = new Error('Amount does not match order');
      err.status = 400;
      throw err;
    }
  }

  const payment = await client.payments.fetch(paymentId);
  if (payment.order_id !== orderId) {
    const err = new Error('Payment does not match order');
    err.status = 400;
    throw err;
  }
  if (payment.status !== 'captured') {
    const err = new Error(`Payment not completed (status: ${payment.status})`);
    err.status = 400;
    throw err;
  }

  return fulfillOrderAfterCapture(orderDoc, paymentId, payment.amount, env);
}

async function handleWebhook(rawBody, signatureHeader, env) {
  if (!env.razorpayWebhookSecret) {
    const err = new Error('Webhook secret not configured');
    err.status = 503;
    throw err;
  }
  if (!verifyWebhookSignature(rawBody, signatureHeader, env.razorpayWebhookSecret)) {
    const err = new Error('Invalid webhook signature');
    err.status = 400;
    throw err;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    const err = new Error('Invalid webhook payload');
    err.status = 400;
    throw err;
  }

  const event = payload.event;
  const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
  if (event !== 'payment.captured' || !entity) {
    return { ok: true, ignored: true, event: event || 'unknown' };
  }

  const paymentId = entity.id;
  const orderId = entity.order_id;
  const amount = entity.amount;
  if (!orderId || !paymentId) {
    return { ok: true, ignored: true };
  }

  const orderDoc = await RazorpayOrder.findOne({ orderId });
  if (!orderDoc) {
    return { ok: true, ignored: true, reason: 'unknown_order' };
  }

  return fulfillOrderAfterCapture(orderDoc, paymentId, amount, env);
}

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  verifyPaymentSignature,
  getClient,
};
