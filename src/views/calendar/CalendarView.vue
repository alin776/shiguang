<template>
  <div class="calendar-page no-extra-padding">
    <!-- 宇宙粒子背景 -->
    <SpaceBackground />

    <!-- 内容主体 -->
    <div class="calendar-content">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="title">
          <h2 class="page-title">{{ currentMonthYear }}</h2>
        </div>
        <div class="actions">
          <el-button class="text-button glow-button" @click="goToNewEvent">
            添加事务
          </el-button>
          <el-button class="text-button glow-button" @click="goToSettings">
            添加打卡
          </el-button>
        </div>
      </div>

      <!-- 月历视图 -->
      <CalendarGrid
        :calendar-days="calendarDays"
        :current-month-year="currentMonthYear"
        :check-in-colors="checkInColors"
        @prev-month="prevMonth"
        @next-month="nextMonth"
        @select-day="selectDay"
      />

      <!-- 内容区域 -->
      <div class="content-area tech-row">
        <!-- 左侧打卡区域 -->
        <CheckInList
          :check-in-items="checkInItems"
          :recently-completed="recentlyCompleted"
          :check-in-colors="checkInColors"
          @toggle-checkin="toggleCheckIn"
          @go-to-settings="goToSettings"
        />

        <!-- 右侧事件区域 -->
        <EventsList
          :events="selectedDayEvents"
          :selected-date-display="selectedDateDisplay"
          @add-event="goToNewEvent"
          @edit-event="goToEditEvent"
        />
      </div>
    </div>

    <!-- 底部导航 -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { Plus, Setting } from "@element-plus/icons-vue";
import BottomNavBar from "../../components/BottomNavBar.vue";
import { useEventStore } from "../../stores/event";
import { useSettingsStore } from "../../stores/settings";
import { useAuthStore } from "../../stores/auth";
import { useCheckInStore } from "../../stores/checkIn";

// 导入组件
import SpaceBackground from "./components/SpaceBackground.vue";
import CalendarGrid from "./components/CalendarGrid.vue";
import CheckInList from "./components/CheckInList.vue";
import EventsList from "./components/EventsList.vue";

// 状态变量
const router = useRouter();
const eventStore = useEventStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const checkInStore = useCheckInStore();

// 日历状态变量
const currentDate = ref(dayjs());
const selectedDate = ref(dayjs());
const events = ref([]);
const checkInItems = ref([]);
const userCheckIns = ref([]);

// 打卡颜色映射
const checkInColors = {
  exercise: "#FF5252",
  reading: "#4CAF50",
  meditation: "#2196F3",
  writing: "#FFC107",
  default: "#9C27B0",
};

// 添加一个状态用于触发动画
const recentlyCompleted = ref({});

// 计算属性
const currentMonthYear = computed(() => {
  return currentDate.value.format("YYYY年MM月");
});

const selectedDateDisplay = computed(() => {
  return selectedDate.value.format("MM月DD日");
});

// 生成日历网格数据
const calendarDays = computed(() => {
  const days = [];
  const firstDayOfMonth = currentDate.value.startOf("month");
  const lastDayOfMonth = currentDate.value.endOf("month");

  // 获取日历的起始日期（上个月的日期）
  let startDate =
    firstDayOfMonth.day() === 0
      ? firstDayOfMonth.subtract(6, "day")
      : firstDayOfMonth.subtract(firstDayOfMonth.day() - 1, "day");

  // 生成6周的日历数据
  for (let i = 0; i < 42; i++) {
    const date = startDate.add(i, "day");
    const isCurrentMonth = date.month() === currentDate.value.month();
    const isToday = date.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
    const dateStr = date.format("YYYY-MM-DD");

    // 检查这一天是否有事件
    const hasEvents = events.value.some((event) => {
      const eventStart = dayjs(event.start_time);
      return dateStr === eventStart.format("YYYY-MM-DD");
    });

    // 检查这一天是否有打卡
    const dateCheckIns = userCheckIns.value
      .filter((checkIn) => {
        // 处理时区问题：将UTC日期转换为本地日期进行比较
        const checkInLocalDate = dayjs(checkIn.date).format("YYYY-MM-DD");
        return checkInLocalDate === dateStr;
      })
      .map((checkIn) => {
        // 查找对应的打卡项，获取其类型和颜色
        const checkInItem = checkInItems.value.find(
          (item) => item.id === checkIn.item_id
        );
        const itemType = checkInItem?.type || "default";
        const itemColor =
          checkInItem?.color ||
          checkInColors[itemType] ||
          checkInColors.default;

        return {
          ...checkIn,
          color: itemColor,
        };
      });
    const hasCheckins = dateCheckIns.length > 0;

    days.push({
      date: dateStr,
      dayNumber: date.date(),
      isCurrentMonth,
      isToday,
      hasEvents,
      hasCheckins,
      checkIns: dateCheckIns,
    });
  }

  return days;
});

