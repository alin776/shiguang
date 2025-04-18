<template>
  <div class="task-center-page">
    <div class="header">
      <div class="back-button" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h1>任务中心</h1>
    </div>

    <div class="exp-tips">
      <div class="tip-title">
        <el-icon><InfoFilled /></el-icon>
        <span>经验获取小贴士</span>
      </div>
      <div class="tip-content">
        <p>• 每次点赞可直接获得<strong>2点经验</strong></p>
        <p>• 每次评论可直接获得<strong>5点经验</strong></p>
        <p>• 每次发帖可直接获得<strong>10点经验</strong></p>
        <p>• 完成下方任务可额外获得<strong>积分奖励</strong>：点赞(3积分)、评论(2积分)、发帖(5积分)</p>
        <p>• 每日经验获取上限为<strong>{{ dailyExpLimit }}点</strong></p>
      </div>
    </div>

    <div class="task-section">
      <h2 class="section-title">每日任务</h2>
      
      <!-- 添加广告任务 -->
      <div class="task-item special-task" @click="navigateToAd">
        <div class="task-content">
          <div class="task-icon">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div class="task-info">
            <div class="task-title">观看广告</div>
            <div class="task-description">通过观看广告获得时光币奖励</div>
          </div>
        </div>
        
        <div class="task-status">
          <el-button type="primary" size="small">去观看</el-button>
        </div>
      </div>
      
      <div class="task-list">
        <div 
          v-for="task in dailyTasks" 
          :key="task.id" 
          class="task-item"
          :class="{ 'completed': isTaskCompleted(task) }"
        >
          <div class="task-content">
            <div class="task-icon">
              <el-icon v-if="task.type === 'post'"><EditPen /></el-icon>
              <el-icon v-else-if="task.type === 'comment'"><ChatLineRound /></el-icon>
              <el-icon v-else-if="task.type === 'like'"><Star /></el-icon>
            </div>
            <div class="task-info">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-description">{{ task.description }}</div>
            </div>
          </div>
          
          <div class="task-status">
            <template v-if="isTaskCompleted(task)">
              <el-icon class="completed-icon"><CircleCheckFilled /></el-icon>
              <span class="completed-text">已完成</span>
            </template>
            <template v-else>
              <div class="task-progress">
                <span class="current">{{ task.current }}</span>
                <span class="separator">/</span>
                <span class="total">{{ task.target }}</span>
              </div>
              <div class="reward-container">
                <div class="reward" :class="task.type === 'like' ? 'like-reward' : task.type === 'post' ? 'post-reward' : 'comment-reward'">+{{ task.reward }}经验</div>
                <div class="points-reward" v-if="task.pointsReward > 0">+{{ task.pointsReward }}积分</div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="action-section">
      <el-button 
        type="primary" 
        class="go-community-btn"
        @click="router.push('/community')"
      >
        前往社区
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeft, 
  EditPen, 
  ChatLineRound, 
  Star, 
  CircleCheckFilled,
  InfoFilled,
  VideoPlay
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';
import { useTaskStore } from '../stores/task';

const router = useRouter();
const authStore = useAuthStore();
const taskStore = useTaskStore();

const dailyTasks = ref([]);
const isLoading = ref(true);

// 获取每日任务信息
const loadTasks = async () => {
  try {
    isLoading.value = true;
    await taskStore.fetchDailyTasks();
    dailyTasks.value = taskStore.dailyTasks;
  } catch (error) {
    console.error('获取任务信息失败:', error);
    ElMessage.error('获取任务信息失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 计算今日获得的经验值
const dailyExpGained = computed(() => {
  return taskStore.dailyExpGained;
});

// 每日经验值上限
const dailyExpLimit = computed(() => {
  return taskStore.dailyExpLimit;
});

// 计算今日经验值获取百分比
const dailyExpPercentage = computed(() => {
  if (dailyExpLimit.value === 0) return 0;
  const percentage = (dailyExpGained.value / dailyExpLimit.value) * 100;
  return Math.min(percentage, 100);
});

const isTaskCompleted = (task) => {
  return task.isCompleted || task.current >= task.target;
};

// 添加导航方法
const navigateToAd = () => {
  router.push('/ad');
};

onMounted(() => {
  // 加载任务信息
  loadTasks();
  
  // 设置定时刷新
  const refreshInterval = setInterval(() => {
    loadTasks();
  }, 30000); // 每30秒刷新一次任务状态
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(refreshInterval);
  });
});
</script>

<style scoped>
.task-center-page {
  padding: 10px 16px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 10px;
}

.back-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.exp-tips {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tip-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 12px;
}

.tip-content {
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
}

.tip-content p {
  margin: 6px 0;
}

.tip-content strong {
  color: #f56c6c;
  font-weight: 600;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #303133;
}

.task-list {
  margin-bottom: 24px;
}

.task-item {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-item.completed {
  background-color: #f0f9ff;
  border: 1px solid #e6f4ff;
}

.task-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.task-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #3b82f6;
}

.task-item.completed .task-icon {
  background-color: #e6ffec;
  color: #10b981;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.task-description {
  font-size: 14px;
  color: #909399;
}

.task-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 80px;
}

.task-progress {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.current {
  color: #3b82f6;
}

.reward-container {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}

.reward, .points-reward {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #fff3f3;
}

.like-reward {
  color: #e67e22;
  background-color: #fff8e1;
}

.post-reward {
  color: #3498db;
  background-color: #e3f2fd;
}

.comment-reward {
  color: #9c27b0;
  background-color: #f3e5f5;
}

.completed-icon {
  color: #10b981;
  font-size: 20px;
  margin-bottom: 4px;
}

.completed-text {
  font-size: 14px;
  color: #10b981;
  font-weight: 500;
}

.action-section {
  padding: 20px 0;
  display: flex;
  justify-content: center;
}

.go-community-btn {
  min-width: 200px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 30px;
}

.special-task {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  cursor: pointer;
  transition: transform 0.2s;
}

.special-task:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style> 