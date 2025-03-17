import { defineStore } from "pinia";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { getAvatarUrl } from "../utils/imageHelpers";
import { useCommunityStore } from "./community";

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
      theme: "light", // 使用亮色主题
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    userAvatar: (state) => getAvatarUrl(state.user?.avatar),
    userCover: (state) => {
      if (!state.user?.coverImage) return '';
      // 处理封面图URL
      const coverUrl = state.user.coverImage;
      if (coverUrl && coverUrl.startsWith('http')) {
        return coverUrl;
      } else if (coverUrl) {
        return `${API_BASE_URL}${coverUrl}`;
      }
      return '';
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

        // 确保传递给后端的是正确处理过的数据
        const dataToSend = {
          ...profileData,
          // 确保只发送文件名，不包含完整路径
          avatar: profileData.avatar && profileData.avatar.includes("/")
            ? profileData.avatar.split("/").pop()
            : profileData.avatar,
          coverImage: profileData.coverImage && profileData.coverImage.includes("/")
            ? profileData.coverImage.split("/").pop()
            : profileData.coverImage
        };

        console.log("处理后发送到后端的数据:", dataToSend);

        const response = await axios.put(
          `${API_BASE_URL}/api/users/profile`,
          dataToSend,
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );

        console.log("后端返回的数据:", response.data);

        // 处理返回的头像和封面图路径
        let avatar = response.data.user.avatar;
        if (avatar && !avatar.includes("http")) {
          // 确保路径格式正确
          avatar = avatar.startsWith("/") 
            ? `${API_BASE_URL}${avatar}`
            : `${API_BASE_URL}/uploads/avatars/${avatar}`;
        }

        let coverImage = response.data.user.coverImage;
        if (coverImage && !coverImage.includes("http")) {
          // 确保路径格式正确
          coverImage = coverImage.startsWith("/")
            ? `${API_BASE_URL}${coverImage}`
            : `${API_BASE_URL}/uploads/covers/${coverImage}`;
        }

        // 更新本地存储的用户信息
        this.user = {
          ...this.user,
          ...response.data.user,
          avatar,
          coverImage
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
        // 只有当token存在且有效时，才尝试发送登出请求
        if (this.token) {
          try {
            await axios.post("/api/users/logout", null, {
              headers: { Authorization: `Bearer ${this.token}` },
            });
          } catch (error) {
            // 如果登出请求失败，只记录错误但继续清理客户端状态
            console.error("登出请求失败，但将继续清理本地状态:", error);
          }
        }
        
        // 无论服务器请求成功与否，都清理本地状态
        this.token = null;
        this.user = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const communityStore = useCommunityStore();
        communityStore.clearState();
        window.location.href = "/login";
      } catch (error) {
        console.error("登出操作完全失败:", error);
        // 即使清理本地状态失败，也尝试跳转到登录页
        window.location.href = "/login";
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
        console.log("开始获取用户信息...");
        const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        
        console.log("服务器返回的原始用户数据:", response.data);
        
        // 处理头像和封面图路径
        let userData = { ...response.data };
        
        // 处理头像路径
        if (userData.avatar) {
          // 如果已经是完整的URL，保留原样
          if (!userData.avatar.includes("http")) {
            userData.avatar = userData.avatar.startsWith("/")
              ? `${API_BASE_URL}${userData.avatar}`
              : `${API_BASE_URL}/uploads/avatars/${userData.avatar}`;
          }
        }
        
        // 处理封面图路径
        if (userData.coverImage) {
          // 如果已经是完整的URL，保留原样
          if (!userData.coverImage.includes("http")) {
            userData.coverImage = userData.coverImage.startsWith("/")
              ? `${API_BASE_URL}${userData.coverImage}`
              : `${API_BASE_URL}/uploads/covers/${userData.coverImage}`;
          }
        }
        
        this.user = userData;
        console.log("处理后的用户数据:", this.user);
        
        localStorage.setItem("user", JSON.stringify(this.user));
        return this.user;
      } catch (error) {
        console.error("获取用户信息失败:", error);
        if (error.response?.status === 401 || error.response?.status === 404) {
          this.logout();
          throw new Error("登录已过期，请重新登录");
        }
        throw error.response?.data?.message || "获取用户信息失败";
      }
    },

    // 检查 token 是否有效
    isTokenValid() {
      const token = this.token;
      if (!token) return false;
      
      try {
        // 解析 JWT token（不需要验证签名）
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const now = Math.floor(Date.now() / 1000);
        
        // 检查过期时间
        return payload.exp > now;
      } catch (error) {
        console.error('Token 解析错误:', error);
        return false;
      }
    },

    async checkAuth() {
      if (!this.token) {
        throw new Error("No token found");
      }
      
      // 首先检查 token 是否已过期
      if (!this.isTokenValid()) {
        console.log('Token 已过期，执行登出操作');
        this.logout();
        return false;
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
      // 设置为亮色主题
      this.theme = "light";
      localStorage.setItem("theme", "light");
      this.applyTheme("light");
    },

    setTheme(newTheme) {
      // 无论传入什么值，都设置为亮色主题
      this.theme = "light";
      localStorage.setItem("theme", "light");
      this.applyTheme("light");
    },

    applyTheme(theme) {
      // 应用亮色主题
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
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
