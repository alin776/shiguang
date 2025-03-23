<template>
  <div class="comment-item">
    <div class="comment-avatar">
      <el-avatar
        :size="40"
        :src="getAvatarUrl(comment.user?.avatar)"
        @error="() => true"
        @click="$emit('user-click', comment.user?.id)"
      >
        {{ comment.user?.username?.charAt(0).toUpperCase() || "?" }}
      </el-avatar>
    </div>
    <div class="comment-content">
      <div class="comment-meta">
        <div class="username-container">
          <div class="username" @click="$emit('user-click', comment.user?.id)">
            {{ comment.user?.username || "匿名用户" }}
          </div>
          <div class="user-badges smaller">
            <span class="level-badge" v-if="comment.user?.level">Lv.{{ comment.user?.level }}</span>
            <span 
              v-if="comment.user?.title" 
              class="user-title-inline"
              :class="getTitleClass(comment.user?.title)"
            >{{ comment.user?.title }}</span>
          </div>
        </div>
        <div class="comment-actions-top">
          <span class="report-btn" @click="$emit('report-comment', comment.id)" v-if="comment.user?.id !== userId">
            <el-icon><Warning /></el-icon>
          </span>
          <div class="comment-time">{{ formatTime(comment.created_at || new Date()) }}</div>
        </div>
      </div>
      <div class="comment-text">{{ comment.content || "" }}</div>
      
      <!-- 评论图片 -->
      <div v-if="comment.images && Array.isArray(parseImages(comment.images)) && parseImages(comment.images).length > 0" class="comment-images">
        <div 
          v-for="(image, index) in parseImages(comment.images)" 
          :key="index" 
          class="comment-image-container"
          @contextmenu.prevent="showImageMenu($event, image)"
          @touchstart="handleTouchStart($event, image)"
          @touchend="handleTouchEnd"
        >
          <img :src="processImageUrl(image)" @error="handleImageError" alt="评论图片" class="comment-image" @click="previewImage(image)" />
        </div>
      </div>
      
      <!-- 评论音频播放器 - 改进设计 -->
      <div v-if="comment.audio" class="comment-audio">
        <div class="audio-bubble" :class="{ 'playing': isPlaying }">
          <div class="audio-controls">
            <div class="play-button" @click="toggleAudio">
              <el-icon><VideoPlay v-if="!isPlaying" /><VideoPause v-else /></el-icon>
            </div>
            
            <div class="audio-waveform-container">
              <div class="audio-waveform">
                <div 
                  v-for="(bar, index) in 14" 
                  :key="index" 
                  class="waveform-bar"
                  :style="{ 
                    height: getWaveformHeight(index),
                    animationDelay: (index * 0.05) + 's',
                    opacity: getWaveformOpacity(index, currentTime, audioDuration)
                  }"
                ></div>
              </div>
              
              <div class="audio-time-display">
                {{ formatAudioTime(currentTime) }} / {{ formatAudioTime(audioDuration || getDurationFromFilename(comment.audio)) }}
              </div>
            </div>
          </div>
          
          <div class="audio-progress-container">
            <div 
              class="audio-progress-fill" 
              :style="{ width: ((currentTime / (audioDuration || getDurationFromFilename(comment.audio))) * 100) + '%' }"
            ></div>
            <div class="audio-progress-handle" 
              :style="{ left: ((currentTime / (audioDuration || getDurationFromFilename(comment.audio))) * 100) + '%' }"
              v-show="isHovering || isPlaying">
            </div>
            <input 
              type="range" 
              class="audio-range-input" 
              :max="audioDuration || getDurationFromFilename(comment.audio) || 100"
              :value="currentTime"
              @input="seekAudio($event.target.value)"
              @mouseenter="isHovering = true"
              @mouseleave="isHovering = false"
            />
          </div>
        </div>
        
        <audio 
          ref="audioPlayer" 
          @timeupdate="updateTime" 
          @ended="audioEnded" 
          @loadedmetadata="onMetadataLoaded"
          @error="onAudioError"
          :src="audioSrc"
          preload="metadata"
        ></audio>
      </div>

      <!-- 回复列表 -->
      <div
        class="replies-container"
        v-if="comment.replies && comment.replies.length > 0"
      >
        <div
          v-for="reply in comment.replies"
          :key="reply.id"
          class="reply-item"
        >
          <div class="reply-meta">
            <div class="meta-left">
              <div class="username-container">
                <div class="username reply-username" @click="$emit('user-click', reply.user?.id)">
                  {{ reply.user?.username || "匿名用户" }}
                </div>
              </div>
              <span v-if="reply.reply_to_user" class="reply-to">
                回复
                <span class="username" @click="$emit('user-click', reply.reply_to_user?.id)">
                  {{ reply.reply_to_user?.username || "匿名用户" }}
                </span>
              </span>
            </div>
            <span class="reply-time">{{ formatTime(reply.created_at) }}</span>
          </div>
          <div class="reply-text">{{ reply.content }}</div>
          
          <!-- 回复图片 -->
          <div v-if="reply.images && Array.isArray(parseImages(reply.images)) && parseImages(reply.images).length > 0" class="reply-images">
            <div 
              v-for="(image, index) in parseImages(reply.images)" 
              :key="index" 
              class="reply-image-container"
              @contextmenu.prevent="showImageMenu($event, image)"
              @touchstart="handleTouchStart($event, image)"
              @touchend="handleTouchEnd"
            >
              <img :src="processImageUrl(image)" @error="handleImageError" alt="回复图片" class="reply-image" @click="previewImage(image)" />
            </div>
          </div>
          
          <!-- 回复音频播放器 -->
          <div v-if="reply.audio" class="reply-audio">
            <!-- 音频播放功能待开发 -->
          </div>
          
          <div class="reply-actions" v-if="reply.user?.id === userId">
            <span
              class="delete-action"
              @click="$emit('delete-reply', reply.id)"
            >
              删除
            </span>
          </div>
          
          <!-- 添加回复回复的按钮 -->
          <div class="reply-actions reply-to-reply" v-else>
            <span
              class="reply-action"
              @click="replyToReply(comment.id, reply.user?.id, reply.user?.username)"
            >
              回复
            </span>
          </div>
        </div>
      </div>

      <!-- 评论操作 -->
      <div class="comment-actions">
        <span class="action-item" @click="$emit('reply', comment.id)">
          回复
        </span>
        <span
          class="action-item"
          :class="{ active: comment.is_liked }"
          @click="
            $emit('like-comment', {
              commentId: comment.id,
              liked: !comment.is_liked,
            })
          "
        >
          <el-icon><Star /></el-icon>
          <span>{{ comment.likes || 0 }}</span>
        </span>
        <span
          v-if="comment.user?.id === userId"
          class="action-item delete-action"
          @click="$emit('delete-comment', comment.id)"
        >
          删除
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Star, VideoPlay, VideoPause, Warning } from "@element-plus/icons-vue";
import { getAvatarUrl, getImageUrl, preloadImage } from "../../../utils/imageHelpers";
import { formatTime } from "../../../utils/timeHelpers";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { API_BASE_URL } from "@/config";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  comment: {
    type: Object,
    required: true,
    default: () => ({
      id: 0,
      content: "",
      created_at: new Date(),
      user: { username: "匿名用户" },
      replies: [],
      images: [],
      likes: 0,
      is_liked: false
    })
  },
  userId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits([
  "user-click",
  "reply",
  "like-comment",
  "delete-comment",
  "delete-reply",
  "refresh-emojis",
  "report-comment",
  "reply-to-reply"
]);

