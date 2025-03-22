const db = require("../config/database");
const { validationResult } = require('express-validator');

// 创建通知
const createNotification = async ({
  userId,
  type,
  content,
  sourceId,
  sourceType,
  actorId,
  relatedId = null,
}) => {
  try {
    await db.execute(
      `INSERT INTO notifications 
       (user_id, type, content, source_id, source_type, actor_id, related_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, content, sourceId, sourceType, actorId, relatedId]
    );
  } catch (error) {
    console.error("创建通知失败:", error);
  }
};

// 获取用户的通知列表
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [notifications] = await db.execute(
      `SELECT 
        n.*,
        u.username as actor_name,
        u.avatar as actor_avatar,
        CASE 
          WHEN n.source_type = 'post' THEN (SELECT p.title FROM posts p WHERE p.id = n.source_id)
          ELSE NULL
        END as source_title,
        CASE
          WHEN n.type = 'comment' THEN (
            SELECT c.content FROM comments c 
            WHERE c.id = n.related_id
          )
          WHEN n.type = 'reply' THEN (
            SELECT cr.content FROM comment_replies cr 
            WHERE cr.id = n.related_id
          )
          ELSE NULL
        END as detail_content
      FROM notifications n
      LEFT JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC`,
      [userId]
    );

    // 获取未读通知数
    const [unreadCount] = await db.execute(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );

    res.json({
      notifications: notifications.map((notification) => {
        // 根据通知类型构建增强的内容
        let enhancedContent = notification.content;
        
        // 添加详细内容（如果有）
        if ((notification.type === 'comment' || notification.type === 'reply') && notification.detail_content) {
          enhancedContent += `: "${notification.detail_content}"`;
        }
        
        return {
          ...notification,
          content: enhancedContent,
          actor: notification.actor_id
            ? {
                id: notification.actor_id,
                username: notification.actor_name,
                avatar: notification.actor_avatar,
              }
            : null,
        };
      }),
      unreadCount: unreadCount[0].count,
    });
  } catch (error) {
    console.error("获取通知列表失败:", error);
    res.status(500).json({ message: "获取通知列表失败" });
  }
};

// 标记通知为已读
exports.markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user.id;

    // 检查参数
    if (
      !notificationIds ||
      !Array.isArray(notificationIds) ||
      !notificationIds.length
    ) {
      return res.status(400).json({ message: "参数错误" });
    }

    // 将数组转换为逗号分隔的字符串
    const idList = notificationIds.join(",");

    await db.execute(
      `UPDATE notifications SET is_read = TRUE WHERE id IN (${idList}) AND user_id = ?`,
      [userId]
    );

    // 获取更新后的未读通知数
    const [unreadCount] = await db.execute(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );

    res.json({
      message: "标记成功",
      unreadCount: unreadCount[0].count,
    });
  } catch (error) {
    console.error("标记通知已读失败:", error);
    res.status(500).json({ message: "标记失败" });
  }
};

// 标记所有通知为已读
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.execute(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
      [userId]
    );

    // 获取更新后的未读通知数
    const [unreadCount] = await db.execute(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );

    res.json({
      message: "标记成功",
      unreadCount: unreadCount[0].count,
    });
  } catch (error) {
    console.error("标记所有通知已读失败:", error);
    res.status(500).json({ message: "标记失败" });
  }
};

// 根据类型获取通知
exports.getNotificationsByType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;
    
    // 验证类型是否有效
    const validTypes = ['like', 'comment', 'reply', 'system', 'follow'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "无效的通知类型" });
    }
    
    const [notifications] = await db.execute(
      `SELECT 
        n.*,
        u.username as actor_name,
        u.avatar as actor_avatar,
        CASE 
          WHEN n.source_type = 'post' THEN (SELECT p.title FROM posts p WHERE p.id = n.source_id)
          ELSE NULL
        END as source_title,
        CASE
          WHEN n.type = 'comment' THEN (
            SELECT c.content FROM comments c 
            WHERE c.id = n.related_id
          )
          WHEN n.type = 'reply' THEN (
            SELECT cr.content FROM comment_replies cr 
            WHERE cr.id = n.related_id
          )
          ELSE NULL
        END as detail_content
      FROM notifications n
      LEFT JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ? AND n.type = ?
      ORDER BY n.created_at DESC`,
      [userId, type]
    );

    // 获取该类型的未读通知数
    const [unreadCount] = await db.execute(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND type = ? AND is_read = FALSE",
      [userId, type]
    );

    res.json({
      notifications: notifications.map((notification) => {
        // 根据通知类型构建增强的内容
        let enhancedContent = notification.content;
        
        // 添加详细内容（如果有）
        if ((notification.type === 'comment' || notification.type === 'reply') && notification.detail_content) {
          enhancedContent += `: "${notification.detail_content}"`;
        }
        
        return {
          ...notification,
          content: enhancedContent,
          actor: notification.actor_id
            ? {
                id: notification.actor_id,
                username: notification.actor_name,
                avatar: notification.actor_avatar,
              }
            : null,
        };
      }),
      unreadCount: unreadCount[0].count,
    });
  } catch (error) {
    console.error("获取通知列表失败:", error);
    res.status(500).json({ message: "获取通知列表失败" });
  }
};

// 标记指定类型的所有通知为已读
exports.markAllAsReadByType = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.id;
    
    // 验证类型
    if (!['like', 'comment', 'system'].includes(type)) {
      return res.status(400).json({ message: '无效的通知类型' });
    }
    
    // 标记通知为已读
    await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND type = ? AND is_read = 0',
      [userId, type]
    );
    
    // 获取更新后的未读通知数量
    const [unreadResult] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    
    return res.json({
      message: '已将所有该类型通知标记为已读',
      unreadCount: unreadResult[0].count
    });
  } catch (error) {
    console.error('标记通知已读失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 发送系统通知
exports.sendSystemNotification = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    // 检查是否为管理员
    if (!req.user.is_admin) {
      return res.status(403).json({ message: '只有管理员才能发送系统通知' });
    }
    
    const { content, userIds } = req.body;
    const actorId = req.user.id;
    
    let result;
    
    // 如果指定了特定用户，则只给这些用户发送通知
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // 检查用户是否存在
      const placeholders = userIds.map(() => '?').join(',');
      const [users] = await db.execute(
        `SELECT id FROM users WHERE id IN (${placeholders})`,
        userIds
      );
      
      if (users.length === 0) {
        return res.status(404).json({ message: '找不到指定的用户' });
      }
      
      // 给每个用户发送通知
      const values = users.map(user => [user.id, actorId, content, 'system']);
      const placeholdersStr = values.map(() => '(?, ?, ?, ?)').join(',');
      
      [result] = await db.execute(
        `INSERT INTO notifications (user_id, actor_id, content, type) VALUES ${placeholdersStr}`,
        values.flat()
      );
    } else {
      // 给所有用户发送通知
      [result] = await db.execute(
        'INSERT INTO notifications (user_id, actor_id, content, type) SELECT id, ?, ?, ? FROM users',
        [actorId, content, 'system']
      );
    }
    
    return res.status(201).json({
      message: '系统通知发送成功',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('发送系统通知失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 导出创建通知方法供其他控制器使用
exports.createNotification = createNotification;

exports.deleteNotification = async (req, res) => {
  try {
    await db.execute(`DELETE FROM notifications WHERE id = ? AND user_id = ?`, [
      req.params.id,
      req.userId,
    ]);
    res.json({ message: "删除成功" });
  } catch (error) {
    res.status(500).json({ message: "删除失败" });
  }
};
