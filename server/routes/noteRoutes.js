const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const auth = require('../middleware/auth');

// 公开路由 - 获取小记列表
router.get('/', noteController.getNotes);

// 获取用户自己的小记 - 放在具体ID路由前面，避免被:id匹配
router.get('/user/me', auth, noteController.getUserNotes);

// 获取单个小记详情
router.get('/:id', noteController.getNoteById);

// 需要身份验证的路由
// 创建新小记
router.post('/', auth, noteController.createNote);

// 点赞/取消点赞小记
router.post('/:id/like', auth, noteController.likeNote);

// 删除小记
router.delete('/:id', auth, noteController.deleteNote);

module.exports = router; 