import { defineStore } from 'pinia'
import { login, getUserInfo } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    userInfo: {}
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  
  actions: {
    async login(credentials) {
      try {
        const response = await login(credentials)
        if (response.data.token) {
          this.token = response.data.token
          localStorage.setItem('admin_token', response.data.token)
          await this.fetchUserInfo()
          return true
        }
        return false
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '登录失败')
        return false
      }
    },
    
    async fetchUserInfo() {
      try {
        const response = await getUserInfo()
        this.userInfo = response.data
        return this.userInfo
      } catch (error) {
        ElMessage.error('获取用户信息失败')
        return {}
      }
    },
    
    logout() {
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('admin_token')
    }
  }
}) 