const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/database');
const { validationResult } = require('express-validator');

// 管理员登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证请求参数
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    // 查找管理员
    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    // 验证密码（不使用加密）
    if (password !== admin.password) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    // 更新最后登录时间
    await Admin.updateLastLogin(admin.id);
    
    // 生成JWT令牌
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username,
        role: admin.role
      }, 
      config.jwtSecret, 
      { expiresIn: '24h' }
    );
    
    // 返回登录成功信息和令牌
    return res.status(200).json({
      success: true,
      message: '登录成功',
      token,
      data: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取管理员信息
exports.getProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;
    
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: '管理员不存在' 
      });
    }
    
    // 返回管理员信息，不包含密码
    return res.status(200).json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        last_login: admin.last_login,
        created_at: admin.created_at
      }
    });
  } catch (error) {
    console.error('获取管理员信息失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 创建管理员（仅超级管理员可以操作）
exports.createAdmin = async (req, res) => {
  try {
    // 检查当前用户是否是超级管理员
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限执行此操作' 
      });
    }
    
    const { username, password, name, email, role } = req.body;
    
    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    // 检查用户名是否已存在
    const existingAdmin = await Admin.findByUsername(username);
    if (existingAdmin) {
      return res.status(409).json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }
    
    // 创建管理员
    const newAdmin = await Admin.create({
      username,
      password,
      name,
      email,
      role
    });
    
    // 返回新创建的管理员信息，不包含密码
    return res.status(201).json({
      success: true,
      message: '管理员创建成功',
      data: {
        id: newAdmin.id,
        username: newAdmin.username,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        created_at: newAdmin.created_at
      }
    });
  } catch (error) {
    console.error('创建管理员失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取所有管理员列表（仅超级管理员可以操作）
exports.getAllAdmins = async (req, res) => {
  try {
    // 检查当前用户是否是超级管理员
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限执行此操作' 
      });
    }
    
    const admins = await Admin.findAll();
    
    return res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取仪表盘数据
exports.getDashboardData = async (req, res) => {
  try {
    // 获取帖子总数
    const [postCount] = await db.execute('SELECT COUNT(*) as count FROM posts');
    
    // 获取用户总数
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    
    // 获取评论总数
    const [commentCount] = await db.execute('SELECT COUNT(*) as count FROM comments');
    
    // 获取最近7天的用户增长数据
    const [userGrowth] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    // 获取最近7天的帖子增长数据
    const [postGrowth] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM posts
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    // 获取最近7天的评论增长数据
    const [commentGrowth] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM comments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    // 获取最近7天的用户活跃度数据（基于登录、发帖、评论等活动）
    const [userActivity] = await db.execute(`
      SELECT 
        activity_date as date,
        SUM(activity_score) as count
      FROM (
        -- 帖子数 * 2
        SELECT 
          DATE(created_at) as activity_date,
          COUNT(*) * 2 as activity_score
        FROM posts
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        -- 评论数 * 1
        SELECT 
          DATE(created_at) as activity_date,
          COUNT(*) * 1 as activity_score
        FROM comments
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        -- 帖子点赞数 * 0.5
        SELECT 
          DATE(created_at) as activity_date,
          COUNT(*) * 0.5 as activity_score
        FROM likes
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        -- 评论点赞数 * 0.5
        SELECT 
          DATE(created_at) as activity_date,
          COUNT(*) * 0.5 as activity_score
        FROM comment_likes
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        -- 小记点赞数 * 0.5
        SELECT 
          DATE(created_at) as activity_date,
          COUNT(*) * 0.5 as activity_score
        FROM note_likes
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
      ) as activities
      GROUP BY activity_date
      ORDER BY activity_date
    `);
    
    // 获取最近活动（最新10条用户注册、帖子发布、评论等）
    const [recentActivities] = await db.execute(`
      (SELECT 
        'post' as type,
        p.id,
        p.title as content,
        u.username,
        p.created_at as time
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        'user' as type,
        u.id,
        '新用户注册' as content,
        u.username,
        u.created_at as time
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        'comment' as type,
        c.id,
        SUBSTRING(c.content, 1, 50) as content,
        u.username,
        c.created_at as time
      FROM comments c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 5)
      
      ORDER BY time DESC
      LIMIT 10
    `);
    
    // 处理活动数据
    const formattedActivities = recentActivities.map(item => ({
      id: `${item.type}_${item.id}`,
      type: item.type,
      content: item.type === 'user' 
        ? `用户 ${item.username} 注册了账号`
        : item.type === 'post'
          ? `用户 ${item.username} 发布了帖子: ${item.content}`
          : `用户 ${item.username} 发表了评论: ${item.content}`,
      time: new Date(item.time).toISOString()
    }));
    
    // 格式化日期函数
    const formatGrowthData = (data, days = 7) => {
      const result = [];
      const today = new Date();
      
      // 创建过去7天的日期映射
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          count: 0
        });
      }
      
      // 用实际数据填充
      data.forEach(item => {
        const dateStr = new Date(item.date).toISOString().split('T')[0];
        const existingData = result.find(d => d.date === dateStr);
        if (existingData) {
          existingData.count = parseInt(item.count);
        }
      });
      
      return result;
    };
    
    res.json({
      postCount: postCount[0].count,
      userCount: userCount[0].count,
      commentCount: commentCount[0].count,
      userGrowth: formatGrowthData(userGrowth),
      postGrowth: formatGrowthData(postGrowth),
      commentGrowth: formatGrowthData(commentGrowth),
      userActivity: formatGrowthData(userActivity),
      recentActivities: formattedActivities
    });
    
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json({ message: '获取仪表盘数据失败' });
  }
};

