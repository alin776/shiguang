const { validationResult } = require("express-validator");
const db = require("../config/database");

const submitFeedback = async (req, res) => {
  try {
    const { type, content, contact } = req.body;
    const userId = req.user.id;

    const [result] = await db.execute(
      `INSERT INTO feedback (user_id, type, content, contact)
       VALUES (?, ?, ?, ?)`,
      [userId, type, content, contact]
    );

    res.status(201).json({
      message: "反馈提交成功",
      feedbackId: result.insertId,
    });
  } catch (error) {
    console.error("提交反馈失败:", error);
    res.status(500).json({ message: "提交反馈失败" });
  }
};

const getFeedbacks = async (req, res) => {
  try {
    const [feedbacks] = await db.execute(
      `SELECT f.*, u.username 
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json(feedbacks);
  } catch (error) {
    console.error("获取反馈列表失败:", error);
    res.status(500).json({ message: "获取反馈列表失败" });
  }
};

module.exports = {
  submitFeedback,
  getFeedbacks,
};
