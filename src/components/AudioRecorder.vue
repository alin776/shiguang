<template>
  <div class="audio-recorder">
    <div v-if="!audioUrl && !isRecording" class="record-button-container">
      <el-button type="primary" @click="startRecording" circle>
        <el-icon><Microphone /></el-icon>
      </el-button>
      <span>点击录音</span>
    </div>

    <div v-if="isRecording" class="recording-container">
      <div class="recording-indicator">
        <div v-for="i in 3" :key="i" class="indicator-dot" :class="{ active: i <= activeDots }"></div>
      </div>
      <div class="recording-time">{{ formatTime(recordingTime) }}</div>
      <el-button type="danger" @click="stopRecording" circle>
        <el-icon><VideoPlay /></el-icon>
      </el-button>
    </div>

    <div v-if="isUploading" class="upload-progress-container">
      <div class="upload-status">
        <span>正在上传音频</span>
        <span class="network-speed" :class="{ 
          'slow': networkSpeed === '较慢', 
          'medium': networkSpeed === '一般' 
        }">网络速度: {{ networkSpeed }}</span>
      </div>
      <el-progress 
        :percentage="uploadProgress" 
        :format="(percent) => `${percent}%`" 
        status="success"
      />
    </div>

    <div v-if="showOfflineWarning" class="offline-warning">
      <el-alert
        title="离线录音已保存"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          当前处于离线状态，录音文件已临时保存。当网络恢复后，系统将自动上传录音。
        </template>
      </el-alert>
      <div class="network-status">
        <el-icon><Connection /></el-icon>
        <span>等待网络连接...</span>
      </div>
    </div>

    <div v-if="audioUrl && !isRecording && !isUploading" class="audio-player">
      <div class="audio-controls">
        <el-button @click="playAudio" circle :disabled="isPlaying">
          <el-icon><VideoPlay v-if="!isPlaying" /><VideoPause v-else /></el-icon>
        </el-button>
        <div class="audio-progress">
          <div class="audio-duration">{{ formatTime(currentTime) }} / {{ formatTime(audioDuration || getDurationFromFilename(audioUrl)) }}</div>
          <el-slider v-model="currentTime" :max="audioDuration || getDurationFromFilename(audioUrl) || 100" @input="seekAudio" />
        </div>
        <el-button @click="deleteAudio" circle type="danger">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <audio 
      ref="audioPlayer" 
      @timeupdate="updateTime" 
      @ended="audioEnded" 
      @loadedmetadata="onMetadataLoaded"
      @error="onAudioError"
      :src="audioUrl"
      preload="metadata"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Microphone, VideoPlay, VideoPause, Delete, Connection } from '@element-plus/icons-vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { useAuthStore } from '@/stores/auth';
import { Capacitor } from '@capacitor/core';
import { Microphone as MicrophonePlugin } from '@mozartec/capacitor-microphone';

