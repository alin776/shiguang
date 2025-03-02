const { validationResult } = require("express-validator");
const db = require("../config/database");

const submitFeedback = async (req, res) => {
  try {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, content, contact } = req.body;
    const userId = req.user.id;

    // 验证必填字段
    if (!content) {
      return res.status(400).json({ message: "反馈内容不能为空" });
    }

    // 插入反馈
    const [result] = await db.execute(
      `INSERT INTO feedback (user_id, type, content, contact, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [userId, type || '功能建议', content, contact || null]
    );

    // 获取新插入的反馈详情
    const [newFeedback] = await db.execute(
      `SELECT f.*, u.username 
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "反馈提交成功",
      feedback: newFeedback[0]
    });
  } catch (error) {
    console.error("提交反馈失败:", error);
    res.status(500).json({ message: "提交反馈失败" });
  }
};

const getFeedbacks = async (req, res) => {
  try {
    // 添加分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 获取总数
    const [total] = await db.execute(
      'SELECT COUNT(*) as total FROM feedback WHERE user_id = ?',
      [req.user.id]
    );

    // 获取反馈列表
    const [feedbacks] = await db.execute(
      `SELECT 
        f.*,
        u.username,
        u.avatar
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    // 处理返回数据
    const processedFeedbacks = feedbacks.map(feedback => ({
      ...feedback,
      created_at: new Date(feedback.created_at).toISOString(),
      avatar: feedback.avatar ? `/uploads/avatars/${feedback.avatar}` : null
    }));

    res.json({
      feedbacks: processedFeedbacks,
      pagination: {
        total: total[0].total,
        current_page: page,
        per_page: limit,
        total_pages: Math.ceil(total[0].total / limit)
      }
    });
  } catch (error) {
    console.error("获取反馈列表失败:", error);
    res.status(500).json({ message: "获取反馈列表失败" });
  }
};

module.exports = {
  submitFeedback,
  getFeedbacks,
};