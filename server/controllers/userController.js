const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const db = require("../config/database");
const User = require("../models/user");
const multer = require("multer");
const path = require("path");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/avatars");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片文件"));
    }
  },
}).single("avatar");

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, phone, verificationCode } = req.body;

    // 检查用户是否已存在
    const [existingUsers] = await db.execute(
      "SELECT * FROM users WHERE email = ? OR username = ? OR phone = ?",
      [email, username, phone]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "用户已存在" });
    }

    // 验证邮箱验证码
    const [codes] = await db.execute(
      "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND is_used = FALSE AND expiry_time > NOW() ORDER BY created_at DESC LIMIT 1",
      [email, verificationCode]
    );

    if (codes.length === 0) {
      return res.status(400).json({ message: "验证码无效或已过期" });
    }

    // 标记验证码为已使用
    await db.execute(
      "UPDATE verification_codes SET is_used = TRUE WHERE id = ?",
      [codes[0].id]
    );

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const [result] = await db.execute(
      "INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, phone]
    );

    // 生成 token
    const token = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "注册成功",
      token,
      user: {
        id: result.insertId,
        username,
        email,
        phone,
      },
    });
  } catch (error) {
    console.error("注册错误:", error);
    res.status(500).json({ message: "注册失败" });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // 查找用户
    const [users] = await db.execute(
      `SELECT id, username, email, phone, avatar, status, password 
       FROM users 
       WHERE username = ? OR email = ? OR phone = ?`,
      [username, username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "用户不存在" });
    }

    const user = users[0];

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "密码错误" });
    }

    // 更新用户状态为在线
    await db.execute("UPDATE users SET status = 'online' WHERE id = ?", [
      user.id,
    ]);

    // 生成 token
    const token = jwt.sign(
      { id: user.id, userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 移除密码字段
    delete user.password;

    res.json({
      message: "登录成功",
      token,
      user: {
        ...user,
        avatar: user.avatar ? user.avatar : null,
        status: "online",
      },
    });
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({ message: "登录失败" });
  }
};

const thirdPartyLogin = async (req, res) => {
  // 实现第三方登录逻辑
  res.status(501).json({ message: "第三方登录功能尚未实现" });
};

const forgotPassword = async (req, res) => {
  // 实现忘记密码逻辑
  res.status(501).json({ message: "忘记密码功能尚未实现" });
};

// 重置密码
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, newPassword } = req.body;

    // 查找用户
    const [users] = await db.execute(
      "SELECT id FROM users WHERE phone = ?",
      [phone]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "该手机号未注册" });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await db.execute(
      "UPDATE users SET password = ? WHERE phone = ?",
      [hashedPassword, phone]
    );

    res.json({ message: "密码重置成功" });
  } catch (error) {
    console.error("重置密码错误:", error);
    res.status(500).json({ message: "重置密码失败" });
  }
};

// 用户等级经验配置
const LEVEL_EXPERIENCE = {
  1: 0,      // 1级所需经验值
  2: 100,    // 2级所需经验值
  3: 300,    // 3级所需经验值
  4: 600,    // 4级所需经验值
  5: 1000,   // 5级所需经验值
  6: 1500    // 6级所需经验值
};

// 获取用户经验和等级信息
const getUserExperience = async (req, res) => {
  try {
    const userId = req.user.id;

    // 查询用户经验和等级
    const [users] = await db.execute(
      "SELECT id, experience, level FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = users[0];
    
    // 计算下一级所需经验
    const nextLevel = user.level < 6 ? user.level + 1 : 6;
    const currentLevelExp = LEVEL_EXPERIENCE[user.level] || 0;
    const nextLevelExp = LEVEL_EXPERIENCE[nextLevel] || LEVEL_EXPERIENCE[6];
    
    // 当前级别的经验进度
    const currentExp = user.experience - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;
    const progress = Math.min(Math.floor((currentExp / expNeeded) * 100), 100);

    res.json({
      experience: user.experience,
      level: user.level,
      nextLevelExp: nextLevelExp,
      currentLevelExp: currentLevelExp,
      progress: progress,
      maxLevel: 6
    });
  } catch (error) {
    console.error("获取用户经验等级失败:", error);
    res.status(500).json({ message: "获取用户经验等级失败" });
  }
};

// 获取用户积分信息
const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.id;

    // 查询用户积分
    const [users] = await db.execute(
      "SELECT id, points FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = users[0];

    res.json({
      points: user.points || 0
    });
  } catch (error) {
    console.error("获取用户积分失败:", error);
    res.status(500).json({ message: "获取用户积分失败" });
  }
};

