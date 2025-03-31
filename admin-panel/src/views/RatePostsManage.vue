<template>
  <div class="rate-posts-page">
    <div class="page-header">
      <h1 class="page-title">评分贴管理</h1>
      <div class="page-actions">
        <el-button type="primary" @click="showCreateDialog">创建评分贴</el-button>
      </div>
    </div>
    
    <el-card class="filter-container">
      <div class="filter-row">
        <el-select 
          v-model="categoryFilter"
          placeholder="选择分类" 
          clearable
          @change="handleFilterChange"
        >
          <el-option label="全部分类" value="all" />
          <el-option
            v-for="item in categories"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
        
        <el-input
          v-model="searchKeyword"
          placeholder="搜索评分贴"
          clearable
          class="search-input"
          @input="handleSearchInput"
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </el-card>
    
    <el-card v-loading="loading">
      <el-table :data="ratePosts" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="评分贴标题" min-width="200" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="scope">
            {{ getCategoryName(scope.row.category) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_ratings" label="评分人数" width="100">
          <template #default="scope">
            {{ scope.row.total_ratings || scope.row.totalRatings || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建者" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="goToDetail(scope.row.id)">详情</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-if="total > 0"
        class="pagination"
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
      
      <el-empty v-if="!loading && (!ratePosts || !ratePosts.length)" description="暂无评分贴数据" />
    </el-card>
    
    <!-- 创建/编辑评分贴对话框 -->
    <el-dialog
      :title="isEdit ? '编辑评分贴' : '创建评分贴'"
      v-model="dialogVisible"
      width="40%"
      destroy-on-close
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="ratePostForm" :model="formState" :rules="formRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input 
            v-model="formState.title" 
            placeholder="请输入评分贴标题" 
          />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select 
            v-model="formState.category" 
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="formState.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入评分贴描述"
          />
        </el-form-item>
        
        <div class="options-section">
          <div class="section-header">
            <h3>评分选项</h3>
            <el-button 
              type="primary" 
              size="small" 
              icon="Plus" 
              @click="addOption"
              :disabled="formState.options.length >= 10"
            >
              添加选项
            </el-button>
          </div>
          
          <div 
            v-for="(option, index) in formState.options" 
            :key="index" 
            class="option-item"
          >
            <div class="option-header">
              <span>选项 {{ index + 1 }}</span>
              <el-button 
                type="danger" 
                size="small" 
                icon="Delete" 
                circle 
                @click="removeOption(index)"
                :disabled="formState.options.length <= 2"
              />
            </div>
            
            <el-input 
              v-model="option.name" 
              placeholder="选项名称" 
              class="option-name"
            />
            
            <div class="option-image-container">
              <div class="option-image-preview" v-if="option.avatar">
                <img :src="getImageUrl(option.avatar)" class="preview-image" />
                <el-button 
                  type="danger" 
                  size="small" 
                  icon="Delete" 
                  circle 
                  class="remove-image-btn"
                  @click="option.avatar = ''"
                />
              </div>
              
              <el-upload
                v-if="!option.avatar"
                class="avatar-uploader"
                action="/api/upload/image"
                :headers="{ 'Authorization': `Bearer ${authToken}` }"
                :show-file-list="false"
                :on-success="(res) => handleAvatarSuccess(res, option)"
                :before-upload="beforeAvatarUpload"
              >
                <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
                <div class="upload-text">上传图片</div>
              </el-upload>
              
              <div class="option-image-input" v-if="!option.avatar">
                <p class="text-separator">或者</p>
                <el-input 
                  v-model="option.avatar" 
                  placeholder="输入图片URL" 
                  class="option-avatar"
                />
              </div>
            </div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { usePostStore } from '@/store/post'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getRatePosts } from '@/api/post'

const postStore = usePostStore()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const ratePosts = ref([])
const categories = ref([])
const searchKeyword = ref('')
const categoryFilter = ref('all')

// 添加token响应式变量
const authToken = ref(localStorage.getItem('admin_token') || '')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表单数据
const formState = reactive({
  id: null,
  title: '',
  description: '',
  category: '',
  options: [
    { name: '', avatar: '' },
    { name: '', avatar: '' }
  ]
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入评分贴标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : categoryId
}

// 初始化
onMounted(async () => {
  await Promise.all([
    fetchRatePosts(),
    fetchCategories()
  ])
})

// 获取评分贴列表
const fetchRatePosts = async () => {
  loading.value = true
  try {
    // 设置过滤条件和分页
    postStore.setRatePostFilters({
      category: categoryFilter.value,
      search: searchKeyword.value
    })
    postStore.setRatePostPage(currentPage.value)
    
    // 添加调试代码，直接调用API查看原始响应
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      category: categoryFilter.value,
      search: searchKeyword.value
    }
    try {
      const response = await getRatePosts(params)
      console.log('原始API响应:', response)
    } catch (err) {
      console.error('API请求错误:', err)
    }
    
    // 获取数据
    await postStore.fetchRatePosts()
    console.log('处理后的评分贴数据:', postStore.ratePosts)
    ratePosts.value = postStore.ratePosts
    total.value = postStore.ratePostPagination.total
    console.log('最终显示的评分贴数据:', ratePosts.value)
    console.log('总数:', total.value)
  } catch (error) {
    console.error('获取评分贴列表错误:', error)
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    await postStore.fetchRatePostCategories()
    categories.value = postStore.ratePostCategories
  } catch (error) {
    console.error('获取分类列表错误:', error)
  }
}

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchRatePosts()
}

// 处理筛选条件变化
const handleFilterChange = () => {
  currentPage.value = 1
  fetchRatePosts()
}

// 处理搜索输入
const handleSearchInput = () => {
  // 使用防抖处理搜索
  if (window.searchTimeout) {
    clearTimeout(window.searchTimeout)
  }
  window.searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchRatePosts()
  }, 300)
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  formState.id = null
  formState.title = ''
  formState.description = ''
  formState.category = ''
  formState.options = [
    { name: '', avatar: '' },
    { name: '', avatar: '' }
  ]
}

