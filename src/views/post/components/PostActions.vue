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
      <span>{{ post.comment_count || post.comments_count || 0 }}</span>
    </div>
    <div
      class="action-item follow-action"
      v-if="post.user?.id !== userId && post.user?.id"
      :class="{ following: post.user?.is_following }"
      @click="$emit('follow')"
    >
      <span>{{ post.user?.is_following ? "已关注" : "关注" }}</span>
    </div>
    <div
      class="action-item report-action"
      v-if="post.user?.id !== userId"
      @click="$emit('report')"
    >
      <el-icon><Warning /></el-icon>
      <span>举报</span>
    </div>
  </div>
</template>

<script setup>
import { Star, View, ChatDotRound, Warning } from "@element-plus/icons-vue";

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

defineEmits(["like", "follow", "report"]);
</script>

<style scoped>
.interaction-stats {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  background-color: #ffffff;
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 24px;
  cursor: pointer;
  color: #909399;
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
  background: #4A90E2;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
}

.follow-action.following {
  background: #e0e0e0;
  color: #666666;
}

.report-action {
  margin-left: auto;
  margin-right: 0;
  background: #ff3b30;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
}
</style>
