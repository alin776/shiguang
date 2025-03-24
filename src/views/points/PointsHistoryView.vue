<template>
  <div class="points-history-container">
    <page-header title="积分明细" :show-back="true" />
    
    <div class="points-content">
      <div class="points-total">
        <div class="points-card">
          <div class="points-title">当前积分</div>
          <div class="points-value">{{ userPoints }}</div>
        </div>
      </div>
      
      <div class="history-list" v-loading="loading">
        <div class="history-item" v-for="item in pointsHistory" :key="item.id">
          <div class="item-info">
            <div class="item-source">{{ item.source }}</div>
            <div class="item-time">{{ formatDate(item.created_at) }}</div>
          </div>
          <div 
            class="item-amount" 
            :class="{ 'gain': item.points_gained > 0, 'loss': item.points_gained < 0 }"
          >
            {{ item.points_gained > 0 ? '+' : '' }}{{ item.points_gained }}
          </div>
        </div>
        
        <!-- 加载更多 -->
        <el-button 
          v-if="hasMore" 
          @click="loadMore" 
          :loading="loadingMore" 
          class="load-more-btn"
        >
          加载更多
        </el-button>
        
        <!-- 无数据状态 -->
        <div class="no-data" v-if="pointsHistory.length === 0 && !loading">
          <el-empty description="暂无积分记录" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import PageHeader from '@/components/PageHeader.vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const userPoints = computed(() => authStore.user?.points || 0);

const pointsHistory = ref([]);
const loading = ref(true);
const loadingMore = ref(false);
const page = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);

// 获取积分历史记录
const fetchPointsHistory = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/points-history`, {
      params: { page: page.value, pageSize: pageSize.value },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const { records, pagination } = response.data;
    
    if (isLoadMore) {
      pointsHistory.value = [...pointsHistory.value, ...records];
    } else {
      pointsHistory.value = records;
    }
    
    hasMore.value = page.value < pagination.totalPages;
  } catch (error) {
    console.error('获取积分历史失败:', error);
    ElMessage.error('获取积分历史记录失败');
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loadingMore.value) {
    page.value++;
    fetchPointsHistory(true);
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

onMounted(() => {
  fetchPointsHistory();
});
</script>

<style scoped>
.points-history-container {
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.points-content {
  padding-top: 56px; /* 为固定位置的头部组件预留空间 */
  flex: 1;
}

.points-total {
  padding: 20px;
}

.points-card {
  background: linear-gradient(135deg, #3a8ee6, #5b32de);
  color: white;
  border-radius: 10px;
  padding: 20px;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.points-title {
  font-size: 16px;
  font-weight: 500;
}

.points-value {
  font-size: 32px;
  font-weight: bold;
}

.history-list {
  padding: 0 15px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.item-info {
  flex: 1;
  text-align: left;
  margin-right: 10px;
}

.item-source {
  font-size: 15px;
  margin-bottom: 5px;
  color: #333;
  line-height: 1.4;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-amount {
  font-size: 16px;
  font-weight: bold;
  text-align: right;
  min-width: 50px;
}

.item-amount.gain {
  color: #67c23a;
}

.item-amount.loss {
  color: #f56c6c;
}

.load-more-btn {
  width: 100%;
  margin-top: 20px;
}

.no-data {
  padding: 30px 0;
}
</style> 