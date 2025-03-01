const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const auth = require("../middleware/auth");

// 提交反馈
router.post("/", auth, feedbackController.submitFeedback);

// 获取反馈列表
router.get("/", auth, feedbackController.getFeedbacks);

module.exports = router;
