<template>
  <div class="calendar-page">
    <!-- 宇宙粒子背景 -->
    <div class="space-bg">
      <div class="space-particles"></div>
      <div class="space-stars"></div>
      <div class="floating-particles"></div>
    </div>

    <!-- 内容主体 -->
    <div class="calendar-content">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="title">
          <h2 class="page-title">{{ currentMonthYear }}</h2>
        </div>
        <div class="actions">
          <el-button
            class="mobile-button glow-button"
            @click="showAddEventDialog"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button class="mobile-button glow-button" @click="showSettings">
            <el-icon><Setting /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 月历视图 -->
      <div class="calendar-wrapper mobile-card gradient-border">
        <div class="month-nav">
          <el-button class="nav-button" @click="prevMonth">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="month-label">{{ currentMonthYear }}</span>
          <el-button class="nav-button" @click="nextMonth">
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
              @click="selectDay(day)"
            >
              <div class="day-number">{{ day.dayNumber }}</div>
              <div
                class="day-indicators"
                v-if="day.hasEvents || day.hasCheckins"
              >
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

      <!-- 内容区域 -->
      <div class="content-area tech-row">
        <!-- 左侧打卡区域 -->
        <div class="mobile-card gradient-border check-in-area">
          <h3 class="section-title">
            <span class="section-icon"
              ><el-icon><Calendar /></el-icon
            ></span>
            每日打卡
          </h3>
          <div class="check-in-list">
            <div
              v-for="item in checkInItems"
              :key="item.id"
              class="check-in-item"
              :data-item-id="item.id"
              :class="{
                'item-completed': item.completed,
                'item-pending': !item.completed,
                'animate-pulse': recentlyCompleted[item.id],
              }"
              :style="{
                '--completion-color': item.color || checkInColors.default,
                '--completion-color-rgb': hexToRgb(
                  item.color || checkInColors.default
                ),
              }"
              @click="toggleCheckIn(item)"
            >
              <div class="check-in-info">
                <div class="check-in-name">
                  <span
                    class="status-indicator"
                    :class="{ active: item.completed }"
                  ></span>
                  {{ item.name }}
                </div>
                <div class="check-in-streak">
                  连续 {{ item.streak || 0 }} 天
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧事件区域 -->
        <div class="mobile-card gradient-border events-area">
          <h3 class="section-title">
            <span class="section-icon"
              ><el-icon><Plus /></el-icon
            ></span>
            {{ selectedDateDisplay }} 的事务
          </h3>
          <div v-if="selectedDayEvents.length > 0" class="events-list">
            <div
              v-for="event in selectedDayEvents"
              :key="event.id"
              class="event-item"
              :style="{ borderLeftColor: event.color }"
              @click="handleEventClick(event)"
            >
              <div class="event-time">{{ formatEventTime(event) }}</div>
              <div class="event-title">{{ event.title }}</div>
            </div>
          </div>
          <div v-else class="no-events">
            <p>今天暂无事务安排</p>
            <el-button class="mobile-button primary" @click="showAddEventDialog"
              >添加事务</el-button
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 事件对话框 -->
    <el-dialog
      v-model="showEventDialog"
      :title="dialogType === 'add' ? '添加事件' : '编辑事件'"
      width="90%"
      :close-on-click-modal="false"
      class="custom-dialog"
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

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettingsDialog"
      title="设置"
      width="90%"
      class="custom-dialog"
    >
      <div class="settings-content">
        <h4>打卡项目设置</h4>
        <div class="checkin-settings">
          <div
            v-for="item in availableCheckIns"
            :key="item.id"
            class="checkin-setting-item"
          >
            <el-checkbox v-model="item.enabled">{{ item.name }}</el-checkbox>
            <div class="setting-actions">
              <div
                class="color-dot"
                :style="{
                  backgroundColor: item.color || checkInColors.default,
                }"
                @click="openColorPicker(item)"
              ></div>
              <el-button
                type="danger"
                size="small"
                circle
                @click.stop="confirmDeleteCheckIn(item)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="add-checkin">
            <el-input v-model="newCheckInName" placeholder="新打卡项目名称" />
            <div class="color-select">
              <div
                class="color-dot"
                :style="{ backgroundColor: newCheckInColor }"
                @click="openNewColorPicker"
              ></div>
            </div>
            <el-button @click="addNewCheckIn">添加</el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showSettingsDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 底部导航 -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from "vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Setting,
  Check,
  Calendar,
  Delete,
} from "@element-plus/icons-vue";
import BottomNavBar from "../components/BottomNavBar.vue";
import EventForm from "../components/EventForm.vue";
import { useEventStore } from "../stores/event";
import { useSettingsStore } from "../stores/settings";
import { useAuthStore } from "../stores/auth";
import { useCheckInStore } from "../stores/checkIn";
import axios from "axios";

