const express = require('express');
const router = express.Router();
const townController = require('../controllers/TownController');
const auth = require('../middleware/auth');

// 所有路由都需要认证
router.use(auth);

// 获取小镇页面所需的所有数据
router.get('/', townController.getTownData);

// 获取论坛统计数据
router.get('/forum-stats', townController.getForumStats);

module.exports = router; 