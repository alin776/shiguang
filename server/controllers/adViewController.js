const db = require("../config/database");

// 获取用户广告观看数据
exports.getAdViewData = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 检查今日是否有观看记录
    const [rows] = await db.execute(
      `SELECT * FROM ad_view_data WHERE user_id = ? AND DATE(view_date) = ?`,
      [userId, today]
    );

    if (rows.length > 0) {
      // 返回已存在的记录
      res.status(200).json({
        success: true,
        data: {
          count: rows[0].view_count,
          date: today
        }
      });
    } else {
      // 没有找到记录
      res.status(200).json({
        success: true,
        data: {
          count: 0,
          date: today
        }
      });
    }
  } catch (error) {
    console.error("获取广告观看数据失败:", error);
    res.status(500).json({ 
      success: false, 
      message: "获取广告观看数据失败", 
      error: error.message 
    });
  }
};

// 更新用户广告观看数据
exports.updateAdViewData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { count } = req.body;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (count === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "缺少必要参数" 
      });
    }

    // 检查今日是否有观看记录
    const [rows] = await db.execute(
      `SELECT * FROM ad_view_data WHERE user_id = ? AND DATE(view_date) = ?`,
      [userId, today]
    );

    if (rows.length > 0) {
      // 更新现有记录
      await db.execute(
        `UPDATE ad_view_data SET view_count = ? WHERE user_id = ? AND DATE(view_date) = ?`,
        [count, userId, today]
      );
    } else {
      // 创建新记录
      await db.execute(
        `INSERT INTO ad_view_data (user_id, view_count, view_date) VALUES (?, ?, ?)`,
        [userId, count, today]
      );
    }

    res.status(200).json({
      success: true,
      message: "广告观看数据已更新",
      data: {
        count: count,
        date: today
      }
    });
  } catch (error) {
    console.error("更新广告观看数据失败:", error);
    res.status(500).json({ 
      success: false, 
      message: "更新广告观看数据失败", 
      error: error.message 
    });
  }
}; 