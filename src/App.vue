<template>
  <div v-if="!isAppReady" class="loading-screen">
    <div class="loader"></div>
    <p>加载中...</p>
  </div>

  <!-- 状态栏安全区域占位 -->
  <div class="status-bar-placeholder"></div>

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
import { StatusBar, Style } from "@capacitor/status-bar";
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
  // 设置状态栏高度
  setupStatusBarHeight();
  
  // 检查是否在原生环境中运行
  try {
    await CapacitorApp.getInfo();
    isCapacitorEnabled.value = true;
    
    // 设置状态栏
    if (StatusBar) {
      // 设置状态栏为透明
      StatusBar.setBackgroundColor({ color: '#ffffff' });
      StatusBar.setStyle({ style: Style.Light });
      
      // 让状态栏覆盖WebView
      if (typeof StatusBar.setOverlaysWebView === 'function') {
        StatusBar.setOverlaysWebView({ overlay: true });
      }
    }
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

  // 设置安全区域
  setupSafeArea();
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

// 设置安全区域高度
const setupSafeArea = () => {
  // 检测是否支持CSS环境变量
  const supportsEnv = window.CSS && window.CSS.supports && window.CSS.supports('top: env(safe-area-inset-top)');
  
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    // 原生应用环境
    
    // 检测设备类型
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // 根据设备类型设置默认值
    const defaultSafeAreaTop = isIOS ? '44px' : '36px'; // iOS通常是44px，Android通常是24-36px
    const defaultSafeAreaBottom = isIOS ? '34px' : '0px'; // iOS X系列底部有34px的安全区
    
    // 设置顶部安全区域
    document.documentElement.style.setProperty('--safe-area-top', 
      supportsEnv ? 'env(safe-area-inset-top)' : defaultSafeAreaTop
    );
    
    // 设置底部安全区域
    document.documentElement.style.setProperty('--safe-area-bottom', 
      supportsEnv ? 'env(safe-area-inset-bottom)' : defaultSafeAreaBottom
    );
    
    // 设置左右安全区域（主要用于横屏模式）
    document.documentElement.style.setProperty('--safe-area-left', 
      supportsEnv ? 'env(safe-area-inset-left)' : '0px'
    );
    
    document.documentElement.style.setProperty('--safe-area-right', 
      supportsEnv ? 'env(safe-area-inset-right)' : '0px'
    );
    
    console.log(`已设置状态栏安全区域高度: ${isIOS ? 'iOS' : 'Android'} ${supportsEnv ? '(使用CSS环境变量)' : '(使用默认值)'}`);
  } else {
    // 网页环境
    document.documentElement.style.setProperty('--safe-area-top', '20px'); // 网页中使用固定值
    document.documentElement.style.setProperty('--safe-area-bottom', '0px');
    document.documentElement.style.setProperty('--safe-area-left', '0px');
    document.documentElement.style.setProperty('--safe-area-right', '0px');
    
    console.log('已为网页环境设置状态栏安全区域高度');
  }
  
  // 添加class以支持安全区域适配
  document.body.classList.add('has-safe-area');
};

// 添加状态栏高度CSS变量
const setupStatusBarHeight = () => {
  // 设置CSS变量以保持状态栏高度
  const setStatusBarHeight = () => {
    const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top') || '0px';
    document.documentElement.style.setProperty('--status-bar-height', safeAreaTop);
    
    // 使用env变量
    try {
      // 尝试获取安全区域高度
      const envSafeAreaTop = window.getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0px';
      if (envSafeAreaTop && envSafeAreaTop !== '0px') {
        document.documentElement.style.setProperty('--safe-area-top', envSafeAreaTop);
      } else {
        // 如果获取不到，设置一个默认值
        document.documentElement.style.setProperty('--safe-area-top', '20px');
      }
    } catch(e) {
      console.error('获取安全区域高度失败:', e);
      document.documentElement.style.setProperty('--safe-area-top', '20px');
    }
  };

  // 初始调用
  setStatusBarHeight();
  
  // 监听窗口大小变化
  window.addEventListener('resize', setStatusBarHeight);
};
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
  --safe-area-top: env(safe-area-inset-top, 20px);
}

