const db = require('../config/database');

// 创建私聊会话
exports.createPrivateChat = async (members, isEphemeral = false) => {
  try {
    const conn = await db.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // 创建会话
      const [chatResult] = await conn.execute(
        'INSERT INTO private_chats (is_ephemeral) VALUES (?)',
        [isEphemeral]
      );
      
      const chatId = chatResult.insertId;
      
      // 添加成员到会话
      for (const userId of members) {
        await conn.execute(
          'INSERT INTO private_chat_members (chat_id, user_id) VALUES (?, ?)',
          [chatId, userId]
        );
      }
      
      await conn.commit();
      return chatId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('创建私聊会话失败:', error);
    throw error;
  }
};

// 获取用户的私聊会话列表
exports.getUserChats = async (userId) => {
  try {
    const [chats] = await db.execute(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM ephemeral_messages m 
         WHERE m.chat_id = c.id 
         AND m.is_deleted = 0
         AND m.is_read = 0
         AND m.sender_id != ?) as unread_count,
        (SELECT JSON_ARRAYAGG(u.id) 
         FROM private_chat_members pcm 
         JOIN users u ON pcm.user_id = u.id 
         WHERE pcm.chat_id = c.id AND pcm.user_id != ?) as members,
        IFNULL((SELECT COUNT(*) > 0 FROM pinned_chats pc 
         WHERE pc.chat_id = c.id AND pc.user_id = ?), 0) as is_pinned
      FROM private_chats c
      JOIN private_chat_members pcm ON c.id = pcm.chat_id
      WHERE pcm.user_id = ?
      ORDER BY is_pinned DESC, c.updated_at DESC`,
      [userId, userId, userId, userId]
    );
    
    return chats;
  } catch (error) {
    console.error('获取用户私聊列表失败:', error);
    throw error;
  }
};

// 获取单个私聊会话信息
exports.getChatById = async (chatId, userId) => {
  try {
    // 获取会话信息
    const [chats] = await db.execute(
      `SELECT c.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', u.id,
            'username', u.username,
            'avatar', u.avatar
          )
        ) 
        FROM private_chat_members pcm 
        JOIN users u ON pcm.user_id = u.id 
        WHERE pcm.chat_id = c.id) as members
      FROM private_chats c
      JOIN private_chat_members pcm ON c.id = pcm.chat_id
      WHERE c.id = ? AND pcm.user_id = ?`,
      [chatId, userId]
    );
    
    if (chats.length === 0) {
      return null;
    }
    
    const chat = chats[0];
    
    // 转换成员数据
    try {
      if (chat.members) {
        // 检查members是否已经是对象
        if (typeof chat.members === 'string') {
          chat.members = JSON.parse(chat.members);
        } else if (typeof chat.members === 'object') {
          // 已经是对象，不需要解析
        } else {
          chat.members = [];
        }
      } else {
        chat.members = [];
      }
    } catch (e) {
      console.error('解析会话成员数据失败:', e);
      chat.members = [];
    }
    
    return chat;
  } catch (error) {
    console.error('获取私聊会话失败:', error);
    throw error;
  }
};

// 发送无痕消息
exports.sendEphemeralMessage = async (chatId, senderId, content, options = {}) => {
  try {
    const {
      contentType = 'text',
      mediaUrl = null,
      encryptionKey,
      expireAfter = null, // 过期时间(秒)
      expireAfterRead = false // 是否阅后即焚
    } = options;
    
    // 确保密钥有效
    if (!encryptionKey || typeof encryptionKey !== 'string') {
      console.error('无效的加密密钥:', encryptionKey);
      throw new Error('无效的加密密钥');
    }
    
    console.log('保存消息:', {
      chatId,
      senderId,
      contentType,
      contentLength: content ? content.length : 0,
      keyLength: encryptionKey.length,
      keyPreview: encryptionKey.substring(0, 5) + '...',
      expireAfter,
      expireAfterRead
    });
    
    const [result] = await db.execute(
      `INSERT INTO ephemeral_messages (
        chat_id, sender_id, content, content_type, media_url, 
        encryption_key, expire_after, expire_after_read
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [chatId, senderId, content, contentType, mediaUrl, encryptionKey, expireAfter, expireAfterRead]
    );
    
    // 更新会话的最后消息预览和时间
    await db.execute(
      `UPDATE private_chats SET 
        last_message_preview = ?, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      ['[无痕消息]', chatId]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('发送无痕消息失败:', error);
    throw error;
  }
};

// 获取会话消息列表
exports.getChatMessages = async (chatId, userId, limit = 20, offset = 0) => {
  try {
    // 验证用户是否在会话中
    const [members] = await db.execute(
      'SELECT user_id FROM private_chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );
    
    if (members.length === 0) {
      throw new Error('无权访问此会话');
    }
    
    // 获取消息列表
    const [messages] = await db.execute(
      `SELECT m.*, 
        JSON_OBJECT(
          'id', u.id,
          'username', u.username,
          'avatar', u.avatar
        ) as sender
      FROM ephemeral_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ? AND m.is_deleted = 0
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?`,
      [chatId, limit, offset]
    );
    
    // 处理消息数据
    return messages.map(message => {
      if (message.sender) {
        try {
          // 检查sender是否已经是对象
          if (typeof message.sender === 'string') {
            message.sender = JSON.parse(message.sender);
          }
          // 如果已经是对象，不需要解析
        } catch (e) {
          console.error('解析消息发送者数据失败:', e);
          message.sender = { id: message.sender_id, username: '未知用户', avatar: null };
        }
      }
      
      // 检查消息是否已过期
      if (message.expire_after && message.created_at) {
        const expiryTime = new Date(message.created_at);
        expiryTime.setSeconds(expiryTime.getSeconds() + message.expire_after);
        
        if (new Date() > expiryTime) {
          // 消息已过期，标记为删除
          db.execute(
            'UPDATE ephemeral_messages SET is_deleted = 1 WHERE id = ?',
            [message.id]
          );
          return null;
        }
      }
      
      return message;
    }).filter(Boolean); // 移除已过期消息
  } catch (error) {
    console.error('获取会话消息失败:', error);
    throw error;
  }
};

// 标记消息已读
exports.markMessageAsRead = async (messageId, userId) => {
  try {
    const conn = await db.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // 获取消息信息
      const [messages] = await conn.execute(
        'SELECT * FROM ephemeral_messages WHERE id = ?',
        [messageId]
      );
      
      if (messages.length === 0) {
        throw new Error('消息不存在');
      }
      
      const message = messages[0];
      
      // 验证用户是否有权限
      const [members] = await conn.execute(
        'SELECT user_id FROM private_chat_members WHERE chat_id = ? AND user_id = ?',
        [message.chat_id, userId]
      );
      
      if (members.length === 0) {
        throw new Error('无权访问此消息');
      }
      
      // 更新消息读取状态
      await conn.execute(
        'UPDATE ephemeral_messages SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?',
        [messageId]
      );
      
      // 如果消息是阅后即焚，计算删除时间并记录
      if (message.expire_after_read) {
        // 如果有过期时间，使用过期时间；否则默认为阅读后5分钟删除
        const deleteDelay = message.expire_after || 300; // 默认5分钟
        
        // 计算未来的删除时间
        const willDeleteAt = new Date();
        willDeleteAt.setSeconds(willDeleteAt.getSeconds() + deleteDelay);
        
        // 记录阅读状态和预计删除时间
        await conn.execute(
          'INSERT INTO ephemeral_message_reads (message_id, user_id, will_delete_at) VALUES (?, ?, ?)',
          [messageId, userId, willDeleteAt]
        );
      }
      
      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('标记消息已读失败:', error);
    throw error;
  }
};

// 删除或撤回消息
exports.deleteMessage = async (messageId, userId) => {
  try {
    // 验证用户是否有权删除
    const [messages] = await db.execute(
      'SELECT * FROM ephemeral_messages WHERE id = ? AND sender_id = ?',
      [messageId, userId]
    );
    
    if (messages.length === 0) {
      throw new Error('无权删除此消息或消息不存在');
    }
    
    // 标记消息为已删除
    await db.execute(
      'UPDATE ephemeral_messages SET is_deleted = 1 WHERE id = ?',
      [messageId]
    );
    
    return true;
  } catch (error) {
    console.error('删除消息失败:', error);
    throw error;
  }
};

// 清理过期消息（系统定时任务调用）
exports.cleanupExpiredMessages = async () => {
  try {
    const now = new Date();
    const conn = await db.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // 获取符合删除条件的消息ID和媒体URL
      const [messagesToDelete] = await conn.execute(`
        SELECT id, media_url FROM ephemeral_messages
        WHERE (
          (expire_after_read = 1 AND is_read = 1 AND read_at IS NOT NULL AND DATE_ADD(read_at, INTERVAL 30 SECOND) < NOW())
          OR
          (expire_after IS NOT NULL AND DATE_ADD(created_at, INTERVAL expire_after SECOND) < NOW())
          OR
          (is_deleted = 1)
        )
      `);
      
      console.log(`找到 ${messagesToDelete.length} 条过期消息需要物理删除`);
      
      // 存储媒体文件路径用于删除
      const mediaFiles = messagesToDelete
        .filter(msg => msg.media_url)
        .map(msg => msg.media_url);
      
      const messageIds = messagesToDelete.map(msg => msg.id);
      
      // 如果有消息需要删除
      if (messageIds.length > 0) {
        // 分批处理，避免一次删除过多导致性能问题
        const batchSize = 100;
        let deletedCount = 0;
        
        for (let i = 0; i < messageIds.length; i += batchSize) {
          const batch = messageIds.slice(i, Math.min(i + batchSize, messageIds.length));
          const placeholders = batch.map(() => '?').join(',');
          
          const [deleteResult] = await conn.execute(
            `DELETE FROM ephemeral_messages WHERE id IN (${placeholders})`,
            batch
          );
          
          deletedCount += deleteResult.affectedRows;
        }
        
        console.log(`已物理删除 ${deletedCount} 条过期消息`);
      }
      
      await conn.commit();
      
      // 在事务外删除媒体文件
      if (mediaFiles.length > 0) {
        const fs = require('fs');
        const path = require('path');
        
        mediaFiles.forEach(mediaUrl => {
          try {
            const mediaPath = path.join(__dirname, '../uploads', path.basename(mediaUrl));
            if (fs.existsSync(mediaPath)) {
              fs.unlinkSync(mediaPath);
              console.log(`已删除媒体文件: ${mediaPath}`);
            }
          } catch (error) {
            console.error(`删除媒体文件失败: ${mediaUrl}`, error);
          }
        });
        
        console.log(`尝试删除 ${mediaFiles.length} 个媒体文件`);
      }
      
      return {
        deletedCount: messagesToDelete.length,
        mediaFilesCount: mediaFiles.length
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('清理过期消息失败:', error);
    throw error;
  }
};

// 添加安全措施：清理孤立的聊天会话和过期媒体文件
exports.cleanupDatabaseArtifacts = async () => {
  try {
    const conn = await db.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // 1. 清理没有消息的空会话（创建超过7天）
      const [deleteEmptyChats] = await conn.execute(`
        DELETE pc FROM private_chats pc
        WHERE NOT EXISTS (
          SELECT 1 FROM ephemeral_messages m WHERE m.chat_id = pc.id
        )
        AND pc.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      
      // 2. 清理孤立的会话成员（属于已删除会话的成员）
      const [deleteOrphanedMembers] = await conn.execute(`
        DELETE pcm FROM private_chat_members pcm
        WHERE NOT EXISTS (
          SELECT 1 FROM private_chats pc WHERE pc.id = pcm.chat_id
        )
      `);
      
      // 3. 冗余检查：确保标记为删除的消息没有内容
      const [securePurgedMessages] = await conn.execute(`
        UPDATE ephemeral_messages
        SET content = NULL, encryption_key = NULL, media_url = NULL
        WHERE is_deleted = 1 
        AND (content IS NOT NULL OR encryption_key IS NOT NULL OR media_url IS NOT NULL)
      `);
      
      await conn.commit();
      
      return {
        emptyChatsRemoved: deleteEmptyChats.affectedRows,
        orphanedMembersRemoved: deleteOrphanedMembers.affectedRows,
        securedPurgedMessages: securePurgedMessages.affectedRows
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('清理数据库工件失败:', error);
    throw error;
  }
}; 