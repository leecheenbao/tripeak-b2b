const User = require('../models/User');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const FRONTEND_URL = process.env.FRONTEND_URL;
require('dotenv').config();

/**
 * @desc    註冊用戶
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { companyName, contactName, email, password, phone, address, lineId, role } = req.body;

    console.log(req.body);
    // 檢查是否已存在相同郵箱
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '此郵箱已被註冊'
      });
    }

    // 僅允許管理員創建管理員帳號
    if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: '僅管理員可以創建管理員帳號'
      });
    }

    // 創建用戶
    const user = await User.create({
      companyName,
      contactName,
      email,
      password,
      phone,
      address,
      lineId,
      role: role || 'dealer' // 預設為經銷商
    });

    // 返回 token
    sendTokenResponse(user, 201, res);
  } catch (err) {
    logger.error(`註冊失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '註冊失敗'
    });
  }
};

/**
 * @desc    用戶登錄
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 驗證郵箱和密碼存在
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '請提供郵箱和密碼'
      });
    }

    // 檢查用戶
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '此帳號不存在'
      });
    }

    // 檢查是否帳號被停用
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: '此帳號已被停用'
      });
    }

    // 檢查密碼
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: '密碼錯誤'
      });
    }

    // 返回 token
    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error(`登錄失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '登錄失敗'
    });
  }
};

/**
 * @desc    獲取當前登錄用戶
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`獲取用戶資料失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '獲取用戶資料失敗'
    });
  }
};

/**
 * @desc    登出用戶 (清除 cookie)
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

/**
 * @desc    更新用戶資料
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      companyName: req.body.companyName,
      phone: req.body.phone,
      address: req.body.address,
      lineId: req.body.lineId
    };

    // 過濾掉未提供的欄位
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`更新用戶資料失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '更新用戶資料失敗'
    });
  }
};

/**
 * @desc    更新密碼
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // 檢查當前密碼
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: '密碼不正確'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error(`更新密碼失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '更新密碼失敗'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true
    });


    // 更改資料
    user.contactName = req.body.contactName;
    user.companyName = req.body.companyName;
    user.phone = req.body.phone;
    user.address = req.body.address;
    user.lineId = req.body.lineId;

    await user.save();
    

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`更新用戶資料失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '更新用戶資料失敗'
    });
  }
};

/**
 * @desc 忘記密碼 - 發送重設密碼連結
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ success: false, error: '此郵箱不存在' });
  }

  // 產生 token 並存入 DB
  const resetToken = user.getResetPasswordToken();
  await user.save();

  // 前端重設密碼頁連結
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  // email 內容
  const message = `
    <p>請點擊下方連結重設您的密碼：</p>
    <a href="${resetUrl}">請點選我重設密碼</a>
    <p>此連結一小時內有效。</p>
  `;

  try {
    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: '重設密碼連結',
      html: message,
    });

    res.status(200).json({ success: true, message: '重設密碼連結已寄出，請檢查您的信箱' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    logger.error(`重設密碼連結發送失敗: ${err.message}`);
    await user.save();
    res.status(500).json({ success: false, error: 'Email 發送失敗，請稍後再試' });
  }
};

/**
 * @desc 重設密碼
 * @route POST /api/auth/reset-password
 * @access Public
 */
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  // hash token 以比對 DB
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  if (!user) {
    return res.status(400).json({ success: false, error: '連結無效或已過期' });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: '密碼重設成功，請重新登入' });
};

/**
 * 獲取 token，創建 cookie 並發送響應
 */
const sendTokenResponse = (user, statusCode, res) => {
  // 創建 token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      contactName: user.contactName
    }
  });
};

exports.protect = async (req, res, next) => {
  let token;

  // 從請求頭中獲取 token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 檢查 token 是否存在
  if (!token) {
    return res.status(401).json({
      success: false,
      error: '未授權訪問'
    });
  }

  try {
    // 驗證 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 獲取用戶信息
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用戶不存在'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: '未授權訪問'
    });
  }
};

// 建立 nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
}); 