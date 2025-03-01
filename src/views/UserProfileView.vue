<template>
  <div class="user-profile-page">
    <!-- 添加宇宙粒子背景 -->
    <SpaceBackground />

    <!-- 背景图和用户信息 -->
    <div class="profile-header tech-card enhanced-border">
      <div
        class="cover-image"
        :style="{
          backgroundImage: `url(${getCoverUrl(userProfile.coverImage)})`,
        }"
      >
        <div class="header-actions">
          <el-icon class="back-icon" @click="router.back()"
            ><ArrowLeft
          /></el-icon>
          <el-icon v-if="isOwnProfile" @click="editProfile"><More /></el-icon>
        </div>
      </div>

      <div class="user-info">
        <div class="avatar-wrapper">
          <el-avatar
            :size="88"
            :src="getAvatarUrl(userProfile.avatar)"
            @error="() => true"
            class="profile-avatar"
          >
            {{ userProfile.username?.charAt(0).toUpperCase() || "?" }}
          </el-avatar>
          <el-button
            v-if="!isOwnProfile"
            class="follow-btn glow-button"
            round
            :class="{ following: isFollowing }"
            @click="toggleFollow"
          >
            <el-icon v-if="isFollowing"><Check /></el-icon>
            {{ isFollowing ? "已关注" : "关注" }}
          </el-button>
        </div>

        <h1 class="username cosmic-text">{{ userProfile.username }}</h1>
        <p class="bio">{{ userProfile.bio || "这个人很懒，什么都没写~" }}</p>

        <div class="stats-bar enhanced-gradient">
          <div class="stat-item hover-effect" @click="showFollowers">
            <span class="count cosmic-number">{{
              userProfile.followersCount || 0
            }}</span>
            <span class="label">粉丝</span>
          </div>
          <div class="divider"></div>
          <div class="stat-item hover-effect" @click="showFollowing">
            <span class="count cosmic-number">{{
              userProfile.followingCount || 0
            }}</span>
            <span class="label">关注</span>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <span class="count cosmic-number">{{
              userProfile.postsCount || 0
            }}</span>
            <span class="label">帖子</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 帖子列表 -->
    <div class="posts-container tech-container">
      <h2 class="section-title cosmic-text">发布的帖子</h2>
      <div class="post-list" v-if="posts.length > 0">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card tech-card"
          @click="viewPost(post)"
        >
          <div class="post-cover" v-if="post.images?.length">
            <img :src="getImageUrl(post.images[0])" :alt="post.title" />
            <div class="image-count tech-badge" v-if="post.images.length > 1">
              <el-icon><Picture /></el-icon>
              {{ post.images.length }}
            </div>
          </div>

          <div class="post-content">
            <h3 class="post-title cosmic-title">{{ post.title }}</h3>
            <p class="post-text">{{ post.content }}</p>
            <div class="post-meta">
              <div class="post-stats">
                <span class="stat-item cosmic-stat">
                  <el-icon><View /></el-icon>
                  {{ post.views || 0 }}
                </span>
                <span class="stat-item cosmic-stat">
                  <el-icon><Star /></el-icon>
                  {{ post.likes || 0 }}
                </span>
              </div>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state tech-card">
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
} from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/auth";
import { useCommunityStore } from "@/stores/community";
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
const { isMounted, checkMounted } = useUnmountDetection();

const userProfile = ref({});
const posts = ref([]);
const isFollowing = ref(false);
const defaultCover = "/default-cover.jpg";

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
    };
    posts.value = response.posts;
    isFollowing.value = response.user.isFollowing;

    // 添加详细的打印信息
    console.log("用户头像:", {
      avatar: userProfile.value.avatar,
      fullUrl: getAvatarUrl(userProfile.value.avatar),
    });

    console.log(
      "帖子图片:",
      posts.value.map((post) => ({
        postId: post.id,
        images: post.images,
        fullUrls: post.images?.map((img) => getImageUrl(img)),
      }))
    );

    console.log("完整的用户数据:", userProfile.value);
    console.log("完整的帖子数据:", posts.value);
  } catch (error) {
    if (!checkMounted()) return;
    ElMessage.error("获取用户资料失败");
  }
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

onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
.user-profile-page {
  min-height: 100vh;
  background: rgba(18, 18, 30, 0.9);
  color: white;
  position: relative;
}

