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

// 管理员获取所有反馈
const getAdminFeedbacks = async (req, res) => {
  try {
    // 添加分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 处理筛选条件
    const search = req.query.search || '';
    const status = req.query.status || '';
    const sort = req.query.sort || 'latest';
    
    // 构建查询条件
    let whereClause = '1=1';
    const queryParams = [];
    
    if (search) {
      whereClause += ' AND (f.content LIKE ? OR u.username LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      whereClause += ' AND f.status = ?';
      queryParams.push(status);
    }
    
    // 确定排序方式
    let orderBy;
    switch (sort) {
      case 'oldest':
        orderBy = 'f.created_at ASC';
        break;
      case 'latest':
      default:
        orderBy = 'f.created_at DESC';
        break;
    }

    // 获取总数
    const [total] = await db.execute(
      `SELECT COUNT(*) as total FROM feedback f 
       LEFT JOIN users u ON f.user_id = u.id
       WHERE ${whereClause}`,
      [...queryParams]
    );

    // 获取反馈列表
    const [feedbacks] = await db.execute(
      `SELECT 
        f.*,
        u.username,
        u.avatar
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // 处理返回数据
    const processedFeedbacks = feedbacks.map(feedback => ({
      ...feedback,
      created_at: new Date(feedback.created_at).toISOString(),
      reply_time: feedback.reply_time ? new Date(feedback.reply_time).toISOString() : null,
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

// 获取单个反馈详情
const getFeedbackById = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    
    const [feedback] = await db.execute(
      `SELECT f.*, u.username, u.avatar 
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.id = ?`,
      [feedbackId]
    );
    
    if (feedback.length === 0) {
      return res.status(404).json({ message: "反馈不存在" });
    }
    
    // 处理数据格式
    const processedFeedback = {
      ...feedback[0],
      created_at: new Date(feedback[0].created_at).toISOString(),
      reply_time: feedback[0].reply_time ? new Date(feedback[0].reply_time).toISOString() : null,
      avatar: feedback[0].avatar ? `/uploads/avatars/${feedback[0].avatar}` : null
    };
    
    res.json(processedFeedback);
  } catch (error) {
    console.error("获取反馈详情失败:", error);
    res.status(500).json({ message: "获取反馈详情失败" });
  }
};

// 回复反馈
const replyFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const { reply } = req.body;
    
    if (!reply) {
      return res.status(400).json({ message: "回复内容不能为空" });
    }
    
    // 检查反馈是否存在
    const [existingFeedback] = await db.execute(
      "SELECT * FROM feedback WHERE id = ?",
      [feedbackId]
    );
    
    if (existingFeedback.length === 0) {
      return res.status(404).json({ message: "反馈不存在" });
    }
    
    const adminId = req.admin.id;
    const replyTime = new Date();
    
    // 更新反馈
    await db.execute(
      `UPDATE feedback 
       SET reply = ?, reply_time = ?, reply_by = ?, status = 'replied'
       WHERE id = ?`,
      [reply, replyTime, adminId, feedbackId]
    );
    
    // 获取更新后的反馈
    const [updatedFeedback] = await db.execute(
      `SELECT f.*, u.username, u.avatar, a.username as admin_username
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       LEFT JOIN admins a ON f.reply_by = a.id
       WHERE f.id = ?`,
      [feedbackId]
    );
    
    // 处理数据格式
    const processedFeedback = {
      ...updatedFeedback[0],
      created_at: new Date(updatedFeedback[0].created_at).toISOString(),
      reply_time: updatedFeedback[0].reply_time ? new Date(updatedFeedback[0].reply_time).toISOString() : null,
      avatar: updatedFeedback[0].avatar ? `/uploads/avatars/${updatedFeedback[0].avatar}` : null
    };
    
    res.json({
      message: "回复成功",
      feedback: processedFeedback
    });
  } catch (error) {
    console.error("回复反馈失败:", error);
    res.status(500).json({ message: "回复反馈失败" });
  }
};

// 更新反馈状态
const updateFeedbackStatus = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const { status } = req.body;
    
    if (!status || !['pending', 'processing', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({ message: "无效的状态值" });
    }
    
    // 检查反馈是否存在
    const [existingFeedback] = await db.execute(
      "SELECT * FROM feedback WHERE id = ?",
      [feedbackId]
    );
    
    if (existingFeedback.length === 0) {
      return res.status(404).json({ message: "反馈不存在" });
    }
    
    // 更新状态
    await db.execute(
      "UPDATE feedback SET status = ? WHERE id = ?",
      [status, feedbackId]
    );
    
    res.json({
      message: "状态更新成功",
      status
    });
  } catch (error) {
    console.error("更新反馈状态失败:", error);
    res.status(500).json({ message: "更新反馈状态失败" });
  }
};

// 删除反馈
const deleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    
    // 检查反馈是否存在
    const [existingFeedback] = await db.execute(
      "SELECT * FROM feedback WHERE id = ?",
      [feedbackId]
    );
    
    if (existingFeedback.length === 0) {
      return res.status(404).json({ message: "反馈不存在" });
    }
    
    // 删除反馈
    await db.execute("DELETE FROM feedback WHERE id = ?", [feedbackId]);
    
    res.json({ message: "反馈已删除" });
  } catch (error) {
    console.error("删除反馈失败:", error);
    res.status(500).json({ message: "删除反馈失败" });
  }
};

module.exports = {
  submitFeedback,
  getFeedbacks,
  getAdminFeedbacks,
  getFeedbackById,
  replyFeedback,
  updateFeedbackStatus,
  deleteFeedback
};