<template>
  <div v-if="!isAppReady" class="loading-screen">
    <div class="loader"></div>
    <p>加载中...</p>
  </div>

  <el-config-provider v-if="isAppReady" :locale="zhCn">
    <router-view />
    <UpdateChecker />
  </el-config-provider>
</template>

<script setup>
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { useAuthStore } from "./stores/auth";
import { onMounted, ref, watch } from "vue";
import { App as CapacitorApp } from "@capacitor/app";
import UpdateChecker from "./components/UpdateChecker.vue";
import { useUpdateStore } from "./stores/updateStore";
import { APP_VERSION } from "./config";

const authStore = useAuthStore();
const updateStore = useUpdateStore();
const isCapacitorEnabled = ref(false);
const isAppReady = ref(false);

onMounted(async () => {
  // 检查是否在 Capacitor 环境中
  if (import.meta.env.PROD && CapacitorApp) {
    try {
      // 检查是否在原生平台
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        isCapacitorEnabled.value = true;
        
        // 获取应用信息并设置当前版本
        try {
          const appInfo = await CapacitorApp.getInfo();
          updateStore.setCurrentVersion(appInfo.version || APP_VERSION.VERSION);
        } catch (error) {
          console.error('获取应用信息失败:', error);
          updateStore.setCurrentVersion(APP_VERSION.VERSION);
        }
        
        CapacitorApp.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            CapacitorApp.exitApp();
          }
        });
      } else {
        // Web环境，使用配置文件中的版本
        console.log('Web环境，使用配置版本:', APP_VERSION.VERSION);
        updateStore.setCurrentVersion(APP_VERSION.VERSION);
      }
    } catch (error) {
      console.error('Capacitor初始化错误:', error);
      updateStore.setCurrentVersion(APP_VERSION.VERSION);
    }
  } else {
    // 开发环境或非Capacitor环境
    console.log('开发环境或非Capacitor环境，使用配置版本:', APP_VERSION.VERSION);
    updateStore.setCurrentVersion(APP_VERSION.VERSION);
  }

  try {
    // 初始化主题
    authStore.initializeTheme();

    // 检查 token 是否有效
    if (authStore.token && !authStore.isTokenValid()) {
      console.log("App 挂载时检测到 Token 已过期，执行登出操作");
      authStore.logout();
    }
    // 检查是否有保存的登录状态
    else if (authStore.checkSavedLogin()) {
      await authStore.fetchUserInfo();
    }
  } catch (error) {
    console.error("初始化错误:", error);
  } finally {
    isAppReady.value = true;
  }
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
</style>
