<template>
  <div class="notification-badge" @click="showNotifications">
    <el-badge :value="unreadCount" :hidden="!unreadCount">
      <el-icon :size="24"><Bell /></el-icon>
    </el-badge>
  </div>

  <el-drawer
    v-model="drawerVisible"
    title="通知"
    direction="rtl"
    size="90%"
    :before-close="handleClose"
  >
    <template #header>
      <div class="drawer-header">
        <span>通知</span>
        <el-button
          v-if="notifications.length"
          type="primary"
          link
          @click="markAllAsRead"
        >
          全部标记为已读
        </el-button>
      </div>
    </template>

    <div class="notification-list">
      <template v-if="notifications.length">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.is_read }"
          @click="handleNotificationClick(notification)"
        >
          <el-avatar
            :size="40"
            :src="notification.actor?.avatar"
            @error="() => true"
          >
            {{ notification.actor?.username?.charAt(0).toUpperCase() || "?" }}
          </el-avatar>
          <div class="notification-content">
            <div class="notification-text">
              <span class="actor">{{ notification.actor?.username }}</span>
              {{ notification.content }}
            </div>
            <div class="notification-time">
              {{ formatTime(notification.created_at) }}
            </div>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无通知" />
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Bell } from "@element-plus/icons-vue";
import { useNotificationStore } from "../stores/notification";
import dayjs from "dayjs";

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
    router.push(
      `/community/post/${notification.source_id}#comment-${notification.source_id}`
    );
  }
  drawerVisible.value = false;
};

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notification-badge {
  cursor: pointer;
  padding: 8px;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notification-list {
  padding: 0 16px;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notification-content {
  flex: 1;
}

.notification-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.actor {
  color: var(--el-color-primary);
  font-weight: 500;
  margin-right: 4px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}
</style>
