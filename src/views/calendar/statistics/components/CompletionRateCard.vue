<template>
  <div class="completion-rate-card">
    <div class="card-header">
      <div class="title">完成率</div>
      <div class="value">{{ formatCompletionRate(completionRate) }}%</div>
    </div>
    <div class="progress-bar">
      <div class="progress" :style="{ width: `${safePercentage}%` }"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CompletionRateCard",
  props: {
    completionRate: {
      type: [Number, String],
      default: 0
    }
  },
  computed: {
    safePercentage() {
      // 确保百分比是有效数字并且在0-100范围内
      let percentage = parseFloat(this.completionRate);
      if (isNaN(percentage)) {
        console.warn('完成率无效:', this.completionRate);
        return 0;
      }
      return Math.min(Math.max(percentage, 0), 100);
    }
  },
  methods: {
    formatCompletionRate(rate) {
      // 确保返回的是有效的格式化数字
      let parsedRate = parseFloat(rate);
      if (isNaN(parsedRate)) {
        return '0.0';
      }
      // 保留一位小数
      return parsedRate.toFixed(1);
    }
  }
};
</script>

<style scoped>
.completion-rate-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
}

.completion-rate-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.completion-rate-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(45deg, #42b883, #35495e);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.title {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  background: linear-gradient(45deg, #42b883, #35495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.progress-bar {
  height: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(45deg, #42b883, #35495e);
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
}

@media (max-width: 768px) {
  .completion-rate-card {
    padding: 15px;
  }
  
  .title {
    font-size: 14px;
  }
  
  .value {
    font-size: 20px;
  }
  
  .progress-bar {
    height: 6px;
  }
}
</style>
