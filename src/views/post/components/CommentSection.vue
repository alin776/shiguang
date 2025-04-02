<template>
  <div class="comments-section">
    <h3 class="comments-title">评论 ({{ totalComments }})</h3>

    <div class="comments-list">
      <div v-if="!comments || comments.length === 0" class="no-comments">
        暂无评论，快来发表第一条评论吧！
      </div>

      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :userId="userId"
        @user-click="$emit('user-click', $event)"
        @reply="$emit('reply', $event)"
        @like-comment="$emit('like-comment', $event)"
        @delete-comment="$emit('delete-comment', $event)"
        @delete-reply="$emit('delete-reply', $event)"
        @refresh-emojis="refreshEmojis"
        @report-comment="$emit('report-comment', $event)"
        @reply-to-reply="handleReplyToReply"
      />
    </div>

    <!-- 评论输入框 -->
    <div class="reply-input">
      <el-input
        v-model="commentContent"
        :placeholder="
          replyMode
            ? '回复 ' + (replyUsername ? replyUsername : '评论')
            : '发表评论...'
        "
        type="textarea"
        :rows="1"
        maxlength="500"
        show-word-limit
        class="comment-textarea"
        @input="adjustTextareaHeight"
        ref="inputRef"
      />
      
      <!-- 媒体选择按钮 -->
      <el-button 
        type="text" 
        class="media-button"
        @click="toggleMediaPanel"
      >
        <el-icon><Plus /></el-icon>
      </el-button>
      
      <!-- 语音录制按钮 -->
      <el-button 
        type="text" 
        :icon="recordingAudio ? 'Close' : 'Microphone'" 
        @click="toggleAudioRecording"
        class="audio-button"
        :class="{ 'recording': recordingAudio }"
      >
        {{ recordingAudio ? '取消' : '语音' }}
      </el-button>
      
      <el-button
        type="primary"
        :disabled="(!commentContent.trim() && !commentAudio && (!commentImages || commentImages.length === 0)) || recordingAudio"
        @click="handleSubmit"
      >
        发送
      </el-button>
    </div>
    
    <!-- 选中的表情包预览区 -->
    <div v-if="commentImages.length > 0" class="selected-images-container">
      <div v-for="(image, index) in commentImages" :key="index" class="selected-image-item">
        <img 
          :src="image" 
          alt="选中的表情/图片" 
          @error="handleImageError" 
          class="selected-image"
        />
        <div class="remove-selected-image" @click="removeImage(index)">
          <el-icon><Close /></el-icon>
        </div>
      </div>
    </div>
    
    <!-- 媒体选择面板 -->
    <div v-if="showMediaPanel" class="media-panel">
      <div class="media-tabs">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'emoji' }"
          @click="activeTab = 'emoji'"
        >
          表情
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'image' }"
          @click="activeTab = 'image'"
        >
          图片
        </div>
      </div>
      
      <!-- 表情包面板 -->
      <div v-if="activeTab === 'emoji'" class="emoji-panel">
        <div v-if="myEmojis.length === 0" class="empty-emojis">
          暂无表情包，长按他人评论中的表情可添加
        </div>
        <div v-else class="emoji-grid">
          <div
            v-for="emoji in myEmojis" 
            :key="emoji.id"
            class="emoji-item"
            @click="insertEmoji(emoji.url)"
            @touchstart="handleEmojiTouchStart($event, emoji)"
            @touchend="handleEmojiTouchEnd"
          >
            <div v-if="emoji.loading" class="emoji-loading">
              <el-icon><Loading /></el-icon>
            </div>
            <div v-else-if="emoji.error" class="emoji-error">
              <el-icon><Warning /></el-icon>
            </div>
            <img 
              v-else
              :src="emoji.url" 
              alt="表情包"
              class="emoji-image"
              @error="handleImageError"
            />
          </div>
        </div>
      </div>
      
      <!-- 图片上传面板 -->
      <div v-if="activeTab === 'image'" class="image-panel">
        <el-upload
          class="upload-area"
          action=""
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleImageSelected"
        >
          <div class="upload-button">
            <el-icon><Plus /></el-icon>
            <span>选择图片</span>
          </div>
        </el-upload>
        
        <div v-if="commentImages.length > 0" class="image-preview-list">
          <div 
            v-for="(image, index) in commentImages" 
            :key="index" 
            class="image-preview-item"
          >
            <img :src="image" alt="预览图" />
            <div class="remove-image" @click.stop="removeImage(index)">
              <el-icon><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 音频录制组件 (只在录音模式显示) -->
    <div v-if="recordingAudio" class="audio-recorder-container">
      <AudioRecorder v-model:value="commentAudio" @audio-deleted="commentAudio = null" @audio-recorded="onAudioRecorded" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from "vue";
