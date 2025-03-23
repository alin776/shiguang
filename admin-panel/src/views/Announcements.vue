<template>
  <div class="announcements-page">
    <div class="page-header">
      <h1 class="page-title">公告管理</h1>
      <el-button type="primary" @click="handleCreateAnnouncement">
        <el-icon><Plus /></el-icon> 添加公告
      </el-button>
    </div>
    
    <div class="card">
      <el-table
        v-loading="loading"
        :data="announcements"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column label="内容" min-width="300">
          <template #default="scope">
            <div class="content-preview">{{ scope.row.content }}</div>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="120">
          <template #default="scope">
            <div class="images-preview" v-if="scope.row.images && scope.row.images.length">
              <el-image 
                style="width: 60px; height: 60px;"
                :src="scope.row.images[0]"
                :preview-src-list="scope.row.images"
                fit="cover"
              />
              <span v-if="scope.row.images.length > 1" class="image-count">+{{ scope.row.images.length - 1 }}</span>
            </div>
            <span v-else>无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" plain @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" plain @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="pagination.total"
          :page-size="pagination.limit"
          :current-page="pagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </div>
    
    <!-- 创建/编辑公告对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑公告' : '创建公告'"
      width="650px"
      destroy-on-close
    >
      <el-form :model="announcementForm" label-width="80px" ref="announcementFormRef">
        <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '请输入标题', trigger: 'blur' }]">
          <el-input v-model="announcementForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        
        <el-form-item label="内容" prop="content" :rules="[{ required: true, message: '请输入内容', trigger: 'blur' }]">
          <el-input
            v-model="announcementForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入公告内容"
          />
        </el-form-item>
        
        <el-form-item label="图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="5"
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持jpg、png格式，最多5张图片</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ isEditing ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { 
  getAnnouncements, 
  createAnnouncement as createAnnouncementApi, 
  updateAnnouncement as updateAnnouncementApi, 
  deleteAnnouncement as deleteAnnouncementApi 
} from '@/api/announcement'

// 公告列表数据
const announcements = ref([])
const loading = ref(false)
const pagination = reactive({
  total: 0,
  page: 1,
  limit: 10
})

// 对话框相关状态
const dialogVisible = ref(false)
const isEditing = ref(false)
const announcementForm = reactive({
  id: null,
  title: '',
  content: '',
  images: []
})
const announcementFormRef = ref(null)
const fileList = ref([])
const submitting = ref(false)

