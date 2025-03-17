<template>
  <div class="page-container">
    <div class="community-page">
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <div class="search-bar">
          <el-input
            v-model="searchText"
            placeholder="搜索"
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <div class="notification-container">
            <NotificationBadge />
          </div>
        </div>
      </div>

      <!-- 排序选项卡 -->
      <div class="sort-tabs">
        <div
          v-for="tab in sortTabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: currentSort === tab.value }"
          @click="changeSort(tab.value)"
        >
          {{ tab.label }}
        </div>
      </div>
      
      <!-- 分类筛选 -->
      <div class="category-filter" v-if="categories.length > 0">
        <div 
          class="category-chip"
          :class="{ active: !selectedCategoryId }"
          @click="changeCategory(null)"
        >
          全部
        </div>
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-chip"
          :class="{ active: selectedCategoryId === category.id }"
          @click="changeCategory(category.id)"
        >
          {{ category.name }}
        </div>
      </div>

      <!-- 悬浮发帖按钮 -->
      <div class="floating-button pulse-on-click" @click="router.push('/community/create')">
        <el-icon><Plus /></el-icon>
        <span>发帖</span>
      </div>

      <!-- 帖子列表 -->
      <div class="post-list" v-if="posts.length > 0">
        <!-- 左列 -->
        <div class="post-column">
          <div
            v-for="post in leftPosts"
            :key="post.id"
            class="post-card hover-lift"
            @click="viewPost(post)"
          >
            <!-- 帖子封面图 -->
            <div
              class="post-cover"
              v-if="post.images && post.images.length > 0"
            >
              <img :src="post.images[0]" :alt="post.title" />
              <span class="image-count" v-if="post.images.length > 1">
                <el-icon><Picture /></el-icon>
                {{ post.images.length }}
              </span>
            </div>

            <!-- 帖子内容 -->
            <div class="post-content">
              <h3 class="post-title">{{ post.title }}</h3>
              
              <!-- 帖子文字内容 (仅在没有图片时显示更多文字) -->
              <p class="post-text" v-if="!post.images?.length">{{ post.content }}</p>
            </div>

            <!-- 帖子底部信息 -->
            <div class="post-footer">
              <div class="user-info">
                <el-avatar
                  :size="24"
                  :src="post.user?.avatar"
                  @error="() => true"
                  class="user-avatar"
                >
                  {{ post.user?.username?.charAt(0).toUpperCase() || "?" }}
                </el-avatar>
                <span class="username">{{ post.user?.username || "匿名用户" }}</span>
                <!-- 显示分类 -->
                <span class="category-badge" v-if="post.category_name">
                  {{ post.category_name }}
                </span>
              </div>
              <div class="like-area" @click="(e) => likePost(e, post.id)">
                <el-icon class="like-icon" :class="{ 'liked': isPostLiked(post.id) }">
                  <StarFilled v-if="isPostLiked(post.id)" />
                  <Star v-else />
                </el-icon>
                <span class="like-count">{{ post.likes || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右列 -->
        <div class="post-column">
          <div
            v-for="post in rightPosts"
            :key="post.id"
            class="post-card hover-lift"
            @click="viewPost(post)"
          >
            <!-- 帖子封面图 -->
            <div
              class="post-cover"
              v-if="post.images && post.images.length > 0"
            >
              <img :src="post.images[0]" :alt="post.title" />
              <span class="image-count" v-if="post.images.length > 1">
                <el-icon><Picture /></el-icon>
                {{ post.images.length }}
              </span>
            </div>

            <!-- 帖子内容 -->
            <div class="post-content">
              <h3 class="post-title">{{ post.title }}</h3>
              
              <!-- 帖子文字内容 (仅在没有图片时显示更多文字) -->
              <p class="post-text" v-if="!post.images?.length">{{ post.content }}</p>
            </div>

            <!-- 帖子底部信息 -->
            <div class="post-footer">
              <div class="user-info">
                <el-avatar
                  :size="24"
                  :src="post.user?.avatar"
                  @error="() => true"
                  class="user-avatar"
                >
                  {{ post.user?.username?.charAt(0).toUpperCase() || "?" }}
                </el-avatar>
                <span class="username">{{ post.user?.username || "匿名用户" }}</span>
                <!-- 显示分类 -->
                <span class="category-badge" v-if="post.category_name">
                  {{ post.category_name }}
                </span>
              </div>
              <div class="like-area" @click="(e) => likePost(e, post.id)">
                <el-icon class="like-icon" :class="{ 'liked': isPostLiked(post.id) }">
                  <StarFilled v-if="isPostLiked(post.id)" />
                  <Star v-else />
                </el-icon>
                <span class="like-count">{{ post.likes || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty description="暂无帖子" />
      </div>

      <!-- 图片预览 -->
      <el-dialog v-model="previewVisible" width="90%">
        <img w-full :src="previewImage" alt="Preview" style="width: 100%" />
      </el-dialog>
    </div>
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Plus, Picture, View, ChatDotRound, Star, StarFilled, VideoPlay, VideoPause } from "@element-plus/icons-vue";
import BottomNavBar from "@/components/BottomNavBar.vue";
import NotificationBadge from "@/components/NotificationBadge.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import formatTime from "@/utils/formatTime";
import { useCommunityStore } from "@/stores/community";
import { useAuthStore } from "@/stores/auth";
import { API_BASE_URL } from "@/config";
import { getAvatarUrl, getImageUrl } from "@/utils/imageHelpers";

const router = useRouter();
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const posts = ref([]);
const previewVisible = ref(false);
const previewImage = ref("");
const loading = ref(false);
const searchText = ref("");
const submitting = ref(false);
const categories = ref([]);
const selectedCategoryId = ref(null);
const currentPage = ref(1);
const noMoreData = ref(false);
const currentSort = ref("latest");
const likedPostIds = ref(new Set());

// 排序选项
const sortTabs = [
  { label: "最新", value: "latest" },
  { label: "最热", value: "hot" },
  { label: "推荐", value: "recommend" },
];

const handlePictureCardPreview = (file) => {
  previewImage.value = file.url;
  previewVisible.value = true;
};

const viewPost = (post) => {
  router.push(`/community/post/${post.id}`);
};

const loadPosts = async (page = 1, append = false) => {
  try {
    loading.value = true;
    const response = await communityStore.getPosts(
      page,
      append,
      currentSort.value,
      searchText.value,
      selectedCategoryId.value
    );

    // 调试输出原始数据
    console.log('调试 - API_BASE_URL:', API_BASE_URL);
    console.log('调试 - 原始帖子数据:', response.posts);
    if (response?.posts && response.posts.length > 0) {
      console.log('调试 - 第一个帖子的用户数据:', response.posts[0].user);
      console.log('调试 - 第一个帖子的音频数据:', response.posts[0].audio);
      
      // 详细调试第一个帖子的音频
      if (response.posts[0]) {
        debugPostAudio(response.posts[0]);
      }
      
      // 检查所有帖子的音频数据
      console.log('所有帖子的音频状态:');
      response.posts.forEach((post, index) => {
        console.log(`帖子 ${index+1} (ID:${post.id}): 音频=${!!post.audio}`);
      });
    }

    // 处理帖子数据中的头像、图片和音频路径
    if (response?.posts) {
      // 处理音频路径
      response.posts.forEach(post => {
        // 修复音频路径
        if (post.audio && typeof post.audio === 'string') {
          // 如果音频路径是相对路径，则添加API基础URL
          if (post.audio.startsWith('/')) {
            post.audio = API_BASE_URL + post.audio;
          }
          // 如果音频路径不是以http开头，也添加API基础URL
          else if (!post.audio.startsWith('http')) {
            post.audio = API_BASE_URL + '/' + post.audio;
          }
          
          console.log(`处理后的音频URL: ${post.audio}`);
        }
      });
      
      console.log('处理后的帖子数据:', response.posts);
      posts.value = response.posts;
    } else {
      posts.value = [];
    }

    noMoreData.value =
      page >= (response?.pagination?.totalPages || 1);
  } catch (error) {
    console.error("获取帖子列表失败:", error);
    ElMessage.error("获取帖子列表失败");
  } finally {
    loading.value = false;
  }
};
const loadMorePosts = async () => {
  if (loading.value || noMoreData.value) return;

  try {
    loading.value = true;
    currentPage.value++;
    const response = await communityStore.getPosts(
      currentPage.value,
      true,
      currentSort.value,
      searchText.value,
      selectedCategoryId.value
    );

    if (response?.posts) {
      const newPosts = response.posts;
      posts.value = [...posts.value, ...newPosts];
    }

    noMoreData.value =
      currentPage.value >= (response?.pagination?.totalPages || 1);
  } catch (error) {
    currentPage.value--;
    console.error("加载更多帖子失败:", error);
    ElMessage.error("加载更多帖子失败");
  } finally {
    loading.value = false;
  }
};

const handleScroll = async (e) => {
  const { scrollHeight, scrollTop, clientHeight } = e.target;
  if (scrollHeight - scrollTop - clientHeight < 50) {
    await loadMorePosts();
  }
};

// 左列帖子
const leftPosts = computed(() => {
  return posts.value.filter((_, index) => index % 2 === 0);
});

// 右列帖子
const rightPosts = computed(() => {
  return posts.value.filter((_, index) => index % 2 === 1);
});

const handleSearch = () => {
  loadPosts();
};

const changeSort = (sort) => {
  currentSort.value = sort;
  loadPosts();
};

// 音频播放相关变量和方法
const currentPlayingAudio = ref(null);
const audioPlayer = ref(null);

// 播放音频
const playAudio = (audioUrl) => {
  if (!audioUrl) {
    console.warn('尝试播放空的音频URL');
    ElMessage.warning('无法播放：未找到音频文件');
    return;
  }
  
  // 如果点击当前正在播放的音频，则暂停播放
  if (currentPlayingAudio.value === audioUrl && audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.currentTime = 0;
    currentPlayingAudio.value = null;
    return;
  }
  
  // 如果有正在播放的其他音频，暂停它
  if (currentPlayingAudio.value && audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.currentTime = 0;
  }
  
  // 创建新的音频播放器
  const completeAudioUrl = audioUrl;
  console.log('准备播放音频:', completeAudioUrl);
  
  audioPlayer.value = new Audio(completeAudioUrl);
  currentPlayingAudio.value = audioUrl;
  
  // 播放完成后重置
  audioPlayer.value.onended = () => {
    currentPlayingAudio.value = null;
  };
  
  // 播放出错处理
  audioPlayer.value.onerror = (e) => {
    console.error('音频播放出错:', e);
    ElMessage.error('音频播放出错');
    currentPlayingAudio.value = null;
  };
  
  // 开始播放
  audioPlayer.value.play().catch(error => {
    console.error('音频播放失败:', error);
    ElMessage.error('音频播放失败');
    currentPlayingAudio.value = null;
  });
};

// 调试帖子中的音频数据
const debugPostAudio = (post) => {
  console.log('帖子ID:', post.id, '标题:', post.title);
  console.log('音频数据:', post.audio);
  console.log('音频数据类型:', typeof post.audio);
  console.log('音频数据是否为空:', !post.audio);
  console.log('音频数据是否为字符串:', typeof post.audio === 'string');
  console.log('音频数据长度:', post.audio ? post.audio.length : 0);
  
  // 如果是字符串，检查是否为有效URL
  if (typeof post.audio === 'string' && post.audio) {
    try {
      const url = new URL(post.audio);
      console.log('有效的URL格式');
    } catch (e) {
      console.log('非有效URL格式:', e.message);
      // 检查是否为相对路径
      if (post.audio.startsWith('/')) {
        console.log('是相对路径，尝试构建完整URL:', API_BASE_URL + post.audio);
      }
    }
  }
};

// 从localStorage加载用户已点赞的帖子ID
const loadLikedPosts = () => {
  try {
    // 获取当前用户ID，如果未登录则使用访客模式
    const userId = authStore.user?.id || 'guest';
    const savedLikes = localStorage.getItem(`likedPosts_${userId}`);
    if (savedLikes) {
      likedPostIds.value = new Set(JSON.parse(savedLikes));
      console.log(`已加载用户(${userId})的帖子点赞状态:`, Array.from(likedPostIds.value));
    } else {
      // 如果没有找到用户特定的点赞数据，尝试从服务器获取
      fetchUserLikes();
    }
  } catch (error) {
    console.error('加载点赞状态失败:', error);
  }
};

// 从服务器获取用户点赞历史
const fetchUserLikes = async () => {
  try {
    // 检查用户是否已登录
    if (!authStore.isAuthenticated) {
      console.log('用户未登录，跳过获取点赞历史');
      return;
    }
    
    const response = await communityStore.getUserLikes();
    if (response && response.likedPosts) {
      // 将服务器返回的点赞数据设置到本地
      likedPostIds.value = new Set(response.likedPosts.map(post => post.toString()));
      console.log('从服务器获取到的点赞历史:', Array.from(likedPostIds.value));
      // 保存到localStorage
      saveLikedPosts();
    }
  } catch (error) {
    console.error('获取用户点赞历史失败:', error);
  }
};

// 保存点赞状态到localStorage
const saveLikedPosts = () => {
  try {
    // 获取当前用户ID，如果未登录则使用访客模式
    const userId = authStore.user?.id || 'guest';
    localStorage.setItem(`likedPosts_${userId}`, JSON.stringify(Array.from(likedPostIds.value)));
  } catch (error) {
    console.error('保存点赞状态失败:', error);
  }
};

// 检查帖子是否已被点赞
const isPostLiked = (postId) => {
  return likedPostIds.value.has(postId.toString());
};

// 帖子点赞功能
const likePost = async (event, postId) => {
  event.stopPropagation(); // 阻止冒泡，避免点击点赞区域时触发整个卡片的点击事件
  
  try {
    // 检查用户是否已登录
    if (!authStore.isAuthenticated) {
      ElMessage.warning('请先登录后再点赞');
      router.push('/login'); // 导航到登录页面
      return;
    }

    const postIdStr = postId.toString();
    const isLiked = isPostLiked(postIdStr);
    
    // 调用点赞或取消点赞API
    let response;
    if (isLiked) {
      response = await communityStore.unlikePost(postId);
      likedPostIds.value.delete(postIdStr);
      ElMessage.success('取消点赞成功');
    } else {
      response = await communityStore.likePost(postId);
      likedPostIds.value.add(postIdStr);
      ElMessage.success('点赞成功');
    }
    
    // 更新点赞数量
    const updatePost = (postList) => {
      const postIndex = postList.findIndex(p => p.id.toString() === postIdStr);
      if (postIndex !== -1) {
        // 更新点赞数量（增加或减少）
        postList[postIndex].likes = isLiked ? 
          Math.max(0, (postList[postIndex].likes || 0) - 1) : 
          ((postList[postIndex].likes || 0) + 1);
      }
    };
    
    // 更新左右两列的帖子
    updatePost(leftPosts.value);
    updatePost(rightPosts.value);
    
    // 保存点赞状态到本地存储
    saveLikedPosts();
  } catch (error) {
    console.error('点赞操作失败:', error);
    
    // 更详细的错误信息
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
      ElMessage.error(`点赞失败: ${error.response.data.message || '服务器错误'}`);
    } else if (error.request) {
      ElMessage.error('请求未收到响应，请检查网络连接');
    } else {
      ElMessage.error(`点赞失败: ${error.message}`);
    }
  }
};

// 加载分类数据
const loadCategories = async () => {
  try {
    const categoriesData = await communityStore.getCategories();
    categories.value = categoriesData;
    console.log("加载分类数据成功:", categoriesData);
  } catch (error) {
    console.error("加载分类数据失败:", error);
    ElMessage.error("加载分类数据失败");
  }
};

// 初始化时移除通知相关代码
onMounted(() => {
  console.log("当前用户头像URL:", authStore.user?.avatar);
  console.log("当前用户ID:", authStore.user?.id);
  
  // 加载用户点赞状态
  loadLikedPosts();
  
  // 加载分类数据
  loadCategories();
  
  loadPosts();
  
  // 测试URL处理
  console.log('URL处理测试结果:');
  [
    '/uploads/avatars/avatar-1234.jpg',
    'http://47.98.210.7:3000/uploads/avatars/avatar-1234.jpg',
    'http://47.98.210.7:3000http://localhost:3000/uploads/avatars/avatar-1234.jpg',
    'avatar-1234.jpg'
  ].forEach(url => {
    console.log({
      原始值: url,
      处理后: getAvatarUrl(url)
    });
  });

  const communityPage = document.querySelector(".community-page");
  if (communityPage) {
    communityPage.addEventListener("scroll", handleScroll);
  }
});

const changeCategory = (categoryId) => {
  selectedCategoryId.value = categoryId;
  loadPosts();
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa, #f1f3f5);
  padding-bottom: 70px; /* 为底部导航栏留出空间 */
}

.community-page {
  position: relative;
  padding-top: 56px;
}

/* 顶部搜索栏 */
.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 20;
  width: 100%;
  box-sizing: border-box;
}

.search-bar {
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
}

.notification-container {
  margin-left: 12px;
  position: relative;
  z-index: 9950;
}

/* 排序选项卡 */
.sort-tabs {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #ffffff;
  margin-bottom: 12px;
  position: sticky;
  top: 56px;
  z-index: 10;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.tab-item {
  font-size: 14px;
  color: #909399;
  cursor: pointer;
  position: relative;
  padding: 6px 12px;
  border-radius: 14px;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #409eff;
  font-weight: 600;
  background-color: rgba(64, 158, 255, 0.08);
}

.tab-item:hover:not(.active) {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.05);
}

/* 帖子列表 */
.post-list {
  padding: 12px;
  display: flex;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
}

.post-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.post-card {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  margin-bottom: 12px;
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.1);
}

