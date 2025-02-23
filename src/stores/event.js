import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

const API_BASE_URL = "http://47.98.210.7:3000";

export const useEventStore = defineStore("event", {
  state: () => ({
    events: [],
    loading: false,
  }),

  actions: {
    // 获取事件列表
    async getEvents(startDate, endDate) {
      try {
        this.loading = true;
        const authStore = useAuthStore();
        const response = await axios.get(`${API_BASE_URL}/api/events`, {
          params: { startDate, endDate },
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        return response.data;
      } catch (error) {
        console.error("获取事件列表失败:", error);
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    // 创建事件
    async createEvent(eventData) {
      try {
        const authStore = useAuthStore();
        const response = await axios.post(
          `${API_BASE_URL}/api/events`,
          eventData,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("创建事件失败:", error);
        throw error.response?.data || error;
      }
    },

    // 更新事件
    async updateEvent(eventId, eventData) {
      try {
        const authStore = useAuthStore();
        const response = await axios.put(
          `${API_BASE_URL}/api/events/${eventId}`,
          eventData,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("更新事件失败:", error);
        throw error.response?.data || error;
      }
    },

    // 删除事件
    async deleteEvent(eventId) {
      try {
        if (!eventId) {
          throw new Error("事件ID不能为空");
        }

        const authStore = useAuthStore();
        if (!authStore.token) {
          throw new Error("未登录或登录已过期");
        }

        const response = await axios.delete(
          `${API_BASE_URL}/api/events/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
            params: {
              userId: authStore.user?.id,
            },
          }
        );

        if (!response.data) {
          throw new Error("删除失败：服务器未返回数据");
        }

        return response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error("事件不存在或已被删除");
        }

        if (error.response?.status === 500) {
          console.error("服务器错误详情:", error.response?.data);
        }

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "删除事件失败，请稍后重试";
        console.error("删除事件失败:", error.response?.data || error.message);
        throw new Error(errorMessage);
      }
    },
  },
});
