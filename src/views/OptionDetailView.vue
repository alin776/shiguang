<template>
  <div class="option-detail">
    <div class="top-spacing"></div>
    <div class="content-section">
      <!-- 返回按钮 -->
      <div class="back-link" @click="goBack">
        <i class="fas fa-chevron-left"></i>
        <span>返回《{{ ratePost.title }}》</span>
      </div>
      
      <!-- 加载状态 -->
      <div class="loading-state" v-if="isLoading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <!-- 错误提示 -->
      <div class="error-message" v-else-if="loadError">
        <i class="fas fa-exclamation-triangle"></i>
        <p>加载选项信息失败，请检查网络连接并重试。</p>
        <button class="retry-button" @click="loadOptionDetail">重新加载</button>
        <button class="back-button" @click="goBack">返回评分贴</button>
      </div>
      
      <!-- 找不到选项提示 -->
      <div class="error-message" v-else-if="!isValidOption">
        <i class="fas fa-exclamation-circle"></i>
        <p>找不到指定的选项信息，请返回上一页重试。</p>
        <button class="back-button" @click="goBack">返回评分贴</button>
      </div>
      
      <!-- 选项详情卡片 -->
      <div class="detail-card" v-else>
        <div class="card-header">
          <h1 class="option-title">{{ option.name }}</h1>
        </div>
        
        <div class="card-content">
          <!-- 选项信息 -->
          <div class="option-info">
            <div class="option-image">
              <img :src="getProcessedImageUrl(option.avatar)" :alt="option.name">
            </div>
            <div class="option-data">
              <div class="rating-display">
                <div class="score-number">{{ option.score || 0 }}</div>
                <div class="rating-info">
                  <div class="star-rating">
                    <div class="svg-stars">
                      <svg v-for="i in 5" :key="i" 
                        :class="['svg-star', { active: i <= Math.round((option.score || 0)/2) }]"
                        viewBox="0 0 24 24" width="18" height="18">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                    </div>
                    <div class="rating-count">{{ option.ratings }}人评分</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 热门评论 -->
          <div class="top-comment" v-if="topComment">
            <div class="quote-mark">"</div>
            <div class="top-comment-content">{{ topComment.content }}</div>
            <div class="quote-mark closing">"</div>
          </div>
          
          <!-- 评分分布 -->
          <div class="rating-distribution">
            <h3 class="section-title">评分分布</h3>
            <div class="distribution-bars">
              <div v-for="i in 5" :key="i" class="dist-row">
                <div class="star-label">{{ 6-i }}星</div>
                <div class="dist-bar-bg">
                  <div class="dist-bar-fill" :style="{ width: getDistribution(6-i) + '%' }"></div>
                </div>
                <div class="dist-percentage">{{ getDistribution(6-i) }}%</div>
              </div>
            </div>
          </div>
          
          <!-- 评分详情 -->
          <div class="rating-details" v-if="option.ratingsDetail && option.ratingsDetail.length > 0">
            <h3 class="section-title">
              评分详情
              <span v-if="!showRatingDetails" @click="toggleRatingDetails" class="toggle-link">(展开)</span>
              <span v-else @click="toggleRatingDetails" class="toggle-link">(收起)</span>
            </h3>
            <div class="ratings-table-container" v-if="showRatingDetails">
              <table class="ratings-table">
                <thead>
                  <tr>
                    <th>用户</th>
                    <th>评分</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(rating, index) in option.ratingsDetail" :key="index">
                    <td>{{ rating.username || '匿名用户' }}</td>
                    <td>{{ rating.score }}</td>
                    <td>{{ formatDate(rating.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- 评分功能 -->
          <div class="rating-comment-card">
            <h2 class="rating-title">
              <span v-if="!hasRated">我要评分</span>
              <span v-else>我的评分</span>
            </h2>
            
            <div v-if="hasRated" class="my-rating-info">
              <div class="my-rating-display">
                <div class="my-rating-text">您已评分 <span class="rating-score">{{ userRating }}</span> 分</div>
                <div class="my-rating-stars">
                  <svg v-for="i in 5" :key="i" 
                    :class="['svg-star', { active: i <= Math.round(userRating/2) }]"
                    viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                </div>
              </div>
              <div class="rating-tip">感谢您的参与，每个选项仅能评分一次</div>
            </div>
            
            <div v-else>
              <div class="star-rating-container">
                <div class="stars">
                  <svg 
                    v-for="star in 5" 
                    :key="star" 
                    @click="tempRating = star*2" 
                    @mouseover="tempRating = star*2"
                    :class="['svg-star', { active: star*2 <= tempRating }]"
                    viewBox="0 0 24 24" width="32" height="32" 
                    style="cursor: pointer; margin-right: 5px;">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  <span v-if="tempRating > 0" class="rating-value">{{ tempRating }}.0分</span>
                </div>
              </div>
              
              <div class="comment-textarea">
                <textarea 
                  v-model="commentText" 
                  placeholder="分享你的想法..." 
                  rows="5"
                  :disabled="commentSubmitting">
                </textarea>
              </div>
              
              <button class="submit-rating-btn" 
                      @click="submitRatingAndComment(option.id, tempRating)"
                      :disabled="commentSubmitting || tempRating === 0">
                提交评分
              </button>
            </div>
          </div>
          
          <!-- 用户评论列表 -->
          <div class="comments-section">
            <div class="section-header">
              <h3 class="section-title">用户评论 ({{ option.comments ? option.comments.length : 0 }})</h3>
              <div class="sort-options">
                <span 
                  class="sort-option" 
                  :class="{ active: commentSortBy === 'hot' }" 
                  @click="changeCommentSort('hot')">热门</span>
                <span 
                  class="sort-option" 
                  :class="{ active: commentSortBy === 'latest' }" 
                  @click="changeCommentSort('latest')">最新</span>
              </div>
            </div>
            <div class="comments-list" v-if="option.comments && option.comments.length > 0">
              <div v-for="(comment, index) in sortedComments" :key="index" class="comment-item">
                <div class="comment-user">
                  <div class="user-avatar">
                    <img :src="getAvatarUrl(comment.userAvatar)" alt="">
                  </div>
                  <div class="user-info">
                    <div class="comment-header">
                      <div class="username">{{ comment.username }}</div>
                    </div>
                    <div class="rating-time-row">
                      <div class="comment-rating">
                        <svg v-for="i in 5" :key="i" 
                          :class="['svg-star-small', { active: i <= Math.round(comment.rating/2) }]"
                          viewBox="0 0 24 24" width="12" height="12">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                      </div>
                      <div class="comment-date">{{ formatDate(comment.createdAt) }}</div>
                    </div>
                  </div>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
                <div class="comment-actions">
                  <div class="like-count" @click="likeComment(comment.id)">
                    <i :class="['fas fa-thumbs-up', comment.isLiked ? 'liked' : '']"></i>
                    <span>{{ comment.likes }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="no-comments" v-else>
              暂无评论
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作反馈提示 -->
      <div class="action-toast" v-if="showToast" :class="{ show: showToast, success: toastType === 'success', error: toastType === 'error' }">
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAvatarUrl, getDefaultAvatarUrl, getProcessedImageUrl } from '@/utils/imageHelpers';

const route = useRoute();
const router = useRouter();

const ratePost = ref({
  title: '加载中...',
  options: []
});

const option = ref({
  id: '',
  name: '加载中...',
  avatar: '',
  score: 0,
  ratings: 0,
  comments: []
});

const topComment = ref(null);
const isLoading = ref(true);
const loadError = ref(false);
const tempRating = ref(0);
const userRating = ref(0);
const commentText = ref('');
const commentSubmitting = ref(false);

// toast提示
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const commentSortBy = ref('hot'); // 默认按热门排序

const showRatingDetails = ref(false);

// 判断是否为有效选项
const isValidOption = computed(() => {
  return !isLoading.value && option.value && option.value.id && option.value.name !== '未找到选项';
});

// 判断用户是否已评分
const hasRated = computed(() => {
  return userRating.value > 0;
});

// 排序后的评论列表
const sortedComments = computed(() => {
  if (!option.value.comments || option.value.comments.length === 0) {
    return [];
  }
  
  return [...option.value.comments].sort((a, b) => {
    if (commentSortBy.value === 'hot') {
      // 热门排序：按点赞数降序，相同时按日期降序
      return b.likes - a.likes || new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      // 最新排序：按日期降序
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });
});

// 从后端加载评分贴和选项详情
const loadOptionDetail = async () => {
  isLoading.value = true;
  loadError.value = false;
  
  try {
    const postId = route.params.id;
    const optionId = route.params.optionId;
    
    // 首先直接检查用户是否已对该选项评分
    const ratedCheckResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts/option/${optionId}/check-rated`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    let hasUserRated = false;
    let userRatingValue = 0;
    if (ratedCheckResponse.ok) {
      const ratedResult = await ratedCheckResponse.json();
      if (ratedResult.success && ratedResult.data.hasRated) {
        // 如果用户已评分，直接更新状态
        hasUserRated = true;
        // 如果API返回了评分值，先记录下来
        if (ratedResult.data.rating) {
          userRatingValue = ratedResult.data.rating;
        }
      }
    }
    
    // 然后加载评分贴详情
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      loadError.value = true;
      throw new Error('获取评分贴详情失败');
    }
    
    const result = await response.json();
    
    if (result.success) {
      // 设置评分贴信息
      const post = result.data.post;
      ratePost.value = post;
      
      // 查找当前选项 - 确保类型一致进行比较
      const currentOption = post.options.find(opt => String(opt.id) === String(optionId));
      
      if (currentOption) {
        // 处理评分为undefined的情况
        if (currentOption.score === undefined || currentOption.score === null) {
          // 先查找用户评分
          let foundUserRating = 0;
          
          // 从userRatings记录中查找
          if (result.data.userRatings) {
            for (const key in result.data.userRatings) {
              if (String(key) === String(optionId)) {
                foundUserRating = result.data.userRatings[key];
                break;
              }
            }
          }
          
          // 如果前面的API调用已经返回了评分，优先使用那个
          if (userRatingValue > 0) {
            foundUserRating = userRatingValue;
          }
          
          // 如果选项有ratings(评分人数)但score是undefined，则使用找到的用户评分
          if (currentOption.ratings && currentOption.ratings > 0 && foundUserRating > 0) {
            currentOption.score = foundUserRating;
          } else {
            currentOption.score = 0;
          }
        }
        
        option.value = currentOption;
        
        // 在评分贴详情加载完成后
        if (currentOption.comments && currentOption.comments.length > 0) {
          // 检查可能的日期字段
          currentOption.comments.forEach(comment => {
            // 尝试查找和规范化日期字段
            if (!comment.createdAt && (comment.created_at || comment.createTime || comment.time)) {
              comment.createdAt = comment.created_at || comment.createTime || comment.time;
            }
          });
          
          topComment.value = [...currentOption.comments].sort((a, b) => b.likes - a.likes)[0];
        }
        
        // 检查用户是否已评分
        userRating.value = 0; // 先重置为未评分状态
        
        // 如果之前的API调用已确认用户已评分，则尝试从userRatings中获取用户的评分值
        if (hasUserRated) {
          if (result.data.userRatings) {
            // 从userRatings中查找当前选项的评分
            for (const key in result.data.userRatings) {
              if (String(key) === String(optionId)) {
                userRating.value = result.data.userRatings[key];
                break;
              }
            }
            
            // 如果没有找到评分记录但API之前确认了用户已评分，则记录这种不一致的情况
            if (userRating.value === 0 && userRatingValue > 0) {
              userRating.value = userRatingValue;
            }
          } else if (userRatingValue > 0) {
            userRating.value = userRatingValue;
          }
        } else {
          // 使用传统方式检查评分记录
          if (result.data.userRatings) {
            // 遍历用户评分记录
            for (const key in result.data.userRatings) {
              if (String(key) === String(optionId)) {
                userRating.value = result.data.userRatings[key];
                break;
              }
            }
          }
        }
        
        // 最后一次检查：如果用户已评分，但选项评分仍为0，则使用用户评分作为选项评分
        if (userRating.value > 0 && option.value.score === 0 && option.value.ratings > 0) {
          option.value.score = userRating.value;
        }
      } else {
        // 设置为无效选项状态，但不自动返回
        option.value = {
          id: optionId,
          name: '未找到选项',
          avatar: '',
          score: 0,
          ratings: 0,
          comments: []
        };
      }
    } else {
      loadError.value = true;
    }
  } catch (error) {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
};

// 提交评分和评论
const submitRatingAndComment = async (optionId, rating) => {
  if (commentSubmitting.value) return;
  
  // 如果用户已经评分过，则不允许再次评分
  if (hasRated.value) {
    showToastMessage('您已经对该选项评分过了', 'error');
    return;
  }
  
  // 添加评分检查
  if (!rating || rating === 0) {
    showToastMessage('请先选择评分星级', 'error');
    return;
  }
  
  commentSubmitting.value = true;
  
  try {
    // 首先提交评分
    const ratingResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts/rating`, {
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
    
    if (!ratingResponse.ok) {
      showToastMessage('评分失败，请稍后重试', 'error');
      throw new Error('评分失败');
    }
    
    const ratingResult = await ratingResponse.json();
    
    if (ratingResult.success) {
      // 更新评分
      userRating.value = rating;
      
      // 如果有评论内容，提交评论
      if (commentText.value.trim()) {
        const commentResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts/comment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            optionId: option.value.id,
            content: commentText.value,
            rating: rating
          })
        });
        
        if (!commentResponse.ok) {
          showToastMessage('评分成功，但评论发表失败', 'error');
          throw new Error('评论失败');
        }
        
        const commentResult = await commentResponse.json();
        
        if (commentResult.success) {
          // 添加本地评论
          if (!option.value.comments) {
            option.value.comments = [];
          }
          
          // 创建一个有效的日期
          const currentDate = new Date().toISOString();
          
          const newComment = {
            id: Date.now(),
            username: '当前用户',
            userAvatar: getDefaultAvatarUrl(),
            content: commentText.value,
            rating: rating,
            createdAt: currentDate,
            likes: 0,
            isLiked: false
          };
          
          option.value.comments.unshift(newComment);
          
          // 清空评论框
          commentText.value = '';
        }
      }
      
      showToastMessage('评分提交成功！', 'success');
      
      // 重新加载数据
      await loadOptionDetail();
    } else {
      showToastMessage(ratingResult.message || '评分失败', 'error');
    }
  } catch (error) {
    showToastMessage('操作失败，请检查网络连接', 'error');
  } finally {
    commentSubmitting.value = false;
  }
};

// 点赞评论
const likeComment = async (commentId) => {
  try {
    // 找到该评论
    const comment = option.value.comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 优先在前端更新，提高用户体验
    const originalLikeStatus = comment.isLiked;
    comment.isLiked = !comment.isLiked;
    comment.likes += comment.isLiked ? 1 : -1;
    
    // 发送请求到服务器
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/rate-posts/comment/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // 如果请求失败，恢复原状态
      comment.isLiked = originalLikeStatus;
      comment.likes = originalLikeStatus ? comment.likes + 1 : comment.likes - 1;
      
      // API不存在，使用本地模拟，不回滚状态
      if (response.status === 404) {
        showToastMessage(comment.isLiked ? '点赞成功' : '已取消点赞', 'success');
        return;
      }
      
      throw new Error('点赞失败');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      // 如果服务器处理失败，恢复原状态
      comment.isLiked = originalLikeStatus;
      comment.likes = originalLikeStatus ? comment.likes + 1 : comment.likes - 1;
      showToastMessage(result.message || '操作失败', 'error');
    } else {
      // 显示成功消息
      showToastMessage(comment.isLiked ? '点赞成功' : '已取消点赞', 'success');
    }
  } catch (error) {
    // 出错时也显示提示
    showToastMessage('网络错误，请稍后重试', 'error');
  }
};

