const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const privateChatController = require('../controllers/privateChatController');

// 创建私聊会话
router.post('/', 
  auth,
  [
    body('targetUserId').notEmpty().withMessage('目标用户ID不能为空'),
    body('isEphemeral').optional().isBoolean().withMessage('isEphemeral必须是布尔值')
  ],
  privateChatController.createChat
);

// 获取用户的私聊会话列表
router.get('/', auth, privateChatController.getUserChats);

// 获取单个会话详情
router.get('/:chatId', 
  auth,
  [
    param('chatId').isInt().withMessage('会话ID必须是整数')
  ],
  privateChatController.getChatById
);

// 置顶/取消置顶会话
router.post('/:chatId/pin',
  auth,
  [
    param('chatId').isInt().withMessage('会话ID必须是整数'),
    body('isPinned').isBoolean().withMessage('isPinned必须是布尔值')
  ],
  privateChatController.toggleChatPin
);

// 删除会话
router.delete('/:chatId',
  auth,
  [
    param('chatId').isInt().withMessage('会话ID必须是整数')
  ],
  privateChatController.deleteChat
);

// 发送消息到会话
router.post('/:chatId/messages',
  auth,
  [
    param('chatId').isInt().withMessage('会话ID必须是整数'),
    body('content').notEmpty().withMessage('消息内容不能为空'),
    body('contentType').optional().isIn(['text', 'image', 'audio', 'video', 'file']).withMessage('内容类型无效'),
    body('mediaUrl').optional(),
    body('expireAfter').optional().custom(value => {
      if (value === null) return true;
      return !isNaN(parseInt(value)) && parseInt(value) > 0;
    }).withMessage('过期时间必须是正整数或null'),
    body('expireAfterRead').optional().isBoolean().withMessage('阅后即焚标志必须是布尔值')
  ],
  privateChatController.sendMessage
);

// 获取会话消息列表
router.get('/:chatId/messages',
  auth,
  [
    param('chatId').isInt().withMessage('会话ID必须是整数'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('限制数必须是1-50之间的整数'),
    query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须是非负整数')
  ],
  privateChatController.getChatMessages
);

// 标记消息已读 (PATCH 方法)
router.patch('/messages/:messageId/read',
  auth,
  [
    param('messageId').isInt().withMessage('消息ID必须是整数')
  ],
  privateChatController.markMessageAsRead
);

// 标记消息已读 (POST 方法 - 为了兼容前端CORS限制)
router.post('/messages/:messageId/read',
  auth,
  [
    param('messageId').isInt().withMessage('消息ID必须是整数')
  ],
  privateChatController.markMessageAsRead
);

// 删除/撤回消息
router.delete('/messages/:messageId',
  auth,
  [
    param('messageId').isInt().withMessage('消息ID必须是整数')
  ],
  privateChatController.deleteMessage
);

// 焚毁/永久删除单条消息（由客户端计时器触发）
router.delete('/messages/:messageId/burn',
  auth,
  [
    param('messageId').isInt().withMessage('消息ID必须是整数')
  ],
  privateChatController.burnMessage
);

// 清理过期消息（系统任务，仅限管理员）
router.post('/cleanup', auth, privateChatController.cleanupExpiredMessages);

module.exports = router; 