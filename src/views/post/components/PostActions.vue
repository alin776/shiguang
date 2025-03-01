<template>
  <div class="interaction-stats">
    <div
      class="action-item"
      :class="{ active: post.is_liked }"
      @click="$emit('like')"
    >
      <el-icon><Star /></el-icon>
      <span>{{ post.likes || 0 }}</span>
    </div>
    <div class="action-item">
      <el-icon><View /></el-icon>
      <span>{{ post.views || 0 }}</span>
    </div>
    <div class="action-item">
      <el-icon><ChatDotRound /></el-icon>
      <span>{{ post.comments_count || 0 }}</span>
    </div>
    <div
      class="action-item follow-action"
      v-if="post.user?.id !== userId && post.user?.id"
      :class="{ following: post.user?.is_following }"
      @click="$emit('follow')"
    >
      <span>{{ post.user?.is_following ? "已关注" : "关注" }}</span>
    </div>
  </div>
</template>

<script setup>
import { Star, View, ChatDotRound } from "@element-plus/icons-vue";

defineProps({
  post: {
    type: Object,
    required: true,
  },
  userId: {
    type: [Number, String],
    default: null,
  },
});

defineEmits(["like", "follow"]);
</script>

<style scoped>
.interaction-stats {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-bg);
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 24px;
  cursor: pointer;
  color: var(--text-secondary, #909399);
}

.action-item span {
  margin-left: 4px;
  font-size: 14px;
}

.action-item.active {
  color: #ffaa00;
}

.follow-action {
  margin-left: auto;
  margin-right: 0;
  background: var(--primary-color);
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
}

.follow-action.following {
  background: var(--border-color);
  color: var(--text-secondary);
}
</style>
