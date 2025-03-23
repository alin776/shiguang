<template>
  <div class="report-management-container">
    <h1>举报管理</h1>
    
    <el-tabs v-model="activeStatus" @tab-click="handleStatusChange">
      <el-tab-pane label="待处理" name="pending">
        <report-list :status="'pending'" ref="pendingList" />
      </el-tab-pane>
      
      <el-tab-pane label="已处理" name="processed">
        <report-list :status="'processed'" ref="processedList" />
      </el-tab-pane>
      
      <el-tab-pane label="已驳回" name="dismissed">
        <report-list :status="'dismissed'" ref="dismissedList" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { ref } from 'vue';
import ReportList from '../components/ReportList.vue';

export default {
  name: 'ReportManagement',
  components: {
    ReportList
  },
  setup() {
    const activeStatus = ref('pending');
    const pendingList = ref(null);
    const processedList = ref(null);
    const dismissedList = ref(null);
    
    const handleStatusChange = (tab) => {
      const status = tab.props.name;
      switch (status) {
        case 'pending':
          if (pendingList.value) pendingList.value.fetchReports();
          break;
        case 'processed':
          if (processedList.value) processedList.value.fetchReports();
          break;
        case 'dismissed':
          if (dismissedList.value) dismissedList.value.fetchReports();
          break;
      }
    };
    
    return {
      activeStatus,
      pendingList,
      processedList,
      dismissedList,
      handleStatusChange
    };
  }
};
</script>

<style scoped>
.report-management-container {
  padding: 20px;
}
</style> 