// 获取所有小记（管理员接口）
exports.getAllNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const orderBy = req.query.sort === 'oldest' ? 'ASC' : 'DESC';
    
    // 构建查询条件
    let whereClause = '';
    const queryParams = [];
    
    if (search) {
      whereClause = 'WHERE n.content LIKE ? OR u.username LIKE ?';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // 获取总数
    const [total] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM notes n
      JOIN users u ON n.author_id = u.id
      ${whereClause}
    `, queryParams);
    
    // 获取小记列表
    const [notes] = await db.execute(`
      SELECT 
        n.id, 
        n.content, 
        n.image, 
        n.likes, 
        n.created_at, 
        u.id AS author_id, 
        u.username AS author_name, 
        u.avatar 
      FROM 
        notes n
      JOIN 
        users u ON n.author_id = u.id
      ${whereClause}
      ORDER BY 
        n.created_at ${orderBy}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);
    
    // 转换结果格式
    const formattedNotes = notes.map(note => ({
      id: note.id,
      content: note.content,
      author: {
        id: note.author_id,
        username: note.author_name
      },
      image: note.image,
      likes: note.likes,
      createdAt: new Date(note.created_at).toISOString()
    }));
    
    res.json({
      notes: formattedNotes,
      pagination: {
        total: total[0].total,
        page,
        limit,
        pages: Math.ceil(total[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取小记列表失败:', error);
    res.status(500).json({ message: '获取小记列表失败' });
  }
};

// 创建小记（管理员接口）
exports.createNote = async (req, res) => {
  try {
    const { content, authorId, image } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: '内容不能为空' });
    }
    
    if (!authorId) {
      return res.status(400).json({ message: '作者ID不能为空' });
    }
    
    // 检查用户是否存在
    const [user] = await db.execute('SELECT id FROM users WHERE id = ?', [authorId]);
    if (user.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 创建小记
    const [result] = await db.execute(
      'INSERT INTO notes (content, author_id, image) VALUES (?, ?, ?)',
      [content, authorId, image || null]
    );
    
    // 获取创建的小记信息
    const [newNote] = await db.execute(`
      SELECT 
        n.id, 
        n.content, 
        n.image, 
        n.likes, 
        n.created_at, 
        u.id AS author_id, 
        u.username AS author_name
      FROM 
        notes n
      JOIN 
        users u ON n.author_id = u.id
      WHERE 
        n.id = ?
    `, [result.insertId]);
    
    if (newNote.length === 0) {
      return res.status(500).json({ message: '小记创建成功但无法获取详情' });
    }
    
    const note = newNote[0];
    res.status(201).json({
      message: '小记创建成功',
      note: {
        id: note.id,
        content: note.content,
        author: {
          id: note.author_id,
          username: note.author_name
        },
        image: note.image,
        likes: note.likes,
        createdAt: new Date(note.created_at).toISOString()
      }
    });
  } catch (error) {
    console.error('创建小记失败:', error);
    res.status(500).json({ message: '创建小记失败' });
  }
};

// 删除小记（管理员接口）
exports.deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    
    // 检查小记是否存在
    const [existingNote] = await db.execute('SELECT id FROM notes WHERE id = ?', [noteId]);
    if (existingNote.length === 0) {
      return res.status(404).json({ message: '小记不存在' });
    }
    
    // 删除小记
    await db.execute('DELETE FROM notes WHERE id = ?', [noteId]);
    
    res.json({ message: '小记删除成功' });
  } catch (error) {
    console.error('删除小记失败:', error);
    res.status(500).json({ message: '删除小记失败' });
  }
};

// 获取所有任务
exports.getAllTasks = async (req, res) => {
  try {
    // 查询所有任务
    const [tasks] = await db.execute(
      `SELECT * FROM tasks ORDER BY id ASC`
    );
    
    res.json({ tasks });
  } catch (error) {
    console.error("获取任务列表失败:", error);
    res.status(500).json({ message: "获取任务列表失败" });
  }
};

// 获取任务详情
exports.getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const [tasks] = await db.execute(
      `SELECT 
        id, title, description, reward, target, 
        task_type, is_active, created_at, updated_at, points_reward
      FROM tasks 
      WHERE id = ?`,
      [taskId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    const task = tasks[0];
    
    // 查询任务完成情况统计（最近7天）
    const [completionStats] = await db.execute(
      `SELECT 
        DATE(completed_at) as date, 
        COUNT(*) as count
      FROM user_tasks
      WHERE task_type = ? AND completed_at IS NOT NULL
      AND completed_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date ASC`,
      [task.task_type]
    );
    
    // 格式化任务数据
    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.task_type,
      exp_reward: task.reward,
      points_reward: task.points_reward || 0,
      daily_limit: task.target,
      status: task.is_active ? 'active' : 'inactive',
      created_at: task.created_at,
      updated_at: task.updated_at,
      completionStats
    };
    
    res.json(formattedTask);
  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({ message: '获取任务详情失败' });
  }
};

// 获取任务列表
exports.getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const orderBy = req.query.orderBy || 'created_at';
    const orderDirection = req.query.orderDirection || 'DESC';
    
    // 构建查询条件
    let whereClause = '';
    const queryParams = [];
    
    if (search) {
      whereClause = `WHERE title LIKE ? OR description LIKE ?`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // 查询任务总数
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM tasks ${whereClause}`,
      queryParams
    );
    
    const total = countResult[0].total;
    
    // 查询任务列表
    const [tasks] = await db.execute(
      `SELECT 
        id, title, description, reward, target, 
        created_at, updated_at, is_active, task_type, points_reward
      FROM tasks 
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // 格式化任务数据以匹配前端期望
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.task_type,
      exp_reward: task.reward,
      points_reward: task.points_reward || 0,
      daily_limit: task.target,
      status: task.is_active ? 'active' : 'inactive',
      created_at: task.created_at,
      updated_at: task.updated_at
    }));
    
    res.json({
      total,
      tasks: formattedTasks,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ message: '获取任务列表失败' });
  }
};

// 创建任务
exports.createTask = async (req, res) => {
  try {
    const { title, description, type, expReward, pointsReward, dailyLimit, status } = req.body;
    
    // 验证必填字段
    if (!title || !description || !type) {
      return res.status(400).json({ message: '标题、描述和类型为必填字段' });
    }
    
    // 插入任务
    const [result] = await db.execute(
      `INSERT INTO tasks (
        title, description, reward, points_reward, target, is_active, task_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        expReward || 0,
        pointsReward || 0,
        dailyLimit || 1,
        status === 'active' ? 1 : 0,
        type
      ]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: '任务创建成功'
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ message: '创建任务失败' });
  }
};

// 更新任务
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, type, expReward, pointsReward, dailyLimit, status } = req.body;
    
    // 检查任务是否存在
    const [tasks] = await db.execute(
      'SELECT id FROM tasks WHERE id = ?',
      [taskId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    // 构建更新字段
    const updateFields = [];
    const queryParams = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      queryParams.push(title);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      queryParams.push(description);
    }
    
    if (expReward !== undefined) {
      updateFields.push('reward = ?');
      queryParams.push(expReward);
    }
    
    if (pointsReward !== undefined) {
      updateFields.push('points_reward = ?');
      queryParams.push(pointsReward);
    }
    
    if (dailyLimit !== undefined) {
      updateFields.push('target = ?');
      queryParams.push(dailyLimit);
    }
    
    if (status !== undefined) {
      updateFields.push('is_active = ?');
      queryParams.push(status === 'active' ? 1 : 0);
    }
    
    if (type !== undefined) {
      updateFields.push('task_type = ?');
      queryParams.push(type);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: '没有提供需要更新的字段' });
    }
    
    // 添加更新时间
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // 执行更新
    await db.execute(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
      [...queryParams, taskId]
    );
    
    res.json({ message: '任务更新成功' });
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({ message: '更新任务失败' });
  }
};

// 删除任务
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // 检查任务是否存在
    const [tasks] = await db.execute(
      'SELECT id FROM tasks WHERE id = ?',
      [taskId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    // 执行删除任务操作
    await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
    
    res.json({ message: '任务删除成功' });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ message: '删除任务失败' });
  }
};

// 获取系统设置值
exports.getSystemSetting = async (req, res) => {
  try {
    const key = req.params.key;
    
    // 获取设置值
    const [settings] = await db.execute(
      `SELECT * FROM system_settings WHERE \`key\` = ?`,
      [key]
    );
    
    if (settings.length === 0) {
      return res.status(404).json({ message: "设置不存在" });
    }
    
    res.json({
      key: settings[0].key,
      value: settings[0].value,
      description: settings[0].description
    });
  } catch (error) {
    console.error("获取系统设置失败:", error);
    res.status(500).json({ message: "获取系统设置失败" });
  }
};

