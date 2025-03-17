<template>
  <div class="version-history">
    <div class="page-header">
      <div class="back-button" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h1>版本历史</h1>
    </div>
    
    <div class="content">
      <el-card v-if="loading" class="loading-card">
        <el-skeleton :rows="6" animated />
      </el-card>
      
      <div v-else-if="error" class="error-message">
        <el-empty description="加载失败，请重试" />
        <el-button type="primary" @click="fetchVersionHistory">重试</el-button>
      </div>
      
      <div v-else class="version-list">
        <el-card v-for="version in versionHistory" :key="version.version" class="version-card">
          <div class="version-header">
            <div class="version-number">
              <span class="version">{{ version.version }}</span>
              <el-tag v-if="version.version === updateStore.currentVersion" size="small" type="success">当前版本</el-tag>
              <el-tag v-if="version.forceUpdate" size="small" type="danger">强制更新</el-tag>
            </div>
            <div class="release-date">{{ formatDate(version.releaseDate) }}</div>
          </div>
          
          <div class="release-notes">
            {{ version.releaseNotes }}
          </div>
        </el-card>
      </div>
      
      <div class="app-info">
        <p>当前版本: {{ updateStore.currentVersion }}</p>
        <p v-if="platformInfo">平台: {{ platformInfo }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUpdateStore } from '../stores/updateStore';
import axios from 'axios';
import { API_BASE_URL, APP_VERSION } from '../config';
import { App } from '@capacitor/app';
import { ArrowLeft } from '@element-plus/icons-vue';

const updateStore = useUpdateStore();
const versionHistory = ref([]);
const loading = ref(true);
const error = ref(null);
const platformInfo = ref('web'); // 默认为web平台

onMounted(async () => {
  // 获取平台信息
  try {
    // 检测是否在Capacitor原生环境中
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      const info = await App.getInfo();
      platformInfo.value = info.platform;
    } else {
      console.log('在Web环境中运行，使用web作为平台');
      platformInfo.value = 'web';
    }
  } catch (error) {
    console.error('获取平台信息失败:', error);
    platformInfo.value = 'web';
  }
  
  await fetchVersionHistory();
});

// 获取版本历史
const fetchVersionHistory = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/updates/history`, {
      params: { platform: platformInfo.value || 'web' }
    });
    
    if (response.data && response.data.success) {
      versionHistory.value = response.data.versions;
    } else {
      error.value = '获取版本历史失败';
    }
  } catch (err) {
    console.error('获取版本历史错误:', err);
    error.value = err.message || '网络错误';
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<style scoped>
.version-history {
  padding: 0 0 60px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-header {
  position: sticky;
  top: 0;
  background-color: #fff;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.back-button {
  margin-right: 16px;
  font-size: 20px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: #e0e0e0;
  transform: translateX(-3px);
}

h1 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.content {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.version-card {
  border-radius: 8px;
  overflow: hidden;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.version-number {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version {
  font-size: 18px;
  font-weight: bold;
}

.release-date {
  color: #666;
  font-size: 14px;
}

.release-notes {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;
  color: #333;
}

.app-info {
  margin-top: 40px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.app-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.loading-card {
  padding: 20px;
}

.error-message {
  text-align: center;
  padding: 40px 0;
}
</style> 