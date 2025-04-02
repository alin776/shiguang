const db = require("../config/database");

class Activity {
  static async findAll(limit = 10, offset = 0) {
    try {
      const query = `
        SELECT * FROM activities 
        WHERE status = 'active' 
        ORDER BY start_time DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await db.execute(query, [limit, offset]);
      return rows;
    } catch (error) {
      console.error("获取活动列表失败:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM activities WHERE id = ?",
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("获取活动详情失败:", error);
      throw error;
    }
  }

  static async create(activityData) {
    try {
      const query = `
        INSERT INTO activities (
          title, description, cover_image, start_time, end_time, 
          location, max_participants, current_participants, 
          status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(query, [
        activityData.title,
        activityData.description,
        activityData.coverImage,
        activityData.startTime,
        activityData.endTime,
        activityData.location,
        activityData.maxParticipants,
        0, // 初始参与人数为0
        activityData.status || 'active',
        activityData.createdBy
      ]);

      return result.insertId;
    } catch (error) {
      console.error("创建活动失败:", error);
      throw error;
    }
  }

  static async update(id, activityData) {
    try {
      const query = `
        UPDATE activities 
        SET 
          title = ?, 
          description = ?, 
          cover_image = ?, 
          start_time = ?, 
          end_time = ?, 
          location = ?, 
          max_participants = ?, 
          status = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      const [result] = await db.execute(query, [
        activityData.title,
        activityData.description,
        activityData.coverImage,
        activityData.startTime,
        activityData.endTime,
        activityData.location,
        activityData.maxParticipants,
        activityData.status,
        id
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("更新活动失败:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute(
        "DELETE FROM activities WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("删除活动失败:", error);
      throw error;
    }
  }

  static async joinActivity(activityId, userId) {
    try {
      // 开始事务
      await db.beginTransaction();

      // 检查用户是否已参加该活动
      const [existing] = await db.execute(
        "SELECT * FROM activity_participants WHERE activity_id = ? AND user_id = ?",
        [activityId, userId]
      );

      if (existing.length > 0) {
        await db.rollback();
        throw new Error("您已经参加了该活动");
      }

      // 检查活动是否已满
      const [activity] = await db.execute(
        "SELECT current_participants, max_participants FROM activities WHERE id = ?",
        [activityId]
      );

      if (!activity.length) {
        await db.rollback();
        throw new Error("活动不存在");
      }

      const { current_participants, max_participants } = activity[0];
      
      if (current_participants >= max_participants) {
        await db.rollback();
        throw new Error("活动已满");
      }

      // 添加参与记录
      await db.execute(
        "INSERT INTO activity_participants (activity_id, user_id, joined_at) VALUES (?, ?, NOW())",
        [activityId, userId]
      );

      // 更新活动参与人数
      await db.execute(
        "UPDATE activities SET current_participants = current_participants + 1 WHERE id = ?",
        [activityId]
      );

      // 提交事务
      await db.commit();
      return true;
    } catch (error) {
      await db.rollback();
      console.error("参加活动失败:", error);
      throw error;
    }
  }

  static async leaveActivity(activityId, userId) {
    try {
      // 开始事务
      await db.beginTransaction();

      // 检查用户是否已参加该活动
      const [existing] = await db.execute(
        "SELECT * FROM activity_participants WHERE activity_id = ? AND user_id = ?",
        [activityId, userId]
      );

      if (existing.length === 0) {
        await db.rollback();
        throw new Error("您尚未参加该活动");
      }

      // 删除参与记录
      await db.execute(
        "DELETE FROM activity_participants WHERE activity_id = ? AND user_id = ?",
        [activityId, userId]
      );

      // 更新活动参与人数
      await db.execute(
        "UPDATE activities SET current_participants = current_participants - 1 WHERE id = ?",
        [activityId]
      );

      // 提交事务
      await db.commit();
      return true;
    } catch (error) {
      await db.rollback();
      console.error("退出活动失败:", error);
      throw error;
    }
  }

  static async getUserActivities(userId, limit = 10, offset = 0) {
    try {
      const query = `
        SELECT a.* 
        FROM activities a
        JOIN activity_participants ap ON a.id = ap.activity_id
        WHERE ap.user_id = ?
        ORDER BY a.start_time DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await db.execute(query, [userId, limit, offset]);
      return rows;
    } catch (error) {
      console.error("获取用户活动列表失败:", error);
      throw error;
    }
  }
}

module.exports = Activity; 