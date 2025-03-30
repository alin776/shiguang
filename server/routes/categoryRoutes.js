const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const auth = require("../middleware/auth");
const db = require("../config/database");

// 原来需要管理员权限的路由，现在只需要用户登录
router.post("/", auth, categoryController.createCategory);
router.put("/:id", auth, categoryController.updateCategory);
router.delete("/:id", auth, categoryController.deleteCategory);

// 普通用户可访问的路由
router.get("/", categoryController.getCategories);

// 获取评分贴分类 - 把路径改为全小写，并移到其他路由之前
router.get("/rate-posts", async (req, res) => {
  try {
    // 从数据库获取评分贴分类
    const [rows] = await db.query('SELECT * FROM rate_post_categories WHERE is_active = 1 ORDER BY display_order ASC');
    
    // 如果没有数据，返回默认分类
    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        data: [
          { id: 'movie', name: '电影', description: '电影相关的评分贴' },
          { id: 'game', name: '游戏', description: '游戏相关的评分贴' },
          { id: 'platform', name: '平台', description: '平台相关的评分贴' },
          { id: 'brand', name: '品牌', description: '品牌相关的评分贴' },
          { id: 'other', name: '其他', description: '其他类型的评分贴' }
        ]
      });
    }
    
    res.json({
      success: true,
      data: rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description
      }))
    });
  } catch (error) {
    console.error('获取评分贴分类错误:', error);
    // 请求失败时返回默认分类
    res.json({
      success: true,
      data: [
        { id: 'movie', name: '电影', description: '电影相关的评分贴' },
        { id: 'game', name: '游戏', description: '游戏相关的评分贴' },
        { id: 'platform', name: '平台', description: '平台相关的评分贴' },
        { id: 'brand', name: '品牌', description: '品牌相关的评分贴' },
        { id: 'other', name: '其他', description: '其他类型的评分贴' }
      ]
    });
  }
});

// 获取单个分类 - 确保这个路由在/rate-posts之后
router.get("/:id", categoryController.getCategory);

module.exports = router; 