.post-cover {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 比例 */
  overflow: hidden;
}

.post-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.post-card:hover .post-cover img {
  transform: scale(1.03);
}

.image-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 3px;
}

/* 帖子内容 */
.post-content {
  padding: 12px;
  position: relative;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #303133;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.post-text {
  font-size: 13px;
  color: #606266;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

/* 帖子底部 */
.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  background-color: #f9fafc;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 70%;
  overflow: hidden;
}

.user-avatar {
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  width: 24px;
  height: 24px;
}

.username {
  font-size: 11px;
  color: #606266;
  font-weight: 500;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.like-area {
  display: flex;
  align-items: center;
  gap: 0;
  background-color: #f5f7fa;
  padding: 2px 6px 2px 4px;
  border-radius: 12px;
  margin-right: 6px;
  position: relative;
}

.like-icon {
  font-size: 14px;
  color: #409eff;
}

.like-icon.liked {
  color: #409eff;
  transform: scale(1.1);
}

.like-count {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

/* 悬浮发帖按钮 */
.floating-button {
  position: fixed;
  bottom: 80px;
  right: 16px;
  width: auto;
  height: 48px;
  padding: 0 20px;
  border-radius: 24px;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
  transition: all 0.3s ease;
  cursor: pointer;
  z-index: 10;
  font-weight: 500;
}

.floating-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.35);
}

