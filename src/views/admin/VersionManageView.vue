<template>
  <div class="version-manage">
    <div class="page-header">
      <h1>版本管理</h1>
    </div>
    
    <div class="content">
      <!-- 当前版本状态 -->
      <el-card class="latest-versions">
        <template #header>
          <div class="card-header">
            <span>当前最新版本</span>
            <el-button type="primary" @click="refreshData">刷新</el-button>
          </div>
        </template>
        
        <el-table v-loading="loading.latest" :data="latestVersions" stripe>
          <el-table-column prop="platform" label="平台" width="100" />
          <el-table-column prop="version" label="版本号" width="100" />
          <el-table-column prop="buildNumber" label="构建号" width="100" />
          <el-table-column prop="releaseDate" label="发布日期" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.releaseDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="forceUpdate" label="强制更新" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.forceUpdate ? 'danger' : 'success'">
                {{ scope.row.forceUpdate ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="releaseNotes" label="发布说明" />
        </el-table>
      </el-card>
      
      <!-- 添加新版本 -->
      <el-card class="add-version">
        <template #header>
          <div class="card-header">
            <span>添加新版本</span>
          </div>
        </template>
        
        <el-form 
          :model="versionForm" 
          :rules="rules" 
          ref="versionFormRef" 
          label-width="100px"
          label-position="top"
        >
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="平台" prop="platform">
                <el-select v-model="versionForm.platform" placeholder="选择平台" style="width: 100%">
                  <el-option label="Web" value="web" />
                  <el-option label="Android" value="android" />
                  <el-option label="iOS" value="ios" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="8">
              <el-form-item label="版本号" prop="version">
                <el-input v-model="versionForm.version" placeholder="例如: 1.0.1" />
              </el-form-item>
            </el-col>
            
            <el-col :span="8">
              <el-form-item label="构建号" prop="buildNumber">
                <el-input v-model="versionForm.buildNumber" placeholder="例如: 2" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="发布说明" prop="releaseNotes">
            <el-input 
              v-model="versionForm.releaseNotes" 
              type="textarea" 
              :rows="4" 
              placeholder="请输入发布说明，支持多行文本"
            />
          </el-form-item>
          
          <el-form-item>
            <el-checkbox v-model="versionForm.forceUpdate">强制更新</el-checkbox>
            <el-tooltip content="勾选后，用户必须更新到此版本才能继续使用应用" placement="top">
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </el-form-item>
          
          <!-- 根据平台显示不同字段 -->
          <template v-if="versionForm.platform === 'android'">
            <el-form-item label="下载地址" prop="downloadUrl">
              <el-input v-model="versionForm.downloadUrl" placeholder="例如: https://example.com/app.apk" />
            </el-form-item>
            
            <el-form-item label="最低系统版本" prop="minOsVersion">
              <el-input v-model="versionForm.minOsVersion" placeholder="例如: 8.0.0" />
            </el-form-item>
          </template>
          
          <template v-if="versionForm.platform === 'ios'">
            <el-form-item label="App Store地址" prop="appStoreUrl">
              <el-input v-model="versionForm.appStoreUrl" placeholder="例如: https://apps.apple.com/app/id..." />
            </el-form-item>
            
            <el-form-item label="最低系统版本" prop="minOsVersion">
              <el-input v-model="versionForm.minOsVersion" placeholder="例如: 13.0.0" />
            </el-form-item>
          </template>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="submitVersion" 
              :loading="loading.submit"
            >
              提交新版本
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      
      <!-- 版本历史列表(可选) -->
      <el-card class="version-history" v-if="showHistory">
        <template #header>
          <div class="card-header">
            <span>版本历史</span>
            <el-select v-model="selectedPlatform" placeholder="选择平台" @change="loadVersionHistory">
              <el-option label="Web" value="web" />
              <el-option label="Android" value="android" />
              <el-option label="iOS" value="ios" />
            </el-select>
          </div>
        </template>
        
        <el-table v-loading="loading.history" :data="versionHistory" stripe>
          <el-table-column prop="version" label="版本号" width="100" />
          <el-table-column prop="buildNumber" label="构建号" width="100" />
          <el-table-column prop="releaseDate" label="发布日期" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.releaseDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="forceUpdate" label="强制更新" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.forceUpdate ? 'danger' : 'success'">
                {{ scope.row.forceUpdate ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="releaseNotes" label="发布说明" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

// 数据和状态
const latestVersions = ref([]);
const versionHistory = ref([]);
const selectedPlatform = ref('web');
const showHistory = ref(false);
const versionFormRef = ref(null);

const loading = reactive({
  latest: false,
  history: false,
  submit: false
});

const versionForm = reactive({
  platform: 'web',
  version: '',
  buildNumber: '',
  releaseNotes: '',
  forceUpdate: false,
  downloadUrl: '',
  appStoreUrl: '',
  minOsVersion: ''
});

// 表单验证规则
const rules = {
  platform: [
    { required: true, message: '请选择平台', trigger: 'change' }
  ],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^\d+\.\d+\.\d+$/, message: '版本号格式为x.y.z', trigger: 'blur' }
  ],
  buildNumber: [
    { required: true, message: '请输入构建号', trigger: 'blur' },
    { pattern: /^\d+$/, message: '构建号必须是数字', trigger: 'blur' }
  ],
  releaseNotes: [
    { required: true, message: '请输入发布说明', trigger: 'blur' }
  ],
  downloadUrl: [
    { required: true, message: '请输入下载地址', trigger: 'blur', 
      validator: (rule, value, callback) => {
        if (versionForm.platform === 'android' && !value) {
          callback(new Error('Android平台必须提供下载地址'));
        } else {
          callback();
        }
      }
    }
  ],
  appStoreUrl: [
    { required: true, message: '请输入App Store地址', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (versionForm.platform === 'ios' && !value) {
          callback(new Error('iOS平台必须提供App Store地址'));
        } else {
          callback();
        }
      }
    }
  ]
};

// 加载最新版本信息
const loadLatestVersions = async () => {
  loading.latest = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/updates/latest`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
    
    if (response.data.success) {
      latestVersions.value = response.data.versions;
    } else {
      ElMessage.error('加载版本信息失败');
    }
  } catch (error) {
    console.error('获取最新版本失败:', error);
    ElMessage.error(error.response?.data?.message || '获取最新版本失败');
  } finally {
    loading.latest = false;
  }
};

// 加载版本历史
const loadVersionHistory = async () => {
  if (!showHistory.value) return;
  
  loading.history = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/updates/history`, {
      params: { platform: selectedPlatform.value }
    });
    
    if (response.data.success) {
      versionHistory.value = response.data.versions;
    } else {
      ElMessage.error('加载版本历史失败');
    }
  } catch (error) {
    console.error('获取版本历史失败:', error);
    ElMessage.error(error.response?.data?.message || '获取版本历史失败');
  } finally {
    loading.history = false;
  }
};

