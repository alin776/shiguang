// 图片URL处理工具函数
import { API_BASE_URL, UPLOAD_PATHS } from "@/config";
import defaultAvatarUrl from '@/assets/images/default-avatar.png';

/**
 * 获取头像完整URL
 * @param {string} avatar 头像相对路径
 * @returns {string} 完整的头像URL
 */
export const getAvatarUrl = (avatar) => {
  if (!avatar) return defaultAvatarUrl;

  // 添加错误处理和平台兼容日志
  try {
    console.log("原始头像URL:", avatar, "平台:", navigator.userAgent);

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
        
        // 添加缓存破坏参数，确保Android端不使用缓存
        const cacheBuster = `?t=${Date.now()}`;
        return resultUrl + cacheBuster;
      }
      
      // 如果无法提取，但确实是HTTP URL，返回原始URL并添加缓存破坏参数
      const cacheBuster = avatar.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;
      return avatar + cacheBuster;
    }

    // 处理相对路径
    if (avatar.startsWith("/")) {
      const resultUrl = `${API_BASE_URL}${avatar}`;
      console.log("处理后的头像URL:", resultUrl);
      
      // 添加缓存破坏参数
      const cacheBuster = `?t=${Date.now()}`;
      return resultUrl + cacheBuster;
    }

    // 确保API_BASE_URL末尾有斜杠
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    const avatarPath = UPLOAD_PATHS.AVATARS.startsWith('/') ? 
      UPLOAD_PATHS.AVATARS.substring(1) : UPLOAD_PATHS.AVATARS;

    // 组合URL
    const resultUrl = `${baseUrl}${avatarPath}${avatar}`;
    console.log("处理后的头像URL:", resultUrl);
    
    // 添加缓存破坏参数
    const cacheBuster = `?t=${Date.now()}`;
    return resultUrl + cacheBuster;
  } catch (error) {
    console.error("头像URL处理出错:", error);
    // 错误恢复 - 返回默认头像
    return defaultAvatarUrl;
  }
};

/**
 * 处理一般图片URL，确保正确的格式和路径
 * @param {string} image - 图片URL或路径
 * @returns {string} - 格式化后的图片URL
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  
  try {
    // 替换localhost:3000为实际API_BASE_URL
    if (url.includes('localhost:3000')) {
      url = url.replace('http://localhost:3000', API_BASE_URL);
    }
    
    // 如果已经是绝对URL，直接返回
    if (url.startsWith('http')) {
      return url;
    }
    
    // 如果是以"/"开头的路径，拼接API_BASE_URL
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    
    // 其他情况，假设是相对路径，添加前缀
    return `${API_BASE_URL}/${url}`;
  } catch (error) {
    console.error('处理图片URL出错:', error, '原URL:', url);
    return url || '';
  }
};

/**
 * 获取处理后的图片URL，针对移动设备添加特殊处理
 * @param {string} url - 图片URL或路径
 * @returns {string} - 格式化后的图片URL
 */
export const getProcessedImageUrl = (url) => {
  if (!url) return '';
  
  try {
    // 先获取基本URL
    const baseUrl = getImageUrl(url);
    
    // 检测平台，在移动端添加额外参数防止缓存问题
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      // 确保URL末尾有随机参数防止缓存
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}mobile=1&t=${Date.now()}`;
    }
    
    return baseUrl;
  } catch (error) {
    console.error('处理移动端图片URL出错:', error, '原URL:', url);
    return url || '';
  }
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
  
  // 移除缓存破坏参数
  if (avatarPath.includes('?t=')) {
    return avatarPath.split('?t=')[0];
  }
  
  return avatarPath;
};

/**
 * 获取默认头像URL
 * @returns {string} 默认头像URL
 */
export const getDefaultAvatarUrl = () => {
  return defaultAvatarUrl;
};

/**
 * 预加载图片，返回Promise
 * @param {string} src - 图片地址
 * @returns {Promise} - 返回加载图片的Promise
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve(null);
      return;
    }
    
    // 处理localhost:3000的情况
    if (src.includes('localhost:3000')) {
      src = src.replace('http://localhost:3000', API_BASE_URL);
    }

    // 添加超时处理，5秒后超时
    const timeout = setTimeout(() => {
      console.log(`图片加载超时: ${src}`);
      reject(new Error(`Image loading timeout: ${src}`));
    }, 5000);

    const img = new Image();
    
    // 记录重试次数
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
    
    img.onerror = (error) => {
      // 如果URL是localhost，尝试将其替换为生产服务器URL
      if (src.includes('localhost') && retryCount === 0) {
        retryCount++;
        const newSrc = src.replace(/http:\/\/localhost(:\d+)?/g, API_BASE_URL);
        console.log(`图片加载失败，尝试使用生产服务器URL重试: ${newSrc}`);
        
        setTimeout(() => {
          img.src = newSrc;
        }, 300);
        return;
      }
      
      if (retryCount < MAX_RETRIES) {
        // 进行重试
        retryCount++;
        
        // 添加时间戳参数，避免缓存
        const timestamp = Date.now();
        const newSrc = src.includes('?') 
          ? `${src}&t=${timestamp}` 
          : `${src}?t=${timestamp}`;
        
        console.log(`重试 (${retryCount}/${MAX_RETRIES}) 加载图片: ${newSrc}`);
        
        // 延迟重试
        setTimeout(() => {
          img.src = newSrc;
        }, 500);
      } else {
        clearTimeout(timeout);
        console.log(`图片加载失败: ${src}`);
        
        // 提供一个默认的占位图
        const fallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==';
        
        const placeholderImg = new Image();
        placeholderImg.src = fallbackSrc;
        resolve(placeholderImg);
      }
    };
    
    img.src = src;
  });
};
