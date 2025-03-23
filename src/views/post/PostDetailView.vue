<template>
  <div class="post-detail-page">
    <!-- 页面头部 - 删除这个多余的标题栏 -->
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
        @report="openReportDialog"
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
        @report-comment="openCommentReportDialog"
        @reply-to-reply="handleReplyToReply"
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
    
    <!-- 举报对话框 -->
    <el-dialog v-model="showReportDialog" title="举报帖子" width="90%" center>
      <div class="report-form">
        <p>请选择举报原因：</p>
        <el-form :model="reportForm" label-position="top">
          <el-form-item label="举报原因">
            <el-radio-group v-model="reportForm.reason">
              <el-radio label="垃圾广告">垃圾广告</el-radio>
              <el-radio label="色情低俗">色情低俗</el-radio>
              <el-radio label="违法违规">违法违规</el-radio>
              <el-radio label="人身攻击">人身攻击</el-radio>
              <el-radio label="引战谩骂">引战谩骂</el-radio>
              <el-radio label="其他">其他</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="reportForm.reason === '其他'" label="补充说明">
            <el-input
              v-model="reportForm.detail"
              type="textarea"
              :rows="3"
              placeholder="请描述具体情况..."
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showReportDialog = false">取消</el-button>
          <el-button type="primary" @click="submitReport" :disabled="!reportForm.reason">提交举报</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 评论举报对话框 -->
    <el-dialog v-model="showCommentReportDialog" title="举报评论" width="90%" center>
      <div class="report-form">
        <p>请选择举报原因：</p>
        <el-form :model="commentReportForm" label-position="top">
          <el-form-item label="举报原因">
            <el-radio-group v-model="commentReportForm.reason">
              <el-radio label="垃圾广告">垃圾广告</el-radio>
              <el-radio label="色情低俗">色情低俗</el-radio>
              <el-radio label="违法违规">违法违规</el-radio>
              <el-radio label="人身攻击">人身攻击</el-radio>
              <el-radio label="引战谩骂">引战谩骂</el-radio>
              <el-radio label="其他">其他</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="commentReportForm.reason === '其他'" label="补充说明">
            <el-input
              v-model="commentReportForm.detail"
              type="textarea"
              :rows="3"
              placeholder="请描述具体情况..."
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCommentReportDialog = false">取消</el-button>
          <el-button type="primary" @click="submitCommentReport" :disabled="!commentReportForm.reason">提交举报</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useCommunityStore } from "@/stores/community";
import { useAuthStore } from "@/stores/auth";
import { Back } from '@element-plus/icons-vue'; // 导入Back图标
import { useUnmountDetection } from "../../composables/useUnmountDetection";
import formatTime, { formatRelativeTime } from "../../utils/formatTime";
import { getDetailImageUrl } from "../../utils/imageCompression";
import { API_BASE_URL } from "../../config";

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
const showReportDialog = ref(false);
const showCommentReportDialog = ref(false);
const reportForm = ref({ reason: "", detail: "" });
const commentReportForm = ref({ reason: "", detail: "", commentId: null });

// 计算属性
const currentUserId = computed(() => authStore.user?.id);
const isOwnPost = computed(() => post.value?.user?.id === currentUserId.value);

// 计算评论总数
const commentCount = computed(() => {
  if (!comments.value) return 0;
  
  // 计算评论和回复的总数
  let count = comments.value.length;
  
  // 加上所有评论的回复数
  comments.value.forEach(comment => {
    if (comment.replies && Array.isArray(comment.replies)) {
      count += comment.replies.length;
    }
  });
  
  return count;
});

