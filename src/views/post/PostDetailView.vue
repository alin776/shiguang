<template>
  <div class="post-detail-page">
    <!-- 帖子头部：用户信息和导航 -->
    <PostHeader
      :post="post"
      :isOwnPost="isOwnPost"
      @user-click="navigateToUserProfile"
      @post-command="handlePostCommand"
    />

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    <div v-else-if="post">
      <!-- 帖子内容：图片和文字 -->
      <PostContent :post="post" />

      <!-- 交互操作：点赞、关注等 -->
      <PostActions
        :post="post"
        :userId="currentUserId"
        @like="toggleLike"
        @follow="toggleFollow"
      />

      <!-- 评论区域 -->
      <CommentSection
        :comments="comments"
        :userId="currentUserId"
        :replyMode="replyMode"
        :replyUsername="replyUsername"
        @user-click="navigateToUserProfile"
        @reply="prepareReply"
        @like-comment="handleLikeComment"
        @delete-comment="handleDeleteComment"
        @delete-reply="handleDeleteReply"
        @submit-comment="submitComment"
        @cancel-reply="cancelReply"
      />
    </div>

    <el-empty v-else description="帖子不存在或已被删除" />

    <!-- 确认删除对话框 -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="90%" center>
      <p>确定要删除这条帖子吗？删除后无法恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirm = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确定删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useCommunityStore } from "../../stores/community";
import { useAuthStore } from "../../stores/auth";
import { useUnmountDetection } from "../../composables/useUnmountDetection";

// 导入组件
import PostHeader from "./components/PostHeader.vue";
import PostContent from "./components/PostContent.vue";
import PostActions from "./components/PostActions.vue";
import CommentSection from "./components/CommentSection.vue";

const router = useRouter();
const route = useRoute();
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const { isMounted, checkMounted } = useUnmountDetection();

// 状态变量
const post = ref(null);
const comments = ref([]);
const loading = ref(true);
const replyMode = ref(false);
const replyToCommentId = ref(null);
const replyToUserId = ref(null);
const replyUsername = ref("");
const showDeleteConfirm = ref(false);

// 计算属性
const currentUserId = computed(() => authStore.user?.id);
const isOwnPost = computed(() => post.value?.user?.id === currentUserId.value);

// 获取帖子详情
const fetchPostDetails = async () => {
  try {
    loading.value = true;
    const postId = route.params.id;
    const data = await communityStore.getPost(postId);
    if (!checkMounted()) return;
    post.value = data;
    comments.value = data.comments || [];
  } catch (error) {
    if (!checkMounted()) return;
    ElMessage.error("加载失败: " + (error.message || "未知错误"));
  } finally {
    if (checkMounted()) {
      loading.value = false;
    }
  }
};

// 帖子操作处理
const handlePostCommand = (command) => {
  if (command === "edit") {
    // TODO: 实现编辑功能
    ElMessage.info("编辑功能开发中");
  } else if (command === "delete") {
    showDeleteConfirm.value = true;
  }
};

// 确认删除帖子
const confirmDelete = async () => {
  try {
    await communityStore.deletePost(post.value.id);
    ElMessage.success("删除成功");
    router.push("/community");
  } catch (error) {
    ElMessage.error("删除失败: " + (error.message || "未知错误"));
  } finally {
    showDeleteConfirm.value = false;
  }
};

// 切换点赞状态
const toggleLike = async () => {
  if (!post.value) return;

  try {
    if (post.value.is_liked) {
      await communityStore.unlikePost(post.value.id);
      post.value.likes--;
    } else {
      await communityStore.likePost(post.value.id);
      post.value.likes++;
    }
    post.value.is_liked = !post.value.is_liked;
  } catch (error) {
    ElMessage.error("操作失败: " + (error.message || "未知错误"));
  }
};

