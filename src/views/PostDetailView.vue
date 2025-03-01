<template>
  <div class="post-detail-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>时光小镇</h2>
    </div>

    <!-- 帖子内容区 -->
    <div class="post-container" v-if="post">
      <!-- 图片轮播 -->
      <div class="post-images" v-if="post.images?.length">
        <div class="image-slider">
          <div class="slider-arrows">
            <div
              class="arrow left"
              @click="prevImage"
              v-if="post.images.length > 1"
            >
              <el-icon><ArrowLeft /></el-icon>
            </div>
            <div
              class="arrow right"
              @click="nextImage"
              v-if="post.images.length > 1"
            >
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <img
            :src="post.images[currentImageIndex]"
            :alt="post.title"
            class="main-image"
          />
          <div class="image-indicator" v-if="post.images.length > 1">
            {{ currentImageIndex + 1 }}/{{ post.images.length }}
          </div>
        </div>
      </div>

      <!-- 用户信息 -->
      <div class="user-info">
        <el-avatar
          :size="40"
          :src="getAvatarUrl(post.user?.avatar)"
          @error="() => true"
          class="user-avatar"
          @click="navigateToUserProfile(post.user?.id)"
        >
          {{ post.user?.username?.charAt(0).toUpperCase() || "?" }}
        </el-avatar>
        <div class="user-meta">
          <div class="username">{{ post.user?.username || "匿名用户" }}</div>
          <div class="post-time">{{ formatTime(post.created_at) }}</div>
        </div>
        <div class="post-actions" v-if="isOwnPost">
          <el-dropdown trigger="click" @command="handlePostCommand">
            <el-icon class="more-icon"><More /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="delete" divided type="danger"
                  >删除</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 帖子内容 -->
      <div class="post-content">
        <h3 class="post-title">{{ post.title }}</h3>
        <p class="post-text">{{ post.content }}</p>
      </div>
      <!-- 互动区域 -->
      <div class="interaction-stats">
        <div class="left-stats">
          <div class="stat-item">
            <el-icon><View /></el-icon>
            <span>{{ post.views || 0 }}</span>
          </div>
        </div>
        <div class="right-stats">
          <div class="stat-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ post.comments?.length || 0 }}</span>
          </div>
          <div class="stat-item" @click="toggleLike">
            <el-icon :class="{ active: isLiked }"><Star /></el-icon>
            <span>{{ post.likes || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论区 -->
    <div class="comments-section">
      <h3 class="section-title">评论 {{ post?.comments?.length || 0 }}</h3>

      <!-- 无评论时显示 -->
      <div v-if="!post?.comments?.length" class="no-comments">暂无评论</div>

      <!-- 评论列表 -->
      <div v-else class="comment-list">
        <div
          v-for="comment in post.comments"
          :key="comment.id"
          class="comment-item"
        >
          <div
            class="comment-author"
            @click="navigateToUserProfile(comment.user?.id)"
          >
            <el-avatar
              :size="36"
              :src="getAvatarUrl(comment.user?.avatar)"
              @error="() => true"
              class="user-avatar"
            >
              {{ comment.user?.username?.charAt(0).toUpperCase() || "?" }}
            </el-avatar>
            <div class="comment-meta">
              <div class="username">
                {{ comment.user?.username || "匿名用户" }}
              </div>
              <div class="comment-time">
                {{ formatTime(comment.created_at) }}
              </div>
            </div>
          </div>

          <div class="comment-content">{{ comment.content }}</div>

          <div class="comment-actions">
            <div
              class="action-item"
              :class="{ active: comment.is_liked }"
              @click="toggleCommentLike(comment)"
            >
              <el-icon><Star /></el-icon>
              <span>{{ comment.likes || 0 }}</span>
            </div>
            <div class="action-item" @click="showReplyInput(comment)">
              <el-icon><ChatDotRound /></el-icon>
              <span>回复</span>
            </div>
            <div
              v-if="isOwnComment(comment)"
              class="action-item delete-action"
              @click="confirmDeleteComment(comment)"
            >
              <el-icon><Delete /></el-icon>
              <span>删除</span>
            </div>
          </div>

          <!-- 评论的回复 -->
          <div class="replies" v-if="comment.replies?.length">
            <div
              v-for="reply in comment.replies"
              :key="reply.id"
              class="reply-item"
            >
              <div class="reply-author">
                <el-avatar
                  :size="28"
                  :src="getAvatarUrl(reply.user?.avatar)"
                  @error="() => true"
                  class="user-avatar"
                >
                  {{ reply.user?.username?.charAt(0).toUpperCase() || "?" }}
                </el-avatar>
                <div class="reply-meta">
                  <div class="username">
                    {{ reply.user?.username || "匿名用户" }}
                    <template v-if="reply.replyTo">
                      <span class="reply-to"
                        >回复 @{{ reply.replyTo?.username }}</span
                      >
                    </template>
                  </div>
                  <div class="reply-time">
                    {{ formatTime(reply.created_at) }}
                  </div>
                </div>
              </div>
              <div class="reply-content">{{ reply.content }}</div>
              <div class="reply-actions" v-if="isOwnComment(reply)">
                <div
                  class="action-item delete-action"
                  @click="confirmDeleteReply(comment.id, reply.id)"
                >
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 回复输入框 -->
          <div class="reply-input" v-if="comment.showReplyInput">
            <el-input
              v-model="comment.replyText"
              placeholder="写下你的回复..."
              :maxlength="200"
              show-word-limit
            >
              <template #append>
                <el-button
                  @click="submitReply(comment)"
                  :disabled="!comment.replyText?.trim()"
                >
                  回复
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部评论输入框 -->
    <div class="comment-input-area">
      <el-input
        v-model="commentText"
        placeholder="写下你的评论..."
        :maxlength="200"
        show-word-limit
      >
        <template #append>
          <el-button
            class="send-btn"
            :disabled="!commentText.trim()"
            :loading="submitting"
            @click="submitComment"
          >
            发送
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 编辑帖子对话框 -->
    <el-dialog
      v-model="showEditPostDialog"
      title="编辑帖子"
      width="90%"
      class="dark-dialog"
    >
      <el-form :model="editPostForm" ref="editPostFormRef">
        <el-form-item
          prop="title"
          :rules="[{ required: true, message: '请输入标题' }]"
        >
          <el-input v-model="editPostForm.title" placeholder="标题" />
        </el-form-item>
        <el-form-item
          prop="content"
          :rules="[{ required: true, message: '请输入内容' }]"
        >
          <el-input
            v-model="editPostForm.content"
            type="textarea"
            :rows="4"
            placeholder="内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditPostDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEditPost" :loading="submitting">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  View,
  ChatDotRound,
  Star,
  More,
  ArrowRight,
  Delete,
} from "@element-plus/icons-vue";
import { useCommunityStore } from "../stores/community";
import { useAuthStore } from "../stores/auth";
import dayjs from "dayjs";
import TheNavBar from "../components/TheNavBar.vue";

const API_BASE_URL = "http://47.98.210.7:3000";
const route = useRoute();
const router = useRouter();
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const post = ref(null);
const commentText = ref("");
const submitting = ref(false);
const isLiked = ref(false);
const isFollowing = ref(false);
const showEditPostDialog = ref(false);
const editPostForm = ref({ title: "", content: "" });
const showEditCommentDialog = ref(false);
const editCommentForm = ref({ content: "", id: null });
const editPostFormRef = ref(null);
const editCommentFormRef = ref(null);
const currentImageIndex = ref(0);
const loading = ref(false);

const formatTime = (time) => {
  return dayjs(time).format("YYYY-MM-DD HH:mm");
};

const carouselHeight = computed(() => {
  if (typeof window !== "undefined") {
    const viewportWidth = Math.min(600, window.innerWidth);
    return viewportWidth * 0.75 + "px";
  }
  return "75vw";
});

const isOwnPost = computed(() => {
  return authStore.user?.id === post.value?.user?.id;
});

const getAvatarUrl = (avatar) => {
  if (!avatar) return "";
  console.log("帖子详细" + avatar);

  // 如果是以 http 开头的完整 URL
  if (avatar.startsWith("http")) {
    // 如果包含重复的 API_BASE_URL
    if (avatar.includes(`${API_BASE_URL}${API_BASE_URL}`)) {
      // 提取文件名
      const matches = avatar.match(/avatar-[\w-]+\.\w+$/);
      if (matches) {
        return `${API_BASE_URL}/uploads/avatars/${matches[0]}`;
      }
    }
    // 如果是正确的完整路径，直接返回
    if (avatar.includes("/uploads/avatars/")) {
      return avatar;
    }
    // 如果缺少路径，提取文件名并添加正确路径
    const filename = avatar.match(/avatar-[\w-]+\.\w+$/)?.[0];
    if (filename) {
      return `${API_BASE_URL}/uploads/avatars/${filename}`;
    }
  }

  // 如果是相对路径，添加完整路径
  return `${API_BASE_URL}/uploads/avatars/${avatar}`;
};

const loadPost = async () => {
  try {
    loading.value = true;
    const postId = route.params.id;
    const response = await communityStore.getPost(postId);
    post.value = response;

    // 确保评论中的回复数组已初始化
    if (post.value.comments) {
      post.value.comments.forEach((comment) => {
        if (!comment.replies) {
          comment.replies = [];
        }
      });
    }

    isLiked.value = post.value.isLiked;
    isFollowing.value = post.value.user.isFollowing;
  } catch (error) {
    console.error("获取帖子详情失败:", error);
    ElMessage.error("获取帖子详情失败");
  } finally {
    loading.value = false;
  }
};

const submitComment = async () => {
  if (!commentText.value.trim()) return;

  try {
    submitting.value = true;
    await communityStore.createComment({
      postId: post.value.id,
      content: commentText.value,
    });

    commentText.value = "";
    await loadPost(); // 重新加载帖子以更新评论
    ElMessage.success("评论成功");
  } catch (error) {
    ElMessage.error("评论失败");
  } finally {
    submitting.value = false;
  }
};

const toggleLike = async () => {
  try {
    const result = await communityStore.likePost(post.value.id);
    if (result.action === "like") {
      post.value.likes++;
      isLiked.value = true;
    } else {
      post.value.likes--;
      isLiked.value = false;
    }
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

const toggleFollow = async () => {
  try {
    if (isFollowing.value) {
      // 显示确认对话框
      await ElMessageBox.confirm("确定要取消关注吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
    }

    if (isFollowing.value) {
      await communityStore.unfollowUser(post.value.user.id);
      ElMessage.success("已取消关注");
    } else {
      await communityStore.followUser(post.value.user.id);
      ElMessage.success("关注成功");
    }
    isFollowing.value = !isFollowing.value;
    // 重新加载帖子以获取最新的关注状态
    await loadPost();
  } catch (error) {
    if (error === "cancel") return;
    ElMessage.error(error.message || "操作失败");
  }
};

const handlePostCommand = async (command) => {
  if (command === "edit") {
    editPostForm.value = {
      title: post.value.title,
      content: post.value.content,
    };
    showEditPostDialog.value = true;
  } else if (command === "delete") {
    try {
      await ElMessageBox.confirm("确定要删除这篇帖子吗？", "提示", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      });
      await communityStore.deletePost(post.value.id);
      ElMessage.success("删除成功");
      router.back();
    } catch (error) {
      if (error === "cancel") return;
      ElMessage.error("删除失败");
    }
  }
};

const handleCommentCommand = async (command, comment) => {
  if (command === "edit") {
    editCommentForm.value = {
      content: comment.content,
      id: comment.id,
    };
    showEditCommentDialog.value = true;
  } else if (command === "delete") {
    try {
      await ElMessageBox.confirm("确定要删除这条评论吗？", "提示", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      });
      await communityStore.deleteComment(post.value.id, comment.id);
      ElMessage.success("删除成功");
      await loadPost();
    } catch (error) {
      if (error === "cancel") return;
      ElMessage.error("删除失败");
    }
  }
};

const submitEditPost = async () => {
  if (!editPostFormRef.value) return;
  try {
    await editPostFormRef.value.validate();
    submitting.value = true;
    await communityStore.updatePost(post.value.id, editPostForm.value);
    ElMessage.success("更新成功");
    showEditPostDialog.value = false;
    await loadPost();
  } catch (error) {
    ElMessage.error("更新失败");
  } finally {
    submitting.value = false;
  }
};

const submitEditComment = async () => {
  if (!editCommentFormRef.value) return;
  try {
    await editCommentFormRef.value.validate();
    submitting.value = true;
    await communityStore.updateComment(
      post.value.id,
      editCommentForm.value.id,
      editCommentForm.value.content
    );
    ElMessage.success("更新成功");
    showEditCommentDialog.value = false;
    await loadPost();
  } catch (error) {
    ElMessage.error("更新失败");
  } finally {
    submitting.value = false;
  }
};

// 点赞评论
const toggleCommentLike = async (comment) => {
  try {
    if (comment.isLiked) {
      await communityStore.unlikeComment(post.value.id, comment.id);
      comment.likes--;
    } else {
      await communityStore.likeComment(post.value.id, comment.id);
      comment.likes++;
    }
    comment.isLiked = !comment.isLiked;
  } catch (error) {
    ElMessage.error(error.message || "操作失败");
  }
};

// 显示回复输入框
const showReplyInput = (comment) => {
  // 关闭其他评论的回复框
  post.value.comments.forEach((c) => {
    if (c.id !== comment.id) {
      c.showReplyInput = false;
    }
  });
  comment.showReplyInput = !comment.showReplyInput;
  comment.replyText = "";
};

// 提交回复
const submitReply = async (comment) => {
  if (!comment.replyText?.trim()) return;
  try {
    submitting.value = true;
    await communityStore.replyToComment(post.value.id, comment.id, {
      content: comment.replyText,
    });
    comment.showReplyInput = false;
    await loadPost(); // 重新加载帖子以更新评论
    ElMessage.success("回复成功");
  } catch (error) {
    ElMessage.error(error.message || "回复失败");
  } finally {
    submitting.value = false;
  }
};

// 添加跳转到用户介绍页面的方法
const navigateToUserProfile = (userId) => {
  if (userId) {
    router.push(`/user/${userId}`);
  }
};

const nextImage = () => {
  if (post.value?.images && post.value.images.length > 0) {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % post.value.images.length;
  }
};

const prevImage = () => {
  if (post.value?.images && post.value.images.length > 0) {
    currentImageIndex.value =
      (currentImageIndex.value - 1 + post.value.images.length) %
      post.value.images.length;
  }
};

const isOwnComment = (comment) => {
  const userId = authStore.user?.id;
  return userId && comment.user?.id === userId;
};

const confirmDeleteComment = async (comment) => {
  try {
    await ElMessageBox.confirm("确定要删除这条评论吗？", "提示", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
    await communityStore.deleteComment(post.value.id, comment.id);
    ElMessage.success("删除成功");
    await loadPost();
  } catch (error) {
    if (error === "cancel") return;
    ElMessage.error("删除失败");
  }
};

const confirmDeleteReply = async (commentId, replyId) => {
  try {
    await ElMessageBox.confirm("确定要删除这条回复吗？", "提示", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });

    console.log(`确认删除回复: commentId=${commentId}, replyId=${replyId}`);

    await communityStore.deleteReply(post.value.id, commentId, replyId);
    ElMessage.success("删除成功");
    await loadPost();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除回复时发生错误:", error);
      ElMessage.error(`删除失败: ${error.message || "未知错误"}`);
    }
  }
};

onMounted(() => {
  loadPost();
});
</script>

<style scoped>
/* 基础样式 */
.post-detail-page {
  min-height: 100vh;
  background-color: #000;
  color: #fff;
  padding-bottom: 60px;
  overflow-y: auto;
  position: relative;
}

/* 顶部导航 */
.page-header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: #000;
}

