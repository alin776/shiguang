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

// 获取待审核的帖子
export const getPendingPosts = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/admin/pending/posts?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('获取待审核帖子失败:', error);
    throw error;
  }
};

// 获取待审核的评论
export const getPendingComments = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/admin/pending/comments?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('获取待审核评论失败:', error);
    throw error;
  }
};

// 获取待审核的小记
export const getPendingNotes = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/admin/pending/notes?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('获取待审核小记失败:', error);
    throw error;
  }
};

// 更新帖子审核状态
export const updatePostStatus = async (postId, status) => {
  try {
    const response = await api.put(`/admin/pending/posts/${postId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('更新帖子状态失败:', error);
    throw error;
  }
};

// 更新评论审核状态
export const updateCommentStatus = async (commentId, status) => {
  try {
    const response = await api.put(`/admin/pending/comments/${commentId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('更新评论状态失败:', error);
    throw error;
  }
};

// 更新小记审核状态
export const updateNoteStatus = async (noteId, status) => {
  try {
    const response = await api.put(`/admin/pending/notes/${noteId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('更新小记状态失败:', error);
    throw error;
  }
};

// 获取举报列表
export const getReports = async (page = 1, limit = 10, status = 'pending') => {
  try {
    const response = await api.get(`/admin/reports?page=${page}&limit=${limit}&status=${status}`);
    return response.data;
  } catch (error) {
    console.error('获取举报列表失败:', error);
    throw error;
  }
};

// 获取举报详情
export const getReportDetails = async (reportId) => {
  try {
    const response = await api.get(`/admin/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('获取举报详情失败:', error);
    throw error;
  }
};

// 更新举报状态
export const updateReportStatus = async (reportId, status, action = null) => {
  try {
    const payload = { status };
    if (action) {
      payload.action = action;
    }
    const response = await api.put(`/admin/reports/${reportId}/status`, payload);
    return response.data;
  } catch (error) {
    console.error('更新举报状态失败:', error);
    throw error;
  }
}; 