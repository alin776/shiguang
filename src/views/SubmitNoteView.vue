<template>
  <div class="submit-note-page">
    <div class="safe-area-top"></div>
    <div class="header">
      <div class="header-left" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <div class="header-title">发布小记</div>
      <div class="header-right">
        <el-button 
          type="primary" 
          size="small" 
          :disabled="!isValid || isSubmitting" 
          @click="submitNote"
          :loading="isSubmitting"
          class="submit-button"
        >
          发布
        </el-button>
      </div>
    </div>

    <div class="note-form">
      <div class="text-area-container">
        <el-input
          v-model="noteContent"
          type="textarea"
          placeholder="投稿你觉得好的名言或诗歌，会有机会被收录到我们的名言墙哦~"
          :rows="6"
          maxlength="500"
          show-word-limit
          resize="none"
          class="note-textarea"
        />
      </div>

      <div class="image-upload-area" v-if="previewImage">
        <div class="preview-container">
          <img :src="previewImage" class="preview-image" />
          <div class="remove-image" @click="removeImage">
            <el-icon><Close /></el-icon>
          </div>
        </div>
      </div>

      <div class="upload-actions">
        <div class="upload-button" @click="triggerImageUpload">
          <el-icon><Picture /></el-icon>
          <span>图片</span>
        </div>
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          style="display: none"
          @change="handleImageUpload"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Picture, Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { API_BASE_URL } from '../config'; // 导入API配置

const router = useRouter();
const noteContent = ref('');
const previewImage = ref('');
const fileInput = ref(null);
const isSubmitting = ref(false);
const imageFile = ref(null);

// 验证表单是否有效
const isValid = computed(() => {
  return noteContent.value.trim().length > 0;
});

// 返回上一页
const goBack = () => {
  router.go(-1);
};

// 触发文件选择
const triggerImageUpload = () => {
  fileInput.value.click();
};

// 使用canvas压缩图片
const compressImage = (file, maxSize = 95) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 开始尝试压缩
        let quality = 0.7; // 初始压缩质量
        let width = img.width;
        let height = img.height;
        
        // 如果尺寸太大，先进行尺寸压缩
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // 创建canvas并绘制图像
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 递归压缩直到文件小于设置的最大大小（maxSize）
        const compressLoop = (q) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }
            
            const sizeKB = Math.round(blob.size / 1024);
            console.log(`尝试压缩: 质量=${q.toFixed(2)}, 大小=${sizeKB}KB`);
            
            if (sizeKB <= maxSize || q < 0.1) {
              // 压缩至目标大小或达到最低质量，创建File对象
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              // 继续压缩
              const newQuality = q - 0.1;
              compressLoop(newQuality);
            }
          }, 'image/jpeg', q);
        };
        
        // 开始压缩
        compressLoop(quality);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

// 处理图片上传
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 验证文件类型
  if (!file.type.includes('image/')) {
    ElMessage.error('请上传图片文件');
    return;
  }

  // 验证文件大小（小于5MB）
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB');
    return;
  }

  try {
    // 设置加载状态并显示提示
    ElMessage.info({
      message: '正在处理图片...',
      duration: 0,
      showClose: true
    });
    
    // 先创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.value = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // 获取原始大小
    const originalSizeKB = Math.round(file.size / 1024);
    
    // 如果图片小于95KB，不压缩
    if (originalSizeKB <= 95) {
      imageFile.value = file;
      ElMessage.closeAll();
      ElMessage.success(`图片已准备好 (${originalSizeKB}KB)`);
      return;
    }
    
    // 压缩图片到95KB以内
    const compressedFile = await compressImage(file, 95);
    const newSizeKB = Math.round(compressedFile.size / 1024);
    
    console.log(`图片已压缩: ${originalSizeKB}KB -> ${newSizeKB}KB`);
    
    // 更新图片文件
    imageFile.value = compressedFile;
    
    // 显示结果
    ElMessage.closeAll();
    ElMessage.success(`图片已压缩 (${originalSizeKB}KB -> ${newSizeKB}KB)`);
  } catch (error) {
    console.error('图片处理失败:', error);
    ElMessage.closeAll();
    ElMessage.error('图片处理失败，请选择其他图片');
    // 图片处理失败时，仍然保留选择的图片预览，但不进行上传
  }
};

