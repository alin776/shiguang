const path = require('path');
const fs = require('fs');
const multer = require('multer');

// 确保上传目录存在
const ensureDirectoryExists = (directory) => {
  const uploadDir = path.join(__dirname, "../public/uploads", directory);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// 处理文件上传的工具函数
const handleFileUpload = async (file, directory = "") => {
  try {
    // 确保目录存在
    ensureDirectoryExists(directory);
    
    // 返回相对路径
    return `/uploads/${directory}/${file.filename}`;
  } catch (error) {
    console.error("文件上传处理失败:", error);
    return null;
  }
};

module.exports = {
  handleFileUpload,
  ensureDirectoryExists
}; 