body {
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "Hiragino Sans GB",
    "Microsoft YaHei", Arial, sans-serif;
  margin: 0;
  padding: 0;
  color: var(--text-color);
  background-color: var(--bg-color);
  transition: background-color 0.3s, color 0.3s;
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

.el-tabs__item.is-active {
  color: var(--primary-color) !important;
}

#app {
  width: 100%;
  height: auto;
  min-height: 100vh;
  overflow: auto;
  position: relative;
}

/* 重置一些基础样式 */
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-y: auto;
}

/* 移动端适配 */
@media screen and (min-width: 768px) {
  #app {
    max-width: 480px; /* 在大屏幕上限制宽度，模拟手机屏幕 */
    margin: 0 auto;
    height: auto;
    padding: 0;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #e0f7fa, #bbdefb);
  color: var(--text-color);
  padding-top: var(--safe-area-top);
}

.loader {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

* {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation; /* 禁用双击缩放 */
}

/* 如果需要在某些元素中启用文本选择，可以添加以下类 */
.allow-select {
  -webkit-user-select: text;
  user-select: text;
}

/* 对于输入框，需要允许选择文本 */
input,
textarea {
  -webkit-user-select: text;
  user-select: text;
}

/* 允许输入框和文本区域可选 */
input,
textarea {
  -webkit-user-select: auto;
  user-select: auto;
}

/* 移除按钮点击时的边框 */
button,
a {
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

/* 移除链接的默认样式 */
a {
  text-decoration: none;
  color: inherit;
}

/* Element Plus 组件样式调整 */
:root {
  --el-color-primary: var(--primary-color);
  --el-bg-color: var(--bg-color);
  --el-text-color-primary: var(--text-color);
  --el-border-color: var(--border-color);
  --el-fill-color-blank: var(--card-bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-fill-color-light: #f5f7fa;
  --el-text-color-regular: var(--text-color-light);
  --el-text-color-secondary: var(--text-color-lighter);
  --el-mask-color: rgba(0, 0, 0, 0.5);
}

/* 输入框全局样式 - 更高优先级 */
.el-form .el-input .el-input__wrapper,
.el-input .el-input__wrapper {
  background-color: white !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: none !important;
}

.el-form .el-input .el-input__wrapper:hover,
.el-input .el-input__wrapper:hover {
  border-color: var(--primary-color) !important;
}

.el-form .el-input .el-input__wrapper:focus-within,
.el-input .el-input__wrapper:focus-within {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 1px var(--primary-color) !important;
}

/* 输入框内文本颜色 */
.el-form .el-input .el-input__inner,
.el-input .el-input__inner,
.el-textarea .el-textarea__inner {
  color: #333333 !important;
  font-weight: 500 !important;
}

/* 全局表单样式增强 */
.el-form .el-form-item__label {
  color: #333333 !important;
  font-weight: 600 !important;
}

/* 网络状态提示样式 */
.network-status {
  position: fixed;
  top: var(--safe-area-top);
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

/* 添加全局CSS样式，为页面内容添加顶部安全区域 */
.page-content {
  padding-top: var(--safe-area-top);
}

.page-header {
  padding-top: var(--safe-area-top);
  height: calc(50px + var(--safe-area-top));
  display: flex;
  align-items: center;
  z-index: 100;
}

/* 为状态栏创建安全区域占位 */
.status-bar-placeholder {
  width: 100%;
  height: var(--safe-area-top, env(safe-area-inset-top, 0));
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  background-color: transparent;
  pointer-events: none;
}

/* 确保所有页面都有正确的顶部内边距 */
:deep(body) {
  padding-top: var(--safe-area-top, env(safe-area-inset-top, 0));
}

:deep(.safe-area-top) {
  padding-top: var(--safe-area-top, env(safe-area-inset-top, 0));
}

/* 暗色模式下状态栏的样式 */
[data-theme='dark'] .status-bar-placeholder {
  background-color: rgba(25, 25, 25, 0.85);
  border-bottom-color: rgba(255, 255, 255, 0.05);
}
</style>
