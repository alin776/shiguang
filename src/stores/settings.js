import { defineStore } from "pinia";
import axios from "axios";

const API_BASE_URL = "http://47.98.210.7:3000";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    theme: {
      darkMode: true, // 默认为宇宙粒子主题（深色模式）
      color: "#409EFF",
    },
    account: {
      autoLogin: true,
    },
  }),

  actions: {
    async fetchSettings() {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/settings`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // 更新 store 中的设置，但保持深色模式始终开启
        if (response.data.theme_settings) {
          const themeSettings = response.data.theme_settings;
          this.theme = {
            ...themeSettings,
            darkMode: true, // 确保深色模式始终开启
          };
        }

        return {
          theme: this.theme,
          account: this.account,
        };
      } catch (error) {
        console.error("获取设置失败:", error);
        throw error;
      }
    },

    async updateSettings(settings) {
      try {
        console.log("发送的设置数据:", settings);
        
        // 确保主题设置中的darkMode始终为true（宇宙粒子主题）
        const themeSettings = settings.theme || {};
        const updatedThemeSettings = {
          ...themeSettings,
          darkMode: true,
          color: themeSettings.color || "#409EFF",
        };

        const response = await axios.put(
          `${API_BASE_URL}/api/users/settings`,
          {
            theme_settings: updatedThemeSettings,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // 更新本地状态，确保深色模式保持开启
        if (response.data.theme_settings) {
          this.theme = {
            ...response.data.theme_settings,
            darkMode: true,
          };
        }

        return response.data;
      } catch (error) {
        console.error("更新设置失败:", error);
        throw error;
      }
    },

    async updateNotificationSettings(notificationSettings) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.put(
          `${API_BASE_URL}/api/users/notification-settings`,
          notificationSettings,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        this.settings = {
          ...this.settings,
          notifications: response.data,
        };
      } catch (error) {
        throw error.response?.data || error;
      }
    },
  },
});
