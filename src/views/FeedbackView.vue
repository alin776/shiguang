<template>
  <div class="feedback-page">
    <!-- 顶部标题 -->
    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>问题反馈</h2>
    </div>

    <!-- 反馈列表 -->
    <div class="feedback-list" v-if="!loading && feedbacks.length > 0">
      <div
        v-for="feedback in feedbacks"
        :key="feedback.id"
        class="feedback-item"
        :class="{ 'has-reply': feedback.status === 'replied' }"
      >
        <div class="feedback-header">
          <span class="feedback-type">{{
            getFeedbackType(feedback.type)
          }}</span>
          <el-tag :type="getStatusType(feedback.status)" size="small">
            {{ getStatusText(feedback.status) }}
          </el-tag>
        </div>
        <div class="feedback-content">{{ feedback.content }}</div>
        <div class="feedback-time">{{ formatTime(feedback.created_at) }}</div>
        <template v-if="feedback.status === 'replied'">
          <div class="feedback-reply">
            <div class="reply-header">
              <div class="reply-title">官方回复</div>
              <div class="reply-time">
                {{ formatTime(feedback.reply_time) }}
              </div>
            </div>
            <div class="reply-content">{{ feedback.reply }}</div>
          </div>
        </template>
      </div>
    </div>
    <div v-else class="empty-state">
      <el-empty description="暂无反馈记录" />
    </div>

    <!-- 添加反馈按钮 -->
    <div class="fab-button" @click="showFeedbackDialog = true">
      <el-icon><Plus /></el-icon>
    </div>

    <!-- 反馈对话框 -->
    <el-dialog
      v-model="showFeedbackDialog"
      title="提交反馈"
      width="90%"
      class="mobile-dialog"
    >
      <el-form
        ref="feedbackFormRef"
        :model="feedbackForm"
        :rules="feedbackRules"
        label-position="top"
      >
        <el-form-item label="反馈类型" prop="type">
          <el-select v-model="feedbackForm.type" placeholder="请选择反馈类型">
            <el-option label="功能建议" value="feature" />
            <el-option label="问题反馈" value="bug" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="反馈内容" prop="content">
          <el-input
            v-model="feedbackForm.content"
            type="textarea"
            :rows="4"
            placeholder="请详细描述您的问题或建议..."
          />
        </el-form-item>

        <el-form-item label="联系方式" prop="contact">
          <el-input
            v-model="feedbackForm.contact"
            placeholder="选填，方便我们联系您"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="showFeedbackDialog = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitFeedback"
            :loading="submitting"
          >
            提交反馈
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, Plus } from "@element-plus/icons-vue";
import { useFeedbackStore } from "../stores/feedback";
import dayjs from "dayjs";

const router = useRouter();
const feedbackStore = useFeedbackStore();
const feedbacks = ref([]);
const showFeedbackDialog = ref(false);
const feedbackFormRef = ref(null);
const submitting = ref(false);
const loading = ref(false);

const feedbackForm = ref({
  type: "",
  content: "",
  contact: "",
});

const feedbackRules = {
  type: [{ required: true, message: "请选择反馈类型", trigger: "change" }],
  content: [
    { required: true, message: "请输入反馈内容", trigger: "blur" },
    { min: 10, message: "反馈内容至少10个字符", trigger: "blur" },
  ],
};

const getFeedbackType = (type) => {
  const types = {
    feature: "功能建议",
    bug: "问题反馈",
    other: "其他",
  };
  return types[type] || type;
};

const formatTime = (time) => {
  return dayjs(time).format("YYYY-MM-DD HH:mm");
};

const getStatusType = (status) => {
  const types = {
    pending: "warning",
    replied: "success",
  };
  return types[status] || "info";
};

const getStatusText = (status) => {
  const texts = {
    pending: "待处理",
    replied: "已回复",
  };
  return texts[status] || status;
};

const submitFeedback = async () => {
  if (!feedbackFormRef.value) return;

  try {
    await feedbackFormRef.value.validate();
    submitting.value = true;

    await feedbackStore.submitFeedback(feedbackForm.value);
    ElMessage.success("感谢您的反馈！");
    showFeedbackDialog.value = false;
    feedbackFormRef.value.resetFields();
    loadFeedbacks();
  } catch (error) {
    ElMessage.error(error.message || "提交失败，请重试");
  } finally {
    submitting.value = false;
  }
};

const loadFeedbacks = async () => {
  try {
    loading.value = true;
    console.log('开始加载反馈数据');
    feedbacks.value = await feedbackStore.getFeedbacks();
    console.log('获取到反馈数据:', feedbacks.value);
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    ElMessage.error("获取反馈列表失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadFeedbacks();
});
</script>

<style scoped>
.feedback-page {
  min-height: 100vh;
  padding-bottom: 80px;
  background: var(--bg-color);
}

.page-header {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: var(--card-bg);
  box-shadow: 0 1px 4px var(--shadow-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  flex: 1;
  text-align: center;
  color: var(--text-color);
}

.back-icon {
  font-size: 20px;
  margin-right: 10px;
  cursor: pointer;
  color: var(--text-color);
}

.feedback-list {
  padding: 16px;
}

.feedback-item {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  background-color: var(--card-bg);
  box-shadow: 0 2px 8px var(--shadow-color);
  overflow: hidden;
}

.feedback-item.has-reply {
  border-left: 4px solid var(--el-color-success);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.feedback-type {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-color);
}

.feedback-content {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color);
}

.feedback-time {
  font-size: 12px;
  color: var(--placeholder-color);
  text-align: right;
}

.feedback-reply {
  margin-top: 16px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reply-title {
  font-weight: 500;
  font-size: 14px;
  color: var(--primary-color);
}

.reply-time {
  font-size: 12px;
  color: var(--placeholder-color);
}

.reply-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color);
}

.fab-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px var(--shadow-color);
  z-index: 100;
}

.fab-button .el-icon {
  font-size: 24px;
}

.mobile-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  color: var(--placeholder-color);
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-textarea__inner) {
  min-height: 120px !important;
}
</style>
