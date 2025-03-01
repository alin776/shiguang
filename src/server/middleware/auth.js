const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  // 获取 token
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "无访问权限" });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, jwtSecret);
    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
    };
    next();
  } catch (error) {
    console.error("Token验证失败:", error);
    res.status(401).json({ message: "token无效" });
  }
};