import CommentItem from "./CommentItem.vue";
import AudioRecorder from "../../../components/AudioRecorder.vue";
import { Plus, Close, Microphone, Picture, ChatDotRound, Loading, Warning } from '@element-plus/icons-vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/auth";
import { getImageUrl, getProcessedImageUrl, preloadImage } from "../../../utils/imageHelpers";

const props = defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
  userId: {
    type: [Number, String],
    default: null,
  },
  replyMode: {
    type: Boolean,
    default: false,
  },
  replyUsername: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "user-click",
  "reply",
  "like-comment",
  "delete-comment",
  "delete-reply",
  "submit-comment",
  "cancel-reply",
  "report-comment",
  "reply-to-reply"
]);

const commentContent = ref("");
const commentAudio = ref(null);
const recordingAudio = ref(false);
const inputRef = ref(null);
const commentImages = ref([]);
const showMediaPanel = ref(false);
const activeTab = ref('emoji');
const myEmojis = ref([]);
let emojiLongPressTimer = null;
const longPressDuration = 500; // 毫秒

onMounted(() => {
  fetchUserEmojis();
});

// 获取用户表情包
const fetchUserEmojis = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`${API_BASE_URL}/api/community/emojis`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    
    // 确保表情包URL处理正确
    if (response.data && response.data.emojis) {
      const processedEmojis = response.data.emojis.map(emoji => {
        if (emoji.url) {
          // 使用移动端优化的图片URL处理函数
          emoji.url = getProcessedImageUrl(emoji.url);
          // 添加时间戳参数防止缓存
          const separator = emoji.url.includes('?') ? '&' : '?';
          emoji.url = `${emoji.url}${separator}t=${Date.now()}`;
        }
        return emoji;
      });
      myEmojis.value = processedEmojis;
      console.log('处理后的表情包数据:', processedEmojis);
      
      // 预加载表情包图片
      preloadEmojis();
    } else {
      console.warn('获取表情包返回数据格式不正确:', response.data);
    }
  } catch (error) {
    console.error('获取表情包失败:', error);
  }
};

// 切换媒体面板
const toggleMediaPanel = () => {
  showMediaPanel.value = !showMediaPanel.value;
  // 关闭录音面板
  if (showMediaPanel.value && recordingAudio.value) {
    recordingAudio.value = false;
  }
};

// 插入表情包
const insertEmoji = (url) => {
  if (!commentImages.value) {
    commentImages.value = [];
  }
  
  try {
    // 使用新函数处理URL，确保在移动设备上正确显示
    const processedUrl = getProcessedImageUrl(url);
    console.log('插入表情包:', processedUrl);
    commentImages.value.push(processedUrl);
    showMediaPanel.value = false; // 选择后自动关闭面板
  } catch (error) {
    console.error('表情包URL处理失败:', error);
    ElMessage.error('添加表情包失败');
  }
};

// 刷新表情包列表
const refreshEmojis = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`${API_BASE_URL}/api/community/emojis`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    
    if (response.data && response.data.emojis) {
      // 处理表情包URL
      const emojis = response.data.emojis.map(emoji => {
        // 确保表情包URL正确
        if (emoji.url && !emoji.url.startsWith('http') && !emoji.url.startsWith('/')) {
          emoji.url = getImageUrl(emoji.url);
        }
        return emoji;
      });
      
      myEmojis.value = emojis;
      
      // 预加载表情包图片
      preloadEmojis();
    } else {
      console.warn('刷新表情包返回数据格式不正确:', response.data);
    }
  } catch (error) {
    console.error('刷新表情包失败:', error);
  }
};

// 预加载表情包图片
const preloadEmojis = async () => {
  if (!myEmojis.value || myEmojis.value.length === 0) return;
  
  console.log('开始预加载表情包图片...');
  for (const emoji of myEmojis.value) {
    if (emoji.url) {
      try {
        // 检查是否为GIF图片
        const isGif = emoji.url.toLowerCase().endsWith('.gif');
        if (isGif) {
          // 对于GIF图片，添加加载状态
          emoji.loading = true;
          await preloadImage(emoji.url);
          emoji.loading = false;
        } else {
          await preloadImage(emoji.url);
        }
      } catch (err) {
        console.error('预加载表情包图片失败:', emoji.url, err);
        emoji.loading = false;
        emoji.error = true;
      }
    }
  }
  console.log('表情包预加载完成');
};

