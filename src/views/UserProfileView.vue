<template>
  <div class="user-profile-page">
    <!-- 页面主体内容 -->
    <div class="profile-container">
      <!-- 顶部导航栏 -->
      <div class="top-nav">
        <el-button class="back-btn" circle @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div class="right-action">
          <el-button v-if="isOwnProfile" circle @click="editProfile">
            <el-icon><More /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 用户信息卡片 -->
      <div class="user-card">
        <!-- 用户基本信息区 -->
        <div 
          class="user-info-container"
          :style="{
            backgroundImage: `url(${getCoverUrl(userProfile.coverImage)})`,
          }"
        >
          <div class="user-info-overlay">
            <!-- 头像和用户名区域 -->
            <div class="avatar-row">
              <div class="avatar-container">
                <el-avatar
                  :size="70"
                  :src="getAvatarUrl(userProfile.avatar)"
                  @error="() => true"
                  class="profile-avatar"
                >
                  {{ userProfile.username?.charAt(0).toUpperCase() || "?" }}
                </el-avatar>
              </div>
              
              <div class="username-action-container">
                <div class="username-container">
                  <div class="username-badges-row">
                    <h1 class="username">{{ userProfile.username }}</h1>
                    <div class="user-badges">
                      <div class="level-tag">Lv.{{ userProfile.level || 1 }}</div>
                      <span 
                        v-if="userProfile.title" 
                        class="user-title-inline"
                        :class="getTitleClass(userProfile.title)"
                      >{{ userProfile.title }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="action-btn-container" v-if="!isOwnProfile">
                  <el-button
                    class="follow-btn"
                    round
                    type="primary"
                    @click="toggleFollow"
                  >
                    {{ isFollowing ? "已关注" : "关注" }}
                  </el-button>
                  <el-button
                    class="message-btn"
                    round
                    type="info"
                    @click="startPrivateChat"
                  >
                    <el-icon><ChatDotRound /></el-icon>
                    私聊
                  </el-button>
                </div>
              </div>
            </div>
            
            <!-- 用户签名/简介 -->
            <div class="bio-container">
              <p class="bio">{{ userProfile.bio || "这个人很懒，什么都没写~" }}</p>
            </div>
            
            <!-- 用户统计信息 -->
            <div class="stats-container">
              <div class="stat-group">
                <span class="count">{{ totalLikes || 0 }}</span>
                <span class="label">获赞</span>
              </div>
              <div class="stat-group hover-effect" @click="showFollowing">
                <span class="count">{{ userProfile.followingCount || 0 }}</span>
                <span class="label">关注</span>
              </div>
              <div class="stat-group hover-effect" @click="showFollowers">
                <span class="count">{{ userProfile.followersCount || 0 }}</span>
                <span class="label">粉丝</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 帖子标题 -->
      <div class="section-header">
        <h2 class="section-title">发布的帖子</h2>
      </div>
      
      <!-- 帖子列表 -->
      <div class="posts-list" v-if="posts.length > 0">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          @click="viewPost(post)"
        >
          <!-- 帖子图片 -->
          <div class="post-cover" v-if="post.images?.length">
            <img :src="getImageUrl(post.images[0])" :alt="post.title" />
            <div class="image-count" v-if="post.images.length > 1">
              <el-icon><Picture /></el-icon>
              {{ post.images.length }}
            </div>
          </div>

          <!-- 帖子内容 -->
          <div class="post-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-text">{{ post.content }}</p>
            <div class="post-meta">
              <div class="post-stats">
                <span class="stats-item">
                  <el-icon><View /></el-icon>
                  {{ post.views || 0 }}
                </span>
                <span class="stats-item">
                  <el-icon><Star /></el-icon>
                  {{ post.likes || 0 }}
                </span>
              </div>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 无帖子时显示 -->
      <div v-else class="empty-state">
        <el-empty description="暂无帖子" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  More,
  Picture,
  View,
  Star,
  Check,
  Ticket,
  ChatDotRound
} from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/auth";
import { useCommunityStore } from "@/stores/community";
import { usePrivateChatStore } from "@/stores/privateChat";
import BottomNavBar from "@/components/BottomNavBar.vue";
import axios from "axios";
import { getAvatarUrl, getImageUrl } from "@/utils/imageHelpers";
import formatTime from "@/utils/formatTime";
import { API_BASE_URL } from "@/config";
import { useUnmountDetection } from "../composables/useUnmountDetection";
import SpaceBackground from "./calendar/components/SpaceBackground.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const privateChatStore = usePrivateChatStore();
const { isMounted, checkMounted } = useUnmountDetection();

