<template>
  <div class="statistics-page no-extra-padding">
    <!-- 宇宙粒子背景 -->
    <SpaceBackground class="enhanced-background" />

    <!-- 内容主体 -->
    <div class="statistics-content">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="back-button-container">
            <el-button icon="ArrowLeft" circle @click="router.go(-1)" class="back-button" />
            <span class="back-text">返回</span>
          </div>
        </div>
        
        <div class="toolbar-center">
          <h2 class="page-title">打卡总结</h2>
        </div>
        
        <div class="toolbar-right">
          <div class="period-selector">
            <el-select v-model="selectedPeriod" placeholder="选择时间段" @change="refreshData" class="custom-select">
              <el-option label="最近一周" value="week" />
              <el-option label="最近一月" value="month" />
              <el-option label="最近一年" value="year" />
            </el-select>
            <el-checkbox v-model="showComparison" @change="refreshData" class="custom-checkbox">
              与上一{{ periodTextWithDays }}对比
            </el-checkbox>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-animation">
          <el-skeleton :rows="10" animated />
        </div>
      </div>

      <!-- 内容区域 -->
      <transition name="fade" mode="out-in">
        <div v-if="!loading && hasCheckInData" class="statistics-container">
          <!-- 完成率统计卡片 -->
          <CompletionRateCard 
            :completion-rate="completionRate" 
            :period="selectedPeriod"
            :previous-rate="showComparison ? previousCompletionRate : null"
          />

          <!-- 按项目统计卡片 -->
          <div class="row chart-row">
            <ItemCompletionChart 
              :items-data="itemsCompletionData"
              :previous-data="showComparison ? previousItemsCompletionData : null"
            />
            <ItemDistributionChart :items-data="itemsCompletionData" />
          </div>

          <!-- 时间趋势图 -->
          <TimelineChart 
            :daily-data="dailyCompletionData" 
            :period="selectedPeriod"
            :previous-data="showComparison ? previousDailyCompletionData : null"
          />

          <!-- 连续打卡记录 -->
          <StreakCard :streak-data="streakData" />

          <!-- 个性化建议 -->
          <AnalysisCard 
            :completion-rate="completionRate"
            :items-data="itemsCompletionData"
            :streak-data="streakData"
            :period="selectedPeriod"
          />
          
          <div class="bottom-spacer"></div>
        </div>

        <!-- 无数据状态 -->
        <div v-else-if="!loading && !hasCheckInData" class="no-data-container">
          <el-empty description="暂无打卡数据" class="custom-empty">
            <template #image>
              <img src="../../../assets/images/empty-data.svg" alt="无数据" class="empty-image">
            </template>
            <el-button type="primary" class="add-button" @click="router.push('/calendar/settings')">
              <el-icon class="add-icon"><Plus /></el-icon>
              去添加打卡项目
            </el-button>
          </el-empty>
        </div>
      </transition>
    </div>

    <!-- 底部导航 -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, Plus } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import SpaceBackground from "../components/SpaceBackground.vue";
import BottomNavBar from "../../../components/BottomNavBar.vue";
import { useCheckInStore } from "../../../stores/checkIn";
import { useAuthStore } from "../../../stores/auth";

// 导入子组件
import CompletionRateCard from "./components/CompletionRateCard.vue";
import ItemCompletionChart from "./components/ItemCompletionChart.vue";
import ItemDistributionChart from "./components/ItemDistributionChart.vue";
import TimelineChart from "./components/TimelineChart.vue";
import StreakCard from "./components/StreakCard.vue";
import AnalysisCard from "./components/AnalysisCard.vue";

// 状态变量
const router = useRouter();
const checkInStore = useCheckInStore();
const authStore = useAuthStore();

const loading = ref(true);
const selectedPeriod = ref("week");
const showComparison = ref(true);  // 设置为默认选中

