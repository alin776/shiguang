<template>
  <TheNavBar />
  <div class="post-detail-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>时光小镇</h2>
    </div>

    <!-- 帖子内容 -->
    <div class="post-content" v-if="post">
      <!-- 图片轮播 -->
      <div class="image-slider" v-if="post.images?.length">
        <el-carousel
          :interval="4000"
          :height="carouselHeight"
          indicator-position="outside"
          arrow="always"
        >
          <el-carousel-item v-for="image in post.images" :key="image">
            <img :src="image" :alt="post.title" class="carousel-image" />
          </el-carousel-item>
        </el-carousel>
      </div>

      <!-- 作者信息 -->
      <div class="user-info">
        <el-avatar
          :size="40"
          :src="getAvatarUrl(post.user?.avatar)"
          @error="() => true"
          @click="navigateToUserProfile(post.user?.id)"
          class="clickable-avatar"
        >
          {{ getAvatarUrl(post.user?.avatar) || "?" }}
        </el-avatar>
        <div class="user-meta">
          <div class="username">{{ post.user?.username || "匿名用户" }}</div>
          <div class="post-time">{{ formatTime(post.created_at) }}</div>
        </div>
        <el-button
          class="follow-btn"
          type="primary"
          round
          size="small"
          :class="{ following: isFollowing }"
          @click.stop="toggleFollow"
          v-if="!isOwnPost"
        >
          {{ isFollowing ? "已关注" : "关注" }}
        </el-button>
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

      <!-- 标题和内容 -->
      <div class="post-main">
        <h1 class="post-title">{{ post.title }}</h1>
        <p class="post-text">{{ post.content }}</p>
      </div>

      <!-- 互动统计 -->
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

      <!-- 评论列表 -->
      <div class="comment-list" v-if="post?.comments?.length">
        <div
          v-for="comment in post.comments"
          :key="comment.id"
          class="comment-item"
        >
          <el-avatar
            :size="32"
            :src="getAvatarUrl(comment.user?.avatar)"
            @error="() => true"
            @click="navigateToUserProfile(comment.user?.id)"
            class="clickable-avatar"
          >
            {{ comment.user?.username?.charAt(0).toUpperCase() || "?" }}
          </el-avatar>
          <div class="comment-content">
            <div class="comment-header">
              <span class="username">{{
                comment.user?.username || "匿名用户"
              }}</span>
              <span class="comment-time">{{
                formatTime(comment.created_at)
              }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
            <!-- 评论操作栏 -->
            <div class="comment-actions">
              <span
                class="action-item"
                @click.stop="toggleCommentLike(comment)"
              >
                <el-icon :class="{ active: comment.isLiked }"><Star /></el-icon>
                <span>{{ comment.likes || 0 }}</span>
              </span>
              <span class="action-item" @click.stop="showReplyInput(comment)">
                <el-icon><ChatDotRound /></el-icon>
                <span>回复</span>
              </span>
            </div>
            <!-- 回复列表 -->
            <div v-if="comment.replies?.length" class="reply-list">
              <div
                v-for="reply in comment.replies"
                :key="reply.id"
                class="reply-item"
              >
                <div class="reply-header">
                  <span class="username">{{ reply.user?.username }}</span>
                  <template v-if="reply.replyTo">
                    回复
                    <span class="username">@{{ reply.replyTo?.username }}</span>
                  </template>
                </div>
                <p class="reply-text">{{ reply.content }}</p>
              </div>
            </div>
            <!-- 回复输入框 -->
            <div v-if="comment.showReplyInput" class="reply-input">
              <el-input
                v-model="comment.replyText"
                placeholder="写下你的回复..."
                :maxlength="200"
                show-word-limit
              >
                <template #append>
                  <el-button
                    type="primary"
                    :disabled="!comment.replyText?.trim()"
                    :loading="submitting"
                    @click.stop="submitReply(comment)"
                  >
                    回复
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>

      <!-- 空评论状态 -->
      <div v-else class="empty-comments">
        <el-empty description="暂无评论" />
      </div>
    </div>

    <!-- 底部评论栏 -->
    <div class="comment-bar">
      <div class="comment-input">
        <el-input
          v-model="commentText"
          placeholder="写下你的评论..."
          :maxlength="200"
          show-word-limit
        >
          <template #append>
            <el-button
              class="send-btn"
              type="primary"
              :disabled="!commentText.trim()"
              :loading="submitting"
              @click="submitComment"
            >
              发送
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 编辑帖子对话框 -->
    <el-dialog
      v-model="showEditPostDialog"
      title="编辑帖子"
      width="90%"
      :close-on-click-modal="false"
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

    <!-- 编辑评论对话框 -->
    <el-dialog
      v-model="showEditCommentDialog"
      title="编辑评论"
      width="90%"
      :close-on-click-modal="false"
    >
      <el-form :model="editCommentForm" ref="editCommentFormRef">
        <el-form-item
          prop="content"
          :rules="[{ required: true, message: '请输入评论内容' }]"
        >
          <el-input
            v-model="editCommentForm.content"
            type="textarea"
            :rows="4"
            placeholder="评论内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditCommentDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitEditComment"
          :loading="submitting"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  View,
  ChatDotRound,
  Star,
  More,
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
    const response = await communityStore.getPost(route.params.id);

    // 处理帖子数据中的头像路径
    post.value = {
      ...response,
      user: {
        ...response.user,
        avatar: getAvatarUrl(response.user?.avatar),
      },
      comments: response.comments?.map((comment) => ({
        ...comment,
        user: {
          ...comment.user,
          avatar: getAvatarUrl(comment.user?.avatar),
        },
        replies: comment.replies?.map((reply) => ({
          ...reply,
          user: {
            ...reply.user,
            avatar: getAvatarUrl(reply.user?.avatar),
          },
        })),
      })),
    };

    isLiked.value = post.value.isLiked;
    isFollowing.value = post.value.user.isFollowing;
  } catch (error) {
    console.error("获取帖子详情失败:", error);
    ElMessage.error("获取帖子详情失败");
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

onMounted(() => {
  loadPost();
});
</script>

<style scoped>
.post-detail-page {
  padding-top: 60px;
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 60px;
  max-width: 600px;
  margin: 0 auto;
  text-align: left;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  overflow-y: auto;
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

.post-content {
  background: #fff;
  padding: 24px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  position: relative;
}

.follow-btn {
  position: absolute;
  right: 0;
  padding: 6px 16px;
}

.user-meta {
  flex: 1;
}

.post-main {
  text-align: center;
  margin: 24px 0;
}

.post-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px;
  line-height: 1.4;
  text-align: center;
}

.post-text {
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  text-align: left;
}

.image-slider {
  margin: 0 0 20px;
  width: 100%;
  background: #000;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #ffffff;
}

:deep(.el-carousel) {
  background: #ffffff;
}

:deep(.el-carousel__arrow) {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  border: none;
  height: 36px;
  width: 36px;
}

:deep(.el-carousel__arrow:hover) {
  background-color: rgba(0, 0, 0, 0.5);
}

:deep(.el-carousel__indicators) {
  bottom: -25px;
}

:deep(.el-carousel__indicators--outside button) {
  background-color: rgba(0, 0, 0, 0.24);
}

:deep(.el-carousel__indicators--outside button.is-active) {
  background-color: var(--el-color-primary);
}

.interaction-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
}

