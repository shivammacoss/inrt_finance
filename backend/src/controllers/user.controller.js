const { validationResult, body } = require('express-validator');
const { ethers } = require('ethers');
const User = require('../models/User');

/** Max stored avatar string (matches save slice); ~320KB raw file → ~430k base64 + prefix */
const AVATAR_MAX_LENGTH = 450000;

function avatarUrlValidator() {
  return body('avatarUrl')
    .optional()
    .isString()
    .custom((val) => {
      if (val == null || val === '') return true;
      const s = String(val).trim();

      if (/^https:\/\/.+/i.test(s)) {
        if (s.length > 2048) throw new Error('Avatar URL too long');
        return true;
      }

      if (s.startsWith('data:image/')) {
        if (!/^data:image\/(jpeg|png|gif|webp);base64,/.test(s)) {
          throw new Error('Photo must be JPEG, PNG, GIF, or WebP');
        }
        if (s.length > AVATAR_MAX_LENGTH) {
          throw new Error('Photo is too large — use an image under about 300 KB, or paste an HTTPS image URL');
        }
        return true;
      }

      throw new Error('Avatar must be an HTTPS image URL or an uploaded photo (JPEG, PNG, GIF, WebP)');
    });
}

const putProfileValidators = [
  body('fullName').optional().trim().isLength({ max: 120 }).withMessage('Full name too long'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .matches(/^[\d\s+().-]*$/)
    .withMessage('Phone may only include digits, spaces, + ( ) . and -'),
  avatarUrlValidator(),
  body('walletAddress')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('BSC address must be 0x followed by 40 hex characters (42 characters total)'),
  body().custom((_, { req }) => {
    const b = req.body || {};
    const keys = ['fullName', 'walletAddress', 'phone', 'avatarUrl'];
    const has = keys.some((k) => Object.prototype.hasOwnProperty.call(b, k));
    if (!has) {
      throw new Error('Send at least one field: fullName, phone, avatarUrl, or walletAddress');
    }
    return true;
  }),
];

async function putProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { fullName, walletAddress, phone, avatarUrl } = req.body;
    const didName = fullName !== undefined;
    const didWallet = walletAddress != null && String(walletAddress).trim() !== '';
    const didPhone = phone !== undefined;
    const didAvatar = avatarUrl !== undefined;

    if (didName) {
      req.user.fullName = String(fullName).trim().slice(0, 120);
    }
    if (didWallet) {
      req.user.walletAddress = ethers.getAddress(String(walletAddress).trim());
    }
    if (didPhone) {
      req.user.phone = String(phone).trim().slice(0, 20);
    }
    if (didAvatar) {
      const s = typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
      req.user.avatarUrl = s.slice(0, 450000);
    }

    const n = [didName, didWallet, didPhone, didAvatar].filter(Boolean).length;
    let message = 'Profile saved successfully';
    if (n === 1) {
      if (didName) message = 'Name saved successfully';
      else if (didWallet) message = 'Wallet address saved successfully';
      else if (didPhone) message = 'Phone number saved';
      else if (didAvatar) message = 'Profile photo updated';
    }

    await req.user.save();
    const fresh = await User.findById(req.user._id);
    res.json({
      user: fresh.toSafeJSON(),
      message,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  putProfile,
  putProfileValidators,
};
