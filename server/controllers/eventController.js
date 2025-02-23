const { validationResult } = require("express-validator");
const db = require("../config/database");
const dayjs = require("dayjs");

exports.getEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // 获取指定日期范围内的事件
    const [events] = await db.execute(
      `SELECT * FROM events 
       WHERE user_id = ? 
       AND ((start_time BETWEEN ? AND ?) 
       OR (end_time BETWEEN ? AND ?)
       OR (start_time <= ? AND end_time >= ?))
       ORDER BY start_time ASC`,
      [userId, startDate, endDate, startDate, endDate, startDate, endDate]
    );

    res.json({ events });
  } catch (error) {
    console.error("获取事件列表失败:", error);
    res.status(500).json({ message: "获取事件列表失败" });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, startTime, endTime, color, reminder } = req.body;
    const userId = req.user.id;

    // 验证必要字段
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    // 格式化日期时间
    const formattedStartTime = dayjs(startTime).format("YYYY-MM-DD HH:mm:ss");
    const formattedEndTime = dayjs(endTime).format("YYYY-MM-DD HH:mm:ss");

    // 验证时间
    if (dayjs(formattedEndTime).isBefore(dayjs(formattedStartTime))) {
      return res.status(400).json({ message: "结束时间不能早于开始时间" });
    }

    const [result] = await db.execute(
      `INSERT INTO events 
       (user_id, title, description, start_time, end_time, color, reminder) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        null,
        formattedStartTime,
        formattedEndTime,
        color || "#409EFF",
        reminder || false,
      ]
    );

    res.status(201).json({
      message: "创建成功",
      event: {
        id: result.insertId,
        title,
        description: null,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        color,
        reminder,
        userId,
      },
    });
  } catch (error) {
    console.error("创建事件错误详情:", error);
    console.error("创建事件失败:", error);
    res.status(500).json({ message: "创建事件失败" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { title, start_time, end_time, color, reminder } = req.body;

    // 使用 dayjs 处理日期时间格式
    const formatDateTime = (dateTimeStr) => {
      return dayjs(dateTimeStr).format("YYYY-MM-DD HH:mm:ss");
    };

    // 验证时间
    if (dayjs(end_time).isBefore(dayjs(start_time))) {
      return res.status(400).json({ message: "结束时间不能早于开始时间" });
    }

    // 更新事件
    await db.execute(
      `UPDATE events 
       SET title = ?, start_time = ?, end_time = ?, color = ?, reminder = ?
       WHERE id = ?`,
      [
        title,
        formatDateTime(start_time),
        formatDateTime(end_time),
        color,
        reminder,
        eventId,
      ]
    );

    // 获取更新后的事件
    const [updatedEvent] = await db.execute(
      `SELECT * FROM events WHERE id = ?`,
      [eventId]
    );

    if (updatedEvent.length === 0) {
      return res.status(404).json({ message: "事件不存在" });
    }

    // 转换返回的日期格式
    const event = {
      ...updatedEvent[0],
      start_time: dayjs(updatedEvent[0].start_time).toISOString(),
      end_time: dayjs(updatedEvent[0].end_time).toISOString(),
    };

    res.json({
      message: "更新成功",
      event,
    });
  } catch (error) {
    console.error("更新事件失败:", error);
    res.status(500).json({ message: "更新事件失败" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const [result] = await db.execute(
      `DELETE FROM events WHERE id = ? AND user_id = ?`,
      [eventId, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "事件不存在" });
    }

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除事件错误:", error);
    res.status(500).json({ message: "删除事件失败" });
  }
};

exports.shareEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { platform } = req.body;

    // 检查事件是否属于当前用户
    const [events] = await db.execute(
      "SELECT * FROM events WHERE id = ? AND user_id = ?",
      [eventId, req.userId]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: "事件不存在或无权限" });
    }

    // TODO: 实现具体的分享逻辑
    res.json({ message: "事件分享成功" });
  } catch (error) {
    console.error("分享事件错误:", error);
    res.status(500).json({ message: "分享事件失败" });
  }
};