.left-stats,
.right-stats {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}

.stat-item:hover {
  color: var(--el-color-primary);
}

.stat-item .el-icon {
  font-size: 16px;
}

.stat-item .active {
  color: #409eff;
}

.comments-section {
  background: #fff;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f2f5;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f5f7fa;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  margin: 0;
  font-size: 15px;
  color: #606266;
  line-height: 1.5;
}

.empty-comments {
  padding: 32px 0;
}

.comment-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
  max-width: 600px;
  margin: 0 auto;
}

.comment-input {
  padding-right: 8px;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-input__wrapper) {
  padding-right: 8px;
}

:deep(.el-input__count) {
  background: transparent;
  right: 105px !important;
}

.comment-input .send-btn {
  min-width: 70px;
  background-color: #67c23a;
  border-color: #67c23a;
  color: #ffffff;
}

.comment-input .send-btn:hover {
  background-color: #85ce61;
  border-color: #85ce61;
  color: #ffffff;
}

.comment-input .send-btn:active {
  background-color: #529b2e;
  border-color: #529b2e;
  color: #ffffff;
}

@media screen and (min-width: 768px) {
  .post-detail-page {
    max-width: 600px;
    margin: 0 auto;
    position: relative;
    height: auto;
    min-height: 100vh;
  }
}

:deep(.nav-bar) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.post-actions {
  position: absolute;
  right: 0;
  top: 0;
}

.more-icon {
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
}

.more-icon:hover {
  color: var(--el-color-primary);
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-header .username {
  flex: 1;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s;
}

.action-item:hover {
  color: var(--el-color-primary);
}

.action-item .active {
  color: var(--el-color-primary);
}

.reply-list {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.reply-item {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.reply-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.reply-header {
  font-size: 13px;
  margin-bottom: 4px;
}

.reply-header .username {
  color: var(--el-color-primary);
  font-weight: 500;
}

.reply-text {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.reply-input {
  margin-top: 12px;
}

.clickable-avatar {
  cursor: pointer;
  transition: transform 0.2s;
}

.clickable-avatar:hover {
  transform: scale(1.05);
}
</style>
