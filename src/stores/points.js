import { defineStore } from "pinia";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "./auth";

export const usePointsStore = defineStore("points", {
  state: () => ({
    products: [],
    exchanges: [],
    loading: false,
    error: null,
  }),

  actions: {
    // 获取所有积分商品
    async fetchProducts() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users/points/products`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        this.products = response.data;
        return response.data;
      } catch (error) {
        console.error("获取积分商品列表失败:", error);
        this.error = error.response?.data?.message || "获取积分商品列表失败";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 获取单个积分商品详情
    async fetchProductById(productId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users/points/products/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        return response.data;
      } catch (error) {
        console.error("获取积分商品详情失败:", error);
        this.error = error.response?.data?.message || "获取积分商品详情失败";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 兑换积分商品
    async exchangeProduct(productId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/points/exchange`,
          { productId },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // 更新用户积分
        const authStore = useAuthStore();
        if (authStore.user) {
          authStore.user.points = response.data.points;
        }

        // 重新获取兑换记录
        await this.fetchUserExchanges();
        
        return response.data;
      } catch (error) {
        console.error("兑换商品失败:", error);
        this.error = error.response?.data?.message || "兑换商品失败";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 获取用户兑换记录
    async fetchUserExchanges() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users/points/exchanges`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        this.exchanges = response.data;
        return response.data;
      } catch (error) {
        console.error("获取兑换记录失败:", error);
        this.error = error.response?.data?.message || "获取兑换记录失败";
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
}); 