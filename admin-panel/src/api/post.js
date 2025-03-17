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

// 获取帖子列表
export function getPosts(params) {
  return api({
    url: '/community/posts',
    method: 'get',
    params
  })
}

// 获取所有帖子(用于统计)
export function getAllPosts() {
  return api({
    url: '/community/posts',
    method: 'get',
    params: {
      limit: 1000,  // 设置较大的值以获取更多数据
      page: 1
    }
  })
}

// 获取帖子详情
export function getPostDetail(id) {
  return api({
    url: `/community/posts/${id}`,
    method: 'get'
  })
}

// 获取帖子评论
export function getPostComments(postId) {
  return api({
    url: `/community/posts/${postId}/comments`,
    method: 'get'
  })
}

// 删除帖子
export function deletePost(id) {
  return api({
    url: `/community/posts/${id}`,
    method: 'delete'
  })
}

// 删除评论
export function deleteComment(postId, commentId) {
  return api({
    url: `/community/posts/${postId}/comments/${commentId}`,
    method: 'delete'
  })
}

// 获取分类列表
export function getCategories() {
  return api({
    url: '/categories',
    method: 'get'
  })
}

// 创建分类
export function createCategory(data) {
  return api({
    url: '/categories',
    method: 'post',
    data
  })
}

// 更新分类
export function updateCategory(id, data) {
  return api({
    url: `/categories/${id}`,
    method: 'put',
    data
  })
}

// 删除分类
export function deleteCategory(id) {
  return api({
    url: `/categories/${id}`,
    method: 'delete'
  })
} 