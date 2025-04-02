<template>
  <div class="create-rate-post">
    <PageHeader title="创建评分贴" />
    
    <div class="content-section">
      <div class="form-section">
        <!-- 标题输入 -->
        <div class="form-group">
          <label>评分贴标题</label>
          <input 
            type="text" 
            v-model="formData.title" 
            placeholder="例如：哪部漫画最好看？"
            maxlength="30"
          >
          <div class="char-count">{{ formData.title.length }}/30</div>
        </div>
        
        <!-- 描述输入 -->
        <div class="form-group">
          <label>描述 (选填)</label>
          <textarea 
            v-model="formData.description" 
            placeholder="添加详细描述..."
            maxlength="200"
            rows="3"
          ></textarea>
          <div class="char-count">{{ formData.description.length }}/200</div>
        </div>
        
        <!-- 分类选择 -->
        <div class="form-group">
          <label>分类</label>
          <div class="category-options">
            <div 
              v-for="(category, index) in categories" 
              :key="index" 
              :class="['category-option', formData.category === category.id ? 'active' : '']"
              @click="formData.category = category.id"
            >
              {{ category.name }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 评分选项 -->
      <div class="options-section">
        <div class="section-title">评分选项</div>
        <div class="options-description">添加用户可以评分的选项</div>
        
        <div class="options-list">
          <div v-for="(option, index) in formData.options" :key="index" class="option-item">
            <div class="option-handle">
              <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="option-content">
              <div class="option-input-group">
                <input 
                  type="text" 
                  v-model="option.name" 
                  placeholder="选项名称"
                  maxlength="30"
                >
                <div class="option-upload" @click="uploadOptionImage(index)">
                  <div class="upload-placeholder" v-if="!option.avatar">
                    <i class="fas fa-image"></i>
                  </div>
                  <div v-else-if="option.avatar">
                    <img :src="getProcessedImageUrl(option.avatar)" class="option-image">
                  </div>
                </div>
              </div>
            </div>
            <div class="option-remove" @click="removeOption(index)">
              <span>×</span>
            </div>
          </div>
        </div>
        
        <button class="add-option-btn" @click="addOption">
          <i class="fas fa-plus"></i> 添加选项
        </button>
      </div>
      
      <!-- 提交按钮 -->
      <div class="submit-section">
        <button 
          class="submit-btn" 
          :disabled="!isFormValid || isSubmitting"
          @click="submitRatePost"
        >
          {{ isSubmitting ? '提交中...' : '创建评分贴' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import { getProcessedImageUrl } from '@/utils/imageHelpers';

const router = useRouter();
const isSubmitting = ref(false);

// 从后端获取的分类数据
const categories = ref([]);

// 表单数据
const formData = reactive({
  title: '',
  description: '',
  category: '',
  options: [
    { name: '', avatar: '' },
    { name: '', avatar: '' }
  ]
});

// 获取评分贴分类
const fetchCategories = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/categories/rate-posts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('获取分类失败');
    }
    
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      categories.value = result.data;
      // 设置默认分类
      if (categories.value.length > 0) {
        formData.category = categories.value[0].id;
      }
    } else {
      console.error('获取分类失败:', result.message);
      // 使用默认分类作为备份
      categories.value = [
        { id: 'movie', name: '电影' },
        { id: 'game', name: '游戏' },
        { id: 'platform', name: '平台' },
        { id: 'brand', name: '品牌' },
        { id: 'other', name: '其他' }
      ];
      formData.category = 'movie';
    }
  } catch (error) {
    console.error('获取分类错误:', error);
    // 使用默认分类作为备份
    categories.value = [
      { id: 'movie', name: '电影' },
      { id: 'game', name: '游戏' },
      { id: 'platform', name: '平台' },
      { id: 'brand', name: '品牌' },
      { id: 'other', name: '其他' }
    ];
    formData.category = 'movie';
  }
};

// 表单验证
const isFormValid = computed(() => {
  // 标题必须填写
  if (!formData.title.trim()) return false;
  
  // 类别必须选择
  if (!formData.category) return false;
  
  // 至少需要2个选项
  if (formData.options.length < 2) return false;
  
  // 所有选项必须有名称
  for (const option of formData.options) {
    if (!option.name.trim()) return false;
  }
  
  return true;
});

// 添加选项
const addOption = () => {
  formData.options.push({ name: '', avatar: '' });
};

// 移除选项
const removeOption = (index) => {
  // 至少保留2个选项
  if (formData.options.length <= 2) {
    return;
  }
  formData.options.splice(index, 1);
};

