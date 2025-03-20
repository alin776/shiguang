<template>
  <div class="followers-page page-container">
    <div class="page-header">
      <el-button class="back-btn" circle @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h2 class="page-title">粉丝</h2>
    </div>

    <div class="user-list" v-if="followers.length > 0">
      <div
        v-for="user in followers"
        :key="user.id"
        class="user-item"
        @click="viewUserProfile(user.id)"
      >
        <div class="user-info">
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
          round
          size="small"
          :type="user.isFollowing ? 'info' : 'primary'"
          @click.stop="toggleFollow(user)"
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
import SpaceBackground from "./calendar/components/SpaceBackground.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const followers = ref([]);

const currentUserId = computed(() => authStore.user?.id);

const API_BASE_URL = "http://47.98.210.7:3000";
const LOCAL_URL = "http://localhost:3000";

const getAvatarUrl = (avatar) => {
  if (!avatar) return "";

  if (avatar.includes(LOCAL_URL)) {
    return avatar.replace(LOCAL_URL, API_BASE_URL);
  }

  if (avatar.includes(`${API_BASE_URL}${API_BASE_URL}`)) {
    return avatar.replace(`${API_BASE_URL}${API_BASE_URL}`, API_BASE_URL);
  }

  if (avatar.startsWith("http")) return avatar;

  if (avatar.startsWith("/")) {
    return `${API_BASE_URL}${avatar}`;
  }

  return `${API_BASE_URL}/uploads/avatars/${avatar}`;
};

const loadFollowers = async () => {
  try {
    const userId = route.params.id || authStore.user.id;
    const response = await communityStore.getFollowers(userId);
    
    followers.value = response.users.map((user) => {
      let avatarUrl = user.avatar;
      
      if (avatarUrl && avatarUrl.includes(LOCAL_URL)) {
        avatarUrl = avatarUrl.replace(LOCAL_URL, API_BASE_URL);
      }
      
      if (avatarUrl && avatarUrl.includes(`${API_BASE_URL}${API_BASE_URL}`)) {
        avatarUrl = avatarUrl.replace(`${API_BASE_URL}${API_BASE_URL}`, API_BASE_URL);
      }
      
      return {
        ...user,
        avatar: avatarUrl
      };
    });
    
    console.log("加载粉丝列表成功:", followers.value);
  } catch (error) {
    console.error("获取粉丝列表失败:", error);
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
  min-height: 100vh;
  background: #f8f9fa;
  color: #333;
  position: relative;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.back-btn {
  color: #333;
  background-color: rgba(0, 0, 0, 0.02);
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  text-align: center;
  color: #333;
}

.user-list {
  padding: 12px 16px;
  max-width: 600px;
  margin: 0 auto;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #ffffff;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.user-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.08);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.user-avatar {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 2px solid #fff;
}

.user-meta {
  flex: 1;
}

.username {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.bio {
  font-size: 13px;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.follow-btn {
  min-width: 80px;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.follow-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.empty-state {
  padding: 40px 0;
  background: #ffffff;
  border-radius: 12px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  margin: 20px auto;
}

@media screen and (max-width: 768px) {
  .user-list {
    padding: 12px;
  }

  .user-item {
    padding: 12px 14px;
  }
}
</style>