// 处理图片选择
const handleImageSelected = async (file) => {
  if (!file) return;
  
  // 验证文件类型
  if (!file.raw.type.includes('image/')) {
    ElMessage.error('请选择图片文件');
    return;
  }
  
  // 验证文件大小
  if (file.raw.size > 5 * 1024 * 1024) {
    ElMessage.error('图片不能超过5MB');
    return;
  }

  // 检查是否为GIF图片
  const isGif = file.raw.type === 'image/gif';
  if (isGif) {
    // 对于GIF图片，显示加载提示
    ElMessage.info('正在处理GIF图片，请稍候...');
  }

  try {
    // 上传图片
    const formData = new FormData();
    formData.append('file', file.raw);
    
    const authStore = useAuthStore();
    const response = await axios.post(`${API_BASE_URL}/api/community/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (response.data.url) {
      // 添加图片到评论图片列表
      if (!commentImages.value) {
        commentImages.value = [];
      }
      
      // 使用新函数处理URL，确保在移动设备上正确显示
      const processedUrl = getProcessedImageUrl(response.data.url);
      console.log('添加上传图片:', processedUrl);
      commentImages.value.push(processedUrl);
      
      if (isGif) {
        ElMessage.success('GIF图片上传成功');
      }
    } else {
      ElMessage.error('图片上传失败');
    }
  } catch (error) {
    console.error('上传图片失败:', error);
    ElMessage.error('上传图片失败');
  }
};

// 移除图片
const removeImage = (index) => {
  commentImages.value.splice(index, 1);
};

const totalComments = computed(() => {
  if (!props.comments || !Array.isArray(props.comments)) {
    console.warn('CommentSection收到的comments不是数组:', props.comments);
    return 0;
  }
  
  let total = props.comments.length;

  // 计算所有回复评论
  props.comments.forEach((comment) => {
    if (comment.replies && Array.isArray(comment.replies)) {
      total += comment.replies.length;
    }
  });

  return total;
});

// 调整文本域高度
const adjustTextareaHeight = () => {
  if (inputRef.value) {
    const textarea = inputRef.value.$el.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }
};

// 切换录音模式
const toggleAudioRecording = () => {
  recordingAudio.value = !recordingAudio.value;
  if (!recordingAudio.value) {
    // 不要在此处清除音频，避免切换录音模式时丢失已录制的音频
    // commentAudio.value = null;
  }
};

// 音频录制完成的回调
const onAudioRecorded = (audioUrl) => {
  console.log("音频录制完成:", audioUrl);
  commentAudio.value = audioUrl;
  // 录音完成后自动关闭录音界面但保留录制的音频
  recordingAudio.value = false;
};

// 提交评论
const handleSubmit = () => {
  // 检查是否有文字评论、音频评论或图片
  if (commentContent.value.trim() || commentAudio.value || (commentImages.value && commentImages.value.length > 0)) {
    console.log("提交评论:", { 
      text: commentContent.value, 
      audio: commentAudio.value,
      images: commentImages.value
    });
    
    emit("submit-comment", {
      content: commentContent.value,
      audio: commentAudio.value,
      images: commentImages.value
    });
    
    // 重置所有评论内容
    commentContent.value = "";
    commentAudio.value = null;
    commentImages.value = [];
    recordingAudio.value = false;
    showMediaPanel.value = false;
  }
};

// 监听回复模式变化，自动聚焦输入框
watch(
  () => props.replyMode,
  (newValue) => {
    if (newValue) {
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus();
        }
      });
    }
  }
);

// 显示删除表情包菜单
const showDeleteEmojiMenu = (event, emoji) => {
  // 创建自定义菜单
  const menuDiv = document.createElement('div');
  menuDiv.className = 'custom-context-menu';
  menuDiv.style.position = 'fixed';
  menuDiv.style.zIndex = '3000';
  menuDiv.style.background = '#fff';
  menuDiv.style.boxShadow = '0 2px 12px 0 rgba(0, 0, 0, 0.1)';
  menuDiv.style.borderRadius = '4px';
  menuDiv.style.padding = '5px 0';
  menuDiv.style.width = '140px';
  menuDiv.style.left = '50%';
  menuDiv.style.top = '50%';
  menuDiv.style.transform = 'translate(-50%, -50%)';
  
  // 删除表情包选项
  const deleteOption = document.createElement('div');
  deleteOption.className = 'menu-option';
  deleteOption.style.padding = '12px 16px';
  deleteOption.style.cursor = 'pointer';
  deleteOption.style.textAlign = 'center';
  deleteOption.innerText = '删除表情包';
  deleteOption.addEventListener('click', () => {
    deleteUserEmoji(emoji.id);
    document.body.removeChild(menuDiv);
  });
  
  // 取消选项
  const cancelOption = document.createElement('div');
  cancelOption.className = 'menu-option';
  cancelOption.style.padding = '12px 16px';
  cancelOption.style.cursor = 'pointer';
  cancelOption.style.borderTop = '1px solid #eee';
  cancelOption.style.textAlign = 'center';
  cancelOption.innerText = '取消';
  cancelOption.addEventListener('click', () => {
    document.body.removeChild(menuDiv);
  });
  
  // 添加到菜单
  menuDiv.appendChild(deleteOption);
  menuDiv.appendChild(cancelOption);
  
  // 添加到文档
  document.body.appendChild(menuDiv);
  
  // 点击其他地方关闭菜单
  const closeMenu = (e) => {
    if (!menuDiv.contains(e.target) && document.body.contains(menuDiv)) {
      document.body.removeChild(menuDiv);
      document.removeEventListener('click', closeMenu);
    }
  };
  
  // 延迟添加事件，避免立即触发
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 100);
};

// 删除用户表情包
const deleteUserEmoji = async (emojiId) => {
  try {
    const authStore = useAuthStore();
    await axios.delete(`${API_BASE_URL}/api/community/emojis/${emojiId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    
    // 从列表中移除该表情包
    myEmojis.value = myEmojis.value.filter(emoji => emoji.id !== emojiId);
    ElMessage.success('表情包已删除');
    // 刷新表情包列表确保完全更新
    refreshEmojis();
  } catch (error) {
    console.error('删除表情包失败:', error);
    ElMessage.error('删除表情包失败');
  }
};

// 处理表情包长按开始
const handleEmojiTouchStart = (event, emoji) => {
  // 开始长按计时
  emojiLongPressTimer = setTimeout(() => {
    showDeleteEmojiMenu(event, emoji);
  }, longPressDuration);
};

// 处理表情包长按结束
const handleEmojiTouchEnd = () => {
  // 清除长按计时器
  if (emojiLongPressTimer) {
    clearTimeout(emojiLongPressTimer);
    emojiLongPressTimer = null;
  }
};

// 处理图片加载错误
const handleImageError = (event) => {
  console.error('图片加载失败:', event.target.src);
  const img = event.target;
  
  // 检查是否已经重试过
  const retryCount = parseInt(img.dataset.retryCount || '0');
  
  if (retryCount < 3) {
    // 最多尝试3次
    img.dataset.retryCount = (retryCount + 1).toString();
    
    // 获取原始URL并移除参数
    let originalSrc = img.src;
    // 除去查询参数
    originalSrc = originalSrc.split('?')[0];
    
    // 添加新的时间戳和其他必要参数
    const newSrc = `${originalSrc}?retry=${retryCount + 1}&t=${Date.now()}`;
    
    console.log(`重试(${retryCount + 1}/3)加载图片:`, newSrc);
    
    // 延迟一点时间再尝试，避免连续失败
    setTimeout(() => {
      img.src = newSrc;
    }, 300);
  } else {
    // 已经重试3次，显示占位图
    console.log('图片重试3次后仍然失败，显示占位图');
    img.onerror = null; // 防止无限循环
    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==';
  }
};

// 处理reply-to-reply事件
const handleReplyToReply = (reply) => {
  // 转发事件到父组件
  emit('reply-to-reply', reply);
};
</script>

<style scoped>
.comments-section {
  padding: 16px;
  background-color: #ffffff;
  margin-bottom: 64px;
}

.comments-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #333333;
  text-align: left;
}

.no-comments {
  text-align: left;
  padding: 20px 0;
  color: #909399;
}

.reply-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  z-index: 10;
}

