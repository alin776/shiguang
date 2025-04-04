const cron = require('node-cron');
const { cleanupExpiredMessages } = require('../models/privateChat');

// 定义任务
const tasks = {
  // 清理过期无痕消息（每小时运行一次）
  cleanupEphemeralMessages: {
    schedule: '0 * * * *', // 每小时运行一次
    job: async () => {
      try {
        console.log('正在运行定时任务: 清理过期无痕消息');
        const result = await cleanupExpiredMessages();
        console.log('清理过期无痕消息结果:', result);
      } catch (error) {
        console.error('清理过期无痕消息失败:', error);
      }
    }
  }
};

// 初始化所有定时任务
function init() {
  for (const [taskName, task] of Object.entries(tasks)) {
    cron.schedule(task.schedule, task.job, {
      scheduled: true,
      timezone: 'Asia/Shanghai' // 使用中国时区
    });
    console.log(`定时任务已初始化: ${taskName}, 调度: ${task.schedule}`);
  }
}

module.exports = {
  init,
  tasks
}; 