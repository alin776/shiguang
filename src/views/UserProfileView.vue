<template>
  <TheNavBar />
  <div class="user-profile-page">
    <!-- 背景图和用户信息 -->
    <div class="profile-header">
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
            class="follow-btn"
            type="primary"
            round
            :class="{ following: isFollowing }"
            @click="toggleFollow"
          >
            <el-icon v-if="isFollowing"><Check /></el-icon>
            {{ isFollowing ? "已关注" : "关注" }}
          </el-button>
        </div>

        <h1 class="username">{{ userProfile.username }}</h1>
        <p class="bio">{{ userProfile.bio || "这个人很懒，什么都没写~" }}</p>

        <div class="stats-bar">
          <div class="stat-item hover-effect" @click="showFollowers">
            <span class="count">{{ userProfile.followersCount || 0 }}</span>
            <span class="label">粉丝</span>
          </div>
          <div class="divider"></div>
          <div class="stat-item hover-effect" @click="showFollowing">
            <span class="count">{{ userProfile.followingCount || 0 }}</span>
            <span class="label">关注</span>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <span class="count">{{ userProfile.postsCount || 0 }}</span>
            <span class="label">帖子</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 帖子列表 -->
    <div class="posts-container">
      <h2 class="section-title">发布的帖子</h2>
      <div class="post-list" v-if="posts.length > 0">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          @click="viewPost(post)"
        >
          <div class="post-cover" v-if="post.images?.length">
            <img :src="getImageUrl(post.images[0])" :alt="post.title" />
            <div class="image-count" v-if="post.images.length > 1">
              <el-icon><Picture /></el-icon>
              {{ post.images.length }}
            </div>
          </div>

          <div class="post-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-text">{{ post.content }}</p>
            <div class="post-meta">
              <div class="post-stats">
                <span class="stat-item">
                  <el-icon><View /></el-icon>
                  {{ post.views || 0 }}
                </span>
                <span class="stat-item">
                  <el-icon><Star /></el-icon>
                  {{ post.likes || 0 }}
                </span>
              </div>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

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
} from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { useCommunityStore } from "../stores/community";
import TheNavBar from "../components/TheNavBar.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const communityStore = useCommunityStore();

const userProfile = ref({});
const posts = ref([]);
const isFollowing = ref(false);
const defaultCover = "/default-cover.jpg";

// 添加 API_BASE_URL 常量
const API_BASE_URL = "http://47.98.210.7:3000";

const isOwnProfile = computed(() => {
  return authStore.user?.id === userProfile.value?.id;
});

const userAvatar = computed(() => authStore.userAvatar);

const loadUserProfile = async () => {
  try {
    const userId = route.params.id;
    const response = await communityStore.getUserProfile(userId);
    userProfile.value = {
      ...response.user,
      followersCount: Number(response.user.followersCount),
      followingCount: Number(response.user.followingCount),
      postsCount: Number(response.user.postsCount),
      coverImage: response.user.coverImage
        ? response.user.coverImage.includes(`${API_BASE_URL}${API_BASE_URL}`)
          ? response.user.coverImage.replace(API_BASE_URL, "")
          : response.user.coverImage
        : null,
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

// 修改 getAvatarUrl 函数，确保正确处理头像 URL
const getAvatarUrl = (avatar) => {
  if (!avatar) return "";

  // 处理重复的 URL 问题
  if (avatar.includes(`${API_BASE_URL}/uploads/avatars/`)) {
    // 提取实际的文件名
    const matches = avatar.match(/avatar-[\w-]+\.\w+$/);
    if (matches) {
      return `${API_BASE_URL}/uploads/avatars/${matches[0]}`;
    }
  }

  // 如果是以 http 开头的完整 URL，直接返回
  if (avatar.startsWith("http")) return avatar;

  // 否则，添加 API_BASE_URL 前缀
  return `${API_BASE_URL}/uploads/avatars/${avatar}`;
};

// 添加获取图片 URL 的方法
const getImageUrl = (image) => {
  if (!image) return "";

  // 处理重复的 URL 问题
  if (image.includes(`${API_BASE_URL}`)) {
    // 提取实际的文件名
    const matches = image.match(/post-[\w-]+\.\w+$/);
    if (matches) {
      return `${API_BASE_URL}/uploads/posts/${matches[0]}`;
    }
  }

  // 如果是以 http 开头的完整 URL，直接返回
  if (image.startsWith("http")) return image;

  // 否则，添加 API_BASE_URL 前缀
  return `${API_BASE_URL}/uploads/posts/${image}`;
};

// 添加背景图处理函数
const getCoverUrl = (cover) => {
  if (!cover) return defaultCover;

  // 处理重复的 URL 问题
  if (cover.includes(`${API_BASE_URL}/uploads/covers/`)) {
    const matches = cover.match(/cover-[\w-]+\.\w+$/);
    if (matches) {
      return `${API_BASE_URL}/uploads/covers/${matches[0]}`;
    }
  }

  // 如果是以 http 开头的完整 URL
  if (cover.startsWith("http")) {
    // 修复重复的 API_BASE_URL
    if (cover.includes(`${API_BASE_URL}${API_BASE_URL}`)) {
      return cover.replace(API_BASE_URL, "");
    }
    return cover;
  }

  // 如果是相对路径，添加完整路径
  return `${API_BASE_URL}/uploads/covers/${cover}`;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
.user-profile-page {
  padding-top: 60px;
  min-height: 100vh;
  background: #f6f7f9;
  overflow-y: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
}

.profile-header {
  position: relative;
  background: #fff;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.cover-image {
  height: 240px;
  background-size: cover;
  background-position: center;
  position: relative;
  background-color: #f5f7fa;
}

.header-actions {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
}

.back-icon,
.header-actions .el-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  font-size: 18px;
}

.cover-upload {
  position: absolute;
  bottom: 16px;
  right: 16px;
}

.user-info {
  padding: 0 24px 28px;
  margin-top: -44px;
  position: relative;
  text-align: center;
}

.avatar-wrapper {
  margin-bottom: 16px;
  position: relative;
  display: inline-block;
}

.profile-avatar {
  border: 4px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.follow-btn {
  position: absolute;
  right: -88px;
  bottom: 8px;
  padding: 8px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.follow-btn.following {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
  color: #606266;
}

.follow-btn .el-icon {
  margin-right: 4px;
}

.username {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.bio {
  font-size: 15px;
  color: #666;
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
  border-top: 1px solid #f0f2f5;
  max-width: 400px;
  margin: 0 auto;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: #f0f2f5;
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
  color: #333;
}

.stat-item .label {
  font-size: 13px;
  color: #8c8c8c;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px;
  padding: 0 16px;
}

.posts-container {
  padding: 16px 8px;
  max-width: 600px;
  margin: 0 auto;
}

.post-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
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
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-content {
  padding: 16px;
}

.post-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #333;
}

.post-text {
  font-size: 15px;
  color: #666;
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
  color: #8c8c8c;
  gap: 4px;
}

.post-time {
  font-size: 13px;
  color: #999;
}

.empty-state {
  padding: 48px 0;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  margin: 16px 8px;
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
