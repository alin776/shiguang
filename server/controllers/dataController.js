const { validationResult } = require("express-validator");
const db = require("../config/database");
const fs = require("fs").promises;
const path = require("path");

exports.backupData = async (req, res) => {
  try {
    // 获取用户的所有数据
    const [events] = await db.execute(
      "SELECT * FROM events WHERE user_id = ?",
      [req.userId]
    );

    const [posts] = await db.execute("SELECT * FROM posts WHERE user_id = ?", [
      req.userId,
    ]);

    const [comments] = await db.execute(
      "SELECT * FROM comments WHERE user_id = ?",
      [req.userId]
    );

    const [feedback] = await db.execute(
      "SELECT * FROM feedback WHERE user_id = ?",
      [req.userId]
    );

    const userData = {
      events,
      posts,
      comments,
      feedback,
      backupDate: new Date().toISOString(),
    };

    // 创建备份文件
    const backupDir = path.join(__dirname, "../backups");
    await fs.mkdir(backupDir, { recursive: true });

    const fileName = `backup_${req.userId}_${Date.now()}.json`;
    const filePath = path.join(backupDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(userData, null, 2));

    // 记录备份历史
    const [result] = await db.execute(
      "INSERT INTO backup_history (user_id, file_name) VALUES (?, ?)",
      [req.userId, fileName]
    );

    res.json({
      message: "数据备份成功",
      backupId: result.insertId,
      fileName,
    });
  } catch (error) {
    console.error("数据备份错误:", error);
    res.status(500).json({ message: "数据备份失败" });
  }
};

exports.restoreData = async (req, res) => {
  try {
    const { backupId } = req.body;

    // 获取备份文件信息
    const [backups] = await db.execute(
      "SELECT * FROM backup_history WHERE id = ? AND user_id = ?",
      [backupId, req.userId]
    );

    if (backups.length === 0) {
      return res.status(404).json({ message: "备份文件不存在" });
    }

    const filePath = path.join(__dirname, "../backups", backups[0].file_name);

    // 读取备份文件
    const backupData = JSON.parse(await fs.readFile(filePath, "utf8"));

    // 开始事务
    await db.execute("START TRANSACTION");

    try {
      // 删除现有数据
      await db.execute("DELETE FROM events WHERE user_id = ?", [req.userId]);
      await db.execute("DELETE FROM posts WHERE user_id = ?", [req.userId]);
      await db.execute("DELETE FROM comments WHERE user_id = ?", [req.userId]);
      await db.execute("DELETE FROM feedback WHERE user_id = ?", [req.userId]);

      // 恢复数据
      for (const event of backupData.events) {
        await db.execute(
          `INSERT INTO events (user_id, title, description, start_time, end_time, 
           color, reminder, reminder_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.userId,
            event.title,
            event.description,
            event.start_time,
            event.end_time,
            event.color,
            event.reminder,
            event.reminder_time,
          ]
        );
      }

      // 恢复其他数据...

      await db.execute("COMMIT");
      res.json({ message: "数据恢复成功" });
    } catch (error) {
      await db.execute("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("数据恢复错误:", error);
    res.status(500).json({ message: "数据恢复失败" });
  }
};

exports.syncData = async (req, res) => {
  try {
    const { deviceId, syncToken, data } = req.body;

    // 获取上次同步时间
    const [lastSync] = await db.execute(
      "SELECT last_sync FROM device_sync WHERE user_id = ? AND device_id = ?",
      [req.userId, deviceId]
    );

    const lastSyncTime = lastSync.length > 0 ? lastSync[0].last_sync : null;

    // 获取服务器端更新的数据
    const [serverUpdates] = await db.execute(
      `SELECT * FROM events 
       WHERE user_id = ? AND updated_at > ?`,
      [req.userId, lastSyncTime || new Date(0)]
    );

    // 更新本地数据到服务器
    if (data && data.events) {
      for (const event of data.events) {
        if (event.id) {
          // 更新现有事件
          await db.execute(
            `UPDATE events SET title = ?, description = ?, start_time = ?, 
             end_time = ?, color = ?, reminder = ?, reminder_time = ? 
             WHERE id = ? AND user_id = ?`,
            [
              event.title,
              event.description,
              event.start_time,
              event.end_time,
              event.color,
              event.reminder,
              event.reminder_time,
              event.id,
              req.userId,
            ]
          );
        } else {
          // 创建新事件
          await db.execute(
            `INSERT INTO events (user_id, title, description, start_time, 
             end_time, color, reminder, reminder_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.userId,
              event.title,
              event.description,
              event.start_time,
              event.end_time,
              event.color,
              event.reminder,
              event.reminder_time,
            ]
          );
        }
      }
    }

    // 更新同步时间
    await db.execute(
      `INSERT INTO device_sync (user_id, device_id, last_sync) 
       VALUES (?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE last_sync = NOW()`,
      [req.userId, deviceId]
    );

    res.json({
      message: "数据同步成功",
      serverUpdates,
      syncToken: Date.now().toString(),
    });
  } catch (error) {
    console.error("数据同步错误:", error);
    res.status(500).json({ message: "数据同步失败" });
  }
};
