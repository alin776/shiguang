<template>
  <div class="event-page">
    <div class="page-content">
      <!-- 顶部导航 -->
      <div class="event-header">
        <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
        <h2>{{ isEditMode ? "编辑事件" : "创建新事件" }}</h2>
        <div v-if="isEditMode" class="delete-button" @click="confirmDelete">
          <el-icon><Delete /></el-icon>
        </div>
      </div>

      <!-- 表单区域 -->
      <div class="event-form-container">
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
              style="width: 100%"
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
                style="width: 100%"
              />
            </el-form-item>

            <!-- 结束时间 -->
            <el-form-item prop="endTime" label="结束时间" class="time-item">
              <el-time-picker
                v-model="eventForm.endTime"
                placeholder="结束时间"
                format="HH:mm"
                style="width: 100%"
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
            />
          </el-form-item>
        </el-form>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <el-button
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
  background-color: #f7f8fa;
  padding-bottom: 60px;
}

.page-content {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 15px;
}

.event-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  position: relative;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.back-icon {
  font-size: 20px;
  cursor: pointer;
  color: #333;
  margin-right: 16px;
}

.event-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  color: #333;
}

.delete-button {
  cursor: pointer;
  color: #ff4d4f;
  font-size: 18px;
  padding: 8px;
}

.event-form-container {
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.event-form {
  margin-bottom: 20px;
}

.time-section {
  display: flex;
  gap: 15px;
}

.time-item {
  width: 50%;
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
  transition: transform 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  transform: scale(1.15);
  border: 2px solid #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}

/* 提交按钮 */
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-content {
    padding: 15px 10px;
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

  .event-header h2 {
    font-size: 16px;
  }

  .color-option {
    width: 30px;
    height: 30px;
    margin: 4px;
  }
}
</style>
