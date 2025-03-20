const db = require("../config/database");

// 获取用户每日任务
const getDailyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取当前日期 (YYYY-MM-DD 格式)
    const today = new Date().toISOString().split('T')[0];
    
    // 获取系统配置的每日经验上限
    const [limitSettings] = await db.execute(
      `SELECT value FROM system_settings WHERE \`key\` = 'daily_exp_limit'`
    );
    const DAILY_EXP_LIMIT = parseInt(limitSettings[0]?.value || '50');
    
    // 查询用户今日获得的经验值
    const [expRecords] = await db.execute(
      `SELECT SUM(exp_gained) as total_exp 
       FROM user_exp_history 
       WHERE user_id = ? AND DATE(created_at) = ?`,
      [userId, today]
    );
    
    const dailyExpGained = expRecords[0]?.total_exp || 0;
    
    // 查询所有活跃任务定义
    const [taskDefinitions] = await db.execute(
      `SELECT * FROM tasks WHERE is_active = 1`
    );
    
    // 查询用户今日任务记录
    const [taskRecords] = await db.execute(
      `SELECT * FROM user_tasks 
       WHERE user_id = ? AND date = ?`,
      [userId, today]
    );
    
    // 如果没有今日任务记录，创建新记录
    if (taskRecords.length === 0) {
      // 为每个任务创建记录
      for (const task of taskDefinitions) {
        await db.execute(
          `INSERT INTO user_tasks (user_id, task_type, progress, target, date)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, task.task_type, 0, task.target, today]
        );
      }
      
      // 构建任务响应对象
      const tasks = taskDefinitions.map(task => ({
        id: task.id,
        type: task.task_type,
        title: task.title,
        description: task.description,
        current: 0,
        target: task.target,
        reward: task.reward,
        isCompleted: false
      }));
      
      return res.json({
        tasks,
        expGained: dailyExpGained,
        expLimit: DAILY_EXP_LIMIT
      });
    }
    
    // 根据数据库记录构建任务列表
    const tasks = taskDefinitions.map(definition => {
      const record = taskRecords.find(r => r.task_type === definition.task_type);
      
      return {
        id: definition.id,
        type: definition.task_type,
        title: definition.title,
        description: definition.description,
        current: record ? record.progress : 0,
        target: definition.target,
        reward: definition.reward,
        isCompleted: record ? record.progress >= definition.target : false
      };
    });
    
    res.json({
      tasks,
      expGained: dailyExpGained,
      expLimit: DAILY_EXP_LIMIT
    });
  } catch (error) {
    console.error("获取用户每日任务失败:", error);
    res.status(500).json({ message: "获取用户每日任务失败" });
  }
};

// 更新任务进度
const updateTaskProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskType, newProgress } = req.body;
    
    if (!taskType) {
      return res.status(400).json({ message: "任务类型不能为空" });
    }
    
    // 检查任务是否存在
    const [taskDefinitions] = await db.execute(
      `SELECT * FROM tasks WHERE task_type = ?`,
      [taskType]
    );
    
    if (taskDefinitions.length === 0) {
      return res.status(400).json({ message: "无效的任务类型" });
    }
    
    // 获取当前日期
    const today = new Date().toISOString().split('T')[0];
    
    // 更新任务进度
    await db.execute(
      `UPDATE user_tasks 
       SET progress = ? 
       WHERE user_id = ? AND task_type = ? AND date = ?`,
      [newProgress, userId, taskType, today]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("更新任务进度失败:", error);
    res.status(500).json({ message: "更新任务进度失败" });
  }
};

// 完成任务
const completeTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskType, newProgress, earnedExp } = req.body;
    
    if (!taskType) {
      return res.status(400).json({ message: "任务类型不能为空" });
    }
    
    // 检查任务是否存在
    const [taskDefinitions] = await db.execute(
      `SELECT * FROM tasks WHERE task_type = ?`,
      [taskType]
    );
    
    if (taskDefinitions.length === 0) {
      return res.status(400).json({ message: "无效的任务类型" });
    }
    
    // 获取当前日期
    const today = new Date().toISOString().split('T')[0];
    
    // 更新任务进度
    await db.execute(
      `UPDATE user_tasks 
       SET progress = ?, completed_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND task_type = ? AND date = ?`,
      [newProgress, userId, taskType, today]
    );
    
    // 记录获得的经验值
    if (earnedExp > 0) {
      await db.execute(
        `INSERT INTO user_exp_history (user_id, exp_gained, source, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, earnedExp, `完成任务: ${taskDefinitions[0].title}`]
      );
      
      // 更新用户经验值和等级
      await db.execute(
        `UPDATE users SET experience = experience + ?, 
         level = CASE 
           WHEN experience + ? < 100 THEN 1
           WHEN experience + ? < 300 THEN 2
           WHEN experience + ? < 600 THEN 3
           WHEN experience + ? < 1000 THEN 4
           WHEN experience + ? < 1500 THEN 5
           ELSE 6
         END
         WHERE id = ?`,
        [earnedExp, earnedExp, earnedExp, earnedExp, earnedExp, earnedExp, userId]
      );
    }
    
    res.json({ 
      success: true,
      earnedExp
    });
  } catch (error) {
    console.error("完成任务失败:", error);
    res.status(500).json({ message: "完成任务失败" });
  }
};

