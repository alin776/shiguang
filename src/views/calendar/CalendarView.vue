<template>
  <div class="calendar-page no-extra-padding">
    <!-- 宇宙粒子背景 -->
    <div class="background-wrapper">
      <SpaceBackground />
    </div>

    <!-- 内容主体 -->
    <div class="calendar-content">
      <!-- 顶部切换按钮 -->
      <div class="header-switch">
        <div class="switch-button" @click="toggleView">
          <div :class="['option', { active: currentView === 'note' }]">小记</div>
          <div :class="['divider']"></div>
          <div :class="['option', { active: currentView === 'calendar' }]">记事打卡</div>
        </div>
      </div>

      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="title">
          <h2 class="page-title">{{ currentMonthYear }}</h2>
        </div>
        <div class="actions">
          <el-button class="text-button glow-button" @click="goToNewEvent">
            添加事务
          </el-button>
          <el-button
            class="text-button glow-button"
            @click="router.push('/calendar/settings')"
          >
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
          @toggle-check-in="toggleCheckIn"
          @force-check-in="forceCheckIn"
          @go-to-settings="router.push('/settings')"
          @go-to-statistics="router.push('/calendar/statistics')"
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
import axios from "axios"; // Import axios

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

// 添加视图切换功能
const currentView = ref('calendar');

// 计算属性
const currentMonthYear = computed(() => {
  return currentDate.value.format("YYYY年MM月");
});

const selectedDateDisplay = computed(() => {
  return dayjs(selectedDate.value).format("MM月DD日");
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
  // 确保 selectedDate.value 是 dayjs 对象
  const selectedDateObj = dayjs(selectedDate.value);

  return events.value
    .filter((event) => {
      const eventStart = dayjs(event.start_time);
      return (
        eventStart.format("YYYY-MM-DD") === selectedDateObj.format("YYYY-MM-DD")
      );
    })
    .sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)));
});

// 计算属性：今日已完成的打卡项目ID列表
const todayCompletedCheckIns = computed(() => {
  // 获取UTC日期（与服务器一致的日期标准）
  const now = new Date();
  const utcDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const todayISO = utcDate.toISOString().split("T")[0];

  console.log("计算todayCompletedCheckIns");
  console.log("本地当前时间:", now.toLocaleString("zh-CN"));
  console.log("使用UTC今天日期:", todayISO);
  console.log("用户打卡记录:", userCheckIns.value);

  // 只筛选出服务器认为是"今天"的打卡记录
  const completedItems = userCheckIns.value
    .filter((checkIn) => {
      // 将API返回的日期转换为ISO格式进行比较
      const checkInDate = new Date(checkIn.date);
      const checkInDateISO = checkInDate.toISOString().split("T")[0];

      // 严格匹配当天UTC日期，确保与服务器判断一致
      const isToday = checkInDateISO === todayISO;

      console.log(
        `检查打卡记录: ID:${checkIn.item_id}, 日期:${checkIn.date}, ISO日期:${checkInDateISO}`
      );
      console.log(`与今天UTC日期匹配: ${isToday}`);

      return isToday;
    })
    .map((checkIn) => parseInt(checkIn.item_id)); // 确保ID为数字类型

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
  selectedDate.value = dayjs(day.date);
  updateSelectedDayEvents();
};

const toggleCheckIn = async (item) => {
  try {
    // 创建一个新对象，避免直接修改原始项目
    const updatedItem = { ...item };

    if (!updatedItem.completed) {
      // 处理打卡
      try {
        console.log(`执行打卡操作...`);
        await checkInStore.checkIn(updatedItem.id);
        console.log(`打卡成功！`);

        // 显示成功消息
        ElMessage.success(`成功打卡: ${updatedItem.name}`);

        // 标记为最近完成，添加动画效果
        recentlyCompleted.value[updatedItem.id] = true;
        setTimeout(() => {
          recentlyCompleted.value[updatedItem.id] = false;
        }, 2000);

        // 更新项目状态和持续打卡天数
        await refreshAllCheckInData();
      } catch (error) {
        // 特殊处理已知错误
        if (
          error.isExpected ||
          (error.message && error.message.includes("已打卡"))
        ) {
          ElMessage.info("今日已打卡");
          // 无论如何都刷新最新状态，确保前端状态与后端一致
          await refreshAllCheckInData();
          return;
        }

        // 提取错误信息
        let errorMsg = "打卡失败";
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          errorMsg += `: ${error.response.data.message}`;
        } else if (error.message) {
          errorMsg += `: ${error.message}`;
        }

        ElMessage.error(errorMsg);
        console.error("打卡失败详情:", error);
      }
    } else {
      // 处理取消打卡
      try {
        console.log(`执行取消打卡操作...`);
        await checkInStore.cancelCheckIn(updatedItem.id);
        console.log(`取消打卡成功！`);

        // 更新项目状态和持续打卡天数
        await refreshAllCheckInData();
        ElMessage.success(`已取消打卡: ${updatedItem.name}`);
      } catch (error) {
        // 提取错误信息
        let errorMsg = "取消打卡失败";
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          errorMsg += `: ${error.response.data.message}`;
        } else if (error.message) {
          errorMsg += `: ${error.message}`;
        }

        console.error("取消打卡失败详情:", error);
        ElMessage.error(errorMsg);
      }
    }
  } catch (error) {
    // 通用错误处理
    console.error(`打卡操作失败:`, error);
    ElMessage.error(`操作失败，请稍后重试`);
  }
};

