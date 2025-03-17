<template>
  <div class="notification-badge" @click="showNotifications">
    <el-badge :value="unreadCount" :hidden="!unreadCount">
      <el-icon :size="24" class="notification-icon"><Bell /></el-icon>
    </el-badge>
  </div>

  <el-drawer
    v-model="drawerVisible"
    direction="rtl"
    size="90%"
    :before-close="handleClose"
    :z-index="9999"
    append-to-body
    :teleported="true"
    destroy-on-close
    class="cosmic-drawer light-mode-drawer"
    custom-class="light-mode-custom"
    style="--el-drawer-bg-color: #ffffff; background-color: #ffffff;"
  >
    <template #header>
      <div class="drawer-header tech-header">
        <span class="drawer-title cosmic-text">通知</span>
        <div class="header-buttons">
          <el-button
            v-if="notifications.length"
            class="mark-read-btn glow-button"
            link
            @click="markAllAsRead"
          >
            全部标记为已读
          </el-button>
          <el-button 
            class="custom-close-btn" 
            circle 
            @click="handleClose"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <div class="notification-list tech-container">
      <template v-if="notifications.length">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.is_read, 'tech-card': true }"
          @click="handleNotificationClick(notification)"
        >
          <el-avatar
            :size="40"
            :src="notification.actor?.avatar"
            @error="handleAvatarError"
            class="actor-avatar"
          >
            {{ notification.actor?.username?.charAt(0).toUpperCase() || "?" }}
          </el-avatar>
          <div class="notification-content">
            <div class="notification-text">
              <span class="actor cosmic-name">{{
                notification.actor?.username
              }}</span>
              {{ notification.content }}
            </div>
            <div class="notification-time">
              {{ formatTime(notification.created_at) }}
            </div>
          </div>
        </div>
      </template>
      <div v-else class="empty-state tech-card">
        <el-empty description="暂无通知" />
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, defineEmits, onBeforeMount } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Bell, Close } from "@element-plus/icons-vue";
import { useNotificationStore } from "../stores/notification";
import dayjs from "dayjs";

const emit = defineEmits(['show-notification']);
const router = useRouter();
const notificationStore = useNotificationStore();
const drawerVisible = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);

// 在组件挂载前修改CSS变量
onBeforeMount(() => {
  // 添加全局样式来覆盖Element Plus的抽屉变量
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    :root {
      --el-drawer-bg-color: #f5f0e1 !important;
      --el-bg-color: #f5f0e1 !important;
      --el-bg-color-overlay: #f5f0e1 !important;
    }
    .el-drawer {
      background-color: #f5f0e1 !important;
    }
    .el-drawer__body {
      background-color: #f5f0e1 !important;
    }
    .el-drawer__content {
      background-color: #f5f0e1 !important;
    }
  `;
  document.head.appendChild(styleElement);
});

const formatTime = (time) => {
  return dayjs(time).format("YYYY-MM-DD HH:mm");
};

const loadNotifications = async () => {
  try {
    const response = await notificationStore.getNotifications();
    notifications.value = response.notifications;
    unreadCount.value = response.unreadCount;
  } catch (error) {
    ElMessage.error("获取通知失败");
  }
};

const showNotifications = () => {
  drawerVisible.value = true;
  loadNotifications();
  emit('show-notification');
};

const handleClose = () => {
  drawerVisible.value = false;
};

const markAllAsRead = async () => {
  try {
    const response = await notificationStore.markAllAsRead();
    unreadCount.value = response.unreadCount;
    await loadNotifications();
    ElMessage.success("已全部标记为已读");
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

const handleNotificationClick = async (notification) => {
  // 标记为已读
  if (!notification.is_read) {
    try {
      const response = await notificationStore.markAsRead([notification.id]);
      notification.is_read = true;
      // 使用后端返回的未读数量更新
      unreadCount.value = response.unreadCount;
    } catch (error) {
      console.error("标记已读失败:", error);
    }
  }

  // 根据通知类型跳转到相应页面
  if (notification.source_type === "post") {
    router.push(`/community/post/${notification.source_id}`);
  } else if (notification.source_type === "comment") {
    // 跳转到评论所在的帖子
    router.push(`/community/post/${notification.source_id}#comment-${notification.source_id}`);
  }
  drawerVisible.value = false;
};

const handleAvatarError = (e) => {
  console.error("用户头像加载失败:", e);
};

onMounted(() => {
  loadNotifications();
});

defineExpose({
  markAllAsRead,
  loadNotifications
});
</script>

<style scoped>
.notification-badge {
  cursor: pointer;
  padding: 8px;
  position: relative;
  z-index: 25;
}

.notification-icon {
  color: #2c3e50;
  filter: drop-shadow(0 0 4px rgba(147, 51, 234, 0.3));
  transition: all 0.3s ease;
}

