import { createRouter, createWebHistory } from 'vue-router'
import TaskManagementView from '../views/TaskManagementView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/Dashboard.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'posts',
        name: 'posts',
        component: () => import('../views/Posts.vue')
      },
      {
        path: 'posts/:id',
        name: 'post-detail',
        component: () => import('../views/PostDetail.vue')
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('../views/Categories.vue')
      },
      {
        path: 'activities',
        name: 'activities',
        component: () => import('../views/Activities.vue')
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('../views/Users.vue')
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('../views/Tasks.vue')
      },
      {
        path: 'feedbacks',
        name: 'feedbacks',
        component: () => import('../views/Feedbacks.vue'),
        meta: { 
          requiresAuth: true,
          title: '反馈管理'
        }
      },
      {
        path: 'notes',
        name: 'notes',
        component: () => import('../views/Notes.vue'),
        meta: { 
          requiresAuth: true,
          title: '小记管理'
        }
      },
      {
        path: 'versions',
        name: 'versions',
        component: () => import('../views/VersionManage.vue'),
        meta: { 
          requiresAuth: true,
          title: '版本管理'
        }
      },
      {
        path: 'content-review',
        name: 'content-review',
        component: () => import('../views/ContentReview.vue'),
        meta: { 
          requiresAuth: true,
          title: '内容审核'
        }
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('../views/ReportManagement.vue'),
        meta: { 
          requiresAuth: true,
          title: '举报管理'
        }
      },
      {
        path: 'announcements',
        name: 'announcements',
        component: () => import('../views/Announcements.vue'),
        meta: { 
          requiresAuth: true,
          title: '公告管理'
        }
      },
      {
        path: 'points-products',
        name: 'points-products',
        component: () => import('../views/PointsProducts.vue'),
        meta: { 
          requiresAuth: true,
          title: '积分商品管理'
        }
      },
      {
        path: 'points-exchanges',
        name: 'points-exchanges',
        component: () => import('../views/PointsExchanges.vue'),
        meta: { 
          requiresAuth: true,
          title: '积分兑换记录'
        }
      },
      {
        path: 'card-game-records',
        name: 'card-game-records',
        component: () => import('../views/CardGameRecords.vue'),
        meta: { 
          requiresAuth: true,
          title: '抽卡游戏记录'
        }
      },
      {
        path: 'rate-post-categories',
        name: 'rate-post-categories',
        component: () => import('../views/RatePostCategories.vue'),
        meta: { 
          requiresAuth: true,
          title: '评分贴分类管理'
        }
      },
      {
        path: 'rate-posts',
        name: 'rate-posts',
        component: () => import('../views/RatePostsManage.vue'),
        meta: { 
          requiresAuth: true,
          title: '评分贴管理'
        }
      },
      {
        path: 'rate-posts/:id',
        name: 'rate-post-detail',
        component: () => import('../views/RatePostDetail.vue'),
        meta: { 
          requiresAuth: true,
          title: '评分贴详情'
        }
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/tasks',
    name: 'TaskManagement',
    component: TaskManagementView,
    meta: { 
      requiresAuth: true,
      title: '任务管理'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  
  if (to.name !== 'login' && !token) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router 