// 获取系统每日经验上限
const getDailyExpLimit = async () => {
  try {
    const [settings] = await db.execute(
      `SELECT value FROM system_settings WHERE \`key\` = 'daily_exp_limit'`
    );
    return parseInt(settings[0]?.value || '50');
  } catch (error) {
    console.error("获取每日经验上限失败:", error);
    return 50; // 默认值
  }
};

// 获取用户今日已获得的经验值
const getUserDailyExp = async (userId) => {
  try {
    console.log(`获取用户${userId}今日经验...`);
    
    const today = new Date().toISOString().split('T')[0];
    console.log('当前日期:', today);
    
    const [expRecords] = await db.execute(
      `SELECT SUM(exp_gained) as total_exp 
       FROM user_exp_history 
       WHERE user_id = ? AND DATE(created_at) = ?`,
      [userId, today]
    );
    
    const totalExp = expRecords[0]?.total_exp || 0;
    console.log('查询结果:', JSON.stringify(expRecords[0]), '总经验:', totalExp);
    
    return totalExp;
  } catch (error) {
    console.error("获取用户今日经验失败:", error);
    return 0;
  }
};

// 增加用户经验值（考虑每日上限）
const addUserExperience = async (userId, amount, source) => {
  try {
    console.log(`开始为用户${userId}增加${amount}点经验，来源: ${source}`);
    
    if (amount <= 0) {
      console.log('经验值必须大于0，放弃增加');
      return 0;
    }
    
    // 获取每日经验上限
    const dailyExpLimit = await getDailyExpLimit();
    console.log('系统每日经验上限:', dailyExpLimit);
    
    // 获取用户今日已获得的经验值
    const dailyExpGained = await getUserDailyExp(userId);
    console.log('用户今日已获得经验:', dailyExpGained);
    
    // 计算可以获得的经验值（考虑每日上限）
    const earnableExp = Math.min(amount, dailyExpLimit - dailyExpGained);
    console.log('计算后可获得经验:', earnableExp);
    
    if (earnableExp <= 0) {
      console.log('达到每日上限，无法获得更多经验');
      return 0;
    }
    
    try {
      // 记录获得的经验值
      await db.execute(
        `INSERT INTO user_exp_history (user_id, exp_gained, source, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, earnableExp, source]
      );
      console.log('经验记录已插入历史表');
      
      // 更新用户经验值和等级
      await db.execute(
        `UPDATE users SET experience = experience + ?, 
         level = CASE 
           WHEN experience + ? < 100 THEN 1
           WHEN experience + ? < 300 THEN 2
           WHEN experience + ? < 600 THEN 3
           WHEN experience + ? < 1000 THEN 4
           WHEN experience + ? < 1500 THEN 5
           ELSE 6
         END
         WHERE id = ?`,
        [earnableExp, earnableExp, earnableExp, earnableExp, earnableExp, earnableExp, userId]
      );
      console.log('用户经验和等级已更新');
      
      return earnableExp;
    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("增加用户经验值失败:", error);
    return 0;
  }
};

module.exports = {
  getDailyTasks,
  updateTaskProgress,
  completeTask,
  getDailyExpLimit,
  getUserDailyExp,
  addUserExperience
}; 