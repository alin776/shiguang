<template>
  <div class="posts-page">
    <div class="page-header">
      <h1 class="page-title">帖子管理</h1>
      <div class="page-actions">
        <el-button type="primary" @click="fetchPosts">刷新</el-button>
      </div>
    </div>
    
    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索帖子标题"
        clearable
        @clear="handleReset"
        style="width: 220px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select
        v-model="selectedCategory"
        clearable
        placeholder="选择分类"
        @change="handleCategoryChange"
        style="width: 180px; margin-left: 10px;"
      >
        <el-option
          v-for="item in categories"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      
      <el-select
        v-model="sortBy"
        @change="handleSortChange"
        style="width: 150px; margin-left: 10px;"
      >
        <el-option label="最新发布" value="latest" />
        <el-option label="最多评论" value="comments" />
        <el-option label="最多浏览" value="views" />
      </el-select>
      
      <el-button
        @click="handleSearch"
        type="primary"
        style="margin-left: 10px;"
      >
        搜索
      </el-button>
      
      <el-button
        @click="handleReset"
        style="margin-left: 10px;"
      >
        重置
      </el-button>
    </div>
    
    <div class="posts-list card">
      <el-table
        v-loading="loading"
        :data="posts"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="scope">
            <el-link 
              type="primary" 
              :underline="false"
              @click="handleRowClick(scope.row)"
            >
              {{ scope.row.title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="作者" width="120" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="views" label="浏览量" width="100" sortable />
        <el-table-column prop="likes_count" label="点赞数" width="100" sortable />
        <el-table-column prop="comments_count" label="评论数" width="100" sortable />
        <el-table-column prop="is_pinned" label="置顶" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.is_pinned" type="success">已置顶</el-tag>
            <el-tag v-else type="info">未置顶</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" width="180" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button 
              size="small"
              @click="handleRowClick(scope.row)"
            >
              查看
            </el-button>
            <el-button 
              size="small" 
              :type="scope.row.is_pinned ? 'warning' : 'success'" 
              @click="handleTogglePin(scope.row)"
            >
              {{ scope.row.is_pinned ? '取消置顶' : '置顶' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDeletePost(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePostStore } from '@/store/post'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const postStore = usePostStore()

const loading = computed(() => postStore.loading)
const posts = computed(() => postStore.posts)
const pagination = computed(() => postStore.pagination)
const categories = ref([])

// 筛选条件
const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref('latest')

// 初始化
onMounted(async () => {
  await fetchPosts()
  await fetchCategories()
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const result = await postStore.fetchCategories()
    categories.value = result || []
  } catch (error) {
    ElMessage.error('获取分类列表失败')
  }
}

// 获取帖子列表
const fetchPosts = async () => {
  try {
    await postStore.fetchPosts()
  } catch (error) {
    ElMessage.error('获取帖子列表失败')
  }
}

// 搜索
const handleSearch = () => {
  postStore.setFilters({
    search: searchQuery.value,
    sort: sortBy.value,
    category_id: selectedCategory.value
  })
  fetchPosts()
}

// 分类变更
const handleCategoryChange = () => {
  handleSearch()
}

// 排序变更
const handleSortChange = () => {
  handleSearch()
}

// 重置筛选
const handleReset = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  sortBy.value = 'latest'
  postStore.setFilters({
    search: '',
    sort: 'latest',
    category_id: ''
  })
  fetchPosts()
}

// 页面大小变更
const handleSizeChange = (size) => {
  postStore.pagination.limit = size
  fetchPosts()
}

// 页码变更
const handleCurrentChange = (page) => {
  postStore.setPage(page)
  fetchPosts()
}

// 查看帖子详情
const viewPostDetail = (postId) => {
  router.push(`/posts/${postId}`)
}

// 表格行点击事件
const handleRowClick = (row) => {
  viewPostDetail(row.id)
}

// 置顶/取消置顶帖子
const handleTogglePin = async (row) => {
  const newPinStatus = !row.is_pinned
  const action = newPinStatus ? '置顶' : '取消置顶'
  
  try {
    const confirmed = await ElMessageBox.confirm(
      `确定要${action}这篇帖子吗？`, 
      '提示', 
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (confirmed) {
      await postStore.togglePin(row.id, newPinStatus)
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 删除帖子
const handleDeletePost = (post) => {
  ElMessageBox.confirm('确定要删除该帖子吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await postStore.removePost(post.id)
    } catch (error) {
      ElMessage.error('删除帖子失败')
    }
  }).catch(() => {})
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.posts-page {
  padding: 10px 0;
}

.filter-bar {
  margin-bottom: 20px;
}

.filter-form {
  padding: 10px 0;
}

.posts-list {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
</style> 