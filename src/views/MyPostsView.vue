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
            <div class="like-area">
              <el-icon class="like-icon"><Star /></el-icon>
              <span class="like-count">{{ post.likes || 0 }}</span>
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
  background: linear-gradient(135deg, #f8f9fa, #f1f3f5);
}

.my-posts-page {
  flex: 1;
  min-height: 100vh;
  padding-bottom: 0;
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  text-align: center;
  color: #2c3e50;
}

.back-icon {
  font-size: 20px;
  color: #2c3e50;
  cursor: pointer;
  padding: 4px;
}

.post-list {
  padding: 12px;
  padding-bottom: 70px;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.post-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  margin-bottom: 16px;
  border: none;
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.post-card:active {
  transform: scale(0.98);
}

.post-cover {
  position: relative;
  padding-bottom: 70%; /* 更宽屏的比例 */
  overflow: hidden;
}

.post-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.post-card:hover .post-cover img {
  transform: scale(1.08);
}

.image-count {
  position: absolute;
  right: 12px;
  top: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.post-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.post-text {
  margin: 0;
  font-size: 14px;
  color: #34495e;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.post-time {
  margin: 4px 0 0;
  font-size: 12px;
  color: #95a5a6;
  margin-top: auto;
  text-align: right;
}

.post-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(236, 240, 241, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(248, 249, 250, 0.5);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid #fff;
}

.username {
  font-size: 13px;
  color: #2c3e50;
  font-weight: 500;
  max-width: 130px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.like-area {
  display: flex;
  align-items: center;
  gap: 2px;
  background-color: rgba(240, 240, 240, 0.8);
  padding: 4px 10px 4px 8px;
  border-radius: 16px;
  position: relative;
  transition: all 0.2s ease;
}

.like-area:hover {
  background-color: rgba(236, 240, 241, 0.9);
}

.like-icon {
  color: #e74c3c;
  font-size: 14px;
  margin-right: 3px;
}

.like-count {
  font-size: 13px;
  color: #2c3e50;
  font-weight: 600;
  line-height: 1;
  min-width: 8px;
  text-align: left;
}

.empty-state {
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
  min-height: 200px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  margin: 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
}
</style>