// 选中日期的事件
const selectedDayEvents = computed(() => {
  return events.value
    .filter((event) => {
      const eventStart = dayjs(event.start_time);
      return (
        eventStart.format("YYYY-MM-DD") ===
        selectedDate.value.format("YYYY-MM-DD")
      );
    })
    .sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)));
});

// 当天已完成的打卡项目
const todayCompletedCheckIns = computed(() => {
  // 获取本地今天日期
  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

  console.log(
    "计算todayCompletedCheckIns - 本地今天:",
    today,
    "昨天:",
    yesterday
  );
  console.log("计算todayCompletedCheckIns - 用户打卡记录:", userCheckIns.value);

  const completedItems = userCheckIns.value
    .filter((checkIn) => {
      // 转换API返回的日期格式为本地日期
      const checkInLocalDate = dayjs(checkIn.date).format("YYYY-MM-DD");

      // 检查是否是昨天晚上但对应UTC已经是今天
      const isYesterday = checkInLocalDate === yesterday;
      const checkInDate = new Date(checkIn.date);
      const utcHours = checkInDate.getUTCHours();
      const isYesterdayButUtcToday = isYesterday && utcHours >= 16; // UTC时间晚上8点后

      const isToday = checkInLocalDate === today;

      console.log(`检查打卡: ID:${checkIn.item_id}, 日期:${checkIn.date}`);
      console.log(`  本地日期:${checkInLocalDate}, UTC小时:${utcHours}`);
      console.log(
        `  是今天:${isToday}, 是昨天但UTC今天:${isYesterdayButUtcToday}`
      );

      return isToday || isYesterdayButUtcToday;
    })
    .map((checkIn) => {
      console.log(
        `已完成的打卡项目 ID: ${
          checkIn.item_id
        }, 类型: ${typeof checkIn.item_id}`
      );
      return checkIn.item_id;
    });

  console.log("今日已完成打卡项目ID列表:", completedItems);
  return completedItems;
});

// 方法
const prevMonth = () => {
  currentDate.value = currentDate.value.subtract(1, "month");
  loadUserCheckIns();
};

const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, "month");
  loadUserCheckIns();
};

const selectDay = (day) => {
  selectedDate.value = day.date;
  updateSelectedDayEvents();
};

const toggleCheckIn = async (item) => {
  try {
    const isCompleted = todayCompletedCheckIns.value.includes(item.id);
    console.log(
      `尝试${isCompleted ? "取消" : "完成"}打卡: ${item.name} (ID: ${item.id})`
    );

    if (isCompleted) {
      // 取消打卡
      await checkInStore.cancelCheckIn(item.id);
      ElMessage.info(`已取消${item.name}打卡`);
    } else {
      // 新增打卡
      await checkInStore.checkIn(item.id);
      ElMessage.success(`恭喜完成${item.name}，已连续${item.streak || 1}天！`);

      // 记录最近完成的打卡项，触发动画效果
      recentlyCompleted.value[item.id] = true;
      setTimeout(() => {
        recentlyCompleted.value[item.id] = false;
      }, 2000); // 增加动画持续时间
    }

    // 重新加载打卡数据
    console.log("打卡操作已完成，重新加载数据...");
    await loadUserCheckIns();

    // 额外调用getTodayCheckIns确保最新状态
    const latestTodayCheckIns = await checkInStore.getTodayCheckIns();
    console.log("打卡后最新的今日打卡状态:", latestTodayCheckIns);

    // 强制重新计算todayCompletedCheckIns
    const today = dayjs().format("YYYY-MM-DD");
    const completedIds = latestTodayCheckIns
      .filter((checkIn) => {
        // 转换API日期为YYYY-MM-DD格式
        const checkInDate = dayjs(checkIn.date).format("YYYY-MM-DD");
        return checkInDate === today;
      })
      .map((checkIn) => checkIn.item_id);

    console.log("打卡后更新的已完成ID:", completedIds);
  } catch (error) {
    // 如果是预期的错误（如"今日已打卡"），显示友好提示
    if (error.isExpected || error.response?.data?.message === "今日已打卡") {
      ElMessage.info(`今天你已经打卡过啦！`);
    } else {
      ElMessage.error(`操作失败: ${error.message || "未知错误"}`);
    }
  }
};

