<template>
  <div class="private-chat-view">
    <div class="header">
      <el-button @click="goBack" text :icon="ArrowLeft" />
      <div class="title">
        {{ chatName }}
        <div class="ephemeral-indicator">
          <el-icon><Lock /></el-icon>
          安全对话 (阅后30秒焚毁)
        </div>
      </div>
    </div>

    <div class="messages-container" ref="messagesContainer" v-loading="loading">
      <div v-if="!privateChatStore.messages || privateChatStore.messages.length === 0" class="empty-chat">
        <el-empty description="暂无消息">
          <template #description>
            <div>
              <p>暂无消息</p>
              <p class="ephemeral-hint">
                <el-icon><Lock /></el-icon>
                安全对话模式已启用，消息将在被阅读后30秒自动删除
              </p>
            </div>
          </template>
        </el-empty>
      </div>

      <div v-else class="messages-list">
        <div
          v-for="(message, index) in orderedMessages"
          :key="message.id"
          class="message-wrapper"
          :class="{ 'own-message': isOwnMessage(message) }"
        >
          <div class="message-date-divider" v-if="shouldShowDateDivider(index)">
            <span>{{ formatDateDivider(message.created_at) }}</span>
          </div>

          <div class="message" :class="{ 'own-message': isOwnMessage(message) }">
            <el-avatar
              v-if="!isOwnMessage(message)"
              :size="36"
              :src="message.sender?.avatar ? getAvatarUrl(message.sender.avatar) : getLocalDefaultAvatarUrl()"
              class="message-avatar"
            />

            <div
              class="message-content"
              :class="[
                { 'self-message': isOwnMessage(message) },
                `message-type-${message.content_type || 'text'}`
              ]"
            >

              <template v-if="message.content_type === 'text' || !message.content_type">
                <p v-if="message.decryptFailed" class="decrypt-failed">
                  <el-icon><Warning /></el-icon>
                  消息无法解密
                </p>
                <p v-else>{{ message.content }}</p>
              </template>

              <template v-else-if="message.content_type === 'image'">
                <el-image
                  :src="message.media_url"
                  :preview-src-list="[message.media_url]"
                  class="message-image"
                  fit="cover"
                  lazy
                />
                <p v-if="message.content && !message.decryptFailed">{{ message.content }}</p>
                <p v-if="message.decryptFailed && message.content_type !== 'image'" class="decrypt-failed">
                  <el-icon><Warning /></el-icon>
                  消息无法解密
                </p>
              </template>

              <div class="message-status">
                <span class="message-time">{{ formatTime(message.created_at) }}</span>
                <el-icon
                  v-if="message.is_read && isOwnMessage(message)"
                  class="read-status"
                  title="已读"
                >
                  <Check />
                </el-icon>
              </div>

              <div class="message-actions" v-if="isOwnMessage(message)">
                <el-dropdown trigger="click" @command="handleMessageAction($event, message)">
                  <el-button type="info" text circle icon="MoreFilled" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="delete">撤回消息</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-container">
      <div class="input-toolbar">
        <el-button
          type="primary"
          text
          :icon="PictureFilled"
          @click="openMediaSelector"
        />
        <div class="security-badge">
          <el-icon><Lock /></el-icon>
          安全对话已启用
        </div>
      </div>

      <div class="input-main">
        <el-input
          v-model="messageText"
          type="textarea"
          :rows="1"
          autosize
          placeholder="输入消息..."
          @keydown.enter.prevent="sendTextMessage"
        />
        <el-button
          type="primary"
          :disabled="!messageText.trim()"
          @click="sendTextMessage"
        >
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft, Setting, Lock, Timer, Check, PictureFilled, MoreFilled, Warning
} from '@element-plus/icons-vue';
import { usePrivateChatStore } from '@/stores/privateChat';
import { useAuthStore } from '@/stores/auth';
import dayjs from 'dayjs';
import { getAvatarUrl, getDefaultAvatarUrl } from '@/utils/imageHelpers';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const route = useRoute();
const router = useRouter();
const privateChatStore = usePrivateChatStore();
const authStore = useAuthStore();