// 增加用户经验
const addUserExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "经验值必须是正数" });
    }

    // 获取当前用户信息
    const [users] = await db.execute(
      "SELECT id, experience, level FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = users[0];
    
    // 计算新的经验值
    const newExperience = user.experience + parseInt(amount);
    
    // 计算新的等级
    let newLevel = user.level;
    while (newLevel < 6 && newExperience >= LEVEL_EXPERIENCE[newLevel + 1]) {
      newLevel++;
    }

    // 更新用户经验和等级
    await db.execute(
      "UPDATE users SET experience = ?, level = ? WHERE id = ?",
      [newExperience, newLevel, userId]
    );

    // 如果等级提升，返回升级提醒
    const levelUp = newLevel > user.level;

    // 计算下一级所需经验
    const nextLevel = newLevel < 6 ? newLevel + 1 : 6;
    const currentLevelExp = LEVEL_EXPERIENCE[newLevel] || 0;
    const nextLevelExp = LEVEL_EXPERIENCE[nextLevel] || LEVEL_EXPERIENCE[6];
    
    // 当前级别的经验进度
    const currentExp = newExperience - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;
    const progress = Math.min(Math.floor((currentExp / expNeeded) * 100), 100);

    res.json({
      experience: newExperience,
      level: newLevel,
      levelUp: levelUp,
      nextLevelExp: nextLevelExp,
      currentLevelExp: currentLevelExp,
      progress: progress,
      maxLevel: 6
    });
  } catch (error) {
    console.error("增加用户经验失败:", error);
    res.status(500).json({ message: "增加用户经验失败" });
  }
};