// 更新系统设置值
exports.updateSystemSetting = async (req, res) => {
  try {
    const key = req.params.key;
    const { value } = req.body;
    
    // 验证参数
    if (!value) {
      return res.status(400).json({ message: "缺少value参数" });
    }
    
    // 检查设置是否存在
    const [settings] = await db.execute(
      `SELECT * FROM system_settings WHERE \`key\` = ?`,
      [key]
    );
    
    if (settings.length === 0) {
      return res.status(404).json({ message: "设置不存在" });
    }
    
    // 更新设置值
    await db.execute(
      `UPDATE system_settings SET value = ? WHERE \`key\` = ?`,
      [value, key]
    );
    
    res.json({ message: "设置更新成功" });
  } catch (error) {
    console.error("更新系统设置失败:", error);
    res.status(500).json({ message: "更新系统设置失败" });
  }
};

// 获取用户列表
exports.getUserList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const orderBy = req.query.orderBy || 'created_at';
    const orderDirection = req.query.orderDirection || 'DESC';
    
    // 构建查询条件
    let whereClause = '';
    const queryParams = [];
    
    if (search) {
      whereClause = `WHERE username LIKE ? OR email LIKE ? OR phone LIKE ?`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // 处理排序字段名称映射
    let dbOrderBy = orderBy;
    if (orderBy === 'exp_points') {
      dbOrderBy = 'experience';
    } else if (orderBy === 'last_login_at') {
      dbOrderBy = 'last_active';
    }
    
    // 查询用户总数
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    
    const total = countResult[0].total;
    
    // 查询用户列表
    const [users] = await db.execute(
      `SELECT 
        id, username, email, phone, avatar, bio, created_at, last_active,
        status, experience, level, title, post_streak, points
      FROM users 
      ${whereClause}
      ORDER BY ${dbOrderBy} ${orderDirection}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // 处理用户数据
    const formattedUsers = users.map(user => {
      // 将status转换为字符串以确保一致的比较
      const statusStr = String(user.status).toLowerCase();
      console.log('User status in DB:', user.username, statusStr, typeof user.status);
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        createdAt: user.created_at,
        lastLoginAt: user.last_active,
        status: statusStr.includes('online') ? '已启用' : '已禁用',
        experience: user.experience || 0,
        level: user.level || 1,
        points: user.points || 0,
        title: user.title || '',
        post_streak: user.post_streak || 0
      };
    });
    
    res.json({
      total,
      users: formattedUsers,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
};

// 获取用户详情
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 查询用户信息
    const [users] = await db.execute(
      `SELECT 
        id, username, email, phone, avatar, bio, created_at, last_active,
        status, experience, level, title, post_streak, points
      FROM users 
      WHERE id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const user = users[0];
    
    // 查询用户发帖数
    const [postCountResult] = await db.execute(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [userId]
    );
    
    // 查询用户评论数
    const [commentCountResult] = await db.execute(
      'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
      [userId]
    );
    
    // 查询用户获赞数
    const [likesReceivedResult] = await db.execute(
      `SELECT COUNT(*) as count FROM likes
       WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)`,
      [userId]
    );
    
    // 将status转换为字符串以确保一致的比较
    const statusStr = String(user.status).toLowerCase();
    console.log('User detail status in DB:', user.username, statusStr, typeof user.status);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      createdAt: user.created_at,
      lastLoginAt: user.last_active,
      status: statusStr.includes('online') ? '已启用' : '已禁用',
      experience: user.experience || 0,
      level: user.level || 1,
      points: user.points || 0,
      title: user.title || '',
      post_streak: user.post_streak || 0,
      stats: {
        posts: postCountResult[0].count,
        comments: commentCountResult[0].count,
        likesReceived: likesReceivedResult[0].count
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ message: '获取用户详情失败' });
  }
};

// 更新用户信息
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, phone, bio, role, status, experience, title, post_streak, points } = req.body;
    
    // 检查用户是否存在
    const [users] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 构建更新字段
    const updateFields = [];
    const queryParams = [];
    
    if (username !== undefined) {
      updateFields.push('username = ?');
      queryParams.push(username);
    }
    
    if (email !== undefined) {
      updateFields.push('email = ?');
      queryParams.push(email);
    }
    
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      queryParams.push(phone || null);
    }
    
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      queryParams.push(bio || null);
    }
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      // 转换前端状态值为数据库值
      const dbStatus = status === '已启用' ? 'online' : 'offline';
      console.log('更新用户状态:', status, '->', dbStatus);
      queryParams.push(dbStatus);
    }
    
    // 添加经验值更新逻辑
    if (experience !== undefined) {
      updateFields.push('experience = ?');
      queryParams.push(parseInt(experience) || 0);
      console.log('更新用户经验值:', experience);
    }
    
    // 添加积分更新逻辑
    if (points !== undefined) {
      updateFields.push('points = ?');
      queryParams.push(parseInt(points) || 0);
      console.log('更新用户积分:', points);
    }
    
    // 添加新的称号字段
    if ('title' in req.body) {  // 使用 'in' 操作符检查属性是否存在
      updateFields.push('title = ?');
      queryParams.push(title);
      console.log('更新用户称号:', title);
    }
    
    // 添加新的连续发帖字段
    if (post_streak !== undefined) {
      updateFields.push('post_streak = ?');
      queryParams.push(post_streak);
      console.log('更新用户连续发帖天数:', post_streak);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: '没有提供需要更新的字段' });
    }
    
    // 执行更新
    if (updateFields.length > 0) {
      await db.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        [...queryParams, userId]
      );
    }
    
    res.json({ message: '用户更新成功' });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ message: '更新用户失败' });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 检查用户是否存在
    const [users] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 执行删除用户操作
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ message: '删除用户失败' });
  }
};

// 删除帖子（管理员权限）
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    console.log(`尝试删除帖子，ID: ${postId}`);
    
    // 检查帖子是否存在
    const [posts] = await db.execute(
      "SELECT * FROM posts WHERE id = ?",
      [postId]
    );
    
    console.log(`查询结果: 找到 ${posts.length} 个帖子`);
    if (posts.length > 0) {
      console.log(`帖子信息:`, JSON.stringify(posts[0]));
    }
    
    if (posts.length === 0) {
      console.log(`未找到ID为 ${postId} 的帖子`);
      return res.status(404).json({ message: "帖子不存在" });
    }
    
    // 管理员有权直接删除任何帖子，无需检查用户权限
    console.log(`准备删除帖子，ID: ${postId}`);
    await db.execute("DELETE FROM posts WHERE id = ?", [postId]);
    console.log(`帖子已删除，ID: ${postId}`);
    
    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除帖子失败:", error);
    res.status(500).json({ message: "删除失败" });
  }
};

// 获取待审核的帖子列表
exports.getPendingPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 查询待审核的帖子
    const [posts] = await db.execute(
      `SELECT 
        p.id, p.user_id, p.title, p.content, p.images, p.created_at, p.status,
        u.username as author_name, u.avatar as author_avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    // 获取总数
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM posts WHERE status = 'pending'"
    );
    
    const total = countResult[0].total;
    
    return res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取待审核帖子失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取待审核的评论列表
exports.getPendingComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 查询待审核的评论
    const [comments] = await db.execute(
      `SELECT 
        c.id, c.post_id, c.user_id, c.content, c.images, c.created_at, c.status,
        u.username as author_name, u.avatar as author_avatar,
        p.title as post_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE c.status = 'pending'
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    // 获取总数
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM comments WHERE status = 'pending'"
    );
    
    const total = countResult[0].total;
    
    return res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取待审核评论失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取待审核的小记列表
