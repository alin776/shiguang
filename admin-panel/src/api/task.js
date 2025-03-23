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

// 获取任务列表
export function getTaskList(params) {
  return api({
    url: '/admin/tasks',
    method: 'get',
    params
  })
}

// 获取任务详情
export function getTaskById(id) {
  return api({
    url: `/admin/tasks/${id}`,
    method: 'get'
  })
}

// 创建任务
export function createTask(data) {
  return api({
    url: '/admin/tasks',
    method: 'post',
    data
  })
}

// 更新任务
export function updateTask(id, data) {
  return api({
    url: `/admin/tasks/${id}`,
    method: 'put',
    data
  })
}

// 删除任务
export function deleteTask(id) {
  return api({
    url: `/admin/tasks/${id}`,
    method: 'delete'
  })
} 