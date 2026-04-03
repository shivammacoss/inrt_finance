const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, trim: true, default: '', maxlength: 120 },
    phone: { type: String, trim: true, default: '', maxlength: 20 },
    avatarUrl: { type: String, default: '' },
    password: { type: String, required: true, select: false },
    walletAddress: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator(v) {
          if (!v) return true;
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid BSC wallet address',
      },
    },
    balance: {
      type: String,
      default: '0',
    },
    /** Amount reserved for pending withdraw requests (same decimal string format as balance) */
    ledgerLocked: {
      type: String,
      default: '0',
    },
    /** UTC date key YYYY-MM-DD for daily withdraw accumulator */
    withdrawDailyKey: { type: String, default: '' },
    /** Total withdraw request amount submitted this withdrawDailyKey day */
    withdrawDailyAmount: { type: String, default: '0' },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    fullName: this.fullName || '',
    phone: this.phone || '',
    avatarUrl: this.avatarUrl || '',
    walletAddress: this.walletAddress,
    balance: this.balance,
    ledgerLocked: this.ledgerLocked || '0',
    role: this.role,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
