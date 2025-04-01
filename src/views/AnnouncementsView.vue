<template>
  <div class="page-container">
    <div class="announcements-page">
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <div class="header-back" v-if="selectedAnnouncement" @click="backToList">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        <div class="header-title">
          <h2>{{ selectedAnnouncement ? '公告详情' : '公告' }}</h2>
        </div>
      </div>

      <!-- 公告列表 -->
      <div class="announcements-list" v-if="!selectedAnnouncement">
        <template v-if="announcements.length">
          <div 
            v-for="announcement in announcements" 
            :key="announcement.id"
            class="announcement-item"
            @click="viewAnnouncementDetail(announcement)"
          >
            <div class="announcement-info">
              <div class="announcement-title">{{ announcement.title }}</div>
              <div class="announcement-preview">{{ announcement.content }}</div>
              <div class="announcement-meta">
                <span class="announcement-time">{{ formatTime(announcement.created_at) }}</span>
                <span class="announcement-author" v-if="announcement.author">{{ announcement.author.username }}</span>
              </div>
            </div>
            <div class="announcement-tag" v-if="isNew(announcement.created_at)">新</div>
          </div>
        </template>
        <div v-else class="empty-state">
          <el-empty description="暂无公告" />
        </div>
      </div>

      <!-- 公告详情 -->
      <div class="announcement-detail" v-if="selectedAnnouncement">
        <div class="detail-header">
          <h3 class="detail-title">{{ selectedAnnouncement.title }}</h3>
          <div class="detail-meta">
            <span class="detail-time">{{ formatTime(selectedAnnouncement.created_at) }}</span>
            <span class="detail-author" v-if="selectedAnnouncement.author">{{ selectedAnnouncement.author.username }}</span>
          </div>
        </div>
        <div class="detail-content">
          {{ selectedAnnouncement.content }}
        </div>
        <div v-if="selectedAnnouncement.images && selectedAnnouncement.images.length > 0" class="detail-images">
          <div 
            v-for="(img, index) in selectedAnnouncement.images" 
            :key="index"
            class="detail-image-wrapper"
            @click="previewImage(img)"
          >
            <img :src="img" class="detail-image" />
          </div>
        </div>
      </div>
    </div>
    <BottomNavBar />

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="showViewer = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElImageViewer } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import BottomNavBar from "@/components/BottomNavBar.vue";
import { useCommunityStore } from "@/stores/community";
import dayjs from "dayjs";

const route = useRoute();
const router = useRouter();
const communityStore = useCommunityStore();

const announcements = ref([]);
const selectedAnnouncement = ref(null);
const loading = ref(false);

// 图片预览相关
const showViewer = ref(false);
const previewImages = ref([]);
const previewIndex = ref(0);

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format("YYYY-MM-DD HH:mm");
};

// 判断是否为新内容（3天内）
const isNew = (time) => {
  return dayjs().diff(dayjs(time), 'day') <= 3;
};

// 加载公告列表
const loadAnnouncements = async () => {
  try {
    loading.value = true;
    const response = await communityStore.getAnnouncements();
    announcements.value = response.announcements || [];
    
    // 检查是否有ID参数，如果有则显示该公告的详情
    const announcementId = route.params.id;
    if (announcementId) {
      const announcement = announcements.value.find(a => a.id.toString() === announcementId);
      if (announcement) {
        viewAnnouncementDetail(announcement);
      } else {
        // 如果列表中找不到，则尝试单独请求
        await loadAnnouncementDetail(announcementId);
      }
    }
  } catch (error) {
    console.error("获取公告列表失败:", error);
    ElMessage.error("获取公告列表失败");
  } finally {
    loading.value = false;
  }
};

// 加载单个公告详情
const loadAnnouncementDetail = async (id) => {
  try {
    loading.value = true;
    const response = await communityStore.getAnnouncementById(id);
    if (response.announcement) {
      selectedAnnouncement.value = response.announcement;
    } else {
      ElMessage.warning("找不到该公告");
      router.replace("/announcements");
    }
  } catch (error) {
    console.error("获取公告详情失败:", error);
    ElMessage.error("获取公告详情失败");
    router.replace("/announcements");
  } finally {
    loading.value = false;
  }
};

// 查看公告详情
const viewAnnouncementDetail = (announcement) => {
  selectedAnnouncement.value = announcement;
  // 更新路由，但不刷新页面
  router.push(`/announcements/${announcement.id}`);
};

// 返回列表
const backToList = () => {
  selectedAnnouncement.value = null;
  router.push("/announcements");
};

// 预览图片
const previewImage = (img) => {
  if (selectedAnnouncement.value.images) {
    previewImages.value = selectedAnnouncement.value.images;
    previewIndex.value = previewImages.value.indexOf(img);
    showViewer.value = true;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadAnnouncements();
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 55px; /* 为底部导航栏留出空间 */
}

.announcements-page {
  padding-top: 56px;
}

/* 顶部标题栏 */
.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: #ffffff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 20;
}

.header-back {
  margin-right: 10px;
  cursor: pointer;
  color: #666;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s;
}

.header-back:hover {
  background-color: #f0f0f0;
  color: #1677ff;
}

.header-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 公告列表样式 */
.announcements-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.announcement-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.announcement-info {
  flex: 1;
  min-width: 0;
}

.announcement-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  /* 标题保留两行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.announcement-preview {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  /* 内容预览保留三行 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.announcement-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.announcement-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #ff4d4f;
  color: white;
  font-size: 12px;
  font-weight: 700;
  margin-left: 16px;
  flex-shrink: 0;
}

/* 公告详情样式 */
.announcement-detail {
  padding: 16px;
  text-align: left; /* 确保所有内容靠左显示 */
}

.detail-header {
  margin-bottom: 20px;
  text-align: left; /* 确保标题靠左 */
}

.detail-title {
  font-size: 24px; /* 增大标题字体 */
  font-weight: 600;
  color: #222; /* 加深颜色增加对比度 */
  margin: 0 0 15px;
  line-height: 1.4;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif; /* 更好看的中文字体 */
}

.detail-meta {
  display: flex;
  justify-content: space-between;
  font-size: 15px; /* 增大元数据字体 */
  color: #666; /* 加深颜色 */
}

.detail-content {
  font-size: 18px; /* 增大内容字体 */
  line-height: 1.8; /* 增加行高提高可读性 */
  color: #333;
  margin-bottom: 20px;
  white-space: pre-line; /* 保留换行 */
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif; /* 更好看的中文字体 */
  letter-spacing: 0.5px; /* 增加字间距 */
  padding: 0 2px; /* 添加少量内边距 */
}

.detail-images {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.detail-image-wrapper {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.detail-image {
  width: 100%;
  object-fit: contain;
}

/* 空状态样式 */
.empty-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}
</style> 