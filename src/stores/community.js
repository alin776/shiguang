import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

const API_BASE_URL = "http://47.98.210.7:3000";

const cleanupAvatarPath = (avatar) => {
  if (!avatar) return null;
  if (avatar.includes("//uploads")) {
    const matches = avatar.match(/\/uploads\/avatars\/[^/]+$/);
    return matches ? matches[0] : null;
  }
  return avatar;
};

export const useCommunityStore = defineStore("community", {
  state: () => ({
    posts: [],
    currentPost: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    },
  }),

  actions: {
    // 获取帖子列表
    async getPosts(page = 1, append = false, sort = "latest", search = "") {
      try {
        this.loading = true;
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/community/posts`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
            params: {
              page,
              limit: this.pagination.limit,
              sort,
              search: search.trim(),
            },
          }
        );

        // 处理帖子列表中的用户头像路径
        if (response.data.posts) {
          response.data.posts = response.data.posts.map((post) => ({
            ...post,
            images: post.images
              ? post.images.map((img) => `${API_BASE_URL}${img}`)
              : [],
            user: {
              ...post.user,
              avatar: post.user?.avatar
                ? `${API_BASE_URL}${cleanupAvatarPath(post.user.avatar)}`
                : null,
            },
          }));
        }

        this.pagination = response.data.pagination;
        return response.data;
      } catch (error) {
        console.error("获取帖子列表失败:", error);
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    // 获取帖子详情
    async getPost(id) {
      try {
        this.loading = true;
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/community/posts/${id}`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );

        // 处理帖子图片和用户头像路径
        if (response.data) {
          response.data = {
            ...response.data,
            images: response.data.images
              ? response.data.images.map((img) => `${API_BASE_URL}${img}`)
              : [],
            user: {
              ...response.data.user,
              avatar: response.data.user?.avatar
                ? `${API_BASE_URL}${cleanupAvatarPath(
                    response.data.user.avatar
                  )}`
                : null,
            },
          };
        }
        this.currentPost = response.data;
        return this.currentPost;
      } catch (error) {
        console.error("获取帖子详情失败:", error);
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    // 创建帖子
    async createPost(postData) {
      try {
        this.loading = true;
        const authStore = useAuthStore();
        // 构建请求数据
        const data = {
          title: postData.title,
          content: postData.content,
        };

        if (postData.images?.length) {
          // 处理已上传的图片URL
          const imageUrls = postData.images.map((file) => file.response.url);
          data.images = JSON.stringify(imageUrls);
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/community/posts`,
          data,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // 刷新帖子列表
        await this.getPosts(1);
        return response.data;
      } catch (error) {
        console.error("创建帖子失败:", error.response?.data || error);
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    // 创建评论
    async createComment(commentData) {
      try {
        this.loading = true;
        const authStore = useAuthStore();
        const response = await axios.post(
          `/api/community/posts/${commentData.postId}/comments`,
          { content: commentData.content },
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );

        return response.data;
      } catch (error) {
        console.error("创建评论失败:", error);
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    // 点赞帖子
    async likePost(postId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.post(
          `${API_BASE_URL}/api/community/posts/${postId}/like`,
          {},
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        // 返回点赞操作的结果
        return {
          success: true,
          action: response.data.action,
          message: response.data.message,
        };
      } catch (error) {
        console.error("点赞失败:", error);
        throw error.response?.data || error;
      }
    },

    // 取消点赞
    async unlikePost(postId) {
      try {
        if (!postId) {
          throw new Error("帖子ID不能为空");
        }
        const authStore = useAuthStore();
        const response = await axios.delete(
          `${API_BASE_URL}/api/community/posts/${postId}/like`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );

        return response.data;
      } catch (error) {
        console.error("取消点赞失败:", error);
        throw error.response?.data || error;
      }
    },

    // 清理状态
    clearState() {
      this.posts = [];
      this.currentPost = null;
      this.loading = false;
      this.error = null;
      this.pagination = {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    },

    // 获取我的帖子
    async getMyPosts() {
      try {
        this.loading = true;
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/community/my-posts`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("获取我的帖子失败:", error);
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    // 获取我点赞的帖子
    async getMyLikedPosts() {
      try {
        this.loading = true;
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/community/my-likes`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("获取点赞帖子失败:", error);
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    // 获取用户资料
    async getUserProfile(userId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/users/${userId}/profile`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );

        // 处理用户头像和封面图片
        if (response.data.user) {
          if (response.data.user.avatar) {
            response.data.user.avatar = `${API_BASE_URL}/uploads/avatars/${response.data.user.avatar}`;
          }
          if (response.data.user.coverImage) {
            response.data.user.coverImage = `${API_BASE_URL}/uploads/covers/${response.data.user.coverImage}`;
          }
        }

        // 处理帖子图片
        if (response.data.posts) {
          response.data.posts = response.data.posts.map((post) => ({
            ...post,
            images: post.images
              ? post.images.map((img) => `${API_BASE_URL}${img}`)
              : [],
          }));
        }

        return response.data;
      } catch (error) {
        console.error("获取用户资料失败:", error);
        throw error.response?.data || error;
      }
    },

    // 关注用户
    async followUser(userId) {
      try {
        const authStore = useAuthStore();
        console.log("发起关注请求:", userId);
        const response = await axios.post(
          `${API_BASE_URL}/api/users/${userId}/follow`,
          {},
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        console.log("关注响应:", response.data);
        return response.data;
      } catch (error) {
        console.error("关注用户失败:", error);
        throw error.response?.data || error;
      }
    },

    // 取消关注用户
    async unfollowUser(userId) {
      try {
        const authStore = useAuthStore();
        console.log("发起取消关注请求:", userId);
        const response = await axios.delete(
          `${API_BASE_URL}/api/users/${userId}/follow`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        console.log("取消关注响应:", response.data);
        return response.data;
      } catch (error) {
        console.error("取消关注失败:", error);
        throw error.response?.data || error;
      }
    },

    // 获取粉丝列表
    async getFollowers(userId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/users/${userId}/followers`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("获取粉丝列表失败:", error);
        throw error.response?.data || error;
      }
    },

    // 获取关注列表
    async getFollowing(userId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/users/${userId}/following`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("获取关注列表失败:", error);
        throw error.response?.data || error;
      }
    },

    // 上传封面图
    async uploadCoverImage(file) {
      try {
        const authStore = useAuthStore();
        const formData = new FormData();
        formData.append("cover", file);

        const response = await axios.post(
          `${API_BASE_URL}/api/users/upload-cover`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error("上传封面图失败:", error);
        throw error.response?.data || error;
      }
    },

    // 更新帖子
    async updatePost(postId, postData) {
      try {
        const authStore = useAuthStore();
        const response = await axios.put(
          `${API_BASE_URL}/api/community/posts/${postId}`,
          postData,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("更新帖子失败:", error);
        throw error.response?.data || error;
      }
    },

    // 删除帖子
    async deletePost(postId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.delete(
          `${API_BASE_URL}/api/community/posts/${postId}`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("删除帖子失败:", error);
        throw error.response?.data || error;
      }
    },

    // 更新评论
    async updateComment(postId, commentId, content) {
      try {
        const authStore = useAuthStore();
        const response = await axios.put(
          `${API_BASE_URL}/api/community/posts/${postId}/comments/${commentId}`,
          { content },
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("更新评论失败:", error);
        throw error.response?.data || error;
      }
    },

    // 删除评论
    async deleteComment(postId, commentId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.delete(
          `${API_BASE_URL}/api/community/posts/${postId}/comments/${commentId}`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("删除评论失败:", error);
        throw error.response?.data || error;
      }
    },

    // 点赞评论
    async likeComment(postId, commentId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.post(
          `${API_BASE_URL}/api/community/posts/${postId}/comments/${commentId}/like`,
          {},
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("点赞评论失败:", error);
        throw error.response?.data || error;
      }
    },

    // 取消点赞评论
    async unlikeComment(postId, commentId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.delete(
          `${API_BASE_URL}/api/community/posts/${postId}/comments/${commentId}/like`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("取消点赞评论失败:", error);
        throw error.response?.data || error;
      }
    },

    // 回复评论
    async replyToComment(postId, commentId, data) {
      try {
        const authStore = useAuthStore();
        const response = await axios.post(
          `${API_BASE_URL}/api/community/posts/${postId}/comments/${commentId}/replies`,
          data,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("回复评论失败:", error);
        throw error.response?.data || error;
      }
    },

    async getUserPosts(userId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/community/my-posts`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
            params: { userId },
          }
        );

        // 处理帖子图片和用户头像路径
        if (response.data.posts) {
          response.data.posts = response.data.posts.map((post) => ({
            ...post,
            images: post.images
              ? post.images.map((img) => {
                  // 处理重复的 URL 问题
                  if (img.includes(`${API_BASE_URL}`)) {
                    const matches = img.match(/post-[\w-]+\.\w+$/);
                    if (matches) {
                      return `${API_BASE_URL}/uploads/posts/${matches[0]}`;
                    }
                    return img.replace(
                      /\/uploads\/posts\/+/g,
                      "/uploads/posts/"
                    );
                  }
                  return `${API_BASE_URL}${img}`;
                })
              : [],
            user: {
              ...post.user,
              avatar: post.user?.avatar
                ? `${API_BASE_URL}${cleanupAvatarPath(post.user.avatar)}`
                : null,
            },
          }));
        }

        return response.data;
      } catch (error) {
        console.error("获取用户帖子失败:", error);
        throw error.response?.data || error;
      }
    },

    async getUserLikedPosts(userId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/community/my-likes`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
            params: { userId },
          }
        );

        // 处理帖子图片和用户头像路径
        if (response.data.posts) {
          response.data.posts = response.data.posts.map((post) => ({
            ...post,
            images: post.images
              ? post.images.map((img) => {
                  // 处理重复的 URL 问题
                  if (img.includes(`${API_BASE_URL}`)) {
                    const matches = img.match(/post-[\w-]+\.\w+$/);
                    if (matches) {
                      return `${API_BASE_URL}/uploads/posts/${matches[0]}`;
                    }
                    return img.replace(
                      /\/uploads\/posts\/+/g,
                      "/uploads/posts/"
                    );
                  }
                  return `${API_BASE_URL}${img}`;
                })
              : [],
            user: {
              ...post.user,
              avatar: post.user?.avatar
                ? `${API_BASE_URL}${cleanupAvatarPath(post.user.avatar)}`
                : null,
            },
          }));
        }

        return response.data;
      } catch (error) {
        console.error("获取用户点赞帖子失败:", error);
        throw error.response?.data || error;
      }
    },
  },
});
