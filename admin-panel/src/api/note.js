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

// 获取小记列表
export function getNotes(params) {
  return api({
    url: '/admin/notes',
    method: 'get',
    params
  })
}

// 创建小记
export function createNote(data) {
  return api({
    url: '/admin/notes',
    method: 'post',
    data
  })
}

// 删除小记
export function deleteNote(id) {
  return api({
    url: `/admin/notes/${id}`,
    method: 'delete'
  })
} 