// 获取公告列表
const fetchAnnouncements = async () => {
  try {
    loading.value = true
    console.log('正在获取公告列表，参数:', { page: pagination.page, limit: pagination.limit })
    
    const response = await getAnnouncements({
      page: pagination.page,
      limit: pagination.limit
    })
    
    console.log('公告API响应完整数据:', response)
    console.log('公告API响应数据:', response.data)
    
    // 检查并设置公告数据
    if (response.data && response.data.announcements) {
      console.log('使用response.data.announcements作为公告列表')
      announcements.value = response.data.announcements
    } else if (Array.isArray(response.data)) {
      console.log('使用response.data数组作为公告列表')
      // 如果直接返回数组，则使用数组作为公告列表
      announcements.value = response.data
    } else {
      console.log('无法获取公告列表，使用空数组')
      announcements.value = []
    }
    
    // 检查并设置分页数据
    if (response.data && response.data.pagination && response.data.pagination.total !== undefined) {
      console.log('使用response.data.pagination.total作为总数:', response.data.pagination.total)
      pagination.total = response.data.pagination.total
    } else if (response.data && response.data.total !== undefined) {
      console.log('使用response.data.total作为总数:', response.data.total)
      // 处理分页数据可能在顶层的情况
      pagination.total = response.data.total
    } else {
      console.log('无法获取总数，使用当前数据长度:', announcements.value.length)
      // 无法获取总数时，默认为当前数据长度
      pagination.total = announcements.value.length
    }
  } catch (error) {
    console.error('获取公告列表失败:', error)
    if (error.response) {
      console.error('错误响应数据:', error.response.data)
      console.error('错误状态码:', error.response.status)
    }
    ElMessage.error(`获取公告列表失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 创建公告
const createAnnouncement = async (formData) => {
  try {
    submitting.value = true
    const response = await createAnnouncementApi(formData)
    ElMessage.success('公告创建成功')
    fetchAnnouncements()
    return true
  } catch (error) {
    console.error('创建公告失败:', error)
    ElMessage.error('创建公告失败: ' + (error.response?.data?.message || error.message))
    return false
  } finally {
    submitting.value = false
  }
}

// 更新公告
const updateAnnouncement = async (id, formData) => {
  try {
    submitting.value = true
    const response = await updateAnnouncementApi(id, formData)
    ElMessage.success('公告更新成功')
    fetchAnnouncements()
    return true
  } catch (error) {
    console.error('更新公告失败:', error)
    ElMessage.error('更新公告失败: ' + (error.response?.data?.message || error.message))
    return false
  } finally {
    submitting.value = false
  }
}

// 删除公告
const deleteAnnouncement = async (id) => {
  try {
    loading.value = true
    await deleteAnnouncementApi(id)
    ElMessage.success('公告删除成功')
    fetchAnnouncements()
  } catch (error) {
    console.error('删除公告失败:', error)
    ElMessage.error('删除公告失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchAnnouncements()
}

// 打开创建公告对话框
const handleCreateAnnouncement = () => {
  isEditing.value = false
  announcementForm.id = null
  announcementForm.title = ''
  announcementForm.content = ''
  announcementForm.images = []
  fileList.value = []
  dialogVisible.value = true
}

// 打开编辑公告对话框
const handleEdit = (announcement) => {
  isEditing.value = true
  announcementForm.id = announcement.id
  announcementForm.title = announcement.title
  announcementForm.content = announcement.content
  announcementForm.images = announcement.images || []
  
  // 准备现有图片的文件列表
  fileList.value = (announcement.images || []).map((url, index) => ({
    name: `现有图片${index + 1}`,
    url,
    status: 'success',
    uid: index,
    existingImage: true
  }))
  
  dialogVisible.value = true
}

// 处理删除操作
const handleDelete = (announcement) => {
  ElMessageBox.confirm(
    `确定要删除公告 "${announcement.title}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  .then(() => {
    deleteAnnouncement(announcement.id)
  })
  .catch(() => {})
}

// 处理文件选择变化
const handleFileChange = (uploadFile, uploadFiles) => {
  // 直接设置fileList为当前的上传文件列表
  fileList.value = uploadFiles;
  console.log('文件列表已更新:', uploadFiles);
}

// 处理文件移除
const handleFileRemove = (file) => {
  if (file.existingImage) {
    // 移除已有图片
    const index = announcementForm.images.indexOf(file.url)
    if (index > -1) {
      announcementForm.images.splice(index, 1)
    }
  }
}

// 提交表单
const submitForm = async () => {
  if (!announcementFormRef.value) return
  
  await announcementFormRef.value.validate(async (valid) => {
    if (!valid) return false
    
    // 准备表单数据
    const formData = new FormData()
    formData.append('title', announcementForm.title)
    formData.append('content', announcementForm.content)
    
    // 添加现有的图片
    if (isEditing.value && announcementForm.images.length > 0) {
      formData.append('existingImages', JSON.stringify(announcementForm.images))
    }
    
    // 添加新上传的文件
    fileList.value.forEach(file => {
      if (!file.existingImage && file.raw) {
        formData.append('images', file.raw)
      }
    })
    
    // 提交表单
    let success = false
    if (isEditing.value) {
      success = await updateAnnouncement(announcementForm.id, formData)
    } else {
      success = await createAnnouncement(formData)
    }
    
    if (success) {
      dialogVisible.value = false
    }
  })
}

// 格式化日期时间
const formatDateTime = (dateString) => {
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

// 页面加载时获取数据
onMounted(() => {
  fetchAnnouncements()
})
</script>

<style scoped>
.announcements-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.content-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: 40px;
}

.images-preview {
  position: relative;
}

.image-count {
  position: absolute;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 2px 6px;
  font-size: 12px;
  border-radius: 0 0 4px 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 