.audio-recorder-container {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  background-color: #ffffff;
  padding: 10px;
  border-top: 1px solid #f0f0f0;
  z-index: 9;
}

.audio-button {
  margin: 0 5px;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-button.recording {
  color: #f56c6c;
}

.media-button {
  margin: 0 5px;
  font-size: 20px;
  color: #409EFF;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #DCDFE6;
  transition: all 0.2s ease;
}

.media-button:hover {
  background-color: #ecf5ff;
  border-color: #409EFF;
}

.reply-input .el-button--primary {
  min-width: 60px;
  height: 36px;
  font-size: 14px;
  padding: 0 15px;
}

.media-panel {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  background-color: #ffffff;
  padding: 10px 0 0 0;
  border-top: 1px solid #f0f0f0;
  z-index: 9;
  height: 220px;
  overflow-y: auto;
  margin-bottom: 0;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  will-change: transform, opacity;
  transform-origin: bottom;
  animation: slideUp 0.25s ease-out forwards;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0.8;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.media-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
  position: relative;
  padding: 0 16px;
  height: 40px;
  align-items: center;
}

.media-tabs::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(64,158,255,0.05) 0%, rgba(64,158,255,0.2) 50%, rgba(64,158,255,0.05) 100%);
}

.tab-item {
  padding: 0 16px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 15px;
  color: #606266;
  position: relative;
  transition: all 0.25s ease;
  font-weight: 500;
  margin: 0 8px;
}

