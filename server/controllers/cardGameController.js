const db = require("../config/database");
const User = require("../models/user");

// 获取今天的日期（YYYY-MM-DD格式）
const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 判断当前是否在开奖时间（晚上11点到0点之间）
const isDrawTime = () => {
  const now = new Date();
  const hour = now.getHours();
  console.log("当前小时:", hour, "是否是开奖时间:", hour >= 23 || hour < 0);
  // 实际判断是否是开奖时间
  return hour >= 23 || hour < 0;
};

// 强制生成今日开奖结果
const generateDrawResult = async () => {
  console.log("强制生成开奖结果...");
  
  // 随机生成中奖位置
  const winningPosition = Math.floor(Math.random() * 3);
  console.log("中奖位置:", winningPosition);
  
  // 插入结果
  const [insertResult] = await db.execute(
    `INSERT INTO card_game_results 
    (winning_position, created_at) 
    VALUES (?, NOW())`,
    [winningPosition]
  );
  console.log("开奖结果插入成功:", insertResult);

  // 获取插入的结果
  const [resultRows] = await db.execute(
    `SELECT * FROM card_game_results WHERE id = ?`,
    [insertResult.insertId]
  );
  console.log("获取开奖结果:", resultRows[0]);

  // 处理所有投注
  await processBets(resultRows[0].id, winningPosition);
  
  return resultRows[0];
};

// 投注
exports.placeBet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardIndex, amount } = req.body;
    
    console.log("开始处理投注请求:", {
      userId,
      cardIndex,
      amount,
      currentTime: new Date().toISOString(),
      isDrawTime: isDrawTime()
    });

    // 验证参数
    if (cardIndex === undefined || !amount) {
      console.log("参数缺失:", { cardIndex, amount });
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 验证卡片序号
    if (cardIndex < 0 || cardIndex > 2) {
      console.log("卡片序号无效:", cardIndex);
      return res.status(400).json({ message: "卡片序号无效" });
    }

    // 验证金额
    if (amount < 10 || amount > 1000) {
      console.log("投注金额无效:", amount);
      return res.status(400).json({ message: "投注金额必须在10-1000之间" });
    }

    // 检查用户积分是否足够
    console.log("查询用户积分...");
    const [userRows] = await db.execute(
      "SELECT points FROM users WHERE id = ?", 
      [userId]
    );
    console.log("用户积分查询结果:", userRows);

    if (!userRows.length) {
      console.log("未找到用户");
      return res.status(400).json({ message: "未找到用户" });
    }
    
    if (userRows[0].points < amount) {
      console.log("积分不足:", { 用户积分: userRows[0].points, 所需积分: amount });
      return res.status(400).json({ message: "积分不足" });
    }

    // 检查今天是否已经投注
    const todayDate = getTodayDate();
    console.log("查询今日投注...");
    const [existingBets] = await db.execute(
      `SELECT * FROM card_game_bets WHERE user_id = ? AND DATE(created_at) = ?`,
      [userId, todayDate]
    );
    console.log("今日投注查询结果:", existingBets);

    if (existingBets.length > 0) {
      console.log("今日已经投注");
      return res.status(400).json({ message: "今天已经投注过了" });
    }

    // 判断是否在开奖时间
    if (isDrawTime()) {
      console.log("当前是开奖时间，无法投注");
      return res.status(400).json({ message: "当前是开奖时间，无法投注" });
    }

    // 插入投注记录
    console.log("插入投注记录...");
    try {
      const [result] = await db.execute(
        `INSERT INTO card_game_bets 
        (user_id, selected_position, bet_amount, created_at) 
        VALUES (?, ?, ?, NOW())`,
        [userId, cardIndex, amount]
      );
      console.log("投注记录插入成功:", result);

      // 扣除用户积分
      console.log("扣除用户积分...");
      await db.execute(
        "UPDATE users SET points = points - ? WHERE id = ?",
        [amount, userId]
      );
      console.log("用户积分扣除成功");
      
      // 添加积分历史记录
      await db.execute(
        `INSERT INTO user_points_history 
        (user_id, points_gained, source) 
        VALUES (?, ?, ?)`,
        [userId, -amount, '抽卡游戏投注']
      );
      console.log("积分历史记录已添加");

      // 获取插入的记录
      const [rows] = await db.execute(
        `SELECT * FROM card_game_bets WHERE id = ?`,
        [result.insertId]
      );
      console.log("返回投注记录:", rows[0]);

      res.status(201).json(rows[0]);
    } catch (dbError) {
      console.error("数据库操作失败:", dbError);
      return res.status(500).json({ message: "数据库操作失败", error: dbError.message });
    }
  } catch (error) {
    console.error("投注失败:", error);
    res.status(500).json({ message: "投注失败", error: error.message });
  }
};

