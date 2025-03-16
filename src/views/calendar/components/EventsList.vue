<template>
  <div class="mobile-card gradient-border events-area">
    <h3 class="section-title">
      <span class="section-icon"
        ><el-icon><Plus /></el-icon
      ></span>
      {{ selectedDateDisplay }} 的事务
    </h3>
    <div v-if="events.length > 0" class="events-list">
      <div
        v-for="event in events"
        :key="event.id"
        class="event-item"
        :style="{ borderLeftColor: event.color }"
        @click="$emit('edit-event', event.id)"
      >
        <div class="event-time">{{ formatEventTime(event) }}</div>
        <div class="event-title">{{ event.title }}</div>
      </div>
    </div>
    <div v-else class="no-events">
      <p>今天暂无事务安排</p>
      <el-button class="mobile-button primary" @click="$emit('add-event')">
        添加事务
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { Plus } from "@element-plus/icons-vue";
import dayjs from "dayjs";

defineProps({
  events: {
    type: Array,
    required: true,
  },
  selectedDateDisplay: {
    type: String,
    required: true,
  },
});

defineEmits(["add-event", "edit-event"]);

const formatEventTime = (event) => {
  return `${dayjs(event.start_time).format("HH:mm")} - ${dayjs(
    event.end_time
  ).format("HH:mm")}`;
};
</script>

<style scoped>
.events-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 10px 0;
  margin-bottom: 0;
  position: relative;
  border-radius: 0;
  max-height: none;
  height: auto;
  overflow: visible;
  background: transparent;
  box-shadow: none;
  border: none;
}

.events-list {
  width: 100%;
  overflow: visible;
  max-height: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  padding: 0 5px;
}

.section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #333, #555);
  border-radius: 50%;
  margin-right: 6px;
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.event-item {
  width: 100%;
  box-sizing: border-box;
  padding: 14px;
  border-radius: 12px;
  background: #FFFFFF;
  border-left: 4px solid;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
  border-top: none;
  border-bottom: none;
  border-right: none;
}

.event-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08);
}

.event-item:active {
  transform: scale(0.98);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.06);
}

.event-time {
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.event-time::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23333333"><path d="M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z M12,20c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8S16.4,20,12,20z"/><path d="M12.5,7H11v6l5.2,3.2l0.8-1.3l-4.5-2.7V7z"/></svg>') no-repeat center;
  margin-right: 6px;
  opacity: 0.7;
}

.event-title {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  line-height: 1.4;
}

.no-events {
  text-align: center;
  padding: 20px 0;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.no-events p {
  margin-bottom: 16px;
  color: #888;
  font-size: 15px;
}

.mobile-button.primary {
  background: rgba(51, 51, 51, 0.08);
  color: #333;
  border: 1px solid rgba(51, 51, 51, 0.15);
  border-radius: 14px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.mobile-button.primary:hover {
  background: rgba(51, 51, 51, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 480px) {
  .events-area {
    padding: 5px 0;
  }
  
  .event-item {
    padding: 12px;
    border-radius: 10px;
  }
  
  .event-title {
    font-size: 15px;
  }
  
  .event-time {
    font-size: 13px;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .section-icon {
    width: 22px;
    height: 22px;
  }
  
  .mobile-button.primary {
    padding: 4px 10px;
    font-size: 11px;
  }
}

@media (max-width: 360px) {
  .section-title {
    font-size: 13px;
  }
  
  .mobile-button.primary {
    padding: 3px 8px;
    font-size: 10px;
  }
}
</style>
