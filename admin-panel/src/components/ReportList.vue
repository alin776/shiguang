<template>
  <div class="report-list-container">
    <el-table :data="reports" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="reported_type" label="举报类型" width="100">
        <template #default="scope">
          {{ scope.row.reported_type === 'post' ? '帖子' : '评论' }}
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="举报原因" />
      <el-table-column prop="reporter_name" label="举报人" width="100" />
      <el-table-column prop="created_at" label="举报时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <el-button size="small" type="primary" @click="viewReport(scope.row)">查看详情</el-button>
          <el-button 
            v-if="status === 'pending'" 
            size="small" 
            type="success" 
            @click="processReport(scope.row.id)"
          >
            处理
          </el-button>
          <el-button 
            v-if="status === 'pending'" 
            size="small" 
            type="warning" 
            @click="dismissReport(scope.row.id)"
          >
            驳回
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-if="pagination.total > 0"
        background
        layout="prev, pager, next"
        :total="pagination.total"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        @current-change="changePage"
      />
    </div>
    
    <!-- 举报详情对话框 -->
    <el-dialog
      v-model="reportDetailVisible"
      title="举报详情"
      width="70%"
    >
      <div v-if="currentReport" class="report-detail">
        <h3>举报信息</h3>
        <div class="report-info">
          <p><strong>举报ID：</strong> {{ currentReport.id }}</p>
          <p><strong>举报类型：</strong> {{ currentReport.reported_type === 'post' ? '帖子' : '评论' }}</p>
          <p><strong>举报原因：</strong> {{ currentReport.reason }}</p>
          <p><strong>举报人：</strong> {{ currentReport.reporter_name }}</p>
          <p><strong>举报时间：</strong> {{ formatDate(currentReport.created_at) }}</p>
          <p><strong>状态：</strong> {{ getStatusText(currentReport.status) }}</p>
          <p v-if="currentReport.processed_at"><strong>处理时间：</strong> {{ formatDate(currentReport.processed_at) }}</p>
          <p v-if="currentReport.processor_name"><strong>处理人：</strong> {{ currentReport.processor_name }}</p>
        </div>
        
        <div v-if="reportedContent" class="reported-content">
          <h3>被举报内容</h3>
          
          <div v-if="reportedContent.type === 'post'" class="post-content">
            <p><strong>帖子ID：</strong> {{ reportedContent.id }}</p>
            <p><strong>标题：</strong> {{ reportedContent.title }}</p>
            <p><strong>作者：</strong> {{ reportedContent.author_name }}</p>
            <p><strong>发布时间：</strong> {{ formatDate(reportedContent.created_at) }}</p>
            <div class="content-text">
              <strong>内容：</strong>
              <p>{{ reportedContent.content }}</p>
            </div>
            
            <div v-if="reportedContent.images && parseImages(reportedContent.images).length > 0" class="content-images">
              <strong>图片：</strong>
              <div class="image-list">
                <img v-for="(img, index) in parseImages(reportedContent.images)" :key="index" :src="img" alt="帖子图片" />
              </div>
            </div>
          </div>
          
          <div v-if="reportedContent.type === 'comment'" class="comment-content">
            <p><strong>评论ID：</strong> {{ reportedContent.id }}</p>
            <p><strong>所属帖子：</strong> {{ reportedContent.post_title }} (ID: {{ reportedContent.post_id }})</p>
            <p><strong>作者：</strong> {{ reportedContent.author_name }}</p>
            <p><strong>发布时间：</strong> {{ formatDate(reportedContent.created_at) }}</p>
            <div class="content-text">
              <strong>内容：</strong>
              <p>{{ reportedContent.content }}</p>
            </div>
            
            <div v-if="reportedContent.images && parseImages(reportedContent.images).length > 0" class="content-images">
              <strong>图片：</strong>
              <div class="image-list">
                <img v-for="(img, index) in parseImages(reportedContent.images)" :key="index" :src="img" alt="评论图片" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDetailVisible = false">关闭</el-button>
          <template v-if="status === 'pending'">
            <el-button type="success" @click="processWithAction('reject')">标记违规</el-button>
            <el-button type="danger" @click="processWithAction('delete')">删除内容</el-button>
            <el-button type="warning" @click="dismissReport(currentReport?.id)">驳回举报</el-button>
          </template>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, defineComponent, defineProps, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getReports, getReportDetails, updateReportStatus } from '../api/content-review';

