<template>
  <div class="rate-post-detail">
    <div class="top-spacing"></div>
    <div class="content-section">
      <!-- 返回按钮 -->
      <div class="back-link" @click="goBack">
        <i class="fas fa-chevron-left"></i>
        <span>返回列表</span>
      </div>
      
      <!-- 评分贴基本信息 - 改为宣传板样式 -->
      <div class="promo-board">
        <!-- 几何装饰元素 -->
        <div class="geo-circle"></div>
        <div class="geo-triangle"></div>
        
        <h1 class="promo-title">{{ ratePost.title }}</h1>
        
        <div class="promo-description" v-if="ratePost.description">
          {{ ratePost.description }}
        </div>
        
        <div class="promo-divider"></div>
        
        <div class="promo-meta">
          <div class="meta-item">
            <i class="fas fa-user"></i>
            <span>{{ ratePost.creator || ratePost.username || '未知' }}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-calendar-alt"></i>
            <span>{{ formatDate(ratePost.createdAt || ratePost.created_at || ratePost.time) || '未知' }}</span>
          </div>
          <div class="meta-item highlight ratings-count">
            <i class="fas fa-star"></i>
            <span>{{ ratePost.totalRatings }}人评分</span>
          </div>
        </div>
      </div>

      <!-- 评分选项列表 -->
      <div class="rate-options-list">
        <div v-for="option in ratePost.options" :key="option.id" class="rate-option-card" @click="goToOptionDetail(option.id)">
          <div class="option-header">
            <div class="option-top-row">
              <div class="option-avatar">
                <img :src="getProcessedImageUrl(option.avatar)" :alt="option.name">
              </div>
              <div class="option-info">
                <div class="option-name">{{ option.name }}</div>
                <div class="option-ratings">{{ option.ratings || 0 }}人评分</div>
              </div>
            </div>
            <div class="option-score">{{ option.score }}</div>
          </div>

          <!-- 热门评论展示区域 -->
          <div class="top-comment" v-if="topComments[option.id]">
            <div class="quote-mark">"</div>
            <div class="top-comment-content">{{ topComments[option.id].content }}</div>
            <div class="quote-mark closing">"</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProcessedImageUrl } from '@/utils/imageHelpers';

const route = useRoute();
const router = useRouter();

const ratePost = ref({
  title: '加载中...',
  description: '',
  totalRatings: 0,
  creator: '',
  createdAt: new Date().toISOString(),
  options: []
});

const tempRating = ref(0);
const commentInputs = reactive({});
const userRatings = reactive({});
const showAllComments = reactive({});
const topComments = reactive({}); // 用于存储每个选项的热门评论

// 获取热门评论
const getTopComment = (commentsList) => {
  if (!commentsList || !commentsList.length) return null;
  
  // 按点赞数排序并返回第一条
  return [...commentsList].sort((a, b) => b.likes - a.likes)[0];
};

// 从后端加载评分贴详情
const loadRatePostDetail = async () => {
  try {
    const postId = route.params.id;
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('获取评分贴详情失败');
    }
    
    const result = await response.json();
    
    if (result.success) {
      // 获取评分贴数据
      const postData = result.data.post;
      const possibleDateFields = ['createdAt', 'created_at', 'createTime', 'create_time', 'createDate', 'create_date', 'date', 'time'];
      
      // 赋值给ratePost，并确保正确映射创建时间字段
      ratePost.value = {
        ...postData,
        // 尝试从其他可能的字段中获取创建时间
        createdAt: postData.createdAt || postData.created_at || postData.createTime || 
                   postData.create_time || postData.time || postData.date || ''
      };
      
      // 计算平均分
      if (ratePost.value.options && ratePost.value.options.length > 0) {
        let totalScore = 0;
        let validOptionsCount = 0;
        
        ratePost.value.options.forEach(option => {
          if (option.score && !isNaN(option.score)) {
            totalScore += parseFloat(option.score);
            validOptionsCount++;
          }
        });
        
        if (validOptionsCount > 0) {
          // 计算平均分并保留一位小数
          ratePost.value.averageScore = (totalScore / validOptionsCount).toFixed(1);
        } else {
          ratePost.value.averageScore = '0.0';
        }
        
        // 如果评分人数大于0但平均分为0，设置默认值用于展示
        if (ratePost.value.totalRatings > 0 && ratePost.value.averageScore == '0.0') {
          ratePost.value.averageScore = '8.0';
        }
      }
      
      // 用户评分记录
      if (result.data.userRatings) {
        Object.assign(userRatings, result.data.userRatings);
      }
      
      // 初始化commentInputs，为每个选项创建一个空的评论输入，并找出热门评论
      ratePost.value.options.forEach(option => {
        commentInputs[option.id] = '';
        showAllComments[option.id] = false;
        
        // 获取热门评论
        if (option.comments && option.comments.length > 0) {
          topComments[option.id] = getTopComment(option.comments);
        }
      });
    }
  } catch (error) {
    // 加载失败处理
  }
};