exports.getPendingNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 查询待审核的小记
    const [notes] = await db.execute(
      `SELECT 
        n.id, n.author_id, n.content, n.image, n.created_at, n.status,
        u.username as author_name, u.avatar as author_avatar
      FROM notes n
      JOIN users u ON n.author_id = u.id
      WHERE n.status = 'pending'
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    // 获取总数
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM notes WHERE status = 'pending'"
    );
    
    const total = countResult[0].total;
    
    return res.status(200).json({
      success: true,
      data: {
        notes,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取待审核小记失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新帖子审核状态
exports.updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态值无效，必须是 approved 或 rejected'
      });
    }
    
    // 检查帖子是否存在
    const [posts] = await db.execute(
      "SELECT id FROM posts WHERE id = ?",
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 更新状态
    await db.execute(
      "UPDATE posts SET status = ? WHERE id = ?",
      [status, id]
    );
    
    return res.status(200).json({
      success: true,
      message: `帖子已${status === 'approved' ? '通过审核' : '拒绝'}`
    });
  } catch (error) {
    console.error('更新帖子状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新评论审核状态
exports.updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态值无效，必须是 approved 或 rejected'
      });
    }
    
    // 检查评论是否存在和获取相关信息
    const [comments] = await db.execute(
      `SELECT c.id, c.user_id, p.id AS post_id, p.user_id AS post_author_id, p.title 
       FROM comments c
       JOIN posts p ON c.post_id = p.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 更新状态
    await db.execute(
      "UPDATE comments SET status = ? WHERE id = ?",
      [status, id]
    );
    
    // 如果评论被批准，且不是作者评论自己的帖子，则发送通知
    if (status === 'approved' && comments[0].user_id !== comments[0].post_author_id) {
      const { createNotification } = require('./notificationController');
      await createNotification({
        userId: comments[0].post_author_id,
        type: "comment",
        content: `评论了你的帖子: ${comments[0].title || ''}`,
        sourceId: comments[0].post_id || null,
        sourceType: "post",
        actorId: comments[0].user_id || null,
        relatedId: comments[0].id || null
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `评论已${status === 'approved' ? '通过审核' : '拒绝'}`
    });
  } catch (error) {
    console.error('更新评论状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新小记审核状态
exports.updateNoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态值无效，必须是 approved 或 rejected'
      });
    }
    
    // 检查小记是否存在
    const [notes] = await db.execute(
      "SELECT id FROM notes WHERE id = ?",
      [id]
    );
    
    if (notes.length === 0) {
      return res.status(404).json({
        success: false,
        message: '小记不存在'
      });
    }
    
    // 更新状态
    await db.execute(
      "UPDATE notes SET status = ? WHERE id = ?",
      [status, id]
    );
    
    return res.status(200).json({
      success: true,
      message: `小记已${status === 'approved' ? '通过审核' : '拒绝'}`
    });
  } catch (error) {
    console.error('更新小记状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取举报列表
exports.getReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'pending'; // 默认查询待处理的举报
    
    // 查询举报列表
    const [reports] = await db.execute(
      `SELECT 
        r.id, r.reporter_id, r.reported_type, r.reported_id, r.reason, 
        r.status, r.created_at, r.processed_at,
        u.username as reporter_name, u.avatar as reporter_avatar
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );
    
    // 获取总数
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM reports WHERE status = ?",
      [status]
    );
    
    const total = countResult[0].total;
    
    return res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取举报列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取举报详情
exports.getReportDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询举报详情
    const [reports] = await db.execute(
      `SELECT 
        r.*, 
        u.username as reporter_name, u.avatar as reporter_avatar,
        a.username as processor_name
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      LEFT JOIN admins a ON r.processed_by = a.id
      WHERE r.id = ?`,
      [id]
    );
    
    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: '举报不存在'
      });
    }
    
    const report = reports[0];
    let reportedContent = null;
    
    // 根据举报类型获取被举报的内容
    if (report.reported_type === 'post') {
      const [posts] = await db.execute(
        `SELECT 
          p.*, u.username as author_name, u.avatar as author_avatar
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?`,
        [report.reported_id]
      );
      
      if (posts.length > 0) {
        reportedContent = {
          type: 'post',
          ...posts[0]
        };
      }
    } else if (report.reported_type === 'comment') {
      const [comments] = await db.execute(
        `SELECT 
          c.*, u.username as author_name, u.avatar as author_avatar,
          p.id as post_id, p.title as post_title
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN posts p ON c.post_id = p.id
        WHERE c.id = ?`,
        [report.reported_id]
      );
      
      if (comments.length > 0) {
        reportedContent = {
          type: 'comment',
          ...comments[0]
        };
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        report,
        reportedContent
      }
    });
  } catch (error) {
    console.error('获取举报详情失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新举报状态
exports.updateReportStatus = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status, action } = req.body;
    const adminId = req.admin.id;
    
    if (!['processed', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态值无效，必须是 processed 或 dismissed'
      });
    }
    
    // 查询举报是否存在
    const [reports] = await db.execute(
      "SELECT * FROM reports WHERE id = ?",
      [id]
    );
    
    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: '举报不存在'
      });
    }
    
    const report = reports[0];
    
    // 获取连接并开始事务
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // 更新举报状态
      await connection.execute(
        "UPDATE reports SET status = ?, processed_by = ?, processed_at = NOW() WHERE id = ?",
        [status, adminId, id]
      );
      
      // 如果是处理并且需要采取行动，处理被举报的内容
      if (status === 'processed' && action) {
        if (report.reported_type === 'post') {
          if (action === 'delete') {
            // 删除帖子
            await connection.execute(
              "DELETE FROM posts WHERE id = ?",
              [report.reported_id]
            );
          } else if (action === 'reject') {
            // 将帖子设置为拒绝状态
            await connection.execute(
              "UPDATE posts SET status = 'rejected' WHERE id = ?",
              [report.reported_id]
            );
          }
        } else if (report.reported_type === 'comment') {
          if (action === 'delete') {
            // 删除评论
            await connection.execute(
              "DELETE FROM comments WHERE id = ?",
              [report.reported_id]
            );
          } else if (action === 'reject') {
            // 将评论设置为拒绝状态
            await connection.execute(
              "UPDATE comments SET status = 'rejected' WHERE id = ?",
              [report.reported_id]
            );
          }
        }
      }
      
      // 提交事务
      await connection.commit();
      
      return res.status(200).json({
        success: true,
        message: `举报已${status === 'processed' ? '处理' : '驳回'}`
      });
    } catch (error) {
      // 回滚事务
      if (connection) await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('更新举报状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取所有公告
exports.getAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 获取公告总数
    const [countResult] = await db.execute('SELECT COUNT(*) as total FROM announcements');
    const total = countResult[0].total;
    
    // 获取分页后的公告列表
    const [announcements] = await db.execute(`
      SELECT a.*, u.username as author_name, u.avatar as author_avatar 
      FROM announcements a 
      LEFT JOIN users u ON a.author_id = u.id 
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    // 处理图片JSON
    const processedAnnouncements = announcements.map(announcement => {
      const processed = { ...announcement };
      
      if (processed.images) {
        try {
          // 如果是字符串，尝试解析为JSON
          if (typeof processed.images === 'string') {
            try {
              processed.images = JSON.parse(processed.images);
              
              // 确保是数组
              if (!Array.isArray(processed.images)) {
                // 如果解析后不是数组，但包含http，可能是单个URL
                if (typeof processed.images === 'string' && processed.images.includes('http')) {
                  processed.images = [processed.images];
                } else {
                  processed.images = [];
                }
              }
            } catch (e) {
              console.error(`解析公告ID:${processed.id}的图片数据失败:`, e);
              // 如果解析失败但是包含http，可能是单个URL
              if (processed.images.includes('http')) {
                processed.images = [processed.images];
              } else {
                processed.images = [];
              }
            }
          } else if (Array.isArray(processed.images)) {
            // 如果已经是数组，不需要处理
          } else {
            processed.images = [];
          }
        } catch (e) {
          console.error(`处理公告ID:${processed.id}的图片数据失败:`, e);
          processed.images = [];
        }
      } else {
        processed.images = [];
      }
      
      return processed;
    });
    
    return res.json({
      announcements: processedAnnouncements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('管理员获取公告列表失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个公告详情
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [announcements] = await db.execute(`
      SELECT a.*, u.username, u.avatar 
      FROM announcements a 
      LEFT JOIN users u ON a.author_id = u.id 
      WHERE a.id = ?
    `, [id]);
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: '找不到该公告' });
    }
    
    const announcement = { ...announcements[0] };
    
    // 解析图片JSON
    if (announcement.images) {
      try {
        // 如果是字符串，尝试解析为JSON
        if (typeof announcement.images === 'string') {
          try {
            announcement.images = JSON.parse(announcement.images);
            
            // 确保是数组
            if (!Array.isArray(announcement.images)) {
              // 如果解析后不是数组，但包含http，可能是单个URL
              if (typeof announcement.images === 'string' && announcement.images.includes('http')) {
                announcement.images = [announcement.images];
              } else {
                announcement.images = [];
              }
            }
          } catch (e) {
            console.error(`解析公告ID:${announcement.id}的图片数据失败:`, e);
            // 如果解析失败但是包含http，可能是单个URL
            if (announcement.images.includes('http')) {
              announcement.images = [announcement.images];
            } else {
              announcement.images = [];
            }
          }
        } else if (Array.isArray(announcement.images)) {
          // 如果已经是数组，不需要处理
        } else {
          announcement.images = [];
        }
      } catch (e) {
        console.error(`处理公告ID:${announcement.id}的图片数据失败:`, e);
        announcement.images = [];
      }
    } else {
      announcement.images = [];
    }
    
    // 构造作者信息
    announcement.author = {
      id: announcement.author_id,
      username: announcement.username,
      avatar: announcement.avatar
    };
    
    // 删除多余字段
    delete announcement.username;
    delete announcement.avatar;
    
    return res.json({ announcement });
  } catch (error) {
    console.error('管理员获取公告详情失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 创建新公告
exports.createAnnouncement = async (req, res) => {
  try {
    console.log('接收到的创建公告请求:', req.body);
    console.log('上传的文件:', req.files);
    
    const { title, content } = req.body;
    // 从认证中间件获取admin.id，如果不存在则尝试从用户表中获取一个有效的ID
    let author_id = req.admin?.id;
    
    if (!author_id) {
      console.log('找不到admin.id，尝试从用户表中获取一个管理员ID');
      // 尝试从admins表中获取一个管理员ID
      const [admins] = await db.execute('SELECT id FROM admins LIMIT 1');
      if (admins && admins.length > 0) {
        author_id = admins[0].id;
      } else {
        // 如果admins表中没有记录，则尝试从users表中获取一个用户ID
        const [users] = await db.execute('SELECT id FROM users LIMIT 1');
        if (users && users.length > 0) {
          author_id = users[0].id;
        } else {
          // 最后的备选方案，使用ID 1
          author_id = 1;
        }
      }
    }
    
    // 确保author_id是个有效的正整数
    author_id = Math.abs(parseInt(author_id) || 1);
    
    console.log('创建公告，作者ID:', author_id);
    
    let images = [];
    
    // 处理图片上传
    if (req.files && req.files.length > 0) {
      // 修改图片路径前缀，确保路径正确
      images = req.files.map(file => {
        // 从文件路径中提取文件名
        const filename = file.filename;
        // 返回完整的访问URL
        return `http://47.98.210.7:3000/uploads/announcements/${filename}`;
      });
      console.log('上传的图片完整路径:', images);
    }

    // 确保图片列表是有效的JSON字符串
    const imagesJson = JSON.stringify(images);
    console.log('最终图片JSON:', imagesJson);

    // 插入公告记录
    const [result] = await db.execute(
      'INSERT INTO announcements (title, content, author_id, images) VALUES (?, ?, ?, ?)',
      [title, content, author_id, imagesJson]
    );
    
    // 获取创建的公告
    const [announcements] = await db.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [result.insertId]
    );
    
    // 解析返回的公告对象中的images字段
    let announcement = { ...announcements[0] };
    if (announcement && announcement.images) {
      try {
        // 确保返回的图片数据是数组
        if (typeof announcement.images === 'string') {
          try {
            announcement.images = JSON.parse(announcement.images);
          } catch (e) {
            console.error('解析公告图片失败:', e);
            // 如果解析失败但是包含http链接，作为单个URL处理
            if (announcement.images.includes('http')) {
              announcement.images = [announcement.images];
            } else {
              announcement.images = [];
            }
          }
        } else if (!Array.isArray(announcement.images)) {
          announcement.images = [];
        }
      } catch (e) {
        console.error('处理公告图片失败:', e);
        announcement.images = [];
      }
    } else {
      announcement.images = [];
    }
    
    try {
      // 发送系统通知给所有用户 - 但如果失败不中断流程
      await db.execute(
        'INSERT INTO notifications (user_id, actor_id, content, type, source_type, source_id) SELECT id, ?, ?, ?, ?, ? FROM users',
        [author_id, `发布了新公告: ${title}`, 'system', 'announcement', result.insertId]
      );
    } catch (notificationError) {
      console.error('发送公告通知失败:', notificationError);
      // 继续执行，不中断创建公告的流程
    }
    
    return res.status(201).json({ 
      message: '公告创建成功',
      announcement: announcement
    });
  } catch (error) {
    console.error('管理员创建公告失败:', error);
    return res.status(500).json({ message: `服务器错误: ${error.message}` });
  }
};

// 更新公告
exports.updateAnnouncement = async (req, res) => {
  try {
    console.log('接收到的更新公告请求:', { params: req.params, body: req.body, files: req.files });
    
    const { id } = req.params;
    const { title, content, existingImages } = req.body;
    
    // 检查公告是否存在
    const [announcements] = await db.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: '找不到该公告' });
    }
    
    // 处理现有图片
    let images = [];
    
    if (existingImages) {
      try {
        // 尝试解析existingImages字段
        if (typeof existingImages === 'string') {
          try {
            // 尝试作为JSON解析
            images = JSON.parse(existingImages);
            console.log('从JSON成功解析现有图片:', images);
          } catch (e) {
            // 如果不是有效的JSON，但是以 [ 开头，可能是数组形式的字符串
            if (existingImages.trim().startsWith('[')) {
              console.log('尝试作为数组处理现有图片');
              // 移除非法字符，尝试再次解析
              const cleanedJson = existingImages.replace(/(\r\n|\n|\r)/gm, "").trim();
              try {
                images = JSON.parse(cleanedJson);
              } catch (e2) {
                console.error('第二次尝试解析现有图片失败:', e2);
                // 如果还是失败，则当作单个URL处理
                if (existingImages.includes('http')) {
                  images = [existingImages];
                }
              }
            } else if (existingImages.includes('http')) {
              // 如果包含http，可能是单个URL
              console.log('作为单个URL处理现有图片');
              images = [existingImages];
            }
          }
        } else if (Array.isArray(existingImages)) {
          // 如果已经是数组，直接使用
          images = existingImages;
          console.log('现有图片已经是数组:', images);
        }
      } catch (e) {
        console.error('处理现有图片失败:', e);
        // 默认为空数组
        images = [];
      }
    } else if (announcements[0].images) {
      // 从数据库获取现有图片
      try {
        if (typeof announcements[0].images === 'string') {
          // 检查是否是JSON字符串
          if (announcements[0].images.trim().startsWith('[') || 
              announcements[0].images.trim().startsWith('{')) {
            try {
              images = JSON.parse(announcements[0].images);
            } catch (e) {
              console.error('解析数据库中的图片JSON失败:', e);
              // 检查是否包含http链接
              if (announcements[0].images.includes('http')) {
                console.log('数据库图片作为单个URL处理');
                images = [announcements[0].images];
              } else {
                images = [];
              }
            }
          } else if (announcements[0].images.includes('http')) {
            // 单个URL
            console.log('数据库图片作为单个URL处理');
            images = [announcements[0].images];
          } else {
            images = [];
          }
        } else if (Array.isArray(announcements[0].images)) {
          // 如果已经是数组
          images = announcements[0].images;
        } else {
          images = [];
        }
      } catch (e) {
        console.error('解析数据库中的图片失败:', e);
        images = [];
      }
    }
    
    console.log('处理后的现有图片:', images);
    
    // 处理新上传的图片
    if (req.files && req.files.length > 0) {
      // 修改图片路径前缀，确保路径正确
      const newImages = req.files.map(file => {
        // 从文件路径中提取文件名
        const filename = file.filename;
        // 返回完整的访问URL
        return `http://47.98.210.7:3000/uploads/announcements/${filename}`;
      });
      console.log('新上传的图片:', newImages);
      
      // 确保images是数组
      if (!Array.isArray(images)) {
        images = [];
      }
      
      images = [...images, ...newImages];
    }
    
    console.log('最终图片列表:', images);
    
    // 确保图片列表是有效的JSON字符串
    const imagesJson = JSON.stringify(images);
    console.log('最终图片JSON:', imagesJson);
    
    // 更新公告
    await db.execute(
      'UPDATE announcements SET title = ?, content = ?, images = ? WHERE id = ?',
      [title, content, imagesJson, id]
    );
    
    // 获取更新后的公告
    const [updatedAnnouncements] = await db.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    // 处理返回的图片数据
    let processedAnnouncement = { ...updatedAnnouncements[0] };
    
    if (processedAnnouncement && processedAnnouncement.images) {
      try {
        // 确保返回的图片数据是数组
        if (typeof processedAnnouncement.images === 'string') {
          try {
            processedAnnouncement.images = JSON.parse(processedAnnouncement.images);
          } catch (e) {
            console.error('解析更新后的图片数据失败:', e);
            // 如果解析失败但是包含http链接，作为单个URL处理
            if (processedAnnouncement.images.includes('http')) {
              processedAnnouncement.images = [processedAnnouncement.images];
            } else {
              processedAnnouncement.images = [];
            }
          }
        } else if (!Array.isArray(processedAnnouncement.images)) {
          processedAnnouncement.images = [];
        }
      } catch (e) {
        console.error('处理更新后的图片数据失败:', e);
        processedAnnouncement.images = [];
      }
    } else {
      processedAnnouncement.images = [];
    }
    
    return res.json({ 
      message: '公告更新成功',
      announcement: processedAnnouncement
    });
  } catch (error) {
    console.error('管理员更新公告失败:', error);
    return res.status(500).json({ message: `服务器错误: ${error.message}` });
  }
};

