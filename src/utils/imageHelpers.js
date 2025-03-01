// 图片URL处理工具函数
import { API_BASE_URL, UPLOAD_PATHS } from "@/config";

/**
 * 处理头像URL，确保正确的格式和路径
 * @param {string} avatar - 头像URL或路径
 * @returns {string} - 格式化后的头像URL
 */
export const getAvatarUrl = (avatar) => {
  if (!avatar) return "";

  // 修复重复域名问题 - 检测多个http://或https://
  if (avatar.includes("http://") || avatar.includes("https://")) {
    // 清理URL - 提取最后一个完整URL或路径部分
    const urlRegex = /(https?:\/\/[^\/]+)?(\/?uploads\/avatars\/[^\/]+)$/;
    const matches = avatar.match(urlRegex);
    
    if (matches) {
      // 如果捕获到了路径部分
      const path = matches[2];
      // 确保路径以/开头
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return `${API_BASE_URL}${normalizedPath}`;
    }
    
    // 如果无法提取，但确实是HTTP URL，返回原始URL
    return avatar;
  }

  // 处理相对路径
  if (avatar.startsWith("/")) {
    return `${API_BASE_URL}${avatar}`;
  }

  // 否则，添加 API_BASE_URL 前缀
  return `${API_BASE_URL}${UPLOAD_PATHS.AVATARS}${avatar}`;
};

/**
 * 处理一般图片URL，确保正确的格式和路径
 * @param {string} image - 图片URL或路径
 * @returns {string} - 格式化后的图片URL
 */
export const getImageUrl = (image) => {
  if (!image) return "";
  
  console.log("处理图片URL:", image);

  // 修复重复域名问题 - 检测多个http://或https://
  if (image.includes("http://") || image.includes("https://")) {
    // 清理URL - 提取路径部分
    // 匹配任何上传路径
    const urlRegex = /(https?:\/\/[^\/]+)?(\/?uploads\/[^?]+)/;
    const matches = image.match(urlRegex);
    
    if (matches) {
      // 如果捕获到了路径部分
      const path = matches[2];
      // 确保路径以/开头
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      console.log("通过URL正则提取路径:", normalizedPath);
      return `${API_BASE_URL}${normalizedPath}`;
    }
    
    // 如果无法提取，但确实是HTTP URL，返回原始URL
    return image;
  }

  // 处理相对路径
  if (image.startsWith("/")) {
    console.log("处理绝对路径:", `${API_BASE_URL}${image}`);
    return `${API_BASE_URL}${image}`;
  }

  // 尝试确定图片类型
  if (image.match(/cover-[\w-]+\.\w+$/)) {
    console.log("匹配到封面图格式:", `${API_BASE_URL}${UPLOAD_PATHS.COVERS}${image}`);
    return `${API_BASE_URL}${UPLOAD_PATHS.COVERS}${image}`;
  } else if (image.match(/post-[\w-]+\.\w+$/)) {
    return `${API_BASE_URL}${UPLOAD_PATHS.POSTS}${image}`;
  } else if (image.match(/avatar-[\w-]+\.\w+$/)) {
    return `${API_BASE_URL}${UPLOAD_PATHS.AVATARS}${image}`;
  }

  // 否则，添加 API_BASE_URL 前缀（假设是通用上传路径）
  console.log("使用默认路径:", `${API_BASE_URL}/uploads/${image}`);
  return `${API_BASE_URL}/uploads/${image}`;
};

/**
 * 清理头像路径，适用于存储到localStorage前
 * @param {string} avatarPath - 头像路径
 * @returns {string} - 清理后的路径
 */
export const cleanupAvatarPath = (avatarPath) => {
  if (!avatarPath) return "";
  
  // 如果包含重复的API_BASE_URL，去除一个
  if (avatarPath.includes(`${API_BASE_URL}${API_BASE_URL}`)) {
    return avatarPath.replace(API_BASE_URL, "");
  }
  
  return avatarPath;
};