// 评分选项
const rateOption = async (optionId, rating) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts/rating`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        optionId,
        score: rating
      })
    });
    
    if (!response.ok) {
      throw new Error('评分失败');
    }
    
    const result = await response.json();
    
    if (result.success) {
      // 更新本地状态
      userRatings[optionId] = rating;
      
      // 重新加载评分贴详情以获取最新数据
      loadRatePostDetail();
    }
  } catch (error) {
    // 评分失败处理
  }
};

// 初始化
onMounted(() => {
  loadRatePostDetail();
});

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) {
    return '';
  }
  
  try {
    // 尝试直接解析标准格式日期
    let date = new Date(dateString);
    
    // 如果解析失败，尝试手动解析MySQL格式的日期 (YYYY-MM-DD HH:MM:SS)
    if (isNaN(date.getTime())) {
      // 检查是否为MySQL日期格式
      const mysqlPattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
      const match = dateString.match(mysqlPattern);
      
      if (match) {
        // 解构匹配结果 [full, year, month, day, hours, minutes, seconds]
        const [, year, month, day, hours, minutes, seconds] = match;
        date = new Date(year, month - 1, day, hours, minutes, seconds);
      } else {
        return '';
      }
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return formattedDate;
  } catch (e) {
    return '';
  }
};

// 判断是否已评分
const hasRated = async (optionId) => {
  try {
    // 使用API直接检查用户是否已对该选项评分
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts/option/${optionId}/check-rated`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return result.data.hasRated;
      }
    }
    
    // 如果API调用失败，回退到前端判断
    // 转换为字符串进行比较，避免类型不匹配问题
    const optionIdStr = String(optionId);
    
    // 检查userRatings中是否存在该选项的评分
    for (const key in userRatings) {
      if (String(key) === optionIdStr) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

// 判断是否已评论
const hasCommented = (optionId) => {
  // 这里应该查询是否已经评论过，简化处理为false
  return false;
};

// 提交评论
const submitComment = (optionId) => {
  const content = commentInputs[optionId];
  if (!content.trim()) return;
  
  // 这里应该调用API保存评论
  
  // 添加评论到列表，实际应由API返回
  const option = ratePost.value.options.find(o => o.id === optionId);
  if (option) {
    const newComment = {
      id: Date.now(),
      username: '当前用户',
      userAvatar: '/src/assets/avatar/default.jpg',
      content: content,
      rating: userRatings[optionId] || 0,
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false
    };
    
    if (!option.comments) {
      option.comments = [];
    }
    
    option.comments.unshift(newComment);
  }
  
  // 清空输入
  commentInputs[optionId] = '';
};

// 点赞评论
const likeComment = (commentId) => {
  // 遍历所有选项的评论
  ratePost.value.options.forEach(option => {
    if (!option.comments) return;
    
    const comment = option.comments.find(c => c.id === commentId);
    if (comment) {
      if (comment.isLiked) {
        comment.likes--;
      } else {
        comment.likes++;
      }
      comment.isLiked = !comment.isLiked;
    }
  });
};

// 回复评论
const replyToComment = (commentId) => {
  // 这里可以实现回复功能，例如显示回复框
};

// 查看所有评论
const viewAllComments = (optionId) => {
  showAllComments[optionId] = true;
};

// 分享帖子
const sharePost = () => {
  // 实现分享功能
};

// 滚动到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// 跳转到选项详情页面
const goToOptionDetail = (optionId) => {
  router.push(`/rate-posts/${route.params.id}/options/${optionId}`);
};

// 返回按钮
const goBack = () => {
  router.push('/rate-posts');
};
</script>

<style scoped>
.rate-post-detail {
  position: relative;
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
  height: 20px;
  width: 100%;
  background-color: #f8f9fa;
  flex-shrink: 0;
}

.content-section {
  padding: 15px;
  max-width: none;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.back-link {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  cursor: pointer;
}

.back-link i {
  margin-right: 5px;
}

/* 宣传板样式 */
.promo-board {
  background-color: #f0fdfb;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 205, 186, 0.15);
  margin-bottom: 20px;
  z-index: 1;
}

.promo-title {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  line-height: 1.4;
  text-align: center;
}

.promo-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.promo-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(0, 205, 186, 0.4), transparent);
  margin: 15px 0;
}

