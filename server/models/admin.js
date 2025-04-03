const db = require("../config/database");

class Admin {
  // 通过用户名查找管理员
  static async findByUsername(username) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM admins WHERE username = ?',
        [username]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('查找管理员失败:', error);
      throw error;
    }
  }

  // 通过ID查找管理员
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM admins WHERE id = ?',
        [id]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('查找管理员失败:', error);
      throw error;
    }
  }

  // 创建新管理员
  static async create(adminData) {
    try {
      const [result] = await db.execute(
        'INSERT INTO admins (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)',
        [
          adminData.username,
          adminData.password,
          adminData.name || null,
          adminData.email || null,
          adminData.role || 'admin'
        ]
      );

      const id = result.insertId;
      return this.findById(id);
    } catch (error) {
      console.error('创建管理员失败:', error);
      throw error;
    }
  }

  // 更新管理员信息
  static async update(id, adminData) {
    try {
      let query = 'UPDATE admins SET ';
      const queryParams = [];
      const updateFields = [];

      if (adminData.name !== undefined) {
        updateFields.push('name = ?');
        queryParams.push(adminData.name);
      }

      if (adminData.email !== undefined) {
        updateFields.push('email = ?');
        queryParams.push(adminData.email);
      }

      if (adminData.role !== undefined) {
        updateFields.push('role = ?');
        queryParams.push(adminData.role);
      }

      if (adminData.password !== undefined) {
        updateFields.push('password = ?');
        queryParams.push(adminData.password);
      }

      if (updateFields.length === 0) {
        return await this.findById(id);
      }

      query += updateFields.join(', ');
      query += ' WHERE id = ?';
      queryParams.push(id);

      await db.execute(query, queryParams);
      return await this.findById(id);
    } catch (error) {
      console.error('更新管理员失败:', error);
      throw error;
    }
  }

  // 更新最后登录时间
  static async updateLastLogin(id) {
    try {
      await db.execute(
        'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('更新登录时间失败:', error);
      return false;
    }
  }

  // 获取所有管理员
  static async findAll() {
    try {
      const [rows] = await db.execute(
        'SELECT id, username, name, email, role, last_login, created_at, updated_at FROM admins'
      );
      return rows;
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      throw error;
    }
  }

  // 删除管理员
  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM admins WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除管理员失败:', error);
      throw error;
    }
  }
}

module.exports = Admin; 