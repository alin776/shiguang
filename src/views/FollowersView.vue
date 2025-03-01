<template>
  <div class="followers-page">
    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>粉丝</h2>
    </div>

    <div class="user-list" v-if="followers.length > 0">
      <div v-for="user in followers" :key="user.id" class="user-item">
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
      <el-empty description="暂无粉丝" />
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

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const followers = ref([]);

const currentUserId = computed(() => authStore.user?.id);

const API_BASE_URL = "http://47.98.210.7:3000";

const getAvatarUrl = (avatar) => {
  if (!avatar) return "";

  if (avatar.includes(`${API_BASE_URL}/uploads/avatars/`)) {
    const matches = avatar.match(/avatar-[\w-]+\.\w+$/);
    if (matches) {
      return `${API_BASE_URL}/uploads/avatars/${matches[0]}`;
    }
  }

  if (avatar.startsWith("http")) return avatar;

  return `${API_BASE_URL}/uploads/avatars/${avatar}`;
};

const loadFollowers = async () => {
  try {
    const userId = route.params.id || authStore.user.id;
    const response = await communityStore.getFollowers(userId);
    followers.value = response.users.map((user) => ({
      ...user,
      avatar: user.avatar
        ? user.avatar.includes(`${API_BASE_URL}${API_BASE_URL}`)
          ? user.avatar.replace(API_BASE_URL, "")
          : user.avatar
        : null,
    }));
  } catch (error) {
    ElMessage.error("获取粉丝列表失败");
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

onMounted(() => {
  loadFollowers();
});
</script>

<style scoped>
.followers-page {
  padding-top: 60px;
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
  .followers-page {
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
