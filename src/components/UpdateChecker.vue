<template>
  <div v-if="updateStore.updateAvailable" class="update-container">
    <div class="update-dialog">
      <div class="update-header">
        <div class="update-title">发现新版本</div>
        <div class="update-close" @click="closeDialog">×</div>
      </div>
      <div class="update-content">
        <div class="version-info">
          <div>当前版本: {{ updateStore.currentVersion }}</div>
          <div>最新版本: {{ updateStore.latestVersion }}</div>
        </div>
        <div class="update-description">
          <div class="update-subtitle">更新内容:</div>
          <div class="update-notes">{{ updateStore.updateInfo?.releaseNotes || '提升了应用性能和用户体验' }}</div>
        </div>
      </div>
      <div class="update-footer">
        <button class="update-later" @click="closeDialog">稍后更新</button>
        <button 
          class="update-now" 
          @click="downloadUpdate" 
          :disabled="updateStore.isDownloading">
          {{ updateStore.isDownloading ? '正在下载...' : '立即更新' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useUpdateStore } from '../stores/updateStore';
import { ElNotification } from 'element-plus';

const updateStore = useUpdateStore();

// 组件挂载时检查更新
onMounted(async () => {
  await checkUpdate();
});

// 检查更新
const checkUpdate = async () => {
  try {
    // 首次启动时延迟检查更新，不影响应用启动速度
    setTimeout(async () => {
      try {
        const hasUpdate = await updateStore.checkForUpdates();
        if (hasUpdate) {
          console.log('发现新版本:', updateStore.latestVersion);
        }
      } catch (error) {
        // 不向用户显示更新检查失败的错误，只在控制台记录
        console.error('自动检查更新出错，这不会影响应用正常使用:', error);
      }
    }, 3000);
  } catch (error) {
    console.error('检查更新延迟加载失败:', error);
  }
};

// 下载更新
const downloadUpdate = async () => {
  try {
    await updateStore.downloadUpdate();
    ElNotification({
      title: '更新提示',
      message: '更新已开始下载，请按照提示完成安装',
      type: 'success',
      duration: 5000
    });
    closeDialog();
  } catch (error) {
    ElNotification({
      title: '更新失败',
      message: error.message || '下载更新失败，请稍后重试',
      type: 'error',
      duration: 5000
    });
  }
};

// 关闭对话框
const closeDialog = () => {
  updateStore.updateAvailable = false;
};
</script>

<style scoped>
.update-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.update-dialog {
  width: 80%;
  max-width: 400px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.update-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.update-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.update-close {
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.update-content {
  padding: 16px;
}

.version-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.update-description {
  margin-bottom: 16px;
}

.update-subtitle {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.update-notes {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  white-space: pre-line;
}

.update-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #eee;
}

.update-later, .update-now {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.update-later {
  background-color: #f5f5f5;
  color: #666;
}

.update-now {
  background-color: #409EFF;
  color: white;
}

.update-now:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style> 