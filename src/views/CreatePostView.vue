<template>
  <div class="create-post-page">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="router.back()" text class="back-button">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </div>
      <div class="header-title">发布新帖子</div>
      <div class="header-right"></div>
    </div>

    <div class="post-form-container">
      <el-form
        ref="postFormRef"
        :model="postForm"
        :rules="postRules"
        label-position="top"
        class="post-form"
      >
        <el-form-item label="标题" prop="title">
          <div class="custom-input">
            <input 
              v-model="postForm.title"
              class="simple-input" 
              placeholder="请输入标题（最多50字）"
              maxlength="50"
            />
            <div class="word-counter">{{ postForm.title.length }}/50</div>
          </div>
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <div class="custom-textarea">
            <textarea 
              v-model="postForm.content"
              class="simple-textarea" 
              placeholder="分享你的故事..."
              maxlength="1000"
              rows="6"
            ></textarea>
            <div class="word-counter">{{ postForm.content.length }}/1000</div>
          </div>
        </el-form-item>

        <el-form-item label="分类">
          <div class="select-container">
            <el-select 
              v-model="postForm.category_id" 
              placeholder="选择分类" 
              clearable
              class="post-select custom-select bright-select"
              popper-class="bright-dropdown"
              :teleported="false"
            >
              <div class="dropdown-items">
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                  class="custom-option"
                >
                  <div class="category-option">
                    <span>{{ category.name }}</span>
                  </div>
                </el-option>
              </div>
            </el-select>
          </div>
        </el-form-item>

        <el-form-item label="图片">
          <div class="upload-container">
            <el-upload
              v-model:file-list="postForm.images"
              :action="`${API_BASE_URL}/api/community/upload`"
              list-type="picture-card"
              :limit="9"
              :before-upload="handleBeforeUpload"
              :on-preview="handlePictureCardPreview"
              :on-remove="handleRemove"
              :headers="{
                Authorization: `Bearer ${authStore.token}`,
              }"
              multiple
              class="post-upload"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span class="upload-text">添加图片</span>
              </div>
              <template #tip>
                <div class="upload-tip">
                  每张图片不超过 5MB，支持 jpg/png 格式
                </div>
              </template>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="语音">
          <AudioRecorder v-model:value="postForm.audio" class="audio-recorder" />
        </el-form-item>

        <div class="form-actions">
          <el-button @click="router.back()" class="cancel-btn bright-btn">取消</el-button>
          <el-button type="primary" @click="submitPost" :loading="submitting" class="submit-btn">
            发布
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- 图片预览 -->
    <el-dialog v-model="previewVisible" width="90%" class="preview-dialog">
      <img :src="previewImage" alt="预览" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, Plus } from "@element-plus/icons-vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import { useCommunityStore } from "@/stores/community";
import { useAuthStore } from "@/stores/auth";
import { API_BASE_URL } from "@/config";

const router = useRouter();
const communityStore = useCommunityStore();
const authStore = useAuthStore();
const categories = ref([]);
const submitting = ref(false);
const previewVisible = ref(false);
const previewImage = ref("");

// 表单数据
const postForm = ref({
  title: "",
  content: "",
  category_id: "",
  images: [],
  audio: null,
});

// 表单验证规则
const postRules = {
  title: [
    { required: true, message: "请输入标题", trigger: "blur" },
    { min: 1, max: 50, message: "标题长度应在1-50个字符之间", trigger: "blur" },
  ],
  content: [
    { required: true, message: "请输入内容", trigger: "blur" },
    { min: 1, max: 1000, message: "内容长度应在1-1000个字符之间", trigger: "blur" },
  ],
};

// 加载分类数据
const loadCategories = async () => {
  try {
    const categoriesData = await communityStore.getCategories();
    categories.value = categoriesData;
  } catch (error) {
    console.error("加载分类数据失败:", error);
    ElMessage.error("加载分类数据失败");
  }
};