// 强制执行打卡（绕过某些前端检查，直接向服务器发送请求）
const forceCheckIn = async (item) => {
  try {
    // 使用当前日期，确保考虑本地时区
    const now = new Date();
    // 格式化为YYYY-MM-DD格式
    const formattedDate = formatLocalDate(now);

    console.log(`当前时间: ${now.toLocaleString("zh-CN")}`);
    console.log(`使用当天日期(本地时区): ${formattedDate}`);

    // 直接向服务器发送API请求，绕过store的checkIn方法
    // 后台API可能会拒绝重复打卡，但至少尝试发送请求
    try {
      const API_BASE_URL = "http://47.98.210.7:3000";
      const response = await axios.post(
        `${API_BASE_URL}/api/checkins`,
        {
          itemId: parseInt(item.id),
          date: formattedDate,
        },
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );

      console.log("强制打卡成功:", response.data);
      ElMessage.success(`成功打卡: ${item.name}`);

      // 刷新数据
      await refreshCheckInData();
    } catch (error) {
      console.error("强制打卡失败:", error);

      // 即使失败也尝试刷新数据
      await refreshCheckInData();

      // 根据错误类型提供不同的反馈
      if (error.response && error.response.data) {
        ElMessage.error(
          `打卡失败: ${error.response.data.message || "未知错误"}`
        );
      } else {
        ElMessage.error("打卡失败，请稍后再试");
      }
    }
  } catch (e) {
    console.error("强制打卡过程中出错:", e);
    ElMessage.error("操作失败，请稍后重试");
  }
};

// 格式化日期为YYYY-MM-DD，考虑本地时区
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 刷新所有打卡相关数据
const refreshAllCheckInData = async () => {
  try {
    console.log("刷新所有打卡数据...");

    // 获取当前年月
    const year = currentDate.value.year();
    const month = currentDate.value.month() + 1; // dayjs month is 0-based

    // 1. 强制刷新整个月用户打卡记录
    userCheckIns.value = await checkInStore.getUserCheckIns(year, month);
    console.log("刷新后的整月用户打卡记录:", userCheckIns.value);

    // 2. 强制刷新今日打卡状态
    const todayCheckInsData = await checkInStore.getTodayCheckIns();
    console.log("刷新后的今日打卡记录:", todayCheckInsData);

    // 3. 重新加载打卡项目
    await loadCheckInItems();
    console.log("刷新后的打卡项目状态:", checkInItems.value);
  } catch (error) {
    console.error("刷新打卡数据失败:", error);
    throw new Error(`刷新数据失败: ${error.message}`);
  }
};

// 显示打卡成功通知
const showCheckInSuccessNotification = (itemName, streak) => {
  const message =
    streak > 1
      ? `恭喜！您已连续打卡 ${streak} 天: ${itemName}`
      : `打卡成功: ${itemName}`;

  ElMessage.success({
    message,
    duration: 3000,
  });
};

