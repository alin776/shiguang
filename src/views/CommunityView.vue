<template>
  <TheNavBar />
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

      <!-- 悬浮发帖按钮 -->
      <div class="floating-button" @click="showPostDialog">
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
            class="post-card"
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
              <p class="post-text">{{ post.content }}</p>
              <p class="post-time">{{ formatTime(post.created_at) }}</p>
            </div>

            <!-- 帖子底部信息 -->
            <div class="post-footer">
              <div class="user-info">
                <el-avatar
                  :size="40"
                  :src="post.user?.avatar"
                  @error="() => true"
                  class="user-avatar"
                >
                  {{ post.user?.username?.charAt(0).toUpperCase() || "?" }}
                </el-avatar>
                <span class="username">{{
                  post.user?.username || "匿名用户"
                }}</span>
              </div>
              <div class="post-stats">
                <span class="stat-item">
                  <el-icon><View /></el-icon>
                  <span>{{ post.views || 0 }}</span>
                </span>
                <span class="stat-item">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>{{ post.comments_count || 0 }}</span>
                </span>
                <span class="stat-item">
                  <el-icon><Star /></el-icon>
                  <span>{{ post.likes || 0 }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右列 -->
        <div class="post-column">
          <div
            v-for="post in rightPosts"
            :key="post.id"
            class="post-card"
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
              <p class="post-text">{{ post.content }}</p>
              <p class="post-time">{{ formatTime(post.created_at) }}</p>
            </div>

            <!-- 帖子底部信息 -->
            <div class="post-footer">
              <div class="user-info">
                <el-avatar
                  :size="40"
                  :src="post.user?.avatar"
                  @error="() => true"
                  class="user-avatar"
                >
                  {{ post.user?.username?.charAt(0).toUpperCase() || "?" }}
                </el-avatar>
                <span class="username">{{
                  post.user?.username || "匿名用户"
                }}</span>
              </div>
              <div class="post-stats">
                <span class="stat-item">
                  <el-icon><View /></el-icon>
                  <span>{{ post.views || 0 }}</span>
                </span>
                <span class="stat-item">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>{{ post.comments_count || 0 }}</span>
                </span>
                <span class="stat-item">
                  <el-icon><Star /></el-icon>
                  <span>{{ post.likes || 0 }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty description="暂无帖子" />
      </div>

      <!-- 发帖对话框 -->
      <el-dialog
        v-model="showDialog"
        title="发布新帖子"
        width="90%"
        class="mobile-dialog"
      >
        <el-form
          ref="postFormRef"
          :model="postForm"
          :rules="postRules"
          label-position="top"
        >
          <el-form-item label="标题" prop="title">
            <el-input
              v-model="postForm.title"
              placeholder="请输入标题（最多50字）"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="内容" prop="content">
            <el-input
              v-model="postForm.content"
              type="textarea"
              :rows="4"
              placeholder="分享你的故事..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="图片">
            <el-upload
              v-model:file-list="postForm.images"
              action="http://47.98.210.7:3000/api/community/upload"
              list-type="picture-card"
              :limit="9"
              :before-upload="handleBeforeUpload"
              :on-preview="handlePictureCardPreview"
              :on-remove="handleRemove"
              :headers="{
                Authorization: `Bearer ${authStore.token}`,
              }"
              multiple
            >
              <el-icon><Plus /></el-icon>
              <template #tip>
                <div class="el-upload__tip">
                  每张图片不超过 5MB，支持 jpg/png 格式
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showDialog = false">取消</el-button>
            <el-button type="primary" @click="submitPost" :loading="submitting">
              发布
            </el-button>
          </div>
        </template>
      </el-dialog>

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
import { Search, Plus, Picture, View, ChatDotRound, Star } from "@element-plus/icons-vue";
import TheNavBar from "@/components/TheNavBar.vue";
import BottomNavBar from "@/components/BottomNavBar.vue";
import formatTime from "@/utils/formatTime";
import { useCommunityStore } from "@/stores/community";
import { useAuthStore } from "@/stores/auth";
import { API_BASE_URL } from "@/config";
import { getAvatarUrl, getImageUrl } from "@/utils/imageHelpers";

const router = useRouter();
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const posts = ref([]);
const showDialog = ref(false);
const submitting = ref(false);
const postFormRef = ref(null);
const previewVisible = ref(false);
const previewImage = ref("");
const currentPage = ref(1);
const loading = ref(false);
const noMoreData = ref(false);
const searchText = ref("");
const currentSort = ref("latest");

const postForm = ref({
  title: "",
  content: "",
  images: [],
});

const postRules = {
  title: [
    { required: true, message: "请输入标题", trigger: "blur" },
    { min: 2, max: 50, message: "标题长度在2-50个字符之间", trigger: "blur" },
  ],
  content: [
    { required: true, message: "请输入内容", trigger: "blur" },
    { min: 10, message: "内容至少10个字符", trigger: "blur" },
  ],
};

const showPostDialog = () => {
  showDialog.value = true;
};

const handlePictureCardPreview = (file) => {
  previewImage.value = file.url;
  previewVisible.value = true;
};

const handleRemove = (file, fileList) => {
  postForm.value.images = fileList;
};

const submitPost = async () => {
  if (!postFormRef.value) return;

  try {
    await postFormRef.value.validate();
    submitting.value = true;

    await communityStore.createPost(postForm.value);
    ElMessage.success("发布成功");
    showDialog.value = false;
    postFormRef.value.resetFields();
    loadPosts();
  } catch (error) {
    ElMessage.error(error.message || "发布失败");
  } finally {
    submitting.value = false;
  }
};

const viewPost = (post) => {
  router.push(`/community/post/${post.id}`);
};

const loadPosts = async () => {
  try {
    loading.value = true;
    const response = await communityStore.getPosts(
      currentPage.value,
      false,
      currentSort.value,
      searchText.value
    );

    // 调试输出原始数据
    console.log('调试 - API_BASE_URL:', API_BASE_URL);
    console.log('调试 - 原始帖子数据:', response.posts);
    if (response?.posts && response.posts.length > 0) {
      console.log('调试 - 第一个帖子的用户数据:', response.posts[0].user);
      console.log('调试 - 第一个帖子的用户头像:', {
        原始头像: response.posts[0].user?.avatar,
      });
    }

    // 处理帖子数据中的头像和图片路径
    if (response?.posts) {
      console.log('原始帖子数据:', response.posts);
      posts.value = response.posts;
    } else {
      posts.value = [];
    }

    noMoreData.value =
      currentPage.value >= (response?.pagination?.totalPages || 1);
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
      searchText.value
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

const sortTabs = [
  { label: "最新", value: "latest" },
  { label: "最热", value: "popular" },
  { label: "推荐", value: "recommended" },
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 2MB in bytes

const handleBeforeUpload = (file) => {
  const isImage = file.type === "image/jpeg" || file.type === "image/png";
  const isLt2M = file.size <= MAX_IMAGE_SIZE;

  if (!isImage) {
    ElMessage.error("只能上传 JPG/PNG 格式的图片！");
    return false;
  }

  if (!isLt2M) {
    ElMessage.error("图片大小不能超过 5MB！");
    return false;
  }

  return true;
};

onMounted(() => {
  console.log("当前用户头像URL:", authStore.user?.avatar);
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
      原始URL: url,
      处理后URL: getAvatarUrl(url)
    });
  });

  const communityPage = document.querySelector(".community-page");
  if (communityPage) {
    communityPage.addEventListener("scroll", handleScroll);
  }
});
</script>

