<template>
  <div class="activities-page">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <h2>活动管理</h2>
          <el-button type="primary" @click="openActivityDialog(null)">
            <el-icon><Plus /></el-icon>
            创建新活动
          </el-button>
        </div>
      </template>

      <!-- 搜索和筛选区域 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索活动标题"
          class="search-input"
          clearable
          @input="filterActivities"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          clearable
          @change="filterActivities"
        >
          <el-option label="全部" value="" />
          <el-option label="进行中" value="active" />
          <el-option label="已结束" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </div>

      <!-- 活动列表 -->
      <el-table
        v-loading="loading"
        :data="filteredActivities"
        border
        style="width: 100%"
        stripe
      >
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="封面图" width="100">
          <template #default="scope">
            <el-image
              style="width: 80px; height: 45px"
              :src="getImageUrl(scope.row.cover_image)"
              :preview-src-list="[getImageUrl(scope.row.cover_image)]"
              fit="cover"
            >
              <template #error>
                <div class="image-placeholder">无图片</div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip />
        <el-table-column label="地点" prop="location" min-width="120" show-overflow-tooltip />
        <el-table-column label="开始时间" min-width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" min-width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column label="参与人数" width="100">
          <template #default="scope">
            {{ scope.row.current_participants }}/{{ scope.row.max_participants }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              effect="plain"
              size="small"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              link
              @click="openActivityDialog(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              link
              @click="deleteActivity(scope.row)"
            >
              删除
            </el-button>
            <el-button
              v-if="scope.row.status === 'active'"
              size="small"
              type="warning"
              link
              @click="updateActivityStatus(scope.row.id, 'cancelled')"
            >
              取消
            </el-button>
            <el-button
              v-if="scope.row.status === 'cancelled'"
              size="small"
              type="success"
              link
              @click="updateActivityStatus(scope.row.id, 'active')"
            >
              恢复
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="totalActivities"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑活动对话框 -->
    <el-dialog
      v-model="activityDialog"
      :title="isEdit ? '编辑活动' : '创建活动'"
      width="600px"
    >
      <el-form
        v-if="activityForm"
        ref="activityFormRef"
        :model="activityForm"
        :rules="activityRules"
        label-width="100px"
      >
        <el-form-item label="活动标题" prop="title">
          <el-input v-model="activityForm.title" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="活动地点" prop="location">
          <el-input v-model="activityForm.location" maxlength="100" />
        </el-form-item>

        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="activityForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="activityForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="封面图片" prop="coverImage">
          <el-upload
            class="avatar-uploader"
            :action="uploadImageUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :before-upload="beforeCoverUpload"
            name="file"
          >
            <img
              v-if="activityForm.coverImage"
              :src="getImageUrl(activityForm.coverImage)"
              class="cover-preview"
            />
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">
            推荐尺寸: 800x400，大小不超过2MB
          </div>
        </el-form-item>

        <el-form-item label="最大人数" prop="maxParticipants">
          <el-input-number
            v-model="activityForm.maxParticipants"
            :min="1"
            :max="1000"
          />
        </el-form-item>

        <el-form-item label="活动状态" prop="status">
          <el-select v-model="activityForm.status">
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>

        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="activityForm.description"
            type="textarea"
            :rows="6"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="activityDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitActivity">
            {{ isEdit ? '保存修改' : '创建活动' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { 
  Plus, 
  Search, 
  UploadFilled, 
  Delete, 
  Edit 
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { useUserStore } from '../store/user';

const userStore = useUserStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://47.98.210.7:3000';

// 添加调试日志
console.log('API基础URL:', apiBaseUrl);

const loading = ref(false);
const submitting = ref(false);
const activities = ref([]);
const filteredActivities = ref([]);
const searchQuery = ref('');
const statusFilter = ref('');
const totalActivities = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 活动表单相关
const activityDialog = ref(false);
const activityFormRef = ref(null);
const activityForm = ref(null);
const isEdit = ref(false);

// 上传请求头
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${userStore.token}`,
  'Accept': 'application/json, text/plain, */*'
}));

// 获取上传图片的URL
const uploadImageUrl = computed(() => {
  return `${apiBaseUrl}/api/upload/cover`;
});

// 活动表单验证规则
const activityRules = {
  title: [
    { required: true, message: '请输入活动标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入活动地点', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入活动描述', trigger: 'blur' }
  ],
  maxParticipants: [
    { required: true, message: '请输入最大参与人数', trigger: 'blur' }
  ]
};

// 获取活动列表
const fetchActivities = async () => {
  try {
    // 检查 token 是否存在
    if (!userStore.token) {
      console.error('无法获取活动：未登录或令牌不存在');
      ElMessage.error('请先登录');
      return;
    }
    
    loading.value = true;
    const offset = (currentPage.value - 1) * pageSize.value;
    
    console.log('发送请求时的认证令牌:', userStore.token.substring(0, 20) + '...');
    
    // 构建完整URL
    const requestUrl = `${apiBaseUrl}/api/activities`;
    console.log('完整请求URL:', requestUrl + `?limit=${pageSize.value}&offset=${offset}`);
    
    const response = await fetch(
      `${requestUrl}?limit=${pageSize.value}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userStore.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*'
        },
        mode: 'cors', // 启用CORS
        cache: 'no-cache' // 禁用缓存
      }
    );
    
    if (!response.ok) {
      // 尝试获取详细的错误信息
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || `服务器错误: ${response.status}`);
      } else {
        // 如果不是 JSON 响应，获取文本内容
        const errorText = await response.text();
        console.error('非 JSON 响应:', errorText.substring(0, 150) + '...');
        throw new Error(`服务器返回非 JSON 响应 (${response.status})`);
      }
    }
    
    const data = await response.json();
    
    activities.value = data.data || [];
    filteredActivities.value = activities.value;
    
    // 计算总数，这里简化处理
    totalActivities.value = data.total || activities.value.length;
    
    filterActivities();
  } catch (error) {
    console.error('获取活动失败:', error);
    ElMessage.error(error.message || '获取活动列表失败');
  } finally {
    loading.value = false;
  }
};

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 获取图片URL
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${apiBaseUrl}/uploads/covers/${path}`;
};

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'completed': return 'info';
    case 'cancelled': return 'danger';
    default: return 'info';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'active': return '进行中';
    case 'completed': return '已结束';
    case 'cancelled': return '已取消';
    default: return '未知';
  }
};

// 过滤活动
const filterActivities = () => {
  const query = searchQuery.value.toLowerCase();
  
  filteredActivities.value = activities.value.filter(activity => {
    const matchQuery = !query || activity.title.toLowerCase().includes(query);
    const matchStatus = !statusFilter.value || activity.status === statusFilter.value;
    
    return matchQuery && matchStatus;
  });
};

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page;
  fetchActivities();
};

// 打开活动对话框
const openActivityDialog = (activity) => {
  isEdit.value = !!activity;
  
  if (activity) {
    activityForm.value = {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      location: activity.location,
      startTime: formatDateTime(activity.start_time),
      endTime: formatDateTime(activity.end_time),
      coverImage: activity.cover_image,
      maxParticipants: activity.max_participants,
      status: activity.status
    };
  } else {
    // 创建新活动
    activityForm.value = {
      title: '',
      description: '',
      location: '',
      startTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      coverImage: '',
      maxParticipants: 100,
      status: 'active'
    };
  }
  
  activityDialog.value = true;
};

// 处理上传成功
const handleCoverSuccess = (response) => {
  console.log('上传图片成功:', response);
  // 根据后端API返回格式调整
  if (response.data && response.data.path) {
    activityForm.value.coverImage = response.data.path;
  } else if (response.path) {
    activityForm.value.coverImage = response.path;
  } else if (response.url) {
    activityForm.value.coverImage = response.url;
  } else if (response.data && response.data.url) {
    activityForm.value.coverImage = response.data.url;
  } else {
    ElMessage.warning('无法获取上传图片路径，请联系管理员');
    console.error('无法从响应中获取图片路径:', response);
  }
};

// 上传前检查
const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('上传文件必须是图片!');
    return false;
  }

  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }

  return true;
};

// 提交活动表单
const submitActivity = async () => {
  try {
    // 表单验证
    await activityFormRef.value.validate();
    
    submitting.value = true;
    
    // 构建请求数据
    const formData = {
      title: activityForm.value.title,
      location: activityForm.value.location,
      description: activityForm.value.description,
      startTime: dayjs(activityForm.value.startTime).format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs(activityForm.value.endTime).format('YYYY-MM-DD HH:mm:ss'),
      maxParticipants: parseInt(activityForm.value.maxParticipants),
      status: activityForm.value.status,
      coverImage: activityForm.value.coverImage || ''
    };
    
    console.log('提交的表单数据:', formData);
    
    let response;
    
    if (isEdit.value) {
      // 更新活动
      const updateUrl = `${apiBaseUrl}/api/activities/${activityForm.value.id}`;
      console.log('更新活动请求URL:', updateUrl);
      response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`,
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify(formData),
        mode: 'cors',
        cache: 'no-cache'
      });
    } else {
      // 创建活动
      const createUrl = `${apiBaseUrl}/api/activities`;
      console.log('创建活动请求URL:', createUrl);
      response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`,
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify(formData),
        mode: 'cors',
        cache: 'no-cache'
      });
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '操作失败');
    }
    
    ElMessage.success(isEdit.value ? '更新活动成功' : '创建活动成功');
    activityDialog.value = false;
    fetchActivities();
  } catch (error) {
    console.error('提交活动失败:', error);
    ElMessage.error(error.message || '操作失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

// 删除活动
const deleteActivity = async (activity) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除活动 "${activity.title}" 吗？此操作不可逆。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 删除活动
    const deleteUrl = `${apiBaseUrl}/api/activities/${activity.id}`;
    console.log('删除活动请求URL:', deleteUrl);
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除活动失败');
    }
    
    ElMessage.success('删除活动成功');
    fetchActivities();
  } catch (error) {
    if (error === 'cancel') return;
    console.error('删除活动失败:', error);
    ElMessage.error(error.message || '删除失败，请稍后重试');
  }
};

// 更新活动状态
const updateActivityStatus = async (id, status) => {
  try {
    const confirmMsg = status === 'cancelled' 
      ? '确定要取消该活动吗？' 
      : '确定要将活动状态更改为' + getStatusText(status) + '吗？';
    
    await ElMessageBox.confirm(
      confirmMsg,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 更新活动状态
    const statusUrl = `${apiBaseUrl}/api/activities/${id}`;
    console.log('更新活动状态请求URL:', statusUrl);
    
    const response = await fetch(statusUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`,
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify({ status }),
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新活动状态失败');
    }
    
    ElMessage.success('更新活动状态成功');
    fetchActivities();
  } catch (error) {
    if (error === 'cancel') return;
    console.error('更新活动状态失败:', error);
    ElMessage.error(error.message || '操作失败，请稍后重试');
  }
};

onMounted(() => {
  fetchActivities();
});
</script>

<style scoped>
.activities-page {
  padding: 20px;
}

.page-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
}

.filter-container {
  display: flex;
  margin-bottom: 20px;
  gap: 15px;
}

.search-input {
  width: 300px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.avatar-uploader {
  position: relative;
  overflow: hidden;
  display: inline-block;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  width: 200px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  margin-top: 7px;
  color: #606266;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  padding-top: 20px;
  text-align: right;
}
</style> 