// 切换关注状态
const toggleFollow = async () => {
  if (!post.value?.user?.id) return;

  try {
    console.log("当前关注状态:", post.value.user.is_following);
    
    if (post.value.user.is_following) {
      console.log("正在取消关注用户:", post.value.user.id);
      await communityStore.unfollowUser(post.value.user.id);
    } else {
      console.log("正在关注用户:", post.value.user.id);
      await communityStore.followUser(post.value.user.id);
    }
    
    // 切换关注状态
    post.value.user.is_following = !post.value.user.is_following;
    console.log("关注状态已更新为:", post.value.user.is_following);
  } catch (error) {
    console.error("关注操作失败:", error);
    ElMessage.error("操作失败: " + (error.message || "未知错误"));
  }
};

// 准备回复评论
const prepareReply = (commentId) => {
  replyMode.value = true;
  replyToCommentId.value = commentId;

  // 查找评论用户名
  const comment = comments.value.find((c) => c.id === commentId);
  if (comment) {
    replyToUserId.value = comment.user?.id;
    replyUsername.value = comment.user?.username || "用户";
  }
};

// 取消回复
const cancelReply = () => {
  replyMode.value = false;
  replyToCommentId.value = null;
  replyToUserId.value = null;
  replyUsername.value = "";
};

// 提交评论
const submitComment = async (content) => {
  try {
    if (replyMode.value && replyToCommentId.value) {
      // 回复评论
      await communityStore.replyToComment(
        post.value.id,
        replyToCommentId.value,
        content,
        replyToUserId.value
      );
      ElMessage.success("回复成功");
    } else {
      // 新评论
      await communityStore.createComment(post.value.id, content);
      ElMessage.success("评论成功");
    }

    // 重新加载评论
    const data = await communityStore.getPost(post.value.id);
    comments.value = data.comments || [];

    // 重置回复状态
    cancelReply();
  } catch (error) {
    ElMessage.error("评论失败: " + (error.message || "未知错误"));
  }
};

// 处理评论点赞
const handleLikeComment = async ({ commentId, liked }) => {
  try {
    if (liked) {
      await communityStore.likeComment(post.value.id, commentId);
    } else {
      await communityStore.unlikeComment(post.value.id, commentId);
    }
    
    // 更新评论列表
    const commentIndex = comments.value.findIndex((c) => c.id === commentId);
    if (commentIndex !== -1) {
      comments.value[commentIndex].is_liked = liked;
      comments.value[commentIndex].likes = liked
        ? (comments.value[commentIndex].likes || 0) + 1
        : Math.max((comments.value[commentIndex].likes || 0) - 1, 0);
    }
  } catch (error) {
    ElMessage.error("操作失败: " + (error.message || "未知错误"));
  }
};

// 删除评论
const handleDeleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm("确定要删除这条评论吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await communityStore.deleteComment(post.value.id, commentId);
    ElMessage.success("删除成功");

    // 更新评论列表
    comments.value = comments.value.filter((c) => c.id !== commentId);
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败: " + (error.message || "未知错误"));
    }
  }
};

// 删除回复
const handleDeleteReply = async (replyId) => {
  try {
    await ElMessageBox.confirm("确定要删除这条回复吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await communityStore.deleteReply(replyId);
    ElMessage.success("删除成功");

    // 更新评论列表中的回复
    comments.value = comments.value.map((comment) => {
      if (comment.replies) {
        comment.replies = comment.replies.filter(
          (reply) => reply.id !== replyId
        );
      }
      return comment;
    });
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败: " + (error.message || "未知错误"));
    }
  }
};

// 导航到用户个人页
const navigateToUserProfile = (userId) => {
  if (userId) {
    router.push(`/user/${userId}`);
  }
};

// 生命周期钩子
onMounted(() => {
  fetchPostDetails();
});
</script>

<style scoped>
.post-detail-page {
  min-height: 100vh;
  background: var(--bg-color);
  display: flex;
  flex-direction: column;
  position: relative;
}

@media (min-width: 768px) {
  .post-detail-page {
    max-width: 768px;
    margin: 0 auto;
  }
}

.loading-container {
  padding: 16px;
  background-color: var(--card-bg);
  margin-top: 60px;
}
</style>