// 添加评分选项
const addOption = () => {
  if (formState.options.length < 10) {
    formState.options.push({ name: '', avatar: '' })
  } else {
    ElMessage.warning('最多只能添加10个评分选项')
  }
}

// 移除评分选项
const removeOption = (index) => {
  if (formState.options.length > 2) {
    formState.options.splice(index, 1)
  } else {
    ElMessage.warning('至少需要2个评分选项')
  }
}

// 编辑评分贴
const handleEdit = (row) => {
  isEdit.value = true
  formState.id = row.id
  formState.title = row.title
  formState.description = row.description || ''
  formState.category = row.category
  
  console.log('开始获取评分贴详情:', row.id)
  
  // 需要先获取完整的评分贴详情才能编辑选项
  postStore.fetchRatePostDetail(row.id).then(detail => {
    console.log('获取到的评分贴详情:', detail)
    
    if (detail && detail.options) {
      console.log('选项数据:', detail.options)
      formState.options = detail.options.map(option => ({
        id: option.id,
        name: option.name,
        avatar: option.avatar
      }))
      console.log('设置到表单的选项:', formState.options)
    } else {
      console.warn('评分贴详情中没有选项数据')
      // 重置选项为默认值
      formState.options = [
        { name: '', avatar: '' },
        { name: '', avatar: '' }
      ]
    }
    dialogVisible.value = true
  }).catch(error => {
    console.error('获取评分贴详情失败:', error)
    ElMessage.error('获取评分贴详情失败')
  })
}

// 删除评分贴
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该评分贴吗？此操作将同时删除所有评分数据，不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const success = await postStore.deleteRatePost(row.id)
      if (success) {
        ElMessage.success('删除评分贴成功')
        await fetchRatePosts()
      }
    } catch (error) {
      ElMessage.error('删除评分贴失败')
    }
  }).catch(() => {})
}

// 提交表单
const submitForm = async () => {
  // 验证必填项
  if (!formState.title || !formState.category) {
    return ElMessage.warning('请填写必填项')
  }
  
  // 验证选项
  const validOptions = formState.options.filter(option => option.name.trim())
  if (validOptions.length < 2) {
    return ElMessage.warning('至少需要2个有效的评分选项')
  }
  
  submitting.value = true
  try {
    const postData = {
      title: formState.title,
      description: formState.description,
      category: formState.category,
      options: formState.options.filter(option => option.name.trim())
    }
    
    let success = false
    if (isEdit.value) {
      success = await postStore.updateRatePost(formState.id, postData)
    } else {
      const result = await postStore.createRatePost(postData)
      success = !!result
    }
    
    if (success) {
      dialogVisible.value = false
      await fetchRatePosts()
      ElMessage.success(isEdit.value ? '更新评分贴成功' : '创建评分贴成功')
    }
  } catch (error) {
    console.error('提交表单错误:', error)
  } finally {
    submitting.value = false
  }
}

// 跳转到详情页
const goToDetail = (id) => {
  router.push(`/rate-posts/${id}`)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 添加处理图片URL的方法
const getImageUrl = (url) => {
  if (!url) return '';
  
  // 定义后端服务器基础URL
  const serverBaseUrl = 'http://47.98.210.7:3000';
  
  // 如果是完整的URL（以http或https开头），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 特别处理/uploads开头的路径
  if (url.startsWith('/uploads/')) {
    // 从后端API获取图片，使用完整的服务器地址
    return `${serverBaseUrl}${url}`;
  }
  
  // 其他以斜杠开头的路径
  if (url.startsWith('/')) {
    return `${serverBaseUrl}${url}`;
  } 
  
  // 其他相对路径
  return `${serverBaseUrl}/uploads/${url}`;
};

// 修改图片上传成功的回调，确保URL处理正确
const handleAvatarSuccess = (res, option) => {
  if (res.success && res.data) {
    // 直接使用返回的URL，不要再添加前缀
    if (res.data.url) {
      option.avatar = res.data.url;
    } else if (res.data.path) {
      option.avatar = res.data.path;
    } else {
      option.avatar = res.data;
    }
    console.log('设置的图片URL:', option.avatar);
  } else {
    ElMessage.error('图片上传失败');
    console.error('上传响应:', res);
  }
};

// 图片上传前的验证
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}
</script>

<style scoped>
.rate-posts-page {
  padding: 10px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-input {
  width: 300px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.options-section {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.option-item {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.option-name, .option-avatar {
  margin-bottom: 10px;
}

.option-image-container {
  margin-top: 10px;
}

.option-image-preview {
  position: relative;
  width: 100%;
  max-width: 200px;
  height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
  background-color: #f5f7fa;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: scale-down;
  max-height: 70px;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  opacity: 0.8;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 200px;
  height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  background-color: #f5f7fa;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-text {
  margin-top: 8px;
  color: #8c939d;
}

.text-separator {
  text-align: center;
  margin: 10px 0;
  color: #909399;
  font-size: 14px;
}

.option-image-input {
  margin-top: 10px;
}
</style> 