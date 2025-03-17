<template>
  <div class="event-page no-extra-padding">
    <div class="page-content">
      <!-- 顶部导航 -->
      <div class="event-header">
        <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
        <h2>{{ isEditMode ? "编辑事件" : "创建新事件" }}</h2>
        <div v-if="isEditMode" class="delete-button" @click="confirmDelete">
          <el-icon><Delete /></el-icon>
        </div>
      </div>

      <!-- 表单区域 - 增强边框效果 -->
      <div class="event-form-container tech-card enhanced-border">
        <el-form
          ref="eventFormRef"
          :model="eventForm"
          :rules="rules"
          label-position="top"
          class="event-form"
        >
          <!-- 标题输入 -->
          <el-form-item prop="title" label="标题">
            <el-input
              v-model="eventForm.title"
              placeholder="给你的事件起个名字"
              clearable
              class="tech-input"
            />
          </el-form-item>

          <!-- 日期选择 -->
          <el-form-item prop="date" label="日期">
            <el-date-picker
              v-model="eventForm.date"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="tech-input"
            />
          </el-form-item>

          <!-- 时间选择 -->
          <div class="time-section">
            <!-- 开始时间 -->
            <el-form-item prop="startTime" label="开始时间" class="time-item">
              <el-time-picker
                v-model="eventForm.startTime"
                placeholder="开始时间"
                format="HH:mm"
                class="tech-input"
              />
            </el-form-item>

            <!-- 结束时间 -->
            <el-form-item prop="endTime" label="结束时间" class="time-item">
              <el-time-picker
                v-model="eventForm.endTime"
                placeholder="结束时间"
                format="HH:mm"
                class="tech-input"
              />
            </el-form-item>
          </div>

          <!-- 颜色选择 -->
          <el-form-item label="颜色标记" class="color-item">
            <div class="color-picker">
              <div
                v-for="color in eventColors"
                :key="color"
                class="color-option"
                :class="{ active: eventForm.color === color }"
                :style="{ backgroundColor: color }"
                @click="eventForm.color = color"
              ></div>
            </div>
          </el-form-item>

          <!-- 备注输入 -->
          <el-form-item label="备注（选填）">
            <el-input
              v-model="eventForm.description"
              type="textarea"
              :rows="4"
              placeholder="添加事件备注"
              class="tech-input"
            />
          </el-form-item>
        </el-form>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <el-button
            class="submit-btn glow-button"
            type="primary"
            @click="submitForm"
            :loading="submitting"
          >
            {{ isEditMode ? "保存修改" : "创建事件" }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowLeft, Delete } from "@element-plus/icons-vue";
import { useEventStore } from "../../stores/event";
import { useAuthStore } from "../../stores/auth";
import dayjs from "dayjs"; // 引入dayjs库

// 状态变量
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const eventStore = useEventStore();
const eventFormRef = ref(null);
const submitting = ref(false);
const isMounted = ref(true);

// 事件颜色选项
const eventColors = [
  "#FF5252", // 红色
  "#FF9800", // 橙色
  "#FFEB3B", // 黄色
  "#4CAF50", // 绿色
  "#2196F3", // 蓝色
  "#9C27B0", // 紫色
  "#E91E63", // 粉色
];

// 表单数据
const eventForm = ref({
  title: "",
  date: "",
  startTime: new Date(new Date().setHours(9, 0, 0, 0)), // 今天9:00
  endTime: new Date(new Date().setHours(10, 0, 0, 0)), // 今天10:00
  description: "",
  color: "#9C27B0", // 默认紫色
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: "请输入事件标题", trigger: "blur" },
    { min: 1, max: 50, message: "标题长度应在1-50个字符之间", trigger: "blur" },
  ],
  date: [{ required: true, message: "请选择日期", trigger: "change" }],
  startTime: [{ required: true, message: "请选择开始时间", trigger: "change" }],
  endTime: [{ required: true, message: "请选择结束时间", trigger: "change" }],
};

