<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="cover-image" :style="userCoverStyle"></div>
      <div class="header-content">
        <div class="user-actions">
          <div class="action-btn settings-btn" @click="goToSettings">
            <el-icon><Setting /></el-icon>
          </div>
          <div class="action-btn edit-btn" @click="router.push('/profile/edit')">
            <el-icon><Edit /></el-icon>
            <span>编辑资料</span>
          </div>
        </div>
        <div class="user-basic-info">
          <el-avatar :size="64" :src="userAvatar" @error="() => true">
            {{ userInitials }}
          </el-avatar>
          <div class="user-id">
            <h2>{{ username }}</h2>
            <p class="uid">uid: {{ userId }}</p>
          </div>
        </div>
        <div class="user-stats">
          <div class="stat-item" @click="router.push('/following')">
            <span class="count">{{ followingCount }}</span>
            <span class="label">关注</span>
          </div>
          <div class="stat-item" @click="router.push('/followers')">
            <span class="count">{{ followersCount }}</span>
            <span class="label">粉丝</span>
          </div>
          <div class="stat-item">
            <span class="count">{{ likesCount }}</span>
            <span class="label">获赞</span>
          </div>
        </div>
        <div class="user-bio">
          <p>{{ bio }}</p>
          <div class="empty-bio" v-if="!bio">
            <el-icon><Edit /></el-icon>
            <span>添加简介</span>
          </div>
        </div>
      </div>
    </div>
    <div class="content-tabs">
      <div class="tab-item" :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">
        <el-icon><Document /></el-icon>
        <span>帖子</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'likes' }" @click="activeTab = 'likes'">
        <el-icon><Star /></el-icon>
        <span>喜欢</span>
      </div>
    </div>
    <div class="content-area">
      <template v-if="loading">
        <div class="loading-state">
          <el-skeleton :rows="3" animated />
        </div>
      </template>
      <template v-else>
        <div class="post-grid" v-if="activeTab === 'posts' && posts.length > 0">
          <div 
            class="post-item" 
            v-for="post in posts" 
            :key="post.id"
            @click="router.push(`/community/post/${post.id}`)"
          >
            <!-- 有图片的帖子 -->
            <div v-if="post.images && post.images.length > 0" class="post-item-with-image">
              <div class="post-image-container">
                <img class="post-image" :src="post.images[0]" :alt="post.title || '无标题'" />
                <div v-if="post.images.length > 1" class="image-count-badge">
                  <el-icon><Picture /></el-icon>
                  <span>{{ post.images.length }}</span>
                </div>
              </div>
              <div class="post-title">{{ post.title || '无标题' }}</div>
            </div>
            <!-- 无图片的帖子 -->
            <div v-else class="post-item-text-only">
              <div class="post-title-large">{{ post.title || '无标题' }}</div>
              <div class="post-content">{{ post.content ? (post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content) : '' }}</div>
            </div>
            <div class="post-footer">
              <div class="post-time">{{ formatTime(post.created_at) }}</div>
              <div class="likes-count">
                <el-icon><Star /></el-icon>
                <span>{{ post.likesCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="post-grid" v-if="activeTab === 'likes' && likedPosts.length > 0">
          <div 
            class="post-item" 
            v-for="post in likedPosts" 
            :key="post.id"
            @click="router.push(`/community/post/${post.id}`)"
          >
            <!-- 有图片的帖子 -->
            <div v-if="post.images && post.images.length > 0" class="post-item-with-image">
              <div class="post-image-container">
                <img class="post-image" :src="post.images[0]" :alt="post.title || '无标题'" />
                <div v-if="post.images.length > 1" class="image-count-badge">
                  <el-icon><Picture /></el-icon>
                  <span>{{ post.images.length }}</span>
                </div>
              </div>
              <div class="post-title">{{ post.title || '无标题' }}</div>
            </div>
            <!-- 无图片的帖子 -->
            <div v-else class="post-item-text-only">
              <div class="post-title-large">{{ post.title || '无标题' }}</div>
              <div class="post-content">{{ post.content ? (post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content) : '' }}</div>
            </div>
            <div class="post-footer">
              <div class="post-time">{{ formatTime(post.created_at) }}</div>
              <div class="likes-count">
                <el-icon><Star /></el-icon>
                <span>{{ post.likesCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="empty-state" v-if="activeTab === 'posts' && !posts.length">
          <el-icon><Picture /></el-icon>
          <p>暂无帖子</p>
        </div>
        <div class="empty-state" v-if="activeTab === 'likes' && !likedPosts.length">
          <el-icon><Picture /></el-icon>
          <p>暂无喜欢的帖子</p>
        </div>
      </template>
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
  Setting, InfoFilled, SwitchButton, ArrowRight,
  Document, Star, Edit, Picture, Collection
} from "@element-plus/icons-vue";
import { API_BASE_URL } from "@/config";

const router = useRouter();
const authStore = useAuthStore();
const communityStore = useCommunityStore();

// 用户数据
const followingCount = ref(0);
const followersCount = ref(0);
const likesCount = ref(0);
const posts = ref([]);
const likedPosts = ref([]);
const bio = ref('');
const activeTab = ref('posts');
const userId = ref('');
const loading = ref(false);

// 计算属性
const username = computed(() => authStore.user?.username || "");
const email = computed(() => authStore.user?.email || "");
const userAvatar = computed(() => authStore.userAvatar);
const userInitials = computed(() => {
  const name = username.value;
  return name ? name.charAt(0).toUpperCase() : '';
});
const userCoverStyle = computed(() => {
  return {
    backgroundImage: `url(${authStore.userCover})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
});

// 加载用户数据
const loadUserStats = async () => {
  try {
    const userIdValue = authStore.user?.id;
    if (!userIdValue) return;
    userId.value = userIdValue;
    
    const response = await communityStore.getUserProfile(userIdValue);
    followingCount.value = response.user.followingCount || 0;
    followersCount.value = response.user.followersCount || 0;
    bio.value = response.user.bio || '';
    
    // 加载帖子和获赞数据
    await loadUserPosts();
    await loadLikedPosts();
    
    // 计算总获赞数
    calculateTotalLikes();
  } catch (error) {
    console.error("加载用户数据失败:", error);
  }
};

// 加载用户帖子
const loadUserPosts = async () => {
  try {
    const userIdValue = authStore.user?.id;
    if (!userIdValue) return;
    
    // 使用状态变量跟踪加载状态
    loading.value = true;
    const response = await communityStore.getUserPosts(userIdValue);
    
    // 处理帖子图片路径
    posts.value = response.posts?.map(post => {
      // 确保图片路径是完整的URL
      if (post.images && post.images.length > 0) {
        post.images = post.images.map(img => {
          if (img && !img.startsWith('http')) {
            return `${API_BASE_URL}${img}`;
          }
          return img;
        });
      }
      return post;
    }) || [];
    
    console.log('加载到的帖子数量:', posts.value.length);
    console.log('第一个帖子图片:', posts.value[0]?.images);
  } catch (error) {
    console.error("加载用户帖子失败:", error);
    ElMessage.error("加载帖子失败");
  } finally {
    loading.value = false;
  }
};

// 加载喜欢的帖子
const loadLikedPosts = async () => {
  try {
    const userIdValue = authStore.user?.id;
    if (!userIdValue) return;
    
    loading.value = true;
    const response = await communityStore.getUserLikedPosts(userIdValue);
    
    // 处理帖子图片路径
    likedPosts.value = response.posts?.map(post => {
      // 确保图片路径是完整的URL
      if (post.images && post.images.length > 0) {
        post.images = post.images.map(img => {
          if (img && !img.startsWith('http')) {
            return `${API_BASE_URL}${img}`;
          }
          return img;
        });
      }
      return post;
    }) || [];
    
    console.log('加载到的喜欢帖子数量:', likedPosts.value.length);
  } catch (error) {
    console.error("加载喜欢的帖子失败:", error);
    ElMessage.error("加载喜欢的帖子失败");
  } finally {
    loading.value = false;
  }
};

// 计算总获赞数
const calculateTotalLikes = () => {
  likesCount.value = posts.value.reduce((total, post) => {
    return total + (post.likesCount || 0);
  }, 0);
};

// 前往设置页面
const goToSettings = () => {
  router.push('/settings');
};

const handleLogout = () => {
  ElMessageBox.confirm("确定要退出登录吗?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      authStore.logout();
      router.push("/login");
      ElMessage.success("已退出登录");
    })
    .catch(() => {});
};

const showAbout = () => {
  ElMessageBox.alert(
    "时光日历 v1.0.0\n一个记录美好时光的社交应用",
    "关于我们",
    { confirmButtonText: "确定" }
  );
};

const formatTime = (time) => {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

onMounted(() => {
  loadUserStats();
});
</script>

<style scoped>
.profile-page {
  padding-bottom: 76px;
  background-color: var(--bg-color);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部个人资料区域 */
.profile-header {
  position: relative;
  margin-bottom: 20px;
}

.cover-image {
  height: 150px;
  background: linear-gradient(45deg, #fe2c55, #f85e7c);
  position: relative;
  background-position: center;
  background-size: cover;
}

.header-content {
  position: relative;
  background-color: var(--card-bg);
  border-radius: 20px 20px 0 0;
  margin-top: -20px;
  padding: 20px;
  padding-top: 10px;
  box-shadow: 0 2px 10px var(--shadow-color);
}

.user-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 5px;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--timeline-bg);
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s;
}

.settings-btn {
  padding: 6px;
}

.action-btn:active {
  transform: scale(0.95);
}

.user-basic-info {
  display: flex;
  align-items: center;
  margin-top: 15px;
}

.user-id {
  margin-left: 15px;
}

.user-id h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.user-id .uid {
  margin: 0;
  font-size: 14px;
  color: var(--placeholder-color);
}

/* 用户统计数据 */
.user-stats {
  display: flex;
  justify-content: space-around;
  margin: 15px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.count {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.label {
  font-size: 14px;
  color: var(--placeholder-color);
  margin-top: 4px;
}

/* 用户简介 */
.user-bio {
  margin-top: 15px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color);
}

.empty-bio {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--placeholder-color);
  cursor: pointer;
  margin-top: 10px;
}

/* 内容标签页 */
.content-tabs {
  display: flex;
  justify-content: space-around;
  padding: 0 20px;
  background-color: var(--card-bg);
  box-shadow: 0 1px 4px var(--shadow-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  cursor: pointer;
  font-size: 14px;
  color: var(--placeholder-color);
  transition: color 0.3s;
}

.tab-item.active {
  color: var(--primary-color);
  font-weight: 500;
  position: relative;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 2px;
}

.tab-item .el-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

/* 内容区域 */
.content-area {
  background-color: var(--card-bg);
  min-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 350px); /* 调整高度计算，给顶部和底部留出空间 */
  flex: 1;
  -webkit-overflow-scrolling: touch; /* 增强iOS的滚动体验 */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--placeholder-color);
  height: 100%;
  min-height: 200px;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #dcdfe6;
}

.empty-state p {
  margin: 10px 0 20px;
  font-size: 15px;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px;
}

.post-item {
  background-color: var(--card-bg);
  border-radius: 10px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px var(--shadow-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.post-item:active {
  transform: scale(0.98);
}

.post-image-container {
  position: relative;
  width: 100%;
  height: 150px;
  background-color: var(--border-color);
  border-radius: 10px 10px 0 0;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-count-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
  display: flex;
  align-items: center;
  gap: 2px;
}

.post-title {
  margin: 0;
  padding: 10px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-color);
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.post-item-text-only {
  display: flex;
  flex-direction: column;
  padding: 10px;
  flex: 1;
}

.post-item-with-image {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.post-item-text-only .post-title-large {
  margin: 0;
  padding: 0 0 10px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.post-item-text-only .post-content {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  margin-bottom: 10px;
  flex: 1;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-top: 1px solid var(--border-color);
  width: 100%;
  background-color: var(--card-bg);
  margin-top: auto;
}

.post-time {
  font-size: 12px;
  color: var(--placeholder-color);
}

.likes-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--placeholder-color);
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .post-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 10px;
  }
  
  .post-item {
    margin-bottom: 0;
    min-height: 180px;
  }
  
  .post-item-text-only .post-title-large {
    font-size: 14px;
    padding: 0 0 5px 0;
  }
  
  .post-item-text-only .post-content {
    font-size: 12px;
    -webkit-line-clamp: 2;
    margin-bottom: 5px;
  }
  
  .post-item-with-image .post-title {
    font-size: 12px;
    padding: 5px;
  }
  
  .post-footer {
    padding: 5px 10px;
  }
  
  .post-image-container {
    height: 120px;
  }
  
  /* 移动设备滚动优化 */
  .content-area {
    max-height: calc(100vh - 300px); /* 移动设备上调整高度 */
    padding-bottom: 60px; /* 为底部导航留出空间 */
  }
}
.loading-state {
  padding: 15px;
  background-color: var(--card-bg-color);
  border-radius: 8px;
  margin: 10px;
  box-shadow: 0 1px 3px var(--shadow-color);
}
</style>