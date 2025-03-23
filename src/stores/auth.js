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
    isLoggedIn: (state) => !!state.token && !!state.user,
    isAuthenticated: (state) => !!state.token,
    userAvatar: (state) => getAvatarUrl(state.user?.avatar),
    userCover: (state) => {
      if (!state.user?.coverImage && !state.user?.cover_image) return '';
      
      // 使用cover_image或coverImage
      const coverUrl = state.user.cover_image || state.user.coverImage;
      if (!coverUrl) return '';
      
      console.log("处理封面图URL (getter):", coverUrl);
      
      // 处理缺少路径分隔符的情况
      if (coverUrl.includes("localhost:3000cover-")) {
        const fileName = coverUrl.split("localhost:3000")[1];
        const fixedUrl = `${API_BASE_URL}/uploads/covers/${fileName}`;
        console.log("修复后的封面图URL:", fixedUrl);
        return fixedUrl;
      }
      
      // 处理正常的URL
      if (coverUrl.startsWith('http')) {
        return coverUrl;
      } else if (coverUrl) {
        const url = `${API_BASE_URL}${coverUrl.startsWith('/') ? coverUrl : '/uploads/covers/' + coverUrl}`;
        console.log("处理后的封面图URL:", url);
        return url;
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

    async fetchUserExperience() {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users/experience`,
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );
        
        // 更新用户经验信息
        if (this.user) {
          this.user = {
            ...this.user,
            experience: response.data.experience,
            level: response.data.level,
            experienceProgress: {
              progress: response.data.progress,
              currentExp: response.data.experience - response.data.currentLevelExp,
              expNeeded: response.data.nextLevelExp - response.data.currentLevelExp,
              maxLevel: response.data.maxLevel
            }
          };
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        
        return response.data;
      } catch (error) {
        console.error("获取用户经验数据失败:", error);
        throw error.response?.data || error;
      }
    },
    
    async addExperience(amount) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/experience`,
          { amount },
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );
        
        // 更新用户经验信息
        if (this.user) {
          this.user = {
            ...this.user,
            experience: response.data.experience,
            level: response.data.level,
            experienceProgress: {
              progress: response.data.progress,
              currentExp: response.data.experience - response.data.currentLevelExp,
              expNeeded: response.data.nextLevelExp - response.data.currentLevelExp,
              maxLevel: response.data.maxLevel
            }
          };
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        
        return response.data;
      } catch (error) {
        console.error("增加用户经验失败:", error);
        throw error.response?.data || error;
      }
    },

    async addPoints(amount) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/points`,
          { amount },
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );
        
        // 更新用户积分信息
        if (this.user) {
          this.user = {
            ...this.user,
            points: response.data.points || 0
          };
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        
        return response.data;
      } catch (error) {
        console.error("增加用户积分失败:", error);
        throw error.response?.data || error;
      }
    },

    async fetchUserPoints() {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users/points`,
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );
        
        // 更新用户积分信息
        if (this.user) {
          this.user = {
            ...this.user,
            points: response.data.points || 0
          };
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        
        return response.data;
      } catch (error) {
        console.error("获取用户积分数据失败:", error);
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
        let userData = { ...response.data.user };
        
        // 处理头像路径
        if (userData.avatar) {
          console.log("处理头像URL:", userData.avatar);
          
          // 直接检测localhost域名下缺少路径分隔符的情况
          if (userData.avatar.includes("localhost:3000avatar-")) {
            // 提取文件名
            const fileName = userData.avatar.split("localhost:3000")[1];
            // 直接构建正确的URL
            userData.avatar = `${API_BASE_URL}/uploads/avatars/${fileName}`;
            console.log("修复后的头像URL:", userData.avatar);
          }
          // 其他处理保持不变
          else if (userData.avatar.includes("http://") || userData.avatar.includes("https://")) {
            const urlParts = userData.avatar.match(/(https?:\/\/[^\/]+)(.*)/);
            if (urlParts && urlParts.length >= 3) {
              const domain = urlParts[1]; 
              const path = urlParts[2];   
              
              if (path && !path.startsWith('/')) {
                userData.avatar = `${API_BASE_URL}/uploads/avatars/${path}`;
                console.log("修复后的头像URL:", userData.avatar);
              }
            }
          } else if (!userData.avatar.includes("http")) {
            userData.avatar = userData.avatar.startsWith("/")
              ? `${API_BASE_URL}${userData.avatar}`
              : `${API_BASE_URL}/uploads/avatars/${userData.avatar}`;
            console.log("相对路径头像URL:", userData.avatar);
          }
        }
        
        // 处理封面图路径
        if (userData.cover_image) {
          console.log("处理封面图URL:", userData.cover_image);
          
          // 直接检测localhost域名下缺少路径分隔符的情况
          if (userData.cover_image.includes("localhost:3000cover-")) {
            // 提取文件名
            const fileName = userData.cover_image.split("localhost:3000")[1];
            // 直接构建正确的URL
            userData.cover_image = `${API_BASE_URL}/uploads/covers/${fileName}`;
            console.log("修复后的封面URL:", userData.cover_image);
          }
          // 其他处理保持不变
          else if (userData.cover_image.includes("http://") || userData.cover_image.includes("https://")) {
            const urlParts = userData.cover_image.match(/(https?:\/\/[^\/]+)(.*)/);
            if (urlParts && urlParts.length >= 3) {
              const domain = urlParts[1];
              const path = urlParts[2];
              
              if (path && !path.startsWith('/')) {
                userData.cover_image = `${API_BASE_URL}/uploads/covers/${path}`;
                console.log("修复后的封面URL:", userData.cover_image);
              }
            }
          } else if (!userData.cover_image.includes("http")) {
            userData.cover_image = userData.cover_image.startsWith("/")
              ? `${API_BASE_URL}${userData.cover_image}`
              : `${API_BASE_URL}/uploads/covers/${userData.cover_image}`;
            console.log("相对路径封面URL:", userData.cover_image);
          }
        }
        
        this.user = userData;
        console.log("处理后的用户数据:", this.user);
        
        localStorage.setItem("user", JSON.stringify(this.user));
        return response.data;
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
        // 验证用户登录状态
        const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        
        if (response.status === 200) {
          // 获取最新的用户信息
          await this.fetchUserInfo();
          return true;
        }
        
        // 如果验证失败，执行登出
        this.logout();
        return false;
      } catch (error) {
        console.error("验证用户登录失败:", error);
        this.logout();
        return false;
      }
    },

    // 恢复登录状态
    async restoreLogin(token) {
      if (!token) return false;
      
      try {
        this.token = token;
        localStorage.setItem("token", token);
        
        // 获取用户信息
        const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.status === 200 && response.data) {
          this.user = response.data;
          localStorage.setItem("user", JSON.stringify(response.data));
          console.log("成功恢复用户登录状态");
          return true;
        }
        
        return false;
      } catch (error) {
        console.error("恢复登录状态失败:", error);
        this.token = null;
        localStorage.removeItem("token");
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

    async addUserPoints(amount) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/points`,
          { amount },
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );
        
        // 更新用户积分信息
        if (this.user) {
          this.user = {
            ...this.user,
            points: response.data.points || 0
          };
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        
        return response.data;
      } catch (error) {
        console.error("增加用户积分失败:", error);
        throw error.response?.data || error;
      }
    },

    // 发送邮箱验证码
    async sendEmailVerificationCode(email, type = "register") {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/send-verification-code`,
          { 
            email,
            type // 验证码用途，可以是register或resetPassword
          }
        );
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },
    
    // 使用验证码重置密码
    async resetPasswordWithVerificationCode(resetData) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/reset-password-with-code`,
          resetData
        );
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },
  },
});