.tab-item.active {
  color: #409EFF;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #409EFF;
  border-radius: 2px 2px 0 0;
  transform: scaleX(1);
  transition: transform 0.3s ease;
  z-index: 1;
}

.tab-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #409EFF;
  border-radius: 2px 2px 0 0;
  transform: scaleX(0);
  transition: transform 0.3s ease;
  z-index: 1;
}

.tab-item:hover::after {
  transform: scaleX(0.5);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 15px;
}

.emoji-item {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  background-color: #f5f5f5;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.emoji-item:active {
  transform: scale(0.95);
}

.emoji-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  padding: 5px;
  background-color: white;
}

.emoji-image[src^="data:image"] {
  /* 占位图样式调整 */
  padding: 15px;
  opacity: 0.6;
}

/* 增加一个占位图效果 */
.emoji-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  z-index: -1;
}

.empty-emojis {
  padding: 30px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 20px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.05);
}

.upload-area {
  width: 100%;
  padding: 10px 16px;
}

.upload-button {
  width: 120px;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #909399;
  background-color: #fafafa;
  transition: all 0.25s ease;
  margin: 5px 0;
}

.upload-button:hover {
  border-color: #409EFF;
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.05);
  transform: scale(1.02);
}

.upload-button .el-icon {
  font-size: 28px;
  margin-bottom: 8px;
  transition: transform 0.3s ease;
}

.upload-button:hover .el-icon {
  transform: rotate(15deg) scale(1.1);
}

.upload-button span {
  font-size: 14px;
  margin-top: 8px;
  font-weight: 500;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px;
}

.image-preview-item {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
  transition: all 0.25s ease;
}

.image-preview-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-preview-item:hover img {
  transform: scale(1.08);
}

.remove-image {
  position: absolute;
  top: 6px;
  right: 6px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  opacity: 0.9;  /* 默认就显示，但稍微透明一点 */
  transform: scale(1);
  transition: all 0.2s ease;
}

.image-preview-item:hover .remove-image {
  opacity: 1;
  transform: scale(1.1); /* 悬停时稍微放大 */
  background-color: rgba(0, 0, 0, 0.8); /* 悬停时背景色加深 */
}

@media screen and (min-width: 768px) {
  .reply-input, .audio-recorder-container, .media-panel, .selected-images-container {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .selected-images-container {
    bottom: 60px;
  }

  .media-panel {
    bottom: 60px;
  }
}

.comment-textarea {
  flex: 1;
  margin-right: 10px;
}

/* 评论文本域自适应高度 */
:deep(.el-textarea__inner) {
  resize: none;
  overflow: hidden;
  min-height: 40px;
  max-height: 100px;
  color: #333333;
  background-color: #fff;
}

/* 添加字数统计样式 */
:deep(.el-input__count) {
  background-color: transparent;
  color: #666666;
  font-size: 12px;
  right: 10px;
  bottom: 5px;
}

.selected-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  margin-bottom: 60px; /* 给输入框留出空间 */
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eaeaea;
}

.selected-image-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.selected-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.remove-selected-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.remove-selected-image:hover {
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.7);
}

.emoji-panel, .image-panel {
  animation: fadeIn 0.2s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.emoji-loading,
.emoji-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.emoji-loading .el-icon,
.emoji-error .el-icon {
  font-size: 20px;
  color: #909399;
}

.emoji-error .el-icon {
  color: #f56c6c;
}
</style>
