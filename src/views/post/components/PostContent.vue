<template>
  <div class="post-container">
    <!-- 图片轮播 -->
    <div class="post-images" v-if="post.images?.length">
      <div class="image-slider">
        <div class="slider-arrows">
          <div
            class="arrow left"
            @click="prevImage"
            v-if="post.images.length > 1"
          >
            <el-icon><ArrowLeft /></el-icon>
          </div>
          <div
            class="arrow right"
            @click="nextImage"
            v-if="post.images.length > 1"
          >
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
        <img
          :src="post.images[currentImageIndex]"
          :alt="post.title"
          class="main-image"
          @touchstart.prevent="handleTouchStart($event, post.images[currentImageIndex])"
          @touchend.prevent="handleTouchEnd"
          @touchmove.prevent
          @contextmenu.prevent="showImageMenu($event, post.images[currentImageIndex])"
          @click="previewImage(post.images[currentImageIndex])"
          crossorigin="anonymous"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
        <div class="image-indicator" v-if="post.images.length > 1">
          {{ currentImageIndex + 1 }}/{{ post.images.length }}
        </div>
      </div>
    </div>

    <!-- 帖子内容 -->
    <div class="post-content">
      <h3 class="post-title" v-if="post.title">{{ post.title }}</h3>
      <h3 class="post-title" v-else>无标题</h3>
      <p class="post-text" 
         @touchstart="handleTextTouchStart($event)" 
         @touchend="handleTextTouchEnd">{{ post.content }}</p>
      
      <!-- 音频播放器 - 改进设计 -->
      <div v-if="post.audio" class="audio-container">
        <div class="audio-bubble" :class="{ 'playing': isPlaying }">
          <div class="audio-controls">
            <div class="play-button" @click="toggleAudio">
              <el-icon class="play-icon"><VideoPlay v-if="!isPlaying" /><VideoPause v-else /></el-icon>
            </div>
            
            <div class="audio-waveform-container">
              <div class="audio-waveform">
                <div 
                  v-for="(bar, index) in 20" 
                  :key="index" 
                  class="waveform-bar"
                  :style="{ 
                    height: getWaveformHeight(index),
                    animationDelay: (index * 0.04) + 's',
                    opacity: getWaveformOpacity(index, currentTime, audioDuration)
                  }"
                ></div>
              </div>
              
              <div class="audio-time-display">
                {{ formatTime(currentTime) }} / {{ formatTime(audioDuration || getDurationFromFilename(post.audio)) }}
              </div>
            </div>
          </div>
          
          <div class="audio-progress-container">
            <div 
              class="audio-progress-fill" 
              :style="{ width: ((currentTime / (audioDuration || getDurationFromFilename(post.audio))) * 100) + '%' }"
            ></div>
            <div class="audio-progress-handle" 
              :style="{ left: ((currentTime / (audioDuration || getDurationFromFilename(post.audio))) * 100) + '%' }"
              v-show="isHovering || isPlaying">
            </div>
            <input 
              type="range" 
              class="audio-range-input" 
              :max="audioDuration || getDurationFromFilename(post.audio) || 100"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUpdated, watch } from "vue";
import { ArrowLeft, ArrowRight, VideoPlay, VideoPause } from "@element-plus/icons-vue";
import { API_BASE_URL } from "@/config";
import { ElMessage } from "element-plus";

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

