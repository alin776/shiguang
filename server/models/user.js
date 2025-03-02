const db = require("../config/database");
const bcrypt = require("bcrypt");

class User {
  static async findByCredentials(username, password) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE username = ? OR email = ? OR phone = ?
      `;
      const [rows] = await db.execute(query, [username, username, username]);

      if (rows.length === 0) {
        throw new Error("用户不存在");
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        throw new Error("密码错误");
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      if (!id) {
        throw new Error("用户ID不能为空");
      }
      const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
      if (rows[0]) {
        const { password, ...userWithoutPassword } = rows[0];
        return userWithoutPassword;
      }
      return rows[0] || null;
    } catch (error) {
      console.error("查找用户失败:", error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const query = `
        INSERT INTO users (username, email, password, phone)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        userData.username,
        userData.email,
        hashedPassword,
        userData.phone,
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(id, profileData) {
    try {
      // 过滤掉 undefined 值
      const validData = {
        username: profileData.username || null,
        email: profileData.email || null,
        phone: profileData.phone || null,
        avatar: profileData.avatar || null,
        cover_image: profileData.coverImage || null,
        bio: profileData.bio || null,
      };

      // 构建动态 SQL 更新语句
      const updateFields = Object.entries(validData)
        .filter(([_, value]) => value !== undefined)
        .map(([key, _]) => `${key} = ?`)
        .join(", ");

      const updateValues = Object.values(validData).filter(
        (value) => value !== undefined
      );

      // 添加 id 到值数组
      updateValues.push(id);

      const query = `
        UPDATE users 
        SET ${updateFields}
        WHERE id = ?
      `;

      await db.execute(query, updateValues);

      return true;
    } catch (error) {
      console.error("更新用户资料失败:", error);
      throw error;
    }
  }

  static async changePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.execute("UPDATE users SET password = ? WHERE id = ?", [
        hashedPassword,
        id,
      ]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      await db.execute("UPDATE users SET status = ? WHERE id = ?", [
        status,
        id,
      ]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
