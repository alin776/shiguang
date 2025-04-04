const db = require('../config/database');
const cron = require('node-cron');

// 称号服务
class TitleService {
  constructor() {
    this.initialized = false;
  }

  // 初始化定时任务
  init() {
    if (this.initialized) {
      return;
    }

    // 每天0点更新用户称号
    cron.schedule('0 0 * * *', async () => {
      console.log('开始执行每日用户称号更新...');
      try {
        await this.updateTopPosterTitle();
        console.log('用户称号更新完成');
      } catch (error) {
        console.error('用户称号更新失败:', error);
      }
    });

    this.initialized = true;
    console.log('称号服务已初始化');
  }

  // 更新发帖数量最多的用户为"巅峰大神"
  async updateTopPosterTitle() {
    try {
      // 首先将所有"巅峰大神"称号重置
      await db.execute(
        `UPDATE users SET title = NULL WHERE title = '巅峰大神'`
      );

      // 查询发帖数量最多的用户，排除总版主和云步官方称号
      const [topPosters] = await db.execute(
        `SELECT u.id, COUNT(p.id) as post_count
         FROM users u
         JOIN posts p ON u.id = p.user_id
         WHERE p.status = 'approved' 
         AND (u.title IS NULL OR u.title NOT IN ('总版主', '云步官方'))
         GROUP BY u.id
         ORDER BY post_count DESC
         LIMIT 1`
      );

      if (topPosters.length > 0) {
        const topPoster = topPosters[0];
        console.log(`发帖数量最多的用户ID: ${topPoster.id}, 帖子数: ${topPoster.post_count}`);

        // 更新该用户的称号，确保不会覆盖总版主和云步官方称号
        await db.execute(
          `UPDATE users SET title = '巅峰大神' WHERE id = ? AND (title IS NULL OR title NOT IN ('总版主', '云步官方'))`,
          [topPoster.id]
        );
        console.log(`已将用户 ${topPoster.id} 的称号更新为"巅峰大神"`);
      }
    } catch (error) {
      console.error('更新发帖榜首用户称号失败:', error);
      throw error;
    }
  }

  // 手动强制更新所有用户称号（管理后台功能）
  async forceUpdateAllTitles() {
    try {
      // 更新连续发帖满5天的用户
      await db.execute(
        `UPDATE users SET title = '持之以恒' 
         WHERE post_streak >= 5 AND title IS NULL`
      );

      // 更新发帖数量最多的用户
      await this.updateTopPosterTitle();

      return { success: true, message: '所有用户称号已更新' };
    } catch (error) {
      console.error('强制更新所有用户称号失败:', error);
      throw error;
    }
  }

  // 更新指定用户的称号
  async updateUserTitle(userId, title) {
    try {
      await db.execute(
        `UPDATE users SET title = ? WHERE id = ?`,
        [title, userId]
      );
      return { success: true, message: '用户称号已更新' };
    } catch (error) {
      console.error(`更新用户 ${userId} 的称号失败:`, error);
      throw error;
    }
  }
}

const titleService = new TitleService();
module.exports = titleService; 