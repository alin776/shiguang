import { defineStore } from "pinia";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "./auth";

export const useCardGameStore = defineStore("cardGame", {
  state: () => ({
    gameHistory: [],
    playerStats: null,
    todayBet: null,
    todayResult: null,
    loading: false,
    error: null,
  }),

  actions: {
    // 提交投注
    async placeBet(betData) {
      this.loading = true;
      this.error = null;
      try {
        console.log("提交投注数据:", betData);
        const response = await axios.post(
          `${API_BASE_URL}/api/games/card-game/bet`,
          betData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        this.todayBet = response.data;
        return response.data;
      } catch (error) {
        console.error("投注失败:", error);
        if (error.response && error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 获取今日投注信息
    async getTodayBet() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/games/card-game/today-bet`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        this.todayBet = response.data;
        return response.data;
      } catch (error) {
        // 404 错误表示今天还没有投注，这是正常情况
        if (error.response && error.response.status === 404) {
          this.todayBet = null;
        } else {
          console.error("获取今日投注失败:", error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 获取开奖结果
    async getDrawResult() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/games/card-game/draw-result`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        this.todayResult = response.data;
        return response.data;
      } catch (error) {
        // 404 错误表示今天还没有开奖，这是正常情况
        if (error.response && error.response.status === 404) {
          this.todayResult = null;
        } else {
          console.error("获取开奖结果失败:", error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 获取游戏历史记录
    async getGameHistory() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/games/card-game/history`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        this.gameHistory = response.data;
        return response.data;
      } catch (error) {
        console.error("获取游戏历史失败:", error);
        this.error = error.response?.data?.message || "获取游戏历史失败";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 获取玩家统计数据
    async getPlayerStats() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/games/card-game/stats`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        this.playerStats = response.data;
        return response.data;
      } catch (error) {
        console.error("获取玩家统计失败:", error);
        this.error = error.response?.data?.message || "获取玩家统计失败";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 重置状态
    resetState() {
      this.todayBet = null;
      this.todayResult = null;
      this.gameHistory = [];
      this.playerStats = null;
    }
  },
}); 