const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, '請提供公司名稱']
    },
    contactName: {
      type: String,
      required: [true, '請提供聯絡人名稱'],
      trim: true
    },
    email: {
      type: String,
      required: [true, '請提供電子郵件'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        '請提供有效的電子郵件'
      ]
    },
    password: {
      type: String,
      required: [true, '請提供密碼'],
      minlength: 6,
      select: false // 查詢時不返回密碼
    },
    role: {
      type: String,
      enum: ['admin', 'dealer'], // 管理員或經銷商
      default: 'dealer'
    },
    phone: {
      type: String,
      required: [true, '請提供聯絡電話']
    },
    address: {
      type: String
    },
    lineId: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

// 加密密碼
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 生成 JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// 比對密碼
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 產生重設密碼 token
UserSchema.methods.getResetPasswordToken = function() {
  // 產生隨機 token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // hash 後存入 DB
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // 設定過期時間
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1小時
  return resetToken; // 回傳原始 token（用於 email 連結）
};

module.exports = mongoose.model('User', UserSchema); 