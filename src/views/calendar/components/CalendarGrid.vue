<template>
  <div class="calendar-wrapper mobile-card gradient-border">
    <div class="month-nav">
      <el-button class="nav-button" @click="$emit('prev-month')">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="month-label">{{ currentMonthYear }}</span>
      <el-button class="nav-button" @click="$emit('next-month')">
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <div class="calendar-grid">
      <!-- 星期头部 -->
      <div class="weekdays">
        <div
          v-for="day in ['一', '二', '三', '四', '五', '六', '日']"
          :key="day"
          class="weekday"
        >
          {{ day }}
        </div>
      </div>

      <!-- 日期单元格 -->
      <div class="days">
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="day-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            today: day.isToday,
            'has-events': day.hasEvents,
            'has-checkins': day.hasCheckins,
          }"
          @click="$emit('select-day', day)"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          <div class="day-indicators" v-if="day.hasEvents || day.hasCheckins">
            <div v-if="day.hasEvents" class="event-indicator"></div>
            <div
              v-for="(checkIn, index) in day.checkIns"
              :key="index"
              class="checkin-indicator"
              :style="{
                backgroundColor: checkIn.color || checkInColors.default,
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";

defineProps({
  calendarDays: {
    type: Array,
    required: true,
  },
  currentMonthYear: {
    type: String,
    required: true,
  },
  checkInColors: {
    type: Object,
    default: () => ({
      default: "#9C27B0",
    }),
  },
});

defineEmits(["prev-month", "next-month", "select-day"]);
</script>

<style scoped>
.calendar-wrapper {
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
  padding: 12px;
}

.month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: var(--text-color);
}

.month-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

.nav-button {
  background: transparent;
  border: none;
  color: var(--text-color);
}

.calendar-grid {
  display: flex;
  flex-direction: column;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
}

.weekday {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.9rem;
  padding: 8px 0;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-gap: 4px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  padding: 4px;
  padding-bottom: 15px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-color);
}

.day-cell:hover {
  background: rgba(255, 255, 255, 0.1);
}

.day-cell.other-month {
  opacity: 0.5;
}

.day-cell.has-events {
  background: rgba(56, 189, 248, 0.1);
}

.day-number {
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 8px;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.day-indicators {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  position: absolute;
  bottom: 5px;
  max-width: 90%;
}

.event-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--accent-color);
}

.checkin-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 5px currentColor;
  transition: all 0.3s ease;
  opacity: 0.9;
}

.day-cell:hover .checkin-indicator {
  transform: scale(1.2);
  opacity: 1;
}

.day-cell.today {
  background: rgba(147, 51, 234, 0.15);
  color: white;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 8px rgba(2, 255, 234, 0.635);
}

.day-cell.has-checkins {
  background: rgba(30, 30, 40, 0.2);
  border: 1px solid rgba(147, 51, 234, 0.15);
}

@media (max-width: 480px) {
  .day-cell {
    font-size: 0.8rem;
    padding: 2px;
    padding-bottom: 12px;
  }

  .day-indicators {
    bottom: 2px;
    gap: 2px;
  }

  .checkin-indicator {
    width: 6px;
    height: 6px;
  }
}
</style>