// 获取评分分布
const getDistribution = (stars) => {
  // 首先尝试使用预计算的评分分布
  if (option.value && option.value.ratingDistribution) {
    return option.value.ratingDistribution[stars] || 0;
  }
  
  // 如果没有预计算的分布数据，尝试使用评分详情计算
  if (!option.value || !option.value.ratingsDetail || option.value.ratingsDetail.length === 0) {
    // 如果没有评分详情数据，返回默认值0
    return 0;
  }
  
  // 将10分制评分转换为5星制并计算分布
  const totalRatings = option.value.ratingsDetail.length;
  const starsCount = {};
  
  // 初始化各星级计数
  for (let i = 1; i <= 5; i++) {
    starsCount[i] = 0;
  }
  
  // 统计各星级评分数量
  option.value.ratingsDetail.forEach(rating => {
    // 评分通常是1-10分制，转换为1-5星级
    const starRating = Math.min(5, Math.max(1, Math.ceil(rating.score / 2)));
    starsCount[starRating]++;
  });
  
  // 计算指定星级的百分比
  const percentage = (starsCount[stars] / totalRatings) * 100;
  return percentage.toFixed(1);
};

// 计算评分分布 - 仅用于初始化，已通过上面的getDistribution方法替代
const calculateRatingDistribution = () => {
  // 使用评分详情数据计算分布
};