.notification-icon:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 0 8px rgba(147, 51, 234, 0.5));
}

/* 抽屉样式 - 更强的选择器以确保优先级 */
:deep(.cosmic-drawer.light-mode-drawer),
:deep(.el-drawer),
:deep(.el-drawer.light-mode-custom) {
  background-color: #f5f0e1 !important;
  border-left: 1px solid rgba(210, 180, 140, 0.3);
  box-shadow: -8px 0 20px rgba(150, 120, 90, 0.15);
  z-index: 9999 !important;
}

:deep(.el-drawer__body) {
  background-color: #f5f0e1 !important;
  padding: 0;
}

/* 隐藏原始关闭按钮 - 使用更多选择器组合 */
:deep(.el-drawer__close) button,
:deep(.el-drawer__close-btn),
:deep(.el-drawer__close),
:deep(.el-icon-close),
:deep(.el-drawer__header button),
:deep(.el-drawer__header) .el-drawer__close,
:deep([class*="close-btn"]),
:deep(.el-drawer__headerbtn),
:deep(.el-drawer .el-dialog__close) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  position: absolute !important;
  z-index: -9999 !important;
}

/* 抽屉标题样式 */
:deep(.el-drawer__header) {
  padding: 16px;
  margin-bottom: 0;
  color: #5d4037;
  background-color: #f5f0e1 !important;
  border-bottom: 1px solid rgba(210, 180, 140, 0.5);
  /* 禁用原始标题容器的flex模式，确保完全由我们自己的标题栏控制 */
  display: block !important;
}

/* 注入样式到全局，确保隐藏各种可能的关闭按钮 */
:global(.el-drawer__headerbtn),
:global(.el-drawer button.el-drawer__close),
:global(.el-drawer .el-drawer__close) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

/* 确保我们的关闭按钮样式更明确 */
.header-buttons .custom-close-btn {
  width: 36px !important;
  height: 36px !important;
  margin-left: 12px;
  font-size: 20px;
  font-weight: bold;
  background-color: #ffffff !important;
  color: #000000 !important;
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.3s ease;
  padding: 0 !important;
  z-index: 10000 !important;
}

.header-buttons .custom-close-btn:hover {
  background-color: #f8f8f8 !important;
  color: #e74c3c !important;
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.header-buttons {
  display: flex;
  align-items: center;
}

:deep(.el-drawer__content) {
  background-color: #f5f0e1 !important;
}

:deep(.el-overlay) {
  z-index: 9998 !important;
}

/* 全局样式覆盖 */
:global(.el-drawer) {
  background-color: #f5f0e1 !important;
}

:global(.el-drawer__content) {
  background-color: #f5f0e1 !important;
}

:global(.light-mode-custom) {
  background-color: #f5f0e1 !important;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.tech-header {
  padding: 0;
}

.drawer-title {
  font-size: 22px;
  font-weight: 600;
  color: #5d4037;
}

.cosmic-text {
  color: #5d4037;
  text-shadow: none;
}

.mark-read-btn {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff !important;
  background-color: #2c3e50;
  padding: 4px 12px;
  border-radius: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.mark-read-btn:hover {
  color: #ffffff !important;
  background-color: #34495e;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.notification-list {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background-color: #f5f0e1;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 16px;
  background: #f9f3e3;
  border: 1px solid rgba(210, 180, 140, 0.2);
  box-shadow: 0 4px 15px rgba(150, 120, 90, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(150, 120, 90, 0.15);
  background: #f7f2dd;
}

.notification-item.unread {
  background: #f0e6d2;
  position: relative;
  border-left: 3px solid #8d6e63;
}

.notification-item.unread::before {
  content: none;
}

.actor-avatar {
  border: 1px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  width: 36px !important;
  height: 36px !important;
}

.notification-content {
  flex: 1;
  text-align: left;
}

.notification-text {
  font-size: 16px;
  line-height: 1.6;
  color: #5d4037;
  font-weight: 500;
  margin-bottom: 6px;
  text-align: left;
  white-space: pre-line;
}

.actor {
  color: #5d4037;
  font-weight: 600;
  margin-right: 4px;
  text-align: left;
}

.cosmic-name {
  color: #5d4037;
  font-weight: 600;
  background: none;
  -webkit-background-clip: unset;
  background-clip: unset;
  text-shadow: none;
}

.notification-time {
  font-size: 14px;
  color: #7f8c8d;
  text-align: left;
}

.empty-state {
  padding: 40px 20px;
  background: #f9f3e3;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(150, 120, 90, 0.1);
  border: 1px solid rgba(210, 180, 140, 0.2);
  text-align: center;
}

.tech-card {
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.tech-container {
  background: transparent;
}

/* Element Plus Empty组件样式覆盖 */
:deep(.el-empty__description) {
  color: #8d6e63;
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-empty__image) {
  opacity: 0.8;
}
</style>
