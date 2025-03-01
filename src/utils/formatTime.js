/**
 * 格式化时间戳为本地化日期时间字符串
 * @param {number|string} timestamp - 时间戳或日期字符串
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的日期时间字符串
 */
export default function formatTime(timestamp, options = {}) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  // 默认使用本地化显示，可以通过options定制更多格式
  return date.toLocaleString();
}

/**
 * 格式化时间为相对时间（例如：刚刚，5分钟前，1小时前等）
 * @param {number|string} timestamp - 时间戳或日期字符串
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) {
    return '刚刚';
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}小时前`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}天前`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}个月前`;
  }
  
  const years = Math.floor(months / 12);
  return `${years}年前`;
}