// 移除已选图片
const removeImage = () => {
  previewImage.value = '';
  imageFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 提交小记
const submitNote = async () => {
  if (!isValid.value) return;
  
  try {
    isSubmitting.value = true;
    
    // 获取认证令牌
    const token = localStorage.getItem('token');
    if (!token) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }
    
    // 先上传图片（如果有），然后再创建小记
    let imageUrl = null;
    
    // 如果有图片，先上传图片
    if (imageFile.value) {
      try {
        console.log('开始上传图片...');
        
        // 创建图片上传用的FormData
        const imageFormData = new FormData();
        
        // 使用"file"作为字段名，与社区上传保持一致
        imageFormData.append('file', imageFile.value);
        
        // 使用community/upload端点 - 服务器上已存在的端点
        const uploadUrl = `${API_BASE_URL}/api/community/upload`;
        
        console.log(`尝试上传到社区上传端点: ${uploadUrl}`);
        
        const uploadResponse = await axios.post(uploadUrl, imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 15000
        });
        
        console.log('图片上传响应:', uploadResponse.data);
        
        // 检查是否上传成功
        if (uploadResponse.data && (uploadResponse.data.url || uploadResponse.data.name)) {
          // 从响应中获取图片URL - 确保使用完整URL
          // 社区上传返回的是相对路径
          imageUrl = uploadResponse.data.url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${API_BASE_URL}${imageUrl}`;
          }
          console.log('图片上传成功，URL:', imageUrl);
        } else {
          throw new Error(uploadResponse.data.message || '图片上传失败');
        }
      } catch (uploadError) {
        console.error('图片上传失败:', uploadError);
        
        // 显示上传错误，但继续创建没有图片的小记
        ElMessage.warning('图片上传失败，将发布不带图片的小记');
        // 继续执行，但不带图片
      }
    }
    
    // 创建小记数据对象
    const noteData = {
      content: noteContent.value
    };
    
    // 如果图片上传成功，添加图片URL
    if (imageUrl) {
      noteData.image = imageUrl;
    }
    
    console.log('准备提交小记:', noteData);
    
    // 使用JSON格式发送请求创建小记
    const createNoteUrl = `${API_BASE_URL}/api/notes`;
    const response = await axios.post(createNoteUrl, noteData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('小记创建响应:', response.data);
    
    if (response.data.success) {
      ElMessage.success('小记发布成功');
      router.push('/note');
    } else {
      console.error('服务器返回错误:', response.data);
      ElMessage.error(response.data.message || '发布失败');
    }
  } catch (error) {
    console.error('发布小记失败:', error);
    
    // 显示详细的错误信息，便于调试
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
      
      // 对于413错误(请求体过大)给出更明确的提示
      if (error.response.status === 413) {
        ElMessage.error('图片过大，请选择较小的图片');
      } else if (error.response.status === 404) {
        ElMessage.error('找不到文件上传服务，请联系管理员');
      } else if (error.response.status === 500) {
        ElMessage.error('服务器内部错误，可能原因：数据库参数错误、服务器存储问题');
      } else {
        // 显示服务器返回的详细错误信息
        const errorMsg = error.response.data?.error || error.response.data?.message || '服务器错误';
        ElMessage.error(`发布失败 (${error.response.status}): ${errorMsg}`);
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      ElMessage.error('服务器无响应，请稍后重试');
    } else {
      ElMessage.error(`发布失败: ${error.message || '网络错误'}`);
    }
  } finally {
    isSubmitting.value = false;
  }
};

// 页面挂载时的初始化
onMounted(() => {
  // 设置全局API基础URL，避免每个请求都要单独设置
  axios.defaults.baseURL = API_BASE_URL;
  
  // 设置背景
  document.body.style.backgroundColor = '#f5f7fa';
  
  // 检查登录状态
  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.warning('请先登录后再发布小记');
    router.push('/login');
  }
});
</script>

<style scoped>
.submit-note-page {
  height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.safe-area-top {
  height: var(--safe-area-top, 0);
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  cursor: pointer;
  font-size: 24px;
  color: #333;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
}

.submit-button {
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: 500;
}

.note-form {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.text-area-container {
  width: 100%;
}

.note-textarea {
  background-color: transparent;
  border: none;
  padding: 0;
  font-size: 16px;
}

.note-textarea :deep(.el-textarea__inner) {
  background-color: transparent;
  border: none;
  padding: 0;
  font-size: 16px;
  color: #333;
}

/* 添加字数统计的样式调整 */
.note-textarea :deep(.el-input__count) {
  background-color: transparent;
  color: #999;
  font-size: 14px;
  right: 0;
  bottom: 0;
}

.image-upload-area {
  width: 100%;
  margin-top: 16px;
}

.preview-container {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
}

.upload-actions {
  display: flex;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: auto;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.upload-button:hover {
  background-color: #f5f5f5;
}

.upload-button .el-icon {
  font-size: 20px;
}
</style> 