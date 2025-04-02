const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 修改上传目录路径为server/uploads
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据文件类型或请求路径确定上传目录
    let targetDir = uploadDir;
    
    // 检查请求路径，为不同类型的上传指定不同的目录
    if (req.originalUrl.includes('/announcements')) {
      targetDir = path.join(uploadDir, 'announcements');
    } else if (req.originalUrl.includes('/posts')) {
      targetDir = path.join(uploadDir, 'posts');
    } else if (req.originalUrl.includes('/avatars') || req.originalUrl.includes('/users')) {
      targetDir = path.join(uploadDir, 'avatars');
    } else if (req.body.uploadPath) {
      targetDir = path.join(uploadDir, req.body.uploadPath);
    }
    
    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    console.log('文件上传目标目录:', targetDir);
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// 创建上传中间件
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedMimeTypes = [
      "image/jpeg", 
      "image/png", 
      "image/gif",
      "image/webp"
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传JPEG、PNG、GIF和WEBP格式的图片"), false);
    }
  },
});

// 处理文件上传的工具函数
const handleFileUpload = async (file, directory = "") => {
  try {
    const relativePath = path.join("/uploads", directory, file.filename);
    return relativePath;
  } catch (error) {
    console.error("文件上传处理失败:", error);
    return null;
  }
};

module.exports = upload;
module.exports.handleFileUpload = handleFileUpload; 