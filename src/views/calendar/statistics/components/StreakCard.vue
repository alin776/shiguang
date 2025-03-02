<template>
  <el-card class="streak-card">
    <template #header>
      <div class="card-header">
        <h3>连续打卡记录</h3>
      </div>
    </template>
    <div class="streak-list" v-if="sortedStreakData.length">
      <el-row :gutter="20">
        <el-col v-for="item in sortedStreakData" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="streak-item" :class="{ 'milestone-reached': isMilestoneReached(item.streak) }">
            <div class="streak-info" :style="{ borderLeftColor: item.color || '#409EFF' }">
              <div class="streak-name">{{ item.name }}</div>
              <div class="streak-count">
                <span class="count">{{ item.streak }}</span>
                <span class="unit">天</span>
              </div>
            </div>
            <div class="streak-progress">
              <el-progress 
                :percentage="getStreakPercentage(item.streak)" 
                :color="getProgressColor(item)"
                :stroke-width="8"
                :show-text="false"
              />
              <span class="milestone-text" :class="{ 'milestone-success': item.streak >= 30 }">
                {{ getNextMilestone(item.streak) }}
              </span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    <el-empty v-else description="暂无连续打卡记录" class="custom-empty"></el-empty>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  streakData: {
    type: Array,
    default: () => []
  }
});

// 计算属性：按连续天数排序的打卡数据
const sortedStreakData = computed(() => {
  return [...props.streakData].sort((a, b) => b.streak - a.streak);
});

// 获取连续打卡天数的百分比（相对于下一个里程碑）
const getStreakPercentage = (streak) => {
  const nextMilestoneValue = getNextMilestoneValue(streak);
  const prevMilestoneValue = getPrevMilestoneValue(streak);
  const range = nextMilestoneValue - prevMilestoneValue;
  const progress = streak - prevMilestoneValue;
  return Math.min(Math.round((progress / range) * 100), 100);
};

// 获取进度条颜色（渐变效果）
const getProgressColor = (item) => {
  const baseColor = item.color || '#409EFF';
  
  // 根据连续天数设置不同的渐变效果
  if (item.streak >= 365) {
    return new Array(5).fill(baseColor); // 金色渐变
  } else if (item.streak >= 180) {
    return {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 0,
      colorStops: [
        { offset: 0, color: baseColor },
        { offset: 1, color: lightenColor(baseColor, 30) }
      ]
    };
  } else if (item.streak >= 30) {
    return {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 0,
      colorStops: [
        { offset: 0, color: baseColor },
        { offset: 1, color: lightenColor(baseColor, 20) }
      ]
    };
  } else {
    return baseColor;
  }
};

// 辅助函数：提亮颜色
const lightenColor = (color, percent) => {
  // 简单实现，实际项目中可能需要更复杂的颜色处理
  return color;
};

// 检查是否达到了里程碑
const isMilestoneReached = (streak) => {
  return streak >= 7; // 连续打卡7天算是达成小里程碑
};

// 获取下一个里程碑文字
const getNextMilestone = (streak) => {
  const nextMilestone = getNextMilestoneValue(streak);
  if (streak === 0) {
    return '开始第一天吧！';
  } else if (streak >= 365) {
    return `恭喜达成${streak}天！`;
  } else {
    return `距离${nextMilestone}天还剩 ${nextMilestone - streak} 天`;
  }
};

// 获取下一个里程碑数值
const getNextMilestoneValue = (streak) => {
  if (streak >= 365) {
    return Math.ceil(streak / 365) * 365;
  } else if (streak >= 180) {
    return 365;
  } else if (streak >= 90) {
    return 180;
  } else if (streak >= 30) {
    return 90;
  } else if (streak >= 7) {
    return 30;
  } else if (streak >= 3) {
    return 7;
  } else {
    return 3;
  }
};

// 获取上一个里程碑数值
const getPrevMilestoneValue = (streak) => {
  if (streak >= 365) {
    return Math.floor(streak / 365) * 365;
  } else if (streak >= 180) {
    return 180;
  } else if (streak >= 90) {
    return 90;
  } else if (streak >= 30) {
    return 30;
  } else if (streak >= 7) {
    return 7;
  } else if (streak >= 3) {
    return 3;
  } else {
    return 0;
  }
};
</script>

<style scoped>
.streak-card {
  width: 100%;
  margin-bottom: 16px;
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

.streak-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to right, rgba(75, 108, 183, 0.05), rgba(24, 40, 72, 0.1));
  padding: 16px 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  position: relative;
  display: inline-block;
}

.card-header h3::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(135deg, #4b6cb7, #182848);
  border-radius: 3px;
}

.streak-list {
  padding: 16px;
}

.streak-item {
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 20px;
  background-color: var(--bg-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.streak-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(64,158,255,0.5) 50%, rgba(255,255,255,0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.streak-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.streak-item:hover::before {
  opacity: 1;
}

.milestone-reached {
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.2);
}

.milestone-reached::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, transparent 50%, rgba(64, 158, 255, 0.3) 50%);
  border-top-right-radius: 12px;
}

.streak-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-left: 4px solid;
  padding-left: 12px;
  position: relative;
}

.streak-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-color);
}

.streak-count {
  display: flex;
  align-items: baseline;
  background: linear-gradient(135deg, rgba(75, 108, 183, 0.05), rgba(24, 40, 72, 0.1));
  padding: 5px 10px;
  border-radius: 16px;
}

.count {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #4b6cb7, #182848);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.unit {
  font-size: 14px;
  margin-left: 4px;
  color: var(--text-secondary);
}

.streak-progress {
  position: relative;
  padding: 0 3px;
}

.milestone-text {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
  text-align: right;
  font-weight: 500;
  transition: all 0.3s ease;
}

.milestone-success {
  color: #67c23a;
  font-weight: 600;
}

.custom-empty {
  padding: 20px;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .card-header {
    padding: 14px 16px;
  }
  
  .streak-list {
    padding: 12px;
  }
  
  .streak-item {
    padding: 15px;
    margin-bottom: 16px;
  }
  
  .streak-name {
    font-size: 15px;
  }
  
  .count {
    font-size: 24px;
  }
}
</style>