// 上传选项图片
const uploadOptionImage = async (index) => {
  try {
    // 创建文件选择框
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e) => {
      // 检查是否有文件被选择
      if (!e.target || !e.target.files || e.target.files.length === 0) {
        console.log('没有选择文件');
        return;
      }
      
      const file = e.target.files[0];
      if (!file) return;
      
      // 检查文件类型
      const isAllowedFormat = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/gif" || file.type === "image/webp";
      if (!isAllowedFormat) {
        alert('图片只能是 JPG、PNG、GIF 或 WEBP 格式!');
        return;
      }
      
      // 检查文件大小（限制为2MB）
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB');
        return;
      }
      
      // 创建FormData
      const formDataObj = new FormData();
      formDataObj.append('image', file);
      
      // 显示上传中状态
      // 注意: 这里formData是表单数据对象，但我们使用的变量名与vue中的响应式对象重名
      // 修正变量名，避免冲突
      const currentOption = formData.options[index];
      if (!currentOption) {
        console.error('无法找到索引为', index, '的选项');
        return;
      }
      
      const originalAvatar = currentOption.avatar;
      currentOption.avatar = 'uploading'; // 可以是一个加载中的图片路径
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/upload/rate_option`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataObj
        });
        
        if (!response.ok) {
          throw new Error('上传图片失败');
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.url) {
          currentOption.avatar = getProcessedImageUrl(result.data.url);
        } else {
          throw new Error(result.message || '上传图片失败');
        }
      } catch (error) {
        console.error('上传图片失败:', error);
        alert(`上传图片失败: ${error.message}`);
        currentOption.avatar = originalAvatar; // 恢复原始值
      }
    };
    
    // 触发文件选择
    fileInput.click();
  } catch (error) {
    console.error('上传图片失败:', error);
    alert(`上传图片失败: ${error.message}`);
  }
};

// 初始化
onMounted(() => {
  fetchCategories();
});

// 提交表单
const submitRatePost = async () => {
  if (!isFormValid.value) {
    console.error('表单验证失败');
    return;
  }
  
  // 检查token是否存在
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('未找到认证令牌');
    alert('请先登录后再创建评分贴');
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // 调用API创建评分贴
    console.log('创建评分贴', formData);
    console.log('formData类型:', Object.prototype.toString.call(formData));
    console.log('formData序列化:', JSON.stringify({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      options: formData.options
    }));
    
    const requestData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      options: formData.options.map(opt => ({
        name: opt.name,
        avatar: opt.avatar
      }))
    };
    
    console.log('请求数据:', requestData);
    console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || '');
    console.log('请求URL:', `${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts`);
    console.log('请求头:', {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('错误响应内容:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('解析错误响应失败:', e);
        throw new Error(`服务器返回状态码 ${response.status}: ${response.statusText}`);
      }
      
      throw new Error(errorData.message || '创建评分贴失败');
    }
    
    const resultText = await response.text();
    console.log('成功响应内容:', resultText);
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      console.error('解析成功响应失败:', e);
      throw new Error('解析服务器响应失败');
    }
    
    if (result.success) {
      console.log('评分贴创建成功:', result);
      // 成功后跳转到评分贴列表页面
      router.push('/rate-posts');
    } else {
      throw new Error(result.message || '创建评分贴失败');
    }
  } catch (error) {
    console.error('创建评分贴失败', error);
    alert(`创建失败: ${error.message}`);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.create-rate-post {
  padding-bottom: 20px;
}

.content-section {
  padding: 10px 15px;
}

.form-section, .options-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  padding: 15px;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 14px;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.category-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-option {
  padding: 8px 15px;
  background-color: #f0f0f0;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.category-option.active {
  background-color: var(--primary-color, #00a0e9);
  color: white;
}

.section-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.options-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 15px;
}

.options-list {
  margin-bottom: 15px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.option-handle {
  color: #999;
  cursor: move;
  padding: 0 10px;
}

.option-content {
  flex: 1;
}

.option-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-upload {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-placeholder {
  color: #999;
}

.option-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.option-remove {
  color: #ff4d4f;
  cursor: pointer;
  padding: 0 15px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  transition: all 0.2s ease;
  margin-left: 5px;
}

.option-remove:hover {
  background-color: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

.option-remove span {
  font-size: 16px;
  font-weight: normal;
  line-height: 1;
}

.add-option-btn {
  width: 100%;
  padding: 10px;
  background-color: #f0f0f0;
  border: 1px dashed #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 14px;
  cursor: pointer;
  color: #666;
}

.submit-section {
  margin-top: 20px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: var(--primary-color, #00a0e9);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style> 