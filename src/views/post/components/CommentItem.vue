<template>
  <div class="comment-item">
    <div class="comment-avatar">
      <el-avatar
        :size="40"
        :src="getAvatarUrl(comment.user?.avatar)"
        @error="() => true"
        @click="$emit('user-click', comment.user?.id)"
      >
        {{ comment.user?.username?.charAt(0).toUpperCase() || "?" }}
      </el-avatar>
    </div>
    <div class="comment-content">
      <div class="comment-meta">
        <div class="username">
          {{ comment.user?.username || "匿名用户" }}
        </div>
        <div class="comment-time">{{ formatTime(comment.created_at) }}</div>
      </div>
      <div class="comment-text">{{ comment.content }}</div>

      <!-- 回复列表 -->
      <div
        class="replies-container"
        v-if="comment.replies && comment.replies.length > 0"
      >
        <div
          v-for="reply in comment.replies"
          :key="reply.id"
          class="reply-item"
        >
          <div class="reply-meta">
            <span class="username" @click="$emit('user-click', reply.user?.id)">
              {{ reply.user?.username || "匿名用户" }}
            </span>
            <span v-if="reply.reply_to_user" class="reply-to">
              回复
              <span @click="$emit('user-click', reply.reply_to_user?.id)">
                {{ reply.reply_to_user?.username || "匿名用户" }}
              </span>
            </span>
            <span class="reply-time">{{ formatTime(reply.created_at) }}</span>
          </div>
          <div class="reply-text">{{ reply.content }}</div>
          <div class="reply-actions" v-if="reply.user?.id === userId">
            <span
              class="delete-action"
              @click="$emit('delete-reply', reply.id)"
            >
              删除
            </span>
          </div>
        </div>
      </div>

      <!-- 评论操作 -->
      <div class="comment-actions">
        <span class="action-item" @click="$emit('reply', comment.id)">
          回复
        </span>
        <span
          class="action-item"
          :class="{ active: comment.is_liked }"
          @click="
            $emit('like-comment', {
              commentId: comment.id,
              liked: !comment.is_liked,
            })
          "
        >
          <el-icon><Star /></el-icon>
          <span>{{ comment.likes || 0 }}</span>
        </span>
        <span
          v-if="comment.user?.id === userId"
          class="action-item delete-action"
          @click="$emit('delete-comment', comment.id)"
        >
          删除
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Star } from "@element-plus/icons-vue";
import { getAvatarUrl } from "../../../utils/imageHelpers";
import { formatTime } from "../../../utils/timeHelpers";

defineProps({
  comment: {
    type: Object,
    required: true,
  },
  userId: {
    type: [Number, String],
    default: null,
  },
});

defineEmits([
  "user-click",
  "reply",
  "like-comment",
  "delete-comment",
  "delete-reply",
]);
</script>

<style scoped>
.comment-item {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  background-color: var(--card-bg);
}

.comment-avatar {
  margin-right: 12px;
}

.comment-content {
  flex: 1;
  overflow: hidden;
}

.comment-meta {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  justify-content: flex-start;
}

.username {
  font-weight: 500;
  margin-right: 8px;
  cursor: pointer;
  text-align: left;
}

.comment-time {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  text-align: left;
}

.comment-text {
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary, #909399);
}

.action-item.active {
  color: #ffaa00;
}

.action-item span {
  margin-left: 4px;
}

.replies-container {
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.reply-item {
  background-color: #333;
  border-radius: 8px;
  padding: 10px;
  position: relative;
  margin-bottom: 8px;
}

.reply-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  justify-content: flex-start;
}

.reply-to {
  color: var(--text-secondary, #909399);
  margin-right: 8px;
  text-align: left;
}

.reply-time {
  font-size: 11px;
  color: var(--text-secondary, #909399);
  text-align: left;
}

.reply-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.delete-action {
  color: #ff4d4f;
}

.delete-action:hover {
  color: #ff7875;
}
</style>
