<template>
  <div class="task-management">
    <h1>任务管理</h1>
    
    <div class="actions">
      <el-button type="primary" @click="showCreateTaskDialog">
        <el-icon><Plus /></el-icon> 添加任务
      </el-button>
      <el-button type="primary" @click="showDailyExpLimitDialog">
        <el-icon><Setting /></el-icon> 设置每日经验上限
      </el-button>
    </div>
    
    <el-table :data="tasks" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="task_type" label="任务类型" width="120" />
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column prop="target" label="目标值" width="100" />
      <el-table-column prop="reward" label="奖励经验" width="100" />
      <el-table-column prop="is_active" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'">
            {{ scope.row.is_active ? '已启用' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            @click="showEditTaskDialog(scope.row)"
            plain
          >
            编辑
          </el-button>
          <el-button
            size="small"
            :type="scope.row.is_active ? 'danger' : 'success'"
            @click="toggleTaskStatus(scope.row)"
            plain
          >
            {{ scope.row.is_active ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 每日经验上限设置对话框 -->
    <el-dialog
      v-model="dailyExpLimitDialogVisible"
      title="设置每日经验上限"
      width="400px"
    >
      <el-form 
        :model="dailyExpForm" 
        label-width="120px"
        ref="dailyExpFormRef"
        :rules="dailyExpRules"
      >
        <el-form-item label="每日经验上限" prop="value">
          <el-input-number
            v-model="dailyExpForm.value"
            :min="10"
            :max="200"
            :step="5"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dailyExpLimitDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateDailyExpLimit">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 任务表单对话框 -->
    <el-dialog
      v-model="taskDialogVisible"
      :title="isEdit ? '编辑任务' : '添加任务'"
      width="550px"
    >
      <el-form 
        :model="taskForm" 
        label-width="120px" 
        :rules="taskRules"
        ref="taskFormRef"
      >
        <el-form-item label="任务类型" prop="task_type">
          <el-input v-model="taskForm.task_type" placeholder="如: post, comment, like" />
        </el-form-item>
        <el-form-item label="任务标题" prop="title">
          <el-input v-model="taskForm.title" placeholder="如: 发布帖子" />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input v-model="taskForm.description" placeholder="如: 在社区发布1篇帖子" />
        </el-form-item>
        <el-form-item label="目标值" prop="target">
          <el-input-number v-model="taskForm.target" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="奖励经验" prop="reward">
          <el-input-number v-model="taskForm.reward" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch
            v-model="taskForm.is_active"
            :active-value="1"
            :inactive-value="0"
          />
          <span class="status-text">{{ taskForm.is_active ? '已启用' : '已禁用' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="taskDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTaskForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Setting } from '@element-plus/icons-vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// 数据
const tasks = ref([]);
const loading = ref(false);
const dailyExpLimit = ref(50);

// 对话框状态
const taskDialogVisible = ref(false);
const dailyExpLimitDialogVisible = ref(false);
const isEdit = ref(false);

// 表单引用
const taskFormRef = ref(null);
const dailyExpFormRef = ref(null);

// 表单数据
const taskForm = ref({
  id: null,
  task_type: '',
  title: '',
  description: '',
  target: 1,
  reward: 5,
  is_active: 1
});

const dailyExpForm = ref({
  value: 50
});

// 表单验证规则
const taskRules = {
  task_type: [
    { required: true, message: '请输入任务类型', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在1到50个字符之间', trigger: 'blur' }
  ],
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在2到100个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入任务描述', trigger: 'blur' },
    { min: 2, max: 200, message: '长度在2到200个字符之间', trigger: 'blur' }
  ],
  target: [
    { required: true, message: '请设置目标值', trigger: 'blur' }
  ],
  reward: [
    { required: true, message: '请设置奖励经验', trigger: 'blur' }
  ]
};

const dailyExpRules = {
  value: [
    { required: true, message: '请设置每日经验上限', trigger: 'blur' }
  ]
};

// 获取所有任务
const fetchTasks = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.get(`${API_BASE_URL}/api/admin/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    tasks.value = response.data.tasks;
  } catch (error) {
    console.error('获取任务列表失败:', error);
    ElMessage.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取每日经验上限
const fetchDailyExpLimit = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.get(`${API_BASE_URL}/api/admin/settings/daily_exp_limit`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    dailyExpLimit.value = parseInt(response.data.value || '50');
    dailyExpForm.value.value = dailyExpLimit.value;
  } catch (error) {
    console.error('获取每日经验上限失败:', error);
    ElMessage.error('获取每日经验上限失败');
  }
};

// 显示创建任务对话框
const showCreateTaskDialog = () => {
  isEdit.value = false;
  taskForm.value = {
    task_type: '',
    title: '',
    description: '',
    target: 1,
    reward: 5,
    is_active: 1
  };
  taskDialogVisible.value = true;
};

// 显示编辑任务对话框
const showEditTaskDialog = (row) => {
  isEdit.value = true;
  taskForm.value = { ...row };
  taskDialogVisible.value = true;
};

// 提交任务表单
const submitTaskForm = async () => {
  // 表单验证
  taskFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      if (isEdit.value) {
        // 更新任务
        await axios.put(`${API_BASE_URL}/api/admin/tasks/${taskForm.value.id}`, taskForm.value, {
          headers: { Authorization: `Bearer ${token}` }
        });
        ElMessage.success('任务更新成功');
      } else {
        // 创建新任务
        await axios.post(`${API_BASE_URL}/api/admin/tasks`, taskForm.value, {
          headers: { Authorization: `Bearer ${token}` }
        });
        ElMessage.success('任务创建成功');
      }
      
      // 刷新任务列表
      taskDialogVisible.value = false;
      fetchTasks();
    } catch (error) {
      console.error('提交任务失败:', error);
      ElMessage.error('操作失败: ' + (error.response?.data?.message || '未知错误'));
    }
  });
};

// 切换任务状态
const toggleTaskStatus = async (row) => {
  const action = row.is_active ? '禁用' : '启用';
  
  try {
    const token = localStorage.getItem('adminToken');
    await ElMessageBox.confirm(`确定要${action}该任务吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await axios.patch(`${API_BASE_URL}/api/admin/tasks/${row.id}/status`, {
      is_active: row.is_active ? 0 : 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    ElMessage.success(`任务${action}成功`);
    fetchTasks();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}任务失败:`, error);
      ElMessage.error(`${action}失败: ` + (error.response?.data?.message || '未知错误'));
    }
  }
};

// 显示设置每日经验上限对话框
const showDailyExpLimitDialog = () => {
  dailyExpForm.value.value = dailyExpLimit.value;
  dailyExpLimitDialogVisible.value = true;
};

// 更新每日经验上限
const updateDailyExpLimit = async () => {
  dailyExpFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_BASE_URL}/api/admin/settings/daily_exp_limit`, {
        value: dailyExpForm.value.value.toString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      dailyExpLimit.value = dailyExpForm.value.value;
      ElMessage.success('每日经验上限设置成功');
      dailyExpLimitDialogVisible.value = false;
    } catch (error) {
      console.error('设置经验上限失败:', error);
      ElMessage.error('设置失败: ' + (error.response?.data?.message || '未知错误'));
    }
  });
};

onMounted(() => {
  fetchTasks();
  fetchDailyExpLimit();
});
</script>

<style scoped>
.task-management {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.actions {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.status-text {
  margin-left: 10px;
  font-size: 14px;
  color: #666;
}
</style> 