const loading = ref(true);
const messageText = ref('');
const messagesContainer = ref(null);
const showSettingsDialog = ref(false);
const showEphemeralSettings = ref(false);
const expireAfterRead = ref(true);
const expireAfter = ref(30);
const defaultExpireAfterRead = ref(true);
const defaultExpireAfter = ref(30);
const screenshotNotification = ref(true);

// 自动滚动到最新消息的标志
const shouldScrollToBottom = ref(true);

// 消息列表，按时间顺序排序
const orderedMessages = computed(() => {
  if (!privateChatStore.messages || privateChatStore.messages.length === 0) {
    return [];
  }
  return [...privateChatStore.messages].sort((a, b) => {
    return new Date(a.created_at) - new Date(b.created_at);
  });
});

// 会话ID
const chatId = computed(() => route.params.id);

// 会话名称
const chatName = computed(() => {
  if (!privateChatStore.currentChat || !privateChatStore.currentChat.members) {
    return '私聊对话';
  }
  
  const otherMember = privateChatStore.currentChat.members.find(
    m => m.id !== authStore.user.id
  );
  
  return otherMember ? otherMember.username : '私聊对话';
});

// 是否为无痕对话
const isEphemeral = computed(() => {
  return privateChatStore.currentChat?.is_ephemeral || false;
});

// 检测是否为自己发送的消息
const isOwnMessage = (message) => {
  return message.sender_id === authStore.user.id;
};

// 获取消息时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return dayjs(timestamp).format('HH:mm');
};

// 获取消息剩余有效时间
const formatRemainingTime = (message) => {
  if (!message.expire_after || !message.created_at) return '';
  
  const expiryTime = dayjs(message.created_at).add(message.expire_after, 'second');
  const now = dayjs();
  
  if (expiryTime.isBefore(now)) {
    return '已过期';
  }
  
  const diff = expiryTime.diff(now, 'second');
  
  if (diff < 60) {
    return `${diff}秒后过期`;
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟后过期`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时后过期`;
  } else {
    return `${Math.floor(diff / 86400)}天后过期`;
  }
};

// 日期分隔显示
const shouldShowDateDivider = (index) => {
  if (index === 0) return true;
  
  const currentMessage = orderedMessages.value[index];
  const prevMessage = orderedMessages.value[index - 1];
  
  const currentDate = dayjs(currentMessage.created_at).startOf('day');
  const prevDate = dayjs(prevMessage.created_at).startOf('day');
  
  return !currentDate.isSame(prevDate);
};

// 格式化日期分隔
const formatDateDivider = (timestamp) => {
  if (!timestamp) return '';
  
  const date = dayjs(timestamp);
  const now = dayjs();
  
  if (date.isSame(now, 'day')) {
    return '今天';
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天';
  } else if (date.isSame(now, 'year')) {
    return date.format('M月D日');
  } else {
    return date.format('YYYY年M月D日');
  }
};

// 页面初始化
onMounted(async () => {
  // 加载会话详情和消息
  await loadChat();
  
  // 设置监听截图事件
  setupScreenshotDetection();
  
  // 设置应用生命周期监听
  setupAppLifecycleListeners();
  
  // 强制启用安全设置
  expireAfterRead.value = true;
  expireAfter.value = 30;
  defaultExpireAfterRead.value = true;
  defaultExpireAfter.value = 30;
  screenshotNotification.value = true;
});

onBeforeUnmount(() => {
  // 移除事件监听
  document.removeEventListener('keydown', handlePossibleScreenshot);
  
  // 移除应用生命周期监听
  cleanupAppLifecycleListeners();
  
  // 清理所有计时器
  clearAllMessageTimers();
});

