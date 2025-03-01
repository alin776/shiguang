<template>
  <div class="following-page">
    <SpaceBackground />

    <div class="page-header tech-card">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2 class="cosmic-text">关注</h2>
    </div>

    <div class="user-list" v-if="following.length > 0">
      <div
        v-for="user in following"
        :key="user.id"
        class="user-item tech-card enhanced-border"
      >
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
            <div class="username cosmic-text">{{ user.username }}</div>
            <div class="bio">{{ user.bio || "这个人很懒，什么都没写~" }}</div>
          </div>
        </div>
        <el-button
          v-if="user.id !== currentUserId"
          class="follow-btn glow-button"
          round
          size="small"
          :class="{ following: user.isFollowing }"
          @click="toggleFollow(user)"
        >
          {{ user.isFollowing ? "已关注" : "关注" }}
        </el-button>
      </div>
    </div>

    <div v-else class="empty-state tech-card">
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
import SpaceBackground from "./calendar/components/SpaceBackground.vue";

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
  background: rgba(18, 18, 30, 0.9);
  color: white;
  position: relative;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgba(30, 30, 40, 0.7);
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(147, 51, 234, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.back-icon {
  font-size: 20px;
  color: white;
  cursor: pointer;
  padding: 4px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  flex: 1;
  text-align: center;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

.user-list {
  padding: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(30, 30, 40, 0.6);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(147, 51, 234, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.user-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(147, 51, 234, 0.3);
  border-color: rgba(147, 51, 234, 0.4);
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
  border-radius: 8px;
  background: linear-gradient(
    45deg,
    rgba(56, 189, 248, 0.6),
    rgba(147, 51, 234, 0.6)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
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
  color: white;
  margin-bottom: 4px;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

.cosmic-text {
  background: linear-gradient(45deg, #38bdf8, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.4);
}

.bio {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.follow-btn {
  min-width: 80px;
  background: linear-gradient(45deg, #8b5cf6, #d946ef);
  border: none;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(147, 51, 234, 0.4);
  transition: all 0.3s ease;
  color: white;
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

.empty-state {
  padding: 40px 0;
  text-align: center;
  background: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  margin: 16px 8px;
  border: 1px solid rgba(147, 51, 234, 0.2);
}

@media screen and (min-width: 768px) {
  .following-page {
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
