const express = require("express");
const router = express.Router();
const dataController = require("../controllers/dataController");
const auth = require("../middleware/auth");

// 备份数据（需要登录）
router.post("/backup", auth, dataController.backupData);

// 恢复数据（需要登录）
router.post("/restore", auth, dataController.restoreData);

// 同步数据（需要登录）
router.post("/sync", auth, dataController.syncData);

module.exports = router;
