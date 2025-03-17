const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const feedbackController = require('../controllers/feedbackController');
const { adminAuth, requireSuperAdmin } = require('../middleware/adminAuth');

// 管理员登录（公开接口）
router.post('/login', adminController.login);

// 以下路由需要管理员身份验证
router.use(adminAuth);

// 获取当前管理员信息
router.get('/profile', adminController.getProfile);

// 获取仪表盘数据
router.get('/dashboard', adminController.getDashboardData);

// 反馈管理路由
router.get('/feedbacks', feedbackController.getAdminFeedbacks);
router.get('/feedbacks/:id', feedbackController.getFeedbackById);
router.post('/feedbacks/:id/reply', feedbackController.replyFeedback);
router.put('/feedbacks/:id/status', feedbackController.updateFeedbackStatus);
router.delete('/feedbacks/:id', feedbackController.deleteFeedback);

// 小记管理路由
router.get('/notes', adminController.getAllNotes);
router.post('/notes', adminController.createNote);
router.delete('/notes/:id', adminController.deleteNote);

// 以下路由需要超级管理员权限
router.use(requireSuperAdmin);

// 创建新管理员
router.post('/', adminController.createAdmin);

// 获取所有管理员列表
router.get('/', adminController.getAllAdmins);

module.exports = router; 