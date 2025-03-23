/**
 * 应用全局配置文件
 * 集中管理所有域名、环境变量和API端点
 */

// API基础URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://47.98.210.7:3000";

// 应用版本信息
export const APP_VERSION = {
  VERSION: '2.0.1',     // 当前版本号
  BUILD_NUMBER: '3',    // 构建号
  RELEASE_DATE: '2024-05-23' // 发布日期
};

// 上传路径配置
export const UPLOAD_PATHS = {
  AVATARS: "/uploads/avatars/",
  POSTS: "/uploads/posts/",
  COVERS: "/uploads/covers/"
};

// WebSocket配置
export const WEBSOCKET_BASE_URL = "ws://47.98.210.7:3000";

// 上传端点
export const UPLOAD_ENDPOINTS = {
  AVATAR: "/api/upload/avatar",
  COVER: "/api/upload/cover",
  POST: "/api/upload/post",
  
  // 兼容性别名 - 提供与旧代码中常用的命名相同的字段
  uploadAvatar: "/api/upload/avatar",
  uploadCover: "/api/upload/cover",
  uploadPost: "/api/upload/post"
};

// API端点
export const API_ENDPOINTS = {
  // 用户相关
  USER: {
    LOGIN: "/api/users/login",
    REGISTER: "/api/users/register",
    LOGOUT: "/api/users/logout",
    PROFILE: "/api/users/profile",
    UPDATE_PROFILE: "/api/users/update",
    VERIFY_CODE: "/api/users/verify-code",
    SEND_CODE: "/api/users/send-code"
  },
  
  // 帖子相关
  POST: {
    CREATE: "/api/posts",
    LIST: "/api/posts",
    DETAIL: (id) => `/api/posts/${id}`,
    DELETE: (id) => `/api/posts/${id}`,
    LIKE: (id) => `/api/posts/${id}/like`,
    UNLIKE: (id) => `/api/posts/${id}/unlike`
  },
  
  // 社区相关
  COMMUNITY: {
    FOLLOW: (id) => `/api/users/${id}/follow`,
    UNFOLLOW: (id) => `/api/users/${id}/unfollow`,
    USER_PROFILE: (id) => `/api/users/${id}/profile`,
    USER_POSTS: (id) => `/api/users/${id}/posts`,
    FOLLOWERS: (id) => `/api/users/${id}/followers`,
    FOLLOWING: (id) => `/api/users/${id}/following`
  },
  
  // 评论相关
  COMMENT: {
    CREATE: (postId) => `/api/posts/${postId}/comments`,
    LIST: (postId) => `/api/posts/${postId}/comments`,
    DELETE: (commentId) => `/api/comments/${commentId}`
  },

  // 设置相关
  SETTINGS: {
    SAVE: "/api/users/settings"
  },
  
  // 反馈相关
  FEEDBACK: {
    SUBMIT: "/api/feedback",
    LIST: "/api/feedback"
  },
  
  // 活动相关
  ACTIVITIES: {
    LIST: "/api/activities",
    DETAIL: (id) => `/api/activities/${id}`
  }
};

// 环境配置
export const ENV = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  VERSION: '2.0.0'
};

// 存储键
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  THEME: "theme",
  SETTINGS: "settings"
};

// 默认设置
export const DEFAULT_SETTINGS = {
  theme: 'light',
  notification: true,
  language: 'zh-CN'
};

// 图片大小限制(单位:MB)
export const IMAGE_SIZE_LIMIT = {
  AVATAR: 2,
  POST: 10,
  COVER: 5
};