// 增加用户积分
const addUserPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "积分值必须是正数" });
    }

    // 获取当前用户信息
    const [users] = await db.execute(
      "SELECT id, points FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = users[0];
    
    // 计算新的积分值
    const currentPoints = user.points || 0;
    const newPoints = currentPoints + parseInt(amount);
    
    // 记录积分历史
    await db.execute(
      `INSERT INTO user_points_history (user_id, points_gained, source, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, amount, '积分奖励']
    );

    // 更新用户积分
    await db.execute(
      "UPDATE users SET points = ? WHERE id = ?",
      [newPoints, userId]
    );

    res.json({
      points: newPoints
    });
  } catch (error) {
    console.error("增加用户积分失败:", error);
    res.status(500).json({ message: "增加用户积分失败" });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // 查询用户信息，增加经验和等级字段
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.email, u.phone, u.avatar, u.cover_image, u.bio, 
              u.created_at, u.status, u.experience, u.level
       FROM users u WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = users[0];

    // 计算下一级所需经验
    const nextLevel = user.level < 6 ? user.level + 1 : 6;
    const currentLevelExp = LEVEL_EXPERIENCE[user.level] || 0;
    const nextLevelExp = LEVEL_EXPERIENCE[nextLevel] || LEVEL_EXPERIENCE[6];
    
    // 当前级别的经验进度
    const currentExp = user.experience - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;
    const progress = Math.min(Math.floor((currentExp / expNeeded) * 100), 100);

    user.experienceProgress = {
      currentExp: currentExp,
      expNeeded: expNeeded,
      progress: progress,
      maxLevel: 6
    };

    res.json({
      user: {
        ...user,
        avatar: user.avatar ? `${API_BASE_URL}${user.avatar}` : null,
        cover_image: user.cover_image ? `${API_BASE_URL}${user.cover_image}` : null
      }
    });
  } catch (error) {
    console.error("获取当前用户信息错误:", error);
    res.status(500).json({ message: "获取用户信息失败" });
  }
};

const getSettings = async (req, res) => {
  try {
    const [settings] = await db.execute(
      `SELECT * FROM user_settings WHERE user_id = ?`,
      [req.user.id]
    );

    // 如果用户没有设置记录，返回默认值
    if (settings.length === 0) {
      const defaultSettings = {
        theme_settings: {
          darkMode: false,
          color: "#409EFF",
        },
      };

      // 创建默认设置
      await db.execute(
        `INSERT INTO user_settings (user_id, theme_settings)
         VALUES (?, ?)`,
        [req.user.id, JSON.stringify(defaultSettings.theme_settings)]
      );

      return res.json(defaultSettings);
    }

    // 解析 JSON 字段
    let theme_settings = {};

    try {
      // 检查是否已经是对象
      if (typeof settings[0].theme_settings === "object") {
        theme_settings = settings[0].theme_settings;
      } else {
        theme_settings = settings[0].theme_settings
          ? JSON.parse(settings[0].theme_settings)
          : {
              darkMode: false,
              color: "#409EFF",
            };
      }
    } catch (e) {
      console.error("解析主题设置失败:", e);
      theme_settings = {
        darkMode: false,
        color: "#409EFF",
      };
    }

    res.json({
      theme_settings,
    });
  } catch (error) {
    console.error("获取设置错误:", error);
    res.status(500).json({ message: "获取设置失败" });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { theme_settings } = req.body;
    console.log("收到的请求数据:", req.body);
    console.log("theme_settings:", theme_settings);

    // 验证参数并提供默认值
    const validThemeSettings = theme_settings || {
      darkMode: false,
      color: "#409EFF",
    };

    // 检查用户是否存在
    const [userExists] = await db.execute("SELECT id FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (userExists.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 确保 theme_settings 是有效的 JSON 字符串
    const themeSettingsJson = JSON.stringify(validThemeSettings);

    // 检查是否已有设置记录 - 修改查询语句
    const [existingSettings] = await db.execute(
      "SELECT user_id FROM user_settings WHERE user_id = ?", // 使用 user_id 而不是 id
      [req.user.id]
    );

    if (existingSettings.length === 0) {
      await db.execute(
        `INSERT INTO user_settings (user_id, theme_settings)
         VALUES (?, ?)`,
        [req.user.id, themeSettingsJson]
      );
    } else {
      await db.execute(
        `UPDATE user_settings 
         SET theme_settings = ?
         WHERE user_id = ?`,
        [themeSettingsJson, req.user.id]
      );
    }

    // 返回更新后的设置
    res.json({
      theme_settings: validThemeSettings,
    });
  } catch (error) {
    console.error("更新设置错误:", error);
    res.status(500).json({ message: "更新设置失败" });
  }
};

const logout = async (req, res) => {
  try {
    // 获取 token
    const token = req.header("Authorization")?.replace("Bearer ", "");
    let userId = null;
    
    if (token) {
      try {
        // 尝试解析 token 获取用户 ID，忽略过期验证
        const jwt = require("jsonwebtoken");
        const jwtSecret = process.env.JWT_SECRET;
        
        // 用 { ignoreExpiration: true } 选项解析 token
        const decoded = jwt.verify(token, jwtSecret, { ignoreExpiration: true });
        userId = decoded.userId || decoded.id;
        
        if (userId) {
          // 更新用户状态为离线
          await db.execute("UPDATE users SET status = 'offline' WHERE id = ?", [
            userId,
          ]);
        }
      } catch (error) {
        // 即使解析 token 失败也正常返回成功
        console.error("解析 token 错误:", error);
      }
    }

    // 无论是否有有效 token，都返回成功
    res.status(200).json({ message: "登出成功" });
  } catch (error) {
    console.error("登出错误:", error);
    // 即使出错也返回成功，确保前端可以继续清理
    res.status(200).json({ message: "登出成功" });
  }
};

const getOnlineUsers = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT id, username, status, last_active 
       FROM users 
       WHERE status = 'online' 
       ORDER BY last_active DESC`
    );

    res.json(users);
  } catch (error) {
    console.error("获取在线用户列表错误:", error);
    res.status(500).json({ message: "获取在线用户列表失败" });
  }
};