.back-icon {
  font-size: 20px;
  color: #fff;
  cursor: pointer;
}

.page-header h2 {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #fff;
}

/* 帖子容器 */
.post-container {
  padding: 16px;
}

/* 图片轮播 */
.image-slider {
  position: relative;
  margin-bottom: 20px;
  overflow: hidden;
  background-color: #111;
  border-radius: 4px;
  width: 100%;
  max-height: 50vh;
  aspect-ratio: 4/3;
}

.main-image {
  width: 100%;
  display: block;
  max-height: 100%;
  object-fit: contain;
}

.slider-arrows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  pointer-events: none;
}

.arrow {
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
}

.image-indicator {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.user-avatar {
  cursor: pointer;
}

.user-meta {
  margin-left: 12px;
  flex: 1;
  text-align: left;
}

.username {
  font-weight: 500;
  color: #fff;
  margin-bottom: 4px;
  text-align: left;
}

.post-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: left;
}

.post-actions {
  padding: 8px;
}

.more-icon {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

/* 帖子内容 */
.post-content {
  margin-bottom: 16px;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 12px;
}

.post-text {
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 字数统计 */
.post-stats {
  margin: 16px 0;
}

.char-count {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  margin: 0 3px;
}

.divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 16px 0;
}

/* 互动统计 */
.interaction-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-stats,
.right-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
}

