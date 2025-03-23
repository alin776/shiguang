<template>
  <div class="tasks-page">
    <div class="page-header">
      <h1 class="page-title">任务管理</h1>
      <div class="page-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索任务名称/描述"
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
          <el-option label="更新时间" value="updated_at" />
          <el-option label="经验值" value="exp_reward" />
          <el-option label="积分" value="points_reward" />
        </el-select>
        <el-select v-model="orderDirection" placeholder="排序方向" @change="handleSearch">
          <el-option label="降序" value="DESC" />
          <el-option label="升序" value="ASC" />
        </el-select>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>添加任务
        </el-button>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <el-table :data="tasks" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="任务名称" min-width="180" />
        <el-table-column prop="description" label="任务描述" min-width="250">
          <template #default="scope">
            <div class="description-cell">{{ scope.row.description }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="任务类型" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 'post'">发帖任务</el-tag>
            <el-tag v-else-if="scope.row.type === 'comment'" type="success">评论任务</el-tag>
            <el-tag v-else-if="scope.row.type === 'checkin'" type="warning">签到任务</el-tag>
            <el-tag v-else-if="scope.row.type === 'like'" type="info">点赞任务</el-tag>
            <el-tag v-else type="danger">其他任务</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="exp_reward" label="经验奖励" width="100" />
        <el-table-column prop="points_reward" label="积分奖励" width="100" />
        <el-table-column prop="daily_limit" label="每日上限" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'active'" type="success">启用</el-tag>
            <el-tag v-else-if="scope.row.status === 'inactive'" type="info">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button size="small" @click="viewTask(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="editTask(scope.row)">编辑</el-button>
            <el-popconfirm
              title="确定要删除此任务吗？"
              @confirm="deleteTask(scope.row.id)"
              width="200"
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

    <!-- 任务详情抽屉 -->
    <el-drawer
      v-model="taskDrawer"
      title="任务详情"
      direction="rtl"
      size="500px"
    >
      <div v-if="currentTask" class="task-detail">
        <div class="task-header">
          <h2>{{ currentTask.title }}</h2>
          <div class="task-tags">
            <el-tag v-if="currentTask.type === 'post'">发帖任务</el-tag>
            <el-tag v-else-if="currentTask.type === 'comment'" type="success">评论任务</el-tag>
            <el-tag v-else-if="currentTask.type === 'checkin'" type="warning">签到任务</el-tag>
            <el-tag v-else-if="currentTask.type === 'like'" type="info">点赞任务</el-tag>
            <el-tag v-else type="danger">其他任务</el-tag>
            
            <el-tag v-if="currentTask.status === 'active'" type="success">启用</el-tag>
            <el-tag v-else-if="currentTask.status === 'inactive'" type="info">禁用</el-tag>
          </div>
        </div>

        <el-divider />

        <div class="task-info">
          <div class="task-description">
            {{ currentTask.description }}
          </div>

          <div class="task-stats">
            <div class="detail-item">
              <span class="detail-label">任务ID:</span>
              <span class="detail-value">{{ currentTask.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">经验奖励:</span>
              <span class="detail-value">{{ currentTask.exp_reward }} 点</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">积分奖励:</span>
              <span class="detail-value">{{ currentTask.points_reward || 0 }} 点</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">每日上限:</span>
              <span class="detail-value">{{ currentTask.daily_limit }} 次</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">创建时间:</span>
              <span class="detail-value">{{ formatDate(currentTask.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">更新时间:</span>
              <span class="detail-value">{{ formatDate(currentTask.updated_at) }}</span>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="task-stats">
          <h3>完成情况统计</h3>
          <div v-if="currentTask.completionStats && currentTask.completionStats.length > 0">
            <div id="completionChart" style="width: 100%; height: 300px;"></div>
          </div>
          <el-empty v-else description="暂无完成记录" />
        </div>

        <div class="drawer-actions">
          <el-button type="primary" @click="editTask(currentTask)">编辑任务</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 编辑/创建任务对话框 -->
    <el-dialog
      v-model="taskDialog"
      :title="isEdit ? '编辑任务' : '创建任务'"
      width="500px"
    >
      <el-form
        v-if="taskForm"
        ref="taskFormRef"
        :model="taskForm"
        label-width="100px"
        :rules="taskRules"
      >
        <el-form-item label="任务名称" prop="title">
          <el-input v-model="taskForm.title" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input v-model="taskForm.description" type="textarea" rows="3" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="任务类型" prop="type">
          <el-select v-model="taskForm.type" placeholder="请选择任务类型">
            <el-option label="发帖任务" value="post" />
            <el-option label="评论任务" value="comment" />
            <el-option label="签到任务" value="checkin" />
            <el-option label="点赞任务" value="like" />
          </el-select>
        </el-form-item>
        <el-form-item label="经验奖励" prop="expReward">
          <el-input-number v-model="taskForm.expReward" :min="0" :max="1000" />
        </el-form-item>
        <el-form-item label="积分奖励" prop="pointsReward">
          <el-input-number v-model="taskForm.pointsReward" :min="0" :max="1000" />
        </el-form-item>
        <el-form-item label="每日上限" prop="dailyLimit">
          <el-input-number v-model="taskForm.dailyLimit" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="taskForm.status" placeholder="请选择状态">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="taskDialog = false">取消</el-button>
          <el-button type="primary" @click="submitTaskForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { getTaskList, getTaskById, createTask, updateTask, deleteTask as apiDeleteTask } from '@/api/task'
import * as echarts from 'echarts'

// 表格数据和分页
const tasks = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

// 搜索和排序
const searchQuery = ref('')
const orderBy = ref('created_at')
const orderDirection = ref('DESC')

// 任务详情抽屉
const taskDrawer = ref(false)
const currentTask = ref(null)
let completionChart = null

// 编辑/创建任务对话框
const taskDialog = ref(false)
const taskFormRef = ref(null)
const isEdit = ref(false)
const taskForm = ref({
  title: '',
  description: '',
  type: 'post',
  expReward: 10,
  pointsReward: 0,
  dailyLimit: 1,
  status: 'active'
})

// 任务表单验证规则
const taskRules = {
  title: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '任务名称长度为2-50个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入任务描述', trigger: 'blur' },
    { min: 5, max: 200, message: '任务描述长度为5-200个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ],
  expReward: [
    { required: true, message: '请设置经验奖励', trigger: 'blur' }
  ],
  pointsReward: [
    { required: true, message: '请设置积分奖励', trigger: 'blur' }
  ],
  dailyLimit: [
    { required: true, message: '请设置每日上限', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 加载任务列表
const loadTasks = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      orderBy: orderBy.value,
      orderDirection: orderDirection.value
    }
    
    const response = await getTaskList(params)
    console.log('返回的任务数据:', response.data.tasks)
    
    // 确保积分奖励字段有默认值
    tasks.value = response.data.tasks.map(task => ({
      ...task,
      points_reward: task.points_reward !== undefined ? task.points_reward : 0
    }))
    total.value = response.data.total
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 查看任务详情
const viewTask = async (task) => {
  try {
    loading.value = true
    const response = await getTaskById(task.id)
    console.log('任务详情数据:', response.data)
    
    // 确保积分奖励字段有默认值
    currentTask.value = {
      ...response.data,
      points_reward: response.data.points_reward !== undefined ? response.data.points_reward : 0
    }
    taskDrawer.value = true
    
    // 在下一个 tick 后初始化图表
    nextTick(() => {
      if (currentTask.value.completionStats && currentTask.value.completionStats.length > 0) {
        initCompletionChart()
      }
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    ElMessage.error('获取任务详情失败')
  } finally {
    loading.value = false
  }
}

// 初始化完成情况图表
const initCompletionChart = () => {
  if (!currentTask.value || !currentTask.value.completionStats) return
  
  const chartDom = document.getElementById('completionChart')
  if (!chartDom) return
  
  if (completionChart) {
    completionChart.dispose()
  }
  
  completionChart = echarts.init(chartDom)
  
  const stats = currentTask.value.completionStats
  const dates = stats.map(item => formatShortDate(item.date))
  const counts = stats.map(item => item.count)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />完成次数: {c}'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        data: counts,
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: '#4a9eff'
        }
      }
    ]
  }
  
  completionChart.setOption(option)
}

// 打开创建任务对话框
const openCreateDialog = () => {
  isEdit.value = false
  taskForm.value = {
    title: '',
    description: '',
    type: 'post',
    expReward: 10,
    pointsReward: 0,
    dailyLimit: 1,
    status: 'active'
  }
  taskDialog.value = true
}

// 编辑任务
const editTask = (task) => {
  isEdit.value = true
  taskForm.value = {
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    expReward: task.exp_reward,
    pointsReward: task.points_reward || 0,
    dailyLimit: task.daily_limit,
    status: task.status
  }
  taskDialog.value = true
}

// 提交任务表单
const submitTaskForm = async () => {
  if (!taskFormRef.value) return
  
  try {
    await taskFormRef.value.validate()
    
    loading.value = true
    
    // 准备提交的数据
    const taskData = {
      ...taskForm.value,
      exp_reward: taskForm.value.expReward,
      points_reward: taskForm.value.pointsReward,
      daily_limit: taskForm.value.dailyLimit
    }
    
    console.log('提交的任务数据:', taskData)
    
    if (isEdit.value) {
      // 更新任务
      const response = await updateTask(taskData.id, taskData)
      console.log('更新任务响应:', response)
      ElMessage.success('任务更新成功')
    } else {
      // 创建任务
      const response = await createTask(taskData)
      console.log('创建任务响应:', response)
      ElMessage.success('任务创建成功')
    }
    
    taskDialog.value = false
    
    // 刷新任务列表
    loadTasks()
    
    // 如果任务详情抽屉打开且是编辑的任务，更新任务详情
    if (taskDrawer.value && currentTask.value && currentTask.value.id === taskForm.value.id) {
      const response = await getTaskById(taskForm.value.id)
      
      // 确保积分奖励字段有默认值
      currentTask.value = {
        ...response.data,
        points_reward: response.data.points_reward !== undefined ? response.data.points_reward : taskForm.value.pointsReward
      }
      
      // 更新图表
      nextTick(() => {
        if (currentTask.value.completionStats && currentTask.value.completionStats.length > 0) {
          initCompletionChart()
        }
      })
    }
  } catch (error) {
    console.error(isEdit.value ? '更新任务失败:' : '创建任务失败:', error)
    ElMessage.error(error.response?.data?.message || (isEdit.value ? '更新任务失败' : '创建任务失败'))
  } finally {
    loading.value = false
  }
}

// 删除任务
const deleteTask = async (id) => {
  try {
    loading.value = true
    await apiDeleteTask(id)
    ElMessage.success('删除任务成功')
    
    // 如果删除的是当前查看的任务，关闭抽屉
    if (taskDrawer.value && currentTask.value && currentTask.value.id === id) {
      taskDrawer.value = false
    }
    
    // 刷新任务列表
    loadTasks()
  } catch (error) {
    console.error('删除任务失败:', error)
    ElMessage.error('删除任务失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadTasks()
}

// 页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadTasks()
}

// 每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  loadTasks()
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

// 格式化短日期
const formatShortDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 初始加载
onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.tasks-page {
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

.description-cell {
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  max-height: 3em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

/* 任务详情抽屉样式 */
.task-detail {
  padding: 20px;
}

.task-header {
  margin-bottom: 20px;
}

.task-header h2 {
  margin: 0 0 10px 0;
  font-size: 20px;
}

.task-tags {
  display: flex;
  gap: 8px;
}

.task-info {
  margin: 20px 0;
}

.task-description {
  margin-bottom: 15px;
}

.task-stats {
  margin: 20px 0;
}

.task-stats h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
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