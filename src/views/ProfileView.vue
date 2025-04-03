<template>
  <div class="profile-page">
    <div class="profile-header" :style="userCoverStyle">
      <div class="header-content">
        <div class="user-basic-info">
          <el-avatar :size="64" :src="userAvatar" @error="() => true" class="user-avatar">
            {{ userInitials }}
          </el-avatar>
          <div class="user-id">
            <div class="username-title">
              <h2>{{ username }}</h2>
              <span 
                class="user-title-inline" 
                :class="getTitleClass(userTitle)" 
                @click="goToTitleGuide"
              >{{ userTitle || "暂无称号" }}</span>
            </div>
            <div class="uid-points-row">
              <p class="uid">uid: {{ userId }}</p>
            </div>
          </div>
        </div>
        <div class="user-stats">
          <div class="stat-item" @click="router.push('/following')">
            <span class="count following-count">{{ followingCount }}</span>
            <span class="label">关注</span>
          </div>
          <div class="stat-item" @click="router.push('/followers')">
            <span class="count followers-count">{{ followersCount }}</span>
            <span class="label">粉丝</span>
          </div>
          <div class="stat-item">
            <span class="count likes-received-count">{{ totalLikesCount }}</span>
            <span class="label">获赞</span>
          </div>
          <div class="stat-item posts" @click="navigateToUserPosts(userId)">
            <span class="count">{{ postsCount }}</span>
            <span class="label">帖子</span>
          </div>
          <div class="stat-item points" @click="navigateToPoints">
            <span class="count points-count">{{ userPoints || 0 }}</span>
            <span class="label">积分</span>
          </div>
        </div>

        <!-- 用户经验和等级区域 -->
        <div class="user-experience">
          <div class="exp-header">
            <div class="level-tag">Lv {{ userLevel }}</div>
            <div class="exp-text">{{ currentExp }}/{{ expNeeded }}</div>
          </div>
          <div class="exp-bar-container">
            <div class="exp-bar" :style="{ width: `${expProgress}%` }"></div>
          </div>
        </div>

        <div class="user-bio">
          <p>{{ bio || "很好看呢" }}</p>
          <div class="empty-bio" v-if="!bio">
            <el-icon><Edit /></el-icon>
            <span>添加简介</span>
          </div>
        </div>
        
        <!-- 用户操作按钮 -->
        <div class="user-actions-row">
          <div class="action-btn" @click="goToSettings">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </div>
          <div
            class="action-btn"
            @click="router.push('/profile/edit')"
          >
            <el-icon><Edit /></el-icon>
            <span>编辑资料</span>
          </div>
          <div
            class="action-btn"
            @click="router.push('/task-center')"
          >
            <el-icon><List /></el-icon>
            <span>任务中心</span>
          </div>
          <div
            class="action-btn"
            @click="router.push('/note/submit')"
          >
            <el-icon><EditPen /></el-icon>
            <span>小记投稿</span>
          </div>
        </div>
        <!-- 第二行按钮 -->
        <div class="user-actions-row">
          <div
            class="action-btn"
            @click="router.push('/activities')"
          >
            <el-icon><Calendar /></el-icon>
            <span>最新活动</span>
          </div>
          <div
            class="action-btn"
            @click="navigateToPoints"
          >
            <el-icon><Goods /></el-icon>
            <span>积分兑换</span>
          </div>
          <div
            class="action-btn"
            @click="router.push('/points/history')"
          >
            <el-icon><Tickets /></el-icon>
            <span>积分明细</span>
          </div>
          <div
            class="action-btn"
            @click="router.push('/games/card-game')"
          >
            <el-icon><TrendCharts /></el-icon>
            <span>抽卡游戏</span>
          </div>
        </div>
      </div>
    </div>
    <div class="content-tabs">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'posts' }"
        @click="activeTab = 'posts'"
      >
        <el-icon><Document /></el-icon>
        <span>帖子</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'likes' }"
        @click="activeTab = 'likes'"
      >
        <el-icon><Star /></el-icon>
        <span>喜欢</span>
      </div>
    </div>
    <div class="content-area" @scroll="handleScroll">
      <template v-if="loading">
        <div class="loading-state">
          <el-skeleton :rows="3" animated />
        </div>
      </template>
      <template v-else>
        <!-- 帖子列表 -->
        <div class="post-grid" v-if="activeTab === 'posts' && posts.length > 0">
          <div 
            class="post-item"
            v-for="post in posts"
            :key="post.id"
            @click="router.push(`/community/post/${post.id}`)"
          >
            <!-- 有图片的帖子 -->
            <div
              v-if="post.images && post.images.length > 0"
              class="post-item-with-image"
            >
              <div class="post-image-container">
                <img
                  class="post-image"
                  :src="post.images[0]"
                  :alt="post.title || '无标题'"
                  loading="lazy"
                />
                <div v-if="post.images.length > 1" class="image-count-badge">
                  <el-icon><Picture /></el-icon>
                  <span>{{ post.images.length }}</span>
                </div>
              </div>
              <div class="post-title">{{ post.title || "无标题" }}</div>
            </div>
            <!-- 无图片的帖子 -->
            <div v-else class="post-item-text-only">
              <div class="post-title-large">{{ post.title || "无标题" }}</div>
              <div class="post-content">
                {{
                  post.content
                    ? post.content.length > 50
                      ? post.content.substring(0, 50) + "..."
                      : post.content
                    : ""
                }}
              </div>
            </div>
            <div class="post-footer">
              <div class="user-info">
                <el-avatar
                  :size="24"
                  :src="post.user?.avatar"
                  @error="() => true"
                  class="user-avatar"
                >
                  {{ post.user?.username?.charAt(0) || "?" }}
                </el-avatar>
                <span class="username">{{ post.user?.username || "匿名用户" }}</span>
              </div>
              <div class="like-area">
                <el-icon class="like-icon"><Star /></el-icon>
                <span class="like-count">{{ post.likes_count || post.likesCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 喜欢的帖子 -->
        <div
          class="post-grid"
          v-if="activeTab === 'likes' && likedPosts.length > 0"
        >
          <div
            class="post-item"
            v-for="post in likedPosts"
            :key="post.id"
            @click="router.push(`/community/post/${post.id}`)"
          >
            <!-- 有图片的帖子 -->
            <div
              v-if="post.images && post.images.length > 0"
              class="post-item-with-image"
            >
              <div class="post-image-container">
                <img
                  class="post-image"
                  :src="post.images[0]"
                  :alt="post.title || '无标题'"
                  loading="lazy"
                />
                <div v-if="post.images.length > 1" class="image-count-badge">
                  <el-icon><Picture /></el-icon>
                  <span>{{ post.images.length }}</span>
                </div>
              </div>
              <div class="post-title">{{ post.title || "无标题" }}</div>
            </div>
            <!-- 无图片的帖子 -->
            <div v-else class="post-item-text-only">
              <div class="post-title-large">{{ post.title || "无标题" }}</div>
              <div class="post-content">
                {{
                  post.content
                    ? post.content.length > 50
                      ? post.content.substring(0, 50) + "..."
                      : post.content
                    : ""
                }}
              </div>
            </div>
            <div class="post-footer">
              <div class="user-info">
                <el-avatar
                  :size="24"
                  :src="post.user?.avatar"
                  @error="() => true"
                  class="user-avatar"
                >
                  {{ post.user?.username?.charAt(0) || "?" }}
                </el-avatar>
                <span class="username">{{ post.user?.username || "匿名用户" }}</span>
              </div>
              <div class="like-area">
                <el-icon class="like-icon"><Star /></el-icon>
                <span class="like-count">{{ post.likes_count || post.likesCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="activeTab === 'posts' && !posts.length">
          <el-icon><Picture /></el-icon>
          <p>暂无帖子</p>
        </div>
        <div
          class="empty-state"
          v-if="activeTab === 'likes' && !likedPosts.length"
        >
          <el-icon><Picture /></el-icon>
          <p>暂无喜欢的帖子</p>
        </div>
      </template>
    </div>
  </div>
  <BottomNavBar />
</template>

<script setup>
import {
  Setting,
  InfoFilled,
  SwitchButton,
  ArrowRight,
  Document,
  Star,
  Edit,
  Picture,
  Collection,
  EditPen,
  List,
  Calendar,
  Goods,
  TrendCharts,
  Tickets,
} from "@element-plus/icons-vue";
import BottomNavBar from "../components/BottomNavBar.vue";
import useProfileLogic from "../mine/js/profile.js";
import "../mine/css/profile.css";
import { useRouter } from "vue-router";
import { onMounted, ref, computed } from "vue";

// 使用抽取的逻辑
const {
  followingCount,
  followersCount,
  postsCount,
  posts,
  likedPosts,
  bio,
  activeTab,
  userId,
  loading,
  totalLikesCount,
  username,
  userAvatar,
  userInitials,
  userCoverStyle,
  userLevel,
  currentExp,
  expNeeded,
  expProgress,
  goToSettings,
  handleLogout,
  showAbout,
  formatTime,
  userTitle,
  userPoints,
} = useProfileLogic();

const router = useRouter();

// 处理滚动事件
const handleScroll = (e) => {
  // 可以用于实现上拉加载更多
  const { scrollHeight, scrollTop, clientHeight } = e.target;
  if (scrollHeight - scrollTop - clientHeight < 50) {
    // 在这里可以添加加载更多的逻辑
  }
};

// 预加载背景图片
const preloadCoverImage = () => {
  if (userCoverStyle?.backgroundImage) {
    const img = new Image();
    img.src = userCoverStyle.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1');
  }
};

onMounted(() => {
  preloadCoverImage();
});

// 根据称号名称返回对应的样式类
const getTitleClass = (title) => {
  if (!title) return '';
  
  if (title === '云步官方') {
    return 'title-official';
  } else if (title === '持之以恒') {
    return 'title-persistent';
  } else if (title === '巅峰大神') {
    return 'title-master';
  }
  
  return '';
};

// 跳转到称号指南页面
const goToTitleGuide = () => {
  router.push('/title-guide');
};

// 跳转到积分兑换页面
const navigateToPoints = () => {
  router.push('/points/exchange');
};
</script>

<style scoped>
.action-btn.submit-note-btn {
  background-color: #e74c3c;
  color: white;
}

.action-btn.submit-note-btn:hover {
  background-color: #c0392b;
}

.action-btn.task-center-btn {
  background-color: #3498db;
  color: white;
}

.action-btn.task-center-btn:hover {
  background-color: #2980b9;
}

@media (prefers-color-scheme: dark) {
  .action-btn.submit-note-btn {
    background-color: #e74c3c;
    color: #ecf0f1;
  }
  
  .action-btn.submit-note-btn:hover {
    background-color: #c0392b;
  }
  
  .action-btn.task-center-btn {
    background-color: #3498db;
    color: #ecf0f1;
  }
  
  .action-btn.task-center-btn:hover {
    background-color: #2980b9;
  }
}

.username-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-title-inline {
  font-size: 0.85rem;
  color: #333;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.3px;
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}

.user-title-inline:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
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
  font-weight: 700 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  letter-spacing: 0.6px !important;
}

/* 总版主称号 - 紫色到粉色渐变 */
.title-head-admin {
  color: #ffffff !important;
  background: linear-gradient(to right, #8e44ad, #ff79c6) !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  letter-spacing: 0.5px !important;
}

.user-id h2 {
  margin: 0 0 5px;
  font-size: 1.5rem;
  font-weight: 600;
}

.uid-points-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.uid {
  margin: 0;
  font-size: 0.8rem;
  color: #888;
  padding-left: 2px;
}

.points {
  margin: 0;
  font-size: 0.8rem;
  color: #f56c6c;
  font-weight: 500;
}

@media (prefers-color-scheme: dark) {
  .user-title-inline {
    color: #ccc;
    background-color: #333;
  }
  
  /* 暗黑模式下的官方称号 - 金色 */
  .title-official {
    color: #f8d66d !important;
    background-color: #4a3206 !important;
    border: 1px solid #816d37 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
  }
  
  /* 暗黑模式下的持之以恒称号 - 绿色 */
  .title-persistent {
    color: #a8e2aa !important;
    background-color: #1e3e1f !important;
    border: 1px solid #2c5e2e !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  }
  
  /* 暗黑模式下的巅峰大神称号 - 红色 */
  .title-master {
    color: #ffffff !important;
    background-color: #7d2620 !important;
    border: 1px solid #b74138 !important;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
  }
  
  /* 暗黑模式下的总版主称号 - 紫色到粉色渐变 */
  .title-head-admin {
    color: #ffffff !important;
    background: linear-gradient(to right, #6c2e85, #d66baf) !important;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
  }
  
  .uid {
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }
  
  .points {
    color: #f56c6c;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }
}

.user-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 12px 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.count {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.user-bio {
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.user-bio p {
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.user-experience {
  margin-bottom: 16px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.level-tag {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 15px;
  font-weight: 700;
  font-style: italic;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  white-space: nowrap;
}

.exp-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
}

.exp-bar-container {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.exp-bar {
  height: 100%;
  background-color: #4cd964;
  border-radius: 4px;
  box-shadow: 0 0 5px rgba(76, 217, 100, 0.5);
}

.user-actions-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  gap: 10px;
}

.user-actions-row .action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  color: #333;
  border-radius: 8px;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  will-change: transform;
  transform: translateZ(0);
}

.user-actions-row .action-btn .el-icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.user-actions-row .action-btn:hover {
  background-color: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@media (prefers-color-scheme: dark) {
  .user-actions-row .action-btn {
    background-color: rgba(40, 40, 40, 0.75);
    color: #e0e0e0;
  }
  
  .user-actions-row .action-btn:hover {
    background-color: rgba(50, 50, 50, 0.9);
  }
}

.profile-header {
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 0 0 16px 16px;
  overflow: hidden;
  min-height: 350px;
  background-color: transparent !important;
  will-change: transform;
  transform: translateZ(0);
  contain: paint;
  content-visibility: auto;
}

.header-content {
  color: white;
  padding: 16px;
  padding-top: 40px;
  background-color: transparent !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.user-basic-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  z-index: 2;
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.user-id {
  margin-left: 16px;
}

.user-id h2 {
  margin: 0 0 5px;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
}

.user-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 12px 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.user-bio {
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.user-experience {
  margin-bottom: 16px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.level-tag {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 15px;
  font-weight: 700;
  font-style: italic;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  white-space: nowrap;
}

.exp-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
}

.exp-bar-container {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.exp-bar {
  height: 100%;
  background-color: #4cd964;
  border-radius: 4px;
  box-shadow: 0 0 5px rgba(76, 217, 100, 0.5);
}

.user-actions-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  gap: 10px;
  z-index: 2;
}

.user-actions-row .action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  color: #333;
  border-radius: 8px;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  will-change: transform;
  transform: translateZ(0);
}

.user-actions-row .action-btn .el-icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.user-actions-row .action-btn:hover {
  background-color: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.user-title-inline {
  font-size: 0.85rem;
  color: #333;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.3px;
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}

.user-title-inline:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

/* 修改称号样式以适应新的背景 */
.title-official, .title-persistent, .title-master {
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.content-tabs {
  background-color: white;
}

@media (prefers-color-scheme: dark) {
  .content-tabs {
    background-color: #121212;
  }
  
  .user-stats,
  .user-bio,
  .user-experience {
    background-color: rgba(0, 0, 0, 0.3);
  }
  
  .user-actions-row .action-btn {
    background-color: rgba(40, 40, 40, 0.75);
    color: #e0e0e0;
  }
  
  .user-actions-row .action-btn:hover {
    background-color: rgba(50, 50, 50, 0.9);
  }
  
  .level-tag {
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
  }
  
  .user-title-inline {
    background-color: rgba(60, 60, 60, 0.9);
    color: #e0e0e0;
  }
}

.profile-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: var(--safe-area-top);
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.post-title {
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  text-align: left;
}

.post-title-large {
  padding: 12px 12px 6px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  text-align: left;
}

.post-content {
  padding: 0 12px 12px;
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.5;
  text-align: left;
}

.feature-panel {
  background-color: white;
  padding: 16px;
  border-radius: 12px;
  margin-top: 16px;
  margin-bottom: 16px;
}

.feature-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.feature-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feature-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
  color: #555;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.feature-button:hover {
  background-color: #eee;
  transform: translateY(-2px);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .feature-button {
    background-color: #2a2a2a;
    color: #e0e0e0;
  }
  
  .feature-button:hover {
    background-color: #333;
  }
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform;
  transform: translateZ(0);
}

.content-area {
  background-color: transparent;
  min-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 350px);
  flex: 1;
  -webkit-overflow-scrolling: touch;
  padding: 0;
  padding-bottom: 70px; /* 添加下方内边距，为底部导航栏留出空间 */
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0;
  width: 100%;
}

.post-item {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: auto;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
  margin-bottom: 0;
}

.post-item:active {
  transform: scale(0.98);
}

.post-image-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 70%;
  background-color: #f5f7fa;
  overflow: hidden;
}

.post-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.post-item:hover .post-image {
  transform: scale(1.08);
}

.image-count-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 6px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.02);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.like-area {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff6b6b;
}

.post-title {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  text-align: left;
}

.post-title-large {
  padding: 12px 12px 6px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  text-align: left;
}

.post-content {
  padding: 0 12px 12px;
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.5;
  text-align: left;
}

.username {
  font-size: 12px;
  color: #2c3e50;
  font-weight: 500;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (prefers-color-scheme: dark) {
  .post-item {
    background-color: rgba(30, 30, 30, 0.95);
  }
  
  .post-title, .post-title-large {
    color: #f5f5f5;
  }
  
 .post-content {
    color: #aaa;
  }
  
  .username {
    color: #ddd;
  }
}
</style>
