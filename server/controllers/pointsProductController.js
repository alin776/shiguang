const db = require("../config/database");
const User = require("../models/user");
const { validationResult } = require("express-validator");

// 获取所有可兑换商品
const getProducts = async (req, res) => {
  try {
    // 获取商品列表，只返回上架的商品
    const [products] = await db.execute(
      `SELECT id, name, description, image_url, points_cost, quantity 
       FROM points_products 
       WHERE is_active = TRUE
       ORDER BY points_cost ASC`
    );

    res.status(200).json(products);
  } catch (error) {
    console.error("获取积分商品列表失败:", error);
    res.status(500).json({ message: "获取积分商品列表失败" });
  }
};

// 获取单个商品详情
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const [products] = await db.execute(
      `SELECT id, name, description, image_url, points_cost, quantity 
       FROM points_products 
       WHERE id = ? AND is_active = TRUE`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: "商品不存在或已下架" });
    }

    res.status(200).json(products[0]);
  } catch (error) {
    console.error("获取积分商品详情失败:", error);
    res.status(500).json({ message: "获取积分商品详情失败" });
  }
};

// 兑换商品
const exchangeProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const { productId } = req.body;
    
    console.log(`用户 ${userId} 尝试兑换商品 ${productId}`);

    // 查询商品信息
    const [products] = await db.execute(
      `SELECT id, name, points_cost, quantity 
       FROM points_products 
       WHERE id = ? AND is_active = TRUE`,
      [productId]
    );

    if (products.length === 0) {
      console.log(`商品 ${productId} 不存在或已下架`);
      return res.status(404).json({ message: "商品不存在或已下架" });
    }

    const product = products[0];
    console.log(`商品信息:`, product);

    // 检查库存
    if (product.quantity <= 0) {
      console.log(`商品 ${productId} 库存不足`);
      return res.status(400).json({ message: "商品库存不足" });
    }

    // 查询用户积分
    const [users] = await db.execute(
      "SELECT points FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      console.log(`用户 ${userId} 不存在`);
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = users[0];
    console.log(`用户积分:`, user.points);

    // 检查用户积分是否足够
    if (user.points < product.points_cost) {
      console.log(`用户积分不足: 需要 ${product.points_cost}, 实际 ${user.points}`);
      return res.status(400).json({ message: "积分不足" });
    }

    // 创建数据库连接来手动管理事务
    const connection = await db.getConnection();
    
    try {
      console.log(`开始执行兑换事务...`);
      
      // 开始事务 - 使用query而不是execute
      await connection.query('START TRANSACTION');
      
      // 减少用户积分
      await connection.execute(
        "UPDATE users SET points = points - ? WHERE id = ?",
        [product.points_cost, userId]
      );
      console.log(`已扣除用户积分: ${product.points_cost}`);

      // 减少商品库存
      await connection.execute(
        "UPDATE points_products SET quantity = quantity - 1 WHERE id = ?",
        [productId]
      );
      console.log(`已减少商品库存`);

      // 创建兑换记录
      await connection.execute(
        `INSERT INTO points_exchanges 
         (user_id, product_id, points_cost, status, exchange_time) 
         VALUES (?, ?, ?, 'pending', NOW())`,
        [userId, productId, product.points_cost]
      );
      console.log(`已创建兑换记录，状态为pending`);

      try {
        // 记录积分历史
        await connection.execute(
          `INSERT INTO user_points_history 
           (user_id, points_gained, source, created_at) 
           VALUES (?, ?, ?, NOW())`,
          [userId, -product.points_cost, `兑换商品: ${product.name}`]
        );
        console.log(`已记录积分历史`);
      } catch (historyError) {
        console.error("记录积分历史失败:", historyError);
        // 继续执行，不要因为积分历史记录失败而回滚整个事务
      }

      // 提交事务 - 使用query而不是execute
      await connection.query('COMMIT');
      console.log(`事务已提交`);

      // 查询最新的用户积分
      const [updatedUsers] = await db.execute(
        "SELECT points FROM users WHERE id = ?",
        [userId]
      );

      res.status(200).json({
        message: "兑换成功",
        points: updatedUsers[0].points,
        product: product.name
      });
    } catch (transactionError) {
      // 回滚事务 - 使用query而不是execute
      await connection.query('ROLLBACK');
      console.error("执行事务失败，已回滚:", transactionError);
      throw transactionError;
    } finally {
      // 释放数据库连接
      connection.release();
    }
  } catch (error) {
    console.error("兑换商品失败:", error);
    res.status(500).json({ 
      message: "兑换商品失败", 
      error: error.message 
    });
  }
};

// 获取用户兑换记录
const getUserExchanges = async (req, res) => {
  try {
    const userId = req.user.id;

    const [exchanges] = await db.execute(
      `SELECT e.id, e.points_cost, e.status, e.exchange_time, e.completion_time,
              p.name as product_name, p.image_url
       FROM points_exchanges e
       JOIN points_products p ON e.product_id = p.id
       WHERE e.user_id = ?
       ORDER BY e.exchange_time DESC`,
      [userId]
    );

    res.status(200).json(exchanges);
  } catch (error) {
    console.error("获取用户兑换记录失败:", error);
    res.status(500).json({ message: "获取用户兑换记录失败" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  exchangeProduct,
  getUserExchanges
}; 