// 图片上传前检查
const handleBeforeUpload = (file) => {
  const isJPG = file.type === "image/jpeg";
  const isPNG = file.type === "image/png";
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isJPG && !isPNG) {
    ElMessage.error("只能上传JPG/PNG格式的图片!");
    return false;
  }
  if (!isLt5M) {
    ElMessage.error("图片大小不能超过5MB!");
    return false;
  }
  return true;
};

// 图片预览
const handlePictureCardPreview = (file) => {
  previewImage.value = file.url || file.response?.url;
  previewVisible.value = true;
};

// 移除图片
const handleRemove = (file, fileList) => {
  postForm.value.images = fileList;
};

// 提交帖子
const submitPost = async () => {
  try {
    submitting.value = true;
    await communityStore.createPost(postForm.value);
    ElMessage.success("发布成功");
    router.push("/community");
  } catch (error) {
    console.error("发布失败:", error);
    ElMessage.error("发布失败: " + (error.message || "未知错误"));
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
.create-post-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 16px;
  background-color: #ffffff;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: sticky;
  top: 0;
  background-color: #ffffff;
  z-index: 10;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  text-align: center;
  color: #333;
}

.header-left, .header-right {
  width: 40px;
}

.back-button {
  color: #333;
  transition: all 0.3s ease;
}

.back-button:hover {
  transform: translateX(-3px);
}

.post-form-container {
  margin-top: 16px;
}

.post-form {
  margin-bottom: 24px;
}

.post-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  font-size: 15px;
  padding-bottom: 8px;
}

/* 自定义输入框样式 */
.custom-input,
.custom-textarea {
  position: relative;
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
}

.custom-input:hover,
.custom-textarea:hover {
  border-color: #c0c4cc;
}

.custom-input:focus-within,
.custom-textarea:focus-within {
  border-color: #409eff;
}

.simple-input,
.simple-textarea {
  width: 100%;
  border: none;
  outline: none;
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  resize: none;
  background: transparent;
}

.simple-input::placeholder,
.simple-textarea::placeholder {
  color: #c0c4cc;
}

.word-counter {
  position: absolute;
  bottom: 5px;
  right: 10px;
  font-size: 12px;
  color: #909399;
  background: transparent;
}

.post-input,
.post-textarea,
.post-select {
  width: 100%;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.post-input:deep(.el-input__inner),
.post-select:deep(.el-input__inner) {
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.post-input:deep(.el-input__inner):focus,
.post-select:deep(.el-input__inner):focus,
.post-textarea:deep(.el-textarea__inner):focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.post-textarea :deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 12px;
  line-height: 1.6;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

/* 自定义字数显示样式 */
.post-input :deep(.el-input__count), 
.post-textarea :deep(.el-textarea__count) {
  background: transparent !important;
  color: #909399 !important;
  font-size: 12px !important;
}

.post-input :deep(.el-input__count-inner), 
.post-textarea :deep(.el-textarea__count-inner) {
  background: transparent !important;
  color: #909399 !important;
  font-size: 12px !important;
}

/* 覆盖元素底部右侧的字数计数背景颜色 */
:deep(.el-input__count),
:deep(.el-textarea__count) {
  background: transparent !important;
}

:deep(.el-input__count-inner),
:deep(.el-textarea__count-inner) {
  background: transparent !important;
  color: #909399 !important;
}

/* 修改分类下拉样式 */
:deep(.el-select-dropdown) {
  border: 1px solid #e4e7ed !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
  background-color: white !important;
}

:deep(.el-select-dropdown__item) {
  color: #606266 !important;
}

:deep(.el-select-dropdown__item.selected) {
  background-color: #f0f7ff !important;
  color: #409eff !important;
  font-weight: 600 !important;
}

:deep(.el-select-dropdown__item:hover) {
  background-color: #f5f7fa !important;
}

:global(.bright-dropdown) {
  background-color: white !important;
}

:global(.bright-dropdown .el-select-dropdown__item) {
  background-color: white !important;
}

:global(.bright-dropdown .el-select-dropdown__item.selected) {
  background-color: #f0f7ff !important;
  color: #409eff !important;
}

.upload-container {
  margin-top: 8px;
}

.post-upload :deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  border: 1px dashed #d0d0d0;
  background-color: #fafafa;
  transition: all 0.3s ease;
  overflow: hidden;
}

.post-upload :deep(.el-upload--picture-card:hover) {
  border-color: #409eff;
  background-color: #f5f9ff;
}

.post-upload :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
}

