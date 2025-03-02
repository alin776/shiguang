const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const groupController = require("../controllers/groupController");
const auth = require("../middleware/auth");

// 加入官方群（需要登录）
router.post(
  "/join",
  auth,
  [body("groupId").isInt()],
  groupController.joinGroup
);

// 获取群成员列表
router.get("/:groupId/members", auth, groupController.getGroupMembers);

// 获取用户加入的群列表
router.get("/user-groups", auth, groupController.getUserGroups);

module.exports = router;
