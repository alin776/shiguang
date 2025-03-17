import axios from "axios";

// API 基础配置
export const API_BASE_URL = "http://47.98.210.7:3000";

// 添加图片 URL 处理函数
export const getImageUrl = (path) => {
  if (!path) return "";
  
  // 清理URL，移除末尾可能存在的多余字符
  let cleanPath = path;
  if (cleanPath.includes('?') && (cleanPath.endsWith('？') || cleanPath.endsWith('?'))) {
    cleanPath = cleanPath.replace(/[？?]+$/, '');
  }
  
  // 简单日志
  console.log('处理图片URL:', cleanPath);
  
  // 已经是完整URL的情况，直接返回
  if (cleanPath.startsWith("http")) {
    return cleanPath;
  }
  
  // 三种基础情况处理
  
  // 1. avatar-开头的文件 - 用户头像
  if (cleanPath.startsWith("avatar-")) {
    return `${API_BASE_URL}/uploads/avatars/${cleanPath}`;
  }
  
  // 2. post-开头的文件 - 帖子图片
  if (cleanPath.startsWith("post-")) {
    return `${API_BASE_URL}/uploads/posts/${cleanPath}`;
  }
  
  // 3. 以/uploads开头的完整路径
  if (cleanPath.startsWith("/uploads")) {
    return `${API_BASE_URL}${cleanPath}`;
  }
  
  // 4. 其他情况 - 添加/分隔符
  return cleanPath.startsWith("/") 
    ? `${API_BASE_URL}${cleanPath}`
    : `${API_BASE_URL}/${cleanPath}`;
};

// 创建 axios 实例
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 增加超时时间到 30 秒
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    console.log("发送请求:", {
      完整URL: `${config.baseURL}${config.url}`,
      方法: config.method,
      请求头: config.headers,
      数据: config.data,
    });
    
    // 检查请求中是否包含 Authorization 头
    if (config.headers.Authorization || config.headers.authorization) {
      // 针对登出请求的特殊处理，即使token过期也允许发送
      if (config.url === '/api/users/logout') {
        return config;
      }
      
      // 从 localStorage 获取 token
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // 解析 JWT token
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const payload = JSON.parse(jsonPayload);
          const now = Math.floor(Date.now() / 1000);
          
          // 如果 token 已过期
          if (payload.exp <= now) {
            console.log('检测到请求使用了过期的 Token，清除 Token 并重定向到登录页面');
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            // 如果不在登录页，则重定向到登录页
            if (window.location.pathname !== "/login") {
              window.location.href = "/login?expired=true";
              // 阻止继续发送请求
              return Promise.reject(new Error('Token 已过期'));
            }
          }
        } catch (error) {
          console.error('Token 解析错误:', error);
        }
      }
    }
    
    return config;
  },
  (error) => {
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    console.log("收到响应:", {
      状态: response.status,
      数据: response.data,
    });
    return response;
  },
  (error) => {
    if (error.message === "Network Error") {
      console.error("网络错误详情:", {
        完整URL: error.config?.url
          ? `${API_BASE_URL}${error.config.url}`
          : "未知",
        错误信息: error.message,
        错误代码: error.code,
        响应状态: error.response?.status,
        响应数据: error.response?.data,
        请求配置: error.config,
      });
      return Promise.reject(
        new Error("网络连接失败，请检查网络设置或稍后重试")
      );
    }

    // 处理 token 过期的情况
    if (error.response?.status === 401 && error.response?.data?.message === "token无效") {
      console.error("Token 已过期，需要重新登录");
      
      // 清除本地存储的 token 和用户信息
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // 如果不在登录页，则重定向到登录页
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=true";
      }
    }

    console.error("请求失败:", {
      错误信息: error.message,
      错误代码: error.code,
      响应状态: error.response?.status,
      响应数据: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default instance;

