<template>
  <div class="activity-detail-page">
    <div class="header">
      <div class="back-button" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h1>活动详情</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="activity" class="activity-content">
      <div class="cover-image">
        <img :src="getActivityCover(activity)" :alt="activity.title">
        <div class="activity-status" v-if="getActivityStatus(activity)">
          {{ getActivityStatus(activity) }}
        </div>
      </div>

      <div class="activity-main">
        <h2 class="activity-title">{{ activity.title }}</h2>
        
        <div class="activity-info">
          <div class="info-item">
            <el-icon><Calendar /></el-icon>
            <div class="info-content">
              <div class="info-label">活动时间</div>
              <div class="info-value">
                {{ formatDate(activity.start_time) }} - {{ formatTime(activity.end_time) }}
              </div>
            </div>
          </div>

          <div class="info-item">
            <el-icon><Location /></el-icon>
            <div class="info-content">
              <div class="info-label">活动地点</div>
              <div class="info-value">{{ activity.location }}</div>
            </div>
          </div>
        </div>

        <div class="activity-description">
          <h3>活动介绍</h3>
          <div class="description-content">{{ activity.description }}</div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="活动不存在或已删除" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Calendar, Location, User } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const activity = ref(null);
const loading = ref(true);
const hasJoined = ref(false);

// 获取活动详情
const fetchActivityDetail = async () => {
  try {
    loading.value = true;
    const activityId = route.params.id;
    
    const response = await fetch(
      `${API_BASE_URL}/api/activities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('获取活动详情失败');
    }
    
    const data = await response.json();
    activity.value = data.data;
  } catch (error) {
    console.error('获取活动详情错误:', error);
    ElMessage.error(error.message || '获取活动详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取活动封面图
const getActivityCover = (activity) => {
  if (activity.cover_image) {
    if (activity.cover_image.startsWith('http')) {
      return activity.cover_image;
    }
    return `${API_BASE_URL}/uploads/covers/${activity.cover_image}`;
  }
  return 'https://via.placeholder.com/800x400?text=活动';
};

// 格式化日期
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 格式化时间
const formatTime = (dateString) => {
  return dayjs(dateString).format('HH:mm');
};

// 获取活动状态
const getActivityStatus = (activity) => {
  const now = dayjs();
  const startTime = dayjs(activity.start_time);
  const endTime = dayjs(activity.end_time);
  
  if (activity.status === 'cancelled') {
    return '已取消';
  }
  
  if (now.isBefore(startTime)) {
    return '即将开始';
  }
  
  if (now.isAfter(endTime)) {
    return '已结束';
  }
  
  return '进行中';
};

// 活动操作（参与/退出）
const handleActivityAction = async () => {
  ElMessage.info('无需报名，您可直接参与该活动');
};

onMounted(() => {
  fetchActivityDetail();
});
</script>

<style scoped>
.activity-detail-page {
  padding-bottom: 20px;
}

.header {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.back-button {
  font-size: 20px;
  margin-right: 15px;
  cursor: pointer;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.loading-state {
  padding: 20px 15px;
}

.activity-content {
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.cover-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-status {
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 13px;
}

.activity-main {
  padding: 20px 15px;
  background-color: #fff;
  margin-bottom: 15px;
  text-align: left;
}

.activity-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px;
  line-height: 1.4;
}

.activity-info {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.info-item .el-icon {
  font-size: 18px;
  color: #409EFF;
  margin-right: 10px;
  margin-top: 2px;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 3px;
}

.info-value {
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
}

.activity-description {
  margin-bottom: 20px;
}

.activity-description h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.description-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 15px;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.action-button {
  width: 100%;
}

.empty-state {
  margin-top: 50px;
  text-align: center;
}
</style> 