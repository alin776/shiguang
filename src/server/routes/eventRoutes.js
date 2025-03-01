const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const eventController = require("../controllers/eventController");
const auth = require("../middleware/auth");
const db = require("../config/database");

// 所有事件路由都需要认证
router.use(auth);

// 获取事件列表
router.get("/", eventController.getEvents);

// 创建事件
router.post(
  "/",
  [
    body("title").trim().notEmpty(),
    body("startTime").isISO8601(),
    body("endTime").isISO8601(),
  ],
  eventController.createEvent
);

// 更新事件
router.put(
  "/:id",
  [
    body("title").trim().notEmpty(),
    body("startTime").isISO8601(),
    body("endTime").isISO8601(),
  ],
  eventController.updateEvent
);

// 删除事件
router.delete("/:id", eventController.deleteEvent);

// 分享事件
router.post("/:eventId/share", eventController.shareEvent);

module.exports = router;
