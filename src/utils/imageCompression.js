import { API_BASE_URL } from "../config";

/**
 * 图片压缩和优化工具
 * 用于处理图片URL，增加压缩和尺寸参数
 */

/**
 * 为图片URL添加压缩尺寸参数
 * @param {string} imageUrl - 原始图片URL
 * @param {Object} options - 压缩选项
 * @param {number} options.width - 目标宽度
 * @param {number} options.height - 目标高度
 * @param {number} options.quality - 质量参数 (1-100)
 * @returns {string} 添加参数后的图片URL
 */
export const compressImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl) return '';
  
  try {
    // 添加移动设备优化标记
    const isMobile = window.innerWidth <= 768;
    
    // 替换localhost为正确的服务器地址
    if (imageUrl.includes('localhost:3000')) {
      imageUrl = imageUrl.replace('http://localhost:3000', API_BASE_URL);
    }

    // 检查URL是否有效 - 使用更高效的URL检测方式
    const isFullUrl = imageUrl.startsWith('http');
    
    // 已有的查询参数 - 使用简化的URL参数处理
    const hasParams = imageUrl.includes('?');
    let params = [];
    
    // 默认选项
    const defaultOptions = {
      width: 0,        // 0表示不指定
      height: 0,       // 0表示不指定
      quality: 75      // 默认质量75%
    };
    
    // 合并选项
    const finalOptions = { ...defaultOptions, ...options };
    
    // 添加尺寸参数
    if (finalOptions.width > 0) {
      params.push(`w=${finalOptions.width}`);
    }
    
    if (finalOptions.height > 0) {
      params.push(`h=${finalOptions.height}`);
    }
    
    // 添加质量参数
    if (finalOptions.quality > 0 && finalOptions.quality <= 100) {
      params.push(`q=${finalOptions.quality}`);
    }
    
    // 添加移动设备标记
    if (isMobile) {
      params.push('mobile=1');
    }
    
    // 添加缓存破坏参数 - 为了提高性能，缓存时间设为10分钟级别
    const cacheTime = Math.floor(Date.now() / 600000); // 10分钟缓存
    params.push(`t=${cacheTime}`);
    
    // 生成新的URL - 使用高效的字符串连接
    const paramString = params.join('&');
    const newUrl = paramString ? 
      `${imageUrl}${hasParams ? '&' : '?'}${paramString}` : 
      imageUrl;
    
    return newUrl;
  } catch (error) {
    console.error('处理图片URL出错:', error);
    return imageUrl;
  }
};

/**
 * 获取适合列表显示的缩略图URL
 * @param {string} imageUrl - 原始图片URL
 * @returns {string} 优化后的缩略图URL
 */
export const getThumbnailUrl = (imageUrl) => {
  return compressImageUrl(imageUrl, {
    width: 400,
    height: 0, // 保持宽高比
    quality: 70
  });
};

/**
 * 获取适合详情页显示的图片URL
 * @param {string} imageUrl - 原始图片URL
 * @returns {string} 优化后的图片URL
 */
export const getDetailImageUrl = (imageUrl) => {
  return compressImageUrl(imageUrl, {
    width: 800,
    height: 0, // 保持宽高比
    quality: 85
  });
};

/**
 * 获取适合头像显示的图片URL
 * @param {string} imageUrl - 原始图片URL
 * @param {number} size - 头像尺寸
 * @returns {string} 优化后的头像URL
 */
export const getAvatarThumbnail = (imageUrl, size = 100) => {
  return compressImageUrl(imageUrl, {
    width: size,
    height: size,
    quality: 80
  });
}; 