.upload-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.upload-icon {
  font-size: 24px;
  color: #909399;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 13px;
  color: #909399;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.audio-recorder {
  margin-top: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

.cancel-btn,
.submit-btn {
  min-width: 100px;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn {
  border: 1px solid #e0e0e0;
  color: #606266;
  background-color: #ffffff;
}

.cancel-btn:hover {
  border-color: #c0c4cc;
  background-color: #f9f9f9;
}

.submit-btn {
  background-color: #409eff;
  border-color: #409eff;
}

.submit-btn:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
}

.preview-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.preview-dialog :deep(.el-dialog__header) {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
}

/* 响应式调整 */
@media screen and (max-width: 480px) {
  .create-post-page {
    padding: 16px 12px;
  }
  
  .post-upload :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
  }
  
  .post-upload :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 100px;
    height: 100px;
  }
  
  .form-actions {
    margin-top: 24px;
  }
}

.custom-select :deep(.el-input__inner) {
  background-color: white !important;
}

/* 额外的选择器，确保分类下拉选择器变为白色 */
.post-select {
  background-color: white !important;
}

.post-select :deep(.el-input__wrapper) {
  background-color: white !important;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.post-select :deep(.el-input__inner) {
  color: #606266 !important;
}

.post-select :deep(.el-select__caret) {
  color: #909399 !important;
}

.custom-option {
  background-color: white !important;
  color: #606266 !important;
}

.category-option {
  color: #606266 !important;
}

/* 强制覆盖任何可能的暗色主题 */
.el-select-dropdown {
  --el-bg-color: white !important;
  --el-fill-color-blank: white !important;
  --el-text-color-regular: #606266 !important;
  --el-border-color: #dcdfe6 !important;
  background-color: white !important;
  border-color: #dcdfe6 !important;
  color: #606266 !important;
}

.el-select-dropdown__item {
  --el-text-color-regular: #606266 !important;
  color: #606266 !important;
  background-color: white !important;
}

.el-select-dropdown__item.hover, 
.el-select-dropdown__item:hover {
  background-color: #f5f7fa !important;
}

.el-select-dropdown.bright-dropdown {
  --el-bg-color: white !important;
  --el-bg-color-overlay: white !important;
  --el-fill-color-blank: white !important;
  --el-fill-color-light: #f5f7fa !important;
  --el-text-color-primary: #303133 !important;
  --el-text-color-regular: #606266 !important;
  --el-border-color-light: #e4e7ed !important;
  background-color: white !important;
  border-color: #e4e7ed !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
}

/* 确保分类选择器的文本和背景色始终为亮色 */
.post-select :deep(.el-select-dropdown__item) {
  color: #606266 !important;
  background-color: white !important; 
}

.post-select :deep(.el-select-dropdown__item.selected) {
  color: #409eff !important;
  background-color: #f0f7ff !important;
}

/* 确保取消按钮是白色的 */
.cancel-btn {
  background-color: white !important;
  border-color: #dcdfe6 !important;
  color: #606266 !important;
}

.select-container {
  position: relative;
  width: 100%;
}

.bright-select {
  --el-select-input-bg-color: white !important;
  --el-select-input-text-color: #606266 !important;
  --el-select-input-placeholder-color: #a8abb2 !important;
  --el-select-input-border-color: #dcdfe6 !important;
}

.bright-select :deep(.el-input__wrapper) {
  background-color: white !important; 
  box-shadow: 0 0 0 1px #dcdfe6 inset !important;
}

.bright-select :deep(.el-input__inner) {
  color: #606266 !important;
}

.dropdown-items {
  background-color: white !important;
}

.bright-btn {
  --el-button-bg-color: white !important;
  --el-button-text-color: #606266 !important;
  --el-button-border-color: #dcdfe6 !important;
  background-color: white !important;
  color: #606266 !important;
  border-color: #dcdfe6 !important;
}
</style> 