// 计算属性
const isEditMode = computed(() => {
  return route.params.id && route.params.id !== "new";
});

// 返回上一页
const goBack = () => {
  router.back();
};

// 确认删除
const confirmDelete = async () => {
  try {
    await ElMessageBox.confirm("确定要删除这个事件吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await eventStore.deleteEvent(route.params.id);
    ElMessage.success("删除成功");
    router.push("/calendar");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败: " + error.message);
    }
  }
};

// 提交表单
const submitForm = async () => {
  try {
    // 表单验证
    await eventFormRef.value.validate();

    submitting.value = true;

    // 格式化日期和时间
    const formatDate = dayjs(eventForm.value.date).format("YYYY-MM-DD");
    const formatStartTime = dayjs(eventForm.value.startTime).format("HH:mm");
    const formatEndTime = dayjs(eventForm.value.endTime).format("HH:mm");

    // 处理描述字段 - 如果为空，设置为"NULL"
    const description =
      eventForm.value.description && eventForm.value.description.trim() !== ""
        ? eventForm.value.description.trim()
        : "NULL";

    const eventData = {
      title: eventForm.value.title,
      description: description,
      startTime: `${formatDate} ${formatStartTime}:00`,
      endTime: `${formatDate} ${formatEndTime}:00`,
      color: eventForm.value.color,
      reminder: false, // 默认不提醒
      reminder_time: null, // 添加reminder_time字段，即使为null
      user_id: authStore.user?.id, // 添加用户ID
      created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
      updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    console.log("提交的事件数据:", eventData);
    console.log("特别检查描述字段:", {
      原始值: eventForm.value.description,
      处理后: description,
      最终提交: eventData.description,
    });

    if (isEditMode.value) {
      await eventStore.updateEvent(route.params.id, eventData);
      if (!isMounted.value) return;
      ElMessage.success("更新成功");
    } else {
      await eventStore.createEvent(eventData);
      if (!isMounted.value) return;
      ElMessage.success("创建成功");
    }

    setTimeout(() => {
      if (isMounted.value) {
        router.push("/calendar");
      }
    }, 300);
  } catch (error) {
    if (!isMounted.value) return;
    console.error("提交事件详细错误:", error);
    if (error.response) {
      console.error("服务器响应:", error.response.data);
      if (isMounted.value) {
        ElMessage.error(
          `提交失败: ${error.response.data.message || error.message}`
        );
      }
    } else {
      if (error?.message && isMounted.value) {
        ElMessage.error("提交失败: " + error.message);
      }
    }
  } finally {
    if (isMounted.value) {
      submitting.value = false;
    }
  }
};

// 加载事件数据
const loadEventData = async () => {
  if (!isEditMode.value) {
    // 如果是新建模式，且URL有date参数，则设置为该日期
    if (route.query.date) {
      eventForm.value.date = route.query.date;
      // 确保创建时间对象的方式正确
      const today = new Date();
      eventForm.value.startTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9,
        0
      );
      eventForm.value.endTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        10,
        0
      );
    }
    return;
  }

  try {
    // 加载事件
    const eventData = await eventStore.getEventById(route.params.id);
    if (!isMounted.value) return;

    // 检查是否成功获取到事件数据
    if (!eventData) {
      ElMessage.error("未找到事件数据");
      router.push("/calendar");
      return;
    }

    console.log("加载的事件数据:", eventData);

    // 解析开始和结束时间
    // 确保日期解析正确
    let startDateTime, endDateTime;
    try {
      // 尝试解析日期时间，优先使用snake_case形式
      const startTimeStr = eventData.start_time || eventData.startTime;
      const endTimeStr = eventData.end_time || eventData.endTime;

      console.log("原始时间字符串:", startTimeStr, endTimeStr);

      startDateTime = new Date(startTimeStr);
      endDateTime = new Date(endTimeStr);

      console.log("解析后的时间对象:", startDateTime, endDateTime);
    } catch (e) {
      console.error("日期解析错误:", e);
      startDateTime = new Date();
      endDateTime = new Date();
      endDateTime.setHours(startDateTime.getHours() + 1);
    }

    // 设置表单数据
    eventForm.value.title = eventData.title || "";

    // 正确处理描述字段 - 如果是"NULL"字符串则置为空
    const description = eventData.description || "";
    eventForm.value.description = description === "NULL" ? "" : description;

    // 设置日期
    eventForm.value.date = dayjs(startDateTime).format("YYYY-MM-DD");

    // 设置时间
    eventForm.value.startTime = startDateTime;
    eventForm.value.endTime = endDateTime;

    // 设置颜色
    eventForm.value.color = eventData.color || "#9C27B0";

    console.log("设置后的表单数据:", {
      title: eventForm.value.title,
      description: eventForm.value.description,
      date: eventForm.value.date,
      startTime: eventForm.value.startTime,
      endTime: eventForm.value.endTime,
      color: eventForm.value.color,
    });
  } catch (error) {
    if (!isMounted.value) return;
    console.error("加载失败详细错误:", error);
    ElMessage.error("加载失败: " + (error.message || "未知错误"));
    router.push("/calendar");
  }
};

