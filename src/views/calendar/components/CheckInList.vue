<template>
  <div class="mobile-card gradient-border check-in-area">
    <h3 class="section-title">
      <span class="section-icon"
        ><el-icon><Calendar /></el-icon
      ></span>
      每日打卡
      <el-button
        class="statistics-btn"
        type="primary"
        size="small"
        @click="$emit('go-to-statistics')"
      >
        <el-icon><DataAnalysis /></el-icon>
        现状总结
      </el-button>
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
        @click="$emit('toggle-check-in', item)"
        @touchstart="startPressTimer(item)"
        @touchend="clearPressTimer"
        @touchmove="clearPressTimer"
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { Calendar } from "@element-plus/icons-vue";
import { DataAnalysis } from "@element-plus/icons-vue";
import { ref } from "vue";

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

const emit = defineEmits(["toggle-check-in", "go-to-settings", "force-check-in", "go-to-statistics"]);

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

// 长按计时器
const pressTimer = ref(null);

// 开始长按计时器
const startPressTimer = (item) => {
  // 清除任何现有计时器
  clearPressTimer();
  
  // 设置新计时器 - 800ms 后执行强制打卡
  pressTimer.value = setTimeout(() => {
    // 触发强制打卡事件
    emit("force-check-in", item);
    
    // 添加震动反馈（如果设备支持）
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  }, 800);
};

// 清除长按计时器
const clearPressTimer = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
};
</script>

<style scoped>
.check-in-area {
  flex: 1;
  padding: 10px 0;
  margin-bottom: 0;
  position: relative;
  border-radius: 0;
  max-height: none;
  height: auto;
  overflow: visible;
  background: transparent;
  box-shadow: none;
  border: none;
}

.section-title {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5px;
}

.section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #333, #555);
  border-radius: 50%;
  margin-right: 6px;
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.statistics-btn {
  margin-left: 5px;
  background: rgba(51, 51, 51, 0.08);
  border: 1px solid rgba(51, 51, 51, 0.15);
  color: #333;
  border-radius: 14px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.check-in-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
  max-height: none;
}

.check-in-item {
  display: flex;
  align-items: center;
  padding: 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 60px;
  background: #FFFFFF;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
  margin-bottom: 0;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.item-pending {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(74, 144, 226, 0.15);
  transition: all 0.3s ease;
}

.item-pending:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

.item-pending:active {
  transform: scale(0.98);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

.check-in-info {
  flex: 1;
  z-index: 2;
  position: relative;
  text-shadow: none;
}

.check-in-name {
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  color: #333 !important;
  font-size: 16px;
}

.check-in-streak {
  font-size: 14px;
  color: #666;
  text-shadow: none;
  display: flex;
  align-items: center;
}

.check-in-streak::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #555;
  margin-right: 6px;
  opacity: 0.7;
}

.status-indicator {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 10px;
  background-color: #f8f8f8;
  border: 2px solid var(--completion-color, rgba(74, 144, 226, 0.3));
  transition: all 0.3s ease;
  display: inline-block;
  position: relative;
}

.status-indicator.active {
  background-color: var(--completion-color, #4A90E2);
  border-color: var(--completion-color, #4A90E2);
  box-shadow: 0 0 8px var(--completion-color, rgba(74, 144, 226, 0.5));
}

.status-indicator.active::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 6px;
  height: 6px;
  background-color: white;
  border-radius: 50%;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(0.98);
  }
}

.item-completed {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(247, 247, 247, 0.95)
  );
  border: 1px solid rgba(51, 51, 51, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.item-completed::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(to bottom, #333, #555);
  border-radius: 3px;
}

.item-completed::after {
  content: "已完成";
  position: absolute;
  top: 14px;
  right: 16px;
  padding: 3px 8px;
  background-color: rgba(51, 51, 51, 0.08);
  border-radius: 12px;
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.item-completed .check-in-name {
  color: #333 !important;
}

.item-completed:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(74, 144, 226, 0.15);
}

.empty-checkins {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: #888;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.empty-checkins p {
  margin-bottom: 16px;
  font-size: 15px;
}

.empty-checkins .el-button {
  background: rgba(51, 51, 51, 0.08);
  border-color: rgba(51, 51, 51, 0.15);
  color: #333;
  border-radius: 20px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.empty-checkins .el-button:hover {
  background: rgba(51, 51, 51, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 480px) {
  .check-in-area {
    padding: 5px 0;
  }
  
  .check-in-item {
    padding: 12px;
    min-height: 55px;
  }
  
  .check-in-name {
    font-size: 15px;
  }
  
  .check-in-streak {
    font-size: 13px;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .section-icon {
    width: 22px;
    height: 22px;
  }
  
  .statistics-btn {
    font-size: 11px;
    padding: 3px 6px;
  }
  
  .item-completed::after {
    top: 10px;
    right: 12px;
    padding: 2px 6px;
    font-size: 10px;
  }
}

@media (max-width: 360px) {
  .section-title {
    font-size: 13px;
  }
  
  .statistics-btn {
    font-size: 10px;
    padding: 2px 5px;
  }
}
</style>
