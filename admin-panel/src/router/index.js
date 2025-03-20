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