const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const auth = require("../middleware/auth");
const fs = require('fs');

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

// 配置评分选项图片上传
const rateOptionStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/rate_options');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // 生成唯一文件名以避免冲突
    const uniqueName = `option_${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const rateOptionUpload = multer({
  storage: rateOptionStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: function(req, file, cb) {
    // 只允许上传图片
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('只能上传图片文件!'), false);
    }
    cb(null, true);
  }
}).single('image');

// 上传评分选项图片
router.post('/rate_option', auth, (req, res) => {
  rateOptionUpload(req, res, function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }
    
    try {
      // 简化处理，直接使用上传的原始文件
      const relativePath = `/uploads/rate_options/${path.basename(req.file.path)}`;
      
      res.json({
        success: true,
        data: {
          url: relativePath,
          filename: path.basename(req.file.path)
        }
      });
    } catch (error) {
      console.error('处理图片失败:', error);
      
      // 出错时删除上传的文件
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: '图片处理失败'
      });
    }
  });
});

module.exports = router;
