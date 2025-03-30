const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adViewController = require('../controllers/adViewController');

// 获取用户广告观看数据
router.get('/data', auth, adViewController.getAdViewData);

// 更新用户广告观看数据
router.post('/data', auth, adViewController.updateAdViewData);

module.exports = router; 