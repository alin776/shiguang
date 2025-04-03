const { validationResult } = require("express-validator");
const db = require("../config/database");

// 获取所有打卡项目
exports.getCheckInItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.execute(
      `SELECT * FROM checkin_items WHERE user_id = ? ORDER BY name`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("获取打卡项目失败:", error);
    res.status(500).json({ message: "获取打卡项目失败" });
  }
};

// 创建打卡项目
exports.createCheckInItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, color } = req.body;
    const userId = req.user.id;

    const [result] = await db.execute(
      `INSERT INTO checkin_items (user_id, name, color) VALUES (?, ?, ?)`,
      [userId, name, color || "#409EFF"]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      color,
      message: "创建成功",
    });
  } catch (error) {
    console.error("创建打卡项目失败:", error);
    res.status(500).json({ message: "创建打卡项目失败" });
  }
};

// 更新打卡项目
exports.updateCheckInItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, color, enabled } = req.body;
    const userId = req.user.id;

    // 详细记录请求信息
    console.log("更新打卡项目详细请求:", {
      id,
      userId,
      name: name + " (类型: " + typeof name + ")",
      color: color + " (类型: " + typeof color + ")",
      enabled: enabled + " (类型: " + typeof enabled + ")",
      requestBody: JSON.stringify(req.body),
    });

    // 确保用户只能更新自己的打卡项目
    const [checkItem] = await db.execute(
      `SELECT * FROM checkin_items WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (checkItem.length === 0) {
      return res.status(404).json({ message: "打卡项目不存在或无权限" });
    }

    // 将 undefined 转换为 null 的安全参数
    const safeUpdate = {};

    // 只处理存在于请求中的字段
    if ("name" in req.body) {
      safeUpdate.name = req.body.name === undefined ? null : req.body.name;
    }

    if ("color" in req.body) {
      safeUpdate.color = req.body.color === undefined ? null : req.body.color;
    }

    if ("enabled" in req.body) {
      // 将enabled转换为0或1
      safeUpdate.enabled = req.body.enabled ? 1 : 0;
    }

    // 如果没有要更新的字段，直接返回成功
    if (Object.keys(safeUpdate).length === 0) {
      return res.json({ message: "无更新内容" });
    }

    // 构建SET子句和参数
    const setClauses = [];
    const queryParams = [];

    Object.entries(safeUpdate).forEach(([key, value]) => {
      setClauses.push(`${key} = ?`);
      queryParams.push(value);
    });

    // 添加WHERE条件的参数
    queryParams.push(id, userId);

    // 构建最终SQL
    const sql = `UPDATE checkin_items SET ${setClauses.join(
      ", "
    )} WHERE id = ? AND user_id = ?`;

    // 最后检查所有参数，确保没有undefined
    for (let i = 0; i < queryParams.length; i++) {
      if (queryParams[i] === undefined) {
        console.error(`参数${i}是undefined，已转换为null`);
        queryParams[i] = null;
      }
    }

    console.log("执行SQL:", sql);
    console.log("参数:", JSON.stringify(queryParams));

    await db.execute(sql, queryParams);

    res.json({ message: "更新成功" });
  } catch (error) {
    console.error("更新打卡项目失败详情:", error.message, error.stack);
    console.error("更新打卡项目失败:", error);
    res.status(500).json({ message: "更新打卡项目失败" });
  }
};

// 删除打卡项目
exports.deleteCheckInItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 确保用户只能删除自己的打卡项目
    const [checkItem] = await db.execute(
      `SELECT * FROM checkin_items WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (checkItem.length === 0) {
      return res.status(404).json({ message: "打卡项目不存在或无权限" });
    }

    await db.execute(`DELETE FROM checkin_items WHERE id = ?`, [id]);

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除打卡项目失败:", error);
    res.status(500).json({ message: "删除打卡项目失败" });
  }
};

// 获取用户打卡记录
exports.getUserCheckIns = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    let query = `
      SELECT c.*, ci.name, ci.color
      FROM checkins c
      JOIN checkin_items ci ON c.item_id = ci.id
      WHERE c.user_id = ?
    `;

    const queryParams = [userId];

    if (year && month) {
      // 添加年月筛选条件
      query += ` AND YEAR(c.date) = ? AND MONTH(c.date) = ?`;
      queryParams.push(year, month);
    }

    const [rows] = await db.execute(query, queryParams);

    res.json(rows);
  } catch (error) {
    console.error("获取用户打卡记录失败:", error);
    res.status(500).json({ message: "获取用户打卡记录失败" });
  }
};