// 添加调试日志，在组件挂载时和props更新时输出
onMounted(() => {
  console.log("PostContent 组件挂载 - 帖子标题:", props.post.title);
  console.log("PostContent 组件挂载 - 帖子数据:", props.post);
  if (props.post?.audio) {
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
});

// 监听props.post的变化
watch(() => props.post, (newPost) => {
  console.log("PostContent props.post更新 - 新帖子标题:", newPost.title);
}, { deep: true });

onUpdated(() => {
  console.log("PostContent 组件更新 - 帖子标题:", props.post.title);
});

const currentImageIndex = ref(0);
const audioPlayer = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const audioDuration = ref(0);
const isHovering = ref(false);

// 计算音频源地址
const audioSrc = computed(() => {
  if (!props.post.audio) return '';
  return props.post.audio.startsWith('http') 
    ? props.post.audio 
    : `${API_BASE_URL}${props.post.audio}`;
});

// 添加一个强制设置持续时间的函数，不依赖元数据
const forceSetDuration = () => {
  // 1. 首先尝试从URL获取持续时间 - 这是最可靠的来源
  if (props.post?.audio && props.post.audio.includes('duration=')) {
    const match = props.post.audio.match(/duration=(\d+)/);
    if (match && match[1]) {
      const duration = parseInt(match[1]);
      if (duration > 0) {
        audioDuration.value = duration;
        console.log('强制从URL设置帖子音频持续时间:', audioDuration.value);
        return; // 成功获取，直接返回
      }
    }
  }
  
  // 2. 如果URL中没有，尝试使用post对象中的持续时间
  if (props.post?.audio_duration && 
      !isNaN(props.post.audio_duration) && 
      props.post.audio_duration > 0) {
    audioDuration.value = props.post.audio_duration;
    console.log('强制使用帖子对象中的音频持续时间:', audioDuration.value);
    return; // 成功获取，直接返回
  }
  
  // 3. 最后使用固定的经验值
  audioDuration.value = 5; // 使用一个合理的固定值
  console.log('强制使用固定的音频持续时间: 5秒');
};

// 修改从文件名获取持续时间的函数，使其更简单可靠
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
  
  // 如果URL中没有，但post对象有持续时间
  if (props.post?.audio_duration && 
      !isNaN(props.post.audio_duration) && 
      props.post.audio_duration > 0) {
    return props.post.audio_duration;
  }
  
  // 默认返回5秒
  return 5;
};

// 图片轮播相关方法
const prevImage = () => {
  if (props.post.images?.length > 1) {
    currentImageIndex.value =
      currentImageIndex.value === 0
        ? props.post.images.length - 1
        : currentImageIndex.value - 1;
  }
};

const nextImage = () => {
  if (props.post.images?.length > 1) {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % props.post.images.length;
  }
};

// 修改音频元数据加载完成函数，不再尝试从元数据中获取持续时间
const onMetadataLoaded = () => {
  // 完全跳过从元数据中获取持续时间的逻辑
  // 直接从URL或其他来源设置持续时间
  forceSetDuration();
};

// 修改更新播放进度的函数，不要从元数据中更新持续时间
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

// 修改音频加载错误处理
const onAudioError = (error) => {
  console.error('帖子音频加载错误:', error);
  // 发生错误时确保仍然有一个合理的持续时间
  if (audioDuration.value <= 0 || audioDuration.value === Infinity) {
    audioDuration.value = 5;
    console.log('音频加载错误，设置默认持续时间: 5秒');
  }
};

// 音频播放相关方法
const toggleAudio = () => {
  if (!audioPlayer.value) return;
  
  if (isPlaying.value) {
    audioPlayer.value.pause();
    isPlaying.value = false;
  } else {
    // 确保音频URL正确
    if (!props.post.audio) {
      return;
    }
    
    audioPlayer.value.play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch(error => {
        console.error('播放失败:', error);
      });
  }
};

const audioEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};

const seekAudio = (value) => {
  if (!audioPlayer.value) return;
  audioPlayer.value.currentTime = Number(value);
};

const formatTime = (seconds) => {
  // 确保秒数是有效的数字
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
  const middlePoint = 10;
  const distance = Math.abs(index - middlePoint);
  const baseHeight = 30 - distance * 1.2; // 基础高度减去与中心的距离
  const randomFactor = Math.random() * 10 - 5; // -5到5之间的随机数
  const height = Math.max(6, Math.min(36, baseHeight + randomFactor)); // 最小6px，最大36px
  return height + 'px';
};

// 计算波形条透明度
const getWaveformOpacity = (index, currentTime, totalDuration) => {
  if (!isPlaying.value) return 0.6; // 未播放状态下的透明度
  
  const position = currentTime / (totalDuration || 1);
  const barPosition = index / 20;
  
  // 如果当前播放位置超过了这个条的位置，则显示高亮
  if (barPosition <= position) {
    return 1;
  } else {
    return 0.3;
  }
};

// 长按相关变量和函数
let longPressTimer = null;
let textLongPressTimer = null; 
const longPressDuration = 500; // 毫秒

// 处理图片触摸开始
const handleTouchStart = (event, imageUrl) => {
  event.preventDefault();
  // 开始长按计时
  longPressTimer = setTimeout(() => {
    // 显示确认对话框而不是直接保存
    showSaveImageConfirm(imageUrl);
  }, longPressDuration);
};

