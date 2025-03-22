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

// 获取仪表盘数据
export function getDashboardData() {
  return api({
    url: '/admin/dashboard',
    method: 'get'
  })
}

// 获取待处理数据
export function getPendingCounts() {
  console.log('开始获取待处理数据...');
  
  // 分别从不同API获取待处理数据
  const getFeedbacks = api({
    url: '/admin/feedbacks',
    method: 'get',
    params: { status: 'pending', limit: 1 }
  }).then(res => {
    console.log('反馈API返回数据:', res.data);
    return res.data.total || 0;
  }).catch(err => {
    console.error('获取反馈数据失败:', err);
    return 0;
  });
  
  // 分别获取各类待审核内容并合计
  const getPendingPosts = api({
    url: '/admin/pending/posts',
    method: 'get',
    params: { limit: 100 }
  }).then(res => {
    console.log('帖子API返回数据:', res.data);
    // 尝试不同的数据路径
    const total = res.data?.pagination?.total || res.data?.total || (res.data?.posts?.length ? res.data.posts.length : 0);
    console.log('待审核帖子数:', total);
    return total;
  }).catch(() => 0);
  
  const getPendingComments = api({
    url: '/admin/pending/comments',
    method: 'get',
    params: { limit: 100 }
  }).then(res => {
    console.log('评论API返回数据:', res.data);
    // 尝试不同的数据路径
    const total = res.data?.pagination?.total || res.data?.total || (res.data?.comments?.length ? res.data.comments.length : 0);
    console.log('待审核评论数:', total);
    return total;
  }).catch(() => 0);
  
  const getPendingNotes = api({
    url: '/admin/pending/notes',
    method: 'get',
    params: { limit: 100 }
  }).then(res => {
    console.log('小记API返回数据:', res.data);
    // 尝试不同的数据路径
    const total = res.data?.pagination?.total || res.data?.total || (res.data?.notes?.length ? res.data.notes.length : 0);
    console.log('待审核小记数:', total);
    return total;
  }).catch(() => 0);
  
  const getReports = api({
    url: '/admin/reports',
    method: 'get',
    params: { status: 'pending', limit: 1 }
  }).then(res => res.data.total || 0).catch(() => 0);
  
  // 合并结果
  return Promise.all([
    getFeedbacks, 
    getPendingPosts, 
    getPendingComments, 
    getPendingNotes, 
    getReports
  ]).then(([
    feedbacks, 
    pendingPosts, 
    pendingComments, 
    pendingNotes, 
    reports
  ]) => {
    // 输出各个待处理数量
    console.log('各类待处理数量:');
    console.log('- 待处理反馈:', feedbacks);
    console.log('- 待审核帖子:', pendingPosts);
    console.log('- 待审核评论:', pendingComments);
    console.log('- 待审核小记:', pendingNotes);
    console.log('- 待处理举报:', reports);
    
    // 计算所有待审核内容总数
    const contentReviews = (parseInt(pendingPosts) || 0) + (parseInt(pendingComments) || 0) + (parseInt(pendingNotes) || 0);
    console.log('待审核内容总数:', contentReviews, '(帖子:', pendingPosts, '评论:', pendingComments, '小记:', pendingNotes, ')');
    
    return {
      data: {
        feedbacks: parseInt(feedbacks) || 0,
        contentReviews: contentReviews,
        reports: parseInt(reports) || 0
      }
    };
  }).catch(err => {
    console.error('合并待处理数据失败:', err);
    return {
      data: {
        feedbacks: 0,
        contentReviews: 0,
        reports: 0
      }
    };
  });
} 