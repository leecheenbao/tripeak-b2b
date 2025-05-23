const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @desc    獲取所有用戶
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res) => {
  try {
    // 過濾條件
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.isActive) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      filter.contactName = { $regex: req.query.search, $options: 'i' };
    }

    // 分頁條件
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 查詢用戶
    const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    logger.error(`獲取用戶列表失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '獲取用戶列表失敗'
    });
  }
};

/**
 * @desc    獲取單個用戶
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用戶不存在'
      });
    }

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
 * @desc    創建用戶
 * @route   POST /api/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res) => {
  try {
    const { contactName, email, password, companyName, phone, address, lineId, role, isActive } = req.body;

    // 檢查是否已存在相同郵箱
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '此郵箱已被註冊'
      });
    }

    // 創建用戶
    const user = await User.create({
      contactName,
      email,
      password,
      companyName,
      phone,
      address,
      lineId,
      role: role || 'dealer',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`創建用戶失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '創建用戶失敗'
    });
  }
};

/**
 * @desc    更新用戶
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { contactName, email, companyName, phone, address, lineId, role, isActive } = req.body;

    const fieldsToUpdate = {
      contactName,
      email,
      companyName,
      phone,
      address,
      lineId,
      role,
      isActive
    };

    // 過濾掉未提供的欄位
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    // 更新用戶
    const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用戶不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`更新用戶失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '更新用戶失敗'
    });
  }
};

/**
 * @desc    重設用戶密碼
 * @route   PUT /api/users/:id/resetpassword
 * @access  Private/Admin
 */
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: '請提供新密碼'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用戶不存在'
      });
    }

    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        message: '密碼已重設'
      }
    });
  } catch (err) {
    logger.error(`重設密碼失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '重設密碼失敗'
    });
  }
};

/**
 * @desc    刪除用戶
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用戶不存在'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    logger.error(`刪除用戶失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '刪除用戶失敗'
    });
  }
}; 

