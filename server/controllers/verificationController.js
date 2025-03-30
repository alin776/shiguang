const { validationResult } = require("express-validator");
const db = require("../config/database");
const emailService = require("../services/emailService");
const crypto = require("crypto");

// 发送验证码
exports.sendVerificationCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, type = "register" } = req.body;

    // 检查邮箱是否已被注册
    const [existingUsers] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    // 针对不同场景进行不同处理
    if (type === "register") {
      // 注册场景：如果邮箱已存在，则返回错误
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: "该邮箱已被注册" });
      }
    } else if (type === "resetPassword") {
      // 找回密码场景：如果邮箱不存在，则返回错误
      if (existingUsers.length === 0) {
        return res.status(404).json({ message: "该邮箱未注册" });
      }
    }

    // 检查是否在短时间内重复发送
    const [recentCodes] = await db.execute(
      "SELECT * FROM verification_codes WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE) ORDER BY created_at DESC LIMIT 1",
      [email]
    );

    if (recentCodes.length > 0) {
      return res.status(429).json({ message: "请求过于频繁，请1分钟后重试" });
    }

    // 生成6位数字验证码
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    
    // 设置验证码过期时间（15分钟）
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
    
    // 存储验证码到数据库
    await db.execute(
      "INSERT INTO verification_codes (email, code, expiry_time) VALUES (?, ?, ?)",
      [email, verificationCode, expiryTime]
    );
    
    // 发送验证码邮件，传递type参数
    await emailService.sendVerificationEmail(email, verificationCode, type);
    
    res.json({ message: "验证码已发送到您的邮箱" });
  } catch (error) {
    console.error("发送验证码失败:", error);
    res.status(500).json({ message: "发送验证码失败" });
  }
};

// 验证验证码
exports.verifyCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;
    
    // 查询数据库中的验证码
    const [codes] = await db.execute(
      "SELECT * FROM verification_codes WHERE email = ? AND is_used = FALSE ORDER BY created_at DESC LIMIT 1",
      [email]
    );
    
    if (codes.length === 0) {
      return res.status(400).json({ message: "验证码不存在或已被使用" });
    }
    
    const storedCode = codes[0];
    
    // 检查验证码是否过期
    if (new Date() > new Date(storedCode.expiry_time)) {
      return res.status(400).json({ message: "验证码已过期" });
    }
    
    // 检查验证码是否匹配
    if (code !== storedCode.code) {
      return res.status(400).json({ message: "验证码错误" });
    }
    
    // 标记验证码为已使用
    await db.execute(
      "UPDATE verification_codes SET is_used = TRUE WHERE id = ?",
      [storedCode.id]
    );
    
    // 验证通过
    res.json({ verified: true, message: "验证码验证通过" });
  } catch (error) {
    console.error("验证码验证失败:", error);
    res.status(500).json({ message: "验证码验证失败" });
  }
}; 