const props = defineProps({
  value: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['update:value', 'audio-recorded', 'audio-deleted']);

const audioUrl = ref(props.value); // 音频URL
const isRecording = ref(false); // 是否正在录音
const recordingTime = ref(0); // 录音时长（秒）
const audioPlayer = ref(null); // 音频播放器引用
const isPlaying = ref(false); // 是否正在播放
const currentTime = ref(0); // 当前播放位置
const audioDuration = ref(0); // 音频总时长
const activeDots = ref(1); // 活跃的指示点数量
const authStore = useAuthStore();
const isUploading = ref(false); // 是否正在上传
const uploadProgress = ref(0); // 上传进度（0-100）
const networkSpeed = ref('正常'); // 网络速度状态
const isOffline = ref(false); // 是否处于离线状态
const pendingUploadBlob = ref(null); // 待上传的音频Blob
const pendingUploadDuration = ref(0); // 待上传音频的持续时间
const showOfflineWarning = ref(false); // 是否显示离线警告

let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let dotsTimer = null;
let networkCheckTimer = null; // 网络状态检查定时器

// 监听value变化
watch(() => props.value, (newValue) => {
  if (newValue) {
    // 确保音频URL是完整路径
    audioUrl.value = newValue.startsWith('http') 
      ? newValue 
      : `${API_BASE_URL}${newValue}`;
      
    console.log('AudioRecorder value变更为:', audioUrl.value);
    
    // 立即尝试从URL获取持续时间
    const durationFromUrl = getDurationFromFilename(audioUrl.value);
    
    // 如果URL中有持续时间，就立即使用
    if (durationFromUrl > 0) {
      audioDuration.value = durationFromUrl;
      console.log('从URL获取并设置持续时间:', audioDuration.value);
    } else {
      // 否则重置持续时间，等待元数据加载
      audioDuration.value = 0;
      console.log('重置持续时间为0，等待元数据加载');
    }
  } else {
    audioUrl.value = null;
    audioDuration.value = 0;
  }
});

// 添加onMounted钩子初始化持续时间
onMounted(() => {
  if (props.value) {
    // 确保音频URL是完整路径
    audioUrl.value = props.value.startsWith('http') 
      ? props.value 
      : `${API_BASE_URL}${props.value}`;
      
    // 尝试从URL获取持续时间
    if (audioUrl.value) {
      audioDuration.value = getDurationFromFilename(audioUrl.value);
      console.log('AudioRecorder初始化时获取的持续时间:', audioDuration.value);
    }
  }
  
  // 初始化网络状态
  isOffline.value = !navigator.onLine;
  
  // 添加网络状态变化监听器
  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);
  
  // 如果已经有待上传的文件，并且网络已连接，尝试上传
  checkPendingUploads();
  
  // 周期性检查网络和待上传文件
  networkCheckTimer = setInterval(checkPendingUploads, 10000); // 每10秒检查一次
});

// 处理网络状态变化
const handleNetworkChange = () => {
  isOffline.value = !navigator.onLine;
  
  if (navigator.onLine) {
    // 网络已连接，检查是否有待上传的录音
    checkPendingUploads();
    ElMessage.success('网络已恢复连接');
  } else {
    // 网络已断开
    ElMessage.warning('网络连接已断开，录音将在网络恢复后上传');
  }
};

// 检查并处理待上传的文件
const checkPendingUploads = async () => {
  if (navigator.onLine && pendingUploadBlob.value) {
    ElMessage.info('网络已连接，开始上传之前录制的音频');
    
    try {
      // 从待上传队列中取出第一个文件进行上传
      const blob = pendingUploadBlob.value;
      const duration = pendingUploadDuration.value;
      
      // 重置待上传状态
      pendingUploadBlob.value = null;
      pendingUploadDuration.value = 0;
      showOfflineWarning.value = false;
      
      // 执行上传
      await uploadAudio(blob, duration);
    } catch (error) {
      console.error('自动上传失败:', error);
      ElMessage.error('自动上传失败，请稍后重试');
    }
  }
};

// 开始录音
const startRecording = async () => {
  try {
    // 检查是否在Capacitor环境中
    if (Capacitor.isNativePlatform()) {
      // 请求麦克风权限（Capacitor原生API）
      try {
        const microphonePermission = await MicrophonePlugin.checkPermissions();
        
        if (microphonePermission.microphone !== 'granted') {
          // 权限未授予，请求权限
          const requestResult = await MicrophonePlugin.requestPermissions();
          
          if (requestResult.microphone !== 'granted') {
            ElMessage.error('录音需要麦克风权限，请在设备设置中启用权限');
            return;
          }
        }
      } catch (permError) {
        console.error('权限检查失败:', permError);
        ElMessage.error('权限检查失败，请确保已授予麦克风权限');
        return;
      }
    }
    
    // 获取麦克风流
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 检测设备类型，为不同设备选择合适的音频格式
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    let mimeType = 'audio/webm;codecs=opus'; // 默认格式
    
    // 针对iOS设备选择更兼容的格式
    if (isIOS) {
      try {
        // 检查是否支持mp4格式
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
          console.log('使用iOS兼容的audio/mp4格式');
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
          console.log('使用iOS兼容的audio/aac格式');
        } else {
          console.log('iOS设备不支持推荐的音频格式，尝试使用默认格式');
        }
      } catch (e) {
        console.warn('检测音频格式支持时出错，将使用默认格式', e);
      }
    }
    
    // 使用更兼容的音频格式选项
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      console.log('使用音频格式:', mimeType);
    } catch (err) {
      console.warn('指定的音频格式不受支持，将使用默认格式');
      mediaRecorder = new MediaRecorder(stream);
    }
    
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      
      // 上传音频文件到服务器
      await uploadAudio(audioBlob);
      
      // 释放媒体资源
      stream.getTracks().forEach(track => track.stop());
    };
    
    // 检测网络连接
    checkNetworkConnection();
    
    // 开始录音
    mediaRecorder.start();
    isRecording.value = true;
    recordingTime.value = 0;
    
    // 录音计时器
    recordingTimer = setInterval(() => {
      recordingTime.value++;
      // 限制录音最长时间为60秒
      if (recordingTime.value >= 60) {
        stopRecording();
      }
    }, 1000);
    
    // 动画计时器
    dotsTimer = setInterval(() => {
      activeDots.value = (activeDots.value % 3) + 1;
    }, 500);
    
  } catch (error) {
    console.error('录音失败:', error);
    
    // 更友好的错误提示，区分不同设备
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isIOS) {
      ElMessage.error('录音失败，请确保在iOS设备上已授予麦克风权限并使用Safari浏览器');
    } else if (isAndroid) {
      ElMessage.error('录音失败，请确保已授予麦克风权限');
    } else {
      ElMessage.error('录音初始化失败，请确保已授予麦克风权限');
    }
  }
};