// 设置屏幕截图检测（全平台支持）
const setupScreenshotDetection = () => {
  // 桌面端键盘快捷键检测
  document.addEventListener('keydown', handlePossibleScreenshot);
  
  // 移动端特有 - 检测系统截图事件
  if (window.navigator.mediaSession) {
    try {
      // 监听媒体会话状态变化 (可能表示截图)
      window.navigator.mediaSession.setActionHandler('screenshot', () => {
        handleScreenshotDetected();
      });
    } catch (e) {
      console.warn('媒体会话截图检测不可用');
    }
  }
  
  // Android特有 - 可能适用于某些Android设备
  if (window.AndroidInterface && window.AndroidInterface.registerScreenshotCallback) {
    window.AndroidInterface.registerScreenshotCallback(() => {
      handleScreenshotDetected();
    });
  }
  
  // iOS特有 - 可能适用于某些iOS WebView
  if (window.webkit && window.webkit.messageHandlers && 
      window.webkit.messageHandlers.screenshotDetection) {
    window.webkit.messageHandlers.screenshotDetection.postMessage({
      action: 'register'
    });
  }
  
  // 可见性变化检测 - 可能的截图迹象
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // 当应用进入后台，记录时间
      lastHiddenTime.value = new Date();
    } else if (document.visibilityState === 'visible') {
      // 当应用返回前台，如果时间非常短（例如<500ms），可能是截图
      const now = new Date();
      if (lastHiddenTime.value && (now - lastHiddenTime.value) < 500) {
        handleScreenshotDetected();
      }
    }
  });
  
  console.log('已设置截图检测机制');
};

// 处理检测到的截图事件
const handleScreenshotDetected = () => {
  ElMessage.warning({
    message: '检测到可能的屏幕截图！对话内容已通知对方',
    type: 'warning',
    duration: 5000
  });
  
  // 通知服务器和对方
  privateChatStore.handleScreenshot();
};

// 设置应用生命周期监听器
const setupAppLifecycleListeners = () => {
  // 前台/后台切换检测
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 移动端特有 - 应用暂停/恢复
  if (window.cordova) {
    document.addEventListener('pause', handleAppPause, false);
    document.addEventListener('resume', handleAppResume, false);
  }
  
  // React Native特有
  if (window.ReactNativeWebView) {
    window.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'appState') {
        if (data.state === 'active') {
          handleAppResume();
        } else {
          handleAppPause();
        }
      }
    });
  }
  
  console.log('已设置应用生命周期监听');
};

// 清理应用生命周期监听器
const cleanupAppLifecycleListeners = () => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  if (window.cordova) {
    document.removeEventListener('pause', handleAppPause, false);
    document.removeEventListener('resume', handleAppResume, false);
  }
};

// 应用可见性变化处理
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    // 应用进入后台
    console.log('应用进入后台');
    // 立即强制清理敏感数据
    privateChatStore.cleanExpiredMessages();
  } else if (document.visibilityState === 'visible') {
    // 应用返回前台
    console.log('应用返回前台');
    // 刷新消息，可能有些需要删除
    refreshMessages();
  }
};

// 应用暂停处理 (Cordova/移动特有)
const handleAppPause = () => {
  console.log('应用暂停');
  // 立即清理过期消息
  privateChatStore.cleanExpiredMessages();
  // 可以考虑加密内存中的消息
};

// 应用恢复处理 (Cordova/移动特有)
const handleAppResume = () => {
  console.log('应用恢复');
  // 刷新消息状态
  refreshMessages();
};

// 刷新消息，重新检查过期情况
const refreshMessages = async () => {
  try {
    // 清理本地过期消息
    privateChatStore.cleanExpiredMessages();
    
    // 重新获取最新消息
    await privateChatStore.getChatMessages(chatId.value);
  } catch (error) {
    console.error('刷新消息失败:', error);
  }
};

// 清理所有消息计时器
const clearAllMessageTimers = () => {
  if (privateChatStore.messages) {
    privateChatStore.messages.forEach(msg => {
      if (msg._burnTimerId) {
        clearTimeout(msg._burnTimerId);
        delete msg._burnTimerId;
      }
    });
  }
};

// 记录上次应用进入后台的时间（用于截图检测）
const lastHiddenTime = ref(null);

// 监听消息焚毁事件，显示提示
watch(
  () => privateChatStore.messages?.length || 0,
  (newLength, oldLength) => {
    if (oldLength > newLength) {
      // 如果消息数量减少，可能是有消息被焚毁
      ElMessage.info({
        message: '部分消息已被焚毁',
        type: 'info',
        duration: 2000
      });
    }
    
    if (shouldScrollToBottom.value && newLength > 0) {
      scrollToBottom();
    }
  }
);