// 删除公告
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查公告是否存在
    const [announcements] = await db.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: '找不到该公告' });
    }
    
    // 删除相关通知
    await db.execute(
      'DELETE FROM notifications WHERE source_type = "announcement" AND source_id = ?',
      [id]
    );
    
    // 删除公告
    await db.execute('DELETE FROM announcements WHERE id = ?', [id]);
    
    return res.json({ message: '公告删除成功' });
  } catch (error) {
    console.error('管理员删除公告失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 添加或取消置顶帖子
exports.togglePinPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { is_pinned } = req.body;
    
    // 检查帖子是否存在
    const [existingPost] = await db.execute(
      `SELECT * FROM posts WHERE id = ?`,
      [postId]
    );
    
    if (existingPost.length === 0) {
      return res.status(404).json({ message: "帖子不存在" });
    }
    
    // 更新帖子的置顶状态
    await db.execute(
      `UPDATE posts SET is_pinned = ? WHERE id = ?`,
      [is_pinned, postId]
    );
    
    return res.status(200).json({ 
      message: is_pinned ? "帖子已置顶" : "帖子已取消置顶",
      is_pinned
    });
  } catch (error) {
    console.error("操作帖子置顶状态错误:", error);
    return res.status(500).json({ message: "操作失败，请稍后再试" });
  }
};

