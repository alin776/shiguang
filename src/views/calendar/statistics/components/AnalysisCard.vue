<template>
  <el-card class="analysis-card">
    <template #header>
      <div class="card-header">
        <h3>个性化建议</h3>
      </div>
    </template>
    
    <div class="analysis-content">
      <div class="analysis-summary" :class="getSummaryClass">
        <div class="summary-icon-container">
          <component :is="summaryIcon" class="summary-icon" />
        </div>
        <div class="summary-text">
          <h4>{{ summaryTitle }}</h4>
          <p>{{ summaryDescription }}</p>
        </div>
      </div>
      
      <el-divider />
      
      <div class="analysis-details">
        <h4>详细分析</h4>
        <div class="analysis-item" v-for="(item, index) in analysisPoints" :key="index">
          <el-icon><Connection /></el-icon>
          <span>{{ item }}</span>
        </div>
      </div>
      
      <el-divider />
      
      <div class="suggestions">
        <h4>改进建议</h4>
        <div class="suggestion-item" v-for="(item, index) in suggestions" :key="index">
          <el-icon><Bell /></el-icon>
          <span>{{ item }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { InfoFilled, Connection, Star, TrendCharts, Trophy, WarningFilled, Check, Menu, Bell, Opportunity } from '@element-plus/icons-vue';

const props = defineProps({
  completionRate: {
    type: [Number, String],
    default: 0
  },
  itemsData: {
    type: Array,
    default: () => []
  },
  streakData: {
    type: Array,
    default: () => []
  },
  period: {
    type: String,
    default: 'week'
  }
});

// 计算属性：时间段文本
const periodText = computed(() => {
  switch (props.period) {
    case 'week': return '周';
    case 'month': return '月';
    case 'year': return '年';
    default: return '周';
  }
});

// 计算属性：总结图标
const summaryIcon = computed(() => {
  const rate = parseFloat(props.completionRate);
  if (rate >= 90) return Trophy;
  if (rate >= 70) return Star;
  if (rate >= 50) return TrendCharts;
  return Opportunity;
});

// 计算属性：总结样式类名
const getSummaryClass = computed(() => {
  const rate = parseFloat(props.completionRate);
  if (rate >= 90) return 'summary-excellent';
  if (rate >= 70) return 'summary-good';
  if (rate >= 50) return 'summary-average';
  return 'summary-needs-improvement';
});

// 计算属性：总结标题
const summaryTitle = computed(() => {
  const rate = parseFloat(props.completionRate);
  if (rate >= 90) return '出色的完成度！';
  if (rate >= 70) return '良好的完成情况';
  if (rate >= 50) return '基本达标';
  return '需要加强';
});

// 计算属性：总结描述
const summaryDescription = computed(() => {
  const rate = parseFloat(props.completionRate);
  if (rate >= 90) {
    return `您在本${periodText.value}的打卡完成率超过90%，表现非常出色！坚持这种习惯，会带来更多积极的改变。`;
  }
  if (rate >= 70) {
    return `您在本${periodText.value}的打卡完成率达到了${rate}%，良好的习惯正在形成，再接再厉！`;
  }
  if (rate >= 50) {
    return `您在本${periodText.value}的打卡完成率为${rate}%，完成了基本的打卡目标，还有提升空间。`;
  }
  return `您在本${periodText.value}的打卡完成率为${rate}%，尝试调整计划或增加提醒，帮助提高完成率。`;
});

// 计算属性：分析要点
const analysisPoints = computed(() => {
  const points = [];
  const rate = parseFloat(props.completionRate);
  
  // 根据完成率提供分析
  if (rate >= 90) {
    points.push(`您的打卡完成率达到${rate}%，处于非常高的水平。`);
  } else if (rate >= 70) {
    points.push(`您的打卡完成率为${rate}%，高于平均水平。`);
  } else if (rate >= 50) {
    points.push(`您的打卡完成率为${rate}%，处于中等水平。`);
  } else {
    points.push(`您的打卡完成率为${rate}%，低于理想状态。`);
  }
  
  // 分析打卡项目数量
  if (props.itemsData.length > 5) {
    points.push(`您当前设置了${props.itemsData.length}个打卡项目，数量较多，可能会分散精力。`);
  } else if (props.itemsData.length > 0) {
    points.push(`您当前设置了${props.itemsData.length}个打卡项目，数量适中。`);
  }
  
  // 找出完成率最高和最低的项目
  if (props.itemsData.length > 0) {
    const sortedItems = [...props.itemsData].sort((a, b) => b.completionRate - a.completionRate);
    const highest = sortedItems[0];
    const lowest = sortedItems[sortedItems.length - 1];
    
    if (highest) {
      points.push(`"${highest.name}"是您完成率最高的项目，达到了${highest.completionRate}%。`);
    }
    
    if (lowest && props.itemsData.length > 1) {
      points.push(`"${lowest.name}"是您完成率最低的项目，为${lowest.completionRate}%。`);
    }
  }
  
  // 分析连续打卡情况
  if (props.streakData.length > 0) {
    const maxStreak = Math.max(...props.streakData.map(item => item.streak));
    const itemWithMaxStreak = props.streakData.find(item => item.streak === maxStreak);
    
    // 只有当连续打卡天数大于等于3天，并且项目名称不是undefined时才显示
    if (itemWithMaxStreak && maxStreak >= 3 && itemWithMaxStreak.name !== 'undefined') {
      points.push(`您在"${itemWithMaxStreak.name}"项目上已经连续打卡${maxStreak}天，非常不错！`);
    }
  }
  
  return points;
});

// 计算属性：改进建议
const suggestions = computed(() => {
  const tips = [];
  const rate = parseFloat(props.completionRate);
  
  // 根据完成率提供建议
  if (rate >= 90) {
    tips.push('继续保持当前的良好习惯，可以考虑增加新的挑战。');
    tips.push('尝试将成功经验分享给朋友，互相鼓励形成良性循环。');
  } else if (rate >= 70) {
    tips.push('关注那些完成率较低的项目，找出影响完成的原因。');
    tips.push('在特定时间段设置提醒，增加完成打卡的几率。');
  } else if (rate >= 50) {
    tips.push('适当减少打卡项目数量，优先关注对您最重要的几项。');
    tips.push('尝试将打卡任务与您的日常活动结合，形成稳定的习惯链。');
    tips.push('设置小型的阶段性奖励，增加完成动力。');
  } else {
    tips.push('重新审视您的打卡计划，确保它们是现实可行的。');
    tips.push('尝试"不中断链条"的方法，持续打卡形成心理压力。');
    tips.push('从最简单的项目开始，逐步建立信心和习惯。');
    tips.push('每天固定时间查看打卡提醒，增加执行机率。');
  }
  
  // 项目相关建议
  if (props.itemsData.length > 5) {
    tips.push('考虑减少打卡项目的数量，聚焦于最重要的几个习惯。');
  } else if (props.itemsData.length === 0) {
    tips.push('开始添加您想要培养的习惯作为打卡项目。');
  }
  
  // 根据数据分析提供个性化建议
  if (props.itemsData.length > 0) {
    const lowItems = props.itemsData.filter(item => item.completionRate < 50);
    if (lowItems.length > 0) {
      const itemNames = lowItems.map(item => `"${item.name}"`).join('、');
      tips.push(`重点关注完成率低于50%的项目：${itemNames}，尝试找出未完成的原因。`);
    }
  }
  
  // 随机添加一些通用建议
  const generalTips = [
    '使用日历或提醒应用，设置每日提醒。',
    '将打卡习惯与现有习惯链接，如晨起后立即完成某项打卡。',
    '与朋友一起打卡，相互监督和鼓励。',
    '记录打卡带来的积极变化，增强继续的动力。',
    '调整打卡项目的难度，确保它们既有挑战性又能实现。'
  ];
  
  // 添加1-2个通用建议
  const randomTips = generalTips.sort(() => 0.5 - Math.random()).slice(0, 2);
  tips.push(...randomTips);
  
  return tips;
});
</script>

<style scoped>
.analysis-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: none;
  background-color: rgba(var(--card-bg-rgb), 0.8);
  margin-bottom: 10px;
}