// 监听消息列表变化，自动滚动到底部
watch(
  () => privateChatStore.messages?.length || 0,
  (newLength) => {
    if (shouldScrollToBottom.value && newLength > 0) {
      scrollToBottom();
    }
  }
);

// 加载会话详情和消息
const loadChat = async () => {
  loading.value = true;
  
  try {
    // 加载会话详情
    try {
      await privateChatStore.getChatById(chatId.value);
    } catch (error) {
      console.error('获取会话详情失败:', error);
      ElMessage.error('获取会话详情失败');
    }
    
    // 尝试加载消息列表，即使会话详情加载失败
    try {
      await privateChatStore.getChatMessages(chatId.value);
    } catch (error) {
      console.error('获取消息列表失败:', error);
      ElMessage.error('获取消息列表失败');
    }
    
    // 将未读消息标记为已读
    if (privateChatStore.messages && privateChatStore.messages.length > 0) {
      const unreadMessages = privateChatStore.messages.filter(
        msg => !msg.is_read && !isOwnMessage(msg)
      );
      
      // 标记消息已读，但不影响主要流程
      if (unreadMessages.length > 0) {
        console.log(`正在标记 ${unreadMessages.length} 条消息为已读`);
        
        for (const message of unreadMessages) {
          try {
            // 最多尝试两次
            try {
              await privateChatStore.markMessageAsRead(message.id);
            } catch (firstError) {
              // 第一次失败后重试一次
              console.warn(`标记消息 ${message.id} 已读失败，正在重试...`);
              await new Promise(resolve => setTimeout(resolve, 500)); // 延迟500ms
              await privateChatStore.markMessageAsRead(message.id);
            }
          } catch (error) {
            console.error(`标记消息 ${message.id} 已读失败:`, error);
            // 本地模拟标记已读，即使服务器请求失败
            const messageIndex = privateChatStore.messages.findIndex(msg => msg.id === message.id);
            if (messageIndex !== -1) {
              privateChatStore.messages[messageIndex].is_read = true;
              privateChatStore.messages[messageIndex].read_at = new Date().toISOString();
            }
          }
        }
      }
    }
    
    // 初始化无痕设置 - 始终使用安全固定值
    expireAfterRead.value = true;
    expireAfter.value = 30;
    
    // 滚动到底部
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('加载会话错误:', error);
    ElMessage.error('加载会话失败');
  } finally {
    loading.value = false;
  }
};