.floating-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.pulse-on-click:active {
  animation: pulse 0.3s ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

.empty-state {
  padding: 40px 0;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
  line-height: 84px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
}

.el-upload__tip {
  font-size: 12px;
  color: var(--placeholder-color);
  margin-top: 8px;
}

.post-meta {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 12px;
  gap: 8px;
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.action-button {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s;
}

.action-button:hover {
  color: #409eff;
}

@media screen and (max-width: 480px) {
  .post-list {
    padding: 6px;
  }

  .post-content {
    padding: 6px;
  }

  .post-title {
    font-size: 15px;
    font-weight: 600;
  }

  .post-text {
    font-size: 13px;
    line-height: 1.4;
  }
  
  .category-badge {
    max-width: 50px;
    font-size: 9px;
    padding: 1px 4px;
  }
  
  .username {
    max-width: 70px;
  }
}

@media screen and (min-width: 481px) {
  .post-list {
    gap: 12px;
    padding: 12px;
  }

  .post-column {
    gap: 12px;
  }

  .post-content {
    padding: 12px;
  }

  .post-title {
    font-size: 16px;
  }

  .post-text {
    font-size: 14px;
  }
}

/* 全局顶部通知栏样式 */
.global-notification {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  background-color: #409eff;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  z-index: 9999; /* 确保最高层级 */
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  box-sizing: border-box;
}

/* 分类相关样式 */
.post-category {
  margin-top: 4px;
  margin-bottom: 6px;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
  color: #409EFF;
  margin-left: 6px;
  background-color: rgba(64, 158, 255, 0.05);
  border: 1px solid rgba(64, 158, 255, 0.3);
  white-space: nowrap;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-option {
  display: flex;
  align-items: center;
}

/* 分类筛选样式 */
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background-color: #ffffff;
  margin-bottom: 12px;
  position: sticky;
  top: 56px;
  z-index: 10;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.category-chip {
  padding: 6px 12px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-chip.active {
  border-color: #409EFF;
  background-color: #409EFF;
  color: white;
}
</style>