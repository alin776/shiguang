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

// 获取所有反馈列表
export function getAllFeedbacks(params) {
  return api({
    url: '/admin/feedbacks',
    method: 'get',
    params
  })
}

// 获取反馈详情
export function getFeedbackDetail(id) {
  return api({
    url: `/admin/feedbacks/${id}`,
    method: 'get'
  })
}

// 回复反馈
export function replyFeedback(id, data) {
  return api({
    url: `/admin/feedbacks/${id}/reply`,
    method: 'post',
    data
  })
}

// 更新反馈状态
export function updateFeedbackStatus(id, status) {
  return api({
    url: `/admin/feedbacks/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 删除反馈
export function deleteFeedback(id) {
  return api({
    url: `/admin/feedbacks/${id}`,
    method: 'delete'
  })
} 