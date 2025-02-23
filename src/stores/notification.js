import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

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

    async deleteNotification(notificationId) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `${API_BASE_URL}/api/notifications/${notificationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
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
