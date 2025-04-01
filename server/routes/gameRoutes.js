const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const cardGameController = require("../controllers/cardGameController");
const auth = require("../middleware/auth");
const { adminAuth } = require("../middleware/adminAuth");

// 卡片游戏相关接口
router.post("/card-game/bet", auth, cardGameController.placeBet); // 投注
router.get("/card-game/today-bet", auth, cardGameController.getTodayBet); // 获取今日投注
router.get("/card-game/draw-result", auth, cardGameController.getDrawResult); // 获取开奖结果
router.get("/card-game/history", auth, cardGameController.getGameHistory); // 获取游戏历史
router.get("/card-game/stats", auth, cardGameController.getPlayerStats); // 获取玩家统计数据
// 管理员接口：获取所有用户的卡片游戏记录
router.get("/card-game/all-records", adminAuth, cardGameController.getAllCardGameRecords);
// 管理员接口：手动触发开奖
router.post("/card-game/trigger-draw", adminAuth, cardGameController.triggerDraw);

module.exports = router; 