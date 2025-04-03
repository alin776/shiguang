const db = require("../config/database");

// 管理员权限中间件
module.exports = async (req, res, next) => {
  try {
    // 不再检查用户是否是管理员，直接通过验证
    // 因为后台只有一个人使用，所以跳过管理员检查
    
    console.log("管理员权限验证已跳过，用户ID:", req.user.id);
    
    // 直接进入下一步
    next();
  } catch (error) {
    console.error("管理员权限验证失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
}; 