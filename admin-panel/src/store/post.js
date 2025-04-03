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
  deleteCategory,
  togglePinPost,
  getRatePostCategories,
  createRatePostCategory,
  updateRatePostCategory,
  deleteRatePostCategory,
  getRatePosts,
  getRatePostDetail,
  createRatePost,
  updateRatePost,
  deleteRatePost,
  deleteRateOption,
  deleteRateComment
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
    },
    ratePostCategories: [],
    ratePostCategoriesLoading: false,
    ratePosts: [],
    currentRatePost: null,
    ratePostsLoading: false,
    ratePostPagination: {
      page: 1,
      limit: 10,
      total: 0
    },
    ratePostFilters: {
      category: 'all',
      search: ''
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
        console.log('API返回的帖子数据:', response)
        
        // 确保数据存在
        this.posts = response.data.posts || []
        
        // 尝试各种可能的路径获取总数
        let total = 0
        if (response.data.total !== undefined) {
          total = response.data.total;
        } else if (response.data.pagination && response.data.pagination.total !== undefined) {
          total = response.data.pagination.total;
        } else if (response.data.meta && response.data.meta.total !== undefined) {
          total = response.data.meta.total;
        } else {
          // 如果无法获取总数，至少使用当前页面的帖子数量
          total = this.posts.length;
        }
        
        this.pagination.total = total;
        console.log('解析后的分页数据:', this.pagination)
        return this.posts
      } catch (error) {
        console.error('获取帖子列表失败:', error)
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
    },

    // 置顶或取消置顶帖子
    async togglePin(postId, isPinned) {
      try {
        await togglePinPost(postId, isPinned)
        ElMessage.success(isPinned ? '帖子已置顶' : '帖子已取消置顶')
        await this.fetchPosts()
        return true
      } catch (error) {
        ElMessage.error('操作失败')
        return false
      }
    },

    // 获取评分贴分类列表
    async fetchRatePostCategories() {
      this.ratePostCategoriesLoading = true
      try {
        const response = await getRatePostCategories()
        this.ratePostCategories = response.data.data || []
        return this.ratePostCategories
      } catch (error) {
        ElMessage.error('获取评分贴分类列表失败')
        return []
      } finally {
        this.ratePostCategoriesLoading = false
      }
    },

    // 添加评分贴分类
    async addRatePostCategory(categoryData) {
      try {
        await createRatePostCategory(categoryData)
        ElMessage.success('创建评分贴分类成功')
        await this.fetchRatePostCategories()
        return true
      } catch (error) {
        ElMessage.error('创建评分贴分类失败')
        return false
      }
    },

    // 更新评分贴分类
    async editRatePostCategory(id, categoryData) {
      try {
        await updateRatePostCategory(id, categoryData)
        ElMessage.success('更新评分贴分类成功')
        await this.fetchRatePostCategories()
        return true
      } catch (error) {
        ElMessage.error('更新评分贴分类失败')
        return false
      }
    },

    // 删除评分贴分类
    async removeRatePostCategory(id) {
      try {
        await deleteRatePostCategory(id)
        ElMessage.success('删除评分贴分类成功')
        await this.fetchRatePostCategories()
        return true
      } catch (error) {
        ElMessage.error('删除评分贴分类失败')
        return false
      }
    },

    // 获取评分贴列表
    async fetchRatePosts() {
      this.ratePostsLoading = true
      try {
        const params = {
          page: this.ratePostPagination.page,
          limit: this.ratePostPagination.limit,
          ...this.ratePostFilters
        }
        
        const response = await getRatePosts(params)
        if (response && response.data && response.data.success) {
          const { posts, pagination } = response.data.data
          
          this.ratePosts = posts || []
          
          if (pagination) {
            this.ratePostPagination.total = pagination.total || 0
            this.ratePostPagination.totalPages = pagination.totalPages || 0
          }
          
          return this.ratePosts
        } else {
          console.error('获取评分贴列表响应格式异常:', response)
          return []
        }
      } catch (error) {
        console.error('获取评分贴列表错误:', error)
        ElMessage.error('获取评分贴列表失败')
        return []
      } finally {
        this.ratePostsLoading = false
      }
    },
    
    // 获取评分贴详情
    async fetchRatePostDetail(id) {
      this.ratePostsLoading = true
      try {
        const response = await getRatePostDetail(id)
        console.log('API返回的评分贴详情原始数据:', response)
        
        if (response && response.data && response.data.success) {
          this.currentRatePost = response.data.data
          console.log('处理后的评分贴详情数据:', this.currentRatePost)
          return this.currentRatePost
        } else {
          console.error('获取评分贴详情响应格式异常:', response)
          return null
        }
      } catch (error) {
        console.error('获取评分贴详情失败:', error)
        ElMessage.error('获取评分贴详情失败')
        return null
      } finally {
        this.ratePostsLoading = false
      }
    },
    
    // 创建评分贴
    async createRatePost(postData) {
      try {
        const response = await createRatePost(postData)
        ElMessage.success('创建评分贴成功')
        return response.data
      } catch (error) {
        ElMessage.error('创建评分贴失败')
        throw error
      }
    },
    
    // 更新评分贴
    async updateRatePost(id, postData) {
      try {
        await updateRatePost(id, postData)
        ElMessage.success('更新评分贴成功')
        return true
      } catch (error) {
        ElMessage.error('更新评分贴失败')
        return false
      }
    },
    
    // 删除评分贴
    async deleteRatePost(id) {
      try {
        await deleteRatePost(id)
        ElMessage.success('删除评分贴成功')
        await this.fetchRatePosts()
        return true
      } catch (error) {
        ElMessage.error('删除评分贴失败')
        return false
      }
    },
    
    // 删除评分选项
    async deleteRateOption(id) {
      try {
        await deleteRateOption(id)
        ElMessage.success('删除评分选项成功')
        // 如果当前在查看评分贴详情，需要刷新详情
        if (this.currentRatePost && this.currentRatePost.id) {
          await this.fetchRatePostDetail(this.currentRatePost.id)
        }
        return true
      } catch (error) {
        ElMessage.error('删除评分选项失败')
        return false
      }
    },
    
    // 删除评分评论
    async deleteRateComment(id) {
      try {
        await deleteRateComment(id)
        ElMessage.success('删除评论成功')
        // 如果当前在查看评分贴详情，需要刷新详情
        if (this.currentRatePost && this.currentRatePost.id) {
          await this.fetchRatePostDetail(this.currentRatePost.id)
        }
        return true
      } catch (error) {
        ElMessage.error('删除评论失败')
        return false
      }
    },
    
    // 设置评分贴过滤条件
    setRatePostFilters(filters) {
      this.ratePostFilters = { ...this.ratePostFilters, ...filters }
      this.ratePostPagination.page = 1 // 重置页码
    },
    
    // 设置评分贴页码
    setRatePostPage(page) {
      this.ratePostPagination.page = page
    }
  }
}) 