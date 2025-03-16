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

:root.dark {
  /* 深色模式下保持相似色调但调整亮度 */
  --primary-color: #5A9CEA;
  --accent-color: #FFB340;
  --success-color: #5CDF74;
  --warning-color: #FFA020;
  --danger-color: #FF5147;
  
  --text-color: #E5E7EB;
  --text-color-light: #B0B0B0;
  --text-color-lighter: #888888;
  --bg-color: #1A1A1A;
  --card-bg: #252525;
  --border-color: #3D3D3D;
  --header-bg: #252525;
  --shadow-color: rgba(0, 0, 0, 0.2);
  --placeholder-color: #777777;
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
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
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

/* 覆盖深色模式的输入框样式 */
.dark .el-input__inner,
.dark .el-textarea__inner,
[data-theme='dark'] .el-input__inner,
[data-theme='dark'] .el-textarea__inner {
  background-color: white !important;
  border-color: var(--border-color) !important;
  color: #333333 !important;
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

@media (prefers-color-scheme: dark) {
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

  .dark .el-tabs__item.is-active {
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
}
</style>
