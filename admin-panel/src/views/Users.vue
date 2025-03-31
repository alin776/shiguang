<template>
  <div class="users-page">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <div class="page-actions">
        <el-button 
          type="primary" 
          @click="recalculateAllTitles" 
          :loading="recalculateLoading" 
          class="recalculate-btn"
        >
          重新计算称号
        </el-button>
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名/邮箱/手机"
          class="search-input"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <el-icon class="search-icon" @click="handleSearch"><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="orderBy" placeholder="排序字段" @change="handleSearch">
          <el-option label="创建时间" value="created_at" />
          <el-option label="最后登录时间" value="last_login_at" />
          <el-option label="用户名" value="username" />
          <el-option label="经验值" value="exp_points" />
        </el-select>
        <el-select v-model="orderDirection" placeholder="排序方向" @change="handleSearch">
          <el-option label="降序" value="DESC" />
          <el-option label="升序" value="ASC" />
        </el-select>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <el-table :data="users" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机" width="120" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.role === 'admin'" type="danger">管理员</el-tag>
            <el-tag v-else-if="scope.row.role === 'moderator'" type="warning">版主</el-tag>
            <el-tag v-else type="info">普通用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status === '已启用'" type="success">在线</el-tag>
            <el-tag v-else-if="scope.row.status === 'suspended'" type="warning">已冻结</el-tag>
            <el-tag v-else type="danger">离线</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="100">
          <template #default="scope">
            <el-tag type="info">Lv.{{ scope.row.level || 1 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100">
          <template #default="scope">
            <span>{{ scope.row.points || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="称号" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.title" type="success">{{ scope.row.title }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="180">
          <template #default="scope">
            {{ scope.row.lastLoginAt ? formatDate(scope.row.lastLoginAt) : '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column prop="experience" label="经验值" width="100" />
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="scope">
            <el-button size="small" @click="viewUser(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="editUser(scope.row)">编辑</el-button>
            <el-popconfirm
              title="确定要删除此用户吗？"
              @confirm="deleteUser(scope.row.id)"
              width="220"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 用户详情抽屉 -->
    <el-drawer
      v-model="userDrawer"
      title="用户详情"
      direction="rtl"
      size="500px"
    >
      <div v-if="currentUser" class="user-detail">
        <div class="user-header">
          <el-avatar :size="80" :src="currentUser.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
          <div class="user-info">
            <h2>{{ currentUser.username }}</h2>
            <p>{{ currentUser.email }}</p>
            <div class="user-tags">
              <el-tag v-if="currentUser.role === 'admin'" type="danger">管理员</el-tag>
              <el-tag v-else-if="currentUser.role === 'moderator'" type="warning">版主</el-tag>
              <el-tag v-else type="info">普通用户</el-tag>
              
              <el-tag v-if="currentUser.status === '已启用'" type="success">在线</el-tag>
              <el-tag v-else-if="currentUser.status === 'suspended'" type="warning">已冻结</el-tag>
              <el-tag v-else type="danger">离线</el-tag>
              
              <el-tag v-if="currentUser.title" type="success">{{ currentUser.title }}</el-tag>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="user-stats">
          <div class="stat-item">
            <div class="stat-value">{{ currentUser.stats?.posts || 0 }}</div>
            <div class="stat-label">发帖数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ currentUser.stats?.comments || 0 }}</div>
            <div class="stat-label">评论数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ currentUser.stats?.likesReceived || 0 }}</div>
            <div class="stat-label">获赞数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ currentUser.experience || 0 }}</div>
            <div class="stat-label">经验值</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ currentUser.points || 0 }}</div>
            <div class="stat-label">积分</div>
          </div>
        </div>

        <el-divider />

        <div class="user-details">
          <div class="detail-item">
            <span class="detail-label">用户ID:</span>
            <span class="detail-value">{{ currentUser.id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">手机号:</span>
            <span class="detail-value">{{ currentUser.phone || '未设置' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">注册时间:</span>
            <span class="detail-value">{{ formatDate(currentUser.createdAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">最后登录:</span>
            <span class="detail-value">{{ currentUser.lastLoginAt ? formatDate(currentUser.lastLoginAt) : '从未登录' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">用户称号:</span>
            <span class="detail-value">
              <el-tag v-if="currentUser.title" type="success">{{ currentUser.title }}</el-tag>
              <span v-else>未获得称号</span>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">连续发帖:</span>
            <span class="detail-value">{{ currentUser.post_streak || 0 }}天</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">个人简介:</span>
            <span class="detail-value">{{ currentUser.bio || '暂无简介' }}</span>
          </div>
        </div>

        <div class="drawer-actions">
          <el-button type="primary" @click="editUser(currentUser)">编辑用户</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="editDialog"
      title="编辑用户信息"
      width="500px"
    >
      <el-form
        v-if="editForm"
        ref="editFormRef"
        :model="editForm"
        label-width="100px"
      >
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" maxlength="20" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" placeholder="请选择角色">
            <el-option label="普通用户" value="user" />
            <el-option label="版主" value="moderator" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="请选择状态">
            <el-option label="在线" value="已启用" />
            <el-option label="已冻结" value="suspended" />
            <el-option label="离线" value="已禁用" />
          </el-select>
        </el-form-item>
        <el-form-item label="经验值">
          <el-input-number v-model="editForm.experience" :min="0" :max="99999" />
        </el-form-item>
        <el-form-item label="积分">
          <el-input-number v-model="editForm.points" :min="0" :max="99999" />
        </el-form-item>
        <el-form-item label="用户称号">
          <el-input v-model="editForm.title" placeholder="如: 持之以恒, 巅峰大神" maxlength="50">
            <template #append>
              <el-tooltip content="连续发帖5天获得'持之以恒'称号,每日发帖最多的用户获得'巅峰大神'称号">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="editForm.bio" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialog = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, QuestionFilled } from '@element-plus/icons-vue'
import { getUserList, getUserById, updateUser, deleteUser as apiDeleteUser, recalculateAllTitles as apiRecalculateAllTitles } from '@/api/user'

// 表格数据和分页
const users = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

// 搜索和排序
const searchQuery = ref('')
const orderBy = ref('created_at')
const orderDirection = ref('DESC')

// 用户详情抽屉
const userDrawer = ref(false)
const currentUser = ref(null)

// 编辑用户对话框
const editDialog = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  username: '',
  email: '',
  phone: '',
  bio: '',
  role: 'user',
  status: '已启用',
  experience: 0
})

// 重新计算称号相关
const recalculateLoading = ref(false)

// 重新计算所有用户称号
const recalculateAllTitles = async () => {
  try {
    recalculateLoading.value = true
    await ElMessageBox.confirm(
      '确定要重新计算所有用户称号吗？此操作将使用系统规则为所有用户重新分配称号。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await apiRecalculateAllTitles()
    ElMessage.success('用户称号计算成功')
    
    // 刷新用户列表
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新计算用户称号失败:', error)
      ElMessage.error('重新计算用户称号失败')
    }
  } finally {
    recalculateLoading.value = false
  }
}

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      orderBy: orderBy.value,
      orderDirection: orderDirection.value
    }
    
    const response = await getUserList(params)
    users.value = response.data.users
    total.value = response.data.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 查看用户详情
const viewUser = async (user) => {
  try {
    loading.value = true
    const response = await getUserById(user.id)
    currentUser.value = response.data
    userDrawer.value = true
  } catch (error) {
    console.error('获取用户详情失败:', error)
    ElMessage.error('获取用户详情失败')
  } finally {
    loading.value = false
  }
}

// 编辑用户
const editUser = (user) => {
  editForm.value = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone || '',
    bio: user.bio || '',
    role: user.role || 'user',
    status: user.status || '已启用',
    experience: user.experience || 0,
    points: user.points || 0,
    title: user.title || '',
    post_streak: user.post_streak || 0
  }
  editDialog.value = true
}

// 提交编辑表单
const submitEditForm = async () => {
  if (!editFormRef.value) return
  
  try {
    // 不进行表单验证，直接提交
    loading.value = true
    
    // 构建要提交的用户数据
    const userData = {
      ...editForm.value,
      // 确保只使用正确的经验值字段名
      experience: editForm.value.experience,
      points: editForm.value.points
    }
    
    console.log('提交的用户数据:', userData)
    await updateUser(userData.id, userData)
    
    ElMessage.success('用户信息更新成功')
    editDialog.value = false
    
    // 刷新用户列表
    loadUsers()
    
    // 如果用户详情抽屉打开，更新用户详情
    if (userDrawer.value && currentUser.value && currentUser.value.id === editForm.value.id) {
      const response = await getUserById(editForm.value.id)
      currentUser.value = response.data
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    ElMessage.error(error.response?.data?.message || '更新用户信息失败')
  } finally {
    loading.value = false
  }
}

// 删除用户
const deleteUser = async (id) => {
  try {
    loading.value = true
    await apiDeleteUser(id)
    ElMessage.success('删除用户成功')
    
    // 如果删除的是当前查看的用户，关闭抽屉
    if (userDrawer.value && currentUser.value && currentUser.value.id === id) {
      userDrawer.value = false
    }
    
    // 刷新用户列表
    loadUsers()
  } catch (error) {
    console.error('删除用户失败:', error)
    ElMessage.error('删除用户失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

// 页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadUsers()
}

// 每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  loadUsers()
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

// 初始加载
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-page {
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
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 250px;
}

.recalculate-btn {
  margin-right: 10px;
}

.search-icon {
  cursor: pointer;
}

.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

/* 用户详情抽屉样式 */
.user-detail {
  padding: 20px;
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.user-info {
  margin-left: 20px;
}

.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.user-info p {
  margin: 0 0 8px 0;
  color: #606266;
}

.user-tags {
  display: flex;
  gap: 8px;
}

.user-stats {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  margin-top: 5px;
  font-size: 14px;
  color: #909399;
}

.user-details {
  margin: 20px 0;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
}

.detail-label {
  width: 100px;
  color: #909399;
}

.detail-value {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.drawer-actions {
  margin-top: 30px;
  text-align: center;
}
</style> 