// 处理图片触摸结束
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
  
  // 设置位置
  if (event.clientX && event.clientY) {
    menuDiv.style.left = `${event.clientX}px`;
    menuDiv.style.top = `${event.clientY}px`;
  } else {
    // 触摸事件没有clientX/Y，使用触摸点坐标
    const touch = event.touches ? event.touches[0] : event;
    menuDiv.style.left = `${touch.clientX}px`;
    menuDiv.style.top = `${touch.clientY}px`;
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
  try {
    // 对于移动端浏览器，使用 fetch 请求图片并创建 Blob 对象
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        // 创建 Blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'image_' + new Date().getTime() + '.jpg';
        link.style.display = 'none';
        
        // 添加到文档并触发点击
        document.body.appendChild(link);
        link.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch(error => {
        console.error('保存图片失败:', error);
        ElMessage.error('保存图片失败，请稍后重试');
        
        // 失败时使用备用方法
        fallbackSaveImage(url);
      });
  } catch (error) {
    console.error('保存图片出错:', error);
    // 使用备用方法
    fallbackSaveImage(url);
  }
};

// 备用保存图片方法
const fallbackSaveImage = (url) => {
  // 创建一个隐藏的a元素并触发下载
  const a = document.createElement('a');
  a.href = url;
  a.download = 'image_' + new Date().getTime() + '.jpg';
  a.target = '_blank'; // 增加 target 属性
  a.rel = 'noopener noreferrer'; // 安全属性
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 文本长按复制
const handleTextTouchStart = (event) => {
  // 开始长按计时
  textLongPressTimer = setTimeout(() => {
    copyTextToClipboard(props.post.content);
    ElMessage.success("文本已复制到剪贴板");
  }, longPressDuration);
};

const handleTextTouchEnd = () => {
  // 清除长按计时器
  if (textLongPressTimer) {
    clearTimeout(textLongPressTimer);
    textLongPressTimer = null;
  }
};

// 复制文本到剪贴板
const copyTextToClipboard = (text) => {
  if (!text) return;
  
  // 使用Clipboard API(现代浏览器)
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .catch(err => {
        console.error('无法复制文本:', err);
        fallbackCopyTextToClipboard(text);
      });
  } else {
    fallbackCopyTextToClipboard(text);
  }
};

// 后备复制方法
const fallbackCopyTextToClipboard = (text) => {
  // 创建一个临时文本区域元素
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';  // 避免滚动到底部
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('复制文本失败:', err);
  }
  
  document.body.removeChild(textArea);
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
    // 恢复页面滚动
    document.body.style.overflow = '';
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

// 显示保存图片确认对话框
const showSaveImageConfirm = (imageUrl) => {
  // 创建确认对话框
  const confirmDialog = document.createElement('div');
  confirmDialog.className = 'save-image-confirm-dialog';
  confirmDialog.style.position = 'fixed';
  confirmDialog.style.top = '50%';
  confirmDialog.style.left = '50%';
  confirmDialog.style.transform = 'translate(-50%, -50%)';
  confirmDialog.style.backgroundColor = '#fff';
  confirmDialog.style.borderRadius = '12px';
  confirmDialog.style.padding = '20px';
  confirmDialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  confirmDialog.style.width = '80%';
  confirmDialog.style.maxWidth = '300px';
  confirmDialog.style.zIndex = '10000';
  confirmDialog.style.textAlign = 'center';

  // 添加标题
  const title = document.createElement('div');
  title.textContent = '保存图片';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '18px';
  title.style.marginBottom = '15px';
  confirmDialog.appendChild(title);

  // 添加提示文字
  const message = document.createElement('div');
  message.textContent = '是否保存该图片到相册？';
  message.style.marginBottom = '20px';
  message.style.color = '#555';
  confirmDialog.appendChild(message);

  // 添加按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  confirmDialog.appendChild(buttonContainer);

  // 添加取消按钮
  const cancelButton = document.createElement('button');
  cancelButton.textContent = '取消';
  cancelButton.style.flex = '1';
  cancelButton.style.padding = '10px';
  cancelButton.style.marginRight = '10px';
  cancelButton.style.border = '1px solid #eee';
  cancelButton.style.borderRadius = '8px';
  cancelButton.style.backgroundColor = '#f5f5f5';
  cancelButton.style.color = '#666';
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(confirmDialog);
    document.body.removeChild(overlay);
  });
  buttonContainer.appendChild(cancelButton);

  // 添加确认按钮
  const confirmButton = document.createElement('button');
  confirmButton.textContent = '保存';
  confirmButton.style.flex = '1';
  confirmButton.style.padding = '10px';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '8px';
  confirmButton.style.backgroundColor = '#1677ff';
  confirmButton.style.color = '#fff';
  confirmButton.addEventListener('click', () => {
    saveImage(imageUrl);
    ElMessage.success("图片已保存到相册");
    document.body.removeChild(confirmDialog);
    document.body.removeChild(overlay);
  });
  buttonContainer.appendChild(confirmButton);

  // 添加半透明遮罩
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '9999';
  overlay.addEventListener('click', () => {
    document.body.removeChild(confirmDialog);
    document.body.removeChild(overlay);
  });

  // 将对话框和遮罩添加到文档
  document.body.appendChild(overlay);
  document.body.appendChild(confirmDialog);
};
</script>

