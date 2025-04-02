import axios from 'axios'

// 创建axios实例，直接使用远程服务器地址
const api = axios.create({
  baseURL: 'http://47.98.210.7:3000/api'
})

// 请求拦截器，添加token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 获取公告列表
export const getAnnouncements = (params) => {
  return api.get('/admin/announcements', { params })
}

// 获取单个公告详情
export const getAnnouncementById = (id) => {
  return api.get(`/admin/announcements/${id}`)
}

// 创建公告
export const createAnnouncement = (data) => {
  return api.post('/admin/announcements', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 更新公告
export const updateAnnouncement = (id, data) => {
  return api.put(`/admin/announcements/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除公告
export const deleteAnnouncement = (id) => {
  return api.delete(`/admin/announcements/${id}`)
} 