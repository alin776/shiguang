<template>
  <div class="post-detail-page">
    <div class="page-header">
      <h1 class="page-title">帖子详情</h1>
      <div class="page-actions">
        <el-button @click="goBack">返回列表</el-button>
        <el-button type="danger" @click="handleDeletePost">删除帖子</el-button>
      </div>
    </div>
    
    <el-card v-loading="loading">
      <template v-if="post">
        <div class="post-header">
          <div class="post-title">{{ post.title }}</div>
          <div class="post-meta">
            <div class="meta-item">
              <span class="meta-label">作者：</span>
              <span class="meta-value">{{ post.username }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">发布时间：</span>
              <span class="meta-value">{{ formatDate(post.created_at) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">分类：</span>
              <span class="meta-value">{{ post.category_name || '未分类' }}</span>
            </div>
          </div>
        </div>
        
        <div class="post-stats">
          <div class="stat-item">
            <el-icon><View /></el-icon>
            <span>{{ post.views || 0 }}</span>
          </div>
          <div class="stat-item">
            <el-icon><Star /></el-icon>
            <span>{{ post.likes_count || 0 }}</span>
          </div>
          <div class="stat-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ post.comments_count || 0 }}</span>
          </div>
        </div>
        
        <div class="post-content">
          <div v-html="post.content"></div>
        </div>
        
        <!-- 添加音频显示 -->
        <div v-if="post.audio" class="post-audio">
          <h3>帖子音频</h3>
          <audio 
            controls 
            :src="getAudioUrl(post.audio)" 
            class="audio-player"
            @error="handleAudioError"
          ></audio>
          <div v-if="audioError" class="audio-error">
            音频加载失败，请检查文件是否存在
            <div class="audio-fallback" v-if="audioUrl">
              <p>原始音频地址: <a :href="audioUrl" target="_blank">{{ audioUrl }}</a></p>
              <el-button size="small" type="primary" @click="downloadAudio">
                下载音频
              </el-button>
            </div>
          </div>
        </div>
        
        <div v-if="processedImages.length" class="post-images">
          <h3>帖子图片</h3>
          <div class="image-list">
            <div v-for="(image, index) in processedImages" :key="index" class="image-item">
              <el-image 
                :src="image.url" 
                :preview-src-list="processedImages.map(img => img.url)"
                fit="cover"
                @error="handleImageError"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <div>图片加载失败</div>
                  </div>
                </template>
              </el-image>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div v-if="post.comments && post.comments.length" class="comment-section">
          <h3>评论列表</h3>
          <div v-if="commentsLoading" class="comments-loading">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else class="comment-list">
            <div v-for="comment in post.comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <span class="comment-author">{{ comment.username }}</span>
                <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
              
              <!-- 评论音频显示 -->
              <div v-if="comment.audio" class="comment-audio">
                <h4>评论音频</h4>
                <audio 
                  controls 
                  :src="getAudioUrl(comment.audio, comment.id)" 
                  class="audio-player"
                  @error="(e) => handleCommentAudioError(e, comment.id)"
                ></audio>
                <div v-if="commentAudioErrors[comment.id]" class="audio-error">
                  音频加载失败，请检查文件是否存在
                  <div class="audio-fallback" v-if="commentAudioUrls[comment.id]">
                    <p>原始音频地址: <a :href="commentAudioUrls[comment.id]" target="_blank">{{ commentAudioUrls[comment.id] }}</a></p>
                    <el-button size="small" type="primary" @click="downloadCommentAudio(comment.id)">
                      下载音频
                    </el-button>
                  </div>
                </div>
              </div>
              
              <div class="comment-actions">
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="handleDeleteComment(comment.id)"
                >
                  删除评论
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else-if="!commentsLoading && (!post.comments || !post.comments.length)" description="暂无评论" />
      </template>
      
      <el-empty v-else-if="!loading" description="未找到帖子" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePostStore } from '@/store/post'
import { ElMessageBox, ElMessage } from 'element-plus'
import { View, Star, ChatDotRound, Picture } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const postStore = usePostStore()

const loading = computed(() => postStore.loading)
const commentsLoading = computed(() => postStore.loading)
const post = computed(() => postStore.currentPost)

const audioError = ref(false);
const audioUrl = ref('');
const commentAudioErrors = ref({});
const commentAudioUrls = ref({});

// 初始化
onMounted(async () => {
  const postId = route.params.id
  if (!postId) {
    ElMessage.error('无效的帖子ID')
    goBack()
    return
  }
  
  try {
    await fetchPostDetail(postId)
  } catch (error) {
    ElMessage.error('获取帖子详情失败')
  }
})

// 获取帖子详情
const fetchPostDetail = async (id) => {
  return await postStore.fetchPostDetail(id)
}

// 返回列表
const goBack = () => {
  router.push('/posts')
}

// 删除帖子
const handleDeletePost = () => {
  if (!post.value) return
  
  ElMessageBox.confirm('确定要删除这个帖子吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const success = await postStore.removePost(post.value.id)
      if (success) {
        goBack()
      }
    } catch (error) {
      ElMessage.error('删除帖子失败')
    }
  }).catch(() => {})
}