// 返回按钮处理
const goBack = () => {
  router.push('/private-chats');
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 发送文本消息
const sendTextMessage = async () => {
  if (!messageText.value.trim()) {
    ElMessage.warning('请输入消息内容');
    return;
  }
  
  try {
    // 固定安全设置 - 强制阅后即焚
    const options = {
      contentType: 'text',
      expireAfterRead: true,
      expireAfter: null // 设置为null，不使用绝对过期时间
    };
    
    await privateChatStore.sendMessage(chatId.value, messageText.value, options);
    
    // 清空输入框
    messageText.value = '';
    
    // 滚动到底部
    shouldScrollToBottom.value = true;
    scrollToBottom();
  } catch (error) {
    ElMessage.error(error.message || '发送消息失败');
    console.error('发送消息错误:', error);
  }
};

// 处理消息上下文菜单操作
const handleMessageAction = async (action, message) => {
  if (action === 'delete') {
    try {
      await ElMessageBox.confirm('确定要撤回这条消息吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      
      await privateChatStore.deleteMessage(message.id);
      ElMessage.success('消息已撤回');
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('撤回消息失败');
        console.error('撤回消息错误:', error);
      }
    }
  }
};

// 打开媒体选择器（图片/视频上传）
const openMediaSelector = () => {
  // 创建隐藏的文件输入元素
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*'; // 目前只支持图片上传
  fileInput.style.display = 'none';
  
  // 当用户选择文件后处理上传
  fileInput.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      // 检查文件类型和大小
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('目前只支持图片上传');
        return;
      }
      
      // 文件大小限制（5MB）
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.warning('图片大小不能超过5MB');
        return;
      }
      
      // 显示上传中提示
      const loadingInstance = ElMessage.info({
        message: '正在上传图片...',
        duration: 0
      });
      
      try {
        // 创建FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // 上传到服务器
        const authStore = useAuthStore();
        const response = await axios.post(
          `${API_BASE_URL}/api/users/upload/avatar`, // 这里暂时使用头像上传接口
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${authStore.token}`
            }
          }
        );
        
        // 关闭loading
        loadingInstance.close();
        
        // 获取图片URL
        if (!response.data || !response.data.url) {
          throw new Error('上传失败，服务器没有返回图片URL');
        }
        
        // 获取完整的图片URL
        const imageUrl = `${API_BASE_URL}${response.data.url}`;
        console.log('上传图片成功，URL:', imageUrl);
        
        // 固定安全设置 - 强制阅后即焚
        const options = {
          contentType: 'image',
          mediaUrl: imageUrl, // 使用服务器返回的URL
          expireAfterRead: true,
          expireAfter: null // 设置为null，不使用绝对过期时间
        };
        
        // 发送图片消息
        await privateChatStore.sendMessage(chatId.value, '', options);
        
        // 滚动到底部
        shouldScrollToBottom.value = true;
        scrollToBottom();
        
        ElMessage.success('图片发送成功');
      } catch (uploadError) {
        loadingInstance.close();
        ElMessage.error(uploadError.message || '图片上传失败');
        console.error('图片上传错误:', uploadError);
      }
    } catch (error) {
      ElMessage.error('处理图片失败');
      console.error('处理图片错误:', error);
    }
  };
  
  // 模拟点击文件选择器
  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
};

// 模拟处理可能的截图操作（演示用途）
const handlePossibleScreenshot = (e) => {
  // 检测常见的截图快捷键组合（仅作演示）
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '4') {
    // 强制启用截图通知
    privateChatStore.handleScreenshot();
    ElMessage.warning('检测到屏幕截图操作，已通知对方');
  }
};

// 获取默认头像URL
const getLocalDefaultAvatarUrl = () => {
  // 使用从工具函数导入的默认头像
  return getDefaultAvatarUrl();
};
</script>

<style scoped>
.private-chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.header {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
}

.ephemeral-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #409eff;
  margin-top: 5px;
}

.ephemeral-indicator .el-icon {
  margin-right: 4px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.empty-chat {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ephemeral-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.ephemeral-hint .el-icon {
  margin-right: 5px;
  color: #409eff;
}

.messages-list {
  display: flex;
  flex-direction: column;
}

.message-wrapper {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}

.message-date-divider {
  margin: 10px 0;
  text-align: center;
}

.message-date-divider span {
  background-color: #f2f3f5;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  color: #909399;
}

.message {
  display: flex;
  align-items: flex-start;
  max-width: 70%;
}

.message.own-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 8px;
}

.message-content {
  position: relative;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  word-break: break-word;
  text-align: left;
}

.message-content p {
  margin-block-start: 0em;
  margin-block-end: 0em;
  text-align: left;
}

.message-content.self-message {
  background-color: #ecf5ff;
}

.message-timer {
  position: absolute;
  top: -18px;
  left: 0;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
}

.message-timer .el-icon {
  margin-right: 3px;
  font-size: 10px;
}

.message-type-image .message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 6px;
  margin-bottom: 5px;
}

.message-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.message-time {
  margin-right: 4px;
}

.read-status {
  color: #67c23a;
  font-size: 12px;
}

.message-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: none;
}

.message-content:hover .message-actions {
  display: block;
}

.input-container {
  padding: 10px 15px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

.input-toolbar {
  display: flex;
  margin-bottom: 10px;
}

.ephemeral-settings {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.input-main {
  display: flex;
  align-items: flex-end;
}

.input-main .el-input {
  margin-right: 10px;
}

.chat-settings .setting-section {
  margin-bottom: 20px;
}

.setting-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.decrypt-failed {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
}

.decrypt-failed .el-icon {
  margin-right: 5px;
}

.security-badge {
  display: flex;
  align-items: center;
  background-color: #ecf5ff;
  color: #409eff;
  border-radius: 16px;
  padding: 2px 10px;
  font-size: 12px;
  margin-left: auto;
}

.security-badge .el-icon {
  margin-right: 4px;
}
</style> 