// 音频播放相关
const audioPlayer = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const audioDuration = ref(0);

// 添加是否悬停的状态
const isHovering = ref(false);

// 解析图片数据
const parseImages = (images) => {
  if (!images) return [];
  
  if (typeof images === 'string') {
    try {
      return JSON.parse(images);
    } catch (e) {
      console.error('解析图片数据失败:', e);
      // 尝试检测是否是单张图片的字符串URL
      if (typeof images === 'string' && (images.includes('http') || images.includes('/uploads'))) {
        return [images];
      }
      return [];
    }
  }
  
  return Array.isArray(images) ? images : [];
};

// 处理图片URL并添加错误回退
const processImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  try {
    // 使用图片处理工具获取正确的URL
    const url = getImageUrl(imageUrl);
    
    // 检测平台，在移动端添加额外参数防止缓存问题
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      // 确保URL末尾有随机参数防止缓存
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}mobile=1&nocache=${Date.now()}`;
    }
    
    return url;
  } catch (error) {
    console.error('处理图片URL出错:', error, '原URL:', imageUrl);
    // 如果处理失败，尝试直接返回原始URL
    return imageUrl;
  }
};

// 处理图片加载错误
const handleImageError = (event) => {
  console.error('图片加载失败:', event.target.src);
  const img = event.target;
  
  // 记录原始URL，移除缓存参数后重试
  const originalSrc = img.src;
  
  // 检查是否已经重试过
  if (!img.dataset.retried) {
    img.dataset.retried = 'true';
    
    // 移除可能导致问题的查询参数
    let newSrc = originalSrc.split('?')[0];
    // 添加新的时间戳
    newSrc += `?retry=${Date.now()}`;
    
    console.log('重试加载图片:', newSrc);
    img.src = newSrc;
  } else {
    // 已经重试过，显示占位图
    console.log('图片重试后仍然失败，显示占位图');
    img.onerror = null; // 防止无限循环
    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==';
    img.style.padding = '5px';
    img.style.background = '#f5f5f5';
  }
};

// 预加载评论中的图片
const preloadCommentImages = async () => {
  if (!props.comment) return;
  
  const images = parseImages(props.comment.images);
  if (images && images.length > 0) {
    console.log('预加载评论图片:', images);
    for (const imgUrl of images) {
      try {
        await preloadImage(processImageUrl(imgUrl));
      } catch (error) {
        console.error('预加载图片失败:', imgUrl, error);
      }
    }
  }
};

// 计算音频源URL
const audioSrc = computed(() => {
  if (!props.comment?.audio) return '';
  return props.comment.audio.startsWith('http') 
    ? props.comment.audio 
    : `${API_BASE_URL}${props.comment.audio}`;
});

// 从文件名尝试获取持续时间
const getDurationFromFilename = (audioUrl) => {
  if (!audioUrl) return 5; // 直接返回默认值
  
  // 尝试从URL中提取持续时间参数
  if (audioUrl.includes('duration=')) {
    const match = audioUrl.match(/duration=(\d+)/);
    if (match && match[1]) {
      const duration = parseInt(match[1]);
      if (duration > 0 && duration < 600) { // 最长10分钟
        return duration;
      }
    }
  }
  
  // 如果URL中没有，但comment对象有持续时间
  if (props.comment?.audio_duration && 
      !isNaN(props.comment.audio_duration) && 
      props.comment.audio_duration > 0) {
    return props.comment.audio_duration;
  }
  
  // 默认返回5秒
  return 5;
};

// 组件挂载时初始化音频持续时间
onMounted(() => {
  if (props.comment?.audio) {
    // 立即强制设置持续时间，不等待元数据加载
    forceSetDuration();
    
    // 仍然尝试加载元数据，但不依赖它来设置持续时间
    if (audioPlayer.value) {
      audioPlayer.value.preload = "none"; // 防止立即加载元数据
      
      // 延迟100ms后设置为metadata，确保前面的强制设置逻辑先执行
      setTimeout(() => {
        if (audioPlayer.value) {
          audioPlayer.value.preload = "metadata";
        }
      }, 100);
    }
  }
  
  // 预加载图片
  preloadCommentImages();
});

// 音频元数据加载完成
const onMetadataLoaded = () => {
  // 完全跳过从元数据中获取持续时间的逻辑
  // 直接从URL或其他来源设置持续时间
  forceSetDuration();
};

// 添加一个强制设置持续时间的函数，不依赖元数据
const forceSetDuration = () => {
  // 1. 首先尝试从URL获取持续时间 - 这是最可靠的来源
  if (props.comment?.audio && props.comment.audio.includes('duration=')) {
    const match = props.comment.audio.match(/duration=(\d+)/);
    if (match && match[1]) {
      const duration = parseInt(match[1]);
      if (duration > 0) {
        audioDuration.value = duration;
        console.log('强制从URL设置评论音频持续时间:', audioDuration.value);
        return; // 成功获取，直接返回
      }
    }
  }
  
  // 2. 如果URL中没有，尝试使用评论对象中的持续时间
  if (props.comment?.audio_duration && 
      !isNaN(props.comment.audio_duration) && 
      props.comment.audio_duration > 0) {
    audioDuration.value = props.comment.audio_duration;
    console.log('强制使用评论对象中的音频持续时间:', audioDuration.value);
    return; // 成功获取，直接返回
  }
  
  // 3. 最后使用固定的经验值
  audioDuration.value = 5; // 使用一个合理的固定值
  console.log('强制使用固定的音频持续时间: 5秒');
};

// 音频加载错误
const onAudioError = (error) => {
  console.error('评论音频加载错误:', error);
  // 发生错误时确保仍然有一个合理的持续时间
  if (audioDuration.value <= 0 || audioDuration.value === Infinity) {
    audioDuration.value = 5;
    console.log('音频加载错误，设置默认持续时间: 5秒');
  }
};

// 播放/暂停音频
const toggleAudio = () => {
  if (!audioPlayer.value) return;
  
  if (isPlaying.value) {
    audioPlayer.value.pause();
    isPlaying.value = false;
  } else {
    // 确保音频URL正确
    if (!props.comment?.audio) {
      return;
    }
    
    audioPlayer.value.play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch(error => {
        console.error("音频播放失败:", error);
      });
  }
};

// 更新播放进度
const updateTime = () => {
  if (!audioPlayer.value) return;
  
  currentTime.value = Math.floor(audioPlayer.value.currentTime);
  
  // 如果播放时间超过了设置的持续时间（可能持续时间值偏小），则更新持续时间
  if (currentTime.value >= audioDuration.value) {
    // 更新为当前时间+1秒，确保进度条不会立即到达100%
    audioDuration.value = currentTime.value + 1;
    console.log('播放时间超过设定持续时间，更新为:', audioDuration.value);
  }
};

// 音频播放结束
const audioEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};

// 调整播放进度
const seekAudio = (value) => {
  if (!audioPlayer.value) return;
  audioPlayer.value.currentTime = value;
};

// 格式化音频时间
const formatAudioTime = (seconds) => {
  // 确保秒数是有效值
  if (seconds === undefined || seconds === null || isNaN(seconds) || !isFinite(seconds)) {
    return '00:00';
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 添加生成波形图高度的方法
const getWaveformHeight = (index) => {
  // 模拟音频波形，生成随机高度，但中间部分较高
  const middlePoint = 7;
  const distance = Math.abs(index - middlePoint);
  const baseHeight = 24 - distance * 1.5; // 基础高度减去与中心的距离
  const randomFactor = Math.random() * 8 - 4; // -4到4之间的随机数
  const height = Math.max(5, Math.min(30, baseHeight + randomFactor)); // 最小5px，最大30px
  return height + 'px';
};

// 计算波形条透明度
const getWaveformOpacity = (index, currentTime, totalDuration) => {
  if (!isPlaying.value) return 0.5; // 未播放状态下的透明度
  
  const position = currentTime / (totalDuration || 1);
  const barPosition = index / 14;
  
  // 如果当前播放位置超过了这个条的位置，则显示高亮
  if (barPosition <= position) {
    return 1;
  } else {
    return 0.3;
  }
};

// 预览图片
const previewImage = (url) => {
  const previewDialog = document.createElement('div');
  previewDialog.className = 'image-preview-dialog';
  
  const previewImg = document.createElement('img');
  previewImg.src = url;
  previewImg.className = 'preview-image';
  
  // 添加关闭按钮
  const closeButton = document.createElement('div');
  closeButton.className = 'preview-close-btn';
  closeButton.innerHTML = '×';
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.removeChild(previewDialog);
  });
  
  previewDialog.appendChild(previewImg);
  previewDialog.appendChild(closeButton);
  document.body.appendChild(previewDialog);
  
  // 禁止页面滚动
  document.body.style.overflow = 'hidden';
  
  previewDialog.addEventListener('click', () => {
    document.body.removeChild(previewDialog);
    // 恢复页面滚动
    document.body.style.overflow = '';
  });
  
  // 处理移动设备上的滑动手势
  let startY = 0;
  let startX = 0;
  
  previewDialog.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
  });
  
  previewDialog.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    
    // 垂直滑动超过50px或水平滑动超过100px时关闭预览
    if (Math.abs(currentY - startY) > 50 || Math.abs(currentX - startX) > 100) {
      document.body.removeChild(previewDialog);
      document.body.style.overflow = '';
    }
  });
};

// 长按定时器
let longPressTimer = null;
const longPressDuration = 500; // 毫秒

// 处理触摸开始
const handleTouchStart = (event, imageUrl) => {
  event.preventDefault();
  // 开始长按计时
  longPressTimer = setTimeout(() => {
    showImageMenu(event, imageUrl);
  }, longPressDuration);
};

// 处理触摸结束
const handleTouchEnd = () => {
  // 清除长按计时器
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

// 显示图片上下文菜单
const showImageMenu = (event, image) => {
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
  
  // 获取安全区域顶部高度
  const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top') || '20px';
  
  // 设置位置，考虑安全区域
  if (event.clientX && event.clientY) {
    const y = Math.max(event.clientY, parseInt(safeAreaTop) + 10); // 确保不被状态栏遮挡
    menuDiv.style.left = `${event.clientX}px`;
    menuDiv.style.top = `${y}px`;
  } else {
    // 触摸事件没有clientX/Y，使用触摸点坐标
    const touch = event.touches ? event.touches[0] : event;
    const y = Math.max(touch.clientY, parseInt(safeAreaTop) + 10); // 确保不被状态栏遮挡
    menuDiv.style.left = `${touch.clientX}px`;
    menuDiv.style.top = `${y}px`;
  }
  
  // 添加到文档
  document.body.appendChild(menuDiv);
  
  // 添加选项
  const saveOption = document.createElement('div');
  saveOption.className = 'menu-option';
  saveOption.style.padding = '12px 16px';
  saveOption.style.cursor = 'pointer';
  saveOption.innerText = '保存图片';
  saveOption.addEventListener('click', () => {
    saveImage(image);
    document.body.removeChild(menuDiv);
  });
  
  const addEmojiOption = document.createElement('div');
  addEmojiOption.className = 'menu-option';
  addEmojiOption.style.padding = '12px 16px';
  addEmojiOption.style.cursor = 'pointer';
  addEmojiOption.innerText = '添加到表情包';
  addEmojiOption.addEventListener('click', () => {
    addToEmojis(image);
    document.body.removeChild(menuDiv);
  });
  
  const cancelOption = document.createElement('div');
  cancelOption.className = 'menu-option';
  cancelOption.style.padding = '12px 16px';
  cancelOption.style.cursor = 'pointer';
  cancelOption.style.borderTop = '1px solid #eee';
  cancelOption.innerText = '取消';
  cancelOption.addEventListener('click', () => {
    document.body.removeChild(menuDiv);
  });
  
  menuDiv.appendChild(saveOption);
  menuDiv.appendChild(addEmojiOption);
  menuDiv.appendChild(cancelOption);
  
  // 点击其他地方关闭菜单
  const closeMenu = (e) => {
    if (!menuDiv.contains(e.target)) {
      // 添加检查确保菜单元素仍然在DOM中
      if (document.body.contains(menuDiv)) {
        document.body.removeChild(menuDiv);
      }
      document.removeEventListener('click', closeMenu);
    }
  };
  
  // 延迟添加事件，避免立即触发
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 100);
};

// 保存图片
const saveImage = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'image_' + new Date().getTime() + '.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 添加到表情包
const addToEmojis = async (url) => {
  try {
    const authStore = useAuthStore();
    const response = await fetch(`${API_BASE_URL}/api/community/emojis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ url })
    });
    
    if (response.ok) {
      // 成功后通知评论组件刷新表情包，并显示成功消息
      emit('refresh-emojis');
      ElMessage.success('已添加到表情包');
    } else {
      // 仅在响应不成功时显示错误消息
      ElMessage.error('添加失败');
    }
  } catch (error) {
    console.error('添加表情包失败:', error);
    ElMessage.error('添加失败');
  }
};

