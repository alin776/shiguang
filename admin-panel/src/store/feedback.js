import { defineStore } from 'pinia'
import { 
  getAllFeedbacks,
  getFeedbackDetail,
  replyFeedback,
  updateFeedbackStatus,
  deleteFeedback
} from '@/api/feedback'
import { ElMessage } from 'element-plus'

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    feedbacks: [],
    currentFeedback: null,
    loading: false,
    submitting: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    },
    filters: {
      search: '',
      status: '',
      sort: 'latest'
    }
  }),
  
  actions: {
    async fetchFeedbacks() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
        }
        
        const response = await getAllFeedbacks(params)
        this.feedbacks = response.data.feedbacks
        this.pagination.total = response.data.pagination.total
        return this.feedbacks
      } catch (error) {
        console.error('获取反馈列表失败:', error)
        ElMessage.error('获取反馈列表失败')
        return []
      } finally {
        this.loading = false
      }
    },
    
    async fetchFeedbackDetail(id) {
      this.loading = true
      try {
        const response = await getFeedbackDetail(id)
        this.currentFeedback = response.data
        return this.currentFeedback
      } catch (error) {
        console.error('获取反馈详情失败:', error)
        ElMessage.error('获取反馈详情失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    async replyToFeedback(id, replyData) {
      this.submitting = true
      try {
        const response = await replyFeedback(id, replyData)
        ElMessage.success('回复反馈成功')
        // 更新反馈状态
        if (this.currentFeedback && this.currentFeedback.id === id) {
          this.currentFeedback = response.data.feedback
        }
        // 更新列表中的项
        const index = this.feedbacks.findIndex(f => f.id === id)
        if (index !== -1) {
          this.feedbacks[index].status = 'replied'
          this.feedbacks[index].reply = replyData.reply
        }
        return response.data
      } catch (error) {
        console.error('回复反馈失败:', error)
        ElMessage.error('回复反馈失败')
        return null
      } finally {
        this.submitting = false
      }
    },
    
    async updateStatus(id, status) {
      try {
        await updateFeedbackStatus(id, status)
        ElMessage.success('更新反馈状态成功')
        // 如果当前正在查看这个反馈，更新它的状态
        if (this.currentFeedback && this.currentFeedback.id === id) {
          this.currentFeedback.status = status
        }
        // 更新列表中的状态
        const index = this.feedbacks.findIndex(f => f.id === id)
        if (index !== -1) {
          this.feedbacks[index].status = status
        }
        return true
      } catch (error) {
        console.error('更新反馈状态失败:', error)
        ElMessage.error('更新反馈状态失败')
        return false
      }
    },
    
    async removeFeedback(id) {
      try {
        await deleteFeedback(id)
        ElMessage.success('删除反馈成功')
        await this.fetchFeedbacks()
        return true
      } catch (error) {
        console.error('删除反馈失败:', error)
        ElMessage.error('删除反馈失败')
        return false
      }
    },
    
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1 // 重置页码
    },
    
    setPage(page) {
      this.pagination.page = page
    }
  }
}) 