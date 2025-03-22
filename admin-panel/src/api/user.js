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
    return Promise.reject(error)
  }
)

// 获取用户列表
export function getUserList(params) {
  return api({
    url: '/admin/users',
    method: 'get',
    params
  })
}

// 获取用户详情
export function getUserById(id) {
  return api({
    url: `/admin/users/${id}`,
    method: 'get'
  })
}

// 更新用户信息
export function updateUser(id, data) {
  return api({
    url: `/admin/users/${id}`,
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return api({
    url: `/admin/users/${id}`,
    method: 'delete'
  })
}

// 用户登录
export function login(data) {
  return api({
    url: '/admin/login',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getUserInfo() {
  return api({
    url: '/admin/profile',
    method: 'get',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('admin_token')}`
    }
  })
}

// 重新计算所有用户称号
export function recalculateAllTitles() {
  return api({
    url: '/admin/titles/recalculate',
    method: 'post'
  })
} 