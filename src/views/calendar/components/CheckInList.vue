<template>
  <div class="mobile-card gradient-border check-in-area">
    <h3 class="section-title">
      <span class="section-icon"
        ><el-icon><Calendar /></el-icon
      ></span>
      每日打卡
    </h3>
    <div class="check-in-list">
      <div
        v-for="item in checkInItems"
        :key="item.id"
        class="check-in-item"
        :data-item-id="item.id"
        :class="{
          'item-completed': item.completed,
          'item-pending': !item.completed,
          'animate-pulse': recentlyCompleted[item.id],
        }"
        :style="{
          '--completion-color': item.color || checkInColors.default,
          '--completion-color-rgb': hexToRgb(
            item.color || checkInColors.default
          ),
        }"
        @click="$emit('toggle-checkin', item)"
      >
        <div class="check-in-info">
          <div class="check-in-name">
            <span
              class="status-indicator"
              :class="{ active: item.completed }"
            ></span>
            {{ item.name }}
          </div>
          <div class="check-in-streak">连续 {{ item.streak || 0 }} 天</div>
        </div>
      </div>
      <div v-if="checkInItems.length === 0" class="empty-checkins">
        <p>还没有打卡项目，请前往设置添加</p>
        <el-button @click="$emit('go-to-settings')" size="small">
          去设置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Calendar } from "@element-plus/icons-vue";

defineProps({
  checkInItems: {
    type: Array,
    required: true,
  },
  recentlyCompleted: {
    type: Object,
    default: () => ({}),
  },
  checkInColors: {
    type: Object,
    default: () => ({
      default: "#9C27B0",
    }),
  },
});

defineEmits(["toggle-checkin", "go-to-settings"]);

// 十六进制转RGB辅助函数
const hexToRgb = (hex) => {
  // 移除#号
  hex = hex.replace("#", "");

  // 将短格式转换为标准格式
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // 解析RGB值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `${r}, ${g}, ${b}`;
};
</script>

<style scoped>
.check-in-area {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.check-in-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  color: white;
  font-weight: 500;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--secondary-color)
  );
  border-radius: 50%;
  margin-right: 8px;
  color: white;
  box-shadow: 0 0 5px rgba(147, 51, 234, 0.7);
}

.check-in-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: var(--small-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  min-height: 48px;
  background: rgba(30, 30, 40, 0.85);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
}

.item-pending {
  background: rgba(30, 30, 40, 0.85);
  border: 1px solid rgba(147, 51, 234, 0.3);
  transition: all 0.3s ease;
}

.item-pending:active {
  transform: scale(0.98);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.check-in-info {
  flex: 1;
  z-index: 2;
  position: relative;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.check-in-name {
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  color: white !important;
}

.check-in-streak {
  font-size: 0.8rem;
  opacity: 0.8;
  color: var(--text-secondary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.status-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: transparent;
  border: 2px solid var(--completion-color, rgba(255, 255, 255, 0.2));
  transition: all 0.3s ease;
  display: inline-block;
}

.status-indicator.active {
  background-color: var(--completion-color, var(--accent-color));
  border-color: var(--completion-color, var(--accent-color));
  box-shadow: 0 0 8px var(--completion-color, var(--accent-color));
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.item-completed {
  background: linear-gradient(
    90deg,
    rgba(56, 189, 248, 0.3),
    rgba(147, 51, 234, 0.35)
  );
  border: none;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
  position: relative;
  overflow: hidden;
  z-index: 0;
}

.item-completed::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: var(--gradient-2);
  border-radius: calc(var(--small-radius) + 1px);
  z-index: -1;
  opacity: 0.5;
  animation: task-complete-glow 3s infinite ease-in-out;
}

@keyframes task-complete-glow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.item-completed::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
      circle at 20% 50%,
      rgba(56, 189, 248, 0.8) 0%,
      transparent 5%
    ),
    radial-gradient(
      circle at 80% 30%,
      rgba(147, 51, 234, 0.8) 0%,
      transparent 4%
    ),
    radial-gradient(
      circle at 40% 70%,
      rgba(56, 189, 248, 0.8) 0%,
      transparent 6%
    ),
    radial-gradient(
      circle at 60% 20%,
      rgba(236, 72, 153, 0.8) 0%,
      transparent 4%
    ),
    radial-gradient(
      circle at 10% 10%,
      rgba(56, 189, 248, 0.8) 0%,
      transparent 3%
    ),
    radial-gradient(
      circle at 90% 90%,
      rgba(147, 51, 234, 0.8) 0%,
      transparent 5%
    );
  z-index: 1;
  opacity: 0.2;
  animation: tech-particles 10s infinite linear;
}

@keyframes tech-particles {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  100% {
    transform: translateY(-10px) rotate(360deg);
  }
}

.empty-checkins {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
}
</style>
