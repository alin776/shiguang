<template>
  <div class="notes-page">
    <div class="page-header">
      <h1 class="page-title">小记管理</h1>
      <el-button type="primary" @click="showCreateDialog">添加小记</el-button>
    </div>
    
    <el-card v-loading="loading">
      <div class="filter-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索小记内容或作者"
          clearable
          @clear="handleReset"
          style="width: 220px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="sortBy"
          @change="handleSearch"
          style="width: 150px; margin-left: 10px;"
        >
          <el-option label="最新发布" value="latest" />
          <el-option label="最早发布" value="oldest" />
        </el-select>
        
        <el-button
          @click="handleSearch"
          type="primary"
          style="margin-left: 10px;"
        >
          搜索
        </el-button>
        
        <el-button
          @click="handleReset"
          style="margin-left: 10px;"
        >
          重置
        </el-button>
      </div>
      
      <el-table
        :data="notes"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="内容" min-width="300">
          <template #default="scope">
            <div class="note-content">
              {{ scope.row.content }}
              <div v-if="scope.row.image" class="note-image">
                <el-image 
                  :src="scope.row.image" 
                  fit="cover" 
                  style="width: 60px; height: 60px; border-radius: 4px;"
                  :preview-src-list="[scope.row.image]"
                />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="author.username" label="作者" width="120" />
        <el-table-column prop="likes" label="点赞" width="80" />
        <el-table-column label="发布时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="danger" 
              @click.stop="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && (!notes || !notes.length)" description="暂无小记数据" />
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.limit"
          :small="small"
          :background="background"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @update:page-size="handleSizeChange"
          @update:current-page="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 创建小记对话框 -->
    <el-dialog
      title="添加小记"
      v-model="dialogVisible"
      width="50%"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="作者ID" prop="authorId">
          <el-input v-model.number="form.authorId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入小记内容"
          />
        </el-form-item>
        <el-form-item label="图片">
          <div class="upload-container">
            <div v-if="imageUrl" class="image-preview">
              <el-image 
                :src="imageUrl" 
                fit="cover" 
                class="preview-image"
                :preview-src-list="[imageUrl]"
              />
              <el-button class="remove-btn" type="danger" circle @click="removeImage">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-upload
              v-else
              class="image-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleImageChange"
              accept="image/*"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                选择图片
              </el-button>
              <div class="el-upload__tip">支持jpg、png格式，不超过5MB</div>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreate" :loading="submitting">添加</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNoteStore } from '@/store/note'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search, Upload, Delete } from '@element-plus/icons-vue'
import axios from 'axios'

const noteStore = useNoteStore()

const loading = computed(() => noteStore.loading)
const submitting = computed(() => noteStore.submitting)
const notes = computed(() => noteStore.notes)
const pagination = computed(() => noteStore.pagination)

// 筛选条件
const searchQuery = ref('')
const sortBy = ref('latest')

// 分页参数
const small = ref(false)
const background = ref(true)

// 新增表单
const dialogVisible = ref(false)
const formRef = ref(null)
const form = ref({
  authorId: '',
  content: '',
  image: ''
})
const formRules = {
  authorId: [
    { required: true, message: '请输入作者ID', trigger: 'blur' },
    { type: 'number', message: '作者ID必须为数字', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入小记内容', trigger: 'blur' },
    { min: 1, max: 500, message: '内容长度应在1-500个字符之间', trigger: 'blur' }
  ]
}

// 图片上传相关
const imageUrl = ref('')
const imageFile = ref(null)

// 初始化
onMounted(async () => {
  await fetchNotes()
})

// 获取小记列表
const fetchNotes = async () => {
  try {
    noteStore.setFilters({
      search: searchQuery.value,
      sort: sortBy.value
    })
    await noteStore.fetchNotes()
  } catch (error) {
    console.error('获取小记列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  fetchNotes()
}

// 重置筛选
const handleReset = () => {
  searchQuery.value = ''
  sortBy.value = 'latest'
  noteStore.setFilters({
    search: '',
    sort: 'latest'
  })
  fetchNotes()
}

// 页面大小变更
const handleSizeChange = (size) => {
  noteStore.setLimit(size)
  fetchNotes()
}

// 页码变更
const handleCurrentChange = (page) => {
  noteStore.setPage(page)
  fetchNotes()
}

// 删除小记
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该小记吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const success = await noteStore.removeNote(row.id)
      if (success) {
        await fetchNotes()
      }
    } catch (error) {
      console.error('删除小记失败:', error)
    }
  }).catch(() => {})
}

// 处理图片选择
const handleImageChange = (file) => {
  // 验证文件类型
  if (!file.raw.type.includes('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  // 验证文件大小（小于5MB）
  if (file.raw.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }
  
  imageFile.value = file.raw
  imageUrl.value = URL.createObjectURL(file.raw)
}

// 移除图片
const removeImage = () => {
  imageUrl.value = ''
  imageFile.value = null
  form.value.image = ''
}

// 上传图片
const uploadImage = async () => {
  if (!imageFile.value) return null
  
  try {
    const formData = new FormData()
    formData.append('file', imageFile.value)
    
    // 使用和前端相同的上传接口
    const token = localStorage.getItem('admin_token')
    const uploadUrl = 'http://47.98.210.7:3000/api/community/upload'
    
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data && response.data.url) {
      let url = response.data.url
      // 确保URL是完整的
      if (url && !url.startsWith('http')) {
        url = `http://47.98.210.7:3000${url}`
      }
      return url
    }
    return null
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
    return null
  }
}

// 显示创建对话框
const showCreateDialog = () => {
  form.value = {
    authorId: '',
    content: '',
    image: ''
  }
  imageUrl.value = ''
  imageFile.value = null
  dialogVisible.value = true
}

// 创建小记
const handleCreate = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 如果有图片先上传
        let uploadedImageUrl = null
        if (imageFile.value) {
          uploadedImageUrl = await uploadImage()
        }
        
        // 创建小记对象
        const noteData = {
          authorId: form.value.authorId,
          content: form.value.content,
          image: uploadedImageUrl || form.value.image
        }
        
        const result = await noteStore.addNote(noteData)
        if (result) {
          dialogVisible.value = false
          await fetchNotes()
        }
      } catch (error) {
        console.error('创建小记失败:', error)
      }
    }
  })
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
</script>

<style scoped>
.notes-page {
  padding: 10px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.note-content {
  white-space: pre-line;
  line-height: 1.5;
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-image {
  margin-top: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.upload-container {
  display: flex;
  align-items: center;
}

.image-preview {
  position: relative;
  margin-right: 10px;
}

.preview-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
}

.remove-btn {
  position: absolute;
  top: 0;
  right: 0;
}

.image-uploader {
  margin-top: 10px;
}
</style> 