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
      <div class="checkin-settings tech-card enhanced-border">
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
          <el-button @click="addNewCheckIn" class="glow-button">添加</el-button>
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
          <el-button type="primary" @click="confirmColor" class="glow-button"
            >确定</el-button
          >
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
  default: "#9C27B0",
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
          colorValue = "#9C27B0"; // 默认颜色
        }
      } else {
        // 如果不是rgba格式但仍然太长，使用默认颜色
        colorValue = "#9C27B0";
      }
    } catch (e) {
      console.error("颜色转换失败:", e);
      colorValue = "#9C27B0"; // 转换失败时使用默认颜色
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
  ElMessageBox.confirm("确定要删除这个打卡项目吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await checkInStore.deleteCheckInItem(item.id);
        ElMessage.success("删除成功");
        const index = availableCheckIns.value.findIndex(
          (i) => i.id === item.id
        );
        if (index !== -1) {
          availableCheckIns.value.splice(index, 1);
        }
      } catch (error) {
        ElMessage.error("删除失败: " + (error.message || "未知错误"));
      }
    })
    .catch(() => {});
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

onMounted(() => {
  loadCheckInItems();
});
</script>

<style scoped>
.calendar-settings-page {
  min-height: 100vh;
  background-color: rgba(18, 18, 30, 0.9);
  padding-bottom: 60px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow-x: hidden;
  padding: 0 16px;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: transparent;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  width: 100%;
}

.back-icon {
  font-size: 20px;
  color: white;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
  transition: all 0.3s ease;
}

.back-icon:hover {
  transform: translateX(-3px);
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

.page-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  flex: 1;
  color: white;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
}

.page-content {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

.settings-content {
  padding: 16px;
}

.settings-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: white;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
}

.checkin-settings {
  position: relative;
  z-index: 0;
  padding: 24px;
  border-radius: 16px;
  border: 2px solid transparent;
  background-clip: padding-box;
  background: rgba(20, 20, 30, 0.7);
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.4);
  border-radius: 12px;
}

/* 渐变边框效果 */
.tech-card {
  background: rgba(30, 30, 40, 0.5);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
}

.enhanced-border {
  position: relative;
  z-index: 0;
}

.enhanced-border::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  padding: 2px;
  border-radius: 16px;
  background: linear-gradient(
    45deg,
    rgba(56, 189, 248, 0.6),
    rgba(147, 51, 234, 0.6)
  );
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.checkin-setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid rgba(147, 51, 234, 0.3);
  transition: all 0.2s ease;
}

.checkin-setting-item:hover {
  background: rgba(147, 51, 234, 0.1);
}

.checkin-setting-item:last-child {
  border-bottom: none;
}

.setting-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 8px currentColor;
  transition: all 0.3s ease;
}

.color-dot:hover {
  transform: scale(1.2);
  box-shadow: 0 0 12px currentColor;
}

.add-checkin {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
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

:deep(.el-checkbox__label) {
  color: white !important;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

:deep(.el-dialog) {
  background-color: rgba(20, 20, 30, 0.9);
  border: 1px solid rgba(147, 51, 234, 0.3);
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.4);
}

:deep(.el-dialog__title) {
  color: white;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

:deep(.el-button) {
  transition: all 0.3s;
}

.glow-button {
  background: linear-gradient(45deg, #8b5cf6, #d946ef);
  border: none;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(147, 51, 234, 0.4);
}

.glow-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(147, 51, 234, 0.6);
}

.glow-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(147, 51, 234, 0.4);
}

:deep(.el-input__wrapper) {
  background-color: transparent !important;
  border: 1px solid rgba(147, 51, 234, 0.3) !important;
  box-shadow: none !important;
  color: white !important;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(147, 51, 234, 0.7) !important;
  background-color: rgba(147, 51, 234, 0.05) !important;
  box-shadow: 0 0 8px rgba(147, 51, 234, 0.3) !important;
}

:deep(.el-input__wrapper:focus-within) {
  border-color: rgba(147, 51, 234, 0.9) !important;
  background-color: rgba(147, 51, 234, 0.1) !important;
  box-shadow: 0 0 12px rgba(147, 51, 234, 0.5) !important;
}

:deep(.el-input__inner) {
  color: white !important;
  background-color: transparent !important;
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
