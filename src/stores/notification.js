import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";
import { getAvatarUrl } from "@/utils/imageHelpers";

const API_BASE_URL = "http://47.98.210.7:3000";

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
        
        // 处理头像URL
        if (response.data && response.data.notifications) {
          response.data.notifications = response.data.notifications.map(notification => {
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
        
        // 处理头像URL
        if (response.data && response.data.notifications) {
          response.data.notifications = response.data.notifications.map(notification => {
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