const updateProfile = async (req, res) => {
  try {
    console.log("收到的请求数据:", req.body); // 添加日志

    const { username, bio, email, avatar, coverImage } = req.body;

    // 验证必要字段
    if (!username || !email) {
      return res.status(400).json({ message: "用户名和邮箱不能为空" });
    }

    // 更新用户信息
    await db.execute(
      `UPDATE users 
       SET username = ?, 
           bio = ?, 
           email = ?, 
           avatar = ?, 
           cover_image = ?
       WHERE id = ?`,
      [
        username,
        bio || "",
        email,
        avatar || null,
        coverImage || null,
        req.user.id,
      ]
    );

    // 获取更新后的用户信息
    const [updatedUser] = await db.execute(
      `SELECT id, username, email, bio, avatar, cover_image 
       FROM users 
       WHERE id = ?`,
      [req.user.id]
    );

    if (!updatedUser.length) {
      return res.status(404).json({ message: "用户不存在" });
    }

    console.log("更新后的用户数据:", updatedUser[0]); // 添加日志

    res.json({
      message: "更新成功",
      user: {
        ...updatedUser[0],
        avatar: updatedUser[0].avatar
          ? `/uploads/avatars/${updatedUser[0].avatar}`
          : null,
        coverImage: updatedUser[0].cover_image
          ? `/uploads/covers/${updatedUser[0].cover_image}`
          : null,
      },
    });
  } catch (error) {
    console.error("更新用户信息错误:", error);
    res.status(500).json({ message: "更新用户信息失败" });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    await User.changePassword(req.user.id, req.body.newPassword);
    res.json({ message: "密码修改成功" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取粉丝列表
const getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user.id;

    console.log("获取粉丝列表参数:", { userId, currentUserId });

    const [followers] = await db.execute(
      `SELECT 
        u.id, u.username, u.avatar, u.bio,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id) as is_following,
        f.created_at as followed_at
      FROM users u
      INNER JOIN follows f ON u.id = f.follower_id AND f.followed_id = ?
      ORDER BY f.created_at DESC`,
      [currentUserId, userId]
    );

    console.log("粉丝查询结果:", followers);

    res.json({
      users: followers.map((user) => ({
        ...user,
        isFollowing: Boolean(user.is_following),
        avatar: user.avatar
          ? `${API_BASE_URL}/uploads/avatars/${user.avatar}`
          : null,
      })),
    });
  } catch (error) {
    console.error("获取粉丝列表失败:", error);
    res.status(500).json({ message: "获取粉丝列表失败" });
  }
};

// 获取关注列表
const getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user.id;

    console.log("获取关注列表参数:", { userId, currentUserId });

    const [following] = await db.execute(
      `SELECT 
        u.id, u.username, u.avatar, u.bio,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id) as is_following,
        f.created_at as followed_at
      FROM users u
      INNER JOIN follows f ON u.id = f.followed_id AND f.follower_id = ?
      ORDER BY f.created_at DESC`,
      [currentUserId, userId]
    );

    console.log("关注列表查询结果:", following);

    res.json({
      users: following.map((user) => ({
        ...user,
        isFollowing: Boolean(user.is_following),
        avatar: user.avatar
          ? `${API_BASE_URL}/uploads/avatars/${user.avatar}`
          : null,
      })),
    });
  } catch (error) {
    console.error("获取关注列表失败:", error);
    res.status(500).json({ message: "获取关注列表失败" });
  }
};

// 上传封面图
const uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "请选择要上传的图片" });
    }

    const coverImage = req.file.filename;
    await db.execute("UPDATE users SET cover_image = ? WHERE id = ?", [
      coverImage,
      req.user.id,
    ]);

    res.json({
      message: "封面图上传成功",
      coverImage: `/uploads/covers/${coverImage}`,
    });
  } catch (error) {
    console.error("上传封面图失败:", error);
    res.status(500).json({ message: "上传封面图失败" });
  }
};