.analysis-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
  background: linear-gradient(90deg, rgba(75, 108, 183, 0.1), rgba(24, 40, 72, 0.2));
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #4b6cb7, #42b5ca);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 1px;
}

.analysis-content {
  padding: 24px;
}

.analysis-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.summary-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  font-size: 30px;
  color: white;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
  transform: rotate(0deg);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.summary-text {
  flex: 1;
}

.summary-text h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.summary-text p {
  margin: 0;
  line-height: 1.6;
  font-size: 14px;
  opacity: 0.9;
}

/* 不同状态的样式 */
.summary-excellent {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05));
  border-left: 4px solid #4CAF50;
}

.summary-excellent .summary-icon-container {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
}

.summary-excellent h4 {
  color: #2E7D32;
}

.summary-good {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(33, 150, 243, 0.05));
  border-left: 4px solid #2196F3;
}

.summary-good .summary-icon-container {
  background: linear-gradient(135deg, #2196F3, #1976D2);
}

.summary-good h4 {
  color: #1976D2;
}

.summary-average {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(255, 152, 0, 0.05));
  border-left: 4px solid #FF9800;
}

.summary-average .summary-icon-container {
  background: linear-gradient(135deg, #FF9800, #F57C00);
}

.summary-average h4 {
  color: #F57C00;
}

.summary-needs-improvement {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.15), rgba(103, 58, 183, 0.05));
  border-left: 4px solid #673AB7;
}

.summary-needs-improvement .summary-icon-container {
  background: linear-gradient(135deg, #673AB7, #512DA8);
}

.summary-needs-improvement h4 {
  color: #512DA8;
}

.analysis-details, .suggestions {
  margin-top: 20px;
}

.analysis-details h4, .suggestions h4 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  background: linear-gradient(90deg, rgba(75, 108, 183, 0.5), rgba(75, 108, 183, 0.1));
  padding: 8px 12px;
  border-radius: 8px;
}

.analysis-item, .suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.analysis-item:hover, .suggestion-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.analysis-item .el-icon, .suggestion-item .el-icon {
  margin-top: 2px;
  font-size: 16px;
  color: #4b6cb7;
}

.suggestion-item .el-icon {
  color: #673AB7;
}

.el-divider {
  margin: 24px 0;
  opacity: 0.6;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .analysis-summary {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }
  
  .summary-icon-container {
    margin: 0 auto 15px;
  }
  
  .card-header h3 {
    font-size: 18px;
  }
  
  .analysis-content {
    padding: 16px;
  }
  
  .summary-text h4 {
    font-size: 16px;
  }
}
</style>