.stat-item .el-icon {
  font-size: 16px;
}

.stat-item .active {
  color: #ff9900;
}

/* 评论区 */
.comments-section {
  padding: 16px;
  background-color: #111;
  margin-top: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 16px;
  text-align: center;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  background-color: #222;
  border-radius: 8px;
  padding: 12px;
}

.comment-author {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
}

.comment-meta {
  margin-left: 8px;
  flex: 1;
  text-align: left;
}

.comment-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: left;
}

.comment-content {
  font-size: 15px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
}

.action-item.active {
  color: #ff9900;
}

/* 回复区域 */
.replies {
  margin-top: 12px;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-item {
  background-color: #333;
  border-radius: 8px;
  padding: 10px;
  position: relative;
}

.reply-author {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.reply-meta {
  margin-left: 8px;
  flex: 1;
  text-align: left;
}

.reply-to {
  color: #4080ff;
  margin-left: 4px;
}

.reply-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  text-align: left;
}

.reply-content {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  word-break: break-word;
}

.reply-input {
  margin-top: 12px;
}

.no-comments {
  text-align: center;
  padding: 32px 0;
  color: rgba(255, 255, 255, 0.5);
}

/* 底部评论输入 */
.comment-input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background-color: #000;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
  max-height: 64px;
}

/* 自定义Element Plus组件样式 */
:deep(.el-input__wrapper) {
  background-color: #222;
  box-shadow: none !important;
  border: none;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-input__count) {
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
}

