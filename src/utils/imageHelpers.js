// 图片URL处理工具函数
import { API_BASE_URL, UPLOAD_PATHS } from "@/config";

/**
 * 处理头像URL，确保正确的格式和路径
 * @param {string} avatar - 头像URL或路径
 * @returns {string} - 格式化后的头像URL
 */
export const getAvatarUrl = (avatar) => {
  if (!avatar) return "";

  console.log("原始头像URL:", avatar);

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
      const resultUrl = `${API_BASE_URL}${normalizedPath}`;
      console.log("处理后的头像URL:", resultUrl);
      return resultUrl;
    }
    
    // 如果无法提取，但确实是HTTP URL，返回原始URL
    return avatar;
  }

  // 处理相对路径
  if (avatar.startsWith("/")) {
    const resultUrl = `${API_BASE_URL}${avatar}`;
    console.log("处理后的头像URL:", resultUrl);
    return resultUrl;
  }

  // 确保API_BASE_URL末尾有斜杠
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const avatarPath = UPLOAD_PATHS.AVATARS.startsWith('/') ? 
    UPLOAD_PATHS.AVATARS.substring(1) : UPLOAD_PATHS.AVATARS;

  // 组合URL
  const resultUrl = `${baseUrl}${avatarPath}${avatar}`;
  console.log("处理后的头像URL:", resultUrl);
  return resultUrl;
};

/**
 * 处理一般图片URL，确保正确的格式和路径
 * @param {string} image - 图片URL或路径
 * @returns {string} - 格式化后的图片URL
 */
export const getImageUrl = (image) => {
  if (!image) return "";
  
  console.log("原始图片URL:", image);

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
      const resultUrl = `${API_BASE_URL}${normalizedPath}`;
      console.log("处理后的图片URL:", resultUrl);
      return resultUrl;
    }
    
    // 如果无法提取，但确实是HTTP URL，返回原始URL
    return image;
  }

  // 处理相对路径
  if (image.startsWith("/")) {
    const resultUrl = `${API_BASE_URL}${image}`;
    console.log("处理绝对路径:", resultUrl);
    return resultUrl;
  }

  // 确保API_BASE_URL末尾有斜杠
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;

  // 尝试确定图片类型
  if (image.match(/cover-[\w-]+\.\w+$/)) {
    // 确保路径正确
    const coverPath = UPLOAD_PATHS.COVERS.startsWith('/') ? 
      UPLOAD_PATHS.COVERS.substring(1) : UPLOAD_PATHS.COVERS;
    const resultUrl = `${baseUrl}${coverPath}${image}`;
    console.log("匹配到封面图格式:", resultUrl);
    return resultUrl;
  } else if (image.match(/post-[\w-]+\.\w+$/)) {
    const postPath = UPLOAD_PATHS.POSTS.startsWith('/') ? 
      UPLOAD_PATHS.POSTS.substring(1) : UPLOAD_PATHS.POSTS;
    const resultUrl = `${baseUrl}${postPath}${image}`;
    console.log("匹配到帖子图格式:", resultUrl);
    return resultUrl;
  } else if (image.match(/avatar-[\w-]+\.\w+$/)) {
    const avatarPath = UPLOAD_PATHS.AVATARS.startsWith('/') ? 
      UPLOAD_PATHS.AVATARS.substring(1) : UPLOAD_PATHS.AVATARS;
    const resultUrl = `${baseUrl}${avatarPath}${image}`;
    console.log("匹配到头像格式:", resultUrl);
    return resultUrl;
  }

  // 否则，添加 API_BASE_URL 前缀（假设是通用上传路径）
  const resultUrl = `${baseUrl}uploads/${image}`;
  console.log("使用默认路径:", resultUrl);
  return resultUrl;
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
