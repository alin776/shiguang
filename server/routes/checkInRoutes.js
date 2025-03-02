const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const checkInController = require("../controllers/checkInController");
const auth = require("../middleware/auth");

// 所有路由需要认证
router.use(auth);

// 获取所有打卡项目
router.get("/items", checkInController.getCheckInItems);

// 创建打卡项目
router.post(
  "/items",
  [
    body("name").trim().notEmpty().withMessage("名称不能为空"),
    body("color").optional().isString().withMessage("颜色格式不正确"),
  ],
  checkInController.createCheckInItem
);

// 更新打卡项目
router.put(
  "/items/:id",
  [
    body("name").optional().trim().notEmpty().withMessage("名称不能为空"),
    body("color").optional().isString().withMessage("颜色格式不正确"),
    body("enabled").optional().isBoolean().withMessage("启用状态格式不正确"),
  ],
  checkInController.updateCheckInItem
);

// 删除打卡项目 - 添加详细注释确保路由正确
router.delete("/items/:id", checkInController.deleteCheckInItem);

// 获取用户打卡记录
router.get("/user", checkInController.getUserCheckIns);

// 获取用户连续打卡天数
router.get("/streaks", checkInController.getUserStreaks);

// 打卡
router.post(
  "/",
  [
    body("itemId").isInt().withMessage("项目ID必须为整数"),
    body("date").optional().isString().withMessage("日期格式不正确"),
  ],
  checkInController.checkIn
);

// 取消打卡
router.delete("/", checkInController.cancelCheckIn);

module.exports = router;