.send-btn {
  background-color: #ffaa00 !important;
  color: #000 !important;
  border: none !important;
}

.send-btn:hover {
  background-color: #ffb52e !important;
}

/* 确保所有按钮使用橙黄色 */
:deep(.el-button--primary),
:deep(.el-button--default),
:deep(.reply-input .el-button) {
  background-color: #ffaa00 !important;
  color: #000 !important;
  border: none !important;
}

:deep(.el-button--primary:hover),
:deep(.el-button--default:hover),
:deep(.reply-input .el-button:hover) {
  background-color: #ffb52e !important;
}

/* 对于禁用状态的按钮 */
:deep(.el-button.is-disabled) {
  background-color: rgba(255, 170, 0, 0.5) !important;
  color: rgba(0, 0, 0, 0.5) !important;
}

/* 黑色对话框样式 */
:deep(.dark-dialog .el-dialog) {
  background-color: #222;
  border-radius: 8px;
}

:deep(.dark-dialog .el-dialog__title) {
  color: #fff;
}

:deep(.dark-dialog .el-dialog__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.dark-dialog .el-dialog__body),
:deep(.dark-dialog .el-dialog__footer) {
  color: #fff;
}

:deep(.dark-dialog .el-form-item__label) {
  color: rgba(255, 255, 255, 0.7);
}

