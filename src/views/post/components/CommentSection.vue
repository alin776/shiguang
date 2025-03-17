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
      
      <!-- 语音录制按钮 -->
      <el-button 
        type="text" 
        :icon="recordingAudio ? 'Close' : 'Microphone'" 
        @click="toggleAudioRecording"
        class="audio-button"
        :class="{ 'recording': recordingAudio }"
      >
        {{ recordingAudio ? '取消' : '语音' }}
      </el-button>
      
      <el-button
        type="primary"
        :disabled="(!commentContent.trim() && !commentAudio) || recordingAudio"
        @click="handleSubmit"
      >
        发送
      </el-button>
    </div>
    
    <!-- 音频录制组件 (只在录音模式显示) -->
    <div v-if="recordingAudio" class="audio-recorder-container">
      <AudioRecorder v-model:value="commentAudio" @audio-deleted="commentAudio = null" @audio-recorded="onAudioRecorded" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from "vue";
import CommentItem from "./CommentItem.vue";
import AudioRecorder from "../../../components/AudioRecorder.vue";

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
const commentAudio = ref(null);
const recordingAudio = ref(false);
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

// 切换录音模式
const toggleAudioRecording = () => {
  recordingAudio.value = !recordingAudio.value;
  if (!recordingAudio.value) {
    // 不要在此处清除音频，避免切换录音模式时丢失已录制的音频
    // commentAudio.value = null;
  }
};

// 音频录制完成的回调
const onAudioRecorded = (audioUrl) => {
  console.log("音频录制完成:", audioUrl);
  commentAudio.value = audioUrl;
  // 录音完成后自动关闭录音界面但保留录制的音频
  recordingAudio.value = false;
};

// 提交评论
const handleSubmit = () => {
  // 检查是否有文字评论或音频评论
  if (commentContent.value.trim() || commentAudio.value) {
    console.log("提交评论:", { text: commentContent.value, audio: commentAudio.value });
    emit("submit-comment", {
      content: commentContent.value,
      audio: commentAudio.value
    });
    commentContent.value = "";
    commentAudio.value = null;
    recordingAudio.value = false;
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
  background-color: #ffffff;
  margin-bottom: 64px;
}

.comments-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #333333;
  text-align: left;
}

.no-comments {
  text-align: left;
  padding: 20px 0;
  color: #909399;
}

.reply-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  z-index: 10;
}

.audio-recorder-container {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  background-color: #ffffff;
  padding: 10px;
  border-top: 1px solid #f0f0f0;
  z-index: 9;
}

.audio-button {
  margin: 0 5px;
}

.audio-button.recording {
  color: #f56c6c;
}

@media screen and (min-width: 768px) {
  .reply-input, .audio-recorder-container {
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
  color: #333333;
  background-color: #fff;
}

/* 添加字数统计样式 */
:deep(.el-input__count) {
  background-color: transparent;
  color: #666666;
  font-size: 12px;
  right: 10px;
  bottom: 5px;
}
</style>
