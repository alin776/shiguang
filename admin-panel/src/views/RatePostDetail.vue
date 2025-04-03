<template>
  <div class="rate-post-detail-page">
    <div class="page-header">
      <div class="title-section">
        <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
        <h1 class="page-title">{{ ratePost.title }}</h1>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="handleEdit">编辑</el-button>
        <el-button type="danger" @click="handleDelete">删除</el-button>
      </div>
    </div>
    
    <el-card v-loading="loading" class="info-card">
      <template #header>
        <div class="card-header">
          <h3>基本信息</h3>
        </div>
      </template>
      
      <div class="info-item">
        <span class="label">ID:</span>
        <span>{{ ratePost.id }}</span>
      </div>
      
      <div class="info-item">
        <span class="label">分类:</span>
        <span>{{ getCategoryName(ratePost.category) }}</span>
      </div>
      
      <div class="info-item">
        <span class="label">描述:</span>
        <span>{{ ratePost.description || '无' }}</span>
      </div>
      
      <div class="info-item">
        <span class="label">创建者:</span>
        <span>{{ ratePost.creator }}</span>
      </div>
      
      <div class="info-item">
        <span class="label">评分人数:</span>
        <span>{{ ratePost.totalRatings || ratePost.total_ratings || 0 }}</span>
      </div>
      
      <div class="info-item">
        <span class="label">创建时间:</span>
        <span>{{ formatDate(ratePost.created_at) }}</span>
      </div>
    </el-card>
    
    <el-card class="options-card">
      <template #header>
        <div class="card-header">
          <h3>评分选项</h3>
        </div>
      </template>
      
      <el-table :data="options" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="选项名称" />
        <el-table-column label="选项图片" width="120">
          <template #default="scope">
            <el-image 
              v-if="scope.row.avatar" 
              :src="getImageUrl(scope.row.avatar)" 
              style="width: 50px; height: 50px"
              fit="cover"
              :preview-src-list="[getImageUrl(scope.row.avatar)]"
            />
            <span v-else>无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="avg_score" label="平均分" width="100">
          <template #default="scope">
            {{ formatScore(scope.row.avg_score || scope.row.score) }}
          </template>
        </el-table-column>
        <el-table-column prop="ratings" label="评分人数" width="100">
          <template #default="scope">
            {{ scope.row.ratings || scope.row.ratings_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-popconfirm
              title="确定要删除此评分选项吗？此操作不可恢复！"
              @confirm="deleteOption(scope.row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card class="comments-card">
      <template #header>
        <div class="card-header">
          <h3>评论管理</h3>
          <el-input
            v-model="commentSearchKeyword"
            placeholder="搜索评论内容"
            clearable
            class="comment-search"
            @input="filterComments"
          >
            <template #suffix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>
      
      <!-- 使用Tab分组显示不同选项下的评论 -->
      <el-tabs type="border-card">
        <el-tab-pane 
          v-for="option in options" 
          :key="option.id" 
          :label="option.name + ' (' + (option.comments?.length || 0) + ')'"
        >
          <el-table 
            :data="filterOptionComments(option.id)" 
            style="width: 100%" 
            border
            v-if="option.comments && option.comments.length > 0"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
            <el-table-column prop="username" label="用户" width="120" />
            <el-table-column prop="rating" label="评分" width="80">
              <template #default="scope">
                {{ scope.row.rating || '无' }}
              </template>
            </el-table-column>
            <el-table-column prop="likes" label="点赞数" width="80" />
            <el-table-column prop="created_at" label="评论时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-popconfirm
                  title="确定要删除此评论吗？此操作不可恢复！"
                  @confirm="deleteComment(scope.row.id)"
                >
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          
          <el-empty 
            v-else 
            description="暂无评论数据" 
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { usePostStore } from '@/store/post'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const postStore = usePostStore()
const loading = ref(false)
const ratePost = ref({})
const options = ref([])
const commentSearchKeyword = ref('')
const filteredComments = ref({}) // 存储过滤后的评论

// 获取评分贴详情
const fetchRatePostDetail = async () => {
  loading.value = true
  try {
    const postId = route.params.id
    const detail = await postStore.fetchRatePostDetail(postId)
    if (detail) {
      ratePost.value = detail
      options.value = detail.options || []
      
      // 初始化过滤评论的数据结构
      filteredComments.value = {}
      if (options.value && options.value.length > 0) {
        options.value.forEach(option => {
          if (option.comments && option.comments.length > 0) {
            filteredComments.value[option.id] = [...option.comments]
          } else {
            filteredComments.value[option.id] = []
          }
        })
      }
    }
  } catch (error) {
    ElMessage.error('获取评分贴详情失败')
    console.error('获取评分贴详情错误:', error)
  } finally {
    loading.value = false
  }
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId) return '无分类'
  const category = postStore.ratePostCategories.find(c => c.id === categoryId)
  return category ? category.name : categoryId
}

// 初始化
onMounted(async () => {
  await postStore.fetchRatePostCategories()
  await fetchRatePostDetail()
})

// 格式化分数
const formatScore = (score) => {
  if (!score) return '0.0'
  return parseFloat(score).toFixed(1)
}

// 获取图片URL
const getImageUrl = (avatar) => {
  if (!avatar) return ''
  
  // 处理相对路径和绝对路径
  if (avatar.startsWith('http')) {
    return avatar
  }
  
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://47.98.210.7:3000'
  return `${apiBase}${avatar}`
}

// 处理评论搜索
const filterComments = () => {
  const keyword = commentSearchKeyword.value.toLowerCase().trim()
  
  // 如果关键词为空，恢复所有评论
  if (!keyword) {
    options.value.forEach(option => {
      if (option.comments && option.comments.length > 0) {
        filteredComments.value[option.id] = [...option.comments]
      }
    })
    return
  }
  
  // 否则按关键词过滤
  options.value.forEach(option => {
    if (option.comments && option.comments.length > 0) {
      filteredComments.value[option.id] = option.comments.filter(comment => 
        comment.content.toLowerCase().includes(keyword) ||
        (comment.username && comment.username.toLowerCase().includes(keyword))
      )
    }
  })
}

// 获取选项下过滤后的评论
const filterOptionComments = (optionId) => {
  return filteredComments.value[optionId] || []
}

// 返回列表页
const goBack = () => {
  router.push('/rate-posts')
}

// 编辑评分贴
const handleEdit = () => {
  // 跳转到列表页并带上编辑参数，或者直接调用列表页的编辑函数
  router.push({
    path: '/rate-posts',
    query: { edit: ratePost.value.id }
  })
}

// 删除评分贴
const handleDelete = () => {
  ElMessageBox.confirm('确定要删除该评分贴吗？此操作将同时删除所有评分数据，不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const success = await postStore.deleteRatePost(ratePost.value.id)
      if (success) {
        ElMessage.success('删除评分贴成功')
        router.push('/rate-posts')
      }
    } catch (error) {
      ElMessage.error('删除评分贴失败')
    }
  }).catch(() => {})
}

// 删除评分选项
const deleteOption = async (optionId) => {
  try {
    const success = await postStore.deleteRateOption(optionId)
    if (success) {
      ElMessage.success('删除评分选项成功')
      // 刷新评分贴详情
      await fetchRatePostDetail()
    }
  } catch (error) {
    ElMessage.error('删除评分选项失败')
  }
}

// 删除评论
const deleteComment = async (commentId) => {
  try {
    const success = await postStore.deleteRateComment(commentId)
    if (success) {
      ElMessage.success('删除评论成功')
      // 刷新评分贴详情
      await fetchRatePostDetail()
    }
  } catch (error) {
    ElMessage.error('删除评论失败')
  }
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
.rate-post-detail-page {
  padding: 10px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  align-items: center;
}

.page-title {
  margin: 0 0 0 15px;
}

.info-card,
.options-card,
.comments-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item {
  margin-bottom: 10px;
  display: flex;
}

.label {
  font-weight: bold;
  width: 100px;
}

.comment-search {
  width: 300px;
}
</style> 