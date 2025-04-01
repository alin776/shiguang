const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// 检查认证状态
router.get('/check', auth, (req, res) => {
  res.json({
    success: true,
    message: '认证有效',
    user: req.user
  });
});

module.exports = router; 