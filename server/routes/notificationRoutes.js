const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const auth = require("../middleware/auth");

// 所有路由都需要认证
router.use(auth);

// 获取通知列表
router.get("/", notificationController.getNotifications);

// 根据类型获取通知
router.get("/by-type/:type", notificationController.getNotificationsByType);

// 标记通知为已读
router.put("/read", notificationController.markAsRead);

// 标记所有通知为已读
router.put("/read-all", notificationController.markAllAsRead);

// 删除通知
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