const userProfile = ref({});
const posts = ref([]);
const isFollowing = ref(false);
const defaultCover = "/default-cover.jpg";
const totalLikes = ref(0);

const isOwnProfile = computed(() => {
  return authStore.user?.id === userProfile.value?.id;
});

const userAvatar = computed(() => authStore.userAvatar);

const loadUserProfile = async () => {
  try {
    if (!checkMounted()) return;
    const userId = route.params.id;
    const response = await communityStore.getUserProfile(userId);
    userProfile.value = {
      ...response.user,
      followersCount: Number(response.user.followersCount),
      followingCount: Number(response.user.followingCount),
      postsCount: Number(response.user.postsCount),
      coverImage: response.user.coverImage,
      level: response.user.level || 1
    };
    posts.value = response.posts;
    isFollowing.value = response.user.isFollowing;
    
    // 计算总获赞数
    calculateTotalLikes();

    console.log("完整的用户数据:", userProfile.value);
    console.log("完整的帖子数据:", posts.value);
  } catch (error) {
    if (!checkMounted()) return;
    ElMessage.error("获取用户资料失败");
  }
};

// 计算总获赞数
const calculateTotalLikes = () => {
  // 计算所有帖子的获赞数总和
  totalLikes.value = posts.value.reduce((total, post) => {
    // 使用likes_count或likes
    const likeCount = post.likes_count || post.likes || 0;
    return total + Number(likeCount);
  }, 0);
};

const toggleFollow = async () => {
  try {
    // 检查是否是自己
    if (userProfile.value.id === authStore.user?.id) {
      ElMessage.warning("不能关注自己");
      return;
    }

    if (isFollowing.value) {
      // 显示确认对话框
      await ElMessageBox.confirm("确定要取消关注吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
    }

    if (isFollowing.value) {
      await communityStore.unfollowUser(userProfile.value.id);
      console.log("取消关注后重新加载");
      ElMessage.success("已取消关注");
    } else {
      await communityStore.followUser(userProfile.value.id);
      console.log("关注后重新加载");
      ElMessage.success("关注成功");
    }
    isFollowing.value = !isFollowing.value;
    // 重新加载用户资料以获取最新数据
    await loadUserProfile();
  } catch (error) {
    if (error === "cancel") return; // 用户取消操作
    if (!checkMounted()) return;
    ElMessage.error(error.message || "操作失败");
  }
};

const viewPost = (post) => {
  router.push(`/community/post/${post.id}`);
};

const editProfile = () => {
  router.push("/settings");
};

const showFollowers = () => {
  router.push(`/user/${userProfile.value.id}/followers`);
};

const showFollowing = () => {
  router.push(`/user/${userProfile.value.id}/following`);
};

const handleCoverSuccess = (response) => {
  userProfile.value.coverImage = response.coverImage;
  ElMessage.success("封面图上传成功");
};

const beforeCoverUpload = (file) => {
  const isJPGorPNG = file.type === "image/jpeg" || file.type === "image/png";
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPGorPNG) {
    ElMessage.error("封面图只能是 JPG 或 PNG 格式!");
  }
  if (!isLt2M) {
    ElMessage.error("封面图大小不能超过 2MB!");
  }
  return isJPGorPNG && isLt2M;
};

// 获取用户封面图片URL
const getCoverUrl = (cover) => {
  if (!cover) return defaultCover;
  return getImageUrl(cover);
};

// 根据称号名称返回对应的样式类
const getTitleClass = (title) => {
  if (!title) return '';
  
  if (title === '云步官方') {
    return 'title-official';
  } else if (title === '持之以恒') {
    return 'title-persistent';
  } else if (title === '巅峰大神') {
    return 'title-master';
  } else if (title === '总版主') {
    return 'title-head-admin';
  }
  
  return '';
};

const startPrivateChat = async () => {
  try {
    const userId = route.params.id;
    // 创建或获取与该用户的私聊会话
    const chatId = await privateChatStore.createChat(userId);
    // 跳转到私聊页面
    router.push(`/private-chat/${chatId}`);
  } catch (error) {
    ElMessage.error('创建私聊失败');
    console.error('创建私聊错误:', error);
  }
};

onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
/* 页面基本样式 */
.user-profile-page {
  background-color: #f8f9fa;
  min-height: 100vh;
  width: 100%;
  padding-bottom: 24px;
  position: relative;
}

.profile-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
  position: relative;
}

/* 顶部导航 */
.top-nav {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  z-index: 100;
}

.back-btn {
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  color: #333;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
}

.right-action {
  display: flex;
  gap: 8px;
}

