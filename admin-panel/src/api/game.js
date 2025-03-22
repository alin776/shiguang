import axios from 'axios';

// 创建axios实例，直接使用远程服务器地址
const api = axios.create({
  baseURL: 'http://47.98.210.7:3000/api'
});

// 请求拦截器，添加token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * 获取所有卡片游戏记录
 * @param {Object} params - 查询参数
 * @returns {Promise} - axios promise
 */
export function getAllCardGameRecords(params) {
  return api.get('/games/card-game/all-records', { params });
}

export default {
  getAllCardGameRecords
}; 