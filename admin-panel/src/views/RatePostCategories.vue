<template>
  <div class="rate-post-categories-page">
    <div class="page-header">
      <h1 class="page-title">评分贴分类管理</h1>
      <div class="page-actions">
        <el-button type="primary" @click="showAddCategoryDialog">添加分类</el-button>
      </div>
    </div>
    
    <el-card v-loading="loading">
      <el-table :data="categories" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="name" label="分类名称" width="180" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="display_order" label="显示顺序" width="100">
          <template #default="scope">
            {{ scope.row.display_order || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && (!categories || !categories.length)" description="暂无评分贴分类数据" />
    </el-card>
    
    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      :title="isEdit ? '编辑评分贴分类' : '添加评分贴分类'"
      v-model="dialogVisible"
      width="30%"
      destroy-on-close
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="categoryForm" :model="formState" :rules="categoryRules" label-width="100px">
        <el-form-item label="分类ID" prop="id" v-if="!isEdit">
          <el-input 
            v-model="formState.id" 
            placeholder="请输入分类ID，英文小写" 
            clearable
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input 
            v-model="formState.name" 
            placeholder="请输入分类名称" 
            clearable
          />
        </el-form-item>
        <el-form-item label="分类描述" prop="description">
          <el-input 
            v-model="formState.description" 
            placeholder="请输入分类描述" 
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="显示顺序" prop="display_order">
          <el-input-number 
            v-model="formState.display_order" 
            :min="0" 
            :max="999"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch
            v-model="formState.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
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
import { ref, onMounted, reactive } from 'vue'
import { usePostStore } from '@/store/post'
import { ElMessageBox, ElMessage } from 'element-plus'

const postStore = usePostStore()
const loading = ref(false)
const submitting = ref(false)
const categories = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)

const formState = reactive({
  id: '',
  name: '',
  description: '',
  display_order: 0,
  is_active: true
})

const categoryRules = {
  id: [
    { required: true, message: '请输入分类ID', trigger: 'blur' },
    { pattern: /^[a-z0-9_-]+$/, message: '分类ID只能包含小写字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 100, message: '长度不能超过 100 个字符', trigger: 'blur' }
  ]
}

// 添加一个debounce防抖函数以优化表单输入的性能
const debounce = (fn, delay = 300) => {
  let timer = null
  return function() {
    if (timer) clearTimeout(timer)
    const args = arguments
    const context = this
    timer = setTimeout(() => {
      fn.apply(context, args)
    }, delay)
  }
}

// 初始化
onMounted(async () => {
  await fetchRatePostCategories()
})

// 获取评分贴分类列表
const fetchRatePostCategories = async () => {
  loading.value = true
  try {
    const result = await postStore.fetchRatePostCategories()
    console.log('评分贴分类数据:', result)
    categories.value = result || []
  } catch (error) {
    ElMessage.error('获取评分贴分类列表失败')
  } finally {
    loading.value = false
  }
}

// 重置表单的函数
const resetForm = () => {
  formState.id = ''
  formState.name = ''
  formState.description = ''
  formState.display_order = 0
  formState.is_active = true
}

// 显示添加分类对话框
const showAddCategoryDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (row) => {
  isEdit.value = true
  formState.id = row.id
  formState.name = row.name
  formState.description = row.description || ''
  formState.display_order = row.display_order || 0
  formState.is_active = row.is_active === undefined ? true : Boolean(row.is_active)
  dialogVisible.value = true
}

// 删除分类
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该评分贴分类吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const success = await postStore.removeRatePostCategory(row.id)
      if (success) {
        await fetchRatePostCategories()
      }
    } catch (error) {
      ElMessage.error('删除评分贴分类失败')
    }
  }).catch(() => {})
}

// 提交表单
const submitForm = async () => {
  submitting.value = true
  try {
    const formData = {
      name: formState.name,
      description: formState.description,
      display_order: formState.display_order,
      is_active: formState.is_active ? 1 : 0
    }
    
    const success = isEdit.value
      ? await postStore.editRatePostCategory(formState.id, formData)
      : await postStore.addRatePostCategory({
          id: formState.id,
          ...formData
        });
    
    if (success) {
      ElMessage.success(isEdit.value ? '更新评分贴分类成功' : '添加评分贴分类成功');
      // 关闭对话框
      dialogVisible.value = false;
      // 重新加载数据
      await fetchRatePostCategories();
    }
  } catch (error) {
    console.error('表单提交错误:', error);
    ElMessage.error(isEdit.value ? '更新评分贴分类失败' : '添加评分贴分类失败');
  } finally {
    submitting.value = false;
  }
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
.rate-post-categories-page {
  padding: 10px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style> 