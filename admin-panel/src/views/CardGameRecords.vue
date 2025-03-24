<template>
  <div class="card-game-records-container">
    <h1 class="page-title">抽卡游戏记录</h1>
    
    <!-- 手动开奖按钮 -->
    <el-row class="action-buttons" :gutter="20">
      <el-col :span="24">
        <el-button 
          type="primary" 
          :loading="drawLoading" 
          @click="handleTriggerDraw"
        >
          手动开奖（最后一天）
        </el-button>
      </el-col>
    </el-row>
    
    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="游戏结果">
          <el-select v-model="searchForm.result" placeholder="全部" clearable>
            <el-option label="胜利" value="win" />
            <el-option label="失败" value="lose" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 数据表格 -->
    <el-table
      :data="gameRecords"
      border
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="用户信息" width="180">
        <template #default="scope">
          <div>
            {{ scope.row.username }}
            <el-tag size="small" type="info">ID: {{ scope.row.user_id }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="投注信息" width="200">
        <template #default="scope">
          <div>
            <div>金额: {{ scope.row.bet_amount }} 积分</div>
            <div>选择: 第 {{ scope.row.selected_position + 1 }} 张卡片</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="开奖结果" width="150">
        <template #default="scope">
          <div v-if="scope.row.winning_position !== null">
            <div>开奖位置: 第 {{ scope.row.winning_position + 1 }} 张卡片</div>
            <el-tag 
              :type="scope.row.is_win ? 'success' : 'danger'"
              size="small"
            >
              {{ scope.row.is_win ? '赢' : '输' }}
            </el-tag>
          </div>
          <el-tag v-else type="info" size="small">未开奖</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="奖励" width="100">
        <template #default="scope">
          <div v-if="scope.row.reward">{{ scope.row.reward }} 积分</div>
          <div v-else>-</div>
        </template>
      </el-table-column>
      <el-table-column label="净收益" width="100">
        <template #default="scope">
          <div v-if="scope.row.is_win" class="profit positive">
            +{{ scope.row.reward - scope.row.bet_amount }}
          </div>
          <div v-else-if="scope.row.is_win === 0" class="profit negative">
            -{{ scope.row.bet_amount }}
          </div>
          <div v-else>-</div>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="投注时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :current-page="pagination.page"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAllCardGameRecords, triggerCardGameDraw } from '@/api/game';

// 搜索表单
const searchForm = reactive({
  username: '',
  result: '',
  dateRange: []
});

// 游戏记录数据
const gameRecords = ref([]);
const loading = ref(false);
const drawLoading = ref(false);

// 分页信息
const pagination = reactive({
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0
});

// 获取游戏记录
const fetchGameRecords = async () => {
  try {
    loading.value = true;
    
    // 构建查询参数
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    
    // 添加搜索条件
    if (searchForm.username) {
      params.username = searchForm.username;
    }
    
    if (searchForm.result) {
      params.result = searchForm.result;
    }
    
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0];
      params.endDate = searchForm.dateRange[1];
    }
    
    const response = await getAllCardGameRecords(params);
    
    console.log('API响应:', response.data); // 添加日志，查看返回的数据结构
    
    // 更新数据和分页信息
    if (response.data && response.data.records) {
      gameRecords.value = response.data.records;
      
      if (response.data.pagination) {
        pagination.total = response.data.pagination.total;
        pagination.totalPages = response.data.pagination.totalPages;
      } else {
        console.warn('API响应中缺少pagination数据');
        pagination.total = 0;
        pagination.totalPages = 0;
      }
    } else {
      console.warn('API响应格式不符合预期:', response.data);
      gameRecords.value = [];
      pagination.total = 0;
      pagination.totalPages = 0;
    }
    
  } catch (error) {
    console.error('获取游戏记录失败:', error);
    ElMessage.error('获取游戏记录失败');
    gameRecords.value = [];
    pagination.total = 0;
    pagination.totalPages = 0;
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1; // 重置到第一页
  fetchGameRecords();
};

// 重置搜索
const resetSearch = () => {
  searchForm.username = '';
  searchForm.result = '';
  searchForm.dateRange = [];
  pagination.page = 1;
  fetchGameRecords();
};

// 分页处理
const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  fetchGameRecords();
};

const handleCurrentChange = (newPage) => {
  pagination.page = newPage;
  fetchGameRecords();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 手动触发开奖
const handleTriggerDraw = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要手动触发今日开奖吗？此操作将开启最后一天的奖池，不可撤销！',
      '确认操作',
      {
        confirmButtonText: '确认开奖',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    drawLoading.value = true;
    const response = await triggerCardGameDraw();
    
    ElMessage.success('开奖成功！');
    console.log('开奖结果:', response.data);
    
    // 刷新数据
    fetchGameRecords();
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    
    console.error('触发开奖失败:', error);
    const errorMsg = error.response?.data?.message || '触发开奖失败';
    ElMessage.error(errorMsg);
  } finally {
    drawLoading.value = false;
  }
};

// 组件挂载后获取数据
onMounted(() => {
  fetchGameRecords();
});
</script>

<style scoped>
.card-game-records-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.action-buttons {
  margin-bottom: 20px;
}

.search-area {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.profit {
  font-weight: bold;
}

.profit.positive {
  color: #67c23a;
}

.profit.negative {
  color: #f56c6c;
}
</style> 