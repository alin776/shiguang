<template>
  <div class="activity-list-page">
    <div class="top-spacing"></div>
    <div class="header">
      <div class="back-button" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h1>最新活动</h1>
    </div>

    <div class="activity-banner" v-if="activities.length > 0">
      <el-carousel 
        height="180px" 
        indicator-position="none" 
        :interval="4000"
        arrow="always"
      >
        <el-carousel-item v-for="activity in featuredActivities" :key="activity.id">
          <div 
            class="banner-item" 
            :style="{ backgroundImage: `url(${getActivityCover(activity)})` }"
            @click="goToActivityDetail(activity.id)"
          >
            <div class="banner-overlay"></div>
            <div class="banner-content">
              <h3>{{ activity.title }}</h3>
              <div class="banner-info">
                <span>{{ formatDate(activity.start_time) }}</span>
                <span class="dot-separator">·</span>
                <span>{{ activity.location }}</span>
              </div>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <div class="filter-bar">
      <span 
        class="filter-item" 
        :class="{ 'active': filter === 'all' }" 
        @click="filter = 'all'"
      >
        全部活动
      </span>
      <span 
        class="filter-item" 
        :class="{ 'active': filter === 'upcoming' }" 
        @click="filter = 'upcoming'"
      >
        即将开始
      </span>
      <span 
        class="filter-item" 
        :class="{ 'active': filter === 'ongoing' }" 
        @click="filter = 'ongoing'"
      >
        正在进行
      </span>
    </div>

    <div class="activity-list" v-if="filteredActivities.length > 0">
      <div 
        v-for="activity in filteredActivities" 
        :key="activity.id" 
        class="activity-card"
        @click="goToActivityDetail(activity.id)"
      >
        <div class="activity-cover">
          <img :src="getActivityCover(activity)" :alt="activity.title">
          <div class="activity-status" v-if="getActivityStatus(activity)">
            {{ getActivityStatus(activity) }}
          </div>
        </div>
        <div class="activity-info">
          <h3 class="activity-title">{{ activity.title }}</h3>
          <div class="activity-meta">
            <div class="meta-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(activity.start_time) }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Location /></el-icon>
              <span>{{ activity.location }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else-if="!loading">
      <el-empty description="暂无活动" />
    </div>

    <div class="loading-state" v-if="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div class="load-more" v-if="hasMoreActivities && !loading && filteredActivities.length > 0">
      <el-button @click="loadMoreActivities" plain>加载更多</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeft, 
  Calendar, 
  Location,
  Timer, 
  User
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { useAuthStore } from '../../stores/auth';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();

const activities = ref([]);
const loading = ref(true);
const filter = ref('all');
const page = ref(1);
const hasMoreActivities = ref(true);

// 获取活动列表
const fetchActivities = async () => {
  try {
    loading.value = true;
    
    // 检查认证状态
    if (!authStore.token) {
      console.error('未登录或令牌不存在，无法获取活动列表');
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    console.log('准备获取活动列表，API地址:', API_BASE_URL);
    console.log('使用的认证Token:', authStore.token ? authStore.token.substring(0, 20) + '...' : '无');
    
    const url = `${API_BASE_URL}/api/activities?limit=10&offset=${(page.value - 1) * 10}`;
    console.log('请求URL:', url);
    
    const headers = {
      'Authorization': `Bearer ${authStore.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    console.log('请求头:', headers);
    
    // 使用axios而不是fetch，处理更一致
    const response = await axios.get(url, { 
      headers,
      timeout: 10000 // 10秒超时
    });
    
    console.log('API响应状态:', response.status);
    console.log('API响应数据:', response.data);
    
    // 处理响应数据
    const data = response.data;
    activities.value = data.data || [];
    hasMoreActivities.value = (data.data || []).length >= 10;
  } catch (error) {
    console.error('获取活动列表错误:', error);
    
    // 特殊处理网络错误
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      ElMessage.error('网络连接失败，请检查网络连接或服务器是否可用');
    } else {
      ElMessage.error(error.message || '获取活动列表失败');
    }
  } finally {
    loading.value = false;
  }
};

// 加载更多活动
const loadMoreActivities = () => {
  page.value++;
  fetchActivities();
};

// 获取活动封面图
const getActivityCover = (activity) => {
  if (activity.cover_image) {
    if (activity.cover_image.startsWith('http')) {
      return activity.cover_image;
    }
    return `${API_BASE_URL}/uploads/covers/${activity.cover_image}`;
  }
  return 'https://via.placeholder.com/300x180?text=活动';
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

// 跳转到活动详情页
const goToActivityDetail = (activityId) => {
  router.push(`/activities/${activityId}`);
};

// 筛选活动
const filteredActivities = computed(() => {
  const now = dayjs();
  
  if (filter.value === 'all') {
    return activities.value;
  } else if (filter.value === 'upcoming') {
    return activities.value.filter(activity => {
      const startTime = dayjs(activity.start_time);
      return startTime.isAfter(now);
    });
  } else if (filter.value === 'ongoing') {
    return activities.value.filter(activity => {
      const startTime = dayjs(activity.start_time);
      const endTime = dayjs(activity.end_time);
      return startTime.isBefore(now) && endTime.isAfter(now);
    });
  }
  
  return activities.value;
});

// 精选活动（取前3个）
const featuredActivities = computed(() => {
  return activities.value.slice(0, 3);
});

onMounted(async () => {
  // 加载和验证认证令牌
  if (!authStore.token) {
    console.error('无法获取认证令牌，请重新登录');
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
  
  // 打印认证信息以便调试
  console.log('认证状态:', !!authStore.token);
  console.log('令牌前20字符:', authStore.token ? authStore.token.substring(0, 20) + '...' : '无');

  await fetchActivities();
});
</script>

<style scoped>
.activity-list-page {
  padding-bottom: 60px;
  margin-top: 0;
  min-height: 100vh;
  display: block;
}

.top-spacing {
  height: 30px;
  width: 100%;
  background-color: #f8f9fa;
  flex-shrink: 0;
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

.activity-banner {
  margin: 10px 0;
}

.banner-item {
  height: 180px;
  background-size: cover;
  background-position: center;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
}

.banner-content {
  position: absolute;
  bottom: 15px;
  left: 15px;
  right: 15px;
  color: #fff;
}

.banner-content h3 {
  margin: 0 0 5px;
  font-size: 18px;
  font-weight: 500;
}

.banner-info {
  font-size: 14px;
  opacity: 0.9;
}

.dot-separator {
  margin: 0 5px;
}

.filter-bar {
  display: flex;
  padding: 15px;
  background-color: #fff;
  margin-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-item {
  margin-right: 15px;
  padding: 5px 0;
  font-size: 14px;
  color: #666;
  position: relative;
  cursor: pointer;
}

.filter-item.active {
  color: #409EFF;
  font-weight: 500;
}

.filter-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #409EFF;
}

.activity-list {
  padding: 0 15px;
}

.activity-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.activity-cover {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.activity-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-status {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.activity-info {
  padding: 15px;
}

.activity-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.activity-meta {
  display: flex;
  margin-bottom: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
  font-size: 13px;
  color: #909399;
}

.meta-item .el-icon {
  margin-right: 5px;
  font-size: 14px;
}

.activity-time {
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
}

.activity-time .el-icon {
  margin-right: 5px;
}

.empty-state {
  margin-top: 50px;
  text-align: center;
}

.loading-state {
  padding: 20px 15px;
}

.load-more {
  text-align: center;
  margin: 20px 0;
}
</style> 