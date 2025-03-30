const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");
const { body } = require("express-validator");

// 获取每日任务
router.get("/daily", auth, taskController.getDailyTasks);

// 更新任务进度
router.post("/progress", auth, [
  body("taskType").notEmpty().withMessage("任务类型不能为空"),
  body("newProgress").isInt({ min: 0 }).withMessage("进度必须是非负整数")
], taskController.updateTaskProgress);

// 完成任务
router.post("/complete", auth, [
  body("taskType").notEmpty().withMessage("任务类型不能为空"),
  body("newProgress").isInt({ min: 0 }).withMessage("进度必须是非负整数"),
  body("earnedExp").isInt({ min: 0 }).withMessage("经验值必须是非负整数")
], taskController.completeTask);

module.exports = router; 