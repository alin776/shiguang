import { defineStore } from "pinia";
import axios from "axios";

const API_BASE_URL = "http://47.98.210.7:3000";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    theme: {
      darkMode: false,
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

        // 更新 store 中的设置
        if (response.data.theme_settings) {
          this.theme = response.data.theme_settings;
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
        console.log("theme_settings:", settings.theme);

        const response = await axios.put(
          `${API_BASE_URL}/api/users/settings`,
          {
            theme_settings: settings.theme || {
              darkMode: false,
              color: "#409EFF",
            },
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // 更新本地状态
        if (response.data.theme_settings) {
          this.theme = response.data.theme_settings;
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
