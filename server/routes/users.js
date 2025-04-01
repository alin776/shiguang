const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

// ... 其他路由

// 获取用户资料
router.get("/:userId/profile", auth, userController.getUserProfile);

// 获取用户粉丝列表
router.get("/:userId/followers", auth, userController.getFollowers);

// 获取用户关注列表
router.get("/:userId/following", auth, userController.getFollowing);

// 关注用户
router.post("/:userId/follow", auth, userController.followUser);

// 取消关注
router.delete("/:userId/follow", auth, userController.unfollowUser);

module.exports = router;