// 删除评论
const handleDeleteComment = (commentId) => {
  ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      if (!post.value || !post.value.id) return
      
      // 使用store中的removeComment方法
      const success = await postStore.removeComment(post.value.id, commentId)
      if (!success) {
        ElMessage.error('删除评论失败')
      }
    } catch (error) {
      ElMessage.error('删除评论失败')
    }
  }).catch(() => {})
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取图片URL
const getImageUrl = (image) => {
  if (!image) return ''
  
  // 如果已经是完整URL
  if (image.startsWith('http')) {
    return image
  }
  
  console.log('原始图片数据:', image, typeof image);
  
  // 服务器地址
  const baseUrl = 'http://47.98.210.7:3000'
  let imagePath = image;
  
  try {
    // 有时候image可能是JSON字符串
    if (typeof image === 'string' && (image.startsWith('[') || image.startsWith('\"'))) {
      const parsed = JSON.parse(image);
      imagePath = Array.isArray(parsed) ? parsed[0] : parsed;
      console.log('解析后的图片路径:', imagePath);
    }
  } catch (e) {
    // 如果解析失败，使用原始path
    console.log('图片路径解析失败:', e);
  }
  
  // 图片路径已经包含前缀，直接拼接基础URL和路径
  // 确保路径以/开头
  if (!imagePath.startsWith('/')) {
    imagePath = '/' + imagePath;
  }
  
  const finalUrl = `${baseUrl}${imagePath}`;
  console.log('最终图片URL:', finalUrl);
  return finalUrl;
}

// 获取所有图片URL列表（用于预览）
const getImageList = (images) => {
  if (!images || !images.length) return []
  
  // 处理images可能是JSON字符串的情况
  let imageArray = images;
  
  try {
    if (typeof images === 'string' && images.startsWith('[')) {
      imageArray = JSON.parse(images);
    } else if (!Array.isArray(images)) {
      imageArray = [images];
    }
  } catch (e) {
    console.log('图片列表解析失败:', e);
    imageArray = [images];
  }
  
  return imageArray.map(img => getImageUrl(img))
}

/**
 * 获取音频URL
 * @param {string} audio - 原始音频路径
 * @returns {string} - 构建后的音频URL
 */
