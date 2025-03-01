import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";
import { API_BASE_URL, API_ENDPOINTS } from "../config";

export const useFeedbackStore = defineStore("feedback", {
  state: () => ({
    feedbacks: [],
    loading: false,
  }),

  actions: {
    async submitFeedback(feedback) {
      try {
        const authStore = useAuthStore();
        const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.FEEDBACK.SUBMIT}`, feedback, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async getFeedbacks() {
      try {
        console.log('正在获取反馈数据，使用API:', `${API_BASE_URL}${API_ENDPOINTS.FEEDBACK.LIST}`);
        const authStore = useAuthStore();
        console.log('认证令牌可用:', !!authStore.token);
        
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.FEEDBACK.LIST}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        
        console.log('API响应:', response);
        if (response.data && response.data.feedbacks) {
          this.feedbacks = response.data.feedbacks;
          return response.data.feedbacks;
        } else {
          console.error('反馈数据结构不符合预期:', response.data);
          return [];
        }
      } catch (error) {
        console.error('获取反馈失败:', error.message, error.response?.data);
        throw error.response?.data || error;
      }
    },
  },
});
