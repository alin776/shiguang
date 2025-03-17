const db = require("../config/database");

// 管理员权限中间件
module.exports = async (req, res, next) => {
  try {
    // 检查用户是否是管理员
    const userId = req.user.id;
    
    const [rows] = await db.execute(
      "SELECT is_admin FROM users WHERE id = ?",
      [userId]
    );
    
    if (rows.length === 0 || !rows[0].is_admin) {
      return res.status(403).json({ message: "权限不足，需要管理员权限" });
    }
    
    // 用户是管理员，继续下一步
    next();
  } catch (error) {
    console.error("管理员权限验证失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
}; 