// 导航方法
const goToSettings = () => {
  router.push("/calendar/settings");
};

const goToNewEvent = () => {
  const date = selectedDate.value.format("YYYY-MM-DD");
  router.push({
    path: "/calendar/event/new",
    query: { date },
  });
};

const goToEditEvent = (eventId) => {
  router.push(`/calendar/event/${eventId}`);
};

// 加载事件数据
const loadEvents = async () => {
  try {
    // 计算月份的开始和结束日期
    const startDate = currentDate.value.startOf("month").format("YYYY-MM-DD");
    const endDate = currentDate.value.endOf("month").format("YYYY-MM-DD");

    console.log("正在加载事件，日期范围:", startDate, "至", endDate);

    // 调用store方法获取事件
    const data = await eventStore.getEvents(startDate, endDate);

    // 即使API返回错误，getEvents也会返回{events:[]}
    events.value = Array.isArray(data.events) ? data.events : [];
    console.log(`成功加载了${events.value.length}个事件`);

    // 更新当前选中日的事件
    updateSelectedDayEvents();
  } catch (error) {
    console.error("加载事件失败:", error);
    // 设置为空数组，防止界面错误
    events.value = [];
    // 显示友好错误提示
    ElMessage.error("加载事件失败，请稍后再试");
  }
};

// 加载打卡项目
const loadCheckInItems = async () => {
  try {
    const data = await checkInStore.getCheckInItems();

    // 获取连续打卡天数数据
    const streakData = await checkInStore.getStreakData();
    const streakMap = {};
    if (streakData && Array.isArray(streakData)) {
      streakData.forEach((item) => {
        streakMap[item.item_id] = item.streak;
      });
    }

    // 直接获取今天的打卡数据（这个可能是空的，因为时区问题）
    const todayCheckIns = await checkInStore.getTodayCheckIns();
    console.log("loadCheckInItems - 今日打卡记录:", todayCheckIns);

    // 获取所有用户打卡记录
    const year = dayjs().year();
    const month = dayjs().month() + 1;
    const userCheckInsData = await checkInStore.getUserCheckIns(year, month);
    console.log("所有用户打卡记录:", userCheckInsData);

    // 处理时区问题：将UTC日期转换为本地日期进行比较
    // 这里我们获取带有东八区偏移的"今天"日期
    const today = dayjs().format("YYYY-MM-DD"); // 本地时间今天
    const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD"); // 昨天
    console.log("本地时间 - 今天:", today, "昨天:", yesterday);

    // 查找今天和昨天的打卡记录（考虑时区问题）
    const todayAndYesterdayCheckIns = userCheckInsData.filter((checkIn) => {
      const checkInLocalDate = dayjs(checkIn.date).format("YYYY-MM-DD");
      const isToday = checkInLocalDate === today;
      const isYesterday = checkInLocalDate === yesterday;

      // 检查是否是昨天但是UTC时间已经是今天
      const checkInUtcDate = new Date(checkIn.date);
      const checkInUtcDateStr = checkInUtcDate.toISOString().split("T")[0];
      const isYesterdayButUtcToday =
        isYesterday && checkInUtcDate.getUTCHours() >= 16; // 如果UTC时间已经是第二天

      console.log(`检查打卡: ID ${checkIn.item_id}, 日期 ${checkIn.date}`);
      console.log(
        `  本地日期: ${checkInLocalDate}, 是今天: ${isToday}, 是昨天: ${isYesterday}`
      );
      console.log(
        `  UTC日期: ${checkInUtcDateStr}, 小时: ${checkInUtcDate.getUTCHours()}`
      );

      // 返回今天的打卡或者因为时区问题实际上是今天的打卡
      return isToday || isYesterdayButUtcToday;
    });

    console.log("考虑时区后的今日打卡记录:", todayAndYesterdayCheckIns);

    // 获取实际今天的打卡项目ID列表
    const actualTodayCompletedIds = todayAndYesterdayCheckIns.map(
      (checkIn) => checkIn.item_id
    );
    console.log("考虑时区后的今日已完成打卡项目ID:", actualTodayCompletedIds);

    // 处理并检查每个打卡项目的completed状态
    checkInItems.value = data.map((item) => {
      // 使用考虑时区的判断逻辑
      const isCompleted = actualTodayCompletedIds.some(
        (id) => String(id) === String(item.id)
      );

      console.log(
        `项目 ${item.name} (ID: ${item.id}) 完成状态: ${
          isCompleted ? "已完成" : "未完成"
        }`
      );

      return {
        ...item,
        completed: isCompleted,
        streak: streakMap[item.id] || 0,
      };
    });

    console.log("最终处理后的打卡项目:", checkInItems.value);
  } catch (error) {
    console.error("加载打卡项目失败:", error);
    ElMessage.error("加载打卡项目失败");
  }
};