// 数据变量
const checkInItems = ref([]);
const allCheckIns = ref([]);
const completionRate = ref('0.0');
const previousCompletionRate = ref('0.0');
const itemsCompletionData = ref([]);
const previousItemsCompletionData = ref([]);
const dailyCompletionData = ref([]);
const previousDailyCompletionData = ref([]);
const streakData = ref([]);

// 计算时间范围并获取打卡数据
const calculateDateRange = (period) => {
  const endDate = dayjs();
  let startDate;

  switch (period) {
    case "week":
      // 使用本周一到今天，而不是固定7天
      if (endDate.day() === 0) { // 周日
        startDate = endDate.subtract(6, "day");
      } else {
        startDate = endDate.startOf('week').add(1, 'day'); // 周一
      }
      break;
    case "month":
      startDate = endDate.subtract(29, "day");
      break;
    case "year":
      startDate = endDate.subtract(364, "day");
      break;
    default:
      // 使用本周一到今天，而不是固定7天
      if (endDate.day() === 0) { // 周日
        startDate = endDate.subtract(6, "day");
      } else {
        startDate = endDate.startOf('week').add(1, 'day'); // 周一
      }
  }

  return {
    startDate: startDate.format("YYYY-MM-DD"),
    endDate: endDate.format("YYYY-MM-DD")
  };
};

