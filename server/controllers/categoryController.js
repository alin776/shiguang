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

// 获取分类统计数据
exports.getCategoryStats = async (req, res) => {
  try {
    // 首先获取所有分类
    const [categories] = await db.execute(`
      SELECT id, name
      FROM categories
      ORDER BY sort_order ASC, name ASC
    `);
    
    if (categories.length === 0) {
      return res.json([]);
    }
    
    // 查询帖子数量
    const [postCounts] = await db.execute(`
      SELECT 
        category_id, 
        COUNT(*) as count
      FROM 
        posts
      WHERE 
        status = 'approved'
      GROUP BY 
        category_id
    `);
    
    // 查询评论数量
    const [commentCounts] = await db.execute(`
      SELECT 
        p.category_id, 
        COUNT(c.id) as count
      FROM 
        comments c
      JOIN 
        posts p ON c.post_id = p.id
      WHERE 
        c.status = 'approved' AND p.status = 'approved'
      GROUP BY 
        p.category_id
    `);
    
    // 查询相关用户数量
    const [userCounts] = await db.execute(`
      SELECT 
        p.category_id, 
        COUNT(DISTINCT p.user_id) as count
      FROM 
        posts p
      WHERE 
        p.status = 'approved'
      GROUP BY 
        p.category_id
    `);
    
    // 创建查询结果的映射
    const postCountMap = new Map();
    const commentCountMap = new Map();
    const userCountMap = new Map();
    
    postCounts.forEach(item => {
      postCountMap.set(item.category_id, item.count);
    });
    
    commentCounts.forEach(item => {
      commentCountMap.set(item.category_id, item.count);
    });
    
    userCounts.forEach(item => {
      userCountMap.set(item.category_id, item.count);
    });
    
    // 组合统计数据
    const stats = categories.map(category => ({
      category_id: category.id,
      category_name: category.name,
      post_count: postCountMap.get(category.id) || 0,
      comment_count: commentCountMap.get(category.id) || 0,
      user_count: userCountMap.get(category.id) || 0
    }));
    
    res.json(stats);
  } catch (error) {
    console.error("获取分类统计数据失败:", error);
    console.error(error.stack); // 打印详细的调用栈信息以便调试
    res.status(500).json({ message: "获取分类统计数据失败" });
  }
}; 