/* 用户卡片 */
.user-card {
  background-color: transparent;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* 用户信息容器 */
.user-info-container {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 0;
  position: relative;
  border-radius: 12px;
}

/* 用户信息覆盖层 */
.user-info-overlay {
  background: linear-gradient(to bottom, 
    rgba(255,255,255,0) 0%, 
    rgba(255,255,255,0) 30%,
    rgba(255,255,255,0.5) 60%, 
    rgba(255,255,255,0.95) 90%);
  padding: 80px 16px 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

/* 头像行 */
.avatar-row {
  display: flex;
  margin-bottom: 16px;
  margin-top: auto;
}

/* 头像容器 */
.avatar-container {
  margin-right: 15px;
  flex-shrink: 0;
}

.profile-avatar {
  border: 3px solid #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 70px;
  height: 70px;
}

/* 用户名和操作按钮容器 */
.username-action-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; /* 确保flex子元素可以正确收缩 */
}

/* 用户名和等级 */
.username-container {
  width: 100%;
  min-width: 0;
  margin-bottom: 8px;
}

.username-badges-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}

/* 用户名样式 */
.username {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

/* 用户徽章容器 */
.user-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px; /* 稍微下移一点，但保持靠近用户名 */
}

.level-tag {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 1px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  font-style: italic;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  white-space: nowrap;
}

/* 用户称号样式 */
.user-title-inline {
  font-size: 0.7rem;
  color: #333;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.3px;
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  max-width: 100%;
  overflow: visible;
}

/* 官方称号 - 金色 */
.title-official {
  color: #6d4b2f !important;
  background-color: #f8d66d !important;
  border: 1px solid #e3b748 !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5) !important;
  letter-spacing: 0.5px !important;
}

/* 持之以恒称号 - 绿色 */
.title-persistent {
  color: #2c5e2e !important;
  background-color: #a8e2aa !important;
  border: 1px solid #56c158 !important;
  font-weight: 600 !important;
  letter-spacing: 0.4px !important;
}

/* 巅峰大神称号 - 红色 */
.title-master {
  color: #ffffff !important;
  background-color: #e74c3c !important;
  border: 1px solid #c0392b !important;
  font-weight: 600 !important;
  letter-spacing: 0.4px !important;
}

/* 总版主称号 - 紫色到粉色渐变 */
.title-head-admin {
  color: #ffffff !important;
  background: linear-gradient(to right, #8e44ad, #ff79c6) !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  letter-spacing: 0.5px !important;
}

/* 操作按钮 */
.action-btn-container {
  display: flex;
  justify-content: flex-start;
  margin-top: 6px;
}

.follow-btn {
  min-width: 80px;
  font-weight: 500;
  border-radius: 30px;
  font-size: 14px;
  padding: 6px 12px;
  background-color: #10b981;
  border-color: #10b981;
}

.follow-btn:hover {
  background-color: #059669;
  border-color: #059669;
}

.message-btn {
  min-width: 80px;
  font-weight: 500;
  border-radius: 30px;
  font-size: 14px;
  padding: 6px 12px;
  background-color: #10b981;
  border-color: #10b981;
}

.message-btn:hover {
  background-color: #059669;
  border-color: #059669;
}

/* 简介容器 */
.bio-container {
  margin-bottom: 20px;
  background-color: rgba(247, 247, 247, 0.8);
  padding: 12px;
  border-radius: 10px;
  backdrop-filter: blur(5px);
}

.bio {
  font-size: 14px;
  color: #303133;
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

/* 统计信息 */
.stats-container {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: none;
}

.stat-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  text-align: center;
  position: relative;
}

.hover-effect {
  cursor: pointer;
}

.hover-effect:hover .count {
  color: #10b981;
}

.count {
  font-size: 22px;
  font-weight: 700;
  color: #000;
  line-height: 1.2;
}

.label {
  font-size: 14px;
  color: #606266;
  margin-top: 6px;
}

/* 帖子部分 */
.section-header {
  margin: 24px 16px 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 帖子列表 */
.posts-list {
  padding: 0 16px;
}

.post-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.post-cover {
  position: relative;
  padding-bottom: 56%;
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
  right: 10px;
  top: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  color: #666;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.post-content {
  padding: 16px;
  text-align: left;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #333;
  text-align: left;
}

.post-text {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: left;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.post-stats {
  display: flex;
  gap: 12px;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-time {
  color: #999;
}

/* 无内容状态 */
.empty-state {
  padding: 40px 0;
  background-color: #fff;
  border-radius: 12px;
  margin: 16px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
}

/* 响应式布局 */
@media screen and (min-width: 768px) {
  .profile-container {
    max-width: 700px;
  }
  
  .post-card {
    margin-bottom: 20px;
  }
  
  .post-content {
    padding: 20px;
  }
  
  .post-title {
    font-size: 18px;
  }
}
</style>
