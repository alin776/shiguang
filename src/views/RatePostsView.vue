<template>
  <div class="rate-posts-view">
    <div class="top-spacing"></div>
    
    <div class="content-section">
      <!-- 置顶按钮 -->
      <div class="action-bar">
        <button class="primary-btn" @click="goToCreate">
          <i class="fas fa-plus"></i> 创建评分贴
        </button>
      </div>

      <!-- 评分贴分类 -->
      <div class="category-section">
        <div 
          v-for="(category, index) in categories" 
          :key="index" 
          :class="['category-item', activeCategory === category.id ? 'active' : '']"
          @click="setActiveCategory(category.id)"
        >
          {{ category.name }}
        </div>
      </div>

      <!-- 评分贴列表 -->
      <div class="rate-posts-container">
        <div v-for="post in filteredPosts" :key="post.id" class="rate-post-card" @click="goToDetail(post.id)">
          <div class="rate-post-header">
            <h3>{{ post.title }}</h3>
            <div class="rate-post-stats">
              <span>{{ typeof post.totalRatings === 'number' ? post.totalRatings : parseInt(post.totalRatings || 0) }}人评分</span>
            </div>
          </div>

          <div class="rate-options-preview">
            <div v-for="option in post.topOptions" :key="option.id" class="rate-option-item">
              <div class="option-info-row">
                <div class="option-avatar">
                  <img :src="option.avatar" :alt="option.name">
                </div>
                <div class="option-info">
                  <div class="option-name">{{ option.name }}</div>
                  <div class="option-ratings">{{ option.ratings }}人评分</div>
                </div>
                <div class="option-score-container">
                  <div class="option-score">
                    {{ option.score }}
                  </div>
                </div>
              </div>
              <!-- 热门评论展示区域 -->
              <div class="top-comment" v-if="option.topComment">
                <div class="quote-mark">"</div>
                <div class="top-comment-content">{{ option.topComment }}</div>
                <div class="quote-mark closing">"</div>
              </div>
            </div>
          </div>

          <div class="rate-post-footer">
            <div class="more-options">
              查看更多选项 <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMorePosts">
        <button class="load-more-btn" @click="loadMore" :disabled="isLoading">
          {{ isLoading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>

    <!-- 添加底部导航栏 -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import BottomNavBar from '../components/BottomNavBar.vue';

const router = useRouter();
const isLoading = ref(false);
const hasMorePosts = ref(true);
const page = ref(1);
const activeCategory = ref('all');

// 分类数据
const categories = ref([
  { id: 'all', name: '全部' },
  { id: 'movie', name: '电影' },
  { id: 'game', name: '游戏' },
  { id: 'platform', name: '平台' },
  { id: 'brand', name: '品牌' },
  { id: 'other', name: '其他' }
]);

// 模拟数据，实际应从API获取
const ratePosts = ref([
  {
    id: 1,
    title: '《海贼王》经典台词系列',
    category: 'movie',
    totalRatings: 36.5,
    topOptions: [
      {
        id: 101,
        name: '什么都没有发生过',
        avatar: '/src/assets/rating/onepiece1.jpg',
        score: 9.9,
        ratings: 3.3,
        topComment: '一句话把人格魅力拉到顶级'
      },
      {
        id: 102,
        name: '我是旧时代残党新时代没有载体',
        avatar: '/src/assets/rating/onepiece2.jpg',
        score: 9.9,
        ratings: 1.5,
        topComment: '太悲壮了'
      },
      {
        id: 103,
        name: '我是要成为海贼王的男人',
        avatar: '/src/assets/rating/onepiece3.jpg',
        score: 9.8,
        ratings: 1.3,
        topComment: '就为了这句话，汉库克多年后终成海贼王夫人'
      }
    ]
  },
  {
    id: 2,
    title: 'NBA球星logo',
    category: 'brand',
    totalRatings: 1.1,
    topOptions: [
      {
        id: 201,
        name: '罗斯',
        avatar: '/src/assets/rating/nba1.jpg',
        score: 9.9,
        ratings: 0.1601,
        topComment: '换发型呀呀呀'
      },
      {
        id: 202,
        name: '飞人',
        avatar: '/src/assets/rating/nba2.jpg',
        score: 9.9,
        ratings: 0.1222,
        topComment: '女侠干啥呢?'
      },
      {
        id: 203,
        name: '科比',
        avatar: '/src/assets/rating/nba3.jpg',
        score: 9.0,
        ratings: 0.0849,
        topComment: '有点像拯救者'
      }
    ]
  }
]);

// 根据分类筛选帖子
const filteredPosts = computed(() => {
  if (activeCategory.value === 'all') {
    return ratePosts.value;
  }
  return ratePosts.value.filter(post => post.category === activeCategory.value);
});

// 设置当前分类
const setActiveCategory = (categoryId) => {
  activeCategory.value = categoryId;
  // 重置分页
  page.value = 1;
  loadRatePosts();
};

// 加载更多评分贴
const loadMore = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  page.value++;
  
  try {
    // 从后端API获取更多数据
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts?category=${activeCategory.value}&page=${page.value}&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('获取更多评分贴失败');
    }
    
    const result = await response.json();
    
    if (result.success) {
      ratePosts.value = [...ratePosts.value, ...result.data];
      hasMorePosts.value = result.hasMore;
    } else {
      console.error('获取更多评分贴失败:', result.message);
    }
    
    isLoading.value = false;
  } catch (error) {
    console.error('加载更多评分贴失败', error);
    isLoading.value = false;
  }
};

