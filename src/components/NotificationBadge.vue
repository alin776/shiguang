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
    class="cosmic-drawer"
  >
    <template #header>
      <div class="drawer-header tech-header">
        <span class="drawer-title cosmic-text">通知</span>
        <el-button
          v-if="notifications.length"
          class="mark-read-btn glow-button"
          link
          @click="markAllAsRead"
        >
          全部标记为已读
        </el-button>
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
import { ref, onMounted, defineEmits } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Bell } from "@element-plus/icons-vue";
import { useNotificationStore } from "../stores/notification";
import dayjs from "dayjs";

const emit = defineEmits(['show-notification']);
const router = useRouter();
const notificationStore = useNotificationStore();
const drawerVisible = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);

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
  color: white;
  filter: drop-shadow(0 0 4px rgba(147, 51, 234, 0.7));
  transition: all 0.3s ease;
}

.notification-icon:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 0 8px rgba(147, 51, 234, 0.9));
}

/* 抽屉样式 */
:deep(.el-drawer) {
  background: rgba(18, 18, 30, 0.95);
  border-left: 1px solid rgba(147, 51, 234, 0.3);
  box-shadow: -8px 0 20px rgba(0, 0, 0, 0.5);
  z-index: 9999 !important;
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px;
  color: white;
  border-bottom: 1px solid rgba(147, 51, 234, 0.3);
}

:deep(.el-overlay) {
  z-index: 9998 !important;
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
  font-size: 20px;
  font-weight: 600;
}

.cosmic-text {
  background: linear-gradient(45deg, #38bdf8, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.4);
}

.mark-read-btn {
  font-size: 14px;
  color: rgba(147, 51, 234, 0.9) !important;
  text-shadow: 0 0 4px rgba(147, 51, 234, 0.4);
  transition: all 0.3s ease;
}

.mark-read-btn:hover {
  color: rgba(147, 51, 234, 1) !important;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
  transform: translateY(-1px);
}

.notification-list {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 12px;
  background: rgba(30, 30, 40, 0.6);
  border: 1px solid rgba(147, 51, 234, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-color: rgba(147, 51, 234, 0.4);
}

.notification-item.unread {
  background: rgba(147, 51, 234, 0.15);
  position: relative;
}

.notification-item.unread::before {
  content: "";
  position: absolute;
  top: 16px;
  left: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(45deg, #38bdf8, #9333ea);
  box-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

.actor-avatar {
  border: 2px solid rgba(147, 51, 234, 0.3);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.notification-content {
  flex: 1;
  text-align: left;
}

.notification-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
  text-align: left;
}

.actor {
  color: rgba(147, 51, 234, 0.9);
  font-weight: 500;
  margin-right: 4px;
  text-align: left;
}

.cosmic-name {
  background: linear-gradient(45deg, #38bdf8, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 4px rgba(147, 51, 234, 0.4);
  text-align: left;
}

.notification-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: left;
}

.empty-state {
  padding: 40px 20px;
  background: rgba(30, 30, 40, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(147, 51, 234, 0.2);
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
  color: rgba(255, 255, 255, 0.7);
}

:deep(.el-empty__image) {
  opacity: 0.7;
}
</style>
