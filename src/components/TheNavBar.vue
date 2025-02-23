<template>
  <div class="navbar">
    <div class="left">
      <h1>时光小镇</h1>
    </div>
    <div class="right">
      <NotificationBadge v-if="showNotification" />
      <el-dropdown trigger="click" @command="handleCommand">
        <el-avatar :size="32" :src="userAvatar" @error="() => true">
          {{ userInitials }}
        </el-avatar>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人主页</el-dropdown-item>
            <el-dropdown-item command="settings">设置</el-dropdown-item>
            <el-dropdown-item command="feedback">反馈</el-dropdown-item>
            <el-dropdown-item command="about">关于</el-dropdown-item>
            <el-dropdown-item divided command="logout" type="danger">
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import NotificationBadge from "./NotificationBadge.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 只在社区相关页面显示通知图标
const showNotification = computed(() => {
  // 需要显示通知的页面路径
  const notificationPages = [
    "/community",
    "/user",
    "/my-posts",
    "/my-likes",
    "/profile",
    "/followers",
    "/following",
  ];

  // 检查当前路径是否匹配任一需要显示通知的页面
  return notificationPages.some((path) => route.path.startsWith(path));
});

const userAvatar = computed(() => {
  return authStore.user?.avatar || "";
});

const userInitials = computed(() => {
  return authStore.user?.username?.charAt(0).toUpperCase() || "?";
});

const handleCommand = async (command) => {
  switch (command) {
    case "profile":
      router.push("/profile");
      break;
    case "settings":
      router.push("/settings");
      break;
    case "feedback":
      router.push("/feedback");
      break;
    case "about":
      // ... 显示关于对话框
      break;
    case "logout":
      await authStore.logout();
      break;
  }
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.left h1 {
  margin: 0;
  font-size: 20px;
  color: var(--el-color-primary);
}

.right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.el-avatar {
  cursor: pointer;
}
</style>
