<template>
  <div class="points-exchanges-container">
    <div class="page-header">
      <h1 class="page-title">积分兑换记录</h1>
    </div>

    <el-card class="exchange-list" v-loading="loading">
      <el-table :data="exchanges" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="product_name" label="商品名称" width="180" />
        <el-table-column prop="points_cost" label="消耗积分" width="100" />
        <el-table-column prop="exchange_time" label="兑换时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.exchange_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="completion_time" label="完成时间" width="180">
          <template #default="scope">
            {{ scope.row.completion_time ? formatDate(scope.row.completion_time) : '尚未完成' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 'pending'" 
              size="small" 
              type="success" 
              @click="updateExchangeStatus(scope.row.id, 'completed')"
            >
              标记完成
            </el-button>
            <el-button 
              v-if="scope.row.status === 'pending'" 
              size="small" 
              type="danger" 
              @click="updateExchangeStatus(scope.row.id, 'failed')"
            >
              标记失败
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAllPointsExchanges, updatePointsExchangeStatus } from '@/api/points-product';

// 数据
const exchanges = ref([]);
const loading = ref(false);

// 获取所有积分兑换记录
const fetchExchanges = async () => {
  loading.value = true;
  try {
    const data = await getAllPointsExchanges();
    exchanges.value = data;
  } catch (error) {
    ElMessage.error('获取积分兑换记录失败');
  } finally {
    loading.value = false;
  }
};

// 更新兑换记录状态
const updateExchangeStatus = async (exchangeId, status) => {
  const statusText = status === 'completed' ? '完成' : '失败';
  
  try {
    await ElMessageBox.confirm(`确定要将此兑换记录标记为${statusText}吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    await updatePointsExchangeStatus(exchangeId, status);
    ElMessage.success(`兑换记录已标记为${statusText}`);
    fetchExchanges();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('更新兑换记录状态失败');
    }
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'danger';
    default: return 'info';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'completed': return '已完成';
    case 'pending': return '待处理';
    case 'failed': return '失败';
    default: return '未知';
  }
};

onMounted(() => {
  fetchExchanges();
});
</script>

<style scoped>
.points-exchanges-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.exchange-list {
  margin-bottom: 20px;
}
</style> 