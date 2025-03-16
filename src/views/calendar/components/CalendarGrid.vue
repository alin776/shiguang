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
  border-radius: 0;
  overflow: hidden;
  position: relative;
  margin-bottom: 0;
  padding: 10px 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  border: none;
}

.month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: var(--text-color);
  padding: 0 5px;
}

.month-label {
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
  text-shadow: none;
  letter-spacing: 0;
  position: relative;
  padding: 0 8px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 80px);
  text-align: center;
}

.month-label::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #333, #666);
  border-radius: 2px;
}

.nav-button {
  background: rgba(51, 51, 51, 0.08);
  border: none;
  color: #333;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  min-width: 30px;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 0;
  flex-shrink: 0;
}

.nav-button:hover {
  background: rgba(51, 51, 51, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.nav-button:active {
  transform: translateY(0);
}

.calendar-grid {
  display: flex;
  flex-direction: column;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 12px;
  padding: 6px 0;
  background: rgba(51, 51, 51, 0.05);
  border-radius: 12px;
}

.weekday {
  color: #333;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 8px 0;
  text-shadow: none;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-gap: 4px;
}

.day-cell {
  aspect-ratio: 1 / 0.85;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  padding: 4px;
  padding-bottom: 16px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.6);
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.day-cell:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.day-cell.other-month {
  opacity: 0.4;
  background: rgba(240, 240, 240, 0.4);
  box-shadow: none;
}

.day-cell.has-events {
  background: rgba(51, 51, 51, 0.06);
  border-color: rgba(51, 51, 51, 0.1);
}

.day-number {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  text-shadow: none;
  color: #444;
}

.day-indicators {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  position: absolute;
  bottom: 4px;
  max-width: 90%;
}

.event-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #555;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.checkin-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  opacity: 0.9;
}

.day-cell:hover .checkin-indicator {
  transform: scale(1.3);
  opacity: 1;
}

.day-cell.today {
  background: rgba(51, 51, 51, 0.08);
  border: 2px solid #444;
  color: #333;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
}

.day-cell.today .day-number {
  color: #333;
  font-weight: 700;
}

.day-cell.has-checkins {
  background: rgba(245, 247, 250, 0.8);
  border: 1px solid rgba(51, 51, 51, 0.15);
}

@media (max-width: 480px) {
  .day-cell {
    aspect-ratio: 1 / 0.8;
    font-size: 0.8rem;
    padding: 2px;
    padding-bottom: 12px;
    border-radius: 8px;
  }

  .day-number {
    font-size: 0.9rem;
    margin-bottom: 2px;
  }

  .day-indicators {
    bottom: 2px;
    gap: 2px;
  }

  .checkin-indicator, .event-indicator {
    width: 5px;
    height: 5px;
  }
  
  .month-label {
    font-size: 1rem;
    padding: 0 4px;
  }
  
  .nav-button {
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
  }
}

@media (max-width: 360px) {
  .month-label {
    font-size: 0.9rem;
  }
  
  .nav-button {
    width: 26px;
    height: 26px;
    min-width: 26px;
    min-height: 26px;
  }
}
</style>
