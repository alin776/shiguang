const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const feedbackController = require('../controllers/feedbackController');
const { adminAuth, requireSuperAdmin } = require('../middleware/adminAuth');
const { body } = require("express-validator");

// 管理员登录（公开接口）
router.post('/login', adminController.login);

// 以下路由需要管理员权限
router.use(adminAuth);

// 获取管理员个人信息
router.get('/profile', adminController.getProfile);

// 获取仪表盘数据
router.get('/dashboard', adminController.getDashboardData);

// 小记管理
router.get('/notes', adminController.getAllNotes);
router.post('/notes', adminController.createNote);
router.delete('/notes/:id', adminController.deleteNote);

// 反馈管理路由
router.get('/feedbacks', feedbackController.getAdminFeedbacks);
router.get('/feedbacks/:id', feedbackController.getFeedbackById);
router.post('/feedbacks/:id/reply', feedbackController.replyFeedback);
router.put('/feedbacks/:id/status', feedbackController.updateFeedbackStatus);
router.delete('/feedbacks/:id', feedbackController.deleteFeedback);

// 以下路由需要超级管理员权限
router.use(requireSuperAdmin);

// 管理员管理 - 修改路由路径避免冲突
router.post('/admins', adminController.createAdmin);
router.get('/admins', adminController.getAllAdmins);

// 任务管理
router.get("/tasks", adminController.getTasks);
router.get("/tasks/:id", adminController.getTaskById);
router.post("/tasks", adminController.createTask);
router.put("/tasks/:id", adminController.updateTask);
router.delete("/tasks/:id", adminController.deleteTask);

// 系统设置
router.get("/settings/:key", adminController.getSystemSetting);
router.put("/settings/:key", adminController.updateSystemSetting);

// 用户管理
router.get("/users", adminController.getUserList);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

// 帖子统计与管理
// router.get("/stats/posts", adminController.getPostStats);
// router.get("/posts", adminController.getPostList);
// router.get("/posts/:id", adminController.getPostById);
// router.patch("/posts/:id/status", adminController.updatePostStatus);
router.delete("/posts/:id", adminController.deletePost);
console.log("已注册管理员删除帖子路由: /api/admin/posts/:id");

// 评论管理
// router.get("/stats/comments", adminController.getCommentStats);
// router.get("/comments", adminController.getCommentList);

// 管理员设置
// router.put("/settings", adminController.updateAdminSettings);

module.exports = router; 