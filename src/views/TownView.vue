<template>
  <div class="page-container">
    <div class="town-page">
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <div class="header-title">
          <h2>小镇</h2>
        </div>
      </div>

      <!-- 轮播图区域 -->
      <div class="activities-section">
        <div class="section-header">
          <h3 class="section-title">活动</h3>
          <span class="more-btn" @click="router.push('/activities')">更多 <el-icon><ArrowRight /></el-icon></span>
        </div>
        
        <div class="banner-section">
          <el-carousel 
            :interval="5000" 
            height="160px"
            indicator-position="none"
            :autoplay="true"
            arrow="always"
            trigger="hover">
            <el-carousel-item v-for="item in banners" :key="item.id">
              <div class="banner-container" @click="handleBannerClick(item)">
                <img 
                  :src="item.imageUrl" 
                  class="banner-image" 
                  @error="handleImageError($event, item)" 
                  :alt="item.title"
                />
                <div class="banner-title">{{ item.title }}</div>
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>
      </div>
      
      <!-- 公告区域 -->
      <div class="announcement-section" @click="router.push('/announcements')">
        <div class="section-header">
          <h3 class="section-title">公告</h3>
          <span class="more-btn">更多 <el-icon><ArrowRight /></el-icon></span>
        </div>
        <div class="announcement-list">
          <div v-if="announcements.length === 0" class="empty-state">
            <el-empty description="暂无公告" />
          </div>
          <div 
            v-for="announcement in announcements.slice(0, 3)" 
            :key="announcement.id"
            class="announcement-item"
            @click.stop="router.push(`/announcements/${announcement.id}`)"
          >
            <div class="announcement-info">
              <div class="announcement-title">{{ announcement.title }}</div>
              <div class="announcement-time">{{ formatTime(announcement.created_at) }}</div>
            </div>
            <div class="announcement-tag" v-if="isNew(announcement.created_at)">新</div>
          </div>
        </div>
      </div>
      
      <!-- 论坛区域 -->
      <div class="forum-section">
        <!-- 论坛渐变背景头部 -->
        <div class="section-banner forum-gradient" @click="router.push('/community')">
          <div class="section-banner-content">
            <div class="banner-left">
              <h3 class="section-banner-title">论坛</h3>
              <p class="section-banner-subtitle">分享观点，获取帮助，结交朋友</p>
            </div>
            <div class="banner-stats">
              <div class="banner-stat-item">
                <div class="banner-stat-value">{{ forumStats.topics }}</div>
                <div class="banner-stat-label">主题</div>
              </div>
              <div class="banner-stat-item">
                <div class="banner-stat-value">{{ forumStats.posts }}</div>
                <div class="banner-stat-label">帖子</div>
              </div>
              <div class="banner-stat-item">
                <div class="banner-stat-value">{{ forumStats.daily }}</div>
                <div class="banner-stat-label">今日</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="forum-posts">
          <div v-if="hotPosts.length === 0" class="empty-state">
            <el-empty description="暂无热门帖子" />
          </div>
          <div 
            v-for="post in hotPosts.slice(0, 5)" 
            :key="post.id"
            class="forum-post-item"
            @click.stop="router.push(`/community/post/${post.id}`)"
          >
            <div class="post-content">
              <div class="post-title">{{ post.title }}</div>
              <div class="post-meta">
                <span class="post-author">作者: {{ post.user?.username || '匿名用户' }}</span>
                <span class="post-stats">
                  <span>{{ post.reply_count || post.comment_count || 0 }} 回复</span>
                  <span>{{ post.views || 0 }} 浏览</span>
                </span>
              </div>
            </div>
            <div class="hot-tag" v-if="post.is_hot">热门</div>
            <div class="pin-tag" v-if="post.is_pinned">置顶</div>
          </div>
        </div>
      </div>
    </div>
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { View, ChatDotRound, ArrowRight } from "@element-plus/icons-vue";
import BottomNavBar from "@/components/BottomNavBar.vue";
import { useCommunityStore } from "@/stores/community";
import { API_BASE_URL } from "@/config";
import dayjs from "dayjs";

const router = useRouter();
const communityStore = useCommunityStore();

// 轮播图数据
const banners = ref([]);

// 图片路径选择
const imagePathOption = ref(8); // 默认使用方案8，即用户提示的正确路径格式

// 公告数据
const announcements = ref([]);

