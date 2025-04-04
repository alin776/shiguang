const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verificationController = require("../controllers/verificationController");
const auth = require("../middleware/auth");
const { check, body } = require("express-validator");
const multer = require("multer");
const path = require("path");
const pointsProductController = require("../controllers/pointsProductController");

// 配置头像存储
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/avatars");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `avatar-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/webp" || file.mimetype === "image/gif") {
      cb(null, true);
    } else {
      cb(new Error("只允许上传 JPG, PNG, WebP 或 GIF 格式的图片"), false);
    }
  },
});

// 配置封面图存储
const coverStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/covers");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `cover-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const coverUpload = multer({
  storage: coverStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB，封面图尺寸较大
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/webp" || file.mimetype === "image/gif") {
      cb(null, true);
    } else {
      cb(new Error("只允许上传 JPG, PNG, WebP 或 GIF 格式的图片"), false);
    }
  },
});

// 发送验证码
router.post(
  "/send-verification-code",
  [
    check("email").isEmail().withMessage("邮箱格式不正确")
  ],
  verificationController.sendVerificationCode
);

// 验证验证码
router.post(
  "/verify-code",
  [
    check("email").isEmail().withMessage("邮箱格式不正确"),
    check("code").isLength({ min: 6, max: 6 }).withMessage("验证码必须是6位")
  ],
  verificationController.verifyCode
);

// 用户注册
router.post(
  "/register",
  [
    check("username").notEmpty().withMessage("用户名不能为空"),
    check("email").isEmail().withMessage("邮箱格式不正确"),
    check("password").isLength({ min: 6 }).withMessage("密码至少6个字符"),
    check("phone").notEmpty().withMessage("手机号不能为空"),
    check("verificationCode").isLength({ min: 6, max: 6 }).withMessage("验证码必须是6位")
  ],
  userController.register
);

// 用户登录
router.post(
  "/login",
  [
    check("username").notEmpty().withMessage("用户名不能为空"),
    check("password").notEmpty().withMessage("密码不能为空"),
  ],
  userController.login
);

// 获取当前用户信息
router.get("/me", auth, userController.getCurrentUser);

// 获取用户设置
router.get("/settings", auth, userController.getSettings);

// 更新用户信息
router.put("/profile", auth, userController.updateProfile);

// 修改密码
router.put("/password", auth, userController.changePassword);

// 退出登录
router.post("/logout", userController.logout);

// 获取在线用户列表
router.get("/online", auth, userController.getOnlineUsers);

// 更新用户设置
router.put("/settings", auth, userController.updateSettings);

// 获取用户资料
router.get("/:userId/profile", auth, userController.getUserProfile);
router.get("/:userId/followers", auth, userController.getFollowers);
router.get("/:userId/following", auth, userController.getFollowing);
router.post("/:userId/follow", auth, userController.followUser);
router.delete("/:userId/follow", auth, userController.unfollowUser);
router.get("/:userId/stats", auth, userController.getUserStats);

// 获取用户设置
router.get("/me/settings", auth, userController.getSettings);

// 更新用户设置
router.put("/me/settings", auth, userController.updateSettings);

// 重置密码路由
router.post(
  "/reset-password",
  [
    check("phone").notEmpty().withMessage("手机号不能为空"),
    check("newPassword")
      .isLength({ min: 6 })
      .withMessage("新密码至少6个字符"),
  ],
  userController.resetPassword
);

// 重置密码使用验证码
router.post(
  "/reset-password-with-code",
  [
    body("email").isEmail().withMessage("请输入有效的邮箱地址"),
    body("verificationCode").isLength({ min: 6, max: 6 }).withMessage("验证码必须是6位"),
    body("newPassword").isLength({ min: 6 }).withMessage("密码至少需要6个字符"),
  ],
  userController.resetPasswordWithCode
);

// 添加头像上传路由
router.post("/upload/avatar", auth, avatarUpload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "没有上传文件" });
    }

    // 确保文件名存在
    const filename = req.file.filename;
    if (!filename) {
      return res.status(500).json({ message: "文件保存失败" });
    }

    res.json({
      url: `/uploads/avatars/${filename}`,
      message: "上传成功",
    });
  } catch (error) {
    console.error("上传头像失败:", error);
    res.status(500).json({ message: "上传失败" });
  }
});

// 添加封面图上传路由
router.post("/upload/cover", auth, coverUpload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "没有上传文件" });
    }

    // 确保文件名存在
    const filename = req.file.filename;
    if (!filename) {
      return res.status(500).json({ message: "文件保存失败" });
    }

    res.json({
      url: `/uploads/covers/${filename}`,
      message: "上传成功",
    });
  } catch (error) {
    console.error("上传封面图失败:", error);
    res.status(500).json({ message: "上传失败" });
  }
});

// 获取用户经验和等级信息
router.get("/experience", auth, userController.getUserExperience);

// 增加用户经验
router.post("/experience", auth, [
  check("amount").isInt({ min: 1 }).withMessage("经验值必须是正数")
], userController.addUserExperience);

// 获取用户积分信息
router.get("/points", auth, userController.getUserPoints);

// 增加用户积分
router.post("/points", auth, [
  check("amount").isInt({ min: 1 }).withMessage("积分必须是正数")
], userController.addUserPoints);

// 积分商品相关路由
// 获取所有可兑换商品
router.get("/points/products", auth, pointsProductController.getProducts);

// 获取单个商品详情
router.get("/points/products/:id", auth, pointsProductController.getProductById);

// 兑换商品
router.post("/points/exchange", auth, [
  check("productId").isInt().withMessage("商品ID必须是整数")
], pointsProductController.exchangeProduct);

// 获取用户兑换记录
router.get("/points/exchanges", auth, pointsProductController.getUserExchanges);

// 获取用户积分历史记录
router.get("/points-history", auth, userController.getPointsHistory);

// 搜索用户路由
router.get("/", auth, userController.searchUsers);

module.exports = router;
