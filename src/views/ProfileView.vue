<template>
  <div class="profile-page">
    <div class="user-info-card">
      <div class="edit-profile-btn" @click="router.push('/profile/edit')">
        <el-icon><Edit /></el-icon>
        <span>编辑资料</span>
      </div>
      <el-avatar :size="64" :src="userAvatar" @error="() => true">
        {{ userAvatar }}
      </el-avatar>
      <h2>{{ username }}</h2>
      <p class="user-email">{{ email }}</p>
      <div class="user-stats">
        <div class="stat-item" @click="router.push('/following')">
          <span class="count">{{ followingCount }}</span>
          <span class="label">关注</span>
        </div>
        <div class="stat-item" @click="router.push('/followers')">
          <span class="count">{{ followersCount }}</span>
          <span class="label">粉丝</span>
        </div>
      </div>
    </div>

    <div class="menu-list">
      <div class="menu-group">
        <div
          class="menu-item"
          @click="router.push(`/user/${authStore.user?.id}/posts`)"
        >
          <el-icon><Document /></el-icon>
          <span>我的帖子</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div
          class="menu-item"
          @click="router.push(`/user/${authStore.user?.id}/likes`)"
        >
          <el-icon><Star /></el-icon>
          <span>我的点赞</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="goToSettings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="showAbout">
          <el-icon><InfoFilled /></el-icon>
          <span>关于我们</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="menu-group">
        <div class="menu-item logout" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span>退出登录</span>
        </div>
      </div>
    </div>
  </div>
  <BottomNavBar />
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useCommunityStore } from "../stores/community";
import { ElMessageBox, ElMessage } from "element-plus";
import BottomNavBar from "../components/BottomNavBar.vue";
import {
  Setting,
  InfoFilled,
  SwitchButton,
  ArrowRight,
  Document,
  Star,
  UserFilled,
  User,
  Edit,
} from "@element-plus/icons-vue";

const router = useRouter();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const API_BASE_URL = "http://47.98.210.7:3000";
const followingCount = ref(0);
const followersCount = ref(0);

const username = computed(() => authStore.user?.username || "");
const email = computed(() => authStore.user?.email || "");
const userAvatar = computed(() => authStore.userAvatar);
const userInitials = computed(() => username.value.charAt(0).toUpperCase());

const loadUserStats = async () => {
  try {
    const userId = authStore.user?.id;
    const response = await communityStore.getUserProfile(userId);
    followingCount.value = response.user.followingCount || 0;
    followersCount.value = response.user.followersCount || 0;
  } catch (error) {
    console.error("获取用户统计信息失败:", error);
  }
};

onMounted(() => {
  loadUserStats();
});

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await authStore.logout();
  } catch {
    // 用户取消退出
  }
};

const showAbout = () => {
  ElMessageBox.alert(
    "时光日历 v1.0.0\n一个简洁的移动端日程管理应用",
    "关于我们"
  );
};

const goToSettings = () => {
  router
    .push({
      name: "Settings",
      query: { from: "profile" },
    })
    .catch((err) => {
      console.error("导航错误:", err);
      ElMessage.error("页面加载失败");
    });
};

const showFollowers = () => {
  router.push("/followers");
};

const showFollowing = () => {
  router.push("/following");
};
</script>

<style scoped>
.profile-page {
  padding-bottom: 76px;
}

.user-info-card {
  background: #fff;
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.user-info-card h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.user-email {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.stat-item .count {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-item .label {
  font-size: 12px;
  color: #999;
}

.menu-list {
  padding: 0 20px;
}

.menu-group {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f2f5;
  color: #303133;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item .el-icon {
  font-size: 18px;
  color: #909399;
}

.menu-item span {
  flex: 1;
  margin-left: 12px;
  font-size: 15px;
}

.menu-item.logout {
  color: #f56c6c;
}

.menu-item.logout .el-icon {
  color: #f56c6c;
}

.edit-profile-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 20px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-profile-btn:active {
  transform: scale(0.95);
}

.edit-profile-btn .el-icon {
  font-size: 16px;
}
</style>
