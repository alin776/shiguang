<template>
  <div class="comments-section">
    <h3 class="comments-title">评论 ({{ totalComments }})</h3>

    <div class="comments-list">
      <div v-if="comments.length === 0" class="no-comments">
        暂无评论，快来发表第一条评论吧！
      </div>

      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :userId="userId"
        @user-click="$emit('user-click', $event)"
        @reply="$emit('reply', $event)"
        @like-comment="$emit('like-comment', $event)"
        @delete-comment="$emit('delete-comment', $event)"
        @delete-reply="$emit('delete-reply', $event)"
      />
    </div>

    <!-- 评论输入框 -->
    <div class="reply-input">
      <el-input
        v-model="commentContent"
        :placeholder="
          replyMode
            ? '回复 ' + (replyUsername ? replyUsername : '评论')
            : '发表评论...'
        "
        type="textarea"
        :rows="1"
        maxlength="500"
        show-word-limit
        class="comment-textarea"
        @input="adjustTextareaHeight"
        ref="inputRef"
      />
      <el-button
        type="primary"
        :disabled="!commentContent.trim()"
        @click="handleSubmit"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from "vue";
import CommentItem from "./CommentItem.vue";

const props = defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
  userId: {
    type: [Number, String],
    default: null,
  },
  replyMode: {
    type: Boolean,
    default: false,
  },
  replyUsername: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "user-click",
  "reply",
  "like-comment",
  "delete-comment",
  "delete-reply",
  "submit-comment",
  "cancel-reply",
]);

const commentContent = ref("");
const inputRef = ref(null);

const totalComments = computed(() => {
  let total = props.comments.length;

  // 计算所有回复评论
  props.comments.forEach((comment) => {
    if (comment.replies && Array.isArray(comment.replies)) {
      total += comment.replies.length;
    }
  });

  return total;
});

// 调整文本域高度
const adjustTextareaHeight = () => {
  if (inputRef.value) {
    const textarea = inputRef.value.$el.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }
};

// 提交评论
const handleSubmit = () => {
  if (commentContent.value.trim()) {
    emit("submit-comment", commentContent.value);
    commentContent.value = "";
  }
};

// 监听回复模式变化，自动聚焦输入框
watch(
  () => props.replyMode,
  (newValue) => {
    if (newValue) {
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus();
        }
      });
    }
  }
);
</script>

<style scoped>
.comments-section {
  padding: 16px;
  background-color: var(--card-bg);
  margin-bottom: 64px;
}

.comments-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: var(--text-color);
}

.no-comments {
  text-align: center;
  padding: 20px 0;
  color: var(--text-secondary, #909399);
}

.reply-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: var(--card-bg);
  border-top: 1px solid var(--border-color);
  z-index: 10;
}

@media screen and (min-width: 768px) {
  .reply-input {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.comment-textarea {
  flex: 1;
  margin-right: 10px;
}

/* 评论文本域自适应高度 */
:deep(.el-textarea__inner) {
  resize: none;
  overflow: hidden;
  min-height: 40px;
  max-height: 100px;
}
</style>