/* 修复移动设备上的滚动问题 */
@media screen and (max-width: 767px) {
  html,
  body {
    position: fixed;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .post-detail-page {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 确保底部留出评论输入框的空间 */
  .comments-section {
    margin-bottom: 64px;
  }
}

/* 修复图片滑动问题 */
.main-image {
  touch-action: pan-y;
  user-select: none;
}

/* 回复按钮也使用橙黄色 */
:deep(.el-button--primary),
:deep(.reply-input .el-button),
:deep(.cosmic-button) {
  background-color: #ffaa00;
  color: #000;
  border: none;
}

:deep(.el-button--primary:hover),
:deep(.reply-input .el-button:hover) {
  background-color: #ffb52e;
}

/* 其他可能的按钮样式 */
.action-item.active {
  color: #ffaa00;
}

/* 回复链接颜色 */
.reply-to {
  color: #ffaa00;
  margin-left: 4px;
}

/* 用户名也确保左对齐 */
.comment-meta .username,
.reply-meta .username {
  text-align: left;
  font-weight: 500;
}

/* 添加删除按钮样式 */
.delete-action {
  color: #ff4d4f; /* 使用红色表示删除 */
}

.delete-action:hover {
  color: #ff7875;
}

/* 添加回复的操作样式 */
.reply-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.reply-item {
  background-color: #333;
  border-radius: 8px;
  padding: 10px;
  position: relative; /* 便于定位删除按钮 */
}
</style>