.profile-header {
  background: rgba(30, 30, 40, 0.7);
  position: relative;
  z-index: 2;
  overflow: hidden;
}

/* 宇宙科技风格卡片 */
.tech-card {
  background: rgba(30, 30, 40, 0.7);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.enhanced-border {
  position: relative;
  z-index: 0;
}

.enhanced-border::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  padding: 2px;
  border-radius: 16px;
  background: linear-gradient(
    45deg,
    rgba(56, 189, 248, 0.6),
    rgba(147, 51, 234, 0.6)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.cover-image {
  height: 180px;
  background-size: cover;
  background-position: center;
  position: relative;
  background-color: rgba(20, 20, 30, 0.8);
}

.header-actions {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  z-index: 5;
}

.back-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.4);
}

.user-info {
  position: relative;
  margin-top: -44px;
  padding: 0 16px 20px;
  text-align: center;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
}

.profile-avatar {
  border: 4px solid rgba(30, 30, 40, 0.8);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 15px rgba(147, 51, 234, 0.6);
  transition: all 0.3s ease;
}

.profile-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.8);
}

.follow-btn {
  position: absolute;
  right: 20px;
  top: 0;
  min-width: 90px;
  background: linear-gradient(45deg, #8b5cf6, #d946ef);
  border: none;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(147, 51, 234, 0.4);
  transition: all 0.3s ease;
}

.follow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(147, 51, 234, 0.6);
}

.follow-btn.following {
  background: rgba(147, 51, 234, 0.2);
  color: white;
  border: 1px solid rgba(147, 51, 234, 0.4);
}

.follow-btn .el-icon {
  margin-right: 4px;
}

.username {
  font-size: 24px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
}

.cosmic-text {
  background: linear-gradient(45deg, #38bdf8, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.4);
}

.cosmic-number {
  font-weight: bold;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

.cosmic-title {
  color: white;
  text-shadow: 0 0 6px rgba(147, 51, 234, 0.5);
}

.bio {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px;
  line-height: 1.6;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.stats-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid rgba(147, 51, 234, 0.3);
  max-width: 400px;
  margin: 0 auto;
}

.enhanced-gradient {
  background: linear-gradient(
    to right,
    rgba(30, 30, 40, 0.5),
    rgba(56, 189, 248, 0.1),
    rgba(30, 30, 40, 0.5)
  );
  border-radius: 8px;
  padding: 12px;
  box-shadow: inset 0 0 10px rgba(147, 51, 234, 0.2);
}

.divider {
  width: 1px;
  height: 24px;
  background-color: rgba(147, 51, 234, 0.3);
  margin: 0 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.hover-effect {
  cursor: pointer;
  transition: transform 0.2s;
}

.hover-effect:hover {
  transform: translateY(-2px);
}

.stat-item .count {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.stat-item .label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: white;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
  margin: 0 0 16px;
  padding: 0 16px;
}

.posts-container {
  padding: 16px 8px;
  max-width: 600px;
  margin: 0 auto;
}

.tech-container {
  position: relative;
  z-index: 1;
}

.post-card {
  background: rgba(30, 30, 40, 0.6);
  border: 1px solid rgba(147, 51, 234, 0.2);
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(147, 51, 234, 0.3);
  border-color: rgba(147, 51, 234, 0.4);
}

.post-cover {
  position: relative;
  padding-bottom: 75%;
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
  background: rgba(147, 51, 234, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
}

.tech-badge {
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.post-content {
  padding: 16px;
}

.post-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 8px;
  color: white;
}

.post-text {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.post-stats .stat-item {
  flex-direction: row;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  gap: 4px;
}

.cosmic-stat {
  transition: all 0.3s ease;
}

.cosmic-stat:hover {
  color: rgba(147, 51, 234, 0.9);
  transform: translateY(-1px);
}

.post-time {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-state {
  padding: 48px 0;
  text-align: center;
  background: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  margin: 16px 8px;
  border: 1px solid rgba(147, 51, 234, 0.2);
}

:deep(.nav-bar) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

@media screen and (min-width: 768px) {
  .user-profile-page {
    max-width: 800px;
    margin: 0 auto;
    padding-bottom: 40px;
    position: relative;
    height: auto;
    min-height: 100vh;
  }

  .posts-container {
    padding: 24px 16px;
  }
}
</style>