// 打卡
exports.checkIn = async (req, res) => {
  try {
    const { itemId, date } = req.body;
    const userId = req.user.id;

    // 输出请求参数到日志
    console.log("打卡请求详情:", {
      userId,
      itemId: itemId + " (类型: " + typeof itemId + ")",
      date: date + " (类型: " + typeof date + ")",
    });

    // 验证参数
    if (!itemId || isNaN(parseInt(itemId))) {
      return res.status(400).json({ message: "无效的项目ID" });
    }

    // 确保日期是有效的
    let formattedDate;
    try {
      // 尝试标准化日期格式为 YYYY-MM-DD
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error("无效日期");
      }
      formattedDate = dateObj.toISOString().split("T")[0];
    } catch (err) {
      return res.status(400).json({ message: "无效的日期格式" });
    }

    // 确保打卡项目存在且属于该用户
    const [checkItem] = await db.execute(
      `SELECT * FROM checkin_items WHERE id = ? AND user_id = ?`,
      [parseInt(itemId), userId]
    );

    if (checkItem.length === 0) {
      return res.status(404).json({ message: "打卡项目不存在或无权限" });
    }

    // 检查是否已经打卡
    const [existingCheckIn] = await db.execute(
      `SELECT * FROM checkins WHERE user_id = ? AND item_id = ? AND date = ?`,
      [userId, parseInt(itemId), formattedDate]
    );

    if (existingCheckIn.length > 0) {
      return res.status(400).json({ message: "今日已打卡" });
    }

    // 创建打卡记录
    await db.execute(
      `INSERT INTO checkins (user_id, item_id, date) VALUES (?, ?, ?)`,
      [userId, parseInt(itemId), formattedDate]
    );

    // 使用基础SQL查询获取打卡记录，按日期降序排序
    const [rows] = await db.execute(
      `SELECT date FROM checkins WHERE user_id = ? AND item_id = ? ORDER BY date DESC`,
      [userId, parseInt(itemId)]
    );

    // 手动计算连续打卡天数
    let streak = 1; // 今天刚打的卡，起始为1
    let prevDate = new Date(formattedDate);

    for (let i = 0; i < rows.length; i++) {
      const currentDate = new Date(rows[i].date);

      // 跳过今天已经计算过的记录
      if (
        currentDate.toISOString().split("T")[0] ===
        prevDate.toISOString().split("T")[0]
      ) {
        continue;
      }

      // 检查日期是否连续
      const dayDiff = Math.floor(
        (prevDate - currentDate) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        // 日期连续
        streak++;
        prevDate = currentDate;
      } else {
        // 连续中断
        break;
      }
    }

    res.status(201).json({
      message: "打卡成功",
      streak,
    });
  } catch (error) {
    console.error("打卡失败:", error);
    res.status(500).json({ message: "打卡失败" });
  }
};

// 取消打卡
exports.cancelCheckIn = async (req, res) => {
  try {
    const { itemId, date } = req.query;
    const userId = req.user.id;

    // 检查是否已经打卡
    const [existingCheckIn] = await db.execute(
      `SELECT * FROM checkins WHERE user_id = ? AND item_id = ? AND date = ?`,
      [userId, itemId, date]
    );

    if (existingCheckIn.length === 0) {
      return res.status(404).json({ message: "未找到该打卡记录" });
    }

    // 删除打卡记录
    await db.execute(
      `DELETE FROM checkins WHERE user_id = ? AND item_id = ? AND date = ?`,
      [userId, itemId, date]
    );

    res.json({ message: "取消打卡成功" });
  } catch (error) {
    console.error("取消打卡失败:", error);
    res.status(500).json({ message: "取消打卡失败" });
  }
};

// 获取用户打卡连续天数
exports.getUserStreaks = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户的所有打卡项目
    const [items] = await db.execute(
      `SELECT id FROM checkin_items WHERE user_id = ?`,
      [userId]
    );

    const results = [];

    // 对每个项目计算连续打卡天数
    for (const item of items) {
      const [rows] = await db.execute(
        `SELECT date FROM checkins 
         WHERE user_id = ? AND item_id = ? 
         ORDER BY date DESC`,
        [userId, item.id]
      );

      // 计算连续天数
      let streak = 0;
      let prevDate = null;

      for (const row of rows) {
        const currentDate = new Date(row.date);

        if (!prevDate) {
          // 第一条记录
          streak = 1;
          prevDate = currentDate;
          continue;
        }

        // 计算日期差
        const dayDiff = Math.round(
          (prevDate - currentDate) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
          // 连续打卡
          streak++;
          prevDate = currentDate;
        } else {
          // 中断了
          break;
        }
      }

      results.push({
        item_id: item.id,
        streak: streak,
      });
    }

    res.json(results);
  } catch (error) {
    console.error("获取用户连续打卡天数失败:", error);
    res.status(500).json({ message: "获取连续打卡天数失败" });
  }
};
