const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const activityController = require("../controllers/activityController");
const auth = require("../middleware/auth");

// 所有活动路由都需要认证
router.use(auth);

// 获取活动列表
router.get("/", activityController.getActivities);

// 获取用户参加的活动
router.get("/user", activityController.getUserActivities);

// 获取活动详情
router.get("/:id", activityController.getActivityById);

// 创建活动 (仅管理员可用)
router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("活动标题不能为空"),
    body("description").trim().notEmpty().withMessage("活动描述不能为空"),
    body("startTime").isISO8601().withMessage("开始时间格式不正确"),
    body("endTime").isISO8601().withMessage("结束时间格式不正确"),
    body("location").trim().notEmpty().withMessage("活动地点不能为空"),
    body("maxParticipants").isInt({ min: 1 }).withMessage("参与人数上限必须是正整数")
  ],
  activityController.createActivity
);

// 更新活动 (仅管理员可用)
router.put(
  "/:id",
  [
    body("title").trim().notEmpty().withMessage("活动标题不能为空"),
    body("description").trim().notEmpty().withMessage("活动描述不能为空"),
    body("startTime").isISO8601().withMessage("开始时间格式不正确"),
    body("endTime").isISO8601().withMessage("结束时间格式不正确"),
    body("location").trim().notEmpty().withMessage("活动地点不能为空"),
    body("maxParticipants").isInt({ min: 1 }).withMessage("参与人数上限必须是正整数")
  ],
  activityController.updateActivity
);

// 删除活动 (仅管理员可用)
router.delete("/:id", activityController.deleteActivity);

// 用户参加活动
router.post("/:id/join", activityController.joinActivity);

// 用户退出活动
router.post("/:id/leave", activityController.leaveActivity);

module.exports = router; 