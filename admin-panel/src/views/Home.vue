<template>
  <div class="home-page">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
    </div>
    
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ data.postCount || '0' }}</div>
            <div class="stat-label">帖子数量</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ data.userCount || '0' }}</div>
            <div class="stat-label">用户数量</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ data.commentCount || '0' }}</div>
            <div class="stat-label">评论数量</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 增长图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>用户增长趋势</h3>
          </div>
          <div class="chart-container">
            <div id="userGrowthChart" style="width: 100%; height: 300px;"></div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>用户活跃度</h3>
          </div>
          <div class="chart-container">
            <div id="userActivityChart" style="width: 100%; height: 300px;"></div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>帖子增长趋势</h3>
          </div>
          <div class="chart-container">
            <div id="postGrowthChart" style="width: 100%; height: 300px;"></div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>评论增长趋势</h3>
          </div>
          <div class="chart-container">
            <div id="commentGrowthChart" style="width: 100%; height: 300px;"></div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <div class="card" v-loading="loading">
      <div class="card-header">
        <h2 class="card-title">最近活动</h2>
      </div>
      <div class="card-body">
        <el-empty v-if="!data.recentActivities?.length" description="暂无活动数据" />
        <div v-else class="activity-list">
          <div v-for="item in data.recentActivities" :key="item.id" class="activity-item">
            <div class="activity-time">{{ formatTime(item.time) }}</div>
            <div class="activity-content">{{ item.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, User, ChatDotRound } from '@element-plus/icons-vue'
import { getDashboardData } from '@/api/dashboard'
import * as echarts from 'echarts'

const data = ref({
  postCount: 0,
  userCount: 0,
  commentCount: 0,
  userGrowth: [],
  postGrowth: [],
  commentGrowth: [],
  userActivity: [],
  recentActivities: []
})

// 图表实例
let userGrowthChart = null
let postGrowthChart = null
let commentGrowthChart = null
let userActivityChart = null

// 加载中状态
const loading = ref(false)

onMounted(async () => {
  try {
    loading.value = true
    const response = await getDashboardData()
    data.value = response.data
    
    // 初始化图表
    initCharts()
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    ElMessage.error('获取仪表盘数据失败')
    // 加载失败时使用模拟数据
    const mockGrowthData = [
      { date: getDateString(6), count: 5 },
      { date: getDateString(5), count: 8 },
      { date: getDateString(4), count: 3 },
      { date: getDateString(3), count: 10 },
      { date: getDateString(2), count: 7 },
      { date: getDateString(1), count: 12 },
      { date: getDateString(0), count: 9 }
    ]
    
    data.value = {
      postCount: 123,
      userCount: 456,
      commentCount: 789,
      userGrowth: mockGrowthData,
      postGrowth: mockGrowthData.map(item => ({ ...item, count: item.count + 3 })),
      commentGrowth: mockGrowthData.map(item => ({ ...item, count: item.count + 5 })),
      userActivity: mockGrowthData.map(item => ({ ...item, count: Math.floor(item.count * 1.5) })),
      recentActivities: [
        { id: 1, time: new Date(), content: '用户小明发布了新帖子' },
        { id: 2, time: new Date(Date.now() - 3600000), content: '管理员更新了系统设置' },
        { id: 3, time: new Date(Date.now() - 7200000), content: '新用户小红注册了账号' }
      ]
    }
    
    // 初始化图表
    initCharts()
  } finally {
    loading.value = false
  }
})

// 获取过去n天的日期字符串
const getDateString = (daysAgo) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

// 初始化所有图表
const initCharts = () => {
  // 初始化用户增长图表
  userGrowthChart = initChart(
    'userGrowthChart', 
    data.value.userGrowth || [], 
    '用户增长量', 
    ['#58A8FF', '#36CBCB']
  )
  
  // 初始化帖子增长图表
  postGrowthChart = initChart(
    'postGrowthChart', 
    data.value.postGrowth || [], 
    '帖子增长量',
    ['#5470C6', '#91CC75']
  )
  
  // 初始化评论增长图表
  commentGrowthChart = initChart(
    'commentGrowthChart', 
    data.value.commentGrowth || [], 
    '评论增长量',
    ['#FAC858', '#EE6666']
  )
  
  // 初始化用户活跃度图表
  userActivityChart = initChart(
    'userActivityChart', 
    data.value.userActivity || [], 
    '活跃用户数',
    ['#67C23A', '#E6A23C']
  )
}

// 初始化单个图表
const initChart = (elementId, chartData, seriesName, colors) => {
  const chartDom = document.getElementById(elementId)
  if (!chartDom) return null
  
  const chart = echarts.init(chartDom)
  
  const dates = chartData.map(item => item.date)
  const values = chartData.map(item => item.count)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />{a}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        formatter: value => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: seriesName,
        type: 'line',
        data: values,
        smooth: true,
        lineStyle: {
          width: 3,
          color: colors[0]
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: colors[0]
            },
            {
              offset: 1,
              color: 'rgba(255, 255, 255, 0.3)'
            }
          ])
        },
        itemStyle: {
          color: colors[0]
        }
      }
    ],
    color: colors
  }
  
  chart.setOption(option)
  return chart
}

// 窗口大小变化时重绘图表
const resizeHandler = () => {
  userGrowthChart?.resize()
  postGrowthChart?.resize()
  commentGrowthChart?.resize()
  userActivityChart?.resize()
}

// 监听窗口大小变化
window.addEventListener('resize', resizeHandler)

// 组件销毁前清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler)
  userGrowthChart?.dispose()
  postGrowthChart?.dispose()
  commentGrowthChart?.dispose()
  userActivityChart?.dispose()
})

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.home-page {
  padding: 10px 0;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #ecf5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #409EFF;
  margin-right: 20px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 图表卡片样式 */
.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  padding: 15px;
}

.chart-header {
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.card-title {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.card-body {
  padding: 20px;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.activity-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.activity-time {
  width: 180px;
  color: #909399;
  font-size: 14px;
}

.activity-content {
  flex: 1;
  color: #303133;
  font-size: 14px;
}
</style> 