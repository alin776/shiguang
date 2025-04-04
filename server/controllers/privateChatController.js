const { validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('../config/database');
const privateChatModel = require('../models/privateChat');

// 创建新的私聊会话
exports.createChat = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { targetUserId, isEphemeral = false } = req.body;
    const currentUserId = req.user.id;

    // 检查目标用户是否存在
    const [users] = await db.execute('SELECT id FROM users WHERE id = ?', [targetUserId]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查会话是否已存在
    const [existingChats] = await db.execute(
      `SELECT c.id FROM private_chats c
       JOIN private_chat_members m1 ON c.id = m1.chat_id AND m1.user_id = ?
       JOIN private_chat_members m2 ON c.id = m2.chat_id AND m2.user_id = ?
       WHERE (SELECT COUNT(*) FROM private_chat_members WHERE chat_id = c.id) = 2`,
      [currentUserId, targetUserId]
    );

    // 如果会话已存在，直接返回会话ID
    if (existingChats.length > 0) {
      const chatId = existingChats[0].id;
      return res.status(200).json({ 
        message: '会话已存在', 
        chatId, 
        isNew: false 
      });
    }

    // 创建新会话
    const members = [currentUserId, targetUserId];
    const chatId = await privateChatModel.createPrivateChat(members, isEphemeral);

    return res.status(201).json({ 
      message: '会话创建成功', 
      chatId, 
      isNew: true 
    });
  } catch (error) {
    console.error('创建私聊会话失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户的私聊会话列表
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取用户的所有会话
    const chats = await privateChatModel.getUserChats(userId);
    
    // 获取会话成员的详细信息
    const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
      if (!chat.members) return chat;
      
      // 获取除当前用户外的其他用户信息
      const memberIds = JSON.parse(chat.members);
      if (!memberIds || memberIds.length === 0) return chat;
      
      // 获取用户详情
      const [users] = await db.execute(
        `SELECT id, username, avatar FROM users WHERE id IN (?)`,
        [memberIds]
      );
      
      return {
        ...chat,
        members: users
      };
    }));
    
    return res.json({ chats: chatsWithDetails });
  } catch (error) {
    console.error('获取私聊列表失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个会话详情
exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    // 获取会话信息
    const chat = await privateChatModel.getChatById(chatId, userId);
    
    if (!chat) {
      return res.status(404).json({ message: '会话不存在或无权访问' });
    }
    
    return res.json({ chat });
  } catch (error) {
    console.error('获取会话详情失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 发送无痕消息
exports.sendMessage = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('验证错误:', errors.array());
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    const { chatId } = req.params;
    const { 
      content, 
      contentType = 'text',
      mediaUrl = null,
      encryptionKey = null, // 客户端提供的加密密钥
      expireAfter = null,  // 消息过期时间(秒)
      expireAfterRead = false // 是否阅后即焚
    } = req.body;
    
    console.log('发送消息请求:', {
      chatId,
      contentType,
      contentLength: content ? content.length : 0,
      hasEncryptionKey: !!encryptionKey,
      keyLength: encryptionKey ? encryptionKey.length : 0,
      mediaUrl,
      expireAfter,
      expireAfterRead
    });
    
    // 检查必填字段
    if (!content && contentType === 'text') {
      console.error('消息内容为空');
      return res.status(400).json({ message: '消息内容不能为空' });
    }
    
    // 检查加密密钥
    if (!encryptionKey) {
      console.error('未提供加密密钥');
      return res.status(400).json({ message: '未提供加密密钥' });
    }
    
    // 检查有效性
    if (expireAfter !== null && (isNaN(parseInt(expireAfter)) || parseInt(expireAfter) <= 0)) {
      console.error('过期时间无效:', expireAfter);
      return res.status(400).json({ message: '消息过期时间无效' });
    }
    
    const senderId = req.user.id;
    
    // 验证用户是否在会话中
    const [members] = await db.execute(
      'SELECT user_id FROM private_chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, senderId]
    );
    
    if (members.length === 0) {
      console.error('用户不在会话中:', { chatId, senderId });
      return res.status(403).json({ message: '无权访问此会话' });
    }
    
    try {
      // 发送消息，使用客户端提供的密钥
      const messageId = await privateChatModel.sendEphemeralMessage(
        chatId, 
        senderId, 
        content, 
        {
          contentType,
          mediaUrl,
          encryptionKey,
          expireAfter: expireAfter !== null ? parseInt(expireAfter) : null,
          expireAfterRead: Boolean(expireAfterRead)
        }
      );
      
      return res.status(201).json({ 
        message: '消息发送成功', 
        messageId,
        encryptionKey // 返回客户端提供的加密密钥
      });
    } catch (err) {
      console.error('发送消息时出错:', err);
      return res.status(500).json({ message: '发送消息失败' });
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取会话消息列表
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    // 获取消息
    const messages = await privateChatModel.getChatMessages(chatId, userId, limit, offset);
    
    return res.json({ messages });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    
    if (error.message === '无权访问此会话') {
      return res.status(403).json({ message: error.message });
    }
    
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 标记消息已读
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    // 标记已读
    await privateChatModel.markMessageAsRead(messageId, userId);
    
    return res.json({ message: '标记已读成功' });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    
    if (error.message === '消息不存在' || error.message === '无权访问此消息') {
      return res.status(404).json({ message: error.message });
    }
    
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 删除或撤回消息
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    // 删除消息
    await privateChatModel.deleteMessage(messageId, userId);
    
    return res.json({ message: '消息删除成功' });
  } catch (error) {
    console.error('删除消息失败:', error);
    
    if (error.message === '无权删除此消息或消息不存在') {
      return res.status(403).json({ message: error.message });
    }
    
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 清理过期消息（系统定时任务）
exports.cleanupExpiredMessages = async (req, res) => {
  try {
    // 验证管理员权限
    if (!req.user.is_admin) {
      return res.status(403).json({ message: '无权执行此操作' });
    }
    
    // 清理过期消息
    const result = await privateChatModel.cleanupExpiredMessages();
    
    return res.json({
      message: '清理过期消息成功',
      ...result
    });
  } catch (error) {
    console.error('清理过期消息失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 焚毁/永久删除消息（客户端主动请求）
exports.burnMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    console.log(`尝试焚毁消息 ID: ${messageId}, 用户 ID: ${userId}`);
    
    // 检查消息是否存在且用户是否有权限
    const [messages] = await db.execute(
      `SELECT * FROM ephemeral_messages 
       WHERE id = ? AND (sender_id = ? OR 
       chat_id IN (SELECT chat_id FROM private_chat_members WHERE user_id = ?))`,
      [messageId, userId, userId]
    );
    
    if (messages.length === 0) {
      console.log(`消息 ${messageId} 不存在或用户 ${userId} 无权访问`);
      return res.status(404).json({ message: '消息不存在或无权访问' });
    }
    
    const message = messages[0];
    console.log(`找到消息:`, { 
      id: message.id, 
      sender_id: message.sender_id,
      chat_id: message.chat_id,
      is_read: message.is_read,
      expire_after_read: message.expire_after_read,
      expire_after: message.expire_after
    });
    
    // 检查是否符合焚毁条件
    let canBurn = false;
    
    // 情况1: 阅后即焚且已读
    if (message.expire_after_read && message.is_read) {
      canBurn = true;
      console.log('满足条件: 阅后即焚且已读');
    }
    
    // 情况2: 有过期时间
    if (message.expire_after) {
      const createTime = new Date(message.created_at);
      const expireTime = new Date(createTime.getTime() + message.expire_after * 1000);
      if (new Date() > expireTime) {
        canBurn = true;
        console.log('满足条件: 消息已过期');
      }
    }
    
    // 情况3: 发送者永远可以删除自己的消息
    if (message.sender_id === userId) {
      canBurn = true;
      console.log('满足条件: 发送者删除自己的消息');
    }
    
    if (!canBurn) {
      console.log(`消息 ${messageId} 不符合焚毁条件`);
      return res.status(403).json({ message: '此消息不符合焚毁条件' });
    }
    
    try {
      // 物理删除消息
      console.log(`执行删除消息: ${messageId}`);
      const [deleteResult] = await db.execute(
        'DELETE FROM ephemeral_messages WHERE id = ?',
        [messageId]
      );
      
      console.log(`删除结果:`, deleteResult);
      
      // 可以添加额外的媒体文件删除逻辑
      if (message.media_url) {
        // 实际实现媒体文件删除
        const fs = require('fs');
        const path = require('path');
        const mediaPath = path.join(__dirname, '../uploads', path.basename(message.media_url));
        
        try {
          if (fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
            console.log(`已删除媒体文件: ${mediaPath}`);
          }
        } catch (fsError) {
          console.error('删除媒体文件失败:', fsError);
          // 继续执行，即使媒体删除失败
        }
      }
      
      return res.json({ 
        message: '消息已永久删除', 
        success: true 
      });
    } catch (deleteError) {
      console.error('删除消息数据库操作失败:', deleteError);
      return res.status(500).json({ 
        message: '删除消息失败',
        error: deleteError.message
      });
    }
  } catch (error) {
    console.error('焚毁消息失败:', error);
    return res.status(500).json({ 
      message: '服务器错误',
      error: error.message
    });
  }
}; 