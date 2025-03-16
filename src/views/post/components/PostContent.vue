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
        />
        <div class="image-indicator" v-if="post.images.length > 1">
          {{ currentImageIndex + 1 }}/{{ post.images.length }}
        </div>
      </div>
    </div>

    <!-- 帖子内容 -->
    <div class="post-content">
      <h3 class="post-title">{{ post.title }}</h3>
      <p class="post-text">{{ post.content }}</p>
      
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
import { ref, computed, onMounted } from "vue";
import { ArrowLeft, ArrowRight, VideoPlay, VideoPause } from "@element-plus/icons-vue";
import { API_BASE_URL } from "@/config";

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
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

// 修改组件挂载时的初始化逻辑
onMounted(() => {
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
  background-color: var(--card-bg);
  text-align: left;
}

.post-title {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 18px;
  color: var(--text-color);
  text-align: left;
}

.post-text {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--text-color);
  margin: 0;
  text-align: left;
}

.audio-container {
  margin-top: 20px;
  position: relative;
  max-width: 95%; /* 增加最大宽度，确保包含时间显示 */
}

.audio-bubble {
  background-color: var(--card-bg, #1e1e1e);
  border: 1px solid rgba(47, 156, 106, 0.3);
  border-radius: 20px;
  padding: 14px 16px 20px 16px; /* 减小内边距 */
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.audio-bubble.playing {
  background-color: var(--card-bg, #1e1e1e);
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
}

.audio-waveform {
  display: flex;
  align-items: center;
  gap: 3px; /* 减小波形条之间的间距 */
  height: 40px;
  width: calc(100% - 100px); /* 微调给时间显示留出的空间 */
}

.waveform-bar {
  width: 3px; /* 减小波形条宽度 */
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
  color: var(--text-color, #303133);
  padding: 3px 8px;
  background-color: rgba(47, 156, 106, 0.1);
  border-radius: 10px;
  display: inline-block;
  font-weight: 500;
  margin-left: 12px;
  flex-shrink: 0;
  min-width: 90px;
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
</style>
