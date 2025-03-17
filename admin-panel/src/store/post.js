import { defineStore } from 'pinia'
import { 
  getPosts, 
  getAllPosts,
  getPostDetail, 
  deletePost, 
  getPostComments, 
  deleteComment,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/api/post'
import { ElMessage } from 'element-plus'

export const usePostStore = defineStore('post', {
  state: () => ({
    posts: [],
    currentPost: null,
    postComments: [],
    categories: [],
    loading: false,
    categoriesLoading: false,
    commentsLoading: false,
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    },
    filters: {
      search: '',
      sort: 'latest',
      category_id: ''
    }
  }),
  
  actions: {
    async fetchPosts() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
        }
        
        const response = await getPosts(params)
        this.posts = response.data.posts
        this.pagination.total = response.data.total
        return this.posts
      } catch (error) {
        ElMessage.error('获取帖子列表失败')
        return []
      } finally {
        this.loading = false
      }
    },
    
    async fetchPostDetail(id) {
      this.loading = true
      try {
        const response = await getPostDetail(id)
        this.currentPost = response.data
        // 不再单独获取评论，依赖帖子详情API返回的评论数据
        if (this.currentPost && !this.currentPost.comments) {
          this.currentPost.comments = []; // 初始化评论字段，避免模板错误
        }
        return this.currentPost
      } catch (error) {
        ElMessage.error('获取帖子详情失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    async removePost(id) {
      try {
        await deletePost(id)
        ElMessage.success('删除帖子成功')
        await this.fetchPosts()
        return true
      } catch (error) {
        ElMessage.error('删除帖子失败')
        return false
      }
    },
    
    async removeComment(postId, commentId) {
      try {
        await deleteComment(postId, commentId)
        ElMessage.success('删除评论成功')
        // 刷新帖子详情以获取最新评论列表
        await this.fetchPostDetail(postId)
        return true
      } catch (error) {
        ElMessage.error('删除评论失败')
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

    // 获取分类列表
    async fetchCategories() {
      this.categoriesLoading = true
      try {
        const response = await getCategories()
        this.categories = response.data
        return this.categories
      } catch (error) {
        ElMessage.error('获取分类列表失败')
        return []
      } finally {
        this.categoriesLoading = false
      }
    },

    // 添加分类
    async addCategory(categoryData) {
      try {
        await createCategory(categoryData)
        ElMessage.success('创建分类成功')
        await this.fetchCategories()
        return true
      } catch (error) {
        ElMessage.error('创建分类失败')
        return false
      }
    },

    // 更新分类
    async editCategory(id, categoryData) {
      try {
        await updateCategory(id, categoryData)
        ElMessage.success('更新分类成功')
        await this.fetchCategories()
        return true
      } catch (error) {
        ElMessage.error('更新分类失败')
        return false
      }
    },

    // 删除分类
    async removeCategory(id) {
      try {
        await deleteCategory(id)
        ElMessage.success('删除分类成功')
        await this.fetchCategories()
        return true
      } catch (error) {
        ElMessage.error('删除分类失败')
        return false
      }
    },

    // 获取所有帖子列表(用于统计)
    async fetchAllPosts() {
      try {
        const response = await getAllPosts()
        return response.data.posts || []
      } catch (error) {
        console.error('获取所有帖子失败', error)
        return []
      }
    }
  }
}) 