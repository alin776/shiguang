const db = require("../config/database");

// 获取所有分类
exports.getCategories = async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT id, name, description, sort_order
      FROM categories
      ORDER BY sort_order ASC, name ASC
    `);
    
    res.json(categories);
  } catch (error) {
    console.error("获取分类失败:", error);
    res.status(500).json({ message: "获取分类失败" });
  }
};

// 创建分类
exports.createCategory = async (req, res) => {
  try {
    const { name, description, sort_order } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "分类名称不能为空" });
    }
    
    const [result] = await db.execute(
      `INSERT INTO categories (name, description, sort_order) 
       VALUES (?, ?, ?)`,
      [name, description || null, sort_order || 0]
    );
    
    const categoryId = result.insertId;
    
    res.status(201).json({
      id: categoryId,
      name,
      description,
      sort_order,
      message: "分类创建成功"
    });
  } catch (error) {
    console.error("创建分类失败:", error);
    res.status(500).json({ message: "创建分类失败" });
  }
};

// 更新分类
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sort_order } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "分类名称不能为空" });
    }
    
    await db.execute(
      `UPDATE categories 
       SET name = ?, description = ?, sort_order = ? 
       WHERE id = ?`,
      [name, description || null, sort_order || 0, id]
    );
    
    res.json({
      id: parseInt(id),
      name,
      description,
      sort_order,
      message: "分类更新成功"
    });
  } catch (error) {
    console.error("更新分类失败:", error);
    res.status(500).json({ message: "更新分类失败" });
  }
};

// 删除分类
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询是否有帖子使用该分类
    const [posts] = await db.execute(
      `SELECT COUNT(*) as count FROM posts WHERE category_id = ?`,
      [id]
    );
    
    if (posts[0].count > 0) {
      return res.status(400).json({ 
        message: "该分类下有关联的帖子，无法删除" 
      });
    }
    
    await db.execute(`DELETE FROM categories WHERE id = ?`, [id]);
    
    res.json({ message: "分类删除成功" });
  } catch (error) {
    console.error("删除分类失败:", error);
    res.status(500).json({ message: "删除分类失败" });
  }
};

// 获取单个分类
exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [categories] = await db.execute(
      `SELECT id, name, description, sort_order
       FROM categories
       WHERE id = ?`,
      [id]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({ message: "分类不存在" });
    }
    
    res.json(categories[0]);
  } catch (error) {
    console.error("获取分类详情失败:", error);
    res.status(500).json({ message: "获取分类详情失败" });
  }
}; 