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

        // 如果没有提供日期范围，使用当前日期前后一个月
        if (!startDate || !endDate) {
          const today = new Date();
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(today.getMonth() - 1);
          const oneMonthLater = new Date(today);
          oneMonthLater.setMonth(today.getMonth() + 1);

          startDate = oneMonthAgo.toISOString().split("T")[0];
          endDate = oneMonthLater.toISOString().split("T")[0];
        }

        const response = await axios.get(`${API_BASE_URL}/api/events`, {
          params: { startDate, endDate },
          headers: {
            Authorization: `Bearer ${
              this.authStore?.token || localStorage.getItem("token")
            }`,
          },
        });
        return response.data;
      } catch (error) {
        console.error("获取事件列表失败:", error);
        // 返回空事件列表而不是抛出错误
        return { events: [] };
      } finally {
        this.loading = false;
      }
    },

    // 获取单个事件
    async getEventById(eventId) {
      try {
        this.init();
        this.loading = true;

        if (!eventId) {
          throw new Error("事件ID不能为空");
        }

        console.log("正在获取事件详情，ID:", eventId);

        // 方法1：尝试直接从API获取单个事件
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/events/${eventId}`,
            {
              headers: {
                Authorization: `Bearer ${
                  this.authStore?.token || localStorage.getItem("token")
                }`,
              },
            }
          );

          console.log("直接从API获取的事件数据:", response.data);
          if (response.data && response.data.event) {
            return response.data.event;
          }
        } catch (directError) {
          console.log("直接获取事件失败，将尝试从事件列表中查找:", directError);
        }

        // 方法2：从事件列表中查找特定ID的事件
        const response = await this.getEvents();

        if (response && response.events && response.events.length > 0) {
          const event = response.events.find((event) => event.id == eventId);
          console.log("从事件列表中查找到的事件:", event);
          if (event) {
            return event;
          }
        }

        // 如果没找到事件或发生错误，返回null而不是抛出错误
        console.warn("未找到ID为", eventId, "的事件");
        return null;
      } catch (error) {
        console.error("获取事件详情失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // 创建事件
    async createEvent(eventData) {
      try {
        this.loading = true;

        // 确保authStore已初始化
        this.init();

        // 如果仍然没有token，主动从authStore中获取
        if (!this.authStore || !this.authStore.token) {
          const authStore = useAuthStore();
          this.authStore = authStore;
        }

        // 处理描述字段 - 如果为空，使用"NULL"字符串
        const description =
          eventData.description && eventData.description.trim() !== ""
            ? eventData.description
            : "NULL";

        // 调整数据格式以匹配API期望
        const apiData = {
          title: eventData.title,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          color: eventData.color || "#409EFF",
          reminder: eventData.reminder || false,
          description: description,
        };

        console.log("发送到API的数据:", apiData);

        const response = await axios.post(
          `${API_BASE_URL}/api/events`,
          apiData,
          {
            headers: {
              Authorization: `Bearer ${
                this.authStore?.token || localStorage.getItem("token")
              }`,
            },
          }
        );

        return response.data;
      } catch (error) {
        console.error("创建事件API错误:", error.response?.data || error);
        if (error.response?.data?.errors) {
          console.error("字段错误详情:", error.response.data.errors);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 更新事件
    async updateEvent(eventId, eventData) {
      try {
        // 确保authStore已初始化
        this.init();

        if (!this.authStore || !this.authStore.token) {
          const authStore = useAuthStore();
          this.authStore = authStore;
        }

        // 处理描述字段 - 如果为空，使用"NULL"字符串
        const description =
          eventData.description && eventData.description.trim() !== ""
            ? eventData.description
            : "NULL";

        // 为更新操作准备数据
        const apiData = {
          ...eventData,
          description: description,
          // 使用正确的字段名
          updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        };

        console.log("更新事件数据:", apiData);

        const response = await axios.put(
          `${API_BASE_URL}/api/events/${eventId}`,
          apiData,
          {
            headers: {
              Authorization: `Bearer ${
                this.authStore?.token || localStorage.getItem("token")
              }`,
            },
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
