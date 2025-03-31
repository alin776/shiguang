const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const feedbackController = require('../controllers/feedbackController');
const { adminAuth, requireSuperAdmin } = require('../middleware/adminAuth');
const { body } = require("express-validator");
const upload = require('../middleware/upload');
const { verifyAdminToken } = require('../middleware/adminAuth');
const { check } = require('express-validator');

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

// 公告管理路由
router.get('/announcements', adminController.getAnnouncements);
router.get('/announcements/:id', adminController.getAnnouncementById);
router.post('/announcements', upload.array('images', 5), adminController.createAnnouncement);
router.put('/announcements/:id', upload.array('images', 5), adminController.updateAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// 帖子管理路由
router.post('/posts/:postId/toggle-pin', verifyAdminToken, adminController.togglePinPost);

// 用户称号管理路由
router.get('/users/:userId/title', adminController.getUserTitle);
router.put('/users/:userId/title', adminController.updateUserTitle);
router.post('/titles/recalculate', adminController.recalculateAllTitles);

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

// 内容审核路由
router.get("/pending/posts", adminController.getPendingPosts);
router.get("/pending/comments", adminController.getPendingComments);
router.get("/pending/notes", adminController.getPendingNotes);
router.put("/pending/posts/:id/status", adminController.updatePostStatus);
router.put("/pending/comments/:id/status", adminController.updateCommentStatus);
router.put("/pending/notes/:id/status", adminController.updateNoteStatus);

// 举报处理路由
router.get("/reports", adminController.getReports);
router.put("/reports/:id/status", adminController.updateReportStatus);
router.get("/reports/:id", adminController.getReportDetails);

// 积分商品管理路由
// 获取所有积分商品
router.get('/points/products', adminController.getAllPointsProducts);

// 添加积分商品
router.post('/points/products', [
  check('name').notEmpty().withMessage('商品名称不能为空'),
  check('points_cost').isInt({ min: 1 }).withMessage('积分值必须是正整数'),
  check('quantity').isInt({ min: 0 }).withMessage('库存数量必须是非负整数')
], adminController.addPointsProduct);

// 更新积分商品
router.put('/points/products/:id', adminController.updatePointsProduct);

// 删除积分商品
router.delete('/points/products/:id', adminController.deletePointsProduct);

// 获取所有积分兑换记录
router.get('/points/exchanges', adminController.getAllPointsExchanges);

// 更新兑换记录状态
router.put('/points/exchanges/:id', [
  check('status').isIn(['pending', 'completed', 'failed']).withMessage('状态值无效')
], adminController.updatePointsExchangeStatus);

// 评分贴分类管理路由
router.post('/rate-post-categories', adminController.createRatePostCategory);
router.put('/rate-post-categories/:id', adminController.updateRatePostCategory);
router.delete('/rate-post-categories/:id', adminController.deleteRatePostCategory);

// 评分贴管理路由
router.get('/rate-posts', adminController.getRatePosts);
router.get('/rate-posts/:id', adminController.getRatePostDetail);
router.post('/rate-posts', adminController.createRatePost);
router.put('/rate-posts/:id', adminController.updateRatePost);
router.delete('/rate-posts/:id', adminController.deleteRatePost);
router.delete('/rate-options/:id', adminController.deleteRateOption);
router.delete('/rate-comments/:id', adminController.deleteRateComment);

// 管理员设置
// router.put("/settings", adminController.updateAdminSettings);

module.exports = router; 