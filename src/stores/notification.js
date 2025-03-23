import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";
import { getAvatarUrl } from "@/utils/imageHelpers";

const API_BASE_URL = "http://47.98.210.7:3000";

// 辅助函数：标准化通知对象格式
const standardizeNotification = (notification) => {
  if (!notification) return null;
  
  const standardized = { ...notification };
  
  // 处理不同格式的类型字段
  standardized.source_type = notification.source_type || notification.type;
  
  // 处理不同格式的ID字段
  if (!standardized.source_id && notification.sourceId) {
    standardized.source_id = notification.sourceId;
  }
  
  // 后端现在直接提供post_id，但仍保留兼容性处理
  if (!standardized.post_id && notification.postId) {
    standardized.post_id = notification.postId;
  }
  
  // 从data对象中提取信息
  if (notification.data) {
    // 对于source_id
    if (!standardized.source_id) {
      standardized.source_id = notification.data.source_id || notification.data.sourceId || notification.data.id;
    }
    
    // 对于post_id
    if (!standardized.post_id) {
      standardized.post_id = notification.data.post_id || notification.data.postId;
    }
    
    // 对于comment类型，可能需要从data中提取comment_id和post_id
    if (standardized.source_type === "comment") {
      if (!standardized.comment_id && notification.data.comment_id) {
        standardized.comment_id = notification.data.comment_id;
      }
      
      if (!standardized.post_id && notification.data.post_id) {
        standardized.post_id = notification.data.post_id;
      }
    }
  }
  
  return standardized;
};

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    likeNotifications: [],
    commentNotifications: [],
    systemNotifications: [],
  }),

  actions: {
    // 获取通知列表
    async getNotifications() {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        
        // 打印原始通知数据
        console.log("服务器返回的原始通知数据:", response.data);
        
        // 处理头像URL和标准化通知格式
        if (response.data && response.data.notifications) {
          response.data.notifications = response.data.notifications.map(notification => {
            // 打印每个通知的详细信息
            console.log("单个通知数据:", JSON.stringify(notification, null, 2));
            
            // 标准化通知格式
            notification = standardizeNotification(notification);
            
            // 处理头像
            if (notification.actor && notification.actor.avatar) {
              notification.actor.avatar = getAvatarUrl(notification.actor.avatar);
            }
            return notification;
          });
        }
        
        return response.data;
      } catch (error) {
        console.error("获取通知列表失败:", error);
        throw error.response?.data || error;
      }
    },

    // 按类型获取通知列表
    async getNotificationsByType(type) {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(`${API_BASE_URL}/api/notifications/by-type/${type}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        
        // 处理头像URL和标准化通知格式
        if (response.data && response.data.notifications) {
          response.data.notifications = response.data.notifications.map(notification => {
            // 标准化通知格式
            notification = standardizeNotification(notification);
            
            if (notification.actor && notification.actor.avatar) {
              notification.actor.avatar = getAvatarUrl(notification.actor.avatar);
            }
            return notification;
          });

          // 根据类型存储到对应的状态
          switch(type) {
            case 'like':
              this.likeNotifications = response.data.notifications;
              break;
            case 'comment':
              this.commentNotifications = response.data.notifications;
              break;
            case 'system':
              this.systemNotifications = response.data.notifications;
              break;
          }
        }
        
        return response.data;
      } catch (error) {
        console.error(`获取${type}类型通知列表失败:`, error);
        throw error.response?.data || error;
      }
    },

    // 发送系统通知
    async sendSystemNotification(content, userIds = null) {
      try {
        const authStore = useAuthStore();
        const payload = {
          content,
          userIds, // 如果为null，则发送给所有用户
          type: 'system'
        };

        const response = await axios.post(
          `${API_BASE_URL}/api/notifications/system`,
          payload,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("发送系统通知失败:", error);
        throw error.response?.data || error;
      }
    },

    // 标记通知为已读
    async markAsRead(notificationIds) {
      try {
        const authStore = useAuthStore();
        const response = await axios.put(
          `${API_BASE_URL}/api/notifications/read`,
          { notificationIds },
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("标记通知已读失败:", error);
        throw error.response?.data || error;
      }
    },

    // 标记所有通知为已读
    async markAllAsRead() {
      try {
        const authStore = useAuthStore();
        const response = await axios.put(
          `${API_BASE_URL}/api/notifications/read-all`,
          {},
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("标记所有通知已读失败:", error);
        throw error.response?.data || error;
      }
    },

    // 标记指定类型的所有通知为已读
    async markAllAsReadByType(type) {
      try {
        const authStore = useAuthStore();
        const response = await axios.put(
          `${API_BASE_URL}/api/notifications/read-all-by-type/${type}`,
          {},
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error(`标记所有${type}类型通知已读失败:`, error);
        throw error.response?.data || error;
      }
    },

    // 删除通知
    async deleteNotification(notificationId) {
      try {
        const authStore = useAuthStore();
        await axios.delete(
          `${API_BASE_URL}/api/notifications/${notificationId}`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        this.notifications = this.notifications.filter(
          (n) => n.id !== notificationId
        );
      } catch (error) {
        throw error.response?.data || error;
      }
    },
  },
});
