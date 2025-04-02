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
    url: `/admin/posts/${id}`,
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

// 置顶或取消置顶帖子
export function togglePinPost(postId, isPinned) {
  return api({
    url: `/admin/posts/${postId}/toggle-pin`,
    method: 'post',
    data: { is_pinned: isPinned }
  })
}

// 获取评分贴分类列表
export function getRatePostCategories() {
  return api({
    url: '/categories/rate-posts',
    method: 'get'
  })
}

// 创建评分贴分类
export function createRatePostCategory(data) {
  return api({
    url: '/admin/rate-post-categories',
    method: 'post',
    data
  })
}

// 更新评分贴分类
export function updateRatePostCategory(id, data) {
  return api({
    url: `/admin/rate-post-categories/${id}`,
    method: 'put',
    data
  })
}

// 删除评分贴分类
export function deleteRatePostCategory(id) {
  return api({
    url: `/admin/rate-post-categories/${id}`,
    method: 'delete'
  })
}

// 获取所有评分贴列表
export function getRatePosts(params) {
  return api({
    url: '/admin/rate-posts',
    method: 'get',
    params
  })
}

// 获取评分贴详情
export function getRatePostDetail(id) {
  return api({
    url: `/admin/rate-posts/${id}`,
    method: 'get'
  })
}

// 创建评分贴
export function createRatePost(data) {
  return api({
    url: '/admin/rate-posts',
    method: 'post',
    data
  })
}

// 更新评分贴
export function updateRatePost(id, data) {
  return api({
    url: `/admin/rate-posts/${id}`,
    method: 'put',
    data
  })
}

// 删除评分贴
export function deleteRatePost(id) {
  return api({
    url: `/admin/rate-posts/${id}`,
    method: 'delete'
  })
}

// 删除评分选项
export function deleteRateOption(id) {
  return api({
    url: `/admin/rate-options/${id}`,
    method: 'delete'
  })
}

// 删除评分评论
export function deleteRateComment(id) {
  return api({
    url: `/admin/rate-comments/${id}`,
    method: 'delete'
  })
} 