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
        <div class="username-container">
          <div class="username">{{ post.user?.username || "匿名用户" }}</div>
          <div class="user-badges smaller">
            <span class="level-badge" v-if="post.user?.level">Lv.{{ post.user?.level }}</span>
            <span 
              v-if="post.user?.title" 
              class="user-title-inline"
              :class="getTitleClass(post.user?.title)"
            >{{ post.user?.title }}</span>
          </div>
        </div>
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

// 根据称号名称返回对应的样式类
const getTitleClass = (title) => {
  if (!title) return '';
  
  if (title === '云步官方') {
    return 'title-official';
  } else if (title === '持之以恒') {
    return 'title-persistent';
  } else if (title === '巅峰大神') {
    return 'title-master';
  }
  
  return '';
};
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
  background-color: #ffffff;
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
  color: #333333;
  cursor: pointer;
  margin-right: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333333;
  flex: 1;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 60px;
  width: 100%;
  box-sizing: border-box;
}

.user-avatar {
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-meta {
  flex: 1;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
}

.username-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 2px;
}

.username {
  font-size: 16px;
  font-weight: 500;
  color: #333333;
  line-height: 1.4;
  text-align: left;
  width: 100%;
}

.user-badges {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.user-badges.smaller .level-badge {
  font-size: 10px;
  padding: 1px 8px;
}

.user-badges.smaller .user-title-inline {
  font-size: 0.75rem;
  padding: 1px 6px;
}

.level-badge {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 700;
  font-style: italic;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.user-title-inline {
  font-size: 0.85rem;
  color: #333;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.3px;
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  max-width: 100%;
  overflow: visible;
}

/* 官方称号 - 金色 */
.title-official {
  color: #6d4b2f !important;
  background-color: #f8d66d !important;
  border: 1px solid #e3b748 !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5) !important;
  letter-spacing: 0.5px !important;
}

/* 持之以恒称号 - 绿色 */
.title-persistent {
  color: #2c5e2e !important;
  background-color: #a8e2aa !important;
  border: 1px solid #56c158 !important;
  font-weight: 600 !important;
  letter-spacing: 0.4px !important;
}

/* 巅峰大神称号 - 红色 */
.title-master {
  color: #ffffff !important;
  background-color: #e74c3c !important;
  border: 1px solid #c0392b !important;
  font-weight: 700 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  letter-spacing: 0.6px !important;
}

.post-time {
  font-size: 13px;
  color: #999999;
  text-align: left;
  width: 100%;
}

.more-icon {
  font-size: 20px;
  color: #666666;
  cursor: pointer;
}

.user-info-loading {
  padding: 16px;
  background-color: #ffffff;
  margin-top: 60px;
}

.loading-placeholder {
  width: 100%;
}

@media (prefers-color-scheme: dark) {
  .level-badge {
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
  }
  
  .user-title-inline {
    color: #ccc;
    background-color: #333;
  }
  
  /* 暗黑模式下的官方称号 - 金色 */
  .title-official {
    color: #f8d66d !important;
    background-color: #4a3206 !important;
    border: 1px solid #816d37 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
  }
  
  /* 暗黑模式下的持之以恒称号 - 绿色 */
  .title-persistent {
    color: #a8e2aa !important;
    background-color: #1e3e1f !important;
    border: 1px solid #2c5e2e !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  }
  
  /* 暗黑模式下的巅峰大神称号 - 红色 */
  .title-master {
    color: #ffffff !important;
    background-color: #7d2620 !important;
    border: 1px solid #b74138 !important;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
  }
}
</style>