// 检查网络连接状态
const checkNetworkConnection = () => {
  // 检测网络连接类型（如果浏览器支持）
  if (navigator.connection) {
    const connection = navigator.connection;
    
    // 慢速连接警告
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      ElMessage.warning('检测到您正在使用较慢的网络连接，上传可能需要较长时间');
      networkSpeed.value = '较慢';
    }
    
    // 监听网络变化
    connection.addEventListener('change', () => {
      if (isUploading.value && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')) {
        ElMessage.warning('网络状况变差，上传可能会变慢');
        networkSpeed.value = '较慢';
      }
    });
  }
  
  // 检测是否为移动网络
  if (navigator.connection && navigator.connection.type === 'cellular') {
    ElMessage.info('您正在使用移动数据网络，上传音频可能消耗流量');
  }
};

// 停止录音
const stopRecording = () => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
  
  mediaRecorder.stop();
  isRecording.value = false;
  
  clearInterval(recordingTimer);
  clearInterval(dotsTimer);
};

// 修改上传音频函数，支持离线状态判断
const uploadAudio = async (audioBlob, actualDuration = recordingTime.value) => {
  // 检查网络状态
  if (!navigator.onLine) {
    // 离线状态，保存录音以便后续上传
    pendingUploadBlob.value = audioBlob;
    pendingUploadDuration.value = actualDuration;
    showOfflineWarning.value = true;
    
    // 创建临时预览URL
    const tempURL = URL.createObjectURL(audioBlob);
    audioUrl.value = tempURL;
    audioDuration.value = actualDuration;
    
    ElMessage.warning('当前处于离线状态，录音将在网络恢复后自动上传');
    return;
  }
  
  try {
    // 重置上传状态和进度
    isUploading.value = true;
    uploadProgress.value = 0;
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    // 添加录音持续时间到表单数据 - 确保这是实际录制的时间
    formData.append('duration', actualDuration.toString());
    
    console.log('准备上传音频，实际录制持续时间:', actualDuration, '秒');
    
    // 检测起始时间，用于计算网络速度
    const startTime = Date.now();
    let lastProgress = 0;
    
    const response = await axios.post(
      `${API_BASE_URL}/api/community/upload-audio`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authStore.token}`
        },
        // 添加上传进度事件处理
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // 计算上传百分比
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            uploadProgress.value = percentCompleted;
            
            // 简单检测网络速度
            const currentTime = Date.now();
            const elapsed = (currentTime - startTime) / 1000; // 已用时间(秒)
            
            // 计算上传速度（每秒上传百分比）
            if (elapsed > 0) {
              const progressPerSecond = (percentCompleted - lastProgress) / elapsed;
              
              // 根据速度更新网络状态提示
              if (progressPerSecond < 5) {
                networkSpeed.value = '较慢';
              } else if (progressPerSecond < 15) {
                networkSpeed.value = '一般';
              } else {
                networkSpeed.value = '正常';
              }
              
              lastProgress = percentCompleted;
            }
          }
        }
      }
    );

    // 确保音频URL是完整路径
    const fullUrl = response.data.fullUrl.startsWith('http') 
      ? response.data.fullUrl 
      : `${API_BASE_URL}${response.data.url}`;
    
    console.log('音频上传成功:', fullUrl);
    console.log('服务器返回的持续时间:', response.data.duration);
    console.log('URL包含持续时间参数:', fullUrl.includes('duration='));
    
    audioUrl.value = fullUrl;
    
    // 使用实际录制时间作为持续时间，确保准确性
    audioDuration.value = actualDuration;
    console.log('使用实际录制时间作为持续时间:', audioDuration.value);
    
    // 也尝试从URL中获取（仅用于验证）
    const durationFromUrl = getDurationFromFilename(fullUrl);
    console.log('从URL中提取的持续时间:', durationFromUrl);
    
    emit('update:value', response.data.url);
    emit('audio-recorded', response.data.url, actualDuration); // 传递实际持续时间
    
    ElMessage.success('音频录制成功');
  } catch (error) {
    console.error('上传音频失败:', error);
    ElMessage.error('上传音频失败: ' + (error.response?.data?.message || error.message || '未知错误'));
  } finally {
    // 无论成功或失败，都重置上传状态
    isUploading.value = false;
    uploadProgress.value = 0;
  }
};

// 播放音频
const playAudio = () => {
  if (!audioPlayer.value) return;
  
  if (isPlaying.value) {
    audioPlayer.value.pause();
    isPlaying.value = false;
  } else {
    // 确保音频路径正确
    if (!audioUrl.value) {
      ElMessage.error('音频地址无效');
      return;
    }
    
    audioPlayer.value.play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch(error => {
        console.error('播放失败:', error);
        ElMessage.error('播放失败，不支持的音频格式或路径无效');
      });
  }
};

// 删除音频
const deleteAudio = () => {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
  }
  
  audioUrl.value = null;
  isPlaying.value = false;
  currentTime.value = 0;
  audioDuration.value = 0;
  
  emit('update:value', null);
  emit('audio-deleted');
  
  ElMessage.success('音频已删除');
};

// 音频元数据加载完成时触发
const onMetadataLoaded = () => {
  if (!audioPlayer.value) return;
  console.log('音频元数据加载完成，持续时间:', audioPlayer.value.duration);
  
  // 确保音频持续时间有效
  if (audioPlayer.value.duration && 
      !isNaN(audioPlayer.value.duration) && 
      isFinite(audioPlayer.value.duration) && 
      audioPlayer.value.duration !== Infinity) {
    audioDuration.value = Math.floor(audioPlayer.value.duration);
    console.log('元数据加载后设置持续时间:', audioDuration.value);
  } else {
    console.warn('音频持续时间无效或为Infinity:', audioPlayer.value.duration);
    
    // 尝试延迟1秒后再次获取持续时间
    setTimeout(() => {
      if (audioPlayer.value && 
          audioPlayer.value.duration && 
          !isNaN(audioPlayer.value.duration) && 
          isFinite(audioPlayer.value.duration) && 
          audioPlayer.value.duration !== Infinity) {
        audioDuration.value = Math.floor(audioPlayer.value.duration);
        console.log('延迟后成功获取到录音器音频持续时间:', audioDuration.value);
        return;
      }
      
      // 先尝试从URL中获取持续时间
      const durationFromUrl = getDurationFromFilename(audioUrl.value);
      if (durationFromUrl > 0) {
        audioDuration.value = durationFromUrl;
        console.log('从URL获取并设置持续时间:', audioDuration.value);
      } 
      // 如果有录制时间，则使用录制时间
      else if (recordingTime.value > 0) {
        audioDuration.value = recordingTime.value;
        console.log('使用录制时间作为持续时间:', audioDuration.value);
      }
      // 最后使用默认值
      else if (audioDuration.value === 0) {
        audioDuration.value = 5;
        console.log('使用默认持续时间(5秒)');
      }
    }, 1000);
  }
};

// 音频加载错误
const onAudioError = (error) => {
  console.error('音频加载错误:', error);
  ElMessage.error('音频加载失败，请重试');
};

// 更新播放进度
const updateTime = () => {
  if (!audioPlayer.value) return;
  
  currentTime.value = Math.floor(audioPlayer.value.currentTime);
  
  // 如果持续时间是0或Infinity，但当前时间是有效值，尝试使用当前时间更新持续时间
  if ((audioDuration.value === 0 || audioDuration.value === Infinity) && 
      audioPlayer.value.duration && 
      !isNaN(audioPlayer.value.duration) && 
      isFinite(audioPlayer.value.duration) &&
      audioPlayer.value.duration !== Infinity) {
    audioDuration.value = Math.floor(audioPlayer.value.duration);
    console.log('播放过程中更新音频持续时间:', audioDuration.value);
  }
  
  // 如果播放接近结束但持续时间仍不准确，使用currentTime作为参考
  if (audioDuration.value === 0 || audioDuration.value === Infinity) {
    const currentDuration = Math.floor(audioPlayer.value.currentTime) + 1;
    if (currentDuration > audioDuration.value) {
      audioDuration.value = currentDuration;
      console.log('使用当前播放时间更新持续时间:', audioDuration.value);
    }
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

// 格式化时间
const formatTime = (seconds) => {
  // 确保秒数是有效的数字
  if (seconds === undefined || seconds === null || isNaN(seconds) || !isFinite(seconds)) {
    return '00:00';
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 添加从文件名获取持续时间的函数
const getDurationFromFilename = (audioUrl) => {
  if (!audioUrl) return 0;
  
  // 尝试从URL中提取持续时间参数
  if (audioUrl.includes('duration=')) {
    const match = audioUrl.match(/duration=(\d+)/);
    if (match && match[1]) {
      const extractedDuration = parseInt(match[1]);
      console.log('从URL获取到持续时间:', extractedDuration);
      // 确保提取的持续时间是合理的（大于0且不是异常大的值）
      if (extractedDuration > 0 && extractedDuration < 600) { // 最长10分钟
        return extractedDuration;
      }
    }
  }
  
  // 如果URL中没有持续时间信息，尝试从播放控件获取
  if (audioPlayer.value && audioPlayer.value.duration && 
      !isNaN(audioPlayer.value.duration) && 
      isFinite(audioPlayer.value.duration) && 
      audioPlayer.value.duration !== Infinity) {
    return Math.floor(audioPlayer.value.duration);
  }
  
  // 如果有录制时间，使用录制时间
  if (recordingTime.value > 0) {
    return recordingTime.value;
  }
  
  // 默认返回一个合理的小值
  return 5;
};

// 组件销毁时清理资源
onUnmounted(() => {
  if (recordingTimer) {
    clearInterval(recordingTimer);
  }
  
  if (dotsTimer) {
    clearInterval(dotsTimer);
  }
  
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  
  // 移除网络状态监听器
  window.removeEventListener('online', handleNetworkChange);
  window.removeEventListener('offline', handleNetworkChange);
  
  if (networkCheckTimer) {
    clearInterval(networkCheckTimer);
  }
});
</script>

<style scoped>
.audio-recorder {
  margin: 10px 0;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
  background-color: #f7f9fc;
}

.record-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.recording-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.recording-indicator {
  display: flex;
  gap: 5px;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ccc;
  transition: background-color 0.3s;
}

.indicator-dot.active {
  background-color: #f56c6c;
}

.recording-time {
  font-family: monospace;
  font-weight: bold;
}

.audio-player {
  width: 100%;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.audio-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.audio-duration {
  font-size: 12px;
  color: #606266;
  text-align: right;
  margin-bottom: 4px;
}

.upload-progress-container {
  margin: 15px 0;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.network-speed {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #67c23a;
  color: white;
}

.network-speed.slow {
  background-color: #f56c6c;
}

.network-speed.medium {
  background-color: #e6a23c;
}

.offline-warning {
  margin: 15px 0;
  padding: 10px;
}

.network-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  color: #e6a23c;
  font-size: 14px;
  gap: 5px;
}
</style> 