const getAudioUrl = (audio) => {
  if (!audio) return ''
  
  console.log('原始音频数据:', audio, typeof audio);
  
  // 如果已经是完整URL
  if (audio.startsWith('http')) {
    audioUrl.value = audio;
    return audio
  }
  
  // 服务器地址
  const baseUrl = 'http://47.98.210.7:3000'
  
  // 处理可能的JSON字符串
  let audioPath = audio;
  try {
    if (typeof audio === 'string' && (audio.startsWith('"') || audio.startsWith('['))) {
      const parsed = JSON.parse(audio);
      audioPath = Array.isArray(parsed) ? parsed[0] : parsed;
      console.log('解析后的音频路径:', audioPath);
    }
  } catch (e) {
    console.log('音频路径解析失败:', e);
  }
  
  // 确保路径以/开头
  if (!audioPath.startsWith('/')) {
    audioPath = '/' + audioPath;
  }
  
  // 返回音频URL
  const finalUrl = `${baseUrl}${audioPath}`;
  console.log('最终音频URL:', finalUrl);
  
  // 如果是评论的音频，使用commentId存储URL
  if (arguments.length > 1 && arguments[1]) {
    const commentId = arguments[1];
    commentAudioUrls.value[commentId] = finalUrl;
  } else {
    // 否则是帖子音频
    audioUrl.value = finalUrl;
  }
  
  return finalUrl;
}

const handleImageError = (e) => {
  console.error('图片加载失败:', e);
  
  // 我们不再需要尝试替代URL，因为我们已经使用了正确的格式
  // 但如果需要，我们可以添加额外的错误处理逻辑
  const img = e.target;
  const currentSrc = img.src;
  
  // 对于特定情况，我们可以尝试修改URL
  if (currentSrc.includes('uploads/posts') && !currentSrc.includes('community')) {
    // 尝试添加community前缀
    const newSrc = currentSrc.replace('3000/', '3000/community/');
    console.log('尝试添加community前缀:', newSrc);
    img.src = newSrc;
  }
}

const handleAudioError = (e) => {
  console.error('音频加载失败:', e);
  audioError.value = true;
  
  const audio = e.target;
  const currentSrc = audio.src;
  console.log('当前失败的音频URL:', currentSrc);
  
  // 尝试不同的URL格式
  if (post.value && post.value.audio) {
    const originalPath = post.value.audio;
    const baseUrl = 'http://47.98.210.7:3000';
    
    // 尝试方式1: 添加community前缀
    if (currentSrc.includes('/uploads/') && !currentSrc.includes('/community/')) {
      setTimeout(() => {
        const newSrc = currentSrc.replace('3000/', '3000/community/');
        console.log('尝试添加community前缀:', newSrc);
        audio.src = newSrc;
        audioUrl.value = newSrc; // 更新可下载的URL
      }, 500);
      return;
    }
    
    // 尝试方式2: 直接拼接/api/community/
    if (!currentSrc.includes('/api/community/')) {
      setTimeout(() => {
        let path = originalPath;
        if (path.startsWith('/')) {
          path = path.substring(1);
        }
        const newSrc = `${baseUrl}/api/community/${path}`;
        console.log('尝试使用/api/community/路径:', newSrc);
        audio.src = newSrc;
        audioUrl.value = newSrc; // 更新可下载的URL
      }, 1000);
      return;
    }
    
    // 尝试方式3: 使用原始文件名作为关键路径
    setTimeout(() => {
      const fileName = originalPath.split('/').pop();
      if (fileName) {
        const newSrc = `${baseUrl}/uploads/audio/${fileName}`;
        console.log('尝试使用文件名直接访问:', newSrc);
        audio.src = newSrc;
        audioUrl.value = newSrc; // 更新可下载的URL
      }
    }, 1500);
  }
}

// 脚本部分新增处理后的图片计算属性
const processedImages = computed(() => {
  if (!post.value || !post.value.images) return [];
  
  let imageArray = post.value.images;
  console.log('处理前的图片数据:', imageArray);
  
  // 如果是字符串且看起来是JSON
  if (typeof imageArray === 'string' && (imageArray.startsWith('[') || imageArray.startsWith('\"'))) {
    try {
      imageArray = JSON.parse(imageArray);
      console.log('JSON解析后的图片数组:', imageArray);
    } catch (e) {
      console.error('JSON解析图片失败:', e);
      imageArray = [imageArray];
    }
  }
  
  // 确保是数组
  if (!Array.isArray(imageArray)) {
    imageArray = [imageArray].filter(item => item);
  }
  
  // 转换为对象数组，包含url
  return imageArray.filter(img => img).map(img => ({
    url: getImageUrl(img),
    originalPath: img
  }));
})

