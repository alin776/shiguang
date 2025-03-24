const express = require('express');
const router = express.Router();
const townController = require('../controllers/TownController');
const auth = require('../middleware/auth');

// 获取论坛统计数据
router.get('/stats', auth, townController.getForumStats);

module.exports = router; 