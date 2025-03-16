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
            <div class="like-area">
              <el-icon class="like-icon"><Star /></el-icon>
              <span class="like-count">{{ post.likes || 0 }}</span>
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
  background: linear-gradient(135deg, #f8f9fa, #f1f3f5);
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
  padding-bottom: 0;
  position: relative;
  min-height: 100vh;
}

/* 顶部导航栏 */
.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.back-icon {
  font-size: 20px;
  color: #2c3e50;
  padding: 4px;
  margin-right: 8px;
  cursor: pointer;
}

.page-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  text-align: center;
  margin: 0;
}

/* 帖子列表 */
.post-list {
  padding: 16px;
  padding-bottom: 70px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 帖子卡片 */
.post-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.post-card:active {
  transform: scale(0.98);
}

/* 帖子封面 */
.post-cover {
  position: relative;
  padding-top: 60%;
  background: #f5f5f5;
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
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 帖子内容 */
.post-content {
  padding: 16px;
  flex: 1;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-text {
  font-size: 14px;
  color: #34495e;
  margin: 8px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-time {
  font-size: 12px;
  color: #95a5a6;
  margin-top: 8px;
  text-align: right;
}

/* 帖子底部 */
.post-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(236, 240, 241, 0.8);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(248, 249, 250, 0.5);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
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

/* 空状态 */
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
  text-align: center;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container {
    background: linear-gradient(135deg, #1a1a1a, #2c3e50);
  }

  .page-header {
    background: #2c3e50;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .page-header h2 {
    color: #ecf0f1;
  }

  .back-icon {
    color: #ecf0f1;
  }

  .post-card {
    background: #34495e;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .post-title {
    color: #ecf0f1;
  }

  .post-text {
    color: #bdc3c7;
  }

  .post-footer {
    border-top-color: rgba(52, 73, 94, 0.5);
    background-color: rgba(44, 62, 80, 0.8);
  }

  .like-area {
    background-color: rgba(41, 128, 185, 0.3);
  }

  .like-count {
    color: #ecf0f1;
  }
  
  .like-area:hover {
    background-color: rgba(41, 128, 185, 0.4);
  }
  
  .username {
    color: #ecf0f1;
  }
  
  .post-time {
    color: #bdc3c7;
  }
  
  .empty-state {
    background-color: rgba(52, 73, 94, 0.8);
    color: #ecf0f1;
  }
}
</style>