<style scoped>
.page-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.community-page {
  flex: 1;
  background: var(--bg-color);
  padding-bottom: 76px;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: 60px; /* 为导航栏留出空间 */
}

.page-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--card-bg);
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
}

.search-bar {
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
}

.sort-tabs {
  display: flex;
  background: var(--card-bg);
  padding: 12px 16px;
  gap: 32px;
  border-bottom: 1px solid var(--el-border-color-light);
  position: sticky;
  top: 64px;
  z-index: 10;
}

.tab-item {
  font-size: 14px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  position: relative;
  padding: 0 4px;
}

.tab-item.active {
  color: var(--el-color-primary);
  font-weight: 500;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: -12px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--el-color-primary);
}

.post-list {
  padding: 8px;
  display: flex;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
}

.post-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.post-card {
  background: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.post-card:active {
  transform: scale(0.97);
}

.post-cover {
  position: relative;
  padding-bottom: 100%; /* 1:1 比例，或者保持 133.33% 看效果 */
  overflow: hidden;
}

.post-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 或者 contain，取决于你的需求 */
  background-color: var(--border-color); /* 图片加载前的背景色 */
}

.image-count {
  position: absolute;
  right: 8px;
  top: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-content {
  padding: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.post-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.post-text {
  margin: 0;
  font-size: 12px;
  color: var(--placeholder-color);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.post-time {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--placeholder-color);
  margin-top: auto;
  text-align: right;
}

.post-footer {
  padding: 6px 8px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.el-avatar) {
  border: 1px solid var(--border-color);
  width: 20px !important;
  height: 20px !important;
}

.username {
  font-size: 12px;
  color: var(--placeholder-color);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--placeholder-color);
  font-size: 11px;
  min-width: 32px;
}

.stat-item .el-icon {
  font-size: 14px;
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

.floating-button {
  position: fixed;
  right: 20px;
  bottom: 90px;
  width: auto;
  height: 40px;
  padding: 0 20px;
  background: var(--el-color-primary);
  color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.floating-button:active {
  transform: scale(0.95);
}

.floating-button .el-icon {
  font-size: 20px;
}

.floating-button span {
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  border-radius: 20px;
  background-color: var(--el-fill-color-blank);
}

.el-upload__tip {
  font-size: 12px;
  color: var(--placeholder-color);
  margin-top: 8px;
}

@media screen and (max-width: 480px) {
  .post-list {
    padding: 6px;
  }

  .post-content {
    padding: 6px;
  }

  .post-title {
    font-size: 14px;
  }

  .post-text {
    font-size: 12px;
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
</style>