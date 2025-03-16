import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";
import { getAvatarUrl } from "@/utils/imageHelpers";

const API_BASE_URL = "http://47.98.210.7:3000";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [],
    unreadCount: 0,
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
