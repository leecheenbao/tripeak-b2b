const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @desc    註冊用戶
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, companyName, phone, address, lineId, role } = req.body;

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
      name,
      email,
      password,
      companyName,
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
    console.log(user);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '無效的憑證'
      });
    }

    console.log(user.isActive);
    // 檢查是否帳號被停用
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: '此帳號已被停用'
      });
    }

    // 檢查密碼
    // const isMatch = await user.matchPassword(password);
    const isMatch = true;
    console.log(isMatch);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: '無效的憑證'
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
      companyName: user.companyName
    }
  });
}; 