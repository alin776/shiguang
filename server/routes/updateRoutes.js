const express = require('express');
const router = express.Router();
const updateController = require('../controllers/updateController');
const { adminAuth } = require('../middleware/adminAuth'); // 修正引入方式

/**
 * @route   GET /api/updates/check
 * @desc    检查应用是否有新版本
 * @access  Public
 * @query   {string} version - 当前版本号
 * @query   {string} platform - 平台(android/ios/web)
 * @query   {string} buildNumber - 构建号
 */
router.get('/check', updateController.checkForUpdates);

/**
 * @route   GET /api/updates/history
 * @desc    获取版本历史记录
 * @access  Public
 * @query   {string} platform - 平台(android/ios/web)
 */
router.get('/history', updateController.getVersionHistory);

/**
 * @route   GET /api/updates/latest
 * @desc    获取所有平台的最新版本
 * @access  Admin
 */
router.get('/latest', adminAuth, updateController.getLatestVersions);

/**
 * @route   POST /api/updates/add
 * @desc    添加新版本
 * @access  Admin
 */
router.post('/add', adminAuth, updateController.addVersion);

module.exports = router; 