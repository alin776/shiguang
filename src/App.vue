<template>
  <div v-if="!isAppReady" class="loading-screen">
    <div class="loader"></div>
    <p>加载中...</p>
  </div>

  <el-config-provider v-if="isAppReady" :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { useAuthStore } from "./stores/auth";
import { onMounted, ref, watch } from "vue";
import { App as CapacitorApp } from "@capacitor/app";

const authStore = useAuthStore();
const isCapacitorEnabled = ref(false);
const isAppReady = ref(false);

onMounted(async () => {
  // 检查是否在 Capacitor 环境中
  if (import.meta.env.PROD && CapacitorApp) {
    isCapacitorEnabled.value = true;
    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });
  }

  try {
    // 初始化主题
    authStore.initializeTheme();

    // 检查 token 是否有效
    if (authStore.token && !authStore.isTokenValid()) {
      console.log('App 挂载时检测到 Token 已过期，执行登出操作');
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
  --primary-color: #409eff;
  --text-color: #333;
  --bg-color: #fff;
  --card-bg: #fff;
  --border-color: #e4e7ed;
  --header-bg: #fff;
  --shadow-color: rgba(0, 0, 0, 0.1);
  --placeholder-color: #909399;
  --timeline-bg: #f5f7fa;
}

:root.dark {
  --primary-color: #409eff;
  --text-color: #e5e7eb;
  --bg-color: #1a1a1a;
  --card-bg: #252525;
  --border-color: #4a4a4a;
  --header-bg: #252525;
  --shadow-color: rgba(0, 0, 0, 0.5);
  --placeholder-color: #aaa;
  --timeline-bg: #252525;
}

body {
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "Hiragino Sans GB",
    "Microsoft YaHei", Arial, sans-serif;
  margin: 0;
  padding: 0;
  color: var(--text-color);
  background-color: var(--bg-color);
  transition: background-color 0.3s, color 0.3s;
}

/* 深色模式下的ElementPlus组件样式调整 */
.dark {
  --el-color-primary: var(--primary-color);
  --el-bg-color: var(--bg-color);
  --el-text-color-primary: var(--text-color);
  --el-border-color: var(--border-color);
  --el-fill-color-blank: var(--card-bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-fill-color-light: #363636;
  --el-text-color-regular: #d1d5db;
  --el-text-color-secondary: #9ca3af;
  --el-mask-color: rgba(0, 0, 0, 0.8);
}

.el-tabs__item.is-active {
  color: var(--primary-color) !important;
}

.dark .el-card,
.dark .el-dialog,
.dark .el-menu,
.dark .el-dropdown-menu,
.dark .el-message-box,
.dark .el-drawer {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-color: var(--border-color);
}

.dark .el-drawer__header,
.dark .el-dialog__header,
.dark .el-message-box__header {
  color: var(--text-color);
}

.dark .el-button--default {
  background-color: #333;
  border-color: #555;
  color: #eee;
}

.dark .el-input__inner,
.dark .el-textarea__inner {
  background-color: #333;
  border-color: #555;
  color: #eee;
}

.dark .el-empty__description {
  color: var(--text-color);
}

.dark .el-tabs__nav-wrap::after {
  background-color: var(--border-color);
}

#app {
  width: 100%;
  height: auto; /* 改为自动高度，允许内容撑开并滚动 */
  min-height: 100vh; /* 最小高度100vh */
  overflow: visible; /* 改为visible */
}

/* 重置一些基础样式 */
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
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
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
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
body {
  overscroll-behavior: none; /* 防止页面反弹 */
  -webkit-overflow-scrolling: touch; /* iOS 滚动优化 */
  /* 移除position: fixed，允许滚动 */
  width: 100%;
  height: 100%;
  overflow: auto; /* 明确设置为auto */
}
</style>