// 添加下载音频函数
const downloadAudio = () => {
  if (!audioUrl.value) return;
  
  // 创建隐藏的下载链接
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = audioUrl.value;
  a.download = audioUrl.value.split('/').pop() || 'audio.mp3';
  document.body.appendChild(a);
  a.click();
}

// 处理评论音频错误
const handleCommentAudioError = (e, commentId) => {
  console.error(`评论ID ${commentId} 的音频加载失败:`, e);
  commentAudioErrors.value[commentId] = true;
  
  const audio = e.target;
  const currentSrc = audio.src;
  console.log('当前失败的评论音频URL:', currentSrc);
  
  // 找到对应的评论
  const comment = post.value.comments.find(c => c.id === commentId);
  if (!comment || !comment.audio) return;
  
  const originalPath = comment.audio;
  const baseUrl = 'http://47.98.210.7:3000';
  
  // 尝试方式1: 添加community前缀
  if (currentSrc.includes('/uploads/') && !currentSrc.includes('/community/')) {
    setTimeout(() => {
      const newSrc = currentSrc.replace('3000/', '3000/community/');
      console.log('尝试添加community前缀:', newSrc);
      audio.src = newSrc;
      commentAudioUrls.value[commentId] = newSrc; // 更新可下载的URL
    }, 500);
    return;
  }
  
  // 尝试方式2: 直接拼接/api/community/
  if (!currentSrc.includes('/api/community/')) {
    setTimeout(() => {
      let path = originalPath;
      if (path.startsWith('/')) {
        path = path.substring(1);
      }
      const newSrc = `${baseUrl}/api/community/${path}`;
      console.log('尝试使用/api/community/路径:', newSrc);
      audio.src = newSrc;
      commentAudioUrls.value[commentId] = newSrc; // 更新可下载的URL
    }, 1000);
    return;
  }
  
  // 尝试方式3: 使用原始文件名作为关键路径
  setTimeout(() => {
    const fileName = originalPath.split('/').pop();
    if (fileName) {
      const newSrc = `${baseUrl}/uploads/audio/${fileName}`;
      console.log('尝试使用文件名直接访问:', newSrc);
      audio.src = newSrc;
      commentAudioUrls.value[commentId] = newSrc; // 更新可下载的URL
    }
  }, 1500);
}

// 下载评论音频
const downloadCommentAudio = (commentId) => {
  const audioUrl = commentAudioUrls.value[commentId];
  if (!audioUrl) return;
  
  // 创建隐藏的下载链接
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = audioUrl;
  a.download = audioUrl.split('/').pop() || `comment_audio_${commentId}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
</script>

<style scoped>
.post-detail-page {
  padding: 10px 0;
}

.post-header {
  margin-bottom: 20px;
}

.post-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #303133;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

.meta-label {
  font-weight: bold;
  color: #909399;
}

.post-stats {
  display: flex;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  margin-right: 24px;
  color: #606266;
}

.stat-item i {
  margin-right: 8px;
  font-size: 18px;
  color: #409EFF;
}

.post-content {
  margin-bottom: 24px;
  line-height: 1.8;
}

.post-audio {
  margin-bottom: 24px;
}

.audio-player {
  width: 100%;
}

.post-images {
  margin-bottom: 24px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.image-item {
  width: 200px;
  height: 200px;
  border-radius: 4px;
  overflow: hidden;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
}

.image-error .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.comments-loading {
  padding: 16px;
}

.comment-section {
  margin-top: 24px;
}

.comment-list {
  margin-top: 16px;
}

.comment-item {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: bold;
  color: #303133;
}

.comment-time {
  color: #909399;
  font-size: 13px;
}

.comment-content {
  margin-bottom: 12px;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
}

.audio-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 8px;
}

.audio-fallback {
  padding: 8px;
  background-color: #f8f8f8;
  border-radius: 4px;
  margin-top: 8px;
}

.comment-audio {
  margin: 8px 0 12px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.comment-audio h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #606266;
}
</style> 