// 论坛数据
const hotPosts = ref([]);
const forumStats = ref({
  topics: 0,
  posts: 0,
  daily: 0
});

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format("MM-DD HH:mm");
};

// 判断是否为新内容（3天内）
const isNew = (time) => {
  return dayjs().diff(dayjs(time), 'day') <= 3;
};

// 加载公告数据
const loadAnnouncements = async () => {
  try {
    const response = await communityStore.getAnnouncements();
    announcements.value = response.announcements || [];
  } catch (error) {
    console.error("获取公告列表失败:", error);
    ElMessage.error("获取公告列表失败");
  }
};

// 加载论坛热门帖子数据
const loadHotPosts = async () => {
  try {
    // 获取热门帖子列表
    const response = await communityStore.getPosts(1, false, 'hot', '', null);
    hotPosts.value = response.posts || [];
    
    // 如果有帖子，尝试获取每个帖子的详细信息
    if (hotPosts.value.length > 0) {
      // 使用Promise.all并行获取所有帖子的详细信息
      const detailedPosts = await Promise.all(
        hotPosts.value.map(async (post) => {
          try {
            // 获取帖子详情（使用getPost方法代替之前不存在的getPostDetail方法）
            const detailResponse = await communityStore.getPost(post.id);
            if (detailResponse) {
              // 计算评论数：优先使用comments数组长度
              const commentCount = detailResponse.comments?.length || detailResponse.reply_count || detailResponse.comment_count || post.reply_count || post.comment_count || 0;
              
              // 合并帖子详情数据
              return {
                ...post,
                ...detailResponse,
                reply_count: commentCount,
                comment_count: commentCount,
                last_reply_time: detailResponse.last_reply_time || detailResponse.last_comment_time || post.last_reply_time || post.created_at
              };
            }
            return post;
          } catch (error) {
            console.error(`获取帖子ID=${post.id}的详情失败:`, error);
            return post;
          }
        })
      );
      
      // 更新帖子数据
      hotPosts.value = detailedPosts;
    }
    
    // 获取论坛统计数据
    const statsResponse = await communityStore.getForumStats();
    forumStats.value = statsResponse || { topics: 0, posts: 0, daily: 0 };
  } catch (error) {
    console.error("获取热门帖子失败:", error);
    ElMessage.error("获取热门帖子失败");
  }
};

// 加载活动数据
const loadActivities = async () => {
  try {
    // 获取活动列表
    const response = await communityStore.getActivities();
    console.log("活动数据API响应:", response);
    
    // 获取活动数组 - API返回格式为 {message: 'xxx', data: [活动数组]}
    // 之前的条件判断错误地忽略了data字段中的活动数组
    const activitiesList = response?.data || [];
    console.log("API返回的活动列表:", activitiesList);
    
    if (Array.isArray(activitiesList) && activitiesList.length > 0) {
      // 使用API返回的真实活动数据
      console.log("使用API返回的真实活动数据");
      banners.value = activitiesList.map(activity => {
        console.log("处理活动项:", activity);
        
        // 构建封面图片URL
        let imageUrl = '/default-cover.jpg'; // 使用项目中已有的默认封面
        if (activity.cover_image) {
          // 检查路径是否已经是完整URL
          if (activity.cover_image.startsWith('http')) {
            imageUrl = activity.cover_image;
          } else {
            // 根据ActivityDetailView.vue和ActivityListView.vue中的约定
            // 活动封面图片路径为: ${API_BASE_URL}/uploads/covers/${activity.cover_image}
            imageUrl = `${API_BASE_URL}/uploads/covers/${activity.cover_image}`;
            console.log("使用活动页面统一的图片URL格式:", imageUrl);
          }
        }
        
        return {
          id: activity.id,
          title: activity.title || activity.name || "活动",
          imageUrl: imageUrl,
          originalImage: activity.cover_image, // 保存原始值供调试
          type: 'activity'
        };
      });
      console.log("设置轮播图数据:", banners.value);
      
      // 添加测试用的切换按钮，方便调试
      // 正式环境可删除这部分代码
      window.testImagePath = (option) => {
        console.log(`切换到图片路径方案${option}`);
        imagePathOption.value = option;
        loadActivities(); // 重新加载活动数据
        return `已切换到图片路径方案${option}，请查看效果`;
      };
      console.log("调试: 可以在控制台执行 testImagePath(1-11) 测试不同的图片路径方案");
      
      return;
    }
    
    // 如果没有获取到活动数据，使用模拟数据测试
    console.log("未获取到活动数据，使用模拟数据");
    const mockActivities = [
      {
        id: 101,
        title: "春季社区活动",
        cover_image: "/banners/mock-activity-1.jpg"
      },
      {
        id: 102,
        title: "夏日嘉年华",
        cover_image: "/banners/mock-activity-2.jpg"
      },
      {
        id: 103,
        title: "读书分享会",
        cover_image: "/banners/mock-activity-3.jpg"
      }
    ];
    
    // 使用模拟数据
    banners.value = mockActivities.map(activity => ({
      id: activity.id,
      title: activity.title || "活动",
      imageUrl: activity.cover_image || "/banners/default-activity.jpg",
      type: 'activity'
    }));
    
    console.log("已设置模拟活动数据:", banners.value);
  } catch (error) {
    console.error("获取活动数据失败:", error);
    ElMessage.error("获取活动数据失败");
    // 加载失败时使用默认轮播图
    setDefaultBanners();
  }
};

