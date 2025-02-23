<template>
  <div class="page-container">
    <div class="my-posts-page">
      <div class="page-header">
        <el-icon class="back-icon" @click="router.back()"
          ><ArrowLeft
        /></el-icon>
        <h2>我的帖子</h2>
      </div>

      <div class="post-list" v-if="posts.length > 0">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          @click="viewPost(post)"
        >
          <div class="post-cover" v-if="post.images && post.images.length > 0">
            <img :src="post.images[0]" :alt="post.title" />
            <span class="image-count" v-if="post.images.length > 1">
              <el-icon><Picture /></el-icon>
              {{ post.images.length }}
            </span>
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
        <el-empty description="暂无帖子" />
      </div>
    </div>
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
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
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const posts = ref([]);
const loading = ref(false);

const API_BASE_URL = "http://47.98.210.7:3000";

const loadPosts = async () => {
  try {
    loading.value = true;
    const response = await communityStore.getUserPosts(authStore.user?.id);
    posts.value = response.posts.map((post) => ({
      ...post,
      images: post.images
        ? post.images.map((img) => {
            // 处理重复的 URL 问题
            if (img.includes(`${API_BASE_URL}`)) {
              const matches = img.match(/post-[\w-]+\.\w+$/);
              if (matches) {
                return `${API_BASE_URL}/uploads/posts/${matches[0]}`;
              }
              return img.replace(/\/uploads\/posts\/+/g, "/uploads/posts/");
            }
            return `${API_BASE_URL}${img}`;
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

onMounted(() => {
  loadPosts();
});
</script>

<style scoped>
.page-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.my-posts-page {
  flex: 1;
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 76px;
  margin: 0 auto;
  overflow-y: auto;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.back-icon {
  font-size: 20px;
  color: #606266;
  cursor: pointer;
  padding: 4px;
}
.post-list {
  padding: 8px;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.post-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  margin-bottom: 8px;
}

.post-card:active {
  transform: scale(0.97);
}

.post-cover {
  position: relative;
  padding-bottom: 100%; /* 1:1 比例 */
  overflow: hidden;
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
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-content {
  padding: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.post-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.post-text {
  margin: 0;
  font-size: 12px;
  color: #606266;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.post-time {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
  margin-top: auto;
  text-align: right;
}

.post-footer {
  padding: 6px 8px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 11px;
  min-width: 32px;
}

.stat-item .el-icon {
  font-size: 14px;
}

@media screen and (max-width: 480px) {
  .post-list {
    padding: 6px;
  }

  .post-content {
    padding: 6px;
  }

  .post-title {
    font-size: 14px;
  }

  .post-text {
    font-size: 12px;
  }
}

@media screen and (min-width: 481px) {
  .post-list {
    padding: 12px;
  }

  .post-content {
    padding: 12px;
  }

  .post-title {
    font-size: 16px;
  }

  .post-text {
    font-size: 14px;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 16px;
}

.user-avatar {
  border-radius: 50%;
}

.username {
  font-size: 12px;
  color: #606266;
}

.empty-state {
  padding: 40px 0;
}
</style>
