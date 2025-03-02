<template>
  <el-card class="item-distribution-chart">
    <template #header>
      <div class="card-header">
        <h3>打卡项目分布</h3>
      </div>
    </template>
    <div class="chart-container">
      <div ref="chartRef" class="chart"></div>
      <el-empty v-if="!itemsData.length" description="暂无项目数据" class="custom-empty"></el-empty>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  itemsData: {
    type: Array,
    default: () => []
  }
});

const chartRef = ref(null);
let chart = null;

// 计算图表显示的数据
const pieData = computed(() => {
  if (!props.itemsData.length) return [];
  
  // 预定义的颜色数组
  const colorPalette = [
    ['#5470c6', '#4b6cb7', '#3f5ca9'], 
    ['#91cc75', '#67C23A', '#49a520'], 
    ['#fac858', '#e7b529', '#d49e12'], 
    ['#ee6666', '#dd4b4b', '#c93c3c'], 
    ['#73c0de', '#5ab0d5', '#439bc0'], 
    ['#3ba272', '#2a9361', '#1e7e4c'], 
    ['#fc8452', '#ea6a3a', '#d3522b'], 
    ['#9a60b4', '#834ca3', '#6d3b8d']
  ];
  
  return props.itemsData.map((item, index) => {
    // 循环使用颜色数组
    const colorIndex = index % colorPalette.length;
    const colors = colorPalette[colorIndex];
    
    return {
      value: item.completionCount,
      name: item.name,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: colors[0] },
          { offset: 1, color: colors[2] }
        ])
      }
    };
  });
});

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  if (chart) {
    chart.dispose();
  }
  console.log("ItemDistributionChart: 准备初始化图表");
  console.log(`ItemDistributionChart: 收到数据项数量 = ${props.itemsData.length}`);
  
  if (!props.itemsData.length) {
    console.log("ItemDistributionChart: 无数据，不初始化图表");
    return;
  }
  
  chart = echarts.init(chartRef.value);
  
  // 设置图表配置
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: function(params) {
        // 获取对应的项目数据
        const item = props.itemsData.find(i => i.name === params.name);
        return `
          <div style="font-weight:bold;margin-bottom:5px;">
            ${params.name}
          </div>
          <div style="margin:5px 0;">
            <span>数量：${params.value} 次</span>
          </div>
          <div style="margin:5px 0;">
            <span>占比：${params.percent}%</span>
          </div>
        `;
      }
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 15,
      itemHeight: 10,
      itemGap: 20,
      textStyle: {
        color: '#606266',
        fontSize: 12
      },
      pageButtonPosition: 'end',
      pageIconSize: 12,
      pageTextStyle: {
        color: '#606266'
      },
      formatter: (name) => {
        // 查找对应的项目数据
        const item = props.itemsData.find(i => i.name === name);
        if (item) {
          return `${name} (${item.completionCount}次)`;
        }
        return name;
      }
    },
    series: [
      {
        name: '打卡分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: '{b}: {d}%'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: pieData.value,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return Math.random() * 200;
        }
      }
    ],
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicInOut'
  };
  
  console.log("ItemDistributionChart: 图表配置已生成，准备设置");
  chart.setOption(option);
  console.log("ItemDistributionChart: 图表已初始化");
  
  // 检查图表是否有图例，如果有则添加额外类名为图例预留空间
  if (props.itemsData.length > 0) {
    chartRef.value.parentNode.classList.add('legend-visible');
  }
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
.item-distribution-chart {
  flex: 1;
  min-width: 300px;
  height: 380px;
  background-color: var(--card-bg);
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.item-distribution-chart:hover {
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
  margin-bottom: 20px;
}

.chart {
  width: 100%;
  height: 260px;
  animation: fadeIn 0.8s ease-in-out;
}

.custom-empty {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.legend-visible {
  margin-bottom: 40px;
}

@media screen and (max-width: 768px) {
  .card-header {
    padding: 14px 16px;
  }
  
  .chart-container {
    padding: 5px 10px;
    margin-bottom: 40px;
  }
  
  .item-distribution-chart {
    height: 380px;
  }
  
  .chart {
    height: 220px;
  }
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
</style>