const router = useRouter();
const eventStore = useEventStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const checkInStore = useCheckInStore();

// 状态变量
const currentDate = ref(dayjs());
const selectedDate = ref(dayjs());
const showEventDialog = ref(false);
const showSettingsDialog = ref(false);
const dialogType = ref("add");
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

// 设置相关状态
const availableCheckIns = ref([]);
const newCheckInName = ref("");
const newCheckInColor = ref("#409EFF");

// 事件表单
const eventForm = ref({
  title: "",
  startTime: "",
  endTime: "",
  color: "#409EFF",
  reminder: false,
});
const eventFormRef = ref(null);

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
    const dateCheckIns = userCheckIns.value.filter(
      (checkIn) => checkIn.date === dateStr
    );
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
    .sort((a, b) => {
      return dayjs(a.start_time).diff(dayjs(b.start_time));
    });
});

// 当天已完成的打卡项目
const todayCompletedCheckIns = computed(() => {
  const today = dayjs().format("YYYY-MM-DD");
  return userCheckIns.value
    .filter((checkIn) => checkIn.date === today)
    .map((checkIn) => checkIn.itemId);
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
};

const toggleCheckIn = async (item) => {
  try {
    const isCompleted = todayCompletedCheckIns.value.includes(item.id);

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
    await loadUserCheckIns();
  } catch (error) {
    // 如果是预期的错误（如"今日已打卡"），显示友好提示
    if (error.isExpected || error.response?.data?.message === "今日已打卡") {
      ElMessage.info(`今天你已经打卡过啦！`);
    } else {
      ElMessage.error(`操作失败: ${error.message || "未知错误"}`);
    }
  }
};

// 加载事件数据
const loadEvents = async () => {
  try {
    const startDate = currentDate.value.startOf("month").format("YYYY-MM-DD");
    const endDate = currentDate.value.endOf("month").format("YYYY-MM-DD");

    const data = await eventStore.getEvents(startDate, endDate);
    events.value = data.events || [];
  } catch (error) {
    console.error("加载事件失败:", error);
    ElMessage.error("加载事件失败");
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

    checkInItems.value = data.map((item) => ({
      ...item,
      completed: todayCompletedCheckIns.value.includes(item.id),
      streak: streakMap[item.id] || 0,
    }));
    availableCheckIns.value = data;

    // 更新每个项目的RGB颜色
    try {
      for (const item of checkInItems.value) {
        const color = item.color || checkInColors.default;
        item.colorRgb = hexToRgb(color);
      }

      // 强制刷新所有打卡项的样式
      nextTick(() => {
        document.querySelectorAll(".check-in-item").forEach((el) => {
          // 强制重新应用样式
          const itemId = el.getAttribute("data-item-id");
          if (!itemId) return;

          const item = checkInItems.value.find(
            (i) => i.id.toString() === itemId
          );
          if (!item) return;

          // 临时移除和重新添加completed类以触发重新应用样式
          if (item.completed) {
            el.classList.remove("completed");
            // 触发回流
            void el.offsetWidth;
            el.classList.add("completed");

            // 确保RGB颜色变量正确设置
            const rgbColor = hexToRgb(item.color || checkInColors.default);
            el.style.setProperty("--completion-color-rgb", rgbColor);
          }
        });

        console.log("已刷新打卡项目样式");
      });
    } catch (e) {
      console.error("颜色转换错误:", e);
    }
  } catch (error) {
    console.error("加载打卡项目失败:", error);
    ElMessage.error("加载打卡项目失败，请刷新页面重试");
  }
};

// 添加十六进制转RGB的辅助函数
const hexToRgb = (hex) => {
  // 移除#号
  hex = hex.replace("#", "");

  // 将短格式转换为标准格式
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // 解析RGB值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `${r}, ${g}, ${b}`;
};

// 加载用户打卡记录
const loadUserCheckIns = async () => {
  try {
    const year = currentDate.value.year();
    const month = currentDate.value.month() + 1;
    const data = await checkInStore.getUserCheckIns(year, month);
    userCheckIns.value = data;

    // 更新打卡项目的完成状态
    if (checkInItems.value.length > 0) {
      checkInItems.value = checkInItems.value.map((item) => ({
        ...item,
        completed: todayCompletedCheckIns.value.includes(item.id),
      }));
    }
  } catch (error) {
    console.error("加载用户打卡记录失败:", error);
  }
};

const showAddEventDialog = () => {
  dialogType.value = "add";
  eventForm.value = {
    title: "",
    startTime: selectedDate.value
      .hour(9)
      .minute(0)
      .format("YYYY-MM-DDTHH:mm:ss"),
    endTime: selectedDate.value
      .hour(10)
      .minute(0)
      .format("YYYY-MM-DDTHH:mm:ss"),
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

const formatEventTime = (event) => {
  return `${dayjs(event.start_time).format("HH:mm")} - ${dayjs(
    event.end_time
  ).format("HH:mm")}`;
};

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

const handleEventDelete = async (eventId) => {
  try {
    await ElMessageBox.confirm("确定要删除这个事件吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await eventStore.deleteEvent(eventId);
    ElMessage.success("删除成功");
    showEventDialog.value = false;
    await loadEvents();
  } catch (error) {
    if (error === "cancel") return;
    ElMessage.error(error.message || "删除失败");
  }
};

// 设置相关方法
const showSettings = () => {
  showSettingsDialog.value = true;
};

const addNewCheckIn = async () => {
  if (!newCheckInName.value.trim()) {
    return;
  }

  try {
    await checkInStore.createCheckInItem(
      newCheckInName.value,
      newCheckInColor.value || "#409EFF" // 使用选择的颜色或默认蓝色
    );
    ElMessage.success("添加成功");
    await loadCheckInItems();
    newCheckInName.value = "";
    // 重置颜色
    newCheckInColor.value = "#409EFF";
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

const saveSettings = async () => {
  try {
    // 保存每个打卡项目的设置
    for (const item of availableCheckIns.value) {
      await checkInStore.updateCheckInItem(item.id, {
        name: item.name,
        color: item.color,
        enabled: item.enabled,
      });
    }

    ElMessage.success("设置已保存");
    showSettingsDialog.value = false;

    // 重新加载数据
    await loadCheckInItems();
    await loadUserCheckIns();
  } catch (error) {
    ElMessage.error("保存设置失败");
  }
};

// 删除打卡项目
const confirmDeleteCheckIn = (item) => {
  ElMessageBox.confirm(
    `确定要删除${item.name}"吗？该操作不可恢复，所有打卡记录也将被删除。`,
    "删除确认",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(async () => {
      try {
        // 使用直接的axios调用替代 store 方法
        const response = await axios.delete(
          `http://47.98.210.7:3000/api/checkins/items/${item.id}`,
          {
            headers: {
              Authorization: `Bearer ${useAuthStore().token}`,
            },
          }
        );
        console.log("删除响应:", response.data);
        ElMessage.success("删除成功");
        // 刷新打卡项目列表
        await loadCheckInItems();
      } catch (error) {
        console.error("删除失败，完整错误:", error);
        ElMessage.error(`删除失败: ${error.message || "未知错误"}`);
      }
    })
    .catch(() => {
      // 用户取消删除
    });
};

// 打开颜色选择框
const openColorPicker = (item) => {
  ElMessageBox.prompt("", "选择颜色", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputType: "color",
    inputValue: item.color || checkInColors.default,
  })
    .then(async ({ value }) => {
      // 确保颜色值是有效的十六进制颜色
      if (value && /^#[0-9A-F]{6}$/i.test(value)) {
        console.log("选择的新颜色:", value, "项目ID:", item.id);
        try {
          // 使用直接的axios请求绕过store
          const response = await axios.put(
            `http://47.98.210.7:3000/api/checkins/items/${item.id}`,
            {
              color: value,
              // 只发送必要的字段，避免额外的字段可能导致问题
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authStore.token}`,
              },
            }
          );
          console.log("颜色更新响应:", response.data);

          // 重新加载打卡项目
          await loadCheckInItems();

          // 强制刷新CSS变量和重新渲染
          nextTick(() => {
            // 更新所有完成项目的CSS变量
            document
              .querySelectorAll(".check-in-item.completed")
              .forEach((el) => {
                // 强制触发重绘
                el.style.display = "none";
                // 获取offsetHeight触发重排
                el.offsetHeight;
                el.style.display = "";
              });

            console.log("已刷新完成项目的颜色显示");
          });

          ElMessage.success("颜色更新成功");
        } catch (error) {
          console.error("颜色更新失败详情:", error);
          ElMessage.error(
            `更新颜色失败: ${
              error.response?.data?.message || error.message || "未知错误"
            }`
          );
        }
      } else {
        ElMessage.warning("请选择有效的颜色");
      }
    })
    .catch(() => {
      // 用户取消
    });
};

const openNewColorPicker = () => {
  ElMessageBox.prompt("", "选择颜色", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputType: "color",
    inputValue: newCheckInColor.value,
  })
    .then(({ value }) => {
      if (value) {
        newCheckInColor.value = value;
      }
    })
    .catch(() => {
      // 用户取消
    });
};

// 将 fixScroll 函数提升到外部作用域，使其在整个组件生命周期内可用
// 滚动修复函数 - 在组件生命周期内保持可用
const fixScroll = () => {
  // 强制禁用所有可能的滚动锁定
  document.documentElement.style.cssText =
    "height: auto !important; overflow: visible !important;";
  document.body.style.cssText =
    "height: auto !important; overflow: visible !important; position: static !important;";

  // 修复所有可能的容器
  const fixElement = (selector) => {
    const el = document.querySelector(selector);
    if (el) {
      el.style.cssText =
        "overflow: visible !important; height: auto !important; max-height: none !important;";
    }
  };

  fixElement(".calendar-page");
  fixElement(".calendar-content");
  fixElement(".content-area");
};

onMounted(() => {
  loadEvents();
  loadCheckInItems();
  loadUserCheckIns();

  // 强制启用文档滚动
  document.documentElement.style.overflow = "auto";
  document.body.style.overflow = "auto";
  document.body.style.height = "auto";

  // 修复可能的文字不可见问题
  nextTick(() => {
    // 确保所有文本元素都有适当的颜色和可见性
    document
      .querySelectorAll(
        ".section-title:not(.gradient-text), .event-title, .check-in-name, .day-number"
      )
      .forEach((el) => {
        el.style.color = "var(--text-color)";
        el.style.opacity = "1";
      });

    // 确保渐变文本有适当的回退颜色
    document.querySelectorAll(".gradient-text").forEach((el) => {
      if (window.getComputedStyle(el).color === "rgba(0, 0, 0, 0)") {
        el.style.color = "var(--text-color)";
      }
    });
  });

  // 立即执行一次
  fixScroll();

  // 100ms后再次执行，确保覆盖所有后期加载的样式
  setTimeout(fixScroll, 100);

  // 窗口大小改变时再次执行
  window.addEventListener("resize", fixScroll);

  // 滚动开始时确保能继续滚动
  window.addEventListener("scroll", () => {
    requestAnimationFrame(fixScroll);
  });

  // 添加特定类以便样式隔开
  document.documentElement.classList.add("calendar-view");
  document.body.classList.add("calendar-view");
});

onUnmounted(() => {
  // 移除特定类
  document.documentElement.classList.remove("calendar-view");
  document.body.classList.remove("calendar-view");

  // 移除事件监听
  window.removeEventListener("resize", fixScroll);
  window.removeEventListener("scroll", () => {
    requestAnimationFrame(fixScroll);
  });
});
</script>

<style scoped>
/* 基础变量 */
:root {
  --bg-color: #121212;
  --card-bg: #1e1e2e;
  --card-inner: #2a2a3a;
  --primary-color: #9333ea; /* 紫色 */
  --secondary-color: #ec4899; /* 粉色 */
  --accent-color: #38bdf8; /* 蓝色点缀 */
  --text-color: #e2e8f0;
  --text-secondary: #94a3b8;
  --border-glow: 0 0 10px rgba(147, 51, 234, 0.5);
  --completed-glow: 0 0 15px rgba(56, 189, 248, 0.6);
  --border-radius: 12px;
  --small-radius: 8px;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  --button-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  --gradient-1: linear-gradient(135deg, #9333ea, #ec4899);
  --gradient-2: linear-gradient(90deg, #ec4899, #38bdf8);
  --gradient-3: linear-gradient(45deg, #38bdf8, #9333ea);
  --particle-color-1: rgba(147, 51, 234, 0.7);
  --particle-color-2: rgba(236, 72, 153, 0.7);
  --particle-color-3: rgba(56, 189, 248, 0.7);
}

/* 重设全局滚动行为 - 使用!important强制启用 */
:global(html),
:global(body) {
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: visible !important;
  background-color: var(--bg-color);
  position: static !important;
  overscroll-behavior: auto !important;
}

/* 重新设计外层容器 */
.calendar-page {
  min-height: 100vh;
  position: relative;
  padding-bottom: 70px; /* 为底部导航留出足够空间 */
  overflow: visible !important; /* 强制可见溢出内容 */
}

/* 重设滚动内容样式 */
.calendar-content {
  width: 100%;
  max-width: 100vw; /* 限制最大宽度为视口宽度 */
  margin: 0 auto;
  padding: 12px;
  color: var(--text-color);
  position: relative;
  z-index: 5; /* 提高z-index确保内容在粒子之上 */
  overflow: visible !important; /* 强制可见溢出内容 */
  box-sizing: border-box; /* 确保padding不会导致溢出 */
}

/* 宇宙背景 */
.space-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
  pointer-events: none;
}

.space-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(
      1px 1px at 25% 25%,
      white 100%,
      transparent 0
    ),
    radial-gradient(1px 1px at 50% 50%, white 100%, transparent 0),
    radial-gradient(2px 2px at 75% 75%, white 100%, transparent 0),
    radial-gradient(1px 1px at 10% 90%, white 100%, transparent 0),
    radial-gradient(1.5px 1.5px at 90% 10%, white 100%, transparent 0);
  background-size: 200px 200px;
  opacity: 0.3;
  animation: space-float 100s linear infinite;
}

.space-stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(
      1px 1px at 10% 20%,
      #9333ea 100%,
      transparent 0
    ),
    radial-gradient(1px 1px at 20% 50%, #ec4899 100%, transparent 0),
    radial-gradient(1px 1px at 30% 70%, #9333ea 100%, transparent 0),
    radial-gradient(1px 1px at 40% 10%, #38bdf8 100%, transparent 0),
    radial-gradient(1px 1px at 50% 30%, #ec4899 100%, transparent 0),
    radial-gradient(1px 1px at 60% 50%, #9333ea 100%, transparent 0),
    radial-gradient(1px 1px at 70% 70%, #38bdf8 100%, transparent 0),
    radial-gradient(1px 1px at 80% 90%, #ec4899 100%, transparent 0),
    radial-gradient(1px 1px at 90% 10%, #9333ea 100%, transparent 0);
  background-size: 250px 250px;
  opacity: 0.3;
  animation: space-twinkle 5s ease-in-out infinite;
}

@keyframes space-float {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100px);
  }
}

@keyframes space-twinkle {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.5;
  }
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.page-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.8);
  letter-spacing: 1px;
  margin: 0;
}

/* 日历卡片 */
.mobile-card {
  width: 100%; /* 占满全宽 */
  background: var(--card-bg); /* 使用不透明背景 */
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-clip: padding-box;
  position: relative;
  padding: 16px;
  overflow: hidden;
  margin-bottom: 16px;
  box-sizing: border-box; /* 确保padding不会增加宽度 */
}

.month-nav {
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-bottom: 12px;
}

.month-label {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

.nav-button {
  background-color: transparent;
  border: none;
  color: var(--text-color);
  transition: all 0.3s ease;
}

.nav-button:active {
  transform: scale(0.9);
}

/* 日历网格 */
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 8px 0;
  font-size: 0.9rem;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-cell {
  height: 50px;
  border-radius: 8px;
  padding: 4px;
  position: relative;
  background: var(--card-inner);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.day-cell:active {
  background: rgba(147, 51, 234, 0.1);
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.2);
  transform: scale(0.95);
}

.day-cell.today {
  position: relative;
  background: rgba(147, 51, 234, 0.15);
  border: none;
  overflow: hidden;
  z-index: 0;
}

.day-cell.today::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: var(--gradient-1);
  border-radius: calc(var(--small-radius) + 1px);
  z-index: -1;
  animation: border-pulse 2s infinite;
}

@keyframes border-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.9;
  }
}

.day-cell.other-month {
  opacity: 0.5;
}

.day-number {
  color: var(--text-color) !important;
  font-weight: 500;
  font-size: 0.95rem;
  text-align: center;
  margin-bottom: 4px;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.day-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: auto;
}

.event-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-color);
  box-shadow: 0 0 5px rgba(56, 189, 248, 0.8);
}

.checkin-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-shadow: 0 0 5px currentColor;
}

/* 内容区域新样式 */
.tech-row {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  flex-direction: column; /* 改为垂直布局，避免溢出 */
  width: 100%;
}

.tech-title {
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: var(--text-color);
  position: relative;
}

.title-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #9333ea, #ec4899);
  border-radius: 50%;
  margin-right: 10px;
  color: white;
}

/* 打卡项目列表 */
.check-in-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.check-in-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: var(--small-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  min-height: 48px;
  background: rgba(30, 30, 40, 0.85);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
}

.check-in-info {
  flex: 1;
  z-index: 2;
  position: relative;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.check-in-name {
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  color: white !important;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(236, 72, 153, 0.5);
  margin-right: 8px;
  transition: all 0.3s ease;
}

.status-indicator.active {
  background: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
}

.check-in-streak {
  font-size: 0.8rem;
  opacity: 0.8;
  color: var(--text-secondary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

/* 事件列表样式 */
.events-list {
  width: 100%;
  overflow: hidden; /* 防止列表项溢出 */
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
  background: rgba(56, 189, 248, 0.1);
}

.event-time {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 4px;
  color: var(--accent-color);
}

.event-title {
  font-weight: 500;
}

.no-events {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  background: rgba(30, 30, 40, 0.3);
  border-radius: var(--small-radius);
  border: 1px dashed rgba(147, 51, 234, 0.3);
}

/* 媒体查询 */
@media screen and (max-width: 767px) {
  .mobile-card {
    padding: 12px;
    margin-bottom: 12px;
  }

  .check-in-item,
  .event-item {
    padding: 14px 12px;
    margin-bottom: 8px;
  }
}

/* 脉冲动画效果 */
.animate-pulse {
  animation: tech-pulse 1.5s ease-in-out;
}

@keyframes tech-pulse {
  0% {
    box-shadow: 0 0 0 rgba(56, 189, 248, 0);
  }
  50% {
    box-shadow: 0 0 30px rgba(56, 189, 248, 0.8);
  }
  100% {
    box-shadow: 0 0 0 rgba(56, 189, 248, 0);
  }
}

/* 底部导航 */
:deep(.bottom-nav-bar) {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background-color: var(--card-bg);
  height: 60px;
  box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

:deep(.bottom-nav-bar)::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--gradient-1);
  opacity: 0.6;
  z-index: 1;
}

/* 新增的动态浮动粒子 */
.floating-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: -2; /* 降低z-index，确保在背景之下 */
}

.floating-particles::before,
.floating-particles::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  animation: float-particles 15s linear infinite alternate;
  opacity: 0.15; /* 降低不透明度，减少视觉干扰 */
}

.floating-particles::before {
  background-image: radial-gradient(
      2px 2px at 10% 10%,
      var(--particle-color-1) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 20% 30%,
      var(--particle-color-2) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 30% 50%,
      var(--particle-color-3) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 40% 70%,
      var(--particle-color-1) 100%,
      transparent 0
    ),
    radial-gradient(
      3px 3px at 50% 90%,
      var(--particle-color-2) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 60% 10%,
      var(--particle-color-3) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 70% 30%,
      var(--particle-color-1) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 80% 50%,
      var(--particle-color-2) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 90% 70%,
      var(--particle-color-3) 100%,
      transparent 0
    );
  background-size: 250px 250px;
  animation: float-particles 30s linear infinite alternate;
  transform: translateY(-50%);
}

.floating-particles::after {
  background-image: radial-gradient(
      2px 2px at 15% 15%,
      var(--particle-color-3) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 25% 35%,
      var(--particle-color-1) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 35% 55%,
      var(--particle-color-2) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 45% 75%,
      var(--particle-color-3) 100%,
      transparent 0
    ),
    radial-gradient(
      3px 3px at 55% 95%,
      var(--particle-color-1) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 65% 15%,
      var(--particle-color-2) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 75% 35%,
      var(--particle-color-3) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 85% 55%,
      var(--particle-color-1) 100%,
      transparent 0
    ),
    radial-gradient(
      2px 2px at 95% 75%,
      var(--particle-color-2) 100%,
      transparent 0
    );
  background-size: 300px 300px;
  animation: float-particles 40s linear infinite;
  transform: translateY(-30%);
}

@keyframes float-particles {
  0% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-30px) translateX(10px);
  }
  50% {
    transform: translateY(-10px) translateX(-10px);
  }
  75% {
    transform: translateY(-40px) translateX(5px);
  }
  100% {
    transform: translateY(-20px) translateX(-5px);
  }
}

/* 渐变文本效果 */
.gradient-text {
  color: white;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
  animation: text-glow 4s ease-in-out infinite alternate;
}

@keyframes text-glow {
  0% {
    text-shadow: 0 0 5px rgba(147, 51, 234, 0.7);
  }
  50% {
    text-shadow: 0 0 10px rgba(56, 189, 248, 0.9);
  }
  100% {
    text-shadow: 0 0 5px rgba(236, 72, 153, 0.7);
  }
}

/* 渐变边框效果 */
.gradient-border {
  position: relative;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  z-index: 0;
  padding: 1px;
}

.gradient-border > * {
  position: relative;
  z-index: 1;
}

.gradient-border::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: var(--gradient-1);
  border-radius: calc(var(--border-radius) + 1px);
  z-index: -1;
  opacity: 0.5;
  animation: border-glow 4s ease infinite alternate;
}

@keyframes border-glow {
  0% {
    opacity: 0.3;
    background: var(--gradient-1);
  }
  50% {
    opacity: 0.5;
    background: var(--gradient-2);
  }
  100% {
    opacity: 0.3;
    background: var(--gradient-3);
  }
}

/* 发光按钮效果 */
.glow-button {
  position: relative;
  overflow: hidden;
  background-color: var(--card-inner);
  border: none;
  transition: all 0.3s ease;
}

.glow-button::after {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: var(--gradient-1);
  border-radius: calc(var(--small-radius) + 2px);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.glow-button:active::after {
  opacity: 0.7;
}

/* 修改打卡项目样式，添加渐变效果 */
.item-completed {
  background: linear-gradient(
    90deg,
    rgba(56, 189, 248, 0.3),
    rgba(147, 51, 234, 0.35)
  );
  border: none;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
  position: relative;
  overflow: hidden;
  z-index: 0;
}

.item-completed::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: var(--gradient-2);
  border-radius: calc(var(--small-radius) + 1px);
  z-index: -1;
  opacity: 0.5;
  animation: task-complete-glow 3s infinite ease-in-out;
}

@keyframes task-complete-glow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.item-completed::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
      circle at 20% 50%,
      rgba(56, 189, 248, 0.8) 0%,
      transparent 5%
    ),
    radial-gradient(
      circle at 80% 30%,
      rgba(147, 51, 234, 0.8) 0%,
      transparent 4%
    ),
    radial-gradient(
      circle at 40% 70%,
      rgba(56, 189, 248, 0.8) 0%,
      transparent 6%
    ),
    radial-gradient(
      circle at 60% 20%,
      rgba(236, 72, 153, 0.8) 0%,
      transparent 4%
    ),
    radial-gradient(
      circle at 10% 10%,
      rgba(56, 189, 248, 0.8) 0%,
      transparent 3%
    ),
    radial-gradient(
      circle at 90% 90%,
      rgba(147, 51, 234, 0.8) 0%,
      transparent 5%
    );
  z-index: 1;
  opacity: 0.2;
  animation: tech-particles 10s infinite linear;
}

@keyframes tech-particles {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  100% {
    transform: translateY(-10px) rotate(360deg);
  }
}

/* 修复文本可见性问题 */

/* 调整渐变文本效果，仅用于特定标题 */
.gradient-text {
  color: white;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
  animation: text-glow 4s ease-in-out infinite alternate;
}

/* 修复普通文本颜色 */
.section-title:not(.gradient-text),
.event-title,
.check-in-name,
.no-events p,
.day-cell .day-number {
  color: var(--text-color);
}

/* 修复打卡项的状态样式 */
.item-pending .check-in-name,
.item-pending .check-in-streak {
  color: var(--text-color);
  opacity: 0.9;
}

/* 修复完成项的文本颜色 */
.item-completed .check-in-name,
.item-completed .check-in-streak {
  color: var(--text-color);
  opacity: 1;
  position: relative;
  z-index: 2; /* 确保文本在粒子效果之上 */
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5); /* 增加阴影提高可读性 */
}

/* 确保日期单元格中的数字可见 */
.day-cell {
  position: relative;
  z-index: 1;
  color: var(--text-color);
}

.day-cell.today {
  position: relative;
  background: rgba(147, 51, 234, 0.15);
  border: none;
  overflow: hidden;
  z-index: 0;
  color: white; /* 确保当天日期文字清晰可见 */
  font-weight: bold;
}

/* 修复月份导航栏文字 */
.month-nav {
  color: var(--text-color);
}

.month-label:not(.gradient-text) {
  color: var(--text-color);
  font-weight: 500;
}

/* 修复事件列表中的文字 */
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

/* 确保渐变边框不会覆盖文字 */
.gradient-border {
  position: relative;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  z-index: 0;
  padding: 1px; /* 确保内容不会紧贴边框 */
}

.gradient-border > * {
  position: relative;
  z-index: 1; /* 确保内容在边框效果之上 */
}

/* 确保打卡区域文字可见 */
.check-in-streak {
  font-size: 0.8rem;
  opacity: 0.8;
  color: var(--text-secondary);
}

/* 为渐变文本添加备选颜色方案 */
.section-title {
  color: white;
  font-weight: 500;
  margin-bottom: 16px;
}

.section-title.gradient-text {
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: white;
}
</style>