// 加载用户打卡记录
const loadUserCheckIns = async () => {
  try {
    const year = currentDate.value.year();
    const month = currentDate.value.month() + 1; // dayjs month is 0-based
    const data = await checkInStore.getUserCheckIns(year, month);
    userCheckIns.value = data;

    // 直接从API获取今天的打卡记录
    const todayData = await checkInStore.getTodayCheckIns();
    console.log("loadUserCheckIns - 直接获取的今日打卡:", todayData);

    // 添加调试信息，输出已完成的打卡记录
    console.log("用户打卡记录:", userCheckIns.value);
    console.log("今日已完成打卡项目ID:", todayCompletedCheckIns.value);
    console.log("打卡项目列表:", checkInItems.value);

    // 输出每个打卡项目的completed状态
    console.log(
      "打卡项目完成状态:",
      checkInItems.value.map((item) => ({
        id: item.id,
        name: item.name,
        completed: todayCompletedCheckIns.value.includes(item.id),
      }))
    );

    // 重新加载打卡项目以更新状态
    await loadCheckInItems();
  } catch (error) {
    console.error("加载打卡记录失败:", error);
    ElMessage.error("加载打卡记录失败");
  }
};

// 更新选中日的事件列表
const updateSelectedDayEvents = () => {
  const selectedDayStr = selectedDate.value.format("YYYY-MM-DD");

  // 确保events.value是数组
  if (!Array.isArray(events.value)) {
    selectedDayEvents.value = [];
    return;
  }

  // 过滤出选中日期的事件
  selectedDayEvents.value = events.value.filter((event) => {
    // 防止无效日期格式导致的错误
    try {
      // 处理API返回的不同日期格式
      const eventStartDate = event.start_time
        ? dayjs(event.start_time).format("YYYY-MM-DD")
        : event.startTime
        ? dayjs(event.startTime).format("YYYY-MM-DD")
        : null;

      return eventStartDate === selectedDayStr;
    } catch (error) {
      console.error("事件日期解析错误:", error, event);
      return false;
    }
  });

  console.log(`${selectedDayStr}有${selectedDayEvents.value.length}个事件`);
};

// 生命周期钩子
onMounted(() => {
  loadEvents();
  loadCheckInItems();
  loadUserCheckIns();

  // 在组件挂载后添加延迟调试，确保数据已加载
  setTimeout(() => {
    console.log("=== 组件挂载后的打卡状态检查 ===");
    console.log("用户打卡记录:", userCheckIns.value);
    console.log("今日已完成打卡项目ID:", todayCompletedCheckIns.value);
    console.log("打卡项目列表:", checkInItems.value);
    console.log(
      "每个打卡项目的完成状态:",
      checkInItems.value.map((item) => ({
        id: item.id,
        name: item.name,
        completed: todayCompletedCheckIns.value.includes(item.id),
      }))
    );
  }, 1000);
});

// 监听月份变化，重新加载事件
watch(
  () => currentDate.value,
  async () => {
    await loadEvents();
  }
);
</script>

<style scoped>
.calendar-page {
  min-height: 100vh;
  color: var(--text-color);
  padding-bottom: 60px;
  overflow-x: hidden; /* 防止水平滚动 */
  padding: 0 16px; /* 添加左右内边距 */
}

.calendar-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 5;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  position: relative;
  z-index: 5;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
}

.actions {
  display: flex;
  gap: 8px;
}

.mobile-button {
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  margin-left: 8px;
}

.glow-button {
  background: rgba(147, 51, 234, 0.1);
  border: 1px solid rgba(147, 51, 234, 0.3);
  color: white;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.glow-button::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at center,
    rgba(147, 51, 234, 0.5) 0%,
    transparent 60%
  );
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.5s ease;
}

.glow-button:hover::before {
  opacity: 0.3;
  transform: scale(1);
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media screen and (min-width: 768px) {
  .content-area {
    flex-direction: row;
  }

  .check-in-area,
  .events-area {
    flex: 1;
  }
}

.tech-row {
  display: flex;
  flex-direction: column;
}

@media screen and (min-width: 768px) {
  .tech-row {
    flex-direction: row;
    gap: 16px;
  }
}
</style>
