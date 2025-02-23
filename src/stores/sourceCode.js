import { defineStore } from "pinia";
import axios from "axios";

const API_BASE_URL = "http://47.98.210.7:3000";

export const useSourceCodeStore = defineStore("sourceCode", {
  state: () => ({
    categories: [],
    sourceCodes: [],
    loading: false,
  }),

  actions: {
    async fetchCategories() {
      try {
        this.loading = true;
        const response = await axios.get(
          `${API_BASE_URL}/api/source-codes/categories`
        );
        this.categories = response.data;
      } catch (error) {
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    async fetchSourceCodes(categoryId) {
      try {
        this.loading = true;
        const response = await axios.get(`${API_BASE_URL}/api/source-codes`, {
          params: { categoryId },
        });
        this.sourceCodes = response.data;
      } catch (error) {
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    async downloadSourceCode(sourceCodeId) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE_URL}/api/source-codes/${sourceCodeId}/download`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob",
          }
        );
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },
  },
});