// 获取用户称号
exports.getUserTitle = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [users] = await db.execute(
      `SELECT id, username, title, post_streak, last_post_date FROM users WHERE id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    // 查询用户发帖数
    const [postStats] = await db.execute(
      `SELECT COUNT(*) as total_posts 
       FROM posts 
       WHERE user_id = ? AND status = 'approved'`,
      [userId]
    );
    
    const user = users[0];
    const userData = {
      id: user.id,
      username: user.username,
      title: user.title,
      post_streak: user.post_streak || 0,
      last_post_date: user.last_post_date,
      total_posts: postStats[0].total_posts || 0
    };
    
    res.json({
      success: true,
      data: userData
    });
    
  } catch (error) {
    console.error('获取用户称号失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户称号失败' 
    });
  }
};

// 更新用户称号
exports.updateUserTitle = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { title } = req.body;
    
    // 验证用户是否存在
    const [users] = await db.execute(
      `SELECT id FROM users WHERE id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    // 更新用户称号
    await db.execute(
      `UPDATE users SET title = ? WHERE id = ?`,
      [title, userId]
    );
    
    res.json({
      success: true,
      message: '用户称号已更新'
    });
    
  } catch (error) {
    console.error('更新用户称号失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新用户称号失败' 
    });
  }
};

// 强制重新计算所有用户称号
exports.recalculateAllTitles = async (req, res) => {
  try {
    const titleService = require('../services/titleService');
    const result = await titleService.forceUpdateAllTitles();
    
    res.json({
      success: true,
      message: '所有用户称号已重新计算'
    });
  } catch (error) {
    console.error('重新计算所有用户称号失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '重新计算所有用户称号失败' 
    });
  }
};

// 获取所有积分商品（管理员）
exports.getAllPointsProducts = async (req, res) => {
  try {
    const [products] = await db.execute(
      `SELECT id, name, description, image_url, points_cost, quantity, is_active, created_at, updated_at
       FROM points_products
       ORDER BY created_at DESC`
    );

    res.status(200).json(products);
  } catch (error) {
    console.error("获取积分商品列表失败:", error);
    res.status(500).json({ message: "获取积分商品列表失败" });
  }
};