// 在图片URL处理的地方使用getDetailImageUrl
const processImageUrl = (imageUrl) => {
  if (!imageUrl) return "";
  
  try {
    // 确保正确的URL格式
    let processedUrl = imageUrl;
    
    // 替换localhost为正确的服务器地址
    if (processedUrl.includes('localhost:3000')) {
      processedUrl = processedUrl.replace('http://localhost:3000', API_BASE_URL);
    }
    
    // 如果不是以http开头，添加API_BASE_URL
    if (!processedUrl.startsWith('http')) {
      processedUrl = processedUrl.startsWith('/') ? 
        `${API_BASE_URL}${processedUrl}` : 
        `${API_BASE_URL}/${processedUrl}`;
    }
    
    // 确保不会出现重复的API_BASE_URL
    if (processedUrl.includes(`${API_BASE_URL}${API_BASE_URL}`)) {
      processedUrl = processedUrl.replace(`${API_BASE_URL}${API_BASE_URL}`, API_BASE_URL);
    }
    
    // 应用图片压缩处理，但保持较高质量
    return getDetailImageUrl(processedUrl);
  } catch (error) {
    console.error('处理图片URL出错:', error);
    return imageUrl;
  }
};

// 预加载帖子图片
const preloadImages = (images) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return Promise.resolve();
  }
  
  // 创建一个图片加载的Promise数组
  const imagePromises = images.map(imageUrl => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false); // 即使加载失败也继续
      img.src = imageUrl;
      // 设置5秒超时
      setTimeout(() => resolve(false), 5000);
    });
  });
  
  // 使用Promise.all并行加载所有图片
  return Promise.all(imagePromises)
    .then(() => console.log('帖子图片预加载完成'))
    .catch(err => console.error('帖子图片预加载失败:', err));
};

// 处理帖子数据函数
const processPost = async (data) => {
  console.log('Processing post data:', data);
  
  // 处理图片
  let images = [];
  if (data.images) {
    try {
      if (typeof data.images === 'string') {
        // 尝试解析JSON字符串
        images = JSON.parse(data.images);
      } else if (Array.isArray(data.images)) {
        images = data.images;
      }
      
      // 应用图片处理
      images = images.map(img => processImageUrl(img));
      
      // 预加载图片（但不阻塞UI渲染）
      preloadImages(images);
    } catch (error) {
      console.error('处理帖子图片出错:', error);
      images = [];
    }
  }
  
  // 创建最终的帖子对象，确保保留所有字段
  post.value = {
    ...data,
    images: images,
    // 确保标题一定存在
    title: data.title || "无标题"
  };
  
  // 调试输出
  console.log('处理后的帖子数据:', post.value);
};

// 获取帖子评论
const loadComments = async () => {
  try {
    if (!post.value || !post.value.id) return;
    
    // 检查post.value是否有comments属性
    if (post.value.comments && Array.isArray(post.value.comments)) {
      comments.value = post.value.comments;
      return;
    }
    
    // 如果没有，尝试从API获取评论
    const response = await communityStore.getPostComments(post.value.id);
    if (response && Array.isArray(response)) {
      comments.value = response;
    } else {
      comments.value = [];
    }
  } catch (error) {
    console.error('加载评论失败:', error);
    comments.value = [];
  }
};

