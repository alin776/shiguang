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
            <el-button
              icon="ArrowLeft"
              circle
              @click="router.go(-1)"
              class="back-button"
            />
            <span class="back-text">返回</span>
          </div>
        </div>

        <div class="toolbar-center">
          <h2 class="page-title">打卡总结</h2>
        </div>

        <div class="toolbar-right">
          <div class="period-selector">
            <el-select
              v-model="selectedPeriod"
              placeholder="选择时间段"
              @change="refreshData"
              class="custom-select"
            >
              <el-option label="最近一周" value="week" />
              <el-option label="最近一月" value="month" />
              <el-option label="最近一年" value="year" />
            </el-select>
            <el-checkbox
              v-model="showComparison"
              @change="refreshData"
              class="custom-checkbox"
            >
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
              :previous-data="
                showComparison ? previousItemsCompletionData : null
              "
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
              <div class="empty-state-illustration">
                <div class="calendar-icon">
                  <div class="calendar-top">
                    <div class="calendar-dot"></div>
                    <div class="calendar-dot"></div>
                  </div>
                  <div class="calendar-body">
                    <div class="calendar-check">+</div>
                  </div>
                </div>
              </div>
            </template>
            <div class="empty-message">
              您还没有添加任何打卡项目或完成任何打卡
            </div>
            <el-button
              type="primary"
              class="add-button"
              @click="router.push('/calendar/settings')"
            >
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
import { ArrowLeft, Plus } from "@element-plus/icons-vue";
import SpaceBackground from "../components/SpaceBackground.vue";
import BottomNavBar from "../../../components/BottomNavBar.vue";
import CompletionRateCard from "./components/CompletionRateCard.vue";
import ItemCompletionChart from "./components/ItemCompletionChart.vue";
import ItemDistributionChart from "./components/ItemDistributionChart.vue";
import TimelineChart from "./components/TimelineChart.vue";
import StreakCard from "./components/StreakCard.vue";
import AnalysisCard from "./components/AnalysisCard.vue";
import { useStatistics } from "./useStatistics";

// 使用抽离的统计逻辑
const {
  router,
  loading,
  selectedPeriod,
  showComparison,
  completionRate,
  previousCompletionRate,
  itemsCompletionData,
  previousItemsCompletionData,
  dailyCompletionData,
  previousDailyCompletionData,
  streakData,
  hasCheckInData,
  periodTextWithDays,
  refreshData,
} = useStatistics();
</script>

<style src="./StatisticsView.css" scoped></style>
