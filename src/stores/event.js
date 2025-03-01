import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

const API_BASE_URL = "http://47.98.210.7:3000";

export const useEventStore = defineStore("event", {
  state: () => ({
    events: [],
    loading: false,
    authStore: null,
  }),

  actions: {
    // 初始化 authStore
    init() {
      if (!this.authStore) {
        this.authStore = useAuthStore();
      }
    },

    // 获取事件列表
    async getEvents(startDate, endDate) {
      try {
        this.init();
        this.loading = true;
        const response = await axios.get(`${API_BASE_URL}/api/events`, {
          params: { startDate, endDate },
          headers: { Authorization: `Bearer ${this.authStore.token}` },
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
        this.init();
        const response = await axios.post(
          `${API_BASE_URL}/api/events`,
          eventData,
          {
            headers: { Authorization: `Bearer ${this.authStore.token}` },
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
        this.init();
        if (!eventId) {
          throw new Error("事件ID无效");
        }

        console.log("删除事件，ID:", eventId);

        const response = await axios.delete(
          `${API_BASE_URL}/api/events/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${this.authStore.token}`,
            },
            params: {
              userId: this.authStore.user?.id,
            },
          }
        );

        return response.data;
      } catch (error) {
        console.error("删除事件失败:", error);
        throw error;
      }
    },
  },
});
