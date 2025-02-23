<template>
  <div class="following-page">
    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>关注</h2>
    </div>

    <div class="user-list" v-if="following.length > 0">
      <div v-for="user in following" :key="user.id" class="user-item">
        <div class="user-info" @click="viewUserProfile(user.id)">
          <el-avatar
            :size="48"
            :src="getAvatarUrl(user.avatar)"
            @error="() => true"
            class="user-avatar"
          >
            {{ user.username?.charAt(0).toUpperCase() || "?" }}
          </el-avatar>
          <div class="user-meta">
            <div class="username">{{ user.username }}</div>
            <div class="bio">{{ user.bio || "这个人很懒，什么都没写~" }}</div>
          </div>
        </div>
        <el-button
          v-if="user.id !== currentUserId"
          class="follow-btn"
          type="primary"
          round
          size="small"
          :class="{ following: user.isFollowing }"
          @click="toggleFollow(user)"
        >
          {{ user.isFollowing ? "已关注" : "关注" }}
        </el-button>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无关注" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { useCommunityStore } from "../stores/community";

const API_BASE_URL = "http://47.98.210.7:3000";
const router = useRouter();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const following = ref([]);
const route = useRoute();

const currentUserId = computed(() => authStore.user?.id);

const loadFollowing = async () => {
  try {
    const userId = route.params.id || authStore.user.id;
    const response = await communityStore.getFollowing(userId);
    following.value = response.users.map((user) => ({
      ...user,
      avatar: user.avatar
        ? user.avatar.includes(`${API_BASE_URL}${API_BASE_URL}`)
          ? user.avatar.replace(API_BASE_URL, "")
          : user.avatar
        : null,
    }));
  } catch (error) {
    ElMessage.error("获取关注列表失败");
  }
};

const toggleFollow = async (user) => {
  try {
    if (user.isFollowing) {
      await communityStore.unfollowUser(user.id);
    } else {
      await communityStore.followUser(user.id);
    }
    user.isFollowing = !user.isFollowing;
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

const viewUserProfile = (userId) => {
  router.push(`/user/${userId}`);
};

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

onMounted(() => {
  loadFollowing();
});
</script>

<style scoped>
.following-page {
  min-height: 100vh;
  background: #f6f7f9;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-icon {
  font-size: 20px;
  color: #606266;
  cursor: pointer;
  padding: 4px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.user-list {
  padding: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  cursor: pointer;
}

.user-meta {
  flex: 1;
}

.username {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.bio {
  font-size: 13px;
  color: #999;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.follow-btn {
  min-width: 80px;
}

.follow-btn.following {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
  color: #606266;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

@media screen and (min-width: 768px) {
  .following-page {
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
