import { defineStore } from 'pinia'
import { getNotes, createNote, deleteNote } from '@/api/note'
import { ElMessage } from 'element-plus'

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [],
    loading: false,
    submitting: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    },
    filters: {
      search: '',
      sort: 'latest'
    }
  }),
  
  actions: {
    async fetchNotes() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
        }
        
        console.log('请求参数:', params);
        
        const response = await getNotes(params)
        console.log('响应数据:', response.data);
        
        this.notes = response.data.notes
        this.pagination = {
          ...this.pagination,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }
        return this.notes
      } catch (error) {
        console.error('获取小记列表失败:', error)
        ElMessage.error('获取小记列表失败')
        return []
      } finally {
        this.loading = false
      }
    },
    
    async fetchNotesWithParams(params) {
      this.loading = true
      try {
        console.log('使用直接传入的参数获取小记:', params);
        
        const response = await getNotes(params)
        console.log('响应数据:', response.data);
        
        this.notes = response.data.notes
        this.pagination = {
          ...this.pagination,
          page: params.page,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }
        return this.notes
      } catch (error) {
        console.error('获取小记列表失败:', error)
        ElMessage.error('获取小记列表失败')
        return []
      } finally {
        this.loading = false
      }
    },
    
    async addNote(noteData) {
      this.submitting = true
      try {
        const response = await createNote(noteData)
        ElMessage.success('小记创建成功')
        await this.fetchNotes()
        return response.data.note
      } catch (error) {
        console.error('创建小记失败:', error)
        ElMessage.error('创建小记失败')
        return null
      } finally {
        this.submitting = false
      }
    },
    
    async removeNote(id) {
      try {
        await deleteNote(id)
        ElMessage.success('小记删除成功')
        await this.fetchNotes()
        return true
      } catch (error) {
        console.error('删除小记失败:', error)
        ElMessage.error('删除小记失败')
        return false
      }
    },
    
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1 // 重置页码
    },
    
    setPage(page) {
      this.pagination.page = page
    },
    
    setLimit(limit) {
      this.pagination.limit = limit
      this.pagination.page = 1 // 切换每页显示数量时重置页码
    }
  }
}) 