// 获取用户资料
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user.id;

    // 检查用户ID是否有效
    if (!userId) {
      return res.status(400).json({ message: "用户ID不能为空" });
    }

    // 获取用户基本信息
    const [userResult] = await db.execute(
      `SELECT 
        u.id, u.username, u.avatar, u.bio, u.cover_image,
        (SELECT COUNT(DISTINCT follower_id) FROM follows WHERE followed_id = ?) as followers_count,
        (SELECT COUNT(DISTINCT followed_id) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id) as is_following
      FROM users u
      WHERE u.id = ?`,
      [userId, userId, currentUserId, userId]
    );

    if (!userResult.length) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 获取用户的帖子
    const [posts] = await db.execute(
      `SELECT 
        p.id, p.title, p.content, p.created_at, p.updated_at, p.images, 
        p.user_id, u.username, u.avatar,
        COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved'), 0) as comments_count,
        COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0) as likes_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ? AND p.status = 'approved'
      ORDER BY p.created_at DESC
      LIMIT 5`,
      [userId]
    );

    // 处理帖子数据
    const processedPosts = posts.map((post) => {
      let parsedImages = [];
      try {
        if (post.images) {
          parsedImages =
            typeof post.images === "string"
              ? JSON.parse(post.images)
              : post.images;
          // 添加完整的图片URL
          parsedImages = parsedImages.map((img) =>
            img.startsWith("http")
              ? img
              : `${process.env.API_BASE_URL || "http://localhost:3000"}${img}`
          );
        }
      } catch (error) {
        console.error("解析图片数据失败:", error);
        parsedImages = [];
      }

      return {
        ...post,
        images: parsedImages,
        user: {
          id: post.user_id,
          username: post.username,
          avatar: post.avatar
            ? `${
                process.env.API_BASE_URL || "http://localhost:3000"
              }/uploads/avatars/${post.avatar}`
            : null,
        },
      };
    });

    // 处理用户头像和封面图片路径
    const user = {
      ...userResult[0],
      followersCount: Number(userResult[0].followers_count),
      followingCount: Number(userResult[0].following_count),
      postsCount: Number(userResult[0].posts_count),
      avatar: userResult[0].avatar
        ? `${
            process.env.API_BASE_URL || "http://localhost:3000"
          }/uploads/avatars/${userResult[0].avatar}`
        : null,
      coverImage: userResult[0].cover_image
        ? `${
            process.env.API_BASE_URL || "http://localhost:3000"
          }/uploads/covers/${userResult[0].cover_image}`
        : null,
      isFollowing: Boolean(userResult[0].is_following),
    };

    // 移除原始字段和敏感字段
    delete user.followers_count;
    delete user.following_count;
    delete user.posts_count;
    delete user.password;
    delete user.is_following;

    console.log("后端用户数据:", {
      userId,
      followers: user.followersCount,
      following: user.followingCount,
      isFollowing: user.isFollowing,
    });

    // 添加经验和等级信息
    if (user.experience !== undefined && user.level !== undefined) {
      // 计算下一级所需经验
      const nextLevel = user.level < 6 ? user.level + 1 : 6;
      const currentLevelExp = LEVEL_EXPERIENCE[user.level] || 0;
      const nextLevelExp = LEVEL_EXPERIENCE[nextLevel] || LEVEL_EXPERIENCE[6];
      
      // 当前级别的经验进度
      const currentExp = user.experience - currentLevelExp;
      const expNeeded = nextLevelExp - currentLevelExp;
      const progress = Math.min(Math.floor((currentExp / expNeeded) * 100), 100);

      user.experienceProgress = {
        currentExp: currentExp,
        expNeeded: expNeeded,
        progress: progress,
        maxLevel: 6
      };
    }

    res.json({
      user,
      posts: processedPosts,
    });
  } catch (error) {
    console.error("获取用户资料失败:", error);
    res.status(500).json({
      message: "获取用户资料失败",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// 关注用户
const followUser = async (req, res) => {
  try {
    const followedId = req.params.userId;
    const followerId = req.user.id;

    // 检查是否在关注自己
    if (followedId === followerId) {
      return res.status(400).json({ message: "不能关注自己" });
    }

    // 检查要关注的用户是否存在
    const [userExists] = await db.execute("SELECT id FROM users WHERE id = ?", [
      followedId,
    ]);

    if (!userExists.length) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 检查是否已经关注
    const [existingFollow] = await db.execute(
      "SELECT id FROM follows WHERE follower_id = ? AND followed_id = ?",
      [followerId, followedId]
    );

    if (existingFollow.length > 0) {
      return res.status(400).json({ message: "已经关注了该用户" });
    }

    // 创建关注关系
    await db.execute(
      "INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)",
      [followerId, followedId]
    );

    res.json({ message: "关注成功" });
  } catch (error) {
    console.error("关注用户失败:", error);
    res.status(500).json({ message: "关注失败" });
  }
};

// 取消关注
const unfollowUser = async (req, res) => {
  try {
    const followedId = req.params.userId;
    const followerId = req.user.id;

    // 检查关注关系是否存在
    const [existingFollow] = await db.execute(
      "SELECT id FROM follows WHERE follower_id = ? AND followed_id = ?",
      [followerId, followedId]
    );

    if (existingFollow.length === 0) {
      return res.status(400).json({ message: "未关注该用户" });
    }

    // 删除关注关系
    await db.execute(
      "DELETE FROM follows WHERE follower_id = ? AND followed_id = ?",
      [followerId, followedId]
    );

    res.json({ message: "取消关注成功" });
  } catch (error) {
    console.error("取消关注失败:", error);
    res.status(500).json({ message: "取消关注失败" });
  }
};

// 获取用户统计数据
const getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user.id;

    // 检查用户ID是否有效
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "用户ID不能为空" 
      });
    }

    // 获取用户基本信息和统计数据
    const [userResult] = await db.execute(
      `SELECT 
        u.id, u.username, u.avatar, u.bio, u.cover_image, u.title, u.experience, u.level,
        (SELECT COUNT(DISTINCT follower_id) FROM follows WHERE followed_id = ?) as followers_count,
        (SELECT COUNT(DISTINCT followed_id) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'approved') as posts_count
      FROM users u
      WHERE u.id = ?`,
      [userId, userId, userId, userId]
    );

    if (!userResult.length) {
      return res.status(404).json({ 
        success: false,
        message: "用户不存在" 
      });
    }

    const user = userResult[0];

    // 计算下一级所需经验
    const nextLevel = user.level < 6 ? user.level + 1 : 6;
    const currentLevelExp = LEVEL_EXPERIENCE[user.level] || 0;
    const nextLevelExp = LEVEL_EXPERIENCE[nextLevel] || LEVEL_EXPERIENCE[6];
    
    // 当前级别的经验进度
    const currentExp = user.experience - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;
    const progress = Math.min(Math.floor((currentExp / expNeeded) * 100), 100);

    // 获取用户获赞数
    const [likesReceivedResult] = await db.execute(
      `SELECT COUNT(*) as count FROM likes
       WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio || "",
        title: user.title || "",
        followersCount: user.followers_count || 0,
        followingCount: user.following_count || 0,
        postsCount: user.posts_count || 0,
        likesCount: likesReceivedResult[0].count || 0,
        level: user.level || 1,
        experienceProgress: {
          currentExp: currentExp,
          expNeeded: expNeeded,
          progress: progress
        }
      }
    });
  } catch (error) {
    console.error("获取用户统计数据失败:", error);
    res.status(500).json({ 
      success: false,
      message: "获取用户统计数据失败" 
    });
  }
};

// 统一导出所有方法
module.exports = {
  register,
  login,
  resetPassword,
  getCurrentUser,
  getSettings,
  updateSettings,
  logout,
  getOnlineUsers,
  updateProfile,
  changePassword,
  getFollowers,
  getFollowing,
  uploadCoverImage,
  getUserProfile,
  followUser,
  unfollowUser,
  getUserExperience,
  addUserExperience,
  getUserPoints,
  addUserPoints,
  getUserStats
};