// 加载评分贴数据
const loadRatePosts = async () => {
  isLoading.value = true;
  
  try {
    // 从后端API获取数据
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts?category=${activeCategory.value}&page=${page.value}&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('获取评分贴列表失败');
    }
    
    const result = await response.json();
    
    if (result.success) {
      // 处理API返回的数据，确保totalRatings属性正确
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(post => {
          // 如果返回的是total_ratings字段而不是totalRatings，进行转换
          if (post.total_ratings !== undefined && post.totalRatings === undefined) {
            post.totalRatings = parseInt(post.total_ratings || 0);
          }
          
          // 确保totalRatings是整数
          if (post.totalRatings !== undefined) {
            post.totalRatings = parseInt(post.totalRatings || 0);
          }
        });
      }
      
      if (page.value === 1) {
        ratePosts.value = result.data;
      } else {
        ratePosts.value = [...ratePosts.value, ...result.data];
      }
      hasMorePosts.value = result.hasMore;
    } else {
      console.error('获取评分贴列表失败:', result.message);
      // 使用模拟数据作为备份
      console.log('使用模拟数据代替');
    }
    
    isLoading.value = false;
  } catch (error) {
    console.error('加载评分贴失败', error);
    isLoading.value = false;
  }
};

// 跳转到详情页
const goToDetail = (postId) => {
  router.push(`/rate-posts/${postId}`);
};

// 跳转到创建页面
const goToCreate = () => {
  router.push('/rate-posts/create');
};

onMounted(() => {
  loadRatePosts();
});
</script>

<style scoped>
.rate-posts-view {
  padding-bottom: 60px;
  width: 100%;
  max-width: none;
  margin: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}

.top-spacing {
  height: 40px;
  width: 100%;
  background-color: #f8f9fa;
  flex-shrink: 0;
}

.content-section {
  padding: 10px 15px;
  max-width: none;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.primary-btn {
  background-color: var(--primary-color, #00a0e9);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.category-section {
  display: flex;
  overflow-x: auto;
  margin-bottom: 15px;
  padding: 5px 0;
  white-space: nowrap;
}

.category-item {
  padding: 6px 12px;
  margin-right: 8px;
  border-radius: 16px;
  background-color: #f0f0f0;
  font-size: 14px;
  cursor: pointer;
}

.category-item.active {
  background-color: var(--primary-color, #00a0e9);
  color: white;
}

.rate-post-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
  padding: 15px;
  cursor: pointer;
}

.rate-post-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
}

.rate-post-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 0.03em;
  line-height: 1.4;
  color: #333;
  text-shadow: 0 1px 1px rgba(0,0,0,0.05);
  padding-bottom: 5px;
  position: relative;
}

.rate-post-header h3::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, var(--primary-color, #00a0e9), transparent);
}

.rate-post-stats {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.rate-options-preview {
  margin-bottom: 10px;
}

.rate-option-item {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.rate-option-item:last-child {
  border-bottom: none;
}

.option-info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  width: 100%;
  justify-content: flex-start;
}

.option-avatar {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 4px;
  overflow: hidden;
}

.option-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.option-info {
  flex: 2;
  min-width: 0;
  text-align: left;
}

.option-score-container {
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
}

.option-score {
  font-size: 26px;
  font-weight: bold;
  background-image: linear-gradient(to right, #00a0e9, #70c8f0);
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0px 1px 2px rgba(0, 160, 233, 0.2);
  text-align: right;
  min-width: 50px;
}

.option-comment {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  padding: 0 15px;
  margin-top: 10px;
}

.option-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  text-align: left;
  padding-right: 10px;
}

.option-ratings {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.rate-post-footer {
  display: flex;
  justify-content: flex-start;
  margin-top: 10px;
}

.more-options {
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.load-more {
  display: flex;
  justify-content: flex-start;
  margin-top: 20px;
}

.load-more-btn {
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
}

.load-more-btn:disabled {
  opacity: 0.6;
}

/* 热门评论样式 - 与RatePostDetailView一致 */
.top-comment {
  background: linear-gradient(to right, #fff6e9, #ffffff);
  border-radius: 8px;
  padding: 4px 15px;
  position: relative;
  margin-top: 10px;
}

.quote-mark {
  font-size: 24px;
  color: #ffab40;
  position: absolute;
  top: -5px;
  left: 7px;
  opacity: 0.4;
}

.quote-mark.closing {
  top: auto;
  bottom: -15px;
  right: 7px;
  left: auto;
}

.top-comment-content {
  font-size: 16px;
  color: #B04500;
  line-height: 1.6;
  padding: 0 15px 0 5px;
  font-family: "楷体", "KaiTi", "STKaiti", serif;
  letter-spacing: 0.02em;
  font-weight: 400;
  text-align: left;
}
</style> 