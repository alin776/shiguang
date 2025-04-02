<template>
  <div class="page-container">
    <div class="categories-page">
      <!-- 免责声明图片 -->
      <div class="disclaimer-image">
        <img src="@/assets/images/mianze.jpg" alt="免责声明" />
      </div>
      
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <!-- 返回按钮 -->
        <div class="back-button" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        
        <!-- 页面标题 -->
        <div class="page-title">论坛板块</div>
        
        <!-- 右侧占位 -->
        <div class="placeholder"></div>
      </div>

      <!-- 分类列表 -->
      <div class="categories-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="5" animated />
        </div>
        
        <!-- 分类列表 -->
        <div v-else class="categories-grid">
          <!-- 全部帖子选项 -->
          <div class="category-card" @click="navigateToCommunity()">
            <div class="category-icon all-posts">
              <el-icon><Document /></el-icon>
            </div>
            <div class="category-content">
              <div class="category-info">
                <h3 class="category-name">全部帖子</h3>
                <p class="category-description">浏览所有板块的帖子</p>
              </div>
              <div class="post-count-wrapper">
                <span class="post-count">{{ formatPostCount(totalPostCount) }}帖子</span>
              </div>
            </div>
          </div>
          
          <!-- 分类卡片 -->
          <div 
            v-for="(category, index) in categories" 
            :key="category.id" 
            class="category-card"
            @click="navigateToCommunity(category.id)"
          >
            <div class="category-icon" :class="getCategoryIconClass(index)">
              <el-icon><Collection /></el-icon>
            </div>
            <div class="category-content">
              <div class="category-info">
                <h3 class="category-name">{{ category.name }}</h3>
                <p class="category-description">{{ category.description || `浏览${category.name}相关的内容` }}</p>
              </div>
              <div class="post-count-wrapper">
                <span class="post-count">{{ formatPostCount(category.post_count || 0) }}帖子</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="!loading && categories.length === 0" class="empty-state">
          <el-empty description="暂无板块分类" />
        </div>
      </div>
    </div>
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, ArrowRight, Document, Collection } from "@element-plus/icons-vue";
import BottomNavBar from "@/components/BottomNavBar.vue";
import { useCommunityStore } from "@/stores/community";

const router = useRouter();
const communityStore = useCommunityStore();
const categories = ref([]);
const loading = ref(false);
const forumStats = ref({
  topics: 0,
  posts: 0,
  daily: 0
});

// 加载分类数据和统计信息
const loadCategories = async () => {
  try {
    loading.value = true;
    
    // 同时请求分类数据和统计数据
    const [categoriesData, statsData, forumStatsData] = await Promise.all([
      communityStore.getCategories(),
      communityStore.getCategoryStats(),
      communityStore.getForumStats()
    ]);
    
    // 设置论坛统计数据
    forumStats.value = forumStatsData || { topics: 0, posts: 0, daily: 0 };
    
    // 如果获取到了分类统计数据，合并到分类数据中
    if (statsData && statsData.length > 0) {
      // 使用Map存储统计数据，便于按分类ID查找
      const statsMap = new Map();
      statsData.forEach(stat => {
        statsMap.set(stat.category_id, stat);
      });
      
      // 合并统计数据到分类数据
      categories.value = categoriesData.map(category => {
        const stats = statsMap.get(category.id);
        return {
          ...category,
          post_count: stats?.post_count || 0,
          comment_count: stats?.comment_count || 0,
          user_count: stats?.user_count || 0
        };
      });
    } else {
      // 如果没有统计数据，使用原始分类数据
      categories.value = categoriesData;
    }
    
    console.log("加载分类数据成功:", categories.value);
  } catch (error) {
    console.error("加载分类数据失败:", error);
    ElMessage.error("加载分类数据失败");
  } finally {
    loading.value = false;
  }
};

// 导航到社区页面，可选择分类ID
const navigateToCommunity = (categoryId = null) => {
  if (categoryId) {
    router.push({
      path: '/community',
      query: { category: categoryId }
    });
  } else {
    router.push('/community');
  }
};

// 格式化帖子数量
const formatPostCount = (count) => {
  if (count >= 10000) {
    return Math.floor(count / 10000) + '万+ ';
  }
  if (count >= 1000) {
    return Math.floor(count / 1000) + '千+ ';
  }
  return count + ' ';
};

// 获取总帖子数
const totalPostCount = computed(() => {
  return forumStats.value.posts || 
    categories.value.reduce((total, category) => total + (category.post_count || 0), 0);
});

// 获取分类图标的样式类
const getCategoryIconClass = (index) => {
  const iconClasses = ['icon-tech', 'icon-help', 'icon-game', 'icon-life', 'icon-design'];
  return iconClasses[index % iconClasses.length];
};

onMounted(() => {
  // 加载分类数据
  loadCategories();
  
  // 强制滚动到页面顶部
  window.scrollTo({
    top: 0,
    behavior: 'instant'
  });
});
</script>

<style scoped>
/* 顶部装饰区域 */
.page-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(135deg, #1677ff, #36a9e1);
  z-index: 1;
}

/* 免责声明图片样式 */
.disclaimer-image {
  width: 100%;
  margin-bottom: 10px;
}

.disclaimer-image img {
  width: 100%;
  height: auto;
  display: block;
}

.categories-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-top: 86px; /* 增加顶部padding */
  position: relative;
  width: 100%;
  padding-bottom: 55px; /* 为底部导航栏留出空间 */
  z-index: 2; /* 确保内容在装饰条之上 */
  background-color: #f5f7fa;
}

/* 顶部标题栏 */
.page-header {
  position: fixed;
  top: 40px;
  left: 0;
  right: 0;
  height: 56px;
  background-color: #ffffff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 20;
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  margin: 0 auto;
  max-width: 95%;
}

/* 返回按钮 */
.back-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  font-size: 22px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: #f5f7fa;
  color: #1677ff;
}

/* 页面标题 */
.page-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 右侧占位 */
.placeholder {
  width: 40px;
}

/* 分类容器 */
.categories-container {
  padding: 16px;
}

/* 分类网格布局 */
.categories-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 12px;
  row-gap: 16px;
}

/* 分类卡片 */
.category-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 8px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  height: auto;
}

.category-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.category-card:active {
  transform: translateY(0);
}

/* 分类图标 */
.category-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-color: #1677ff;
  border-radius: 8px;
  font-size: 16px;
  margin-right: 10px;
}

/* 不同分类的图标颜色 */
.all-posts {
  background-color: #52c41a;
}

.icon-tech {
  background-color: #1677ff;
}

.icon-help {
  background-color: #fa541c;
}

.icon-game {
  background-color: #722ed1;
}

.icon-life {
  background-color: #eb2f96;
}

.icon-design {
  background-color: #faad14;
}

/* 分类内容包装器 */
.category-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 分类信息 */
.category-info {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
}

.category-name {
  margin: 0 0 2px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-description {
  margin: 0;
  font-size: 11px;
  color: #999;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 帖子数量包装器 */
.post-count-wrapper {
  text-align: left;
  margin-top: 4px;
}

/* 帖子数量 */
.post-count {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

/* 加载状态 */
.loading-state {
  padding: 20px 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

/* 适配小屏幕的响应式设计 */
@media screen and (max-width: 100px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style> 