<style scoped>
.post-container {
  margin-bottom: 16px;
}

.post-images {
  overflow: hidden;
  background: #f0f0f0;
  max-height: 50vh;
}

.image-slider {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.main-image {
  width: 100%;
  display: block;
  object-fit: contain;
  background: #000;
  max-height: 50vh;
}

.slider-arrows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}

.arrow {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  margin: 0 12px;
}

.image-indicator {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.post-content {
  padding: 16px;
  background-color: #ffffff;
  text-align: left;
}

.post-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 10px 0 15px;
  line-height: 1.4;
  text-align: left;
  /* 增强标题的视觉效果 */
  border-left: 4px solid #1677ff;
  padding-left: 12px;
  background-color: #f8f9fa;
  padding: 10px 12px;
  border-radius: 4px;
}

.post-text {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #333333;
  margin: 0;
  text-align: left;
}

.audio-container {
  margin-top: 20px;
  position: relative;
  max-width: 100%;
}

.audio-bubble {
  background-color: #f8f8f8;
  border: 1px solid rgba(47, 156, 106, 0.3);
  border-radius: 20px;
  padding: 14px 16px 20px 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.audio-bubble.playing {
  background-color: #f0f9f4;
  border: 1px solid rgba(66, 184, 131, 0.4);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.audio-controls {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  z-index: 2;
  position: relative;
}

.play-button {
  background: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.play-icon {
  font-size: 22px;
  color: #42b883;
}

.play-button:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.play-button:active {
  transform: scale(0.96);
}

.audio-waveform-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.audio-waveform {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 40px;
  width: calc(100% - 110px);
}

.waveform-bar {
  width: 3px;
  background-color: #42b883;
  border-radius: 2px;
  transition: height 0.2s ease, opacity 0.3s ease;
}

.playing .waveform-bar {
  animation: pulse 1.2s infinite alternate;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
    height: calc(var(--height) - 3px);
  }
  100% {
    opacity: 1;
    height: var(--height);
  }
}

.audio-time-display {
  font-size: 14px;
  color: #333333;
  padding: 3px 8px;
  background-color: rgba(47, 156, 106, 0.1);
  border-radius: 10px;
  display: inline-block;
  font-weight: 500;
  margin-left: 12px;
  flex-shrink: 0;
  min-width: 95px;
  text-align: center;
}

.audio-progress-container {
  position: relative;
  height: 8px;
  margin-top: 18px;
  width: 100%;
  background-color: rgba(47, 156, 106, 0.08);
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.audio-progress-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #2ea27d 0%, #42b883 100%);
  border-radius: 4px;
  transition: width 0.1s linear;
  z-index: 1;
  box-shadow: 0 0 8px rgba(66, 184, 131, 0.5);
}

.playing .audio-progress-fill {
  animation: progress-pulse 2.5s infinite;
}

.audio-progress-handle {
  position: absolute;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  border: 2px solid #42b883;
  border-radius: 50%;
  top: -5px;
  margin-left: -9px;
  z-index: 2;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  pointer-events: none;
  box-shadow: 0 0 8px rgba(66, 184, 131, 0.5);
}

.audio-progress-handle:hover,
.audio-bubble:hover .audio-progress-handle {
  transform: scale(1.15);
  box-shadow: 0 0 12px rgba(66, 184, 131, 0.7);
}

@keyframes progress-pulse {
  0% {
    box-shadow: 0 0 6px rgba(66, 184, 131, 0.5);
  }
  50% {
    box-shadow: 0 0 14px rgba(42, 157, 105, 0.7);
  }
  100% {
    box-shadow: 0 0 6px rgba(66, 184, 131, 0.5);
  }
}

.audio-range-input {
  position: absolute;
  top: -10px;
  left: 0;
  width: 100%;
  height: 26px;
  opacity: 0;
  cursor: pointer;
  z-index: 3;
  margin: 0;
}

/* 图片预览对话框样式 */
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
