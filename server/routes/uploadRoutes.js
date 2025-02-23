const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const auth = require("../middleware/auth");

// 配置封面图存储
const coverStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/covers/");
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
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("只允许上传 JPG 或 PNG 格式的图片"), false);
    }
  },
});

// 添加封面图上传路由
router.post("/cover", auth, coverUpload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "没有上传文件" });
    }
    res.json({
      url: req.file.filename,
      message: "上传成功",
    });
  } catch (error) {
    console.error("上传封面图失败:", error);
    res.status(500).json({ message: "上传失败" });
  }
});

module.exports = router;
