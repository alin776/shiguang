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
        <div class="username">
          {{ comment.user?.username || "匿名用户" }}
        </div>
        <div class="comment-time">{{ formatTime(comment.created_at) }}</div>
      </div>
      <div class="comment-text">{{ comment.content }}</div>
      
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
            <span class="username" @click="$emit('user-click', reply.user?.id)">
              {{ reply.user?.username || "匿名用户" }}
            </span>
            <span v-if="reply.reply_to_user" class="reply-to">
              回复
              <span @click="$emit('user-click', reply.reply_to_user?.id)">
                {{ reply.reply_to_user?.username || "匿名用户" }}
              </span>
            </span>
            <span class="reply-time">{{ formatTime(reply.created_at) }}</span>
          </div>
          <div class="reply-text">{{ reply.content }}</div>
          <div class="reply-actions" v-if="reply.user?.id === userId">
            <span
              class="delete-action"
              @click="$emit('delete-reply', reply.id)"
            >
              删除
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
import { Star, VideoPlay, VideoPause } from "@element-plus/icons-vue";
import { getAvatarUrl } from "../../../utils/imageHelpers";
import { formatTime } from "../../../utils/timeHelpers";
import { ref, computed, onMounted } from "vue";
import { API_BASE_URL } from "@/config";

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  userId: {
    type: [Number, String],
    default: null,
  },
});

defineEmits([
  "user-click",
  "reply",
  "like-comment",
  "delete-comment",
  "delete-reply",
]);

// 音频播放相关
const audioPlayer = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const audioDuration = ref(0);

// 添加是否悬停的状态
const isHovering = ref(false);

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
  align-items: center;
  margin-bottom: 4px;
  justify-content: flex-start;
}

.username {
  font-weight: 500;
  margin-right: 8px;
  cursor: pointer;
  text-align: left;
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
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  justify-content: flex-start;
}

.reply-to {
  color: #909399;
  margin-right: 8px;
  text-align: left;
}

.reply-time {
  font-size: 11px;
  color: #909399;
  text-align: left;
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
</style>