// 加载打卡数据
const loadCheckInData = async () => {
  try {
    loading.value = true;
    console.log(`加载${selectedPeriod.value}打卡数据开始`);

    // 加载打卡项目
    checkInItems.value = await checkInStore.getCheckInItems();
    console.log(`获取到${checkInItems.value.length}个打卡项目`);

    // 定义分析的时间范围
    const currentRange = calculateDateRange(selectedPeriod.value);
    console.log(`当前时间范围: ${currentRange.startDate} 至 ${currentRange.endDate}`);

    // 收集指定时间范围内的所有打卡记录
    const checkInsPromises = [];
    let currentDate = dayjs(currentRange.startDate);
    const endDate = dayjs(currentRange.endDate);

    // 按月获取打卡记录，因为API是按月获取的
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const year = currentDate.year();
      const month = currentDate.month() + 1;
      console.log(`准备获取 ${year}年${month}月 的打卡记录`);
      checkInsPromises.push(checkInStore.getUserCheckIns(year, month));
      currentDate = currentDate.add(1, 'month').startOf('month');
    }

    console.log(`共需加载${checkInsPromises.length}个月的打卡数据`);
    const checkInsResults = await Promise.all(checkInsPromises);
    const allCheckInsData = checkInsResults.flat();
    console.log(`获取到总计${allCheckInsData.length}条打卡记录`);

    // 过滤出当前时间范围内的打卡记录
    const startDateObj = dayjs(currentRange.startDate);
    const endDateObj = dayjs(currentRange.endDate);
    allCheckIns.value = allCheckInsData.filter(checkIn => {
      const checkInDate = dayjs(checkIn.date);
      return (checkInDate.isAfter(startDateObj, 'day') || 
              checkInDate.isSame(startDateObj, 'day')) && 
             (checkInDate.isBefore(endDateObj, 'day') || 
              checkInDate.isSame(endDateObj, 'day'));
    });
    
    console.log(`过滤后当前时间范围内共有${allCheckIns.value.length}条打卡记录`);

    // 加载连续打卡数据
    streakData.value = [];
    if (checkInItems.value.length > 0) {
      checkInItems.value.forEach(item => {
        // 跳过名为'undefined'的项目
        if (item.name === 'undefined') {
          return;
        }
        
        let maxStreak = 0;
        let currentStreak = 0;
        let currentDate = endDate.clone();
        
        // 计算当前连续打卡天数
        while (currentDate.isSameOrAfter(startDateObj, 'day')) {
          const date = currentDate.format('YYYY-MM-DD');
          const hasCheckIn = allCheckIns.value.some(checkIn => 
            checkIn.item_id === item.id && 
            dayjs(checkIn.date).format('YYYY-MM-DD') === date
          );
          
          if (hasCheckIn) {
            currentStreak++;
          } else {
            break;
          }
          
          currentDate = currentDate.subtract(1, 'day');
        }
        
        if (currentStreak > 0) {
          streakData.value.push({
            id: item.id,
            name: item.name,
            color: item.color,
            streak: currentStreak
          });
        }
      });
    }

    // 分析数据
    analyzeCheckInData();

    // 如果需要对比数据，加载之前的数据
    if (showComparison.value) {
      await loadPreviousData();
    }
    
    console.log(`${selectedPeriod.value}打卡数据加载完成`);
  } catch (error) {
    console.error("加载打卡统计数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 加载上一时间段的数据进行对比
const loadPreviousData = async () => {
  try {
    // 当前日期范围
    const currentRange = calculateDateRange(selectedPeriod.value);
    const currentStartDate = dayjs(currentRange.startDate);
    const currentEndDate = dayjs(currentRange.endDate);
    const dayCount = currentEndDate.diff(currentStartDate, 'day') + 1;

    // 上一时间段日期范围
    const previousStartDate = currentStartDate.subtract(dayCount, 'day');
    const previousEndDate = currentEndDate.subtract(dayCount, 'day');

    // 收集上一时间段的所有打卡记录
    const checkInsPromises = [];
    let currentDate = previousStartDate;

    // 按月获取打卡记录
    while (currentDate.isBefore(previousEndDate) || currentDate.isSame(previousEndDate, 'day')) {
      const year = currentDate.year();
      const month = currentDate.month() + 1;
      checkInsPromises.push(checkInStore.getUserCheckIns(year, month));
      currentDate = currentDate.add(1, 'month').startOf('month');
    }

    const checkInsResults = await Promise.all(checkInsPromises);
    const allPreviousCheckIns = checkInsResults.flat();

    // 过滤出上一时间段的打卡记录
    const previousCheckIns = allPreviousCheckIns.filter(checkIn => {
      const checkInDate = dayjs(checkIn.date);
      return (checkInDate.isAfter(previousStartDate, 'day') || 
              checkInDate.isSame(previousStartDate, 'day')) && 
             (checkInDate.isBefore(previousEndDate, 'day') || 
              checkInDate.isSame(previousEndDate, 'day'));
    });

    // 分析上一时间段的数据
    analyzePreviousData(previousCheckIns, previousStartDate, previousEndDate);
  } catch (error) {
    console.error("加载上一时间段打卡数据失败:", error);
  }
};

// 分析当前打卡数据
const analyzeCheckInData = () => {
  if (!checkInItems.value.length) return;

  const currentRange = calculateDateRange(selectedPeriod.value);
  const startDate = dayjs(currentRange.startDate);
  const endDate = dayjs(currentRange.endDate);
  const totalDays = endDate.diff(startDate, 'day') + 1;

  // 计算总完成率
  const totalPossibleCheckIns = checkInItems.value.length * totalDays;
  const totalCompletedCheckIns = allCheckIns.value.length;
  try {
    if (totalPossibleCheckIns > 0) {
      const rawRate = (totalCompletedCheckIns / totalPossibleCheckIns) * 100;
      const rate = rawRate.toFixed(1);
      completionRate.value = rate;
      console.log(`计算完成率：${totalCompletedCheckIns}/${totalPossibleCheckIns} = ${rawRate}% (${rate}%)`);
    } else {
      completionRate.value = '0.0';
      console.log(`计算完成率：无可能的打卡项，设为0.0%`);
    }
  } catch (error) {
    console.error("计算完成率出错:", error);
    completionRate.value = '0.0';
  }

  // 分析各项目的完成情况
  itemsCompletionData.value = checkInItems.value.map(item => {
    const itemCheckIns = allCheckIns.value.filter(checkIn => checkIn.item_id === item.id);
    const completionRate = totalDays > 0 ? (itemCheckIns.length / totalDays * 100).toFixed(1) : 0;
    
    return {
      id: item.id,
      name: item.name,
      color: item.color,
      completionCount: itemCheckIns.length,
      possibleCount: totalDays,
      completionRate: parseFloat(completionRate),
    };
  });

  // 生成每日完成数据
  dailyCompletionData.value = [];
  let currentDate = startDate;
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    const dayFormatted = currentDate.format('YYYY-MM-DD');
    const dayCheckIns = allCheckIns.value.filter(checkIn => 
      dayjs(checkIn.date).format('YYYY-MM-DD') === dayFormatted
    );
    
    dailyCompletionData.value.push({
      date: dayFormatted,
      completionCount: dayCheckIns.length,
      possibleCount: checkInItems.value.length,
      completionRate: checkInItems.value.length > 0 ? 
        (dayCheckIns.length / checkInItems.value.length * 100) : 0
    });
    
    currentDate = currentDate.add(1, 'day');
  }
};

// 分析上一时间段的数据
const analyzePreviousData = (previousCheckIns, startDate, endDate) => {
  if (!checkInItems.value.length) return;

  const totalDays = endDate.diff(startDate, 'day') + 1;

  // 计算总完成率
  const totalPossibleCheckIns = checkInItems.value.length * totalDays;
  const totalCompletedCheckIns = previousCheckIns.length;
  try {
    if (totalPossibleCheckIns > 0) {
      const rawRate = (totalCompletedCheckIns / totalPossibleCheckIns) * 100;
      const rate = rawRate.toFixed(1);
      previousCompletionRate.value = rate;
      console.log(`计算上一时段完成率：${totalCompletedCheckIns}/${totalPossibleCheckIns} = ${rawRate}% (${rate}%)`);
    } else {
      previousCompletionRate.value = '0.0';
      console.log(`计算上一时段完成率：无可能的打卡项，设为0.0%`);
    }
  } catch (error) {
    console.error("计算上一时段完成率出错:", error);
    previousCompletionRate.value = '0.0';
  }

  // 分析各项目的完成情况
  previousItemsCompletionData.value = checkInItems.value.map(item => {
    const itemCheckIns = previousCheckIns.filter(checkIn => checkIn.item_id === item.id);
    const completionRate = totalDays > 0 ? (itemCheckIns.length / totalDays * 100).toFixed(1) : 0;
    
    return {
      id: item.id,
      name: item.name,
      color: item.color,
      completionCount: itemCheckIns.length,
      possibleCount: totalDays,
      completionRate: parseFloat(completionRate),
    };
  });

  // 生成每日完成数据
  previousDailyCompletionData.value = [];
  let currentDate = startDate;
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    const dayFormatted = currentDate.format('YYYY-MM-DD');
    const dayCheckIns = previousCheckIns.filter(checkIn => 
      dayjs(checkIn.date).format('YYYY-MM-DD') === dayFormatted
    );
    
    previousDailyCompletionData.value.push({
      date: dayFormatted,
      completionCount: dayCheckIns.length,
      possibleCount: checkInItems.value.length,
      completionRate: checkInItems.value.length > 0 ? 
        (dayCheckIns.length / checkInItems.value.length * 100) : 0
    });
    
    currentDate = currentDate.add(1, 'day');
  }
};

