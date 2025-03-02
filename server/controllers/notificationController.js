const db = require("../config/database");

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
