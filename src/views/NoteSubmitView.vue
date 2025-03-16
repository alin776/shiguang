<template>
  <div class="submit-note-page">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <div class="header-title">发表小记</div>
      <div class="submit-button" @click="submitNote" :class="{ disabled: !isFormValid }">
        发布
      </div>
    </div>

    <div class="form-container">
      <!-- 文本输入区域 -->
      <div class="text-input-area">
        <el-input
          v-model="noteContent"
          type="textarea"
          placeholder="写下你的小记内容..."
          :autosize="{ minRows: 6, maxRows: 10 }"
          maxlength="300"
          show-word-limit
          class="note-textarea"
        />
      </div>

      <!-- 图片上传区域 -->
      <div class="image-upload-area">
        <div class="upload-title">
          <div>添加图片</div>
          <div class="optional-tag">选填</div>
        </div>
        
        <div class="upload-container" v-if="!imageUrl">
          <el-upload
            class="image-uploader"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            accept="image/*"
          >
            <div class="upload-box">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div class="upload-text">点击上传图片</div>
            </div>
          </el-upload>
        </div>
        
        <div class="preview-container" v-else>
          <div class="preview-wrapper">
            <img :src="imageUrl" class="preview-image" />
            <div class="remove-image" @click="removeImage">
              <el-icon><Delete /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 额外设置区域 -->
      <div class="settings-area">
        <div class="setting-item">
          <span class="setting-label">位置信息</span>
          <el-switch v-model="includeLocation" class="setting-control" />
        </div>
        <div class="location-info" v-if="includeLocation">
          {{ locationName }} · {{ weather }} {{ temperature }}
        </div>
        
        <div class="setting-item">
          <span class="setting-label">匿名发布</span>
          <el-switch v-model="isAnonymous" class="setting-control" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Plus, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const noteContent = ref('');
const imageUrl = ref('');
const includeLocation = ref(true);
const isAnonymous = ref(false);
const locationName = ref('上海');
const weather = ref('阴');
const temperature = ref('8.6°C');

// 验证表单
const isFormValid = computed(() => {
  return noteContent.value.trim().length > 0;
});

// 图片上传处理
const handleImageChange = (file) => {
  const isImage = file.raw.type.startsWith('image/');
  const isLt2M = file.raw.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }
  
  // 创建图片预览URL
  imageUrl.value = URL.createObjectURL(file.raw);
};

// 移除图片
const removeImage = () => {
  imageUrl.value = '';
};

// 提交小记
const submitNote = () => {
  if (!isFormValid.value) {
    ElMessage({
      message: '请输入小记内容',
      type: 'warning'
    });
    return;
  }

  // 构建小记数据
  const noteData = {
    content: noteContent.value,
    image: imageUrl.value,
    location: includeLocation.value ? `${locationName.value}·${weather.value} ${temperature.value}` : null,
    anonymous: isAnonymous.value,
    timestamp: new Date().toISOString()
  };

  console.log('提交小记数据:', noteData);
  
  // 模拟提交成功
  ElMessage({
    message: '小记发布成功！',
    type: 'success'
  });
  
  // 成功后返回小记页面
  setTimeout(() => {
    router.push('/note');
  }, 1500);
};

// 返回上一页
const goBack = () => {
  router.back();
};
</script>

<style scoped>
.submit-note-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button {
  font-size: 20px;
  cursor: pointer;
  width: 60px;
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  flex-grow: 1;
  text-align: center;
}

.submit-button {
  font-size: 16px;
  color: #e74c3c;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  width: 60px;
  text-align: center;
}

.submit-button:hover {
  background-color: rgba(231, 76, 60, 0.1);
}

.submit-button.disabled {
  color: #bdc3c7;
  cursor: not-allowed;
}

.form-container {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
}

.text-input-area {
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  width: 100%;
  box-sizing: border-box;
}

.note-textarea {
  font-size: 16px;
}

.note-textarea :deep(.el-textarea__inner) {
  border: none;
  padding: 0;
  font-size: 16px;
  line-height: 1.6;
  resize: none;
}

.note-textarea :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.note-textarea :deep(.el-input__count) {
  background: transparent;
  font-size: 14px;
  color: #95a5a6;
}

.image-upload-area {
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  width: 100%;
  box-sizing: border-box;
}

.upload-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
}

.optional-tag {
  margin-left: 8px;
  font-size: 12px;
  background-color: #f1f3f5;
  color: #7f8c8d;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: normal;
}

.upload-container {
  width: 100%;
}

.image-uploader {
  width: 100%;
}

.upload-box {
  width: 100%;
  height: 120px;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-box:hover {
  border-color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.05);
}

.upload-icon {
  font-size: 24px;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #7f8c8d;
}

.preview-container {
  width: 100%;
}

.preview-wrapper {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 12px;
}

.remove-image {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-image:hover {
  background-color: rgba(231, 76, 60, 0.8);
}

.settings-area {
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  width: 100%;
  box-sizing: border-box;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f3f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 16px;
  color: #2c3e50;
}

.location-info {
  font-size: 14px;
  color: #7f8c8d;
  padding: 8px 0 16px 0;
}

/* 响应式调整 */
@media screen and (max-width: 480px) {
  .form-container {
    padding: 16px 12px;
    gap: 16px;
  }
  
  .header-title {
    font-size: 16px;
  }
  
  .submit-button {
    font-size: 14px;
    padding: 6px 12px;
  }
  
  .text-input-area,
  .image-upload-area,
  .settings-area {
    padding: 12px;
  }
}
</style> 