// 提交新版本
const submitVersion = async () => {
  if (!versionFormRef.value) return;
  
  try {
    await versionFormRef.value.validate();
    
    loading.submit = true;
    
    const response = await axios.post(
      `${API_BASE_URL}/api/updates/add`,
      versionForm,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      }
    );
    
    if (response.data.success) {
      ElNotification({
        title: '成功',
        message: response.data.message,
        type: 'success'
      });
      
      // 重新加载数据和重置表单
      resetForm();
      await refreshData();
    } else {
      ElMessage.error(response.data.message || '添加版本失败');
    }
  } catch (error) {
    console.error('添加版本失败:', error);
    ElMessage.error(error.response?.data?.message || '添加版本失败');
  } finally {
    loading.submit = false;
  }
};

// 重置表单
const resetForm = () => {
  if (versionFormRef.value) {
    versionFormRef.value.resetFields();
  }
  
  // 重置附加字段
  versionForm.forceUpdate = false;
  versionForm.downloadUrl = '';
  versionForm.appStoreUrl = '';
  versionForm.minOsVersion = '';
};

// 刷新数据
const refreshData = async () => {
  await loadLatestVersions();
  if (showHistory.value) {
    await loadVersionHistory();
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 初始化
onMounted(async () => {
  await loadLatestVersions();
});
</script>

<style scoped>
.version-manage {
  padding: 20px;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-version {
  margin-top: 20px;
}

.info-icon {
  margin-left: 5px;
  color: #909399;
}

/* 版本历史表格 */
.version-history {
  margin-top: 20px;
}
</style> 