// 显示Toast消息
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    let date;
    
    // 判断输入类型
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return '';
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // 格式化为 YYYY-MM-DD
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  } catch (e) {
    return '';
  }
};

// 返回上一页
const goBack = () => {
  router.push(`/rate-posts/${route.params.id}`);
};

// 更改评论排序方式
const changeCommentSort = (sortBy) => {
  commentSortBy.value = sortBy;
};

// 切换评分详情显示状态
const toggleRatingDetails = () => {
  showRatingDetails.value = !showRatingDetails.value;
};

// 初始化
onMounted(() => {
  loadOptionDetail();
});
</script>

<style scoped>
.option-detail {
  padding-bottom: 20px;
  width: 100%;
  background-color: #f7f9ff;
  min-height: 100vh;
}

.top-spacing {
  height: 40px;
  width: 100%;
  background-color: #f8f9fa;
  flex-shrink: 0;
}
.content-section {
  padding: 10px;
  max-width: 100%;
  margin: 0 auto;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  cursor: pointer;
  padding: 6px 0;
}

.back-link i {
  margin-right: 5px;
}

.back-link:hover {
  text-decoration: underline;
  color: #00a0e9;
}

.detail-card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 12px;
}

.card-header {
  background-color: #b39b6d;
  color: white;
  padding: 12px 10px;
  text-align: center;
}

