<template>
  <div class="page-container">
    <div class="notifications-page">
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <!-- 添加状态栏安全区域占位 -->
        <div class="safe-area-top"></div>
        
        <div class="header-title">
          <h2>通知</h2>
        </div>
        
        <div class="action-buttons">
          <el-button
            v-if="notifications.length"
            type="primary"
            size="small"
            @click="markAllAsRead"
            :loading="loading"
          >
            全部已读
          </el-button>
        </div>
      </div>

      <!-- 分类标签页 -->
      <div class="tabs-container">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="全部" name="all">
            <!-- 全部通知内容 -->
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
                    class="actor-avatar"
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
              <div v-else class="empty-state">
                <el-empty description="暂无通知" />
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="点赞" name="like">
            <!-- 点赞通知内容 -->
            <div class="notification-list">
              <template v-if="likeNotifications.length">
                <div
                  v-for="notification in likeNotifications"
                  :key="notification.id"
                  class="notification-item"
                  :class="{ unread: !notification.is_read }"
                  @click="handleNotificationClick(notification)"
                >
                  <el-avatar
                    :size="40"
                    :src="notification.actor?.avatar"
                    class="actor-avatar"
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
              <div v-else class="empty-state">
                <el-empty description="暂无点赞通知" />
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="评论" name="comment">
            <!-- 评论通知内容 -->
            <div class="notification-list">
              <template v-if="commentNotifications.length">
                <div
                  v-for="notification in commentNotifications"
                  :key="notification.id"
                  class="notification-item"
                  :class="{ unread: !notification.is_read }"
                  @click="handleNotificationClick(notification)"
                >
                  <el-avatar
                    :size="40"
                    :src="notification.actor?.avatar"
                    class="actor-avatar"
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
              <div v-else class="empty-state">
                <el-empty description="暂无评论通知" />
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="系统" name="system">
            <!-- 系统通知内容 -->
            <div class="notification-list">
              <template v-if="systemNotifications.length">
                <div
                  v-for="notification in systemNotifications"
                  :key="notification.id"
                  class="notification-item"
                  :class="{ unread: !notification.is_read, 'system-notification': true }"
                  @click="handleNotificationClick(notification)"
                >
                  <el-avatar
                    :size="40"
                    :src="'/icons/system-notification.svg'"
                    class="actor-avatar system-avatar"
                  >
                    系统
                  </el-avatar>
                  <div class="notification-content">
                    <div class="notification-text">
                      <span class="actor system-actor">系统通知</span>
                      {{ notification.content }}
                    </div>
                    <div class="notification-time">
                      {{ formatTime(notification.created_at) }}
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="empty-state">
                <el-empty description="暂无系统通知" />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import { useCommunityStore } from "@/stores/community";
import BottomNavBar from "@/components/BottomNavBar.vue";
import dayjs from "dayjs";

const router = useRouter();
const notificationStore = useNotificationStore();
const communityStore = useCommunityStore();

const notifications = ref([]);
const likeNotifications = ref([]);
const commentNotifications = ref([]);
const systemNotifications = ref([]);
const unreadCount = ref(0);
const loading = ref(false);
const activeTab = ref("all");

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format("YYYY-MM-DD HH:mm");
};

// 加载通知
const loadNotifications = async () => {
  try {
    loading.value = true;
    const response = await notificationStore.getNotifications();
    notifications.value = response.notifications;
    unreadCount.value = response.unreadCount;
  } catch (error) {
    console.error("获取通知失败:", error);
    ElMessage.error("获取通知失败");
  } finally {
    loading.value = false;
  }
};

// 根据类型加载通知
const loadNotificationsByType = async (type) => {
  try {
    loading.value = true;
    const response = await notificationStore.getNotificationsByType(type);
    
    switch (type) {
      case 'like':
        likeNotifications.value = response.notifications;
        break;
      case 'comment':
        commentNotifications.value = response.notifications;
        break;
      case 'system':
        systemNotifications.value = response.notifications;
        break;
    }
  } catch (error) {
    console.error(`获取${type}类型通知失败:`, error);
    ElMessage.error(`获取${type}类型通知失败`);
  } finally {
    loading.value = false;
  }
};