// 获取今日投注
exports.getTodayBet = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayDate = getTodayDate();
    
    console.log("查询用户最近投注:", { userId, todayDate });

    // 获取最近的一次投注，不严格限制日期
    const [rows] = await db.execute(
      `SELECT * FROM card_game_bets 
      WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    console.log("用户投注查询结果:", rows);

    if (rows.length === 0) {
      console.log("没有找到投注记录");
      return res.status(404).json({ message: "没有找到投注记录" });
    }

    // 额外添加日志，显示投注日期与当前日期的比较
    const betDate = new Date(rows[0].created_at);
    const today = new Date();
    console.log("投注日期信息:", {
      投注日期: betDate.toISOString(),
      当前日期: today.toISOString(),
      投注日期年月日: `${betDate.getFullYear()}-${betDate.getMonth()+1}-${betDate.getDate()}`,
      当前日期年月日: `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`
    });

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("获取投注记录失败:", error);
    res.status(500).json({ message: "获取投注记录失败", error: error.message });
  }
};

// 获取开奖结果
exports.getDrawResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayDate = getTodayDate();
    
    console.log("查询最近开奖结果:", { userId, todayDate });

    // 检查是否有最近的结果，不严格限制日期
    let [resultRows] = await db.execute(
      `SELECT * FROM card_game_results 
      ORDER BY created_at DESC LIMIT 1`
    );
    
    console.log("开奖结果查询:", resultRows);

    // 如果没有结果且现在是开奖时间，则生成结果
    if (resultRows.length === 0 && isDrawTime()) {
      const result = await generateDrawResult();
      resultRows = [result];
    }

    // 如果没有结果且不是开奖时间
    if (resultRows.length === 0) {
      console.log("没有找到开奖结果");
      return res.status(404).json({ message: "没有找到开奖结果" });
    }

    const result = resultRows[0];

    // 获取用户的投注信息，不严格限制日期
    console.log("查询用户投注信息...");
    const [betRows] = await db.execute(
      `SELECT * FROM card_game_bets 
      WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    console.log("用户投注信息:", betRows);

    const response = {
      id: result.id,
      winningPosition: result.winning_position,
      created_at: result.created_at
    };

    // 如果用户有投注，添加投注信息
    if (betRows.length > 0) {
      const bet = betRows[0];
      response.userBet = {
        id: bet.id,
        selectedPosition: bet.selected_position,
        betAmount: bet.bet_amount,
        created_at: bet.created_at,
        isWin: bet.selected_position === result.winning_position
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("获取开奖结果失败:", error);
    res.status(500).json({ message: "获取开奖结果失败", error: error.message });
  }
};

// 管理员手动触发开奖
exports.triggerDraw = async (req, res) => {
  try {
    // 先检查是否已经有今天的开奖结果
    const todayDate = getTodayDate();
    const [existingResults] = await db.execute(
      `SELECT * FROM card_game_results 
      WHERE DATE(created_at) = ?`,
      [todayDate]
    );
    
    if (existingResults.length > 0) {
      return res.status(400).json({ message: "今天已经开过奖了" });
    }
    
    // 强制生成开奖结果
    const result = await generateDrawResult();
    
    res.status(200).json({
      message: "开奖已触发",
      result: {
        id: result.id,
        winningPosition: result.winning_position,
        created_at: result.created_at
      }
    });
  } catch (error) {
    console.error("手动触发开奖失败:", error);
    res.status(500).json({ message: "手动触发开奖失败", error: error.message });
  }
};

// 处理所有今日投注
const processBets = async (resultId, winningPosition) => {
  try {
    const todayDate = getTodayDate();
    
    console.log("处理今日所有投注...");
    // 获取所有今日投注
    const [betRows] = await db.execute(
      `SELECT * FROM card_game_bets 
      WHERE DATE(created_at) = ? AND result_id IS NULL`,
      [todayDate]
    );
    console.log("今日投注记录:", betRows);

    for (const bet of betRows) {
      const isWin = bet.selected_position === winningPosition;
      let reward = 0;
      
      // 计算奖励
      if (isWin) {
        // 中奖倍率为2.5倍
        reward = Math.floor(bet.bet_amount * 2.5);
        console.log("用户获胜，奖励:", { 用户: bet.user_id, 投注: bet.bet_amount, 奖励: reward });
        
        // 更新用户积分（已经扣除了投注金额，现在加上奖励）
        await db.execute(
          "UPDATE users SET points = points + ? WHERE id = ?",
          [reward, bet.user_id]
        );
        console.log("用户积分已更新");
        
        // 添加积分历史记录
        await db.execute(
          `INSERT INTO user_points_history 
           (user_id, points_gained, source) 
           VALUES (?, ?, ?)`,
          [bet.user_id, reward, '抽卡游戏中奖']
        );
        console.log("积分历史记录已添加");
      }

      // 更新投注记录
      console.log("更新投注记录...");
      await db.execute(
        `UPDATE card_game_bets 
        SET result_id = ?, is_win = ?, reward = ? 
        WHERE id = ?`,
        [resultId, isWin ? 1 : 0, reward, bet.id]
      );
      console.log("投注记录更新成功");
    }
  } catch (error) {
    console.error("处理投注失败:", error);
  }
};

// 获取游戏历史记录
exports.getGameHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log("获取游戏历史...");
    // 获取最近10天的开奖记录
    const [resultRows] = await db.execute(
      `SELECT id, winning_position, created_at 
      FROM card_game_results 
      ORDER BY created_at DESC 
      LIMIT 10`
    );
    console.log("游戏历史查询结果:", resultRows);

    // 获取用户的投注记录
    const [betRows] = await db.execute(
      `SELECT * FROM card_game_bets 
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [userId]
    );
    console.log("用户投注记录:", betRows);

    // 将结果和投注记录合并
    const history = resultRows.map(result => {
      // 查找对应的投注
      const bet = betRows.find(b => b.result_id === result.id);
      
      return {
        id: result.id,
        winning_position: result.winning_position,
        created_at: result.created_at,
        participated: bet ? true : false,
        selected_position: bet ? bet.selected_position : null,
        bet_amount: bet ? bet.bet_amount : null,
        is_win: bet ? bet.is_win === 1 : null,
        reward: bet ? bet.reward : null
      };
    });
    
    console.log("返回游戏历史:", history);
    res.status(200).json(history);
  } catch (error) {
    console.error("获取游戏历史失败:", error);
    res.status(500).json({ message: "获取游戏历史失败", error: error.message });
  }
};

// 获取玩家统计数据
exports.getPlayerStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log("获取玩家统计数据...");
    // 获取总游戏次数和胜利次数
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_games,
        SUM(CASE WHEN is_win = 1 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN is_win = 1 THEN reward - bet_amount ELSE -bet_amount END) as total_profit
      FROM card_game_bets 
      WHERE user_id = ? AND result_id IS NOT NULL`,
      [userId]
    );
    console.log("玩家统计数据:", stats[0]);

    res.status(200).json({
      total_games: stats[0].total_games || 0,
      wins: stats[0].wins || 0,
      total_profit: stats[0].total_profit || 0
    });
  } catch (error) {
    console.error("获取玩家统计失败:", error);
    res.status(500).json({ message: "获取玩家统计失败", error: error.message });
  }
};

