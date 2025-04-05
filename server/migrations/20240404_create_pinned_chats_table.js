const db = require("../config/database");

module.exports = {
  async up() {
    // 创建置顶会话表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pinned_chats (
        id INT NOT NULL AUTO_INCREMENT,
        chat_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_pin (chat_id, user_id),
        FOREIGN KEY (chat_id) REFERENCES private_chats(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log("已创建置顶会话表");
  },

  async down() {
    await db.execute("DROP TABLE IF EXISTS pinned_chats");
    console.log("已删除置顶会话表");
  }
}; 