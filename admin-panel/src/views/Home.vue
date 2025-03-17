<template>
  <div class="home-page">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
    </div>
    
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ data.postCount || '0' }}</div>
            <div class="stat-label">帖子数量</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ data.userCount || '0' }}</div>
            <div class="stat-label">用户数量</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ data.commentCount || '0' }}</div>
            <div class="stat-label">评论数量</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <div class="card" v-loading="loading">
      <div class="card-header">
        <h2 class="card-title">最近活动</h2>
      </div>
      <div class="card-body">
        <el-empty v-if="!data.recentActivities?.length" description="暂无活动数据" />
        <div v-else class="activity-list">
          <div v-for="item in data.recentActivities" :key="item.id" class="activity-item">
            <div class="activity-time">{{ formatTime(item.time) }}</div>
            <div class="activity-content">{{ item.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, User, ChatDotRound } from '@element-plus/icons-vue'
import { getDashboardData } from '@/api/dashboard'

const data = ref({
  postCount: 0,
  userCount: 0,
  commentCount: 0,
  recentActivities: []
})

// 加载中状态
const loading = ref(false)

onMounted(async () => {
  try {
    loading.value = true
    const response = await getDashboardData()
    data.value = response.data
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    ElMessage.error('获取仪表盘数据失败')
    // 加载失败时使用模拟数据
    data.value = {
      postCount: 123,
      userCount: 456,
      commentCount: 789,
      recentActivities: [
        { id: 1, time: new Date(), content: '用户小明发布了新帖子' },
        { id: 2, time: new Date(Date.now() - 3600000), content: '管理员更新了系统设置' },
        { id: 3, time: new Date(Date.now() - 7200000), content: '新用户小红注册了账号' }
      ]
    }
  } finally {
    loading.value = false
  }
})

const formatTime = (time) => {
  const date = new Date(time)
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
.home-page {
  padding: 10px 0;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #ecf5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #409EFF;
  margin-right: 20px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.card-title {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.card-body {
  padding: 20px;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.activity-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.activity-time {
  width: 180px;
  color: #909399;
  font-size: 14px;
}

.activity-content {
  flex: 1;
  color: #303133;
  font-size: 14px;
}
</style> 