// 获取所有用户的卡片游戏记录（管理员用）
exports.getAllCardGameRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // 获取查询参数
    const username = req.query.username;
    const result = req.query.result;  // 'win' 或 'lose'
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    console.log("获取所有卡片游戏记录...", { 
      page, pageSize, username, result, startDate, endDate 
    });
    
    // 构建查询条件
    let conditions = [];
    let params = [];
    
    // 用户名条件
    if (username) {
      conditions.push('(u.username LIKE ?)');
      params.push(`%${username}%`);
    }
    
    // 游戏结果条件
    if (result === 'win') {
      conditions.push('b.is_win = 1');
    } else if (result === 'lose') {
      conditions.push('b.is_win = 0');
    }
    
    // 日期范围条件
    if (startDate) {
      conditions.push('DATE(b.created_at) >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('DATE(b.created_at) <= ?');
      params.push(endDate);
    }
    
    // 生成 WHERE 子句
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    // 获取总记录数
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total 
       FROM card_game_bets b
       LEFT JOIN users u ON b.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // 获取指定页的游戏记录
    const queryParams = [...params, pageSize, offset];
    const [records] = await db.execute(
      `SELECT 
        b.id, b.user_id, b.selected_position, b.bet_amount, 
        b.is_win, b.reward, b.created_at,
        u.username,
        r.winning_position
      FROM card_game_bets b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN card_game_results r ON b.result_id = r.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?`,
      queryParams
    );
    
    console.log(`获取到 ${records.length} 条记录，总计 ${total} 条`);
    
    // 返回分页数据
    res.status(200).json({
      records,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error("获取卡片游戏记录失败:", error);
    res.status(500).json({ message: "获取卡片游戏记录失败", error: error.message });
  }
};

// 导出所有方法
module.exports = {
  placeBet: exports.placeBet,
  getTodayBet: exports.getTodayBet,
  getDrawResult: exports.getDrawResult,
  getGameHistory: exports.getGameHistory,
  getPlayerStats: exports.getPlayerStats,
  getAllCardGameRecords: exports.getAllCardGameRecords,
  triggerDraw: exports.triggerDraw
}; 