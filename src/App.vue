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

    // 检查是否有保存的登录状态
    if (authStore.checkSavedLogin()) {
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

<template>
  <div v-if="!isAppReady" class="loading-screen">
    <div class="loader"></div>
    <p>加载中...</p>
  </div>

  <el-config-provider v-if="isAppReady" :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<style>
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 重置一些基础样式 */
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
}

/* 移动端适配 */
@media screen and (min-width: 768px) {
  #app {
    max-width: 480px; /* 在大屏幕上限制宽度，模拟手机屏幕 */
    margin: 0 auto;
    height: 100vh;
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
  position: fixed; /* 防止页面弹性滚动 */
  width: 100%;
  height: 100%;
}
</style>
