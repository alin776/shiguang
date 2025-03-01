<template>
  <div class="post-header">
    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>时光小镇</h2>
    </div>

    <!-- 用户信息 -->
    <div class="user-info" v-if="post">
      <el-avatar
        :size="40"
        :src="getAvatarUrl(post.user?.avatar)"
        @error="() => true"
        class="user-avatar"
        @click="$emit('user-click', post.user?.id)"
      >
        {{ post.user?.username?.charAt(0).toUpperCase() || "?" }}
      </el-avatar>
      <div class="user-meta">
        <div class="username">{{ post.user?.username || "匿名用户" }}</div>
        <div class="post-time">{{ formatTime(post.created_at) }}</div>
      </div>
      <div class="post-actions" v-if="isOwnPost">
        <el-dropdown trigger="click" @command="$emit('post-command', $event)">
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
    <div class="user-info-loading" v-else>
      <div class="loading-placeholder">
        <el-skeleton :rows="2" animated />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, More } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { getAvatarUrl } from "../../../utils/imageHelpers";
import { formatTime } from "../../../utils/timeHelpers";

const router = useRouter();

defineProps({
  post: {
    type: Object,
    default: () => null,
  },
  isOwnPost: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["user-click", "post-command"]);
</script>

<style scoped>
.post-header {
  margin-bottom: 16px;
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: var(--header-bg);
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

@media screen and (min-width: 768px) {
  .page-header {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.back-icon {
  font-size: 24px;
  color: var(--text-color);
  cursor: pointer;
  margin-right: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: var(--card-bg);
  margin-top: 60px;
}

.user-avatar {
  cursor: pointer;
}

.user-meta {
  flex: 1;
  margin-left: 12px;
  text-align: left;
}

.username {
  font-weight: 500;
  margin-bottom: 4px;
  text-align: left;
}

.post-time {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  text-align: left;
}

.more-icon {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary, #909399);
}

.user-info-loading {
  padding: 16px;
  background-color: var(--card-bg);
  margin-top: 60px;
}

.loading-placeholder {
  width: 100%;
}
</style>
