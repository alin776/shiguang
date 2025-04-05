import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";
import { API_BASE_URL, API_ENDPOINTS } from "@/config";
import { getAvatarUrl, getImageUrl, getDefaultAvatarUrl } from "@/utils/imageHelpers";

export const useCommunityStore = defineStore("community", {
  state: () => ({
    posts: [],
    currentPost: null,
    categories: [],
    loading: false,
    categoriesLoading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    },
  }),

  actions: {
    // 获取所有分类
    async getCategories() {
      try {
        this.categoriesLoading = true;
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/categories`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        this.categories = response.data;
        return response.data;
      } catch (error) {
        console.error("获取分类失败:", error);
        this.error = error.response?.data?.message || "获取分类失败";
        throw error;
      } finally {
        this.categoriesLoading = false;
      }
    },
    
    // 获取帖子列表
    async getPosts(page = 1, append = false, sort = "latest", search = "", categoryId = null) {
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
              category_id: categoryId
            },
          }
        );

        // 处理帖子列表中的用户头像路径
        if (response.data.posts) {
          // 找出浏览量最高的5篇帖子，标记为热门
          const topViewPosts = [...response.data.posts]
            .sort((a, b) => b.views - a.views)
            .slice(0, 5)
            .map(post => post.id);
            
          response.data.posts = response.data.posts.map((post) => ({
            ...post,
            isHot: topViewPosts.includes(post.id), // 标记热门帖子
            images: post.images
              ? post.images.map((img) => getImageUrl(img))
              : [],
            user: {
              ...post.user,
              avatar: post.user?.avatar ? getAvatarUrl(post.user.avatar) : null,
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
        // 检查ID是否有效
        if (!id) {
          console.error("获取帖子详情失败: 帖子ID未提供");
          return null;
        }
        
        this.loading = true;
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/community/posts/${id}`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );

        // 添加调试信息输出
        console.log("API返回的原始帖子数据:", response.data);
        
        // 检查API返回的数据格式
        if (!response.data) {
          console.error("API返回的数据为空");
          return { title: "数据加载失败", content: "无法获取帖子内容" };
        }
        
        // 特别检查标题字段
        console.log("API返回的标题字段:", {
          值: response.data.title,
          类型: typeof response.data.title,
          是否为空: response.data.title === "",
          是否未定义: response.data.title === undefined,
          是否为null: response.data.title === null
        });
        
        // 处理数据 - 创建一个新对象而不是修改原始对象
        let processedData = {
          id: response.data.id || id,
          title: "无标题", // 默认标题
          content: response.data.content || "",
          created_at: response.data.created_at || new Date().toISOString(),
          updated_at: response.data.updated_at || new Date().toISOString(),
          comments: Array.isArray(response.data.comments) ? response.data.comments : [],
          likes: response.data.likes || 0,
          views: response.data.views || 0,
          is_liked: response.data.is_liked || false,
          images: []
        };
        
        // 确保正确设置帖子标题
        if (response.data.title !== undefined && response.data.title !== null) {
          processedData.title = response.data.title.trim() || "无标题";
        }
        
        // 处理图片数据
        if (Array.isArray(response.data.images)) {
          processedData.images = response.data.images.map(img => getImageUrl(img));
        }
        
        // 处理用户数据，确保用户称号和帖子标题不混淆
        if (response.data.user) {
          processedData.user = {
            ...response.data.user,
            // 确保用户称号不会被错误地覆盖
            title: response.data.user.title || null,
            avatar: response.data.user.avatar ? getAvatarUrl(response.data.user.avatar) : null
          };
        }
        
        // 合并其他剩余字段
        processedData = { ...response.data, ...processedData };
        
        // 最终检查确保标题存在
        if (!processedData.title) {
          processedData.title = "无标题";
        }
        
        console.log("处理后的帖子数据:", processedData);
        console.log("最终处理后的标题:", processedData.title);
        
        this.currentPost = processedData;
        return this.currentPost;
      } catch (error) {
        console.error("获取帖子详情失败:", error);
        // 返回错误状态的对象，而不是抛出错误
        return { 
          title: "加载失败", 
          content: "无法获取帖子内容，请稍后再试", 
          error: error.message || "未知错误" 
        };
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

        // 添加分类ID
        if (postData.category_id) {
          data.category_id = postData.category_id;
        }

        if (postData.images?.length) {
          // 处理已上传的图片URL
          const imageUrls = postData.images.map((file) => file.response.url);
          data.images = JSON.stringify(imageUrls);
        }

        // 添加音频数据
        if (postData.audio) {
          data.audio = postData.audio;
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
    async createComment(postId, content, audio = null, images = null) {
      try {
        this.loading = true;
        const authStore = useAuthStore();
        const data = { content };
        
        // 添加音频数据
        if (audio) {
          data.audio = audio;
        }
        
        // 添加图片数据
        if (images && images.length > 0) {
          data.images = images;
        }
        
        const response = await axios.post(
          `${API_BASE_URL}/api/community/posts/${postId}/comments`,
          data,
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
          reachedLikeLimit: response.data.reachedLikeLimit
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
            response.data.user.avatar = getAvatarUrl(response.data.user.avatar);
          }
          
          // 修复封面图片处理逻辑
          // 1. 优先使用cover_image字段（后端返回的字段名称）
          // 2. 如果cover_image存在且不为null，将其值赋给coverImage字段
          if (response.data.user.cover_image) {
            response.data.user.coverImage = getImageUrl(response.data.user.cover_image);
          } else if (response.data.user.coverImage) {
            response.data.user.coverImage = getImageUrl(response.data.user.coverImage);
          }
          
          // 添加调试日志
          console.log("用户封面图数据:", {
            原始cover_image: response.data.user.cover_image,
            处理后的coverImage: response.data.user.coverImage
          });
        }

        // 处理帖子图片
        if (response.data.posts) {
          response.data.posts = response.data.posts.map((post) => ({
            ...post,
            images: post.images
              ? post.images.map((img) => getImageUrl(img))
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
        const response = await axios.delete(
          `${API_BASE_URL}/api/community/posts/${postId}/comments/${commentId}`,
          {
            headers: {
              Authorization: `Bearer ${useAuthStore().token}`,
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error("删除评论失败:", error);
        throw error;
      }
    },

    // 删除回复
    async deleteReply(replyId) {
      try {
        console.log(`正在删除回复，参数: replyId=${replyId}`);

        const response = await axios.delete(
          `${API_BASE_URL}/api/community/replies/${replyId}`,
          {
            headers: {
              Authorization: `Bearer ${useAuthStore().token}`,
            },
          }
        );

        return response.data;
      } catch (error) {
        console.error("删除回复失败:", error);
        throw error;
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
    async replyToComment(postId, commentId, content, replyToId = null, audio = null, images = null) {
      try {
        const authStore = useAuthStore();
        const data = {
          content,
          replyToId,
        };
        
        // 添加音频数据
        if (audio) {
          data.audio = audio;
        }
        
        // 添加图片数据
        if (images && images.length > 0) {
          data.images = images;
        }
        
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
              ? post.images.map((img) => getImageUrl(img))
              : [],
            user: {
              ...post.user,
              avatar: post.user?.avatar ? getAvatarUrl(post.user.avatar) : null,
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
              ? post.images.map((img) => getImageUrl(img))
              : [],
            user: {
              ...post.user,
              avatar: post.user?.avatar ? getAvatarUrl(post.user.avatar) : null,
            },
          }));
        }

        return response.data;
      } catch (error) {
        console.error("获取用户点赞帖子失败:", error);
        throw error.response?.data || error;
      }
    },

    // 获取用户点赞的帖子ID列表
    async getUserLikes() {
      try {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) {
          console.log('用户未登录，无法获取点赞历史');
          return { likedPosts: [] };
        }
        
        // 使用已有的my-likes接口
        const response = await axios.get(
          `${API_BASE_URL}/api/community/my-likes`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        
        // 从返回的帖子列表中提取ID
        const likedPostIds = response.data.posts ? 
          response.data.posts.map(post => post.id) : [];
        
        console.log('从服务器获取的点赞历史:', likedPostIds);
        return { likedPosts: likedPostIds };
      } catch (error) {
        console.error("获取用户点赞历史失败:", error);
        // 出错时返回空数组，不中断流程
        return { likedPosts: [] };
      }
    },

    // 举报帖子
    async reportPost(postId, reason, detail = "") {
      try {
        const authStore = useAuthStore();
        let reportData = {
          reason: reason
        };
        
        if (detail) {
          reportData.reason = `${reason}: ${detail}`;
        }
        
        const response = await axios.post(
          `${API_BASE_URL}/api/community/posts/${postId}/report`,
          reportData,
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        return response.data;
      } catch (error) {
        console.error("举报帖子失败:", error);
        throw error;
      }
    },
    
    // 举报评论
    async reportComment(commentId, reason, detail = "") {
      try {
        const authStore = useAuthStore();
        let reportData = {
          reason: reason
        };
        
        if (detail) {
          reportData.reason = `${reason}: ${detail}`;
        }
        
        const response = await axios.post(
          `${API_BASE_URL}/api/community/comments/${commentId}/report`,
          reportData,
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        return response.data;
      } catch (error) {
        console.error("举报评论失败:", error);
        throw error;
      }
    },

    // 添加系统公告相关方法
    async getAnnouncements() {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(`${API_BASE_URL}/api/announcements`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        
        return response.data;
      } catch (error) {
        console.error("获取公告列表失败:", error);
        throw error;
      }
    },

    async getAnnouncementById(id) {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(`${API_BASE_URL}/api/announcements/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        
        return response.data;
      } catch (error) {
        console.error("获取公告详情失败:", error);
        throw error;
      }
    },

    async createAnnouncement(data) {
      try {
        const authStore = useAuthStore();
        const response = await axios.post(
          `${API_BASE_URL}/api/announcements`,
          data,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        
        return response.data;
      } catch (error) {
        console.error("创建公告失败:", error);
        throw error.response?.data || error;
      }
    },

    async updateAnnouncement(id, data) {
      try {
        const authStore = useAuthStore();
        const response = await axios.put(
          `${API_BASE_URL}/api/announcements/${id}`,
          data,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        
        return response.data;
      } catch (error) {
        console.error("更新公告失败:", error);
        throw error.response?.data || error;
      }
    },

    async deleteAnnouncement(id) {
      try {
        const authStore = useAuthStore();
        await axios.delete(`${API_BASE_URL}/api/announcements/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        
        return { success: true };
      } catch (error) {
        console.error("删除公告失败:", error);
        throw error.response?.data || error;
      }
    },

    // 获取论坛统计数据
    async getForumStats() {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(`${API_BASE_URL}/api/forum/stats`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        
        return response.data;
      } catch (error) {
        console.error("获取论坛统计数据失败:", error);
        // 返回默认值，避免页面出错
        return {
          topics: 0,
          posts: 0,
          daily: 0
        };
      }
    },

    // 获取活动列表
    async getActivities() {
      try {
        console.log("开始请求活动列表数据");
        const authStore = useAuthStore();
        const activitiesEndpoint = API_ENDPOINTS.ACTIVITIES?.LIST || "/api/activities";
        console.log("请求活动列表的端点:", `${API_BASE_URL}${activitiesEndpoint}`);
        
        const response = await axios.get(`${API_BASE_URL}${activitiesEndpoint}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        
        console.log("活动列表API响应:", response);
        
        // 检查响应结构
        if (response.data) {
          console.log("活动列表数据:", response.data);
          return response.data;
        } else {
          console.log("API返回了空数据");
          return { activities: [] };
        }
      } catch (error) {
        console.error("获取活动列表失败:", error);
        console.error("错误详情:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        // 返回空数据而不是抛出错误，防止页面崩溃
        return { activities: [] };
      }
    },

    // 获取帖子的评论列表
    async getPostComments(postId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/community/posts/${postId}/comments`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("获取评论列表失败:", error);
        throw error.response?.data || error;
      }
    },
    
    // 根据评论ID获取评论详情（包括所属帖子ID）
    async getCommentById(commentId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/community/comments/${commentId}`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("获取评论详情失败:", error);
        throw error.response?.data || error;
      }
    },

    // 获取分类统计信息
    async getCategoryStats() {
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/categories/stats`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        return response.data;
      } catch (error) {
        console.error("获取分类统计数据失败:", error);
        // 如果API不存在，返回空数据
        return [];
      }
    },
  },
});
