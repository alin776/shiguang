<template>
  <div class="calendar-settings-page">
    <!-- 宇宙粒子背景 -->
    <SpaceBackground />

    <div class="page-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>添加打卡</h2>
    </div>

    <div class="settings-content page-content">
      <h4 class="settings-title">打卡项目</h4>
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
          <el-button type="primary" @click="addNewCheckIn">添加</el-button>
        </div>
      </div>
    </div>

    <!-- 颜色选择器 -->
    <el-dialog v-model="showColorPicker" title="选择颜色" width="90%">
      <div class="color-picker-container">
        <el-color-picker v-model="selectedColor" show-alpha />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showColorPicker = false">取消</el-button>
          <el-button type="primary" @click="confirmColor">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowLeft, Delete } from "@element-plus/icons-vue";
import { useCheckInStore } from "../../stores/checkIn";
import { useSettingsStore } from "../../stores/settings";
import SpaceBackground from "./components/SpaceBackground.vue";

const router = useRouter();
const checkInStore = useCheckInStore();
const settingsStore = useSettingsStore();

// 打卡颜色映射
const checkInColors = {
  exercise: "#FF5252",
  reading: "#4CAF50",
  meditation: "#2196F3",
  writing: "#FFC107",
  default: "#409EFF",
};

// 设置相关状态
const availableCheckIns = ref([]);
const newCheckInName = ref("");
const newCheckInColor = ref("#409EFF");
const showColorPicker = ref(false);
const selectedColor = ref("");
const currentEditItem = ref(null);

// 加载打卡项目
const loadCheckInItems = async () => {
  try {
    const data = await checkInStore.getCheckInItems();
    availableCheckIns.value = data.map((item) => ({
      ...item,
      enabled: item.enabled === undefined ? true : Boolean(item.enabled),
    }));
  } catch (error) {
    console.error("加载打卡项目失败:", error);
    ElMessage.error("加载打卡项目失败，请刷新页面重试");
  }
};

// 打开颜色选择器
const openColorPicker = (item) => {
  currentEditItem.value = item;
  selectedColor.value = item.color || checkInColors.default;
  showColorPicker.value = true;
};

// 打开新项目颜色选择器
const openNewColorPicker = () => {
  currentEditItem.value = null;
  selectedColor.value = newCheckInColor.value;
  showColorPicker.value = true;
};

// 确认颜色选择
const confirmColor = () => {
  if (selectedColor.value) {
    if (currentEditItem.value) {
      // 更新现有项目颜色
      currentEditItem.value.color = selectedColor.value;
    } else {
      // 更新新项目颜色
      newCheckInColor.value = selectedColor.value;
    }
    showColorPicker.value = false;
  } else {
    ElMessage.warning("请选择有效的颜色");
  }
};

// 添加新的打卡项目
const addNewCheckIn = async () => {
  if (!newCheckInName.value.trim()) {
    ElMessage.warning("请输入打卡项目名称");
    return;
  }

  // 确保颜色是标准的十六进制格式且不超过7字符 (#RRGGBB)
  let colorValue = newCheckInColor.value;
  if (colorValue && colorValue.length > 7) {
    // 如果颜色值过长，将其转换为标准的十六进制格式
    try {
      // 处理可能的rgba格式
      if (colorValue.startsWith("rgba") || colorValue.startsWith("rgb")) {
        const rgbValues = colorValue.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
          // 将RGB值转换为十六进制
          colorValue =
            "#" +
            parseInt(rgbValues[0]).toString(16).padStart(2, "0") +
            parseInt(rgbValues[1]).toString(16).padStart(2, "0") +
            parseInt(rgbValues[2]).toString(16).padStart(2, "0");
        } else {
          colorValue = "#409EFF"; // 默认颜色
        }
      } else {
        // 如果不是rgba格式但仍然太长，使用默认颜色
        colorValue = "#409EFF";
      }
    } catch (e) {
      console.error("颜色转换失败:", e);
      colorValue = "#409EFF"; // 转换失败时使用默认颜色
    }
  }

  try {
    const result = await checkInStore.createCheckInItem(
      newCheckInName.value,
      colorValue
    );
    ElMessage.success("创建成功");
    availableCheckIns.value.push({
      id: result.id,
      name: newCheckInName.value,
      color: colorValue,
      enabled: true,
    });
    newCheckInName.value = "";
    newCheckInColor.value = "#409EFF";
  } catch (error) {
    ElMessage.error("创建失败: " + error.message);
  }
};

// 确认删除打卡项目
const confirmDeleteCheckIn = (item) => {
  ElMessageBox.confirm(`确定要删除 "${item.name}" 打卡项目吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await checkInStore.deleteCheckInItem(item.id);
        ElMessage.success("删除成功");
        // 从列表中移除该项目
        availableCheckIns.value = availableCheckIns.value.filter(
          (i) => i.id !== item.id
        );
      } catch (error) {
        ElMessage.error("删除失败: " + error.message);
      }
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 保存设置
const saveSettings = async () => {
  try {
    // 更新每个打卡项目的启用状态和颜色
    for (const item of availableCheckIns.value) {
      await checkInStore.updateCheckInItem(item.id, {
        enabled: item.enabled,
        color: item.color,
        name: item.name,
      });
    }

    ElMessage.success("设置已保存");
    router.back();
  } catch (error) {
    console.error("保存设置失败:", error);
    ElMessage.error("保存设置失败: " + (error.message || "未知错误"));
  }
};

onMounted(async () => {
  await loadCheckInItems();
});
</script>

<style scoped>
.calendar-settings-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  position: relative;
  padding-bottom: 70px;
}

.page-header {
  position: relative;
  padding: 15px;
  background-color: #fff;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.back-icon {
  margin-right: 15px;
  font-size: 20px;
  cursor: pointer;
  color: #333;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.settings-content {
  padding: 15px;
}

.settings-title {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.checkin-settings {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.checkin-setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.checkin-setting-item:last-child {
  border-bottom: none;
}

.setting-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
  border: 2px solid #fff;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
}

.color-dot:hover {
  transform: scale(1.1);
}

.add-checkin {
  margin-top: 15px;
  padding: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.color-select {
  display: flex;
  align-items: center;
}

.color-picker-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

@media screen and (max-width: 767px) {
  .add-checkin {
    flex-direction: column;
    align-items: stretch;
  }

  .add-checkin .el-input {
    margin-bottom: 8px;
  }

  .color-select {
    margin-bottom: 8px;
  }
}
</style>
