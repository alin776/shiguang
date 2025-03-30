const fs = require('fs');
const path = require('path');

/**
 * 处理Base64编码的图片上传
 * @param {string} base64String - Base64编码的图片数据
 * @param {string} uploadDir - 上传目录
 * @param {string} filename - 文件名前缀
 * @returns {Promise<string>} - 上传后的文件路径
 */
exports.handleUpload = async (base64String, uploadDir, filename) => {
  try {
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 解析base64字符串
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('无效的Base64编码图片');
    }

    // 获取MIME类型和Base64数据
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 确定文件扩展名
    let fileExt = '';
    switch (mimeType) {
      case 'image/jpeg':
        fileExt = '.jpg';
        break;
      case 'image/png':
        fileExt = '.png';
        break;
      case 'image/gif':
        fileExt = '.gif';
        break;
      case 'image/webp':
        fileExt = '.webp';
        break;
      default:
        fileExt = '.jpg'; // 默认为jpg
    }

    // 生成唯一文件名
    const uniqueFilename = `${filename}_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // 写入文件
    await fs.promises.writeFile(filePath, buffer);

    // 返回文件路径
    return filePath;
  } catch (error) {
    console.error('文件上传错误:', error);
    throw error;
  }
};

/**
 * 删除文件
 * @param {string} filePath - 文件路径
 */
exports.deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('文件删除错误:', error);
    throw error;
  }
}; 