// 获取帖子详情
const getPostDetail = async () => {
  try {
    loading.value = true;
    
    // 检查路由参数是否存在
    if (!route.params.id) {
      console.error("无效的帖子ID：路由参数为空");
      ElMessage.error("无效的帖子ID");
      setTimeout(() => router.push('/community'), 1500);
      return;
    }
    
    console.log("正在获取帖子详情，ID:", route.params.id);
    
    // 确保ID是有效的数字或字符串
    if (route.params.id === "undefined" || route.params.id === "null") {
      console.error(`无效的帖子ID: ${route.params.id}`);
      ElMessage.error("无效的帖子ID格式");
      setTimeout(() => router.push('/community'), 1500);
      return;
    }
    
    const response = await communityStore.getPost(route.params.id);
    console.log("获取帖子响应:", response);
    
    if (!response) {
      console.error("获取帖子详情失败: 响应为空");
      ElMessage.error("获取帖子详情失败");
      setTimeout(() => router.push('/community'), 1500);
      return;
    }
    
    // 检查是否有错误标志
    if (response.error) {
      console.error("获取帖子详情出错:", response.error);
      ElMessage.error(`获取帖子详情失败: ${response.error}`);
      setTimeout(() => router.push('/community'), 1500);
      return;
    }
    
    // 修改帖子对象，包括解析图片和处理时间格式
    const data = response;
    
    // 处理评论数量
    // 计算所有评论和子评论的数量
    const countComments = (comments) => {
      let count = comments.length;
      for (const comment of comments) {
        if (comment.replies && comment.replies.length > 0) {
          count += comment.replies.length;
        }
      }
      return count;
    };
    
    // 计算评论总数
    const totalComments = data.comments ? countComments(data.comments) : 0;
    data.comment_count = totalComments;
    data.reply_count = totalComments;
    
    // 使用processPost函数处理帖子数据
    processPost(data);
    
    // 处理完成后加载评论
    loadComments();
    
    // 增加帖子浏览量 - 调用正确的方法或暂时注释掉
    // communityStore.incrementViews方法不存在，暂时注释掉
    // if (data.id) {
    //   communityStore.incrementViews(data.id);
    // }
    
    // 尝试使用可能存在的其他方法记录浏览量
    try {
      if (data.id && communityStore.viewPost) {
        communityStore.viewPost(data.id);
      }
    } catch (e) {
      console.log('记录浏览量失败:', e);
      // 忽略错误，不影响主流程
    }
    
    // 检查URL中是否有锚点，如果有，滚动到对应评论
    if (location.hash && location.hash.startsWith('#comment-')) {
      const commentId = location.hash.replace('#comment-', '');
      // 设置一个短暂延迟，确保页面已经渲染好
      setTimeout(() => {
        const commentElement = document.getElementById(`comment-${commentId}`);
        if (commentElement) {
          commentElement.scrollIntoView({ behavior: 'smooth' });
          // 添加一个高亮效果
          commentElement.classList.add('highlighted-comment');
          setTimeout(() => {
            commentElement.classList.remove('highlighted-comment');
          }, 3000);
        }
      }, 500);
    }
  } catch (error) {
    console.error("获取帖子详情失败:", error);
    ElMessage.error("获取帖子详情失败");
    setTimeout(() => router.push('/community'), 1500);
  } finally {
    loading.value = false;
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

// 处理回复回复的逻辑
const handleReplyToReply = ({ commentId, replyToUserId: targetUserId, replyToUsername }) => {
  replyMode.value = true;
  replyToCommentId.value = commentId;
  
  // 避免变量命名冲突，使用不同的变量名
  if (targetUserId !== undefined && targetUserId !== null) {
    replyToUserId.value = targetUserId;
  } else {
    replyToUserId.value = null;
  }
  
  replyUsername.value = replyToUsername || "用户";
};

// 取消回复
const cancelReply = () => {
  replyMode.value = false;
  replyToCommentId.value = null;
  replyToUserId.value = null;
  replyUsername.value = "";
};

// 提交评论
const submitComment = async (commentData) => {
  try {
    // 确保音频路径正确
    const audioPath = commentData.audio;
    // 获取图片数据
    const images = commentData.images || [];
    
    if (replyMode.value && replyToCommentId.value) {
      // 回复评论
      await communityStore.replyToComment(
        post.value.id,
        replyToCommentId.value,
        commentData.content || '', // 确保空内容传递为空字符串而不是null或undefined
        replyToUserId.value,
        audioPath,
        images // 传递图片/表情包数据
      );
      ElMessage.success("回复成功");
    } else {
      // 新评论
      await communityStore.createComment(
        post.value.id, 
        commentData.content || '', // 确保空内容传递为空字符串而不是null或undefined
        audioPath,
        images
      );
      ElMessage.success("评论成功");
    }

    // 重新加载帖子详情及评论
    await getPostDetail();

    // 重置回复状态
    cancelReply();
  } catch (error) {
    console.error('评论提交失败:', error);
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

// 显示举报对话框
const openReportDialog = () => {
  reportForm.value = { reason: "", detail: "" };
  showReportDialog.value = true;
};

// 显示评论举报对话框
const openCommentReportDialog = (commentId) => {
  commentReportForm.value = { reason: "", detail: "", commentId };
  showCommentReportDialog.value = true;
};

// 导航到用户个人页
const navigateToUserProfile = (userId) => {
  if (userId) {
    router.push(`/user/${userId}`);
  }
};

// 提交举报
const submitReport = async () => {
  try {
    await communityStore.reportPost(post.value.id, reportForm.value.reason, reportForm.value.detail);
    ElMessage.success("举报提交成功");
    showReportDialog.value = false;
  } catch (error) {
    ElMessage.error("举报提交失败: " + (error.message || "未知错误"));
  }
};

// 提交评论举报
const submitCommentReport = async () => {
  try {
    await communityStore.reportComment(commentReportForm.value.commentId, commentReportForm.value.reason, commentReportForm.value.detail);
    ElMessage.success("评论举报提交成功");
    showCommentReportDialog.value = false;
  } catch (error) {
    ElMessage.error("评论举报提交失败: " + (error.message || "未知错误"));
  }
};

// 返回上一页方法
const goBack = () => {
  router.back();
};

// 生命周期钩子
onMounted(() => {
  // 初始化空数组，确保渲染前有默认值
  post.value = null;
  comments.value = [];
  loading.value = true;
  
  // 获取帖子数据
  getPostDetail();
});
</script>

<style scoped>
.post-detail-page {
  min-height: 100vh;
  background-color: #f9f9f9;
  padding-bottom: 70px; /* 为底部导航栏留出空间 */
}

@media (min-width: 768px) {
  .post-detail-page {
    max-width: 768px;
    margin: 0 auto;
    background: #ffffff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border-radius: 20px;
    overflow: hidden;
    margin-top: 20px;
    margin-bottom: 20px;
  }
}

.loading-container {
  padding: 20px;
  background-color: #ffffff;
  margin-top: 60px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 对话框样式覆盖 */
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  color: #333333;
}

:deep(.el-dialog__header) {
  padding: 20px;
  background-color: rgba(74, 144, 226, 0.05);
  margin-right: 0;
  color: #333333;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: #4A90E2;
}

:deep(.el-dialog__body) {
  padding: 30px 20px;
  color: #333333;
  font-size: 16px;
}

:deep(.el-dialog__footer) {
  padding: 16px 20px;
  background-color: rgba(250, 250, 250, 0.8);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

:deep(.el-button) {
  border-radius: 20px;
  padding: 8px 20px;
  transition: all 0.3s ease;
}

:deep(.el-button:not(.el-button--danger):hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-button--danger) {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

:deep(.el-button--danger:hover) {
  background-color: #ff7875;
  border-color: #ff7875;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
}

/* 注释掉或移除不再需要的page-header相关样式 */
/*
.page-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  z-index: 10;
  padding-top: var(--safe-area-top);
  height: calc(50px + var(--safe-area-top));
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.header-left, .header-right {
  min-width: 60px;
  display: flex;
  align-items: center;
}
*/

/* 从锚点跳转过来的评论高亮样式 */
:deep(.highlighted-comment) {
  animation: highlight-pulse 3s ease-out;
  border-left: 3px solid #1677ff;
}

@keyframes highlight-pulse {
  0% {
    background-color: rgba(22, 119, 255, 0.2);
    box-shadow: 0 0 15px rgba(22, 119, 255, 0.5);
  }
  70% {
    background-color: rgba(22, 119, 255, 0.1);
    box-shadow: 0 0 10px rgba(22, 119, 255, 0.3);
  }
  100% {
    background-color: transparent;
    box-shadow: none;
  }
}
</style>