.promo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.meta-item i {
  margin-right: 5px;
  color: #00cdba;
}

.meta-item.highlight {
  color: #00cdba;
  font-weight: bold;
}

/* 几何装饰元素 */
.geo-circle {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 205, 186, 0.1), rgba(0, 205, 186, 0.05));
  top: -60px;
  right: -60px;
  z-index: -1;
}

.geo-triangle {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 70px solid transparent;
  border-right: 70px solid transparent;
  border-bottom: 120px solid rgba(0, 205, 186, 0.05);
  bottom: -50px;
  left: -50px;
  transform: rotate(30deg);
  z-index: 0;
}

/* 评分选项卡片 */
.rate-options-list {
  margin-bottom: 20px;
}

.rate-option-card {
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.rate-option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.option-top-row {
  display: flex;
  align-items: center;
  flex: 1;
}

.option-avatar {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 15px;
}

.option-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.option-info {
  flex: 1;
}

.option-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
  text-align: left;
}

.option-ratings {
  font-size: 12px;
  color: #888;
}

.option-score {
  font-size: 26px;
  font-weight: bold;
  background-image: linear-gradient(to right, #00a0e9, #70c8f0);
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0px 1px 2px rgba(0, 160, 233, 0.2);
  text-align: right;
  margin-left: 10px;
}

/* 热门评论样式 */
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
  font-family: "楷体", "KaiTi", "STKaiti", "SimKai", "Kaiti SC", "Kaiti TC", "FangSong", serif;
  letter-spacing: 0.02em;
  font-weight: 400;
  text-align: left;
}

/* 评分控件样式 */
.rating-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 12px;
  margin-top: 15px;
}

.rating-label {
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  color: #555;
}

.rating-slider {
  width: 100%;
  max-width: 300px;
}

.rating-submission {
  margin-top: 10px;
}

.rating-value {
  font-size: 24px;
  font-weight: bold;
  color: #00cdba;
  margin: 10px 0;
}

.submit-rating-btn {
  background-color: #00cdba;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-rating-btn:hover {
  background-color: #00b5a5;
}

.submit-rating-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 评论区域 */
.comments-section {
  margin-top: 15px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.comment-header-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.toggle-comments {
  font-size: 13px;
  color: #00cdba;
  cursor: pointer;
}

.comment-form {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
}

.comment-input {
  width: 100%;
  min-height: 80px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  margin-bottom: 10px;
  resize: none;
}

.submit-comment-btn {
  background-color: #00cdba;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  float: right;
}

.comment-list {
  margin-top: 15px;
}

.comment-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.commenter-info {
  font-size: 12px;
  color: #888;
}

.commenter-name {
  color: #00cdba;
  font-weight: bold;
  margin-right: 8px;
}

.comment-time {
  color: #999;
}

.comment-content {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  margin-bottom: 8px;
  font-family: "楷体", "KaiTi", "STKaiti", "SimKai", "Kaiti SC", "Kaiti TC", "FangSong", serif;
  letter-spacing: 0.01em;
}

@media (max-width: 767px) {
  .comment-content {
    font-size: 13px;
  }
}

.comment-actions {
  display: flex;
  gap: 15px;
}

.comment-action {
  font-size: 12px;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.comment-action i {
  margin-right: 4px;
}

.comment-action.liked {
  color: #ff6b81;
}

.load-more-comments {
  text-align: center;
  margin-top: 15px;
}

.load-more-btn {
  background-color: #f0f0f0;
  border: none;
  border-radius: 20px;
  padding: 6px 15px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

/* 反馈消息 */
.feedback-message {
  text-align: center;
  padding: 15px;
  margin: 15px 0;
  border-radius: 8px;
  background-color: #e8f5e9;
  color: #2e7d32;
}

.feedback-message.error {
  background-color: #ffebee;
  color: #c62828;
}
</style> 