<template>
  <el-card class="completion-rate-card">
    <div class="card-content">
      <div class="rate-info">
        <h3>整体完成率</h3>
        <div class="rate-display">
          <div class="rate-value">{{ isNaN(completionRate) ? '0.0' : completionRate }}%</div>
          <div v-if="previousRate !== null" class="rate-comparison">
            <el-tag :type="rateChangeType" :effect="rateChangeEffect" class="custom-tag">
              <el-icon v-if="!isNaN(completionRate) && !isNaN(previousRate) && completionRate > previousRate" class="comparison-icon"><CaretTop /></el-icon>
              <el-icon v-else-if="!isNaN(completionRate) && !isNaN(previousRate) && completionRate < previousRate" class="comparison-icon"><CaretBottom /></el-icon>
              <el-icon v-else class="comparison-icon"><Connection /></el-icon>
              <span>{{ !isNaN(completionRate) && !isNaN(previousRate) ? Math.abs(completionRate - previousRate).toFixed(1) : '0.0' }}%</span>
              <span>{{ !isNaN(completionRate) && !isNaN(previousRate) && completionRate > previousRate ? '提升' : !isNaN(completionRate) && !isNaN(previousRate) && completionRate < previousRate ? '下降' : '持平' }}</span>
            </el-tag>
          </div>
        </div>
        <div class="period-text">
          {{ periodText }}完成率
        </div>
      </div>
      <div class="rate-progress">
        <div class="progress-wrapper">
          <div class="custom-progress-dashboard" :data-percentage="getSafePercentage">
            <div class="progress-text">{{ isNaN(completionRate) ? '0.0' : completionRate }}%</div>
            <svg viewBox="0 0 100 100">
              <path 
                d="M 50,50 m 0,-45 a 45,45 0 1 1 0,90 a 45,45 0 1 1 0,-90" 
                stroke="#e5e5e5" 
                stroke-width="5" 
                fill-opacity="0"
              ></path>
              <path 
                d="M 50,50 m 0,-45 a 45,45 0 1 1 0,90 a 45,45 0 1 1 0,-90" 
                :stroke="getProgressColor" 
                stroke-width="5" 
                fill-opacity="0" 
                style="stroke-linecap: round;" 
                :style="{ 
                  'stroke-dasharray': getDashArray, 
                  'stroke-dashoffset': getDashOffset 
                }"
              ></path>
            </svg>
          </div>
          <div class="progress-label">完成情况</div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';
import { CaretTop, CaretBottom, Connection } from '@element-plus/icons-vue';

const props = defineProps({
  completionRate: {
    type: [Number, String],
    default: 0
  },
  period: {
    type: String,
    default: 'week'
  },
  previousRate: {
    type: [Number, String],
    default: null
  }
});

// 计算属性：时间段文本
const periodText = computed(() => {
  switch (props.period) {
    case 'week': return '本周';
    case 'month': return '本月';
    case 'year': return '本年';
    default: return '';
  }
});

// 计算属性：变化类型（用于标签颜色）
const rateChangeType = computed(() => {
  if (parseFloat(props.completionRate) > parseFloat(props.previousRate)) {
    return 'success';
  } else if (parseFloat(props.completionRate) < parseFloat(props.previousRate)) {
    return 'danger';
  } else {
    return 'info';
  }
});

// 计算属性：变化效果（用于标签样式）
const rateChangeEffect = computed(() => {
  return 'light';
});

// 确保百分比是有效数字
const getSafePercentage = computed(() => {
  console.log(`CompletionRateCard: 接收到的完成率值 = "${props.completionRate}"`);
  
  let percentage;
  if (typeof props.completionRate === 'string') {
    percentage = parseFloat(props.completionRate);
  } else if (typeof props.completionRate === 'number') {
    percentage = props.completionRate;
  } else {
    console.warn('CompletionRateCard: 收到非数字和非字符串的完成率值');
    percentage = 0;
  }
  
  if (isNaN(percentage)) {
    console.warn('CompletionRateCard: 完成率值解析为NaN');
    percentage = 0;
  }
  
  const result = Math.min(100, Math.max(0, percentage));
  console.log(`CompletionRateCard: 处理后的完成率 = ${result}`);
  return result;
});

// 获取进度条颜色
const getProgressColor = computed(() => {
  const percentage = getSafePercentage.value;
  
  if (percentage < 30) {
    return '#f56c6c';
  } else if (percentage < 70) {
    return '#e6a23c';
  } else {
    return '#67c23a';
  }
});

// 获取进度条的dasharray
const getDashArray = computed(() => {
  return '283';  // 圆周长，2 * PI * 45 ≈ 283
});

// 获取进度条的dashoffset
const getDashOffset = computed(() => {
  const percentage = getSafePercentage.value;
  // 根据百分比计算偏移量，确保即使是很小的值也能看到
  const minVisiblePercentage = 3; // 最小可见百分比
  const visiblePercentage = percentage < minVisiblePercentage && percentage > 0 
                            ? minVisiblePercentage 
                            : percentage;
  return (100 - visiblePercentage) / 100 * 283;
});
</script>

<style scoped>
.completion-rate-card {
  width: 100%;
  margin-bottom: 16px;
  background-color: var(--card-bg);
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.completion-rate-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-content {
  display: flex;
  padding: 20px;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, 
    rgba(75, 108, 183, 0.08) 0%, 
    rgba(24, 40, 72, 0.15) 100%
  );
}

.rate-info {
  flex: 1;
  padding-right: 20px;
}

.rate-info h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: var(--text-color);
  font-weight: 600;
  position: relative;
  display: inline-block;
}

.rate-info h3::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 45px;
  height: 3px;
  background: linear-gradient(135deg, #4b6cb7, #182848);
  border-radius: 3px;
  animation: slideIn 0.8s ease-out;
}

@keyframes slideIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 45px;
    opacity: 1;
  }
}

.rate-display {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.rate-value {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #4b6cb7, #2de5e2);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-right: 18px;
  line-height: 1;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rate-comparison {
  display: flex;
  align-items: center;
}

.custom-tag {
  padding: 6px 12px;
  border-radius: 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.8s ease-out;
}

.comparison-icon {
  font-size: 16px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.custom-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.period-text {
  color: var(--text-secondary);
  font-size: 15px;
  margin-top: 8px;
  opacity: 0.85;
}

.rate-progress {
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 1s ease-out;
}

.progress-label {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 14px;
  opacity: 0.85;
}

.custom-progress-dashboard {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 140px;
  height: 140px;
}

.custom-progress-dashboard svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  color: #e6e6e6;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .card-content {
    flex-direction: column;
    padding: 24px;
  }
  
  .rate-info {
    width: 100%;
    margin-bottom: 24px;
    padding-right: 0;
    text-align: center;
  }
  
  .rate-info h3 {
    margin-bottom: 24px;
  }
  
  .rate-info h3::after {
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
  }
  
  .rate-display {
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .rate-value {
    font-size: 42px;
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .period-text {
    text-align: center;
  }
}
</style>