// 根据称号名称返回对应的样式类
const getTitleClass = (title) => {
  if (!title) return '';
  
  if (title === '云步官方') {
    return 'title-official';
  } else if (title === '持之以恒') {
    return 'title-persistent';
  } else if (title === '巅峰大神') {
    return 'title-master';
  }
  
  return '';
};

// 添加回复回复的函数
const replyToReply = (commentId, replyToUserId, replyToUsername) => {
  // 向父组件发送回复回复的事件
  emit('reply-to-reply', {
    commentId,
    replyToUserId: replyToUserId || null,
    replyToUsername: replyToUsername || ''
  });
};
</script>

<style scoped>
.comment-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  background-color: #ffffff;
}

.comment-avatar {
  margin-right: 12px;
}

.comment-content {
  flex: 1;
  overflow: hidden;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.username-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  max-width: 100%;
}

.username {
  font-weight: 500;
  color: #333;
  cursor: pointer;
}

.user-badges {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.user-badges.smaller .level-badge {
  font-size: 10px;
  padding: 1px 8px;
}

.user-badges.smaller .user-title-inline {
  font-size: 0.75rem;
  padding: 1px 6px;
}

.level-badge {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 700;
  font-style: italic;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.user-title-inline {
  font-size: 0.85rem;
  color: #333;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.3px;
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  max-width: 100%;
  overflow: visible;
}

/* 官方称号 - 金色 */
.title-official {
  color: #6d4b2f !important;
  background-color: #f8d66d !important;
  border: 1px solid #e3b748 !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5) !important;
  letter-spacing: 0.5px !important;
}

/* 持之以恒称号 - 绿色 */
.title-persistent {
  color: #2c5e2e !important;
  background-color: #a8e2aa !important;
  border: 1px solid #56c158 !important;
  font-weight: 600 !important;
  letter-spacing: 0.4px !important;
}

/* 巅峰大神称号 - 红色 */
.title-master {
  color: #ffffff !important;
  background-color: #e74c3c !important;
  border: 1px solid #c0392b !important;
  font-weight: 700 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  letter-spacing: 0.6px !important;
}

@media (prefers-color-scheme: dark) {
  .level-badge {
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
  }
  
  .user-title-inline {
    color: #ccc;
    background-color: #333;
  }
  
  /* 暗黑模式下的官方称号 - 金色 */
  .title-official {
    color: #f8d66d !important;
    background-color: #4a3206 !important;
    border: 1px solid #816d37 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
  }
  
  /* 暗黑模式下的持之以恒称号 - 绿色 */
  .title-persistent {
    color: #a8e2aa !important;
    background-color: #1e3e1f !important;
    border: 1px solid #2c5e2e !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  }
  
  /* 暗黑模式下的巅峰大神称号 - 红色 */
  .title-master {
    color: #ffffff !important;
    background-color: #7d2620 !important;
    border: 1px solid #b74138 !important;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
  }
}

.comment-time {
  font-size: 12px;
  color: #909399;
  text-align: left;
}

.comment-text {
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
  color: #333333;
}

.comment-actions {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
  cursor: pointer;
  font-size: 12px;
  color: #909399;
}

.action-item.active {
  color: #ffaa00;
}

.action-item span {
  margin-left: 4px;
}

.replies-container {
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.reply-item {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 10px;
  position: relative;
  margin-bottom: 8px;
}

.reply-meta {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  justify-content: space-between;
  width: 100%;
}

.meta-left {
  display: flex;
  align-items: center;
}

.reply-username {
  margin-right: 8px;
}

.reply-time {
  font-size: 11px;
  color: #909399;
  text-align: right;
  margin-left: auto;
}

.reply-text {
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
  color: #333333;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.reply-actions.reply-to-reply {
  justify-content: flex-start;
  margin-top: 4px;
}

.reply-action {
  color: #1677ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.reply-action:hover {
  color: #4096ff;
  text-decoration: underline;
}

.delete-action {
  color: #ff4d4f;
}

.delete-action:hover {
  color: #ff7875;
}

.comment-audio {
  margin: 8px 0 12px 0;
  position: relative;
  max-width: 100%; /* 从95%增加到100%，确保容器足够宽 */
}

.audio-bubble {
  background-color: #f8f8f8;
  border: 1px solid rgba(91, 70, 201, 0.3);
  border-radius: 18px;
  padding: 10px 14px 16px 14px; /* 减小内边距 */
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.audio-bubble.playing {
  background-color: #f0f0ff;
  border: 1px solid rgba(58, 103, 222, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.audio-controls {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  z-index: 2;
  position: relative;
}

.audio-waveform-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.audio-waveform {
  display: flex;
  align-items: center;
  gap: 2px; /* 减小波形条之间的间距 */
  height: 30px;
  width: calc(100% - 100px); /* 从90px增加到100px，给时间显示留出更多空间 */
}

.audio-time-display {
  font-size: 12px;
  color: #333333;
  padding: 2px 6px;
  background-color: rgba(91, 70, 201, 0.1);
  border-radius: 8px;
  display: inline-block;
  font-weight: 500;
  margin-left: 10px;
  flex-shrink: 0;
  min-width: 90px; /* 从80px增加到90px，确保时间显示完整 */
  text-align: center;
}

.play-button {
  background: white;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  flex-shrink: 0;
  color: #3a67de;
}

.play-button:hover {
  transform: scale(1.05);
  box-shadow: 0 3px 7px rgba(0, 0, 0, 0.15);
}

.play-button:active {
  transform: scale(0.98);
}

.audio-progress-container {
  position: relative;
  height: 6px;
  margin-top: 16px;
  width: 100%;
  background-color: rgba(91, 70, 201, 0.08);
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.audio-progress-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #5b46c9 0%, #3a67de 100%);
  border-radius: 4px;
  transition: width 0.1s linear;
  z-index: 1;
  box-shadow: 0 0 8px rgba(91, 70, 201, 0.5);
}

.playing .audio-progress-fill {
  animation: pulse-glow 2s infinite;
}

.audio-progress-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  border: 2px solid #3a67de;
  border-radius: 50%;
  top: -4px;
  margin-left: -7px;
  z-index: 2;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  pointer-events: none;
  box-shadow: 0 0 6px rgba(58, 103, 222, 0.5);
}

.audio-progress-handle:hover, 
.audio-bubble:hover .audio-progress-handle {
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(58, 103, 222, 0.7);
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 4px rgba(91, 70, 201, 0.4);
  }
  50% {
    box-shadow: 0 0 10px rgba(58, 103, 222, 0.6);
  }
  100% {
    box-shadow: 0 0 4px rgba(91, 70, 201, 0.4);
  }
}

.audio-range-input {
  position: absolute;
  top: -8px;
  left: 0;
  width: 100%;
  height: 20px;
  opacity: 0;
  cursor: pointer;
  z-index: 3;
  margin: 0;
}

.waveform-bar {
  width: 3px;
  background-color: #6c54e8;
  border-radius: 2px;
  transition: height 0.2s ease, opacity 0.3s ease;
}

.playing .waveform-bar {
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    height: calc(var(--height) - 2px);
  }
  100% {
    opacity: 1;
    height: var(--height);
  }
}

/* 评论图片样式 */
.comment-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.comment-image-container {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.comment-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-image:hover {
  opacity: 0.9;
}

/* 适应高分辨率屏幕 */
@media screen and (min-width: 768px) {
  .comment-image-container {
    width: 100px;
    height: 100px;
  }
}

/* 自定义右键菜单样式 */
:deep(.custom-context-menu) {
  min-width: 120px;
}

:deep(.menu-option:hover) {
  background-color: #f0f0f0;
}

.comment-actions-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-btn {
  cursor: pointer;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 50%;
}

.report-btn:hover {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
}

/* 回复图片样式优化 */
.reply-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.reply-image-container {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.reply-image-container:hover {
  transform: scale(1.03);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
}

.reply-image-container:active {
  transform: scale(0.98);
}

.reply-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.reply-image:hover {
  transform: scale(1.05);
}

/* 适应高分辨率屏幕 */
@media screen and (min-width: 768px) {
  .reply-image-container {
    width: 100px;
    height: 100px;
  }
}

.image-preview-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  flex-direction: column;
  touch-action: none;
}

.preview-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.preview-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  z-index: 10000;
}

@media screen and (max-width: 480px) {
  .preview-image {
    max-width: 95%;
    max-height: 80%;
  }
  
  .preview-close-btn {
    top: 15px;
    right: 15px;
    width: 36px;
    height: 36px;
  }
}
</style>
