import axios from "axios";

// API 基础配置
export const API_BASE_URL = "http://47.98.210.7:3000";

// 添加图片 URL 处理函数
export const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
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
