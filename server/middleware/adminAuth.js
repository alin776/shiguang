const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Admin = require('../models/admin');

// 管理员身份验证中间件
const adminAuth = async (req, res, next) => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供有效的身份验证令牌' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // 检查管理员是否存在
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({ 
          success: false, 
          message: '身份验证失败：管理员不存在' 
        });
      }
      
      // 将管理员信息添加到请求对象
      req.admin = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: '身份验证令牌已过期' 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: '身份验证令牌无效' 
      });
    }
  } catch (error) {
    console.error('管理员身份验证失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 验证管理员令牌的中间件 (别名用于路由)
const verifyAdminToken = adminAuth;

// 超级管理员权限检查中间件
const requireSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === 'super_admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: '需要超级管理员权限' 
    });
  }
};

module.exports = {
  adminAuth,
  requireSuperAdmin,
  verifyAdminToken
}; 