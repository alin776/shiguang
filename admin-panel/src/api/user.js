import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://47.98.210.7:3000/api'
})

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