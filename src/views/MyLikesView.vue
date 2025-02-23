<template>
  <div class="page-container">
    <div class="my-likes-page">
      <div class="page-header">
        <el-icon class="back-icon" @click="router.back()"
          ><ArrowLeft
        /></el-icon>
        <h2>我的点赞</h2>
      </div>

      <div class="post-list" v-if="posts.length > 0">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          @click="viewPost(post)"
        >
          <div class="post-cover" v-if="post.images?.length">
            <img
              :src="getImageUrl(post.images[0])"
              :alt="post.title || '帖子图片'"
            />
            <div class="image-count" v-if="post.images.length > 1">
              <el-icon><Picture /></el-icon>
              {{ post.images.length }}
            </div>
          </div>

          <div class="post-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-text">{{ post.content }}</p>
            <p class="post-time">{{ formatTime(post.created_at) }}</p>
          </div>

          <div class="post-footer">
            <div class="user-info">
              <el-avatar
                :size="24"
                :src="post.user?.avatar"
                class="user-avatar"
              >
                {{ post.user?.username?.charAt(0) || "?" }}
              </el-avatar>
              <span class="username">{{
                post.user?.username || "匿名用户"
              }}</span>
            </div>
            <div class="post-stats">
              <span class="stat-item">
                <el-icon><View /></el-icon>
                <span>{{ post.views || 0 }}</span>
              </span>
              <span class="stat-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ post.comments_count || 0 }}</span>
              </span>
              <span class="stat-item">
                <el-icon><Star /></el-icon>
                <span>{{ post.likes || 0 }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <el-empty description="暂无点赞" />
      </div>
    </div>
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Picture,
  View,
  ChatDotRound,
  Star,
} from "@element-plus/icons-vue";
import BottomNavBar from "../components/BottomNavBar.vue";
import { useCommunityStore } from "../stores/community";
import { formatTime } from "../utils/time";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const posts = ref([]);
const loading = ref(false);

const API_BASE_URL = "http://47.98.210.7:3000";

const loadPosts = async () => {
  try {
    loading.value = true;
    const response = await communityStore.getUserLikedPosts(authStore.user?.id);
    posts.value = response.posts.map((post) => ({
      ...post,
      images: post.images
        ? post.images.map((img) => {
            // 处理重复的 URL 问题
            if (img.includes(`${API_BASE_URL}`)) {
              const matches = img.match(/post-[\w-]+\.\w+$/);
              if (matches) {
                return `/uploads/posts/${matches[0]}`; // 只保存相对路径
              }
              return img.replace(/\/uploads\/posts\/+/g, "/uploads/posts/");
            }
            return img;
          })
        : [],
      user: {
        ...post.user,
        avatar: post.user?.avatar
          ? post.user.avatar.includes(`${API_BASE_URL}${API_BASE_URL}`)
            ? post.user.avatar.replace(API_BASE_URL, "")
            : post.user.avatar
          : null,
      },
    }));
  } catch (error) {
    console.error("获取帖子失败:", error);
    ElMessage.error("获取帖子失败");
  } finally {
    loading.value = false;
  }
};

const viewPost = (post) => {
  router.push(`/community/post/${post.id}`);
};

// 修改获取图片 URL 的方法
const getImageUrl = (image) => {
  if (!image) return "";
  // 如果已经是完整路径，直接返回
  if (image.startsWith("http")) return image;
  // 添加 API_BASE_URL 前缀
  return `${API_BASE_URL}${image}`; // 在显示时添加完整路径
};

onMounted(() => {
  loadPosts();
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f6f7f9;
  text-align: left;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  overflow-y: auto;
}

.my-likes-page {
  padding-bottom: 76px;
  position: relative;
  min-height: 100vh;
}

/* 顶部导航栏 */
.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.back-icon {
  font-size: 20px;
  color: #333;
  padding: 4px;
  margin-right: 8px;
}

.page-header h2 {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  flex: 1;
  text-align: center;
  margin: 0;
}

/* 帖子列表 */
.post-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 帖子卡片 */
.post-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
  cursor: pointer;
}

.post-card:active {
  transform: scale(0.98);
}

/* 帖子封面 */
.post-cover {
  position: relative;
  padding-top: 56.25%; /* 16:9 比例 */
  background: #f5f5f5;
}

.post-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-count {
  position: absolute;
  right: 8px;
  top: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 帖子内容 */
.post-content {
  padding: 16px;
  flex: 1;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-text {
  font-size: 13px;
  color: #666;
  margin: 8px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: right;
}

/* 帖子底部 */
.post-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
}

.username {
  font-size: 13px;
  color: #666;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 12px;
  min-width: 48px;
}

.stat-item .el-icon {
  font-size: 16px;
  color: #999;
}

/* 空状态 */
.empty-state {
  padding: 40px 16px;
  text-align: center;
  color: #999;
}

/* 响应式设计 */
@media screen and (min-width: 768px) {
  .page-container {
    position: relative;
    height: auto;
  }

  .my-likes-page {
    max-width: 768px;
    margin: 0 auto;
    position: relative;
    height: auto;
    min-height: 100vh;
  }

  .post-list {
    padding: 16px;
    gap: 16px;
  }

  .post-content {
    padding: 20px;
  }

  .post-title {
    font-size: 18px;
  }

  .post-text {
    font-size: 14px;
    margin: 12px 0;
  }

  .post-footer {
    padding: 16px 20px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container {
    background: #1a1a1a;
  }

  .page-header {
    background: #242424;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .page-header h2 {
    color: #fff;
  }

  .back-icon {
    color: #fff;
  }

  .post-card {
    background: #242424;
  }

  .post-title {
    color: #fff;
  }

  .post-text {
    color: #999;
  }

  .post-footer {
    border-top-color: #333;
  }

  .stat-item {
    color: #999;
  }
}
</style>