// 添加积分商品
exports.addPointsProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, image_url, points_cost, quantity, is_active } = req.body;

    const [result] = await db.execute(
      `INSERT INTO points_products 
       (name, description, image_url, points_cost, quantity, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, image_url, points_cost, quantity, is_active || true]
    );

    res.status(201).json({
      message: "积分商品添加成功",
      productId: result.insertId
    });
  } catch (error) {
    console.error("添加积分商品失败:", error);
    res.status(500).json({ message: "添加积分商品失败" });
  }
};

// 更新积分商品
exports.updatePointsProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const productId = req.params.id;
    const { name, description, image_url, points_cost, quantity, is_active } = req.body;

    const updateFields = [];
    const queryParams = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      queryParams.push(name);
    }

    if (description !== undefined) {
      updateFields.push("description = ?");
      queryParams.push(description);
    }

    if (image_url !== undefined) {
      updateFields.push("image_url = ?");
      queryParams.push(image_url);
    }

    if (points_cost !== undefined) {
      updateFields.push("points_cost = ?");
      queryParams.push(points_cost);
    }

    if (quantity !== undefined) {
      updateFields.push("quantity = ?");
      queryParams.push(quantity);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      queryParams.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "没有提供要更新的字段" });
    }

    queryParams.push(productId);

    await db.execute(
      `UPDATE points_products 
       SET ${updateFields.join(", ")} 
       WHERE id = ?`,
      queryParams
    );

    res.status(200).json({ message: "积分商品更新成功" });
  } catch (error) {
    console.error("更新积分商品失败:", error);
    res.status(500).json({ message: "更新积分商品失败" });
  }
};

// 删除积分商品
exports.deletePointsProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    await db.execute("DELETE FROM points_products WHERE id = ?", [productId]);

    res.status(200).json({ message: "积分商品删除成功" });
  } catch (error) {
    console.error("删除积分商品失败:", error);
    res.status(500).json({ message: "删除积分商品失败" });
  }
};

// 获取所有积分兑换记录（管理员）
exports.getAllPointsExchanges = async (req, res) => {
  try {
    const [exchanges] = await db.execute(
      `SELECT e.id, e.user_id, e.product_id, e.points_cost, e.status, 
              e.exchange_time, e.completion_time,
              u.username, p.name as product_name
       FROM points_exchanges e
       JOIN users u ON e.user_id = u.id
       JOIN points_products p ON e.product_id = p.id
       ORDER BY e.exchange_time DESC`
    );

    res.status(200).json(exchanges);
  } catch (error) {
    console.error("获取积分兑换记录失败:", error);
    res.status(500).json({ message: "获取积分兑换记录失败" });
  }
};

// 更新兑换记录状态
exports.updatePointsExchangeStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const exchangeId = req.params.id;
    const { status } = req.body;

    await db.execute(
      `UPDATE points_exchanges 
       SET status = ?, 
           completion_time = ${status === 'completed' ? 'NOW()' : 'NULL'}
       WHERE id = ?`,
      [status, exchangeId]
    );

    res.status(200).json({ message: "兑换记录状态更新成功" });
  } catch (error) {
    console.error("更新兑换记录状态失败:", error);
    res.status(500).json({ message: "更新兑换记录状态失败" });
  }
};

// 评分贴分类管理
exports.createRatePostCategory = async (req, res) => {
  try {
    const { id, name, description, display_order } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({
        success: false,
        message: '分类ID和名称为必填项'
      });
    }
    
    // 插入分类数据
    await db.execute(
      `INSERT INTO rate_post_categories (id, name, description, display_order)
       VALUES (?, ?, ?, ?)`,
      [id, name, description || null, display_order || 0]
    );
    
    return res.status(201).json({
      success: true,
      message: '评分贴分类创建成功'
    });
  } catch (error) {
    console.error('创建评分贴分类失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: '分类ID已存在'
      });
    }
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateRatePostCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, display_order, is_active } = req.body;
    
    // 检查分类是否存在
    const [category] = await db.execute(
      'SELECT * FROM rate_post_categories WHERE id = ?',
      [id]
    );
    
    if (category.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评分贴分类不存在'
      });
    }
    
    // 更新分类
    await db.execute(
      `UPDATE rate_post_categories 
       SET name = ?, description = ?, display_order = ?, is_active = ?
       WHERE id = ?`,
      [
        name || category[0].name,
        description !== undefined ? description : category[0].description,
        display_order !== undefined ? display_order : category[0].display_order,
        is_active !== undefined ? is_active : category[0].is_active,
        id
      ]
    );
    
    return res.status(200).json({
      success: true,
      message: '评分贴分类更新成功'
    });
  } catch (error) {
    console.error('更新评分贴分类失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteRatePostCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查分类是否存在
    const [category] = await db.execute(
      'SELECT * FROM rate_post_categories WHERE id = ?',
      [id]
    );
    
    if (category.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评分贴分类不存在'
      });
    }
    
    // 检查该分类下是否有评分贴
    const [posts] = await db.execute(
      'SELECT COUNT(*) as count FROM rate_posts WHERE category = ?',
      [id]
    );
    
    if (posts[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '该分类下存在评分贴，无法删除'
      });
    }
    
    // 删除分类
    await db.execute(
      'DELETE FROM rate_post_categories WHERE id = ?',
      [id]
    );
    
    return res.status(200).json({
      success: true,
      message: '评分贴分类删除成功'
    });
  } catch (error) {
    console.error('删除评分贴分类失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 评分贴管理
exports.getRatePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    console.log('评分贴查询参数:', {
      page,
      limit,
      offset,
      search,
      category
    });
    
    let query = `
      SELECT 
        p.id, p.title, p.description, p.category, p.total_ratings, p.created_at,
        u.id as user_id, u.username as author_name,
        c.name as category_name
      FROM rate_posts p
      JOIN users u ON p.user_id = u.id
      JOIN rate_post_categories c ON p.category = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (category && category !== 'all') {
      query += ' AND p.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    console.log('评分贴SQL查询:', query);
    console.log('评分贴查询参数:', params);
    
    // 获取评分贴列表
    const [posts] = await db.execute(query, params);
    
    console.log('评分贴查询结果:', posts);
    
    // 获取总数
    let countQuery = `
      SELECT COUNT(*) as total
      FROM rate_posts p
      WHERE 1=1
    `;
    
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (category && category !== 'all') {
      countQuery += ' AND p.category = ?';
      countParams.push(category);
    }
    
    console.log('评分贴总数查询:', countQuery);
    console.log('评分贴总数查询参数:', countParams);
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    console.log('评分贴总数:', total);
    
    return res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取评分贴列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getRatePostDetail = async (req, res) => {
  try {
    const postId = req.params.id;
    
    // 获取评分贴基本信息
    const [postResult] = await db.execute(
      `SELECT 
        p.id, p.title, p.description, p.category, p.total_ratings, p.created_at,
        u.id as user_id, u.username as author_name,
        c.name as category_name
      FROM rate_posts p
      JOIN users u ON p.user_id = u.id
      JOIN rate_post_categories c ON p.category = c.id
      WHERE p.id = ?`,
      [postId]
    );
    
    if (postResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评分贴不存在'
      });
    }
    
    const post = postResult[0];
    
    // 获取评分选项
    const [options] = await db.execute(
      `SELECT 
        id, name, avatar, avg_score, ratings_count, created_at
      FROM rate_options
      WHERE post_id = ?
      ORDER BY id ASC`,
      [postId]
    );
    
    // 获取每个选项的评论
    for (const option of options) {
      const [comments] = await db.execute(
        `SELECT 
          rc.id, rc.content, rc.likes, rc.created_at,
          u.id as user_id, u.username, u.avatar as user_avatar,
          rr.score as rating
        FROM rate_comments rc
        JOIN users u ON rc.user_id = u.id
        LEFT JOIN rate_ratings rr ON rc.rating_id = rr.id
        WHERE rc.option_id = ?
        ORDER BY rc.created_at DESC`,
        [option.id]
      );
      
      option.comments = comments;
    }
    
    post.options = options;
    
    return res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('获取评分贴详情失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.createRatePost = async (req, res) => {
  try {
    const { title, description, category, options } = req.body;
    
    // 验证参数
    if (!title || !category || !options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: '标题、分类和选项为必填项'
      });
    }
    
    // 检查分类是否存在
    const [categoryExists] = await db.execute(
      'SELECT * FROM rate_post_categories WHERE id = ?',
      [category]
    );
    
    if (categoryExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评分贴分类不存在'
      });
    }
    
    // 创建评分贴
    await db.execute('START TRANSACTION');
    
    try {
      // 插入评分贴
      const [postResult] = await db.execute(
        `INSERT INTO rate_posts (title, description, category, user_id)
         VALUES (?, ?, ?, ?)`,
        [title, description || null, category, req.admin.id]
      );
      
      const postId = postResult.insertId;
      
      // 插入评分选项
      for (const option of options) {
        if (!option.name) {
          throw new Error('选项名称不能为空');
        }
        
        await db.execute(
          `INSERT INTO rate_options (post_id, name, avatar)
           VALUES (?, ?, ?)`,
          [postId, option.name, option.avatar || null]
        );
      }
      
      await db.execute('COMMIT');
      
      return res.status(201).json({
        success: true,
        data: {
          id: postId,
          message: '评分贴创建成功'
        }
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('创建评分贴失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建评分贴失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateRatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    // 检查评分贴是否存在
    const [postExists] = await db.execute(
      'SELECT * FROM rate_posts WHERE id = ?',
      [id]
    );
    
    if (postExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评分贴不存在'
      });
    }
    
    // 更新评分贴
    await db.execute(
      `UPDATE rate_posts 
       SET title = ?, description = ?
       WHERE id = ?`,
      [
        title || postExists[0].title,
        description !== undefined ? description : postExists[0].description,
        id
      ]
    );
    
    return res.status(200).json({
      success: true,
      message: '评分贴更新成功'
    });
  } catch (error) {
    console.error('更新评分贴失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteRatePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查评分贴是否存在
    const [postExists] = await db.execute(
      'SELECT * FROM rate_posts WHERE id = ?',
      [id]
    );
    
    if (postExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评分贴不存在'
      });
    }
    
    // 删除评分贴（会级联删除选项、评分和评论）
    await db.execute(
      'DELETE FROM rate_posts WHERE id = ?',
      [id]
    );
    
    return res.status(200).json({
      success: true,
      message: '评分贴删除成功'
    });
  } catch (error) {
    console.error('删除评分贴失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteRateOption = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查选项是否存在
    const [optionExists] = await db.execute(
      'SELECT * FROM rate_options WHERE id = ?',
      [id]
    );
    
    if (optionExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评分选项不存在'
      });
    }
    
    // 删除选项（会级联删除评分和评论）
    await db.execute(
      'DELETE FROM rate_options WHERE id = ?',
      [id]
    );
    
    return res.status(200).json({
      success: true,
      message: '评分选项删除成功'
    });
  } catch (error) {
    console.error('删除评分选项失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteRateComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查评论是否存在
    const [commentExists] = await db.execute(
      'SELECT * FROM rate_comments WHERE id = ?',
      [id]
    );
    
    if (commentExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 删除评论
    await db.execute(
      'DELETE FROM rate_comments WHERE id = ?',
      [id]
    );
    
    return res.status(200).json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  login: exports.login,
  getProfile: exports.getProfile,
  getAllPosts: exports.getAllPosts,
  getPostById: exports.getPostById,
  updatePost: exports.updatePost,
  deletePost: exports.deletePost,
  getFeedbacks: exports.getFeedbacks,
  updateFeedbackStatus: exports.updateFeedbackStatus,
  getAllNotes: exports.getAllNotes,
  createNote: exports.createNote,
  deleteNote: exports.deleteNote,
  getAppVersions: exports.getAppVersions,
  createAppVersion: exports.createAppVersion,
  updateAppVersion: exports.updateAppVersion,
  deleteAppVersion: exports.deleteAppVersion,
  getCategories: exports.getCategories,
  getCategoryById: exports.getCategoryById,
  createCategory: exports.createCategory,
  updateCategory: exports.updateCategory,
  deleteCategory: exports.deleteCategory,
  getAllTasks: exports.getAllTasks,
  getTaskById: exports.getTaskById,
  createTask: exports.createTask,
  updateTask: exports.updateTask,
  deleteTask: exports.deleteTask,
  updateSystemSetting: exports.updateSystemSetting,
  getSystemSetting: exports.getSystemSetting,
  getUserList: exports.getUserList,
  getUserById: exports.getUserById,
  updateUser: exports.updateUser,
  deleteUser: exports.deleteUser,
  getTasks: exports.getTasks,
  getDashboardData: exports.getDashboardData,
  createAdmin: exports.createAdmin,
  getAllAdmins: exports.getAllAdmins,
  getPendingPosts: exports.getPendingPosts,
  getPendingComments: exports.getPendingComments,
  getPendingNotes: exports.getPendingNotes,
  updatePostStatus: exports.updatePostStatus,
  updateCommentStatus: exports.updateCommentStatus,
  updateNoteStatus: exports.updateNoteStatus,
  getReports: exports.getReports,
  getReportDetails: exports.getReportDetails,
  updateReportStatus: exports.updateReportStatus,
  getAnnouncements: exports.getAnnouncements,
  getAnnouncementById: exports.getAnnouncementById,
  createAnnouncement: exports.createAnnouncement,
  updateAnnouncement: exports.updateAnnouncement,
  deleteAnnouncement: exports.deleteAnnouncement,
  togglePinPost: exports.togglePinPost,
  getUserTitle: exports.getUserTitle,
  updateUserTitle: exports.updateUserTitle,
  recalculateAllTitles: exports.recalculateAllTitles,
  getAllPointsProducts: exports.getAllPointsProducts,
  addPointsProduct: exports.addPointsProduct,
  updatePointsProduct: exports.updatePointsProduct,
  deletePointsProduct: exports.deletePointsProduct,
  getAllPointsExchanges: exports.getAllPointsExchanges,
  updatePointsExchangeStatus: exports.updatePointsExchangeStatus,
  createRatePostCategory: exports.createRatePostCategory,
  updateRatePostCategory: exports.updateRatePostCategory,
  deleteRatePostCategory: exports.deleteRatePostCategory,
  getRatePosts: exports.getRatePosts,
  getRatePostDetail: exports.getRatePostDetail,
  createRatePost: exports.createRatePost,
  updateRatePost: exports.updateRatePost,
  deleteRatePost: exports.deleteRatePost,
  deleteRateOption: exports.deleteRateOption,
  deleteRateComment: exports.deleteRateComment
}; 