const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 保護路由中間件
 * 驗證用戶是否已經登錄
 */
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // 從 Bearer token 中提取令牌
    token = req.headers.authorization.split(' ')[1];
  }

  // 確保令牌存在
  if (!token) {
    return res.status(401).json({
      success: false,
      error: '未授權訪問'
    });
  }

  try {
    // 驗證令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查找用戶
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

/**
 * 授權中間件
 * 限制特定角色訪問
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `用戶角色 ${req.user.role} 無權訪問此資源`
      });
    }
    next();
  };
}; 