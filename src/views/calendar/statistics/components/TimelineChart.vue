<template>
  <el-card class="timeline-chart-card">
    <template #header>
      <div class="card-header">
        <h3>打卡趋势分析</h3>
        <el-radio-group v-model="displayMode" size="small">
          <el-radio-button label="count">完成次数</el-radio-button>
          <el-radio-button label="rate">完成率</el-radio-button>
        </el-radio-group>
      </div>
    </template>
    <div class="chart-container">
      <div ref="chartRef" class="chart"></div>
      <el-empty v-if="!props.dailyData.length" description="暂无趋势数据" class="custom-empty"></el-empty>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';

const props = defineProps({
  dailyData: {
    type: Array,
    default: () => []
  },
  period: {
    type: String,
    default: 'week'
  },
  previousData: {
    type: Array,
    default: () => null
  }
});

const chartRef = ref(null);
let chart = null;

const displayMode = ref('rate'); // 'rate' 或 'count'

// 格式化日期显示
const formatDate = (dateStr) => {
  const date = dayjs(dateStr);
  if (props.period === 'year') {
    return date.format('MM-DD');
  } else {
    return date.format('MM-DD ddd');
  }
};

// 计算属性：日期标签
const dateLabels = computed(() => props.dailyData.map(item => formatDate(item.date)));

// 计算属性：完成率数据
const completionRates = computed(() => props.dailyData.map(item => item.completionRate));

// 计算属性：完成次数数据
const completionCounts = computed(() => props.dailyData.map(item => item.completionCount));

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  
  // 销毁已有图表
  if (chart) {
    chart.dispose();
  }
  
  // 如果没有数据，不创建图表
  if (!props.dailyData.length) {
    return;
  }
  
  console.log("TimelineChart: 准备初始化图表");
  console.log(`TimelineChart: 显示模式 = ${displayMode.value}`);
  
  // 创建图表实例
  chart = echarts.init(chartRef.value);
  
  // 准备标记线数据
  let markLineData = [];
  // 只在完成率模式下显示标记线
  if (displayMode.value === 'rate') {
    markLineData.push({
      yAxis: 70,
      name: '良好',
      label: {
        formatter: '良好 (70%)',
        position: 'start'
      }
    });
  }
  
  console.log("TimelineChart: markLine数据已准备", markLineData);
  
  // 设置图表选项
  const option = {
    grid: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 50,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: function(params) {
        const data = params[0];
        return `<div style="font-weight:bold;margin-bottom:5px;">${data.name}</div>
                <div style="margin:3px 0;">
                  <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${data.color};"></span>
                  ${displayMode.value === 'rate' ? '完成率' : '完成次数'}: ${data.value}${displayMode.value === 'rate' ? '%' : '次'}
                </div>`;
      }
    },
    xAxis: {
      type: 'category',
      data: dateLabels.value,
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
        color: '#666',
        fontSize: 12,
        rotate: dateLabels.value.length > 10 ? 30 : 0
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: displayMode.value === 'rate' ? 100 : undefined,
      interval: displayMode.value === 'rate' ? 20 : undefined,
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#666',
        formatter: displayMode.value === 'rate' ? '{value}%' : '{value}次'
      },
      splitLine: {
        lineStyle: {
          color: '#eee',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: displayMode.value === 'rate' ? '完成率' : '完成次数',
        type: 'line',
        data: displayMode.value === 'rate' ? completionRates.value : completionCounts.value,
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        itemStyle: {
          color: '#409EFF',
          borderWidth: 2
        },
        lineStyle: {
          width: 3,
          shadowColor: 'rgba(64, 158, 255, 0.3)',
          shadowBlur: 10
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        },
        emphasis: {
          itemStyle: {
            borderWidth: 3,
            borderColor: '#409EFF',
            color: '#fff'
          }
        },
        markLine: markLineData.length > 0 ? {
          silent: true,
          lineStyle: {
            color: '#999',
            type: 'dashed'
          },
          data: markLineData
        } : undefined
      }
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
  
  // 如果有对比数据，添加对比数据系列
  if (props.previousData && props.previousData.length > 0) {
    console.log(`TimelineChart: 添加对比数据，数量=${props.previousData.length}`);
    option.series.push({
      name: displayMode.value === 'rate' ? '上一时间段完成率' : '上一时间段完成次数',
      type: 'line',
      data: displayMode.value === 'rate' ? props.previousData.map(item => item.completionRate) : props.previousData.map(item => item.completionCount),
      smooth: true,
      symbol: 'emptyCircle',
      symbolSize: 6,
      itemStyle: {
        color: '#67C23A',
        borderWidth: 2
      },
      lineStyle: {
        width: 3,
        shadowColor: 'rgba(103, 194, 58, 0.3)',
        shadowBlur: 10
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.5)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
        ])
      },
      emphasis: {
        itemStyle: {
          borderWidth: 3,
          borderColor: '#67C23A',
          color: '#fff'
        }
      }
    });
  }
  
  console.log("TimelineChart: 图表配置已生成，准备设置");
  try {
    chart.setOption(option);
    console.log("TimelineChart: 图表已初始化");
  } catch (error) {
    console.error("TimelineChart: 图表初始化失败", error);
  }
};

// 响应窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

// 监听数据变化
watch(() => props.dailyData, () => {
  initChart();
}, { deep: true });

watch(() => props.previousData, () => {
  initChart();
}, { deep: true });

watch(() => displayMode.value, () => {
  initChart();
});

// 组件挂载时初始化图表
onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

// 组件卸载前清理资源
const onBeforeUnmount = () => {
  window.removeEventListener('resize', handleResize);
  if (chart) {
    chart.dispose();
    chart = null;
  }
};
</script>

<style scoped>
.timeline-chart-card {
  width: 100%;
  margin-bottom: 16px;
  background-color: var(--card-bg);
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.timeline-chart-card:hover {
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
  padding: 20px;
  min-height: 300px;
}

.chart {
  width: 100%;
  height: 300px;
  animation: fadeIn 0.8s ease-in-out;
}

.custom-empty {
  height: 300px;
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
  .chart-container {
    padding: 10px;
  }
  
  .chart {
    height: 250px;
  }
}
</style>
