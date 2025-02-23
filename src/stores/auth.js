import { defineStore } from "pinia";
import axios from "axios";
import { useCommunityStore } from "./community";

const API_BASE_URL = "http://47.98.210.7:3000";

const cleanupAvatarPath = (avatar) => {
  if (!avatar) return null;
  if (avatar.includes("//uploads")) {
    const matches = avatar.match(/\/uploads\/avatars\/[^/]+$/);
    return matches ? matches[0] : null;
  }
  return avatar;
};

export const useAuthStore = defineStore("auth", {
  state: () => {
    // 从 localStorage 获取用户数据并清理路径
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?.avatar) {
      storedUser.avatar = cleanupAvatarPath(storedUser.avatar);
    }

    return {
      token: localStorage.getItem("token") || null,
      user: storedUser,
      autoLogin: localStorage.getItem("autoLogin") === "true",
      theme: localStorage.getItem("theme") || "light",
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    userAvatar: (state) => {
      if (!state.user?.avatar) return "";
      if (state.user.avatar.startsWith("http")) {
        return state.user.avatar;
      }
      return `${API_BASE_URL}${state.user.avatar}`;
    },
  },

  actions: {
    async registerUser(userData) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/register`,
          userData
        );
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async loginUser(credentials) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/login`,
          credentials
        );

        const user = response.data.user;
        if (user.avatar && !user.avatar.startsWith("http")) {
          user.avatar = `/uploads/avatars/${user.avatar.split("/").pop()}`;
        }

        this.token = response.data.token;
        this.user = user;

        // 保存到 localStorage 前清理路径
        localStorage.setItem("token", this.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...user,
            avatar: cleanupAvatarPath(user.avatar),
          })
        );

        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async updateProfile(profileData) {
      try {
        console.log("发送到后端的数据:", profileData);

        const response = await axios.put(
          `${API_BASE_URL}/api/users/profile`,
          profileData,
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );

        console.log("后端返回的数据:", response.data);

        // 更新本地存储的用户信息
        this.user = {
          ...this.user,
          ...response.data.user,
          avatar: response.data.user.avatar
            ? `${API_BASE_URL}${response.data.user.avatar}`
            : null,
          coverImage: response.data.user.coverImage
            ? `${API_BASE_URL}${response.data.user.coverImage}`
            : null,
        };

        // 更新 localStorage
        localStorage.setItem("user", JSON.stringify(this.user));

        return response.data;
      } catch (error) {
        console.error("更新用户资料失败:", error);
        throw error.response?.data || error;
      }
    },

    async changePassword(passwordData) {
      try {
        const response = await axios.put(
          `${API_BASE_URL}/api/users/password`,
          passwordData,
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async resetPassword(resetData) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/reset-password`,
          resetData
        );
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async sendVerificationCode(phone) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/send-code`,
          { phone }
        );
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    logout: async function () {
      try {
        await axios.post("/api/users/logout", null, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        this.token = null;
        this.user = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const communityStore = useCommunityStore();
        communityStore.clearState();
        window.location.href = "/login";
      } catch (error) {
        console.error("登出失败:", error);
        throw error;
      }
    },

    async setupTwoFactor() {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/2fa/setup`,
          {},
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async verifyTwoFactor(code) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/2fa/verify`,
          { code },
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );
        this.user = {
          ...this.user,
          twoFactorEnabled: true,
        };
        localStorage.setItem("user", JSON.stringify(this.user));
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async disableTwoFactor() {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/2fa/disable`,
          {},
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );
        this.user = {
          ...this.user,
          twoFactorEnabled: false,
        };
        localStorage.setItem("user", JSON.stringify(this.user));
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async verifyTwoFactorLogin(code) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/2fa/login`,
          { code }
        );
        this.token = response.data.token;
        this.user = response.data.user;
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async fetchUserInfo() {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        this.user = response.data;
        localStorage.setItem("user", JSON.stringify(this.user));
        return response.data;
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 404) {
          this.logout();
          throw new Error("登录已过期，请重新登录");
        }
        throw error.response?.data?.message || "获取用户信息失败";
      }
    },

    async checkAuth() {
      if (!this.token) {
        throw new Error("No token found");
      }
      try {
        await this.fetchUserInfo();
        return true;
      } catch (error) {
        this.logout();
        return false;
      }
    },

    initializeTheme() {
      const savedTheme = localStorage.getItem("theme") || "light";
      this.theme = savedTheme;
      this.applyTheme(savedTheme);
    },

    setTheme(newTheme) {
      this.theme = newTheme;
      localStorage.setItem("theme", newTheme);
      this.applyTheme(newTheme);
    },

    applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },

    checkSavedLogin() {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      const autoLogin = localStorage.getItem("autoLogin") === "true";

      if (autoLogin && savedToken && savedUser) {
        this.token = savedToken;
        this.user = JSON.parse(savedUser);
        this.autoLogin = true;
        return true;
      }
      return false;
    },
  },
});
