import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ElMessage } from 'element-plus';
import networkMonitor from './network-monitor';

// 创建axios实例
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 请求超时时间：30秒
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 详细记录每个请求，方便调试
    console.log('发起请求:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      data: config.data,
      params: config.params,
      headers: config.headers
    });
    
    // 使用网络监控器检查网络连接
    const isConnected = networkMonitor.checkNetworkStatus();
    if (!isConnected) {
      // 如果没有网络连接，记录错误并标记请求
      console.error('无网络连接，请检查您的网络设置');
      ElMessage.error('无网络连接，请检查您的网络设置');
      // 将这个请求标记为需要特殊处理
      config.headers['no-internet'] = true;
    }
    
    return config;
  },
  error => {
    // 请求错误处理
    console.error('请求拦截器捕获的错误:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      config: error.config
    });
    ElMessage.error('发送请求失败，请重试');
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  response => {
    // 记录成功的响应
    console.log('请求成功:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    // 直接返回响应数据
    return response;
  },
  error => {
    // 输出详细的错误信息到控制台，方便调试
    console.error('网络错误详情:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      timeout: error.config?.timeout,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });
    
    // 提取错误信息用于显示
    const errorMsg = error.message || '未知错误';
    const url = error.config?.url || '未知URL';
    const method = error.config?.method || 'GET';
    
    // 记录一个更加明显的错误日志，供调试器捕获
    console.error(`网络错误: [${method}] ${url} - ${errorMsg}`);
    
    // 处理网络错误
    if (!error.response) {
      if (error.message.includes('timeout')) {
        console.error(`请求超时: [${method}] ${url}`);
        ElMessage.error('请求超时，请检查您的网络连接');
      } else if (error.message.includes('Network Error')) {
        console.error(`网络连接失败: [${method}] ${url}`);
        ElMessage.error('网络连接失败，请检查您的网络或服务器状态');
        // 在移动设备上弹出警告，显示更多信息
        if (window.Capacitor) {
          alert(`网络错误: ${error.message}\n请求: ${error.config?.url}\n请检查网络连接和服务器状态`);
        }
        // 当发生网络错误时，尝试测试服务器连接
        testServerConnection();
      } else if (networkMonitor.getNetworkStatus()) {
        ElMessage.error(`网络错误: ${error.message}，请稍后重试`);
      } else {
        ElMessage.error('无网络连接，请检查您的网络设置');
      }
      return Promise.reject(error);
    }
    
    // 处理HTTP错误
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        ElMessage.error(data.message || '请求参数错误');
        break;
      case 401:
        ElMessage.error('未授权，请重新登录');
        // 清除用户token
        localStorage.removeItem('token');
        // 可以在这里添加重定向到登录页面的逻辑
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        break;
      case 403:
        ElMessage.error('没有权限访问该资源');
        break;
      case 404:
        ElMessage.error('请求的资源不存在');
        break;
      case 500:
        ElMessage.error('服务器错误，请稍后重试');
        break;
      default:
        ElMessage.error(`请求失败 (${status})`);
    }
    
    return Promise.reject(error);
  }
);

/**
 * 测试服务器连接
 * 这个函数会尝试连接服务器并检查可能的问题
 */
export const testServerConnection = async () => {
  console.log('测试服务器连接...');
  
  try {
    // 先检查网络连接
    if (!networkMonitor.getNetworkStatus()) {
      console.error('❌ 网络未连接，无法测试服务器');
      return false;
    }
    
    // 尝试不同的方式连接API服务器
    const testUrl = API_BASE_URL;
    console.log(`测试连接到: ${testUrl}`);
    
    // 使用已知存在的API路径测试连接，如登录或用户信息API
    try {
      const endpointsToTry = [
        '/api/auth/check',
        '/api',
        '/'
      ];
      
      let connected = false;
      let lastError = null;
      
      // 使用最简单的XMLHttpRequest请求避免CORS和其他限制
      const sendXHRRequest = (url) => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.timeout = 5000; // 5秒超时
          
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              console.log(`XHR状态: ${xhr.status} 对于URL: ${url}`);
              if (xhr.status >= 200 && xhr.status < 500) {
                resolve(true);
              } else {
                reject(new Error(`HTTP错误: ${xhr.status}`));
              }
            }
          };
          
          xhr.ontimeout = function() {
            reject(new Error('请求超时'));
          };
          
          xhr.onerror = function(e) {
            reject(new Error(`XHR错误: ${e.type}`));
          };
          
          xhr.open('GET', url, true);
          xhr.send();
        });
      };

      // 尝试所有端点
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`尝试连接到: ${testUrl}${endpoint}`);
          await sendXHRRequest(`${testUrl}${endpoint}`);
          console.log(`✅ 成功连接到: ${testUrl}${endpoint}`);
          connected = true;
          break;
        } catch (err) {
          console.error(`尝试连接到 ${testUrl}${endpoint} 失败: ${err.message}`);
          lastError = err;
        }
      }
      
      // 如果所有端点都失败，尝试直接获取服务器IP地址
      if (!connected) {
        try {
          console.log('尝试直接连接到服务器IP');
          const ipUrlOnly = testUrl.replace(/^https?:\/\//, '').split('/')[0]; // 获取IP:端口
          const ipOnly = 'http://' + ipUrlOnly;
          console.log(`尝试直接IP连接: ${ipOnly}`);
          await sendXHRRequest(ipOnly);
          console.log(`✅ 成功通过IP连接到服务器: ${ipOnly}`);
          connected = true;
        } catch (err) {
          console.error(`直接IP连接失败: ${err.message}`);
          lastError = err;
        }
      }
      
      if (connected) {
        console.log('✅ 服务器连接测试通过');
        return true;
      } else {
        console.error('❌ 所有连接尝试均失败');
        if (lastError) throw lastError;
        return false;
      }
    } catch (err) {
      console.error(`❌ 连接失败: ${err.message}`);
      
      // 提供更具体的错误信息
      let errorType = '未知错误';
      
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        errorType = '服务器响应超时';
      } else if (err.message.includes('Network Error') || err.message.includes('XHR错误')) {
        errorType = '网络错误 - 可能是DNS解析失败或服务器不可达';
      } else if (err.message.includes('ECONNREFUSED')) {
        errorType = '连接被拒绝 - 服务器可能未运行';
      } else if (err.message.includes('500')) {
        errorType = '服务器内部错误';
      } else if (err.message.includes('404')) {
        errorType = '未找到API接口 - 但服务器正在运行';
      } else if (err.message.includes('403')) {
        errorType = '访问被禁止';
      }
      
      console.error(`❌ 错误类型: ${errorType}`);
      
      // 在移动设备上显示测试结果
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        alert(`服务器连接测试失败:\n错误: ${errorType}\n详情: ${err.message}`);
      }
      
      return false;
    }
  } catch (error) {
    console.error('测试服务器连接时发生错误:', error);
    return false;
  }
};

// 导出实例
export default axiosInstance;

// 同时导出一个安装函数，用于在Vue应用中全局配置axios
export const setupAxios = (app) => {
  app.config.globalProperties.$axios = axiosInstance;
  // 确保所有组件都能访问axios实例
  window.axios = axiosInstance;
  
  // 在应用启动时测试服务器连接
  testServerConnection().then(isConnected => {
    console.log(`服务器连接测试结果: ${isConnected ? '成功' : '失败'}`);
  });
}; 