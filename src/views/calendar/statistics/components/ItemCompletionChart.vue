<template>
  <el-card class="item-completion-chart">
    <template #header>
      <div class="card-header">
        <h3>项目完成情况</h3>
      </div>
    </template>
    <div class="chart-container">
      <div ref="chartRef" class="chart"></div>
      <el-empty v-if="!itemsData.length" description="暂无项目数据" class="custom-empty"></el-empty>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  itemsData: {
    type: Array,
    default: () => []
  },
  previousData: {
    type: Array,
    default: () => null
  }
});

const chartRef = ref(null);
let chart = null;

// 计算属性：项目名称
const itemNames = computed(() => props.itemsData.map(item => item.name));

// 计算属性：当前完成率数据
const currentCompletionRates = computed(() => props.itemsData.map(item => parseFloat(item.completionRate)));

// 计算属性：上一时间段完成率数据
const previousCompletionRates = computed(() => {
  if (!props.previousData) return [];
  return props.previousData.map(item => parseFloat(item.completionRate));
});

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  
  // 销毁已有图表
  if (chart) {
    chart.dispose();
  }
  
  // 如果没有数据，不创建图表
  if (!props.itemsData.length) {
    return;
  }
  
  // 创建图表实例
  chart = echarts.init(chartRef.value);
  
  // 格式化图表数据
  const seriesData = [];
  
  // 当前时间段数据
  seriesData.push({
    name: '当前时间段',
    type: 'bar',
    data: currentCompletionRates.value,
    barMaxWidth: 40,
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#4b6cb7' },
        { offset: 1, color: '#182848' }
      ])
    },
    emphasis: {
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#5d7dc9' },
          { offset: 1, color: '#2a3e66' }
        ])
      }
    },
    label: {
      show: true,
      position: 'top',
      formatter: '{c}%',
      fontSize: 12,
      color: '#606266'
    }
  });
  
  // 对比数据（如果有）
  if (props.previousData) {
    seriesData.push({
      name: '上一时间段',
      type: 'bar',
      data: previousCompletionRates.value,
      barMaxWidth: 40,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#67C23A' },
          { offset: 1, color: '#3E8F12' }
        ])
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#79d34f' },
            { offset: 1, color: '#4ea622' }
          ])
        }
      }
    });
  }
  
  // 设置图表选项
  const option = {
    grid: {
      top: 60,
      right: 20,
      bottom: 60, // 增加底部空间
      left: 40,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: function(params) {
        let result = `<div style="font-weight:bold;margin-bottom:5px;">${params[0].name}</div>`;
        params.forEach(param => {
          result += `<div style="margin:3px 0;">
            <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${param.color.colorStops ? param.color.colorStops[0].color : param.color};"></span>
            ${param.seriesName}：${param.value}%
          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: seriesData.map(item => item.name),
      top: 10,
      textStyle: {
        color: '#606266'
      },
      itemWidth: 15,
      itemHeight: 10,
      icon: 'roundRect'
    },
    xAxis: {
      type: 'category',
      data: itemNames.value,
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      axisTick: {
        alignWithLabel: true,
        lineStyle: {
          color: '#ddd'
        }
      },
      axisLabel: {
        interval: 0,
        rotate: props.itemsData.length > 5 ? 30 : 0,
        color: '#606266',
        fontSize: 12,
        margin: 14, // 增加与轴线的距离
      }
    },
    yAxis: {
      type: 'value',
      name: '完成率(%)',
      max: 100,
      nameTextStyle: {
        color: '#606266',
        padding: [0, 0, 0, 30]
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#606266'
      },
      splitLine: {
        lineStyle: {
          color: '#eee',
          type: 'dashed'
        }
      }
    },
    series: seriesData,
    animation: true,
    animationDuration: 1000,
    animationEasing: 'elasticOut'
  };
  
  // 应用选项
  chart.setOption(option);
};

// 响应窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

// 监听数据变化
watch(() => props.itemsData, () => {
  initChart();
}, { deep: true });

watch(() => props.previousData, () => {
  initChart();
}, { deep: true });

// 组件挂载时初始化图表
onMounted(() => {
  // 延迟初始化图表，确保DOM已完全渲染并有正确的尺寸
  setTimeout(() => {
    initChart();
  }, 300);
  window.addEventListener('resize', handleResize);
});

// 组件卸载前清理资源
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<style scoped>
.item-completion-chart {
  flex: 1;
  min-width: 300px;
  height: 380px;
  background-color: var(--card-bg);
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.item-completion-chart:hover {
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

.chart-container {
  position: relative;
  padding: 10px 15px;
  height: calc(100% - 76px);
  margin-bottom: 20px; /* 增加底部间距 */
}

.chart {
  width: 100%;
  height: 300px; /* 调整高度 */
  animation: fadeIn 0.8s ease-in-out;
}

.custom-empty {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media screen and (max-width: 768px) {
  .card-header {
    padding: 14px 16px;
  }
  
  .chart-container {
    padding: 5px 10px;
    margin-bottom: 30px; /* 移动端增加更多底部空间 */
  }
  
  .item-completion-chart {
    height: 380px; /* 增加整体高度 */
  }
  
  .chart {
    height: 260px; /* 移动端减小图表高度 */
  }
}
</style>