// 生命周期钩子
onMounted(() => {
  loadEventData();
});

onBeforeUnmount(() => {
  isMounted.value = false;
});
</script>

<style scoped>
.event-page {
  min-height: 100vh;
  background-color: rgba(255, 255, 255, 0.98); /* 增加不透明度代替模糊效果 */
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow-x: hidden; /* 防止水平滚动 */
  padding: 0 16px; /* 添加左右内边距 */
  color: var(--text-color); /* 添加文字颜色 */
}

.page-content {
  width: 100%;
  max-width: 800px; /* 最大宽度 */
  margin: 0 auto;
  padding: 20px 0;
}

.event-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 0;
  border-radius: 8px;
  position: relative;
}

.back-icon {
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color);
  margin-right: 16px;
  transition: all 0.3s ease;
}

.back-icon:hover {
  transform: translateX(-3px);
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

.event-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  flex: 1;
  color: var(--text-color);
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
}

.delete-button {
  cursor: pointer;
  color: #ff4d4f;
  font-size: 18px;
  transition: all 0.3s ease;
  padding: 8px;
}

.delete-button:hover {
  transform: scale(1.1);
  text-shadow: 0 0 8px rgba(255, 77, 79, 0.7);
}

.event-form-container {
  padding: 24px;
  margin-bottom: 30px;
  position: relative;
  background: rgba(20, 20, 30, 0.5); /* 暗色半透明背景 */
  border-radius: 16px;
  overflow: hidden;
}

/* 渐变边框 */
.enhanced-border {
  position: relative;
  z-index: 0;
  padding: 24px;
  border-radius: 16px;
  border: 2px solid transparent; /* 透明边框 */
  background-clip: padding-box; /* 确保背景不延伸到边框 */
  background: rgba(20, 20, 30, 0.7); /* 暗色背景 */
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.4);
}

.enhanced-border::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: -2px; /* 减小边框厚度 */
  border-radius: 18px;
  background: linear-gradient(
    45deg,
    rgba(147, 51, 234, 0.9),
    rgba(56, 189, 248, 0.9),
    rgba(236, 72, 153, 0.9),
    rgba(147, 51, 234, 0.9)
  );
  background-size: 400% 400%;
  animation: border-glow 6s ease infinite;
  box-shadow: 0 0 25px rgba(147, 51, 234, 0.6);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 3px;
}

.enhanced-border::after {
  content: "";
  position: absolute;
  z-index: -2;
  inset: 0;
  border-radius: 20px;
  background: rgba(20, 20, 30, 0.5);
}

