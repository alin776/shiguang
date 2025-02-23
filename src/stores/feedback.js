import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

export const useFeedbackStore = defineStore("feedback", {
  state: () => ({
    feedbacks: [],
    loading: false,
  }),

  actions: {
    async submitFeedback(feedback) {
      try {
        const authStore = useAuthStore();
        const response = await axios.post("/api/feedback", feedback, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async getFeedbacks() {
      try {
        const authStore = useAuthStore();
        const response = await axios.get("/api/feedback", {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        this.feedbacks = response.data;
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },
  },
});
