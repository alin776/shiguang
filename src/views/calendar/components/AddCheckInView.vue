<template>
  <div class="add-checkin-view">
    <div class="header">
      <el-icon class="back-icon" @click="$emit('close')"><ArrowLeft /></el-icon>
      <h2>添加打卡</h2>
    </div>
    
    <div class="content">
      <div class="form-item">
        <el-input v-model="checkInName" placeholder="新打卡项目名称" />
      </div>
      
      <div class="form-item color-selector">
        <div class="color-preview" :style="{ backgroundColor: selectedColor }" @click="showColorPicker = true"></div>
        <span class="color-label">选择颜色</span>
      </div>
      
      <div class="action-buttons">
        <el-button @click="$emit('close')">取消</el-button>
        <el-button type="primary" @click="submitCheckIn" :disabled="!checkInName">添加</el-button>
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
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';

const emit = defineEmits(['close', 'add-checkin']);

// 表单状态
const checkInName = ref('');
const selectedColor = ref('#409EFF');
const showColorPicker = ref(false);

// 确认颜色选择
const confirmColor = () => {
  if (selectedColor.value) {
    showColorPicker.value = false;
  } else {
    ElMessage.warning('请选择有效的颜色');
  }
};

// 提交新打卡项目
const submitCheckIn = () => {
  if (!checkInName.value.trim()) {
    ElMessage.warning('请输入打卡项目名称');
    return;
  }
  
  // 处理颜色格式
  let colorValue = selectedColor.value;
  if (colorValue && colorValue.length > 7) {
    try {
      if (colorValue.startsWith('rgba') || colorValue.startsWith('rgb')) {
        const rgbValues = colorValue.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
          colorValue = '#' +
            parseInt(rgbValues[0]).toString(16).padStart(2, '0') +
            parseInt(rgbValues[1]).toString(16).padStart(2, '0') +
            parseInt(rgbValues[2]).toString(16).padStart(2, '0');
        } else {
          colorValue = '#409EFF';
        }
      } else {
        colorValue = '#409EFF';
      }
    } catch (e) {
      console.error('颜色转换失败:', e);
      colorValue = '#409EFF';
    }
  }
  
  // 发送事件到父组件
  emit('add-checkin', {
    name: checkInName.value,
    color: colorValue
  });
  
  // 重置表单
  checkInName.value = '';
  selectedColor.value = '#409EFF';
};
</script>

<style scoped>
.add-checkin-view {
  background-color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.back-icon {
  margin-right: 15px;
  font-size: 20px;
  cursor: pointer;
  color: #333;
}

.header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.content {
  padding: 20px;
  flex: 1;
}

.form-item {
  margin-bottom: 20px;
}

.color-selector {
  display: flex;
  align-items: center;
}

.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 15px;
  cursor: pointer;
  border: 1px solid #eee;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.color-label {
  color: #666;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.color-picker-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style> 