.option-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.card-content {
  padding: 12px 10px;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 15px;
  align-items: center;
}

@media (min-width: 480px) {
  .option-info {
    flex-direction: row;
    align-items: flex-start;
  }
  
  .content-section {
    max-width: 500px;
    padding: 12px;
  }
}

.option-image {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.option-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.option-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (min-width: 480px) {
  .option-data {
    align-items: flex-start;
  }
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-number {
  font-size: 36px;
  font-weight: bold;
  color: #26c9dc;
  line-height: 1;
}

.rating-info {
  display: flex;
  flex-direction: column;
}

.star-rating {
  display: flex;
  gap: 4px;
}

.rating-star {
  width: 18px;
  height: 18px;
  color: #ccc;
  fill: #ccc;
}

.rating-star.active {
  color: #26c9dc;
  fill: #26c9dc;
}

/* 添加Font Awesome星星样式 */
.star-rating i {
  font-size: 18px;
  color: #ddd !important;
  transition: color 0.2s ease, transform 0.2s ease;
}

.star-rating i.active {
  color: #26c9dc !important;
  font-weight: bold;
}

.rating-count {
  font-size: 13px;
  color: #666;
  margin-top: 3px;
}

/* 评分功能样式 */
.rating-comment-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 15px;
  margin-bottom: 15px;
}

.rating-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #333;
  text-align: left;
}