// 刷新数据
const refreshData = async () => {
  console.log(`切换到${selectedPeriod.value}时间段，刷新数据`);
  // 重置数据
  completionRate.value = '0.0';
  previousCompletionRate.value = '0.0';
  allCheckIns.value = [];
  itemsCompletionData.value = [];
  previousItemsCompletionData.value = [];
  dailyCompletionData.value = [];
  previousDailyCompletionData.value = [];
  streakData.value = [];
  
  await loadCheckInData();
};

// 计算属性：是否有打卡数据
const hasCheckInData = computed(() => {
  return checkInItems.value.length > 0;
});

// 计算属性：时间段实际天数
const actualPeriodDays = computed(() => {
  const currentRange = calculateDateRange(selectedPeriod.value);
  const startDate = dayjs(currentRange.startDate);
  const endDate = dayjs(currentRange.endDate);
  return endDate.diff(startDate, 'day') + 1; // 包含开始日期和结束日期
});

// 计算属性：时间段显示文本
const periodText = computed(() => {
  switch (selectedPeriod.value) {
    case "week":
      return "周";
    case "month":
      return "月";
    case "year":
      return "年";
    default:
      return "周";
  }
});

// 计算属性：时间段显示文本（带天数）
const periodTextWithDays = computed(() => {
  return `${periodText.value}(${actualPeriodDays.value}天)`;
});

