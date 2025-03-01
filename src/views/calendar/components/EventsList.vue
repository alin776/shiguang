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
}

.events-list {
  width: 100%;
  overflow: hidden;
}

.section-title {
  color: white;
  font-weight: 500;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--secondary-color)
  );
  border-radius: 50%;
  margin-right: 8px;
  color: white;
  box-shadow: 0 0 5px rgba(147, 51, 234, 0.7);
}

.event-item {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border-radius: var(--small-radius);
  background: var(--card-inner);
  border-left: 3px solid;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.event-item:active {
  transform: scale(0.98);
}

.event-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.event-title {
  font-weight: 500;
  color: var(--text-color);
}

.no-events {
  text-align: center;
  padding: 24px 0;
}

.no-events p {
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.mobile-button.primary {
  background: var(--primary-color);
  color: white;
  border: none;
}
</style>