// 设置默认轮播图数据
const setDefaultBanners = () => {
  banners.value = [
    {
      id: 1,
      title: "时光小镇欢迎你",
      imageUrl: "/banners/town-banner-1.jpg",
      type: "link",
      link: "/about"
    },
    {
      id: 2,
      title: "论坛精彩讨论",
      imageUrl: "/banners/town-banner-2.jpg",
      type: "route",
      route: "/community"
    },
    {
      id: 3,
      title: "任务中心",
      imageUrl: "/banners/town-banner-3.jpg",
      type: "route",
      route: "/task-center"
    }
  ];
  console.log("已设置默认轮播图数据");
};

// 处理轮播图点击
const handleBannerClick = (banner) => {
  if (banner.type === 'link') {
    window.location.href = banner.link;
  } else if (banner.type === 'route') {
    router.push(banner.route);
  } else if (banner.type === 'activity') {
    // 对于活动类型，跳转到活动详情页
    router.push(`/activities/${banner.id}`);
  } else {
    // 默认操作，可能是修改前的数据结构
    console.log("处理未识别的轮播图类型:", banner);
    if (banner.route) {
      router.push(banner.route);
    } else if (banner.id) {
      router.push(`/activities/${banner.id}`);
    }
  }
};

// 处理图片加载错误
const handleImageError = (event, item) => {
  console.error("图片加载失败:", item.imageUrl);
  
  // 尝试不同的图片路径方案
  if (!item.retryCount) {
    item.retryCount = 0;
  }
  
  item.retryCount++;
  
  const imageName = item.originalImage;
  let newUrl = '/default-cover.jpg';
  
  if (imageName) {
    // 根据重试次数依次尝试不同路径
    switch(item.retryCount) {
      case 1: 
        // 标准路径 (活动页面使用的路径)
        newUrl = `${API_BASE_URL}/uploads/covers/${imageName}`; 
        break;
      case 2: 
        // 尝试用户提示的路径
        newUrl = `${API_BASE_URL}/uploads/images/activities/${imageName}`; 
        break;
      case 3: 
        // 尝试其他可能路径
        newUrl = `${API_BASE_URL}/uploads/${imageName}`; 
        break;
      case 4: 
        newUrl = `${API_BASE_URL}/images/${imageName}`; 
        break;
      case 5:
        newUrl = `${API_BASE_URL}/${imageName}`;
        break;
      default:
        // 重试次数过多，使用默认图片
        console.log("所有图片路径方案都失败，使用默认图片");
        event.target.src = '/default-cover.jpg';
        return;
    }
  }
  
  console.log(`尝试使用新图片地址(第${item.retryCount}次): ${newUrl}`);
  event.target.src = newUrl;
  item.imageUrl = newUrl; // 更新对象中的URL
};

// 组件挂载时加载数据
onMounted(async () => {
  await Promise.all([
    loadAnnouncements(),
    loadHotPosts(),
    loadActivities()
  ]);
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 55px; /* 为底部导航栏留出空间 */
  padding-top: var(--safe-area-top); /* 添加顶部安全区域 */
}

.town-page {
  padding-top: 60px;
  padding-bottom: 16px;
}

/* 顶部标题栏 */
.page-header {
  position: fixed;
  top: var(--safe-area-top); /* 修改顶部位置，考虑安全区域 */
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

.header-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 轮播图样式 */
.banner-section {
  margin-bottom: 20px;
  touch-action: pan-y;
  user-select: none;
}

.banner-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transform: translateZ(0);
  -webkit-transform: translateZ(0); /* 移动端优化 */
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  color: white;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  font-size: 14px;
  font-weight: 500;
}

/* 板块宣传图样式 */
.section-banner {
  position: relative;
  height: 150px; /* 增加高度容纳更多内容 */
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  cursor: pointer;
}

.section-banner-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.banner-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 45%; /* 限制左侧内容的宽度 */
}

