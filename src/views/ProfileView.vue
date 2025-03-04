<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="cover-image" :style="userCoverStyle"></div>
      <div class="header-content">
        <div class="user-actions">
          <div class="action-btn settings-btn" @click="goToSettings">
            <el-icon><Setting /></el-icon>
          </div>
          <div
            class="action-btn edit-btn"
            @click="router.push('/profile/edit')"
          >
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
            <span class="count">{{ totalLikesCount }}</span>
            <span class="label">获赞</span>
          </div>
          <div class="stat-item">
            <span class="count">{{ postsCount }}</span>
            <span class="label">帖子</span>
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
            <div
              v-if="post.images && post.images.length > 0"
              class="post-item-with-image"
            >
              <div class="post-image-container">
                <img
                  class="post-image"
                  :src="post.images[0]"
                  :alt="post.title || '无标题'"
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
              <div class="post-time">{{ formatTime(post.created_at) }}</div>
              <div class="likes-count">
                <el-icon><Star /></el-icon>
                <span>{{ post.likes_count || post.likesCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
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
              <div class="post-time">{{ formatTime(post.created_at) }}</div>
              <div class="likes-count">
                <el-icon><Star /></el-icon>
                <span>{{ post.likes_count || post.likesCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
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
} from "@element-plus/icons-vue";
import BottomNavBar from "../components/BottomNavBar.vue";
import useProfileLogic from "../mine/js/profile.js";
import "../mine/css/profile.css";

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
  goToSettings,
  handleLogout,
  showAbout,
  formatTime,
  router,
} = useProfileLogic();
</script>
