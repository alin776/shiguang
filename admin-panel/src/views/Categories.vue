<template>
  <div class="categories-page">
    <div class="page-header">
      <h1 class="page-title">分类管理</h1>
      <div class="page-actions">
        <el-button type="primary" @click="showAddCategoryDialog">添加分类</el-button>
      </div>
    </div>
    
    <el-card v-loading="loading">
      <el-table :data="categories" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="posts_count" label="帖子数量" width="120">
          <template #default="scope">
            {{ scope.row.posts_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at || scope.row.createdAt || scope.row.create_time || scope.row.createTime || scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
              :disabled="scope.row.posts_count > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && (!categories || !categories.length)" description="暂无分类数据" />
    </el-card>
    
    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      :title="isEdit ? '编辑分类' : '添加分类'"
      v-model="dialogVisible"
      width="30%"
      destroy-on-close
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="categoryForm" :model="categoryForm" :rules="categoryRules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input 
            :model-value="categoryForm.name"
            @input="e => { categoryForm.name = e.target.value; }"
            @compositionend="e => { categoryForm.name = e.target.value; }"
            placeholder="请输入分类名称" 
            clearable
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
import { ref, onMounted, nextTick } from 'vue'
import { usePostStore } from '@/store/post'
import { ElMessageBox, ElMessage } from 'element-plus'

const postStore = usePostStore()
const loading = ref(false)
const submitting = ref(false)
const categories = ref([])
const categoryCounts = ref({}) // 存储每个分类的帖子数量
const dialogVisible = ref(false)
const isEdit = ref(false)

const categoryForm = ref({
  id: '',
  name: ''
})

const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ]
}

// 初始化
onMounted(async () => {
  await fetchCategories()
  await fetchAllPosts()
})

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    const result = await postStore.fetchCategories()
    console.log('分类数据:', result) // 打印分类数据
    
    // 调试输出各个分类的时间字段
    if (result && result.length > 0) {
      console.log('第一个分类的时间字段:',
        '创建时间:', result[0].created_at,
        '创建时间(驼峰):', result[0].createdAt,
        '创建时间(其他格式):', result[0].create_time, result[0].createTime, result[0].time
      )
    }
    
    categories.value = result || []
  } catch (error) {
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

// 获取所有帖子并统计每个分类的帖子数量
const fetchAllPosts = async () => {
  try {
    const posts = await postStore.fetchAllPosts()
    
    // 统计每个分类的帖子数量
    const counts = {}
    posts.forEach(post => {
      if (post.category_id) {
        counts[post.category_id] = (counts[post.category_id] || 0) + 1
      }
    })
    
    categoryCounts.value = counts
    console.log('分类帖子统计:', counts)
    
    // 更新分类数据，添加帖子计数
    categories.value = categories.value.map(category => ({
      ...category,
      posts_count: counts[category.id] || 0
    }))
  } catch (error) {
    console.error('统计分类帖子数量失败:', error)
  }
}

// 显示添加分类对话框
const showAddCategoryDialog = () => {
  isEdit.value = false
  // 直接设置简单值，避免深层响应式嵌套
  categoryForm.value = { id: '', name: '' }
  // 使用nextTick确保DOM更新后再显示对话框
  nextTick(() => {
    dialogVisible.value = true
  })
}

// 编辑分类
const handleEdit = (row) => {
  isEdit.value = true
  // 直接设置简单值，避免深层响应式嵌套
  categoryForm.value = { id: row.id, name: row.name }
  // 使用nextTick确保DOM更新后再显示对话框
  nextTick(() => {
    dialogVisible.value = true
  })
}

// 删除分类
const handleDelete = (row) => {
  // 检查分类是否有关联的帖子
  const postsCount = categoryCounts.value[row.id] || 0
  if (postsCount > 0) {
    ElMessage.warning('该分类下有帖子，不能删除')
    return
  }
  
  ElMessageBox.confirm('确定要删除该分类吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const success = await postStore.removeCategory(row.id)
      if (success) {
        await fetchCategories()
        await fetchAllPosts() // 重新统计帖子数量
      }
    } catch (error) {
      ElMessage.error('删除分类失败')
    }
  }).catch(() => {})
}

// 提交表单
const submitForm = async () => {
  submitting.value = true
  try {
    const success = isEdit.value
      ? await postStore.editCategory(categoryForm.value.id, { name: categoryForm.value.name })
      : await postStore.addCategory({ name: categoryForm.value.name });
    
    if (success) {
      ElMessage.success(isEdit.value ? '更新分类成功' : '添加分类成功');
      // 关闭对话框
      dialogVisible.value = false;
      // 重新加载数据
      await fetchCategories();
      await fetchAllPosts();
    }
  } catch (error) {
    console.error('表单提交错误:', error);
    ElMessage.error(isEdit.value ? '更新分类失败' : '添加分类失败');
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
.categories-page {
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

.page-header .page-actions {
  display: flex;
  gap: 10px;
}

.el-card {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 