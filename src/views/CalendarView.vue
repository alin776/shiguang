<template>
  <div class="calendar-page">
    <!-- 顶部导航栏 -->
    <div class="calendar-header">
      <div class="nav-buttons">
        <el-button-group>
          <el-button text @click="prevWeek">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-button text @click="goToday">今天</el-button>
          <el-button text @click="nextWeek">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      <h2 class="current-month">{{ currentMonthYear }}</h2>
    </div>

    <!-- 日历主体 -->
    <div class="calendar-body">
      <div class="days-grid">
        <!-- 星期头部 -->
        <div class="days-header">
          <div class="empty-header"></div>
          <div v-for="day in weekDays" :key="day.date" class="day-header">
            <div class="weekday">{{ day.weekday }}</div>
            <div class="date" :class="{ 'is-today': isToday(day.date) }">
              {{ day.dayOfMonth }}
            </div>
          </div>
        </div>

        <!-- 时间格子 -->
        <div class="time-grid">
          <!-- 时间列 -->
          <div class="time-column">
            <div v-for="hour in hours" :key="hour" class="time-slot">
              {{ formatHour(hour) }}
            </div>
          </div>

          <!-- 日期列 -->
          <div v-for="day in weekDays" :key="day.date" class="day-column">
            <div v-for="hour in hours" :key="hour" class="time-slot"></div>
            <!-- 事件 -->
            <div class="events-container">
              <div
                v-for="event in getEventsForDay(day.date)"
                :key="event.id"
                class="event"
                :style="getEventStyle(event)"
                @click="handleEventClick(event)"
              >
                <div class="event-content">
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-time">
                    {{ formatEventTime(event) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加事件按钮 -->
    <div class="add-event-btn" @click="showAddEventDialog">
      <el-icon><Plus /></el-icon>
    </div>

    <!-- 事件对话框 -->
    <el-dialog
      v-model="showEventDialog"
      :title="dialogType === 'add' ? '添加事件' : '编辑事件'"
      width="90%"
      :close-on-click-modal="false"
    >
      <event-form
        ref="eventFormRef"
        v-model="eventForm"
        :type="dialogType"
        :initial-data="eventForm"
        @submit="handleEventSubmit"
        @delete="handleEventDelete"
        @cancel="showEventDialog = false"
      />
    </el-dialog>
  </div>
  <BottomNavBar />
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useNotificationStore } from "../stores/notification";
import { useSettingsStore } from "../stores/settings";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import {
  Setting,
  SwitchButton,
  Bell,
  User,
  CaretBottom,
  Clock,
  ArrowLeft,
  ArrowRight,
  Plus,
} from "@element-plus/icons-vue";
import "../assets/styles/calendar.css";
import BottomNavBar from "../components/BottomNavBar.vue";
import { useEventStore } from "../stores/event";
import EventForm from "../components/EventForm.vue";

const eventStore = useEventStore();
const notificationStore = useNotificationStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const router = useRouter();
const currentDate = ref(dayjs());
const showEventDialog = ref(false);
const dialogType = ref("add");
const eventFormRef = ref(null);
const loading = ref(false);
const events = ref([]);

const eventForm = ref({
  title: "",
  startTime: "",
  endTime: "",
  color: "#409EFF",
  reminder: false,
});

const rules = {
  title: [{ required: true, message: "请输入事件标题", trigger: "blur" }],
  startTime: [{ required: true, message: "请选择开始时间", trigger: "blur" }],
  endTime: [{ required: true, message: "请选择结束时间", trigger: "blur" }],
};

// 小时列表
const hours = Array.from({ length: 24 }, (_, i) => i);

// 计算当前月份年份
const currentMonthYear = computed(() => {
  return currentDate.value.format("YYYY年 MM月");
});

// 计算当前周的日期
const weekDays = computed(() => {
  const days = [];
  const startOfWeek = currentDate.value.startOf("week").add(1, "day");

  for (let i = 0; i < 7; i++) {
    const date = startOfWeek.add(i, "day");
    days.push({
      date: date.format("YYYY-MM-DD"),
      weekday: date.format("ddd"),
      dayOfMonth: date.format("D"),
    });
  }
  return days;
});

// 导航方法
const prevWeek = () => {
  currentDate.value = currentDate.value.subtract(1, "week");
};

const nextWeek = () => {
  currentDate.value = currentDate.value.add(1, "week");
};

const goToday = () => {
  currentDate.value = dayjs();
};

// 事件相关方法
const getEventsForDay = (date) => {
  return events.value.filter((event) => {
    const eventStart = dayjs(event.start_time);
    const eventEnd = dayjs(event.end_time);
    const targetDate = dayjs(date);
    return (
      eventStart.isSame(targetDate, "day") ||
      eventEnd.isSame(targetDate, "day") ||
      (eventStart.isBefore(targetDate) && eventEnd.isAfter(targetDate))
    );
  });
};

const getEventStyle = (event) => {
  const start = dayjs(event.start_time);
  const end = dayjs(event.end_time);
  const startOfDay = start.startOf("day");

  // 计算位置和高度
  const startMinutes = start.diff(startOfDay, "minute");
  const duration = end.diff(start, "minute");

  return {
    top: `${startMinutes}px`,
    height: `${duration}px`,
    backgroundColor: event.color || "#409EFF",
    width: "90%",
    left: "5%",
  };
};

const formatEventTime = (event) => {
  return `${dayjs(event.start_time).format("HH:mm")} - ${dayjs(
    event.end_time
  ).format("HH:mm")}`;
};

const formatHour = (hour) => {
  return `${String(hour).padStart(2, "0")}:00`;
};

const isToday = (date) => {
  return dayjs(date).isSame(dayjs(), "day");
};

// 事件表单处理
const showAddEventDialog = () => {
  dialogType.value = "add";
  eventForm.value = {
    title: "",
    startTime: currentDate.value.toDate(),
    endTime: currentDate.value.add(1, "hour").toDate(),
    color: "#409EFF",
    reminder: false,
  };
  showEventDialog.value = true;
};

const handleEventClick = (event) => {
  dialogType.value = "edit";
  eventForm.value = {
    id: event.id,
    title: event.title || "",
    startTime: dayjs(event.start_time).format("YYYY-MM-DDTHH:mm:ss"),
    endTime: dayjs(event.end_time).format("YYYY-MM-DDTHH:mm:ss"),
    color: event.color || "#409EFF",
    reminder: event.reminder || false,
  };
  showEventDialog.value = true;
};

// 事件操作处理
const handleEventSubmit = async (formData) => {
  try {
    if (dialogType.value === "add") {
      await eventStore.createEvent(formData);
      ElMessage.success("创建成功");
    } else {
      await eventStore.updateEvent(formData.id, formData);
      ElMessage.success("更新成功");
    }
    showEventDialog.value = false;
    await loadEvents();
  } catch (error) {
    ElMessage.error(error.message || "操作失败");
  }
};

const handleEventDelete = async (event) => {
  try {
    await ElMessageBox.confirm("确定要删除这个事件吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 确保有完整的事件对象
    console.log("要删除的事件:", event);
    if (!event || typeof event !== "object") {
      throw new Error("无效的事件对象");
    }

    const eventId = event.id;
    if (!eventId) {
      throw new Error("无效的事件ID");
    }

    await eventStore.deleteEvent(eventId);
    await loadEvents();
    ElMessage.success("删除成功");
    showEventDialog.value = false;
  } catch (error) {
    if (error?.message === "cancel") {
      return;
    }
    console.error("删除事件失败:", error);
    ElMessage.error(error.message || "删除失败");
  }
};

// 加载事件数据
const loadEvents = async () => {
  try {
    const startOfWeek = currentDate.value.startOf("week");
    const endOfWeek = currentDate.value.endOf("week");
    const response = await eventStore.getEvents(
      startOfWeek.format("YYYY-MM-DD"),
      endOfWeek.format("YYYY-MM-DD")
    );
    events.value = response.events || [];
  } catch (error) {
    console.error("加载事件失败:", error);
    ElMessage.error("加载事件失败");
  }
};

// 监听周变化
watch(weekDays, () => {
  loadEvents();
});

// 初始化
onMounted(() => {
  loadEvents();
});

// 用户头像和初始化
const userAvatar = computed(() => authStore.user?.avatar || "");
const userInitials = computed(() => {
  const username = authStore.user?.username || "";
  return username.charAt(0).toUpperCase();
});

// 通知相关
const showNotificationDrawer = ref(false);
const notifications = computed(() => notificationStore.notifications);
const hasNotifications = computed(() => notificationStore.hasUnread);

// 显示通知抽屉
const showNotifications = async () => {
  showNotificationDrawer.value = true;
  try {
    await notificationStore.fetchNotifications();
  } catch (error) {
    ElMessage.error("获取通知失败");
  }
};

// 标记通知为已读
const markAsRead = async (id) => {
  try {
    loading.value = true;
    await notificationStore.markAsRead(id);
  } catch (error) {
    ElMessage.error("操作失败");
  } finally {
    loading.value = false;
  }
};

// 标记所有通知为已读
const markAllRead = async () => {
  try {
    loading.value = true;
    await notificationStore.markAllAsRead();
    ElMessage.success("已全部标记为已读");
  } catch (error) {
    ElMessage.error("操作失败");
  } finally {
    loading.value = false;
  }
};

// 删除通知
const deleteNotification = async (id) => {
  try {
    loading.value = true;
    await notificationStore.deleteNotification(id);
    ElMessage.success("删除成功");
  } catch (error) {
    ElMessage.error("删除失败");
  } finally {
    loading.value = false;
  }
};

// 格式化通知时间
const formatNotificationTime = (time) => {
  return dayjs(time).format("YYYY-MM-DD HH:mm");
};

// 处理下拉菜单命令
const handleCommand = async (command) => {
  switch (command) {
    case "profile":
    case "settings":
      router.push({
        path: `/${command}`,
        query: { from: "calendar" },
      });
      break;
    case "logout":
      try {
        await ElMessageBox.confirm("确定要退出登录吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        authStore.logout();
        router.push("/login");
      } catch {
        // 用户取消退出
      }
      break;
  }
};

// 在 setup 中添加
const weekGridRef = ref(null);
const timeColumnRef = ref(null);

// 添加预定义颜色
const predefineColors = [
  "#409EFF",
  "#67C23A",
  "#E6A23C",
  "#F56C6C",
  "#909399",
  "#FF85C0",
  "#36CFC9",
  "#B37FEB",
];
</script>

<style scoped>
.calendar-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
  padding-bottom: 60px; /* 为底部导航栏留出空间 */
  overflow: hidden;
}

/* 顶部导航栏样式 */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-month {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

/* 日历主体样式 */
.calendar-body {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

/* 时间列样式 */
.time-column {
  width: 60px;
  flex-shrink: 0;
  border-right: 1px solid #ebeef5;
  background: #fff;
  position: sticky;
  left: 0;
  z-index: 2;
}

.time-header {
  height: 60px;
  border-bottom: 1px solid #ebeef5;
  width: 60px;
  flex-shrink: 0;
  background: #fff;
  position: sticky;
  left: 0;
  z-index: 3;
}

.time-slot {
  height: 60px;
  text-align: center;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

/* 日期网格样式 */
.days-grid {
  min-width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.days-header {
  display: flex;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 2;
  width: 100%;
  flex-shrink: 0;
}

.empty-header {
  width: 60px;
  flex-shrink: 0;
  height: 60px;
  border-bottom: 1px solid #ebeef5;
  border-right: 1px solid #ebeef5;
  background: #fff;
}

.day-header {
  width: calc((100% - 60px) / 7);
  padding: 8px;
  text-align: center;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.weekday {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.date {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  line-height: 1;
}

.is-today {
  color: var(--el-color-primary);
}

.time-grid {
  display: flex;
  min-width: fit-content;
  width: 100%;
  height: calc(24 * 60px); /* 24小时 * 每小时高度 */
}

.day-column {
  width: calc((100% - 60px) / 7);
  position: relative;
  border-right: 1px solid #ebeef5;
}

.events-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.event {
  position: absolute;
  left: 5%;
  width: 90%;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.event:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.event-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-time {
  font-size: 11px;
  opacity: 0.9;
}

/* 添加事件按钮 */
.add-event-btn {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  z-index: 100;
}

.add-event-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.add-event-btn .el-icon {
  font-size: 24px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .time-column {
    width: 40px;
  }

  .empty-header {
    width: 40px;
  }

  .day-header {
    width: calc((100% - 40px) / 7);
    padding: 4px;
  }

  .day-column {
    width: calc((100% - 40px) / 7);
  }

  .weekday {
    font-size: 12px;
  }

  .date {
    font-size: 20px;
  }

  .calendar-body {
    overflow: auto;
  }

  .days-grid {
    min-width: 480px; /* 确保在小屏幕上有最小宽度 */
    height: calc(24 * 60px + 60px); /* 时间格子高度 + 头部高度 */
  }
}
</style>