export default defineComponent({
  name: 'ReportList',
  props: {
    status: {
      type: String,
      default: 'pending',
      validator: (value) => ['pending', 'processed', 'dismissed'].includes(value)
    }
  },
  setup(props) {
    const loading = ref(false);
    const reports = ref([]);
    const pagination = reactive({
      total: 0,
      page: 1,
      pageSize: 10
    });
    
    // 举报详情
    const reportDetailVisible = ref(false);
    const currentReport = ref(null);
    const reportedContent = ref(null);
    
    const fetchReports = async (page = 1) => {
      loading.value = true;
      try {
        const res = await getReports(page, pagination.pageSize, props.status);
        reports.value = res.data.reports;
        pagination.total = res.data.pagination.total;
        pagination.page = page;
      } catch (error) {
        ElMessage.error('获取举报列表失败');
        console.error('获取举报列表失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const changePage = (page) => {
      fetchReports(page);
    };
    
    const viewReport = async (report) => {
      try {
        const res = await getReportDetails(report.id);
        currentReport.value = res.data.report;
        reportedContent.value = res.data.reportedContent;
        reportDetailVisible.value = true;
      } catch (error) {
        ElMessage.error('获取举报详情失败');
        console.error('获取举报详情失败:', error);
      }
    };
    
    const processReport = async (reportId) => {
      try {
        await ElMessageBox.confirm('确定要处理该举报吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        });
        
        await updateReportStatus(reportId, 'processed');
        ElMessage.success('举报已处理');
        fetchReports(pagination.page);
        reportDetailVisible.value = false;
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('处理举报失败');
          console.error('处理举报失败:', error);
        }
      }
    };
    
    const processWithAction = async (action) => {
      if (!currentReport.value) return;
      
      try {
        const actionText = action === 'delete' ? '删除' : '标记违规';
        await ElMessageBox.confirm(`确定要${actionText}该内容吗？`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        await updateReportStatus(currentReport.value.id, 'processed', action);
        ElMessage.success(`举报已处理，内容已${actionText}`);
        fetchReports(pagination.page);
        reportDetailVisible.value = false;
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('处理举报失败');
          console.error('处理举报失败:', error);
        }
      }
    };
    
    const dismissReport = async (reportId) => {
      try {
        await ElMessageBox.confirm('确定要驳回该举报吗？', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        await updateReportStatus(reportId, 'dismissed');
        ElMessage.success('举报已驳回');
        fetchReports(pagination.page);
        reportDetailVisible.value = false;
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('驳回举报失败');
          console.error('驳回举报失败:', error);
        }
      }
    };
    
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
    
    const getStatusText = (status) => {
      if (!status) return '';
      const statusMap = {
        'pending': '待处理',
        'processed': '已处理',
        'dismissed': '已驳回'
      };
      return statusMap[status] || status;
    };
    
    const parseImages = (images) => {
      if (!images) return [];
      
      let imageArray = [];
      if (typeof images === 'string') {
        try {
          imageArray = JSON.parse(images);
        } catch (e) {
          return [];
        }
      } else if (Array.isArray(images)) {
        imageArray = images;
      } else {
        return [];
      }
      
      // 确保图片URL是完整的
      return imageArray.map(img => {
        if (img && typeof img === 'string') {
          // 如果URL已经是完整的HTTP URL，直接返回
          if (img.startsWith('http')) {
            return img;
          }
          // 否则，添加服务器基础URL
          return `http://47.98.210.7:3000${img.startsWith('/') ? '' : '/'}${img}`;
        }
        return img;
      });
    };
    
    onMounted(() => {
      fetchReports();
    });
    
    return {
      loading,
      reports,
      pagination,
      reportDetailVisible,
      currentReport,
      reportedContent,
      fetchReports,
      changePage,
      viewReport,
      processReport,
      processWithAction,
      dismissReport,
      formatDate,
      getStatusText,
      parseImages
    };
  }
});
</script>

<style scoped>
.report-list-container {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.report-detail {
  padding: 0 20px;
}

.report-info, .reported-content {
  margin-bottom: 30px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background-color: #f9f9f9;
}

.content-text {
  margin-top: 15px;
}

.content-text p {
  white-space: pre-wrap;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
}

.content-images {
  margin-top: 15px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.image-list img {
  max-width: 200px;
  max-height: 200px;
  object-fit: cover;
  border-radius: 4px;
}
</style> 