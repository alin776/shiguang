const cron = require('node-cron');
const cardGameController = require('../controllers/cardGameController');

// 游戏服务
class GameService {
  constructor() {
    this.initialized = false;
  }

  // 初始化定时任务
  init() {
    if (this.initialized) {
      return;
    }

    // 每天凌晨0点5分重置游戏状态
    cron.schedule('5 0 * * *', async () => {
      console.log('开始执行抽卡游戏重置...');
      try {
        // 重置游戏状态
        const result = await cardGameController.resetGame();
        console.log('抽卡游戏重置结果:', result);
      } catch (error) {
        console.error('抽卡游戏重置失败:', error);
      }
    });

    // 每天晚上23:30自动触发开奖
    cron.schedule('30 23 * * *', async () => {
      console.log('开始执行抽卡游戏自动开奖...');
      try {
        // 先检查是否已经有今天的开奖结果
        const todayDate = new Date();
        const formattedDate = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
        
        // 模拟admin请求对象
        const req = {
          user: { isAdmin: true },
        };
        
        // 模拟response对象
        const res = {
          status: (code) => {
            console.log(`自动开奖状态码: ${code}`);
            return {
              json: (data) => {
                console.log('自动开奖结果:', data);
              }
            };
          }
        };
        
        // 调用开奖方法
        await cardGameController.triggerDraw(req, res);
        console.log('自动开奖完成');
      } catch (error) {
        console.error('自动开奖失败:', error);
      }
    });

    this.initialized = true;
    console.log('游戏服务已初始化');
  }
}

const gameService = new GameService();
module.exports = gameService; 