.section-banner-title {
  margin: 0;
  color: white;
  font-size: 28px;
  font-weight: 600;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
}

.section-banner-subtitle {
  margin: 5px 0 0 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  max-width: 170px; /* 减小副标题最大宽度 */
  text-align: left; /* 确保文本左对齐 */
  padding-left: 0; /* 移除左内边距 */
  align-self: flex-start; /* 确保元素自身左对齐 */
}

.banner-stats {
  display: flex;
  gap: 20px;
}

.banner-stat-item {
  text-align: center;
}

.banner-stat-value {
  color: white;
  font-size: 32px; /* 增大数字字体大小 */
  font-weight: 700;
  margin-bottom: 2px;
}

.banner-stat-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

/* 公共模块样式 */
.announcement-section,
.forum-section {
  margin: 0 16px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  padding: 16px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.more-btn {
  display: flex;
  align-items: center;
  color: #999;
  font-size: 13px;
  cursor: pointer;
}

.more-btn:hover {
  color: #1677ff;
}

/* 公告区域样式 */
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.announcement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background-color: #f5f7fa;
  transition: all 0.3s ease;
}

.announcement-item:hover {
  background-color: #e8f3ff;
}

.announcement-info {
  flex: 1;
  min-width: 0;
  text-align: left; /* 确保内容靠左对齐 */
}

.announcement-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left; /* 确保标题文本靠左对齐 */
}

.announcement-time {
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
  margin-left: 8px;
}

/* 论坛区域样式 */
.forum-posts {
  display: flex;
  flex-direction: column;
}

.forum-post-item {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 12px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.3s ease;
}

.forum-post-item:hover {
  background-color: #f9f9f9;
}

.post-content {
  flex: 1;
  min-width: 0;
  text-align: left; /* 确保内容区域整体靠左对齐 */
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.4;
  text-align: left; /* 确保帖子标题靠左显示 */
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  font-size: 13px;
  color: #999;
}

.post-author {
  color: #666;
}

.post-stats {
  display: flex;
  gap: 10px;
}

.post-time {
  color: #999;
}

.hot-tag {
  position: absolute;
  top: 16px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #ff9c00;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.pin-tag {
  position: absolute;
  top: 16px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #1677ff;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

/* 当同时有热门和置顶标签时，调整置顶标签位置 */
.forum-post-item .hot-tag + .pin-tag {
  right: 60px;
}

/* 空状态样式 */
.empty-state {
  padding: 20px 0;
  display: flex;
  justify-content: center;
}

/* 轮播图样式覆盖 */
:deep(.el-carousel__item) {
  border-radius: 8px;
}

:deep(.el-carousel__indicators) {
  bottom: 0;
  transform: translateY(20px);
}

:deep(.el-carousel__indicators--outside button) {
  width: 10px;
  height: 10px;
  border-radius: 5px;
  opacity: 0.6;
  background-color: #1677ff;
  margin: 0 6px;
}

:deep(.el-carousel__indicator.is-active button) {
  opacity: 1;
  width: 18px;
}

/* 论坛渐变色 */
.forum-gradient {
  background: linear-gradient(135deg, #1677ff, #0099ff, #00c4ff);
}

/* 活动区域样式 */
.activities-section {
  margin: 0 16px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  padding: 16px;
  overflow: hidden;
}

.activities-section .banner-section {
  margin-bottom: 0;
  padding-top: 8px;
}

/* 轮播图左右箭头样式 */
:deep(.el-carousel__arrow) {
  width: 36px;
  height: 36px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  font-size: 12px;
  transition: all 0.3s;
}

:deep(.el-carousel__arrow:hover) {
  background-color: rgba(0, 0, 0, 0.5);
}

:deep(.el-carousel__arrow--left) {
  left: 10px;
}

:deep(.el-carousel__arrow--right) {
  right: 10px;
}
</style> 