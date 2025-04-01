const fs = require("fs");
const path = require("path");

// 创建必要的上传目录
const createUploadDirs = () => {
  const dirs = [
    "public/uploads",
    "public/uploads/avatars",
    "public/uploads/posts",
    "public/uploads/covers",
  ];

  dirs.forEach((dir) => {
    const fullPath = path.join(__dirname, "..", "..", dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }
  });
};

// 配置封面图片上传
const coverUploadConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/covers");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "cover-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const coverUpload = multer({
  storage: coverUploadConfig,
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
}).single("cover");

module.exports = {
  createUploadDirs,
  coverUpload,
};
