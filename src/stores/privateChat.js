import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from './auth';
import CryptoJS from 'crypto-js';

export const usePrivateChatStore = defineStore('privateChat', {
  state: () => ({
    chats: [],
    currentChat: null,
    messages: [],
    loading: false,
    error: null,
    unreadCount: 0,
    isConnected: false // WebSocket连接状态
  }),
  
  getters: {
    chatsList: (state) => state.chats,
    currentChatMessages: (state) => state.messages,
    hasUnreadMessages: (state) => state.unreadCount > 0
  },
  
  actions: {
    // 初始化WebSocket连接
    initWebSocket() {
      // 实际项目中需要实现WebSocket连接逻辑
      this.isConnected = true;
    },
    
    // 创建私聊会话
    async createChat(targetUserId, isEphemeral = true) {
      this.loading = true;
      this.error = null;
      
      try {
        const authStore = useAuthStore();
        const response = await axios.post(
          `${API_BASE_URL}/api/private-chats`,
          { targetUserId, isEphemeral: true },
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        // 如果是新会话，添加到会话列表
        if (response.data.isNew) {
          await this.getChats(); // 重新获取所有会话
        }
        
        return response.data.chatId;
      } catch (error) {
        this.error = error.response?.data?.message || '创建会话失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 获取用户的所有私聊会话
    async getChats() {
      this.loading = true;
      this.error = null;
      
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/private-chats`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        this.chats = response.data.chats || [];
        
        // 计算未读消息总数
        this.unreadCount = this.chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
        
        return this.chats;
      } catch (error) {
        this.error = error.response?.data?.message || '获取会话列表失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 获取单个会话详情
    async getChatById(chatId) {
      this.loading = true;
      this.error = null;
      
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/private-chats/${chatId}`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        this.currentChat = response.data.chat;
        return this.currentChat;
      } catch (error) {
        this.error = error.response?.data?.message || '获取会话详情失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 获取会话消息列表
    async getChatMessages(chatId, limit = 20, offset = 0) {
      this.loading = true;
      this.error = null;
      
      try {
        const authStore = useAuthStore();
        const response = await axios.get(
          `${API_BASE_URL}/api/private-chats/${chatId}/messages`,
          {
            params: { limit, offset },
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        // 增强安全性：立即清理已过期消息
        this.cleanExpiredMessages();
        
        // 解密消息内容
        const decryptedMessages = response.data.messages.map(message => {
          // 移动端安全检查：检查消息是否应该焚毁
          if (this.shouldMessageBeBurned(message)) {
            // 客户端主动焚毁消息，即使服务器未及时处理
            this.burnMessage(message.id);
            return {
              ...message,
              is_deleted: true,
              content: '(此消息已焚毁)',
              decryptFailed: true
            };
          }
          
          if (message.content && message.encryption_key) {
            try {
              // 确保输入格式正确
              let encryptedContent = message.content;
              let encryptionKey = message.encryption_key;
              
              console.log('尝试解密消息:', {
                messageId: message.id,
                keyLength: encryptionKey.length
              });
              
              // 解密消息内容，尝试多种密钥格式
              let decrypted = '';
              
              // 尝试多种解密方式
              const decryptionMethods = [
                // 1. 直接使用密钥
                () => CryptoJS.AES.decrypt(encryptedContent, encryptionKey).toString(CryptoJS.enc.Utf8),
                
                // 2. 尝试将密钥作为Hex格式解析
                () => {
                  if (encryptionKey.length === 32) { // 可能是Hex格式
                    try {
                      const hexKey = CryptoJS.enc.Hex.parse(encryptionKey);
                      return CryptoJS.AES.decrypt(encryptedContent, hexKey).toString(CryptoJS.enc.Utf8);
                    } catch (e) {
                      return '';
                    }
                  }
                  return '';
                },
                
                // 3. 特殊处理：将Hex字符串转换为Utf8
                () => {
                  if (encryptionKey.length === 32) {
                    try {
                      return CryptoJS.AES.decrypt(
                        encryptedContent,
                        CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Hex.parse(encryptionKey))
                      ).toString(CryptoJS.enc.Utf8);
                    } catch (e) {
                      return '';
                    }
                  }
                  return '';
                }
              ];
              
              // 尝试所有解密方法
              for (const method of decryptionMethods) {
                try {
                  const result = method();
                  if (result) {
                    decrypted = result;
                    break;
                  }
                } catch (e) {
                  // 继续尝试下一种方法
                }
              }
              
              // 确保解密成功
              if (decrypted) {
                console.log('消息解密成功:', message.id);
                
                // 移动端优化：如果消息已读且设置了阅后即焚，启动倒计时焚毁
                if (message.is_read && message.expire_after_read) {
                  this.scheduleMessageBurn(message);
                }
                
                return { ...message, content: decrypted };
              } else {
                console.warn('消息解密结果为空:', message.id);
                return {
                  ...message,
                  decryptFailed: true,
                  content: '(无法解密的消息)'
                };
              }
            } catch (e) {
              console.error('解密消息失败:', e);
              // 返回原始加密消息，但添加解密失败标记
              return { 
                ...message, 
                decryptFailed: true,
                content: '(无法解密的消息)' 
              };
            }
          }
          return message;
        });
        
        // 过滤已删除的消息
        this.messages = decryptedMessages.filter(msg => !msg.is_deleted);
        return this.messages;
      } catch (error) {
        this.error = error.response?.data?.message || '获取消息失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 检查消息是否应该焚毁（客户端逻辑）
    shouldMessageBeBurned(message) {
      if (!message) return false;
      
      // 消息已被标记为删除
      if (message.is_deleted) return true;
      
      const now = new Date();
      
      // 情况1: 阅后即焚 + 已读 + 已过30秒
      if (message.expire_after_read && message.is_read && message.read_at) {
        const readTime = new Date(message.read_at);
        const expireTime = new Date(readTime.getTime() + 30 * 1000); // 30秒后
        return now > expireTime;
      }
      
      // 情况2: 指定过期时间
      if (message.expire_after && message.created_at) {
        const createTime = new Date(message.created_at);
        const expireTime = new Date(createTime.getTime() + message.expire_after * 1000);
        return now > expireTime;
      }
      
      return false;
    },
    
    // 安排消息焚毁（客户端计时器）
    scheduleMessageBurn(message) {
      if (!message || !message.id || message.is_deleted) return;
      
      // 检查是否已存在计时器，避免重复
      if (message._burnTimerId) {
        clearTimeout(message._burnTimerId);
      }
      
      // 计算剩余时间
      let timeoutMs = 30 * 1000; // 默认30秒
      
      if (message.expire_after_read && message.is_read && message.read_at) {
        const readTime = new Date(message.read_at);
        const expireTime = new Date(readTime.getTime() + 30 * 1000);
        const now = new Date();
        timeoutMs = Math.max(0, expireTime.getTime() - now.getTime());
      }
      
      // 设置焚毁计时器
      if (timeoutMs > 0) {
        message._burnTimerId = setTimeout(() => {
          this.burnMessage(message.id);
        }, timeoutMs);
        
        console.log(`消息 ${message.id} 将在 ${timeoutMs/1000} 秒后焚毁`);
      } else {
        // 如果已经到期，立即焚毁
        this.burnMessage(message.id);
      }
    },
    
    // 执行焚毁消息（客户端处理）
    async burnMessage(messageId) {
      try {
        // 找到消息
        const msgIndex = this.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;
        
        // 在UI中标记为已焚毁
        this.messages[msgIndex].is_deleted = true;
        this.messages[msgIndex].content = '(此消息已焚毁)';
        this.messages[msgIndex].decryptFailed = true;
        
        // 从显示列表中移除
        this.messages = this.messages.filter(m => m.id !== messageId);
        
        // 通知服务器删除（如果在线）
        try {
          const authStore = useAuthStore();
          await axios.delete(
            `${API_BASE_URL}/api/private-chats/messages/${messageId}/burn`,
            {
              headers: { Authorization: `Bearer ${authStore.token}` }
            }
          );
          console.log(`服务器已删除消息 ${messageId}`);
        } catch (e) {
          // 即使服务器请求失败，客户端仍然已删除消息
          console.warn(`无法通知服务器删除消息 ${messageId}，但客户端已处理`, e);
        }
      } catch (error) {
        console.error('焚毁消息失败:', error);
      }
    },
    
    // 清理所有已过期消息
    cleanExpiredMessages() {
      if (!this.messages || this.messages.length === 0) return;
      
      // 查找所有应该焚毁的消息
      const expiredMessageIds = this.messages
        .filter(msg => this.shouldMessageBeBurned(msg))
        .map(msg => msg.id);
      
      // 焚毁每条过期消息
      expiredMessageIds.forEach(id => {
        this.burnMessage(id);
      });
      
      if (expiredMessageIds.length > 0) {
        console.log(`已清理 ${expiredMessageIds.length} 条过期消息`);
      }
    },
    
    // 标记消息已读 - 增强阅后即焚逻辑
    async markMessageAsRead(messageId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.post(
          `${API_BASE_URL}/api/private-chats/messages/${messageId}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        // 更新本地消息状态
        const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          // 更新消息状态
          this.messages[messageIndex].is_read = true;
          this.messages[messageIndex].read_at = new Date().toISOString();
          
          // 移动端优化：如果是阅后即焚消息，立即设置焚毁计时器
          if (this.messages[messageIndex].expire_after_read) {
            this.scheduleMessageBurn(this.messages[messageIndex]);
          }
        }
        
        // 更新未读消息计数
        await this.getChats();
        
        return response.data;
      } catch (error) {
        console.error('标记消息已读失败:', error);
        
        // 即使服务器请求失败，客户端仍更新状态
        const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          this.messages[messageIndex].is_read = true;
          this.messages[messageIndex].read_at = new Date().toISOString();
          
          // 移动端优化：如果是阅后即焚消息，仍然设置焚毁计时器
          if (this.messages[messageIndex].expire_after_read) {
            this.scheduleMessageBurn(this.messages[messageIndex]);
          }
        }
        
        throw error;
      }
    },
    
    // 发送无痕消息
    async sendMessage(chatId, content, options = {}) {
      this.loading = true;
      this.error = null;
      
      try {
        const authStore = useAuthStore();
        // 保留内容类型和媒体URL，但强制覆盖安全设置
        const {
          contentType = 'text',
          mediaUrl = null,
        } = options;
        
        // 根据消息类型进行验证
        if (contentType === 'text') {
          // 文本消息必须有内容
          if (!content || content.trim() === '') {
            throw new Error('消息内容不能为空');
          }
        } else if (contentType === 'image') {
          // 图片消息必须有mediaUrl
          if (!mediaUrl) {
            throw new Error('图片URL不能为空');
          }
          // 图片消息可以没有文本内容
        }
        
        // 生成临时加密密钥 - 使用字符串而非WordArray对象
        const cryptoKey = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
        
        console.log('生成密钥:', {
          keyLength: cryptoKey.length,
          key: cryptoKey.substring(0, 5) + '...' // 仅显示一部分密钥以保护安全
        });
        
        // 加密消息内容 - 使用简单字符串作为密钥
        let encryptedContent;
        try {
          // 如果是文本消息，加密文本内容
          if (contentType === 'text') {
            encryptedContent = CryptoJS.AES.encrypt(content, cryptoKey).toString();
          } else {
            // 对于图片消息，内容可以为空，但我们仍加密一个空字符串，保持一致性
            encryptedContent = CryptoJS.AES.encrypt(content || '', cryptoKey).toString();
          }
        } catch (encryptError) {
          console.error('加密消息失败:', encryptError);
          throw new Error('加密消息失败');
        }
        
        const requestData = {
          content: encryptedContent, 
          contentType,
          mediaUrl: mediaUrl || null,
          encryptionKey: cryptoKey, // 显式传递加密密钥
          expireAfterRead: true, // 强制启用阅后即焚
          expireAfter: null // 设置为null，不使用绝对过期时间
        };
        
        console.log('发送消息(安全模式):', {
          ...requestData,
          contentType,
          hasMediaUrl: !!mediaUrl,
          contentLength: encryptedContent.length,
          keyLength: cryptoKey.length
        });
        
        const response = await axios.post(
          `${API_BASE_URL}/api/private-chats/${chatId}/messages`,
          requestData,
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        // 从服务器获取消息ID和服务器生成的加密密钥
        const { messageId, encryptionKey } = response.data;
        
        // 优先使用新消息，重新获取消息列表
        await this.getChatMessages(chatId);
        
        return { messageId, encryptionKey };
      } catch (error) {
        console.error('发送消息错误:', error);
        this.error = error.response?.data?.message || '发送消息失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 删除/撤回消息
    async deleteMessage(messageId) {
      try {
        const authStore = useAuthStore();
        const response = await axios.delete(
          `${API_BASE_URL}/api/private-chats/messages/${messageId}`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        
        // 从本地消息列表中移除该消息
        this.messages = this.messages.filter(msg => msg.id !== messageId);
        
        return response.data;
      } catch (error) {
        console.error('删除消息失败:', error);
        throw error;
      }
    },
    
    // 检测并处理截图事件（模拟功能）
    handleScreenshot() {
      // 在实际应用中，可以通过监听某些事件或使用浏览器API来检测截图
      console.log('检测到截图操作');
      
      // 如果当前有会话，可以发送通知
      if (this.currentChat && this.currentChat.id) {
        // 向其他会话成员发送截图通知的逻辑
        // 这里只是示例，实际实现需要通过WebSocket或其他方式发送通知
      }
    },
    
    // 清除当前会话数据
    clearCurrentChat() {
      this.currentChat = null;
      this.messages = [];
    },
    
    // 重置整个store
    reset() {
      this.chats = [];
      this.currentChat = null;
      this.messages = [];
      this.loading = false;
      this.error = null;
      this.unreadCount = 0;
      this.isConnected = false;
    }
  }
}); 