@keyframes shadow-pulse {
  0% {
    opacity: 0.5;
    /* 删除模糊效果 */
  }
  100% {
    opacity: 0.8;
    /* 删除模糊效果 */
  }
}

@keyframes border-glow {
  0% {
    background-position: 0% 50%;
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.6);
  }
  50% {
    background-position: 100% 50%;
    box-shadow: 0 0 35px rgba(236, 72, 153, 0.8);
  }
  100% {
    background-position: 0% 50%;
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.6);
  }
}

.tech-card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

.tech-card:hover {
  box-shadow: 0 15px 40px rgba(147, 51, 234, 0.4);
}

.event-form {
  margin-bottom: 20px;
}

.tech-input {
  width: 100%;
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: transparent !important;
  border: 1px solid rgba(147, 51, 234, 0.3) !important;
  box-shadow: none !important;
  color: var(--text-color) !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: rgba(147, 51, 234, 0.7) !important;
  background-color: rgba(147, 51, 234, 0.05) !important;
  box-shadow: 0 0 8px rgba(147, 51, 234, 0.3) !important;
}

:deep(.el-input__wrapper:focus-within),
:deep(.el-textarea__inner:focus) {
  border-color: rgba(147, 51, 234, 0.9) !important;
  background-color: rgba(147, 51, 234, 0.1) !important;
  box-shadow: 0 0 12px rgba(147, 51, 234, 0.5) !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--text-color) !important;
  background-color: transparent !important;
}

:deep(.el-form-item__label) {
  color: var(--text-color) !important;
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 6px;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.time-section {
  display: flex;
  gap: 20px;
}

.time-item {
  flex: 1;
}

:deep(.el-picker__popper) {
  background-color: rgba(255, 255, 255, 0.98) !important; /* 增加不透明度代替模糊效果 */
  border: 1px solid rgba(147, 51, 234, 0.5) !important;
  box-shadow: 0 0 15px rgba(147, 51, 234, 0.3) !important;
  /* 删除模糊效果 */
}

:deep(.el-picker-panel),
:deep(.el-time-panel) {
  background-color: rgba(255, 255, 255, 0.98) !important; /* 增加不透明度代替模糊效果 */
  color: #333333 !important; /* 调整文字颜色，确保在白色背景上可见 */
}

:deep(.el-date-table td.current:not(.disabled) .el-date-table-cell__text) {
  background-color: rgba(147, 51, 234, 0.8) !important;
  color: white !important;
}

:deep(.el-date-table td.today .el-date-table-cell__text) {
  color: rgba(147, 51, 234, 0.9) !important;
  font-weight: bold;
}

:deep(.el-time-spinner__item:hover) {
  background-color: rgba(147, 51, 234, 0.15) !important;
}

:deep(.el-time-spinner__item.active) {
  color: rgba(147, 51, 234, 0.9) !important;
  font-weight: bold;
}

/* 颜色选择 */
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  justify-content: center;
}

.color-option {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 0 12px currentColor;
}

.color-option.active {
  transform: scale(1.15);
  box-shadow: 0 0 15px currentColor;
  border: 2px solid var(--text-color);
}

/* 提交按钮 */
.submit-btn,
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

:deep(.el-button) {
  min-width: 120px;
  background: linear-gradient(45deg, #8b5cf6, #d946ef);
  border: none;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(147, 51, 234, 0.4);
  transition: all 0.3s;
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(147, 51, 234, 0.6);
}

:deep(.el-button:active) {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(147, 51, 234, 0.4);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-content {
    padding: 15px 5px;
    width: 100%;
  }

  .time-section {
    flex-direction: column;
    gap: 10px;
  }

  .time-item {
    width: 100%;
  }

  .event-form-container {
    padding: 16px;
  }

  .enhanced-border {
    padding: 16px;
  }

  .event-header h2 {
    font-size: 1.2rem;
  }

  .color-picker {
    flex-wrap: wrap;
    justify-content: center;
  }

  .color-option {
    margin: 4px;
  }
}
</style>