// 导航方法
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
    console.log("== 开始加载打卡项目 ==");

    // 记录当前时间供调试
    const now = new Date();
    // 使用UTC日期与服务器保持一致
    const utcDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const todayISO = utcDate.toISOString().split("T")[0];

    console.log(`当前本地时间: ${now.toLocaleString("zh-CN")}`);
    console.log(`使用UTC今天日期: ${todayISO}`);

    // 获取打卡项目列表
    const data = await checkInStore.getCheckInItems();
    console.log("获取到的打卡项目列表:", data);

    // 获取连续打卡天数数据
    const streakData = await checkInStore.getStreakData();
    console.log("获取到的连续打卡天数数据:", streakData);

    const streakMap = {};
    if (streakData && Array.isArray(streakData)) {
      streakData.forEach((item) => {
        streakMap[item.item_id] = item.streak;
      });
    }
    console.log("连续打卡天数映射:", streakMap);

    // 强制刷新今日打卡状态（直接从API获取最新数据）
    console.log("强制从API刷新今日打卡状态");
    const todayCheckIns = await checkInStore.getTodayCheckIns();
    console.log("从API获取到的今日打卡记录:", todayCheckIns);

    // 从API直接获取今天打卡的项目ID
    const todayCompletedIds = todayCheckIns.map((checkIn) =>
      parseInt(checkIn.item_id)
    );
    console.log("今日已完成打卡项目ID:", todayCompletedIds);

    // 处理并检查每个打卡项目的completed状态，只关注今天的打卡
    checkInItems.value = data.map((item) => {
      // 使用严格类型转换确保比较正确，将字符串ID转换为数字进行比较
      const intItemId = parseInt(item.id);
      const isCompleted = todayCompletedIds.includes(intItemId);

      console.log(
        `项目 ${item.name} (ID: ${item.id}/${intItemId}) 完成状态: ${
          isCompleted ? "已完成" : "未完成"
        }, 在今日完成列表中: ${todayCompletedIds.includes(intItemId)}`
      );

      return {
        ...item,
        completed: isCompleted,
        streak: streakMap[item.id] || 0,
      };
    });

    console.log("最终处理后的打卡项目状态:", checkInItems.value);
    console.log("== 加载打卡项目完成 ==");
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
  // 确保 selectedDate 是 dayjs 对象
  const selectedDateObj = dayjs(selectedDate.value);
  const selectedDayStr = selectedDateObj.format("YYYY-MM-DD");

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

// 切换视图函数
const toggleView = () => {
  if (currentView.value === 'calendar') {
    router.push('/note');
  } else {
    currentView.value = 'calendar';
  }
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
/* 日历页面根容器 */
.calendar-page {
  min-height: 100vh;
  padding-bottom: 70px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f7ff, #e6f2ff);
  padding-top: 0; /* 无需额外顶部内边距 */
}

.background-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

/* 内容区域容器 */
.calendar-content {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 5;
  background-color: rgba(255, 255, 255, 0.98);
  padding-top: 10px; /* 固定顶部间距 */
}

/* 顶部切换按钮 */
.header-switch {
  margin-top: 10px; /* 增加更多顶部间距 */
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 15px;
  margin-top: 15px; /* 增加顶部间距 */
}

.title {
  display: flex;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #333;
  text-shadow: none;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #333, #555);
  border-radius: 2px;
}

.actions {
  display: flex;
  gap: 14px;
}

.mobile-button {
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-button {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
}

.glow-button {
  background: rgba(51, 51, 51, 0.08);
  border: 1px solid rgba(51, 51, 51, 0.15);
  color: #333;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.glow-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.7s ease;
}

.glow-button:hover {
  background: rgba(51, 51, 51, 0.12);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.glow-button:hover::before {
  left: 100%;
}

.glow-button:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.98);
  border-radius: 0;
  padding: 10px 0;
  box-shadow: none;
  border: none;
  max-height: none;
  height: auto;
  overflow: visible;
}

.tech-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media screen and (min-width: 768px) {
  .tech-row {
    flex-direction: row;
  }
  
  .toolbar {
    padding: 20px 24px;
    margin-bottom: 10px;
  }
}

@media screen and (max-width: 480px) {
  .page-title {
    font-size: 1.2rem;
  }
  
  .text-button {
    padding: 5px 10px;
    font-size: 12px;
  }
  
  .toolbar {
    padding: 10px 12px;
  }
  
  .actions {
    gap: 6px;
  }
}

@media screen and (max-width: 360px) {
  .page-title {
    font-size: 1rem;
  }
  
  .text-button {
    padding: 4px 8px;
    font-size: 11px;
  }
}

/* 顶部切换按钮样式 */
.header-switch {
  display: flex;
  justify-content: center;
  padding: 5px 0;
  margin-top: 0;
}

.switch-button {
  display: flex;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 3px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(236, 240, 241, 0.9);
  overflow: hidden;
}

.option {
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  color: #7f8c8d;
  transition: all 0.3s ease;
  border-radius: 18px;
  white-space: nowrap;
}

.option.active {
  background-color: #2c3e50;
  color: white;
  font-weight: 500;
}

.divider {
  width: 1px;
  background-color: #e0e0e0;
  margin: 8px 0;
}

/* 头部工具栏 */
.calendar-header {
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  padding-top: 0; /* 移除顶部内边距 */
}
</style>