.star-rating-container {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 15px;
}

.stars {
  display: flex;
  align-items: center;
  gap: 8px;
}

.star-icon {
  width: 36px;
  height: 36px;
  cursor: pointer;
  color: #000;
  transition: color 0.2s ease, transform 0.2s ease;
}

.star-icon:hover {
  transform: scale(1.1);
}

.star-icon.active {
  color: #26c9dc;
  fill: #26c9dc;
}

.star-icon:not(.active) {
  color: #ddd;
  fill: #ddd;
}

.rating-value {
  margin-left: 12px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.comment-textarea {
  margin-bottom: 15px;
}

.comment-textarea textarea {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
  resize: none;
  outline: none;
}

.submit-rating-btn {
  width: 100%;
  background-color: #888;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-rating-btn:hover:not(:disabled) {
  background-color: #666;
}

.submit-rating-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.top-comment {
  background-color: #fff9e6;
  border-radius: 8px;
  padding: 12px;
  margin: 0 0 15px 0;
  position: relative;
  text-align: center;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  line-height: 1.5;
  border-left: 3px solid #ffc107;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(255, 193, 7, 0.1);
}

.quote-mark {
  font-size: 20px;
  color: #ffc107;
  font-weight: bold;
  line-height: 0;
  position: relative;
  top: 5px;
  margin-right: 5px;
  font-family: 'Georgia', serif;
}

.quote-mark.closing {
  margin-right: 0;
  margin-left: 5px;
}

.top-comment-content {
  flex: 1;
  text-align: center;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  border-left: 4px solid #26c9dc;
  padding-left: 8px;
}

.rating-distribution {
  margin-bottom: 15px;
  background-color: white;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dist-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.star-label {
  width: 32px;
  text-align: right;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.dist-bar-bg {
  flex: 1;
  height: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.dist-bar-fill {
  height: 100%;
  background-color: #26c9dc;
  min-width: 4px;
}

.dist-percentage {
  width: 36px;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.comments-section {
  margin-top: 15px;
  background-color: white;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.sort-options {
  display: flex;
  gap: 10px;
}

.sort-option {
  font-size: 13px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.2s;
}

.sort-option:hover {
  color: #26c9dc;
}

.sort-option.active {
  background-color: rgba(38, 201, 220, 0.1);
  color: #26c9dc;
  font-weight: 500;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.comment-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.comment-user {
  display: flex;
  gap: 8px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.username {
  font-weight: bold;
  font-size: 13px;
}

.rating-time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  width: 100%; /* 确保整行占满宽度 */
}

.comment-rating {
  display: flex;
  gap: 2px;
  flex-grow: 0; /* 防止评分区域占用过多空间 */
  flex-shrink: 0; /* 防止评分区域被压缩 */
}

.comment-date {
  font-size: 11px;
  color: #999;
  margin-left: auto; /* 使其靠右显示 */
  text-align: right; /* 文本右对齐 */
  min-width: 70px; /* 给时间一个最小宽度 */
}

.comment-content {
  font-size: 14px;
  margin: 6px 0;
  line-height: 1.4;
  text-align: left;
  padding-left: 46px; /* 与头像宽度+右边距保持一致 */
}

.comment-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  justify-content: flex-end;
}

.like-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
  cursor: pointer;
}

.like-count i.liked {
  color: #ff6b81;
}

.no-comments {
  text-align: center;
  color: #999;
  padding: 15px 0;
  font-size: 14px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #666;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(38, 201, 220, 0.2);
  border-top-color: #26c9dc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px 12px;
  text-align: center;
  margin-bottom: 15px;
  color: #666;
}

.error-message i {
  font-size: 36px;
  color: #ff6b81;
  margin-bottom: 12px;
}

.error-message p {
  margin-bottom: 15px;
  font-size: 14px;
}

.retry-button, .back-button {
  background-color: #26c9dc;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 4px;
  width: 42%;
  max-width: 130px;
}

.retry-button {
  background-color: #7c63ff;
}

.retry-button:hover, .back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.retry-button:hover {
  background-color: #6a52e5;
}

.back-button:hover {
  background-color: #1eaebb;
}

/* Toast提示样式 */
.action-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 13px;
  z-index: 1000;
  opacity: 0;
  transition: transform 0.3s, opacity 0.3s;
}

.action-toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.action-toast.success {
  background-color: rgba(38, 201, 220, 0.9);
}

.action-toast.error {
  background-color: rgba(255, 107, 129, 0.9);
}

/* 确保评分分布至少显示一点点颜色 */
.dist-bar-fill {
  min-width: 4px;
}

.my-rating-info {
  padding: 10px 0;
  text-align: center;
}

.my-rating-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.my-rating-text {
  font-size: 16px;
  color: #333;
}

.rating-score {
  font-size: 22px;
  font-weight: bold;
  color: #26c9dc;
}

.my-rating-stars {
  display: flex;
  gap: 8px;
}

.my-rating-stars i {
  font-size: 24px;
  color: #ddd;
  transition: color 0.2s ease, transform 0.2s ease;
}

.my-rating-stars i.active {
  color: #26c9dc;
}

.stars i {
  font-size: 32px;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
}

.stars i:hover {
  transform: scale(1.1);
}

.stars i.active {
  color: #26c9dc;
}

.comment-rating {
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
}

.comment-rating i {
  font-size: 12px;
  color: #ccc;
}

.comment-rating i.active {
  color: #26c9dc;
}

.rating-tip {
  color: #888;
  font-size: 13px;
  margin-top: 10px;
  font-style: italic;
}

/* SVG星星样式 */
.svg-star {
  fill: #ddd;
  transition: fill 0.2s ease, transform 0.2s ease;
}

.svg-star.active {
  fill: #26c9dc;
}

.svg-star:hover {
  transform: scale(1.1);
}

.svg-star-small {
  fill: #ddd;
  width: 12px;
  height: 12px;
}

.svg-star-small.active {
  fill: #26c9dc;
}

.svg-stars {
  display: flex;
  align-items: center;
}

/* 确保其他星星样式与SVG兼容 */
.star-rating i,
.comment-rating i,
.my-rating-stars i {
  display: none; /* 隐藏原来的图标 */
}

/* 添加新的样式用于星星和时间的那一行 */
.rating-time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-date {
  font-size: 11px;
  color: #999;
  margin-left: auto; /* 使其靠右显示 */
}

.rating-details {
  margin-top: 15px;
  background-color: white;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.ratings-table-container {
  max-height: 200px;
  overflow-y: auto;
}

.ratings-table {
  width: 100%;
  border-collapse: collapse;
}

.ratings-table th,
.ratings-table td {
  padding: 8px;
  text-align: left;
}

.ratings-table th {
  background-color: #f8f9fa;
}

.toggle-link {
  color: #26c9dc;
  cursor: pointer;
  font-size: 13px;
}

.ratings-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ratings-table th,
.ratings-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.ratings-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 1;
}

.ratings-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.ratings-table tr:hover {
  background-color: #f0f7ff;
}

.ratings-table-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-top: 10px;
}
</style> 
