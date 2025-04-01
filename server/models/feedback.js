const db = require("../config/database");

class Feedback {
  static async create(feedbackData) {
    try {
      const query = `
        INSERT INTO feedback (user_id, type, content, contact)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        feedbackData.userId,
        feedbackData.type,
        feedbackData.content,
        feedbackData.contact || null,
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute(`
        SELECT f.*, u.username 
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getByUserId(userId) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      await db.execute("UPDATE feedback SET status = ? WHERE id = ?", [
        status,
        id,
      ]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Feedback;
