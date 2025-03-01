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
    const { title, startTime, endTime, color, reminder, description } = req.body;
    const userId = req.user.id;

    console.log("接收到的事件数据:", req.body);

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

    const descValue = description === "NULL" ? null : description;
    
    console.log("即将插入数据库的值:", {
      userId,
      title,
      description: descValue,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      color: color || "#409EFF",
      reminder: reminder || false
    });

    try {
      const [result] = await db.execute(
        `INSERT INTO events 
         (user_id, title, description, start_time, end_time, color, reminder) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          title,
          descValue,
          formattedStartTime,
          formattedEndTime,
          color || "#409EFF",
          reminder || false,
        ]
      );
      
      console.log("数据库插入结果:", result);
      
      if (!result || !result.insertId) {
        throw new Error("数据库插入失败，没有返回insertId");
      }

      res.status(201).json({
        message: "创建成功",
        event: {
          id: result.insertId,
          title,
          description: descValue,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          color,
          reminder,
          userId,
        },
      });
    } catch (dbError) {
      console.error("数据库操作失败:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("创建事件错误详情:", error);
    console.error("创建事件失败:", error);
    res.status(500).json({ message: "创建事件失败" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { title, start_time, end_time, color, reminder, description, startTime, endTime } = req.body;
    
    console.log("更新事件数据:", req.body);
    console.log("更新事件ID:", eventId);

    // 使用 dayjs 处理日期时间格式
    const formatDateTime = (dateTimeStr) => {
      return dayjs(dateTimeStr).format("YYYY-MM-DD HH:mm:ss");
    };
    
    // 兼容snake_case和camelCase两种命名格式
    const startTimeValue = start_time || startTime;
    const endTimeValue = end_time || endTime;

    // 验证时间
    if (dayjs(endTimeValue).isBefore(dayjs(startTimeValue))) {
      return res.status(400).json({ message: "结束时间不能早于开始时间" });
    }

    // 处理描述字段
    const descriptionValue = description === "NULL" ? null : description;
    
    console.log("即将更新数据库的值:", {
      title,
      description: descriptionValue,
      startTime: formatDateTime(startTimeValue),
      endTime: formatDateTime(endTimeValue),
      color,
      reminder
    });

    try {
      // 更新事件，添加description字段
      const [updateResult] = await db.execute(
        `UPDATE events 
         SET title = ?, description = ?, start_time = ?, end_time = ?, color = ?, reminder = ?
         WHERE id = ?`,
        [
          title,
          descriptionValue,
          formatDateTime(startTimeValue),
          formatDateTime(endTimeValue),
          color,
          reminder,
          eventId,
        ]
      );
      
      console.log("数据库更新结果:", updateResult);
      
      if (!updateResult || updateResult.affectedRows === 0) {
        console.warn("数据库更新未影响任何行，事件可能不存在");
      }

      // 获取更新后的事件
      const [updatedEvent] = await db.execute(
        `SELECT * FROM events WHERE id = ?`,
        [eventId]
      );

      if (updatedEvent.length === 0) {
        return res.status(404).json({ message: "事件不存在" });
      }
      
      console.log("更新后的事件数据:", updatedEvent[0]);

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
    } catch (dbError) {
      console.error("数据库操作失败:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("更新事件失败:", error);
    res.status(500).json({ message: "更新事件失败" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;  // 从路由参数获取事件ID
    const userId = req.user.id;     // 从认证中间件获取用户ID

    // 检查参数
    if (!eventId || !userId) {
      return res.status(400).json({ message: "缺少必要参数" });
    }

    const [result] = await db.execute(
      `DELETE FROM events WHERE id = ? AND user_id = ?`,
      [eventId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "事件不存在或无权限删除" });
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