// 标记所有通知为已读
const markAllAsRead = async () => {
  try {
    loading.value = true;
    
    let response;
    if (activeTab.value === 'all') {
      response = await notificationStore.markAllAsRead();
      // 更新所有分类中的已读状态
      notifications.value.forEach(notification => {
        notification.is_read = true;
      });
      likeNotifications.value.forEach(notification => {
        notification.is_read = true;
      });
      commentNotifications.value.forEach(notification => {
        notification.is_read = true;
      });
      systemNotifications.value.forEach(notification => {
        notification.is_read = true;
      });
    } else {
      response = await notificationStore.markAllAsReadByType(activeTab.value);
      // 只更新当前分类的已读状态
      switch (activeTab.value) {
        case 'like':
          likeNotifications.value.forEach(notification => {
            notification.is_read = true;
          });
          break;
        case 'comment':
          commentNotifications.value.forEach(notification => {
            notification.is_read = true;
          });
          break;
        case 'system':
          systemNotifications.value.forEach(notification => {
            notification.is_read = true;
          });
          break;
      }
      
      // 同时更新全部通知列表中的已读状态
      notifications.value = notifications.value.map(notification => {
        if (notification.type === activeTab.value) {
          notification.is_read = true;
        }
        return notification;
      });
    }
    
    unreadCount.value = response.unreadCount;
    ElMessage.success("已全部标记为已读");
  } catch (error) {
    console.error("标记已读失败:", error);
    ElMessage.error("操作失败");
  } finally {
    loading.value = false;
  }
};

// 处理通知点击
const handleNotificationClick = async (notification) => {
  try {
    // 打印通知数据以便调试
    console.log("通知点击:", notification);
    
    // 标记为已读
    if (!notification.is_read) {
      const response = await notificationStore.markAsRead([notification.id]);
      notification.is_read = true;
      unreadCount.value = response.unreadCount;
    }
    
    // 优先使用post_id进行跳转
    if (notification.post_id) {
      console.log("使用post_id跳转到帖子:", `/community/post/${notification.post_id}`);
      router.push(`/community/post/${notification.post_id}`);
      return;
    }
    
    // 如果没有post_id，再根据通知类型进行处理
    const sourceType = notification.source_type || notification.type;
    const sourceId = notification.source_id;
    
    if (sourceType === "follow") {
      // 关注类型通知，跳转到用户个人资料页
      if (notification.actor && notification.actor.id) {
        router.push(`/user/${notification.actor.id}`);
      } else {
        ElMessage.warning("无法跳转到用户资料页");
      }
    } else if (sourceType === "system") {
      // 系统通知不跳转
      return;
    } else {
      // 其他类型，如果有sourceId尝试跳转到帖子详情
      if (sourceId) {
        router.push(`/community/post/${sourceId}`);
      } else {
        // 如果实在没有可用的ID，跳转到社区首页
        ElMessage.info("无法找到相关内容，跳转到社区页面");
        router.push('/community');
      }
    }
  } catch (error) {
    console.error("处理通知点击失败:", error);
    ElMessage.error("操作失败");
  }
};

// 处理标签页变更
const handleTabChange = (tab) => {
  if (tab === 'all') {
    loadNotifications();
  } else {
    loadNotificationsByType(tab);
  }
};

// 组件挂载时加载通知
onMounted(() => {
  loadNotifications();
  loadNotificationsByType('like');
  loadNotificationsByType('comment');
  loadNotificationsByType('system');
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 70px; /* 为底部导航栏留出空间 */
  padding-top: var(--safe-area-top); /* 添加顶部安全区域 */
}

.notifications-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.page-header {
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
}

.safe-area-top {
  height: var(--safe-area-top, 0);
  width: 100%;
}

.header-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 标签页样式 */
.tabs-container {
  padding: 16px;
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__item) {
  font-size: 15px;
  padding: 0 16px;
}

:deep(.el-tabs__active-bar) {
  background-color: #1677ff;
}

:deep(.el-tabs__item.is-active) {
  color: #1677ff;
  font-weight: 500;
}

/* 通知列表样式 */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.notification-item.unread {
  background-color: #f0f7ff;
  border-left: 3px solid #1677ff;
}

.actor-avatar {
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  line-height: 1.4;
}

.actor {
  font-weight: 600;
  color: #1677ff;
  margin-right: 4px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

/* 系统通知样式 */
.system-notification {
  background-color: #f5f5f5;
}

.system-notification.unread {
  background-color: #fff0f6;
  border-left: 3px solid #eb2f96;
}

.system-avatar {
  background-color: #eb2f96;
  color: white;
}

.system-actor {
  color: #eb2f96;
}

/* 空状态样式 */
.empty-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}
</style> 