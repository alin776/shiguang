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
 * 获取所有积分商品
 */
export const getAllPointsProducts = async () => {
  try {
    const response = await api.get('/admin/points/products');
    return response.data;
  } catch (error) {
    console.error('获取积分商品列表失败:', error);
    throw error;
  }
};

/**
 * 添加积分商品
 * @param {Object} productData - 商品数据
 */
export const addPointsProduct = async (productData) => {
  try {
    const response = await api.post('/admin/points/products', productData);
    return response.data;
  } catch (error) {
    console.error('添加积分商品失败:', error);
    throw error;
  }
};

/**
 * 更新积分商品
 * @param {number} productId - 商品ID
 * @param {Object} productData - 要更新的商品数据
 */
export const updatePointsProduct = async (productId, productData) => {
  try {
    const response = await api.put(`/admin/points/products/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error('更新积分商品失败:', error);
    throw error;
  }
};

/**
 * 删除积分商品
 * @param {number} productId - 要删除的商品ID
 */
export const deletePointsProduct = async (productId) => {
  try {
    const response = await api.delete(`/admin/points/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('删除积分商品失败:', error);
    throw error;
  }
};

/**
 * 获取所有积分兑换记录
 */
export const getAllPointsExchanges = async () => {
  try {
    const response = await api.get('/admin/points/exchanges');
    return response.data;
  } catch (error) {
    console.error('获取积分兑换记录失败:', error);
    throw error;
  }
};

/**
 * 更新兑换记录状态
 * @param {number} exchangeId - 兑换记录ID
 * @param {string} status - 新状态
 */
export const updatePointsExchangeStatus = async (exchangeId, status) => {
  try {
    const response = await api.put(`/admin/points/exchanges/${exchangeId}`, { status });
    return response.data;
  } catch (error) {
    console.error('更新兑换记录状态失败:', error);
    throw error;
  }
}; 