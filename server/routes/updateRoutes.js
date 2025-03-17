const express = require('express');
const router = express.Router();
const updateController = require('../controllers/updateController');

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

module.exports = router; 