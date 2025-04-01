const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const adsController = require("../controllers/adsController");
const auth = require("../middleware/auth");

// 获取广告列表
router.get("/", adsController.getAds);

// 记录广告点击
router.post("/click", [body("adId").isInt()], adsController.recordAdClick);

// 添加广告（需要管理员权限）
router.post(
  "/",
  auth,
  [
    body("title").trim().notEmpty(),
    body("content").trim().notEmpty(),
    body("position").trim().notEmpty(),
    body("link").isURL(),
  ],
  adsController.addAd
);

module.exports = router;
