<template>
  <div class="feedbacks-page">
    <div class="page-header">
      <h1 class="page-title">反馈管理</h1>
    </div>
    
    <el-card v-loading="loading">
      <div class="filter-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索反馈内容或用户"
          clearable
          @clear="handleReset"
          style="width: 220px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="statusFilter"
          clearable
          placeholder="反馈状态"
          @change="handleStatusChange"
          style="width: 180px; margin-left: 10px;"
        >
          <el-option label="待处理" value="pending" />
          <el-option label="已回复" value="replied" />
        </el-select>
        
        <el-select
          v-model="sortBy"
          @change="handleSortChange"
          style="width: 150px; margin-left: 10px;"
        >
          <el-option label="最新反馈" value="latest" />
          <el-option label="最早反馈" value="oldest" />
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
      
      <el-table
        :data="feedbacks"
        style="width: 100%"
        border
        @row-click="handleRowClick"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="反馈类型" width="120" />
        <el-table-column prop="content" label="反馈内容" min-width="250">
          <template #default="scope">
            <div class="feedback-content">{{ scope.row.content }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="contact" label="联系方式" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'pending' ? 'warning' : 'success'">
              {{ scope.row.status === 'pending' ? '待处理' : '已回复' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              size="small"
              @click.stop="handleView(scope.row)"
            >
              查看
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click.stop="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && (!feedbacks || !feedbacks.length)" description="暂无反馈数据" />
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.limit"
          :small="small"
          :background="background"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @update:page-size="handleSizeChange"
          @update:current-page="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 查看/回复反馈对话框 -->
    <el-dialog
      :title="currentFeedback ? `反馈详情 - ${getStatusText(currentFeedback.status)}` : '反馈详情'"
      v-model="dialogVisible"
      width="50%"
      destroy-on-close
      append-to-body
      :close-on-click-modal="false"
    >
      <div v-if="currentFeedback" class="feedback-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="反馈类型">{{ currentFeedback.type }}</el-descriptions-item>
          <el-descriptions-item label="反馈内容">{{ currentFeedback.content }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentFeedback.username }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ currentFeedback.contact || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(currentFeedback.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentFeedback.status === 'pending' ? 'warning' : 'success'">
              {{ getStatusText(currentFeedback.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentFeedback.status === 'replied'" class="reply-info">
          <h3>回复信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="回复内容">{{ currentFeedback.reply }}</el-descriptions-item>
            <el-descriptions-item label="回复时间">{{ formatDate(currentFeedback.reply_time) }}</el-descriptions-item>
            <el-descriptions-item label="回复人">{{ currentFeedback.reply_by_name || '系统管理员' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div v-if="currentFeedback.status === 'pending'" class="reply-form">
          <h3>回复反馈</h3>
          <el-form ref="replyFormRef" :model="replyForm" :rules="replyRules">
            <el-form-item label="回复内容" prop="reply">
              <textarea 
                v-model="replyForm.reply"
                class="el-textarea__inner"
                rows="4" 
                placeholder="请输入回复内容"
                style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #dcdfe6; resize: vertical;"
              ></textarea>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button 
            v-if="currentFeedback && currentFeedback.status === 'pending'"
            type="primary" 
            @click="handleReply" 
            :loading="submitting"
          >
            提交回复
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useFeedbackStore } from '@/store/feedback'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const feedbackStore = useFeedbackStore()

const loading = computed(() => feedbackStore.loading)
const submitting = computed(() => feedbackStore.submitting)
const feedbacks = computed(() => feedbackStore.feedbacks)
const pagination = computed(() => feedbackStore.pagination)

// 筛选条件
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('latest')

// 分页参数
const small = ref(false)
const background = ref(true)

// 对话框
const dialogVisible = ref(false)
const currentFeedback = ref(null)
const replyFormRef = ref(null)
const replyForm = ref({
  reply: ''
})
const replyRules = {
  reply: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 1, max: 500, message: '回复内容长度应在1-500个字符之间', trigger: 'blur' }
  ]
}

// 初始化
onMounted(async () => {
  await fetchFeedbacks()
})

// 获取反馈列表
const fetchFeedbacks = async () => {
  try {
    feedbackStore.setFilters({
      search: searchQuery.value,
      status: statusFilter.value,
      sort: sortBy.value
    })
    await feedbackStore.fetchFeedbacks()
  } catch (error) {
    console.error('获取反馈列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  fetchFeedbacks()
}

// 状态变更
const handleStatusChange = () => {
  handleSearch()
}

// 排序变更
const handleSortChange = () => {
  handleSearch()
}

// 重置筛选
const handleReset = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  sortBy.value = 'latest'
  feedbackStore.setFilters({
    search: '',
    status: '',
    sort: 'latest'
  })
  fetchFeedbacks()
}

// 页面大小变更
const handleSizeChange = (size) => {
  feedbackStore.pagination.limit = size
  fetchFeedbacks()
}

// 页码变更
const handleCurrentChange = (page) => {
  feedbackStore.setPage(page)
  fetchFeedbacks()
}

// 表格行点击
const handleRowClick = (row) => {
  handleView(row)
}

// 查看反馈详情
const handleView = async (row) => {
  try {
    currentFeedback.value = await feedbackStore.fetchFeedbackDetail(row.id)
    if (currentFeedback.value) {
      resetReplyForm()
      nextTick(() => {
        dialogVisible.value = true
      })
    }
  } catch (error) {
    console.error('获取反馈详情失败:', error)
  }
}

// 重置回复表单
const resetReplyForm = () => {
  replyForm.value = { reply: '' }
  if (replyFormRef.value) {
    replyFormRef.value.resetFields()
  }
}

// 回复反馈
const handleReply = async () => {
  if (!currentFeedback.value) return
  
  if (!replyFormRef.value) return
  
  await replyFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const result = await feedbackStore.replyToFeedback(
          currentFeedback.value.id, 
          {reply: replyForm.value.reply}
        )
        if (result) {
          dialogVisible.value = false
          await fetchFeedbacks()
        }
      } catch (error) {
        console.error('回复反馈失败:', error)
      }
    }
  })
}

// 删除反馈
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该反馈吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const success = await feedbackStore.removeFeedback(row.id)
      if (success) {
        await fetchFeedbacks()
      }
    } catch (error) {
      console.error('删除反馈失败:', error)
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

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待处理',
    'replied': '已回复'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.feedbacks-page {
  padding: 10px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.feedback-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.reply-info,
.reply-form {
  margin-top: 20px;
}

.reply-info h3,
.reply-form h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 