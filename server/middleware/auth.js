const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  // 获取 token
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  console.log('认证中间件收到token:', token ? '存在token' : '无token');

  if (!token) {
    return res.status(401).json({ message: "无访问权限" });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, jwtSecret);
    console.log('解码token结果:', decoded);
    
    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
    };
    
    console.log('设置用户信息:', req.user);
    next();
  } catch (error) {
    console.error("Token验证失败:", error);
    res.status(401).json({ message: "token无效" });
  }
};