// 监听身份验证状态变化
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    loadCheckInData();
  }
});

// 生命周期钩子
onMounted(() => {
  if (authStore.isAuthenticated) {
    loadCheckInData();
  }
});
</script>

<style scoped>
.statistics-page {
  min-height: 100vh;
  background-color: var(--bg-color);
  position: relative;
  padding-bottom: 70px;
  overflow-x: hidden;
}

.enhanced-background {
  opacity: 0.4;
}

.statistics-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 15px;
  background-color: rgba(var(--card-bg-rgb), 0.9);
  padding: 16px 20px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.toolbar:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.toolbar-left, .toolbar-center, .toolbar-right {
  display: flex;
  align-items: center;
}

.toolbar-left {
  flex: 1;
  justify-content: flex-start;
}

.toolbar-center {
  flex: 2;
  justify-content: center;
  text-align: center;
}

.toolbar-right {
  flex: 1;
  justify-content: flex-end;
}

.title {
  display: none; /* 隐藏旧的title容器 */
}

.back-button-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.back-button {
  background: linear-gradient(135deg, #4b6cb7, #182848);
  border: none;
  color: white;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(24, 40, 72, 0.3);
  width: 48px;
  height: 48px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-button:hover {
  transform: translateX(-3px);
  box-shadow: 0 6px 15px rgba(24, 40, 72, 0.4);
}

.period-selector {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.custom-select {
  width: 140px;
  transition: all 0.3s ease;
}

.custom-select:hover {
  transform: translateY(-2px);
}

.custom-select :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
}

.custom-select :deep(.el-input__wrapper:hover) {
  border-color: rgba(75, 108, 183, 0.4);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.custom-checkbox {
  margin-left: 8px;
  transition: all 0.3s ease;
}

.custom-checkbox:hover {
  transform: translateY(-2px);
}

.statistics-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.chart-row > * {
  flex: 1;
  min-width: 300px;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.07));
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.loading-container {
  padding: 30px;
  background-color: rgba(var(--card-bg-rgb), 0.7);
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.loading-animation {
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

.no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background-color: rgba(var(--card-bg-rgb), 0.7);
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  margin-top: 20px;
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 400px;
}

.custom-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-image {
  width: 160px;
  height: 160px;
  margin-bottom: 30px;
  opacity: 0.8;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

.custom-empty :deep(.el-empty__description) {
  margin-bottom: 25px;
  font-size: 18px;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.add-button {
  background: linear-gradient(135deg, #4b6cb7, #182848);
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 16px rgba(24, 40, 72, 0.3);
}

.add-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(24, 40, 72, 0.4);
}

.add-icon {
  font-size: 18px;
}

.bottom-spacer {
  height: 20px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  color: var(--text-color);
  display: flex;
  align-items: center;
  font-weight: 700;
  background: linear-gradient(135deg, #4b6cb7, #42b5ca);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 0.5px;
  position: relative;
}

.back-text {
  font-size: 14px;
  color: var(--text-color);
  white-space: nowrap;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .statistics-content {
    padding: 16px;
  }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
  }
  
  .toolbar-left, .toolbar-center, .toolbar-right {
    width: 100%;
    justify-content: center;
    margin-bottom: 8px;
  }
  
  .toolbar-left {
    justify-content: flex-start;
  }
  
  .toolbar-right {
    justify-content: center;
  }
  
  .period-selector {
    width: 100%;
    margin-top: 5px;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  
  .custom-select {
    width: 100%;
  }
  
  .page-title {
    font-size: 22px;
    margin: 5px 0;
  }
}
</style>
