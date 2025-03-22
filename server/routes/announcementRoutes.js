const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/AnnouncementController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');
const upload = require('../middleware/upload');

// 所有路由都需要认证
router.use(auth);

// 获取所有公告
router.get('/', announcementController.getAnnouncements);

// 获取单个公告详情
router.get('/:id', announcementController.getAnnouncementById);

// 创建公告（需要管理员权限）
router.post('/',
  upload.array('images', 5),
  [
    check('title', '标题不能为空').notEmpty(),
    check('content', '内容不能为空').notEmpty()
  ],
  announcementController.createAnnouncement
);

// 更新公告（需要管理员权限）
router.put('/:id',
  upload.array('images', 5),
  [
    check('title', '标题不能为空').notEmpty(),
    check('content', '内容不能为空').notEmpty()
  ],
  announcementController.updateAnnouncement
);

// 删除公告（需要管理员权限）
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router; 