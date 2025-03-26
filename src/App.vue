<template>
  <div v-if="!isAppReady" class="loading-screen">
    <div class="loader"></div>
    <p>加载中...</p>
  </div>

  <!-- 网络连接提示 -->
  <div v-if="showOfflineAlert" class="network-status offline">
    <i class="el-icon-warning"></i> 网络连接已断开，请检查您的网络设置
  </div>
  <div v-if="showOnlineAlert" class="network-status online">
    <i class="el-icon-success"></i> 网络已恢复
  </div>

  <el-config-provider v-if="isAppReady" :locale="zhCn">
    <router-view />
    <UpdateChecker />
  </el-config-provider>

  <!-- 未准备好时也显示路由视图 -->
  <router-view v-if="!isAppReady" />
</template>

<script setup>
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { useAuthStore } from "./stores/auth";
import { onMounted, ref, watch, onUnmounted, nextTick } from "vue";
import { App as CapacitorApp } from "@capacitor/app";
import UpdateChecker from "./components/UpdateChecker.vue";
import { useUpdateStore } from "./stores/updateStore";
import { APP_VERSION } from "./config";

const authStore = useAuthStore();
const updateStore = useUpdateStore();
const isCapacitorEnabled = ref(false);
const isAppReady = ref(false);

// 网络状态相关
const isOnline = ref(navigator.onLine);
const showOfflineAlert = ref(false);
const showOnlineAlert = ref(false);
let onlineAlertTimer = null;
let offlineAlertTimer = null;

// 处理在线状态变化
const handleOnline = () => {
  isOnline.value = true;
  showOfflineAlert.value = false;
  showOnlineAlert.value = true;
  
  // 5秒后自动隐藏在线提示
  clearTimeout(onlineAlertTimer);
  onlineAlertTimer = setTimeout(() => {
    showOnlineAlert.value = false;
  }, 5000);
};

// 处理离线状态变化
const handleOffline = () => {
  isOnline.value = false;
  showOnlineAlert.value = false;
  showOfflineAlert.value = true;
  
  // 离线提示一直显示，直到恢复连接
  clearTimeout(offlineAlertTimer);
};

onMounted(async () => {
  // 检查是否在原生环境中运行
  try {
    await CapacitorApp.getInfo();
    isCapacitorEnabled.value = true;
  } catch (error) {
    console.log("Not running in a native environment", error);
    isCapacitorEnabled.value = false;
  }

  // 加载用户信息
  try {
    await authStore.initializeAuth();
  } catch (error) {
    console.error("Failed to initialize auth:", error);
  }

  // 检查更新
  try {
    await updateStore.checkForUpdates(APP_VERSION.VERSION);
  } catch (error) {
    console.error("Failed to check for updates:", error);
  }

  isAppReady.value = true;

  // 监听网络状态变化
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // 添加调试模式切换快捷键
  window.addEventListener('keydown', (e) => {
    // 在非输入框中按下Ctrl+Shift+D切换调试器
    if (e.ctrlKey && e.shiftKey && e.key === 'D' && 
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      showDebugger.value = !showDebugger.value;
    }
  });
});

onUnmounted(() => {
  // 清除网络状态监听
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  
  // 清除定时器
  clearTimeout(onlineAlertTimer);
  clearTimeout(offlineAlertTimer);
});

// 监听主题变化
watch(
  () => authStore.theme,
  (newTheme) => {
    authStore.applyTheme(newTheme);
  }
);
</script>

<style>
:root {
  /* 阳光清新风格的基础色彩 */
  --primary-color: #4A90E2; /* 清新蓝色 */
  --accent-color: #56CCF2;  /* 阳光黄色 */
  --success-color: #4CD964; /* 生机绿色 */
  --warning-color: #F5A623; /* 活力橙色 */
  --danger-color: #FF3B30;  /* 温暖红色 */
  
  /* 明亮的背景和文本颜色 */
  --text-color: #333333;
  --text-color-light: #8C8C8C;
  --text-color-lighter: #999999;
  --bg-color: #F9F9F9;
  --card-bg: #FFFFFF;
  --border-color: #E0E0E0;
  --header-bg: #FFFFFF;
  --shadow-color: rgba(0, 0, 0, 0.05);
  --placeholder-color: #BBBBBB;
  --timeline-bg: #F5F7FA;
  --background-color: #F9F9F9;
  --card-background: #FFFFFF;
  --card-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  --header-height: 60px;
}

/* 网络状态提示样式 */
.network-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px;
  text-align: center;
  z-index: 1000;
  font-size: 14px;
  transition: all 0.3s ease;
}

.network-status.offline {
  background-color: rgba(244, 67, 54, 0.9);
  color: white;
}

.network-status.online {
  background-color: rgba(76, 175, 80, 0.9);
  color: white;
  animation: fadeOut 5s forwards;
}

@keyframes fadeOut {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

/* 全局页面头部样式 */
.page-header {
  height: 50px;
  display